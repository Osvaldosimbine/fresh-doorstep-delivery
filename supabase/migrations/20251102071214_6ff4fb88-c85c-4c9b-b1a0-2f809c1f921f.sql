-- Limpar usuários de teste antigos
DELETE FROM public.user_roles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@padarize.test'
);

DELETE FROM public.profiles WHERE email LIKE '%@padarize.test';

DELETE FROM auth.users WHERE email LIKE '%@padarize.test';

-- Criar usuário cliente
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  email_change,
  email_change_token_new,
  email_change_token_current,
  confirmation_token,
  recovery_token,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_sent_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'cliente@padarize.test',
  crypt('Teste123!', gen_salt('bf')),
  now(),
  '',
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"nome_completo":"Cliente Teste","telefone":"+258841234567","tipo_usuario":"cliente","localizacao":"Maputo","endereco":"Av. Julius Nyerere, 123"}'::jsonb,
  now(),
  now(),
  now()
);

-- Criar usuário padaria (como cliente na tabela auth, mas role 'padaria')
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  email_change,
  email_change_token_new,
  email_change_token_current,
  confirmation_token,
  recovery_token,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_sent_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'padaria@padarize.test',
  crypt('Teste123!', gen_salt('bf')),
  now(),
  '',
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"nome_completo":"Padaria Teste","telefone":"+258842345678","tipo_usuario":"cliente","localizacao":"Maputo","endereco":"Av. 24 de Julho, 456"}'::jsonb,
  now(),
  now(),
  now()
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
  email_change,
  email_change_token_new,
  email_change_token_current,
  confirmation_token,
  recovery_token,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_sent_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'entregador@padarize.test',
  crypt('Teste123!', gen_salt('bf')),
  now(),
  '',
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"nome_completo":"Entregador Teste","telefone":"+258843456789","tipo_usuario":"entregador","localizacao":"Maputo","endereco":"Av. Ahmed Sekou Touré, 789"}'::jsonb,
  now(),
  now(),
  now()
);

-- Aguardar trigger criar os perfis, depois atualizar role para padaria
UPDATE public.profiles
SET role = 'padaria', status_cadastro = 'aprovado'
WHERE email = 'padaria@padarize.test';

UPDATE public.profiles
SET status_cadastro = 'aprovado'
WHERE email IN ('cliente@padarize.test', 'entregador@padarize.test');

-- Atualizar roles na tabela user_roles
UPDATE public.user_roles
SET role = 'padaria'
WHERE user_id = (SELECT user_id FROM public.profiles WHERE email = 'padaria@padarize.test');