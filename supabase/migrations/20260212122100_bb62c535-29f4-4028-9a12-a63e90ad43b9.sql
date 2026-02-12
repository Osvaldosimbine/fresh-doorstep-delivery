
-- 1. Adicionar novos campos à tabela profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS foto_url text,
  ADD COLUMN IF NOT EXISTS tipo_veiculo text,
  ADD COLUMN IF NOT EXISTS matricula_veiculo text,
  ADD COLUMN IF NOT EXISTS rating_medio numeric DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS total_entregas integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS km_acumulados numeric DEFAULT 0;

-- 2. Tabela carteira_entregador
CREATE TABLE public.carteira_entregador (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entregador_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  saldo_disponivel numeric NOT NULL DEFAULT 0,
  saldo_pendente numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entregador_id)
);

ALTER TABLE public.carteira_entregador ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view their own wallet"
  ON public.carteira_entregador FOR SELECT
  USING (entregador_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can update their own wallet"
  ON public.carteira_entregador FOR UPDATE
  USING (entregador_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can insert their own wallet"
  ON public.carteira_entregador FOR INSERT
  WITH CHECK (entregador_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all wallets"
  ON public.carteira_entregador FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Tabela pedidos_saque
CREATE TABLE public.pedidos_saque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entregador_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  valor numeric NOT NULL,
  metodo_pagamento text NOT NULL CHECK (metodo_pagamento IN ('mpesa', 'emola')),
  numero_conta text NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'processado', 'rejeitado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  processado_em timestamptz
);

ALTER TABLE public.pedidos_saque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view their own withdrawals"
  ON public.pedidos_saque FOR SELECT
  USING (entregador_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can create their own withdrawals"
  ON public.pedidos_saque FOR INSERT
  WITH CHECK (entregador_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all withdrawals"
  ON public.pedidos_saque FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Tabela comprovativo_entrega
CREATE TABLE public.comprovativo_entrega (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id),
  entregador_id uuid NOT NULL REFERENCES public.profiles(id),
  tipo text NOT NULL CHECK (tipo IN ('foto', 'pin')),
  foto_url text,
  pin_confirmado boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.comprovativo_entrega ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can create delivery proofs"
  ON public.comprovativo_entrega FOR INSERT
  WITH CHECK (entregador_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can view their own proofs"
  ON public.comprovativo_entrega FOR SELECT
  USING (entregador_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all proofs"
  ON public.comprovativo_entrega FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Tabela problemas_rota
CREATE TABLE public.problemas_rota (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rota_id uuid NOT NULL REFERENCES public.rotas_otimizadas(id),
  entregador_id uuid NOT NULL REFERENCES public.profiles(id),
  tipo_problema text NOT NULL CHECK (tipo_problema IN ('pneu_furado', 'endereco_nao_encontrado', 'padaria_sem_stock', 'outro')),
  descricao text,
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'resolvido')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.problemas_rota ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can create route problems"
  ON public.problemas_rota FOR INSERT
  WITH CHECK (entregador_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can view their own problems"
  ON public.problemas_rota FOR SELECT
  USING (entregador_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all problems"
  ON public.problemas_rota FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. Tabela avaliacoes_entregador
CREATE TABLE public.avaliacoes_entregador (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entregador_id uuid NOT NULL REFERENCES public.profiles(id),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id),
  cliente_id uuid NOT NULL REFERENCES public.profiles(id),
  nota integer NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.avaliacoes_entregador ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can create ratings"
  ON public.avaliacoes_entregador FOR INSERT
  WITH CHECK (cliente_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can view their own ratings"
  ON public.avaliacoes_entregador FOR SELECT
  USING (entregador_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all ratings"
  ON public.avaliacoes_entregador FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. Storage bucket para fotos
INSERT INTO storage.buckets (id, name, public) VALUES ('entregador-fotos', 'entregador-fotos', true);

CREATE POLICY "Drivers can upload their photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'entregador-fotos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view driver photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'entregador-fotos');

CREATE POLICY "Drivers can update their photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'entregador-fotos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger para updated_at na carteira
CREATE TRIGGER update_carteira_updated_at
  BEFORE UPDATE ON public.carteira_entregador
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
