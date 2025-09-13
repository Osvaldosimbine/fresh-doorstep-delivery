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
  forma_pagamento: 'dinheiro' | 'cartao' | 'mbway';
  observacoes?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

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

      validatedProducts.push({
        produto_id: orderProduct.id,
        quantidade: orderProduct.quantidade,
        preco_unitario: orderProduct.preco_unitario,
        subtotal: subtotal,
        padaria_id: product.padaria_id
      });
    }

    // Validate business hours (server-side time check)
    const now = new Date();
    const currentHour = now.getHours();
    const isValidOrderTime = currentHour >= 6 && currentHour < 22; // 6 AM to 10 PM

    const status = isValidOrderTime ? 'em_processamento' : 'pendente';

    // Create order in transaction
    const { data: order, error: orderError } = await supabaseClient
      .from('pedidos')
      .insert({
        cliente_id: profile.id,
        padaria_id: validatedProducts[0].padaria_id, // Assuming single bakery per order
        valor_total: valorTotal,
        forma_pagamento: orderData.forma_pagamento,
        status_pedido: status,
        endereco_entrega: orderData.endereco_entrega,
        observacoes: orderData.observacoes || null
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

    // Create order items
    const orderItems = validatedProducts.map(item => ({
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

    // Update stock for each product
    for (const item of validatedProducts) {
      await supabaseClient
        .from('produtos')
        .update({ 
          estoque_atual: supabaseClient.rpc('decrement_stock', {
            product_id: item.produto_id,
            quantity: item.quantidade
          })
        })
        .eq('id', item.produto_id);
    }

    console.log(`Order ${order.id} created successfully for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        order_id: order.id,
        status: status,
        message: isValidOrderTime 
          ? 'Order placed successfully and will be processed immediately'
          : 'Order placed successfully and will be processed during business hours'
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