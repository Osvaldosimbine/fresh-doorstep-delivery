import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderRequest {
  produtos: Array<{
    id: string;
    quantidade: number;
    preco_unitario: number;
  }>;
  endereco_entrega: string;
  forma_pagamento: 'dinheiro' | 'mpesa' | 'emola' | 'mkesh';
  observacoes?: string;
  taxa_servico_total?: number;
  localizacao_entrega?: string;
  horario_agendado?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get authenticated user with better error handling
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    console.log('User from auth:', user?.id, 'Auth error:', authError?.message);

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user profile and validate role
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found:', profileError);
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (profile.role !== 'cliente' && profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Only customers can place orders' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const orderData: OrderRequest = await req.json();

    // Validate order data
    if (!orderData.produtos || orderData.produtos.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Order must contain at least one product' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate products exist and prices
    const productIds = orderData.produtos.map(p => p.id);
    const { data: products, error: productsError } = await supabaseClient
      .from('produtos')
      .select('id, preco, estoque_atual, disponivel, padaria_id')
      .in('id', productIds);

    if (productsError || !products) {
      console.error('Error fetching products:', productsError);
      return new Response(
        JSON.stringify({ error: 'Error validating products' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate each product and calculate total
    let valorTotal = 0;
    let totalQuantidade = 0;
    const validatedProducts = [];

    for (const orderProduct of orderData.produtos) {
      const product = products.find(p => p.id === orderProduct.id);
      
      if (!product) {
        return new Response(
          JSON.stringify({ error: `Product ${orderProduct.id} not found` }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (!product.disponivel) {
        return new Response(
          JSON.stringify({ error: `Product ${orderProduct.id} is not available` }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (product.estoque_atual < orderProduct.quantidade) {
        return new Response(
          JSON.stringify({ error: `Insufficient stock for product ${orderProduct.id}` }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Validate price matches (prevent client-side manipulation)
      if (Math.abs(product.preco - orderProduct.preco_unitario) > 0.01) {
        return new Response(
          JSON.stringify({ error: `Price mismatch for product ${orderProduct.id}` }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const subtotal = orderProduct.quantidade * orderProduct.preco_unitario;
      valorTotal += subtotal;
      totalQuantidade += orderProduct.quantidade;

      validatedProducts.push({
        produto_id: orderProduct.id,
        quantidade: orderProduct.quantidade,
        preco_unitario: orderProduct.preco_unitario,
        subtotal: subtotal,
        padaria_id: product.padaria_id
      });
    }

    // Validate service fee (simple validation based on quantity - could be enhanced with distance)
    const expectedMinServiceFee = totalQuantidade * 2; // Minimum 2 MZN per item
    const expectedMaxServiceFee = totalQuantidade * 6; // Maximum 6 MZN per item
    const providedServiceFee = orderData.taxa_servico_total || 0;

    if (providedServiceFee < 0 || providedServiceFee > expectedMaxServiceFee) {
      return new Response(
        JSON.stringify({ error: `Invalid service fee: ${providedServiceFee}. Expected between ${expectedMinServiceFee} and ${expectedMaxServiceFee} MZN` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Pedidos são aceites automaticamente - entram directo em preparação
    // A padaria recebe notificação via Realtime mas não precisa confirmar
    const status = 'em_preparacao';

    // Create order in transaction
    const { data: order, error: orderError } = await supabaseClient
      .from('pedidos')
      .insert({
        cliente_id: profile.id,
        padaria_id: validatedProducts[0].padaria_id, // Assuming single bakery per order
        valor_total: valorTotal,
        taxa_servico_total: providedServiceFee,
        localizacao_entrega: orderData.localizacao_entrega,
        forma_pagamento: orderData.forma_pagamento,
        status_pedido: status,
        endereco_entrega: orderData.endereco_entrega,
        observacoes: orderData.observacoes || null,
        distancia_km: 5.0, // Default distance, could be calculated from coordinates
        horario_agendado: orderData.horario_agendado || null
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create order items (exclude padaria_id - not a column in itens_pedido)
    const orderItems = validatedProducts.map(({ padaria_id, ...item }) => ({
      ...item,
      pedido_id: order.id
    }));

    const { error: itemsError } = await supabaseClient
      .from('itens_pedido')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Rollback order creation if items fail
      await supabaseClient.from('pedidos').delete().eq('id', order.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create order items' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update stock for each product (direct update)
    for (const item of validatedProducts) {
      try {
        // Get current stock first
        const { data: currentProduct, error: fetchError } = await supabaseClient
          .from('produtos')
          .select('estoque_atual')
          .eq('id', item.produto_id)
          .single();

        if (fetchError || !currentProduct) {
          console.error('Error fetching current stock:', fetchError);
          continue;
        }

        const newStock = Math.max(0, currentProduct.estoque_atual - item.quantidade);

        const { error: stockError } = await supabaseClient
          .from('produtos')
          .update({ estoque_atual: newStock })
          .eq('id', item.produto_id);
          
        if (stockError) {
          console.error('Error updating stock for product:', item.produto_id, stockError);
        } else {
          console.log(`Updated stock for product ${item.produto_id}: ${currentProduct.estoque_atual} -> ${newStock}`);
        }
      } catch (error) {
        console.error('Error in stock update process:', error);
      }
    }

    console.log(`Order ${order.id} created successfully for user ${user.id}`);

    const message = orderData.horario_agendado 
      ? `Pedido agendado com sucesso para ${orderData.horario_agendado}`
      : 'Pedido realizado com sucesso';

    return new Response(
      JSON.stringify({ 
        success: true, 
        order_id: order.id,
        status: status,
        valor_produtos: valorTotal,
        taxa_servico: providedServiceFee,
        valor_total_final: valorTotal + providedServiceFee,
        horario_agendado: orderData.horario_agendado,
        message: message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error processing order:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});