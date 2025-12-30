-- 1. Políticas RLS para padarias verem e atualizarem pedidos
CREATE POLICY "Bakeries can view their orders" 
ON pedidos 
FOR SELECT 
USING (
  padaria_id IN (
    SELECT id FROM padarias WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Bakeries can update their orders" 
ON pedidos 
FOR UPDATE 
USING (
  padaria_id IN (
    SELECT id FROM padarias WHERE user_id = auth.uid()
  )
);

-- 2. Políticas RLS para padarias verem itens de pedidos
CREATE POLICY "Bakeries can view order items" 
ON itens_pedido 
FOR SELECT 
USING (
  pedido_id IN (
    SELECT p.id FROM pedidos p 
    WHERE p.padaria_id IN (
      SELECT id FROM padarias WHERE user_id = auth.uid()
    )
  )
);

-- 3. Configurar Realtime para pedidos
ALTER TABLE pedidos REPLICA IDENTITY FULL;

-- 4. Adicionar tabela pedidos à publicação realtime (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'pedidos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
  END IF;
END $$;