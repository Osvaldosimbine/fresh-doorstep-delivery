-- Permitir que padarias insiram seus próprios produtos
CREATE POLICY "Bakeries can insert their own products"
ON public.produtos
FOR INSERT
WITH CHECK (
  padaria_id IN (
    SELECT id FROM padarias WHERE user_id = auth.uid()
  )
);

-- Permitir que padarias atualizem seus próprios produtos
CREATE POLICY "Bakeries can update their own products"
ON public.produtos
FOR UPDATE
USING (
  padaria_id IN (
    SELECT id FROM padarias WHERE user_id = auth.uid()
  )
);

-- Permitir que padarias deletem seus próprios produtos
CREATE POLICY "Bakeries can delete their own products"
ON public.produtos
FOR DELETE
USING (
  padaria_id IN (
    SELECT id FROM padarias WHERE user_id = auth.uid()
  )
);

-- Permitir que padarias vejam seus próprios produtos (incluindo inativos)
CREATE POLICY "Bakeries can view their own products"
ON public.produtos
FOR SELECT
USING (
  padaria_id IN (
    SELECT id FROM padarias WHERE user_id = auth.uid()
  )
);