
-- 1. Add trigger to block self-escalation on profiles
CREATE OR REPLACE FUNCTION public.prevent_profile_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Permission denied: cannot change role';
  END IF;
  IF NEW.tipo_usuario IS DISTINCT FROM OLD.tipo_usuario THEN
    RAISE EXCEPTION 'Permission denied: cannot change tipo_usuario';
  END IF;
  IF NEW.status_cadastro IS DISTINCT FROM OLD.status_cadastro THEN
    RAISE EXCEPTION 'Permission denied: cannot change status_cadastro';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_escalation_trigger ON profiles;
CREATE TRIGGER prevent_profile_escalation_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_escalation();

-- 2. Remove direct wallet UPDATE policy
DROP POLICY IF EXISTS "Drivers can update their own wallet" ON carteira_entregador;

-- 3. SECURITY DEFINER functions for controlled wallet operations
CREATE OR REPLACE FUNCTION public.credit_delivery_commission(
  p_entregador_id uuid,
  p_amount numeric,
  p_to_available boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  IF p_to_available THEN
    UPDATE carteira_entregador
    SET saldo_disponivel = saldo_disponivel + p_amount, updated_at = now()
    WHERE entregador_id = p_entregador_id;
  ELSE
    UPDATE carteira_entregador
    SET saldo_pendente = saldo_pendente + p_amount, updated_at = now()
    WHERE entregador_id = p_entregador_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_wallet_withdrawal(
  p_entregador_id uuid,
  p_amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_saldo numeric;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = p_entregador_id AND user_id = auth.uid()
  ) AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  SELECT saldo_disponivel INTO v_saldo
  FROM carteira_entregador
  WHERE entregador_id = p_entregador_id
  FOR UPDATE;

  IF v_saldo < p_amount OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Insufficient balance or invalid amount';
  END IF;

  UPDATE carteira_entregador
  SET saldo_disponivel = saldo_disponivel - p_amount, updated_at = now()
  WHERE entregador_id = p_entregador_id;
END;
$$;
