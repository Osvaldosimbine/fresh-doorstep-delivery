
-- Fix: Remove the overly permissive INSERT policy on rotas_otimizadas
-- The edge function uses service_role key which bypasses RLS, so regular users should never be able to insert directly.
DROP POLICY IF EXISTS "Authenticated system can create routes" ON public.rotas_otimizadas;

-- Only admins can create routes directly (system uses service_role which bypasses RLS)
CREATE POLICY "Only admins can create routes"
ON public.rotas_otimizadas
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
