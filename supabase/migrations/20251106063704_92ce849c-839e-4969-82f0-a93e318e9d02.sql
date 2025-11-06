-- Adicionar campo de horário agendado à tabela pedidos
ALTER TABLE public.pedidos 
ADD COLUMN horario_agendado TEXT;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.pedidos.horario_agendado IS 'Horário agendado para entrega quando o pedido é feito fora do horário de funcionamento';