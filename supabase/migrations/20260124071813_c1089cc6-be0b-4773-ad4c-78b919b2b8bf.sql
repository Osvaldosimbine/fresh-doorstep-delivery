-- Corrigir política INSERT de itens_pedido (usa usuarios -> profiles)
DROP POLICY IF EXISTS "Users can create their order items" ON itens_pedido;
CREATE POLICY "Users can create their order items" ON itens_pedido
FOR INSERT TO public
WITH CHECK (
  pedido_id IN (
    SELECT pedidos.id FROM pedidos
    WHERE pedidos.cliente_id IN (
      SELECT profiles.id FROM profiles 
      WHERE profiles.user_id = auth.uid()
    )
  )
);

-- Corrigir política SELECT de itens_pedido (usa usuarios -> profiles)
DROP POLICY IF EXISTS "Users can view their order items" ON itens_pedido;
CREATE POLICY "Users can view their order items" ON itens_pedido
FOR SELECT TO public
USING (
  pedido_id IN (
    SELECT pedidos.id FROM pedidos
    WHERE pedidos.cliente_id IN (
      SELECT profiles.id FROM profiles 
      WHERE profiles.user_id = auth.uid()
    )
  )
);

-- Corrigir política SELECT de pedidos (usa usuarios -> profiles)
DROP POLICY IF EXISTS "Users can view their own orders" ON pedidos;
CREATE POLICY "Users can view their own orders" ON pedidos
FOR SELECT TO public
USING (
  cliente_id IN (
    SELECT profiles.id FROM profiles 
    WHERE profiles.user_id = auth.uid()
  )
);

-- Corrigir política UPDATE de pedidos (usa usuarios -> profiles)
DROP POLICY IF EXISTS "Users can update their own orders" ON pedidos;
CREATE POLICY "Users can update their own orders" ON pedidos
FOR UPDATE TO public
USING (
  cliente_id IN (
    SELECT profiles.id FROM profiles 
    WHERE profiles.user_id = auth.uid()
  )
);