-- CORREÇÃO 1: Restringir acesso à tabela usuarios (dados duplicados de profiles)
-- Adicionar política para admins verem todos os registros
DROP POLICY IF EXISTS "Users can view their own profile" ON usuarios;
CREATE POLICY "Users can view their own profile" ON usuarios
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- CORREÇÃO 2: Restringir entregas - entregadores só veem entregas atribuídas a eles
DROP POLICY IF EXISTS "Deliverers can view their deliveries" ON entregas;
CREATE POLICY "Deliverers can view their deliveries" ON entregas
FOR SELECT TO authenticated
USING (
  entregador_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Deliverers can update their deliveries" ON entregas;
CREATE POLICY "Deliverers can update their deliveries" ON entregas
FOR UPDATE TO authenticated
USING (
  entregador_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);

-- CORREÇÃO 3: Restringir pedidos - entregadores só veem pedidos atribuídos a eles
CREATE POLICY "Deliverers can view their assigned orders" ON pedidos
FOR SELECT TO authenticated
USING (
  entregador_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);

-- CORREÇÃO 4: Restringir itens_pedido para entregadores atribuídos
CREATE POLICY "Deliverers can view items of their orders" ON itens_pedido
FOR SELECT TO authenticated
USING (
  pedido_id IN (
    SELECT p.id FROM pedidos p
    WHERE p.entregador_id IN (
      SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
    )
  )
);