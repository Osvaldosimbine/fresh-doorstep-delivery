
-- Validation trigger: prevent a_caminho without entregador_id
CREATE OR REPLACE FUNCTION public.validate_order_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status_pedido = 'a_caminho' AND NEW.entregador_id IS NULL THEN
    RAISE EXCEPTION 'Cannot set status to a_caminho without an assigned driver (entregador_id)';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_order_status
  BEFORE INSERT OR UPDATE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_order_status_transition();

-- Fix existing orphan orders: reset to em_preparacao
UPDATE public.pedidos
SET status_pedido = 'em_preparacao'
WHERE status_pedido = 'a_caminho' AND entregador_id IS NULL;
