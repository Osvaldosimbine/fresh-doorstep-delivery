-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/tbrmfcglxwwvjgulskfj/sql)

-- 1. Chat messages between client and delivery person
create table if not exists public.chat_mensagens (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'cliente',
  mensagem text not null,
  created_at timestamptz not null default now()
);
alter table public.chat_mensagens enable row level security;
create policy "Users can read their order chats" on public.chat_mensagens
  for select using (
    auth.uid() = sender_id or
    exists (select 1 from public.pedidos p where p.id = pedido_id and p.user_id = auth.uid()) or
    exists (select 1 from public.pedidos p where p.id = pedido_id and p.entregador_id = auth.uid())
  );
create policy "Users can insert chat messages" on public.chat_mensagens
  for insert with check (auth.uid() = sender_id);

-- 2. Loyalty points balance
create table if not exists public.pontos_fidelidade (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  pontos integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.pontos_fidelidade enable row level security;
create policy "Users can read own points" on public.pontos_fidelidade
  for select using (auth.uid() = user_id);
create policy "Users can upsert own points" on public.pontos_fidelidade
  for all using (auth.uid() = user_id);

-- 3. Loyalty points history
create table if not exists public.historico_pontos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pedido_id uuid references public.pedidos(id) on delete set null,
  pontos integer not null,
  tipo text not null check (tipo in ('ganho', 'resgatado')),
  descricao text,
  created_at timestamptz not null default now()
);
alter table public.historico_pontos enable row level security;
create policy "Users can read own history" on public.historico_pontos
  for select using (auth.uid() = user_id);
create policy "Users can insert own history" on public.historico_pontos
  for insert with check (auth.uid() = user_id);

-- 4. Real-time entregador location
create table if not exists public.entregador_localizacao (
  id uuid primary key default gen_random_uuid(),
  entregador_id uuid not null unique references auth.users(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  pedido_id uuid references public.pedidos(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.entregador_localizacao enable row level security;
create policy "Anyone authenticated can read location" on public.entregador_localizacao
  for select using (auth.role() = 'authenticated');
create policy "Entregador can upsert own location" on public.entregador_localizacao
  for all using (auth.uid() = entregador_id);

-- 5. Recurring orders
create table if not exists public.pedidos_recorrentes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  padaria_id uuid references public.padarias(id) on delete set null,
  padaria_nome text,
  descricao text not null,
  frequencia text not null check (frequencia in ('diaria', 'semanal')),
  hora text not null,
  dias_semana integer[] not null default '{0,1,2,3,4,5,6}',
  ativo boolean not null default true,
  proximo_pedido timestamptz,
  created_at timestamptz not null default now()
);
alter table public.pedidos_recorrentes enable row level security;
create policy "Users can manage own recurring orders" on public.pedidos_recorrentes
  for all using (auth.uid() = user_id);

-- 6. Delivery zones per bakery
create table if not exists public.zonas_entrega (
  id uuid primary key default gen_random_uuid(),
  padaria_id uuid not null references public.padarias(id) on delete cascade,
  bairro text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (padaria_id, bairro)
);
alter table public.zonas_entrega enable row level security;
create policy "Anyone can read delivery zones" on public.zonas_entrega
  for select using (true);
create policy "Padaria can manage own zones" on public.zonas_entrega
  for all using (
    exists (select 1 from public.padarias p where p.id = padaria_id and p.user_id = auth.uid())
  );

-- Enable realtime for chat and location
alter publication supabase_realtime add table public.chat_mensagens;
alter publication supabase_realtime add table public.entregador_localizacao;
