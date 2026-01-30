-- Fix foreign key constraint: pedidos.cliente_id should reference profiles.id, not usuarios.id
-- This aligns with the RLS policies which use the profiles table

-- Drop the existing constraint that references usuarios
ALTER TABLE public.pedidos 
DROP CONSTRAINT IF EXISTS pedidos_cliente_id_fkey;

-- Add the new constraint that references profiles
ALTER TABLE public.pedidos 
ADD CONSTRAINT pedidos_cliente_id_fkey 
FOREIGN KEY (cliente_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;