import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PedidosPorPadaria {
  [padariaId: string]: {
    nome_padaria: string;
    pedidos: string[];
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔍 Buscando pedidos prontos para entrega...');

    // 1. Buscar pedidos que estão "em_preparacao" e foram criados há mais de 30 minutos
    // ou pedidos com horario_agendado que já passou
    const agora = new Date();
    const trintaMinutosAtras = new Date(agora.getTime() - 30 * 60 * 1000);

    const { data: pedidosProntos, error: pedidosError } = await supabaseClient
      .from('pedidos')
      .select(`
        id,
        padaria_id,
        created_at,
        horario_agendado,
        endereco_entrega,
        localizacao_entrega,
        padarias(
          id,
          nome_padaria,
          coordenadas_lat,
          coordenadas_lng
        )
      `)
      .eq('status_pedido', 'em_preparacao')
      .is('entregador_id', null)
      .or(`created_at.lt.${trintaMinutosAtras.toISOString()},horario_agendado.lte.${agora.toISOString()}`);

    if (pedidosError) {
      throw new Error(`Erro ao buscar pedidos: ${pedidosError.message}`);
    }

    if (!pedidosProntos || pedidosProntos.length === 0) {
      console.log('✅ Nenhum pedido pronto para processar');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhum pedido pronto para processar',
          pedidos_processados: 0,
          rotas_criadas: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`📦 Encontrados ${pedidosProntos.length} pedidos prontos`);

    // 2. Verificar se pedidos já não estão em alguma rota existente
    const pedidosIds = pedidosProntos.map((p: any) => p.id);
    const { data: rotasExistentes } = await supabaseClient
      .from('rotas_otimizadas')
      .select('pedidos_ids')
      .in('status', ['pendente', 'aceita', 'em_andamento']);

    const pedidosEmRotas = new Set<string>();
    if (rotasExistentes) {
      rotasExistentes.forEach((rota: any) => {
        rota.pedidos_ids?.forEach((id: string) => pedidosEmRotas.add(id));
      });
    }

    // Filtrar pedidos que não estão em rotas
    const pedidosDisponiveis = pedidosProntos.filter(
      (p: any) => !pedidosEmRotas.has(p.id)
    );

    if (pedidosDisponiveis.length === 0) {
      console.log('✅ Todos os pedidos já estão em rotas');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Todos os pedidos já estão em rotas',
          pedidos_processados: 0,
          rotas_criadas: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`🎯 ${pedidosDisponiveis.length} pedidos disponíveis para criar rotas`);

    // 3. Agrupar pedidos por padaria
    const pedidosPorPadaria: PedidosPorPadaria = {};

    pedidosDisponiveis.forEach((pedido: any) => {
      if (!pedido.padaria_id) return;

      // Verificar se o pedido tem coordenadas válidas
      if (!pedido.localizacao_entrega) {
        console.warn(`⚠️ Pedido ${pedido.id} sem localização de entrega`);
        return;
      }

      // Verificar se a padaria tem coordenadas
      if (!pedido.padarias?.coordenadas_lat || !pedido.padarias?.coordenadas_lng) {
        console.warn(`⚠️ Padaria ${pedido.padaria_id} sem coordenadas`);
        return;
      }

      if (!pedidosPorPadaria[pedido.padaria_id]) {
        pedidosPorPadaria[pedido.padaria_id] = {
          nome_padaria: pedido.padarias.nome_padaria,
          pedidos: [],
        };
      }

      pedidosPorPadaria[pedido.padaria_id].pedidos.push(pedido.id);
    });

    // 4. Criar rotas para cada padaria (apenas se tiver pelo menos 2 pedidos)
    const rotasCriadas: string[] = [];
    const erros: string[] = [];

    for (const [padariaId, dados] of Object.entries(pedidosPorPadaria)) {
      // Só criar rota se tiver pelo menos 2 pedidos
      if (dados.pedidos.length < 2) {
        console.log(`⏳ Padaria ${dados.nome_padaria}: apenas ${dados.pedidos.length} pedido(s), aguardando mais pedidos`);
        continue;
      }

      console.log(`🚀 Criando rota para ${dados.nome_padaria} com ${dados.pedidos.length} pedidos`);

      try {
        // Chamar a função criar-rota-otimizada
        const response = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/criar-rota-otimizada`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              padaria_id: padariaId,
              pedidos_ids: dados.pedidos,
            }),
          }
        );

        const resultado = await response.json();

        if (resultado.success) {
          rotasCriadas.push(resultado.rota_id);
          console.log(`✅ Rota criada com sucesso: ${resultado.rota_id}`);
          
          // Atualizar status dos pedidos para "a_caminho"
          await supabaseClient
            .from('pedidos')
            .update({ status_pedido: 'a_caminho' })
            .in('id', dados.pedidos);
        } else {
          erros.push(`Padaria ${dados.nome_padaria}: ${resultado.error}`);
          console.error(`❌ Erro ao criar rota: ${resultado.error}`);
        }
      } catch (error) {
        erros.push(`Padaria ${dados.nome_padaria}: ${error.message}`);
        console.error(`❌ Erro ao criar rota para ${dados.nome_padaria}:`, error);
      }
    }

    const resultado = {
      success: true,
      message: `Processamento concluído`,
      pedidos_encontrados: pedidosProntos.length,
      pedidos_disponiveis: pedidosDisponiveis.length,
      padarias_processadas: Object.keys(pedidosPorPadaria).length,
      rotas_criadas: rotasCriadas.length,
      rotas_ids: rotasCriadas,
      erros: erros.length > 0 ? erros : undefined,
    };

    console.log('📊 Resultado final:', resultado);

    return new Response(
      JSON.stringify(resultado),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Erro na função processar-pedidos-prontos:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
