-- Create enum for user types
CREATE TYPE public.tipo_usuario AS ENUM ('cliente', 'entregador');

-- Create enum for user status
CREATE TYPE public.status_cadastro AS ENUM ('pendente', 'aprovado', 'rejeitado');

-- Create enum for order status
CREATE TYPE public.status_pedido AS ENUM ('pendente', 'em_preparacao', 'a_caminho', 'entregue', 'cancelado');

-- Create enum for delivery status
CREATE TYPE public.status_entrega AS ENUM ('aceita', 'em_transito', 'entregue', 'cancelada');

-- Create enum for payment methods
CREATE TYPE public.forma_pagamento AS ENUM ('mpesa', 'emola', 'paypal', 'dinheiro');

-- Create usuarios table
CREATE TABLE public.usuarios (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
    nome_completo TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    telefone TEXT NOT NULL,
    tipo_usuario tipo_usuario NOT NULL,
    localizacao_atual TEXT,
    foto_passaporte TEXT,
    status_cadastro status_cadastro NOT NULL DEFAULT 'pendente',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create padarias table
CREATE TABLE public.padarias (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome_padaria TEXT NOT NULL,
    endereco TEXT NOT NULL,
    horario_funcionamento JSONB,
    localizacao TEXT,
    coordenadas_lat DECIMAL(10, 8),
    coordenadas_lng DECIMAL(11, 8),
    status_ativa BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create produtos table
CREATE TABLE public.produtos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    padaria_id UUID REFERENCES public.padarias(id) ON DELETE CASCADE NOT NULL,
    nome_produto TEXT NOT NULL,
    preco DECIMAL(10, 2) NOT NULL,
    tipo_pao TEXT,
    estoque_atual INTEGER NOT NULL DEFAULT 0,
    disponivel BOOLEAN NOT NULL DEFAULT true,
    imagem_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pedidos table
CREATE TABLE public.pedidos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
    padaria_id UUID REFERENCES public.padarias(id) ON DELETE CASCADE NOT NULL,
    valor_total DECIMAL(10, 2) NOT NULL,
    forma_pagamento forma_pagamento NOT NULL,
    status_pedido status_pedido NOT NULL DEFAULT 'pendente',
    endereco_entrega TEXT NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create itens_pedido table
CREATE TABLE public.itens_pedido (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pedido_id UUID REFERENCES public.pedidos(id) ON DELETE CASCADE NOT NULL,
    produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE NOT NULL,
    quantidade INTEGER NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create entregas table
CREATE TABLE public.entregas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    entregador_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
    pedido_id UUID REFERENCES public.pedidos(id) ON DELETE CASCADE NOT NULL,
    local_retirada TEXT NOT NULL,
    local_entrega TEXT NOT NULL,
    status_entrega status_entrega NOT NULL DEFAULT 'aceita',
    comissao_percentual DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
    valor_comissao DECIMAL(10, 2),
    data_coleta TIMESTAMP WITH TIME ZONE,
    data_entrega TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pagamentos_comissoes table
CREATE TABLE public.pagamentos_comissoes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    entregador_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
    pedido_id UUID REFERENCES public.pedidos(id) ON DELETE CASCADE NOT NULL,
    valor_total_entrega DECIMAL(10, 2) NOT NULL,
    percentual_comissao DECIMAL(5, 2) NOT NULL,
    valor_recebido DECIMAL(10, 2) NOT NULL,
    data_pagamento TIMESTAMP WITH TIME ZONE,
    pago BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.padarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos_comissoes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for usuarios
CREATE POLICY "Users can view their own profile" ON public.usuarios
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.usuarios
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.usuarios
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for padarias (public read access)
CREATE POLICY "Anyone can view active bakeries" ON public.padarias
FOR SELECT USING (status_ativa = true);

-- Create RLS policies for produtos (public read access for available products)
CREATE POLICY "Anyone can view available products" ON public.produtos
FOR SELECT USING (disponivel = true);

-- Create RLS policies for pedidos
CREATE POLICY "Users can view their own orders" ON public.pedidos
FOR SELECT USING (cliente_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid()));

CREATE POLICY "Users can create their own orders" ON public.pedidos
FOR INSERT WITH CHECK (cliente_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own orders" ON public.pedidos
FOR UPDATE USING (cliente_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid()));

-- Create RLS policies for itens_pedido
CREATE POLICY "Users can view their order items" ON public.itens_pedido
FOR SELECT USING (pedido_id IN (
    SELECT id FROM public.pedidos WHERE cliente_id IN (
        SELECT id FROM public.usuarios WHERE user_id = auth.uid()
    )
));

CREATE POLICY "Users can create their order items" ON public.itens_pedido
FOR INSERT WITH CHECK (pedido_id IN (
    SELECT id FROM public.pedidos WHERE cliente_id IN (
        SELECT id FROM public.usuarios WHERE user_id = auth.uid()
    )
));

-- Create RLS policies for entregas
CREATE POLICY "Deliverers can view their deliveries" ON public.entregas
FOR SELECT USING (entregador_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid()));

CREATE POLICY "Deliverers can update their deliveries" ON public.entregas
FOR UPDATE USING (entregador_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid()));

-- Create RLS policies for pagamentos_comissoes
CREATE POLICY "Deliverers can view their payments" ON public.pagamentos_comissoes
FOR SELECT USING (entregador_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid()));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON public.usuarios
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_padarias_updated_at
    BEFORE UPDATE ON public.padarias
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at
    BEFORE UPDATE ON public.produtos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pedidos_updated_at
    BEFORE UPDATE ON public.pedidos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_entregas_updated_at
    BEFORE UPDATE ON public.entregas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically calculate commission value
CREATE OR REPLACE FUNCTION public.calculate_commission()
RETURNS TRIGGER AS $$
BEGIN
    NEW.valor_comissao = NEW.valor_total_entrega * (NEW.percentual_comissao / 100);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate commission in pagamentos_comissoes
CREATE TRIGGER calculate_commission_trigger
    BEFORE INSERT OR UPDATE ON public.pagamentos_comissoes
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_commission();

-- Create function to auto-calculate subtotal in itens_pedido
CREATE OR REPLACE FUNCTION public.calculate_subtotal()
RETURNS TRIGGER AS $$
BEGIN
    NEW.subtotal = NEW.quantidade * NEW.preco_unitario;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate subtotal
CREATE TRIGGER calculate_subtotal_trigger
    BEFORE INSERT OR UPDATE ON public.itens_pedido
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_subtotal();