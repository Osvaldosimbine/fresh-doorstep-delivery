-- MIGRAÇÃO: Converter todas as políticas RLS para TO authenticated

-- ============================================
-- TABELA: padarias
-- ============================================
DROP POLICY IF EXISTS "Anyone can view active bakeries" ON padarias;
CREATE POLICY "Authenticated users can view active bakeries" ON padarias
FOR SELECT TO authenticated
USING (status_ativa = true);

DROP POLICY IF EXISTS "Bakery owners can view their own bakery" ON padarias;
CREATE POLICY "Bakery owners can view their own bakery" ON padarias
FOR SELECT TO authenticated
USING (
  (user_id = auth.uid()) OR 
  (status_ativa = true) OR 
  has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Authenticated users can register bakeries" ON padarias;
CREATE POLICY "Authenticated users can register bakeries" ON padarias
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Bakery owners can update their bakeries" ON padarias;
CREATE POLICY "Bakery owners can update their bakeries" ON padarias
FOR UPDATE TO authenticated
USING (
  (user_id = auth.uid()) OR has_role(auth.uid(), 'admin')
);

-- ============================================
-- TABELA: produtos
-- ============================================
DROP POLICY IF EXISTS "Anyone can view available products" ON produtos;
CREATE POLICY "Authenticated users can view available products" ON produtos
FOR SELECT TO authenticated
USING (disponivel = true);

DROP POLICY IF EXISTS "Bakeries can view their own products" ON produtos;
CREATE POLICY "Bakeries can view their own products" ON produtos
FOR SELECT TO authenticated
USING (
  padaria_id IN (
    SELECT padarias.id FROM padarias WHERE padarias.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Bakeries can insert their own products" ON produtos;
CREATE POLICY "Bakeries can insert their own products" ON produtos
FOR INSERT TO authenticated
WITH CHECK (
  padaria_id IN (
    SELECT padarias.id FROM padarias WHERE padarias.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Bakeries can update their own products" ON produtos;
CREATE POLICY "Bakeries can update their own products" ON produtos
FOR UPDATE TO authenticated
USING (
  padaria_id IN (
    SELECT padarias.id FROM padarias WHERE padarias.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Bakeries can delete their own products" ON produtos;
CREATE POLICY "Bakeries can delete their own products" ON produtos
FOR DELETE TO authenticated
USING (
  padaria_id IN (
    SELECT padarias.id FROM padarias WHERE padarias.user_id = auth.uid()
  )
);

-- ============================================
-- TABELA: rotas_otimizadas
-- ============================================
DROP POLICY IF EXISTS "System can create routes" ON rotas_otimizadas;
CREATE POLICY "Authenticated system can create routes" ON rotas_otimizadas
FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Drivers can view their assigned routes" ON rotas_otimizadas;
CREATE POLICY "Drivers can view their assigned routes" ON rotas_otimizadas
FOR SELECT TO authenticated
USING (
  (entregador_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
  )) OR (entregador_id IS NULL)
);

DROP POLICY IF EXISTS "Drivers can update their route status" ON rotas_otimizadas;
CREATE POLICY "Drivers can update their route status" ON rotas_otimizadas
FOR UPDATE TO authenticated
USING (
  entregador_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage all routes" ON rotas_otimizadas;
CREATE POLICY "Admins can manage all routes" ON rotas_otimizadas
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- TABELA: pedidos
-- ============================================
DROP POLICY IF EXISTS "Users can create their own orders" ON pedidos;
CREATE POLICY "Users can create their own orders" ON pedidos
FOR INSERT TO authenticated
WITH CHECK (
  cliente_id IN (
    SELECT profiles.id FROM profiles 
    WHERE (profiles.user_id = auth.uid()) AND 
          ((profiles.role = 'cliente') OR (profiles.role = 'admin'))
  )
);

DROP POLICY IF EXISTS "Users can view their own orders" ON pedidos;
CREATE POLICY "Users can view their own orders" ON pedidos
FOR SELECT TO authenticated
USING (
  cliente_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update their own orders" ON pedidos;
CREATE POLICY "Users can update their own orders" ON pedidos
FOR UPDATE TO authenticated
USING (
  cliente_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Bakeries can view their orders" ON pedidos;
CREATE POLICY "Bakeries can view their orders" ON pedidos
FOR SELECT TO authenticated
USING (
  padaria_id IN (
    SELECT padarias.id FROM padarias WHERE padarias.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Bakeries can update their orders" ON pedidos;
CREATE POLICY "Bakeries can update their orders" ON pedidos
FOR UPDATE TO authenticated
USING (
  padaria_id IN (
    SELECT padarias.id FROM padarias WHERE padarias.user_id = auth.uid()
  )
);

-- ============================================
-- TABELA: itens_pedido
-- ============================================
DROP POLICY IF EXISTS "Users can create their order items" ON itens_pedido;
CREATE POLICY "Users can create their order items" ON itens_pedido
FOR INSERT TO authenticated
WITH CHECK (
  pedido_id IN (
    SELECT pedidos.id FROM pedidos
    WHERE pedidos.cliente_id IN (
      SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can view their order items" ON itens_pedido;
CREATE POLICY "Users can view their order items" ON itens_pedido
FOR SELECT TO authenticated
USING (
  pedido_id IN (
    SELECT pedidos.id FROM pedidos
    WHERE pedidos.cliente_id IN (
      SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Bakeries can view order items" ON itens_pedido;
CREATE POLICY "Bakeries can view order items" ON itens_pedido
FOR SELECT TO authenticated
USING (
  pedido_id IN (
    SELECT p.id FROM pedidos p
    WHERE p.padaria_id IN (
      SELECT padarias.id FROM padarias WHERE padarias.user_id = auth.uid()
    )
  )
);

-- ============================================
-- TABELA: profiles
-- ============================================
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
CREATE POLICY "Users can create their own profile" ON profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
FOR SELECT TO authenticated
USING ((auth.uid() = user_id) OR is_admin());

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile" ON profiles
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- TABELA: usuarios
-- ============================================
DROP POLICY IF EXISTS "Users can view their own profile" ON usuarios;
CREATE POLICY "Users can view their own profile" ON usuarios
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON usuarios;
CREATE POLICY "Users can insert their own profile" ON usuarios
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON usuarios;
CREATE POLICY "Users can update their own profile" ON usuarios
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- TABELA: entregador_status
-- ============================================
DROP POLICY IF EXISTS "Drivers can view their own status" ON entregador_status;
CREATE POLICY "Drivers can view their own status" ON entregador_status
FOR SELECT TO authenticated
USING (
  entregador_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Drivers can insert their own status" ON entregador_status;
CREATE POLICY "Drivers can insert their own status" ON entregador_status
FOR INSERT TO authenticated
WITH CHECK (
  entregador_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Drivers can update their own status" ON entregador_status;
CREATE POLICY "Drivers can update their own status" ON entregador_status
FOR UPDATE TO authenticated
USING (
  entregador_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can view all driver status" ON entregador_status;
CREATE POLICY "Admins can view all driver status" ON entregador_status
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- TABELA: user_roles
-- ============================================
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
CREATE POLICY "Users can view their own roles" ON user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
CREATE POLICY "Admins can view all roles" ON user_roles
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- TABELA: pagamentos_comissoes
-- ============================================
DROP POLICY IF EXISTS "Deliverers can view their payments" ON pagamentos_comissoes;
CREATE POLICY "Deliverers can view their payments" ON pagamentos_comissoes
FOR SELECT TO authenticated
USING (
  entregador_id IN (
    SELECT usuarios.id FROM usuarios WHERE usuarios.user_id = auth.uid()
  )
);

-- ============================================
-- TABELA: audit_logs
-- ============================================
DROP POLICY IF EXISTS "Only admins can view audit logs" ON audit_logs;
CREATE POLICY "Only admins can view audit logs" ON audit_logs
FOR SELECT TO authenticated
USING (is_admin());