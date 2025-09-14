-- Add service fee fields to pedidos table
ALTER TABLE public.pedidos 
ADD COLUMN taxa_servico_total DECIMAL(10,2) DEFAULT 0.00;

ALTER TABLE public.pedidos 
ADD COLUMN localizacao_entrega TEXT;

-- Add distance column to store delivery distance for analytics
ALTER TABLE public.pedidos 
ADD COLUMN distancia_km DECIMAL(5,2);

-- Add constraint to ensure service fee is not negative
ALTER TABLE public.pedidos 
ADD CONSTRAINT check_taxa_servico_positiva CHECK (taxa_servico_total >= 0);

-- Update the validate_order_value function to include service fees
CREATE OR REPLACE FUNCTION public.validate_order_value()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Ensure order value is positive and reasonable (including service fees)
  IF (NEW.valor_total + COALESCE(NEW.taxa_servico_total, 0)) <= 0 OR 
     (NEW.valor_total + COALESCE(NEW.taxa_servico_total, 0)) > 50000 THEN
    RAISE EXCEPTION 'Invalid order total value: %', (NEW.valor_total + COALESCE(NEW.taxa_servico_total, 0));
  END IF;
  
  -- Ensure service fee is reasonable (not more than 50% of order value)
  IF NEW.taxa_servico_total > (NEW.valor_total * 0.5) THEN
    RAISE EXCEPTION 'Service fee too high: %', NEW.taxa_servico_total;
  END IF;
  
  -- Set order timestamp
  NEW.created_at = now();
  
  return NEW;
END;
$function$