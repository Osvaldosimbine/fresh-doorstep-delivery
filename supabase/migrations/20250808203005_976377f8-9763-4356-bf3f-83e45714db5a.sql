-- Populate bakeries with real data from Maputo
INSERT INTO public.padarias (nome_padaria, endereco, localizacao, coordenadas_lat, coordenadas_lng, status_ativa) VALUES
('Sweet Treats and Donuts', 'Av. Lucas Luali', 'Polana', -25.9665, 32.5830, true),
('Sabores da Vanda', 'Rua de França, Coop', 'Coop', -25.9532, 32.5890, true),
('Pasteleria Marmara', 'Av. 24 de Julho', 'Polana', -25.9665, 32.5830, true),
('Padaria do Bairro – Polana', 'Av. 24 de Julho, Polana', 'Polana', -25.9665, 32.5830, true),
('Padaria Lafões', 'Maputo Centro', 'Central', -25.9692, 32.5731, true),
('Padaria Joss Village', 'Rua do Embondeiro', 'Sommerschield', -25.9610, 32.5892, true),
('NOVA ERA PASTELARIA E CONFEITARIA', 'Av. Mao Tse Tung (Coop)', 'Coop', -25.9532, 32.5890, true),
('Taverna Doce', 'Av. Mao Tse Tung (Coop)', 'Coop', -25.9532, 32.5890, true),
('Padaria e Pastelaria L''Avenida', 'Av. Eduardo Mondlane (Central)', 'Central', -25.9692, 32.5731, true),
('El Avenida Padaria e Pastelaria', 'Av. Eduardo Mondlane', 'Central', -25.9692, 32.5731, true),
('Padaria Pastelaria Pizzaria', 'Rua 25 de Setembro (Central)', 'Central', -25.9692, 32.5731, true),
('Padaria e Pastelaria Adriel', 'Tchumene 2, Matola', 'Matola', -25.9625, 32.4608, true);

-- Add some basic products for each bakery
INSERT INTO public.produtos (nome_produto, tipo_pao, preco, padaria_id, disponivel, estoque_atual, imagem_url) 
SELECT 
  produtos.nome,
  produtos.tipo,
  produtos.preco,
  p.id,
  true,
  FLOOR(RANDOM() * 50 + 10)::integer,
  NULL
FROM public.padarias p
CROSS JOIN (
  VALUES 
    ('Pão Baguete', 'Baguete', 15.00),
    ('Pão de Forma', 'Forma', 25.00),
    ('Pão Artesanal', 'Artesanal', 35.00),
    ('Pão Integral', 'Integral', 20.00),
    ('Pão Doce', 'Doce', 18.00),
    ('Croissant', 'Doce', 12.00)
) AS produtos(nome, tipo, preco);