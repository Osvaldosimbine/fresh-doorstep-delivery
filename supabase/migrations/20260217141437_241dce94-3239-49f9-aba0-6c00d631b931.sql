-- Fix RLS policy on pagamentos_comissoes to reference profiles instead of usuarios
DROP POLICY IF EXISTS "Deliverers can view their payments" ON public.pagamentos_comissoes;

CREATE POLICY "Deliverers can view their payments"
ON public.pagamentos_comissoes
FOR SELECT
USING (
  entregador_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);