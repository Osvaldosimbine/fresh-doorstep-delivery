-- Add role column to profiles table for admin access control
ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'cliente' CHECK (role IN ('cliente', 'padaria', 'entregador', 'admin'));

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE user_id = user_uuid) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Update profiles policies to use proper role checking
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- Add admin-only policies for sensitive operations
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update any profile" ON public.profiles  
FOR UPDATE USING (public.is_admin());

-- Secure padarias table - only owners and admins can modify
DROP POLICY IF EXISTS "Bakery owners can update their bakeries" ON public.padarias;
CREATE POLICY "Bakery owners can update their bakeries" ON public.padarias
FOR UPDATE USING (
  id IN (
    SELECT p.id FROM public.padarias p 
    JOIN public.profiles pr ON pr.user_id = auth.uid() 
    WHERE pr.role = 'padaria' OR pr.role = 'admin'
  )
);

-- Secure order creation - only authenticated customers
DROP POLICY IF EXISTS "Users can create their own orders" ON public.pedidos;  
CREATE POLICY "Users can create their own orders" ON public.pedidos
FOR INSERT WITH CHECK (
  cliente_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (role = 'cliente' OR role = 'admin')
  )
);

-- Add order value validation trigger
CREATE OR REPLACE FUNCTION public.validate_order_value()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure order value is positive and reasonable
  IF NEW.valor_total <= 0 OR NEW.valor_total > 50000 THEN
    RAISE EXCEPTION 'Invalid order value: %', NEW.valor_total;
  END IF;
  
  -- Set order timestamp
  NEW.created_at = now();
  
  return NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER validate_order_before_insert
  BEFORE INSERT ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.validate_order_value();

-- Create audit log table for sensitive operations
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL, 
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
FOR SELECT USING (public.is_admin());