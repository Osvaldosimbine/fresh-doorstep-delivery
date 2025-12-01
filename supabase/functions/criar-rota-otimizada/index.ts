import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Coordenadas {
  lat: number;
  lng: number;
}

interface Paragem {
  id: string;
  tipo: 'recolha' | 'entrega';
  local: string;
  endereco: string;
  coordenadas: Coordenadas;
  pedido_id?: string;
  itens?: string;
  observacoes?: string;
}

// Calcula distância entre dois pontos usando fórmula de Haversine (em km)
function calcularDistancia(coord1: Coordenadas, coord2: Coordenadas): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Algoritmo Nearest Neighbor para otimizar rota
function otimizarRota(inicio: Paragem, destinos: Paragem[]): { ordem: Paragem[], distanciaTotal: number } {
  const rota: Paragem[] = [inicio];
  const naoVisitados = [...destinos];
  let pontoAtual = inicio;
  let distanciaTotal = 0;

  while (naoVisitados.length > 0) {
    let maisProximo: Paragem | null = null;
    let menorDistancia = Infinity;
    let indiceMaisProximo = -1;

    // Encontra o ponto não visitado mais próximo
    naoVisitados.forEach((destino, index) => {
      const distancia = calcularDistancia(pontoAtual.coordenadas, destino.coordenadas);
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        maisProximo = destino;
        indiceMaisProximo = index;
      }
    });

    if (maisProximo) {
      rota.push(maisProximo);
      distanciaTotal += menorDistancia;
      pontoAtual = maisProximo;
      naoVisitados.splice(indiceMaisProximo, 1);
    }
  }

  return { ordem: rota, distanciaTotal };
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

    const { padaria_id, pedidos_ids } = await req.json();

    if (!padaria_id || !pedidos_ids || pedidos_ids.length === 0) {
      throw new Error('padaria_id e pedidos_ids são obrigatórios');
    }

    console.log(`Criando rota para padaria ${padaria_id} com ${pedidos_ids.length} pedidos`);

    // 1. Buscar dados da padaria
    const { data: padaria, error: padariaError } = await supabaseClient
      .from('padarias')
      .select('id, nome_padaria, endereco, coordenadas_lat, coordenadas_lng')
      .eq('id', padaria_id)
      .single();

    if (padariaError || !padaria) {
      throw new Error(`Padaria não encontrada: ${padariaError?.message}`);
    }

    if (!padaria.coordenadas_lat || !padaria.coordenadas_lng) {
      throw new Error('Padaria não possui coordenadas configuradas');
    }

    // 2. Buscar dados dos pedidos
    const { data: pedidos, error: pedidosError } = await supabaseClient
      .from('pedidos')
      .select(`
        id, 
        endereco_entrega, 
        observacoes,
        localizacao_entrega,
        itens_pedido(
          quantidade,
          produtos(nome_produto)
        )
      `)
      .in('id', pedidos_ids);

    if (pedidosError || !pedidos || pedidos.length === 0) {
      throw new Error(`Pedidos não encontrados: ${pedidosError?.message}`);
    }

    // 3. Preparar ponto de partida (padaria)
    const pontoPartida: Paragem = {
      id: padaria.id,
      tipo: 'recolha',
      local: padaria.nome_padaria,
      endereco: padaria.endereco,
      coordenadas: {
        lat: Number(padaria.coordenadas_lat),
        lng: Number(padaria.coordenadas_lng),
      },
    };

    // 4. Preparar destinos (clientes)
    const destinos: Paragem[] = pedidos.map((pedido: any) => {
      // Parse localizacao_entrega se for string JSON
      let coordenadas = { lat: 0, lng: 0 };
      if (pedido.localizacao_entrega) {
        try {
          const loc = typeof pedido.localizacao_entrega === 'string' 
            ? JSON.parse(pedido.localizacao_entrega)
            : pedido.localizacao_entrega;
          coordenadas = { lat: Number(loc.lat), lng: Number(loc.lng) };
        } catch (e) {
          console.error(`Erro ao parsear localização do pedido ${pedido.id}:`, e);
        }
      }

      // Criar descrição dos itens
      const itens = pedido.itens_pedido
        ?.map((item: any) => `${item.quantidade}x ${item.produtos?.nome_produto}`)
        .join(', ') || 'Sem itens';

      return {
        id: pedido.id,
        tipo: 'entrega',
        local: `Cliente ${pedido.id.substring(0, 8)}`,
        endereco: pedido.endereco_entrega,
        coordenadas,
        pedido_id: pedido.id,
        itens,
        observacoes: pedido.observacoes,
      };
    });

    // Verificar se todos os destinos têm coordenadas válidas
    const destinosSemCoordenadas = destinos.filter(d => d.coordenadas.lat === 0 || d.coordenadas.lng === 0);
    if (destinosSemCoordenadas.length > 0) {
      console.warn(`${destinosSemCoordenadas.length} destinos sem coordenadas válidas`);
    }

    // 5. Otimizar rota usando Nearest Neighbor
    const { ordem, distanciaTotal } = otimizarRota(pontoPartida, destinos);

    // 6. Calcular tempo estimado (assume velocidade média de 30 km/h + 5 min por parada)
    const tempoViagem = (distanciaTotal / 30) * 60; // em minutos
    const tempoParadas = (ordem.length - 1) * 5; // 5 min por parada
    const tempoEstimado = Math.round(tempoViagem + tempoParadas);

    // 7. Formatar ordem de paragens para JSON
    const ordemParagens = ordem.map((paragem, index) => ({
      ordem: index + 1,
      tipo: paragem.tipo,
      local: paragem.local,
      endereco: paragem.endereco,
      lat: paragem.coordenadas.lat,
      lng: paragem.coordenadas.lng,
      pedido_id: paragem.pedido_id,
      itens: paragem.itens,
      observacoes: paragem.observacoes,
      concluida: false,
    }));

    // 8. Buscar entregador disponível mais próximo
    const { data: entregadoresDisponiveis } = await supabaseClient
      .from('entregador_status')
      .select('entregador_id, coordenadas_lat, coordenadas_lng')
      .eq('disponivel', true)
      .not('coordenadas_lat', 'is', null)
      .not('coordenadas_lng', 'is', null);

    let entregadorSelecionado = null;
    if (entregadoresDisponiveis && entregadoresDisponiveis.length > 0) {
      // Encontrar o mais próximo da padaria
      let menorDistancia = Infinity;
      for (const entregador of entregadoresDisponiveis) {
        const distancia = calcularDistancia(
          pontoPartida.coordenadas,
          { lat: Number(entregador.coordenadas_lat), lng: Number(entregador.coordenadas_lng) }
        );
        if (distancia < menorDistancia) {
          menorDistancia = distancia;
          entregadorSelecionado = entregador.entregador_id;
        }
      }
    }

    // 9. Criar registro de rota otimizada
    const { data: rota, error: rotaError } = await supabaseClient
      .from('rotas_otimizadas')
      .insert({
        padaria_id,
        entregador_id: entregadorSelecionado,
        pedidos_ids,
        ordem_paragens: ordemParagens,
        distancia_total_km: Math.round(distanciaTotal * 100) / 100,
        tempo_estimado_minutos: tempoEstimado,
        status: entregadorSelecionado ? 'pendente' : 'aguardando_entregador',
      })
      .select()
      .single();

    if (rotaError) {
      throw new Error(`Erro ao criar rota: ${rotaError.message}`);
    }

    console.log(`Rota criada com sucesso: ${rota.id}`);
    console.log(`Distância total: ${distanciaTotal.toFixed(2)} km`);
    console.log(`Tempo estimado: ${tempoEstimado} minutos`);
    console.log(`Entregador atribuído: ${entregadorSelecionado || 'Nenhum disponível'}`);

    return new Response(
      JSON.stringify({
        success: true,
        rota_id: rota.id,
        entregador_id: entregadorSelecionado,
        distancia_total_km: Math.round(distanciaTotal * 100) / 100,
        tempo_estimado_minutos: tempoEstimado,
        numero_paragens: ordem.length,
        ordem_paragens: ordemParagens,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro na função criar-rota-otimizada:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
