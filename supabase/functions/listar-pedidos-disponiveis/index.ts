import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roleData, error: roleError } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'entregador')
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(JSON.stringify({ error: 'Only delivery drivers can access available orders' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: rotas, error: rotasError } = await adminClient
      .from('rotas_otimizadas')
      .select('pedidos_ids')
      .in('status', ['pendente', 'aguardando_entregador', 'aceita', 'em_andamento']);

    if (rotasError) {
      throw rotasError;
    }

    const pedidosEmRotas = new Set<string>();
    (rotas || []).forEach((rota: { pedidos_ids?: string[] | null }) => {
      rota.pedidos_ids?.forEach((pedidoId) => pedidosEmRotas.add(pedidoId));
    });

    const { data: pedidos, error: pedidosError } = await adminClient
      .from('pedidos')
      .select('id, endereco_entrega, valor_total, status_pedido, created_at, padaria_id, padarias(nome_padaria, endereco, coordenadas_lat, coordenadas_lng)')
      .is('entregador_id', null)
      .in('status_pedido', ['em_preparacao', 'pendente'])
      .order('created_at', { ascending: false });

    if (pedidosError) {
      throw pedidosError;
    }

    const pedidosDisponiveis = (pedidos || []).filter((pedido) => !pedidosEmRotas.has(pedido.id));

    return new Response(JSON.stringify({ pedidos: pedidosDisponiveis }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});