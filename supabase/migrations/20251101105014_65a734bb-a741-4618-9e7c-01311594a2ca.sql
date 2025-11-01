-- Limpar dados de teste anteriores se existirem
DELETE FROM public.user_roles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN (
    'cliente.teste@padarize.com',
    'padaria.teste@padarize.com',
    'entregador.teste@padarize.com'
  )
);

DELETE FROM public.profiles WHERE email IN (
  'cliente.teste@padarize.com',
  'padaria.teste@padarize.com',
  'entregador.teste@padarize.com'
);

DELETE FROM auth.users WHERE email IN (
  'cliente.teste@padarize.com',
  'padaria.teste@padarize.com',
  'entregador.teste@padarize.com'
);

-- Criar usuário cliente
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'cliente.teste@padarize.com',
  crypt('Teste123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"nome_completo":"Cliente Teste","telefone":"+258 84 123 4567","tipo_usuario":"cliente","localizacao":"Maputo","endereco":"Av. Julius Nyerere, 123"}'::jsonb,
  now(),
  now(),
  '',
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'cliente.teste@padarize.com'
);

-- Criar usuário padaria (como cliente primeiro)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'padaria.teste@padarize.com',
  crypt('Teste123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"nome_completo":"Padaria Teste","telefone":"+258 84 234 5678","tipo_usuario":"cliente","localizacao":"Maputo","endereco":"Av. 24 de Julho, 456"}'::jsonb,
  now(),
  now(),
  '',
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'padaria.teste@padarize.com'
);

-- Criar usuário entregador
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'entregador.teste@padarize.com',
  crypt('Teste123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"nome_completo":"Entregador Teste","telefone":"+258 84 345 6789","tipo_usuario":"entregador","localizacao":"Maputo","endereco":"Av. Ahmed Sekou Touré, 789"}'::jsonb,
  now(),
  now(),
  '',
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'entregador.teste@padarize.com'
);

-- Atualizar perfis criados pelo trigger
UPDATE public.profiles
SET role = 'padaria', status_cadastro = 'aprovado'
WHERE email = 'padaria.teste@padarize.com';

UPDATE public.profiles
SET status_cadastro = 'aprovado'
WHERE email IN ('cliente.teste@padarize.com', 'entregador.teste@padarize.com');

-- Atualizar roles na tabela user_roles
UPDATE public.user_roles
SET role = 'padaria'
WHERE user_id = (SELECT user_id FROM public.profiles WHERE email = 'padaria.teste@padarize.com');

-- Criar padaria de teste
INSERT INTO public.padarias (
  nome_padaria,
  endereco,
  localizacao,
  horario_funcionamento,
  status_ativa
)
VALUES (
  'Padaria Teste Maputo',
  'Av. 24 de Julho, 456, Maputo',
  'Maputo',
  '{"abertura": "06:00", "fechamento": "20:00"}'::jsonb,
  true
)
ON CONFLICT DO NOTHING;