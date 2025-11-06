-- Create entregador_status table for tracking driver availability
CREATE TABLE IF NOT EXISTS public.entregador_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entregador_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  disponivel BOOLEAN NOT NULL DEFAULT false,
  localizacao_atual TEXT,
  coordenadas_lat NUMERIC,
  coordenadas_lng NUMERIC,
  ultimo_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
  turno_iniciado_em TIMESTAMP WITH TIME ZONE,
  UNIQUE(entregador_id)
);

-- Create rotas_otimizadas table for optimized delivery routes
CREATE TABLE IF NOT EXISTS public.rotas_otimizadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  padaria_id UUID NOT NULL REFERENCES public.padarias(id) ON DELETE CASCADE,
  entregador_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  pedidos_ids UUID[] NOT NULL,
  ordem_paragens JSONB NOT NULL,
  distancia_total_km NUMERIC NOT NULL,
  tempo_estimado_minutos INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  aceita_em TIMESTAMP WITH TIME ZONE,
  iniciada_em TIMESTAMP WITH TIME ZONE,
  concluida_em TIMESTAMP WITH TIME ZONE
);

-- Add new columns to entregas table
ALTER TABLE public.entregas 
  ADD COLUMN IF NOT EXISTS rota_id UUID REFERENCES public.rotas_otimizadas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ordem_na_rota INTEGER,
  ADD COLUMN IF NOT EXISTS marcada_coletada_em TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS marcada_entregue_em TIMESTAMP WITH TIME ZONE;

-- Add entregador_id to pedidos table
ALTER TABLE public.pedidos 
  ADD COLUMN IF NOT EXISTS entregador_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE public.entregador_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rotas_otimizadas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for entregador_status
CREATE POLICY "Drivers can view their own status"
  ON public.entregador_status
  FOR SELECT
  USING (
    entregador_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can update their own status"
  ON public.entregador_status
  FOR UPDATE
  USING (
    entregador_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can insert their own status"
  ON public.entregador_status
  FOR INSERT
  WITH CHECK (
    entregador_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all driver status"
  ON public.entregador_status
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for rotas_otimizadas
CREATE POLICY "Drivers can view their assigned routes"
  ON public.rotas_otimizadas
  FOR SELECT
  USING (
    entregador_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ) OR entregador_id IS NULL
  );

CREATE POLICY "Drivers can update their route status"
  ON public.rotas_otimizadas
  FOR UPDATE
  USING (
    entregador_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all routes"
  ON public.rotas_otimizadas
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can create routes"
  ON public.rotas_otimizadas
  FOR INSERT
  WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_entregador_status_disponivel ON public.entregador_status(disponivel, entregador_id);
CREATE INDEX IF NOT EXISTS idx_rotas_status ON public.rotas_otimizadas(status, entregador_id);
CREATE INDEX IF NOT EXISTS idx_entregas_rota ON public.entregas(rota_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_entregador ON public.pedidos(entregador_id);