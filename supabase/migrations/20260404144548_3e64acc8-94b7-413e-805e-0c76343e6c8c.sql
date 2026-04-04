CREATE OR REPLACE FUNCTION public.validate_order_value()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF (NEW.valor_total + COALESCE(NEW.taxa_servico_total, 0)) <= 0 OR 
     (NEW.valor_total + COALESCE(NEW.taxa_servico_total, 0)) > 50000 THEN
    RAISE EXCEPTION 'Invalid order total value: %', (NEW.valor_total + COALESCE(NEW.taxa_servico_total, 0));
  END IF;
  
  IF COALESCE(NEW.taxa_servico_total, 0) > 50 THEN
    RAISE EXCEPTION 'Service fee too high: %', NEW.taxa_servico_total;
  END IF;
  
  NEW.created_at = now();
  
  return NEW;
END;
$function$;