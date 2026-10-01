-- ============================================================
-- ANISTOCK — Almacén Cafetería y Aseo
-- Esquema Supabase (PostgreSQL + RLS)
-- Ejecutar en SQL Editor de Supabase.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Perfiles (vinculados a auth.users)
-- ------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null,
  role        text not null check (role in ('contratista', 'supervisor', 'solicitante')),
  piso        text,                                      -- solo para solicitantes
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Cada usuario puede leer/actualizar su propio perfil.
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Crear perfil automáticamente al registrarse.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Usuario'),
    coalesce(new.raw_user_meta_data ->> 'role', 'solicitante')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- Catálogo de productos
-- ------------------------------------------------------------
create table public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null check (category in ('cafeteria', 'aseo')),
  unit        text not null default 'unidad',   -- unidad | litro | kilo | paquete | caja | galon
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (name, category)
);

alter table public.products enable row level security;

-- Catálogo visible para cualquier usuario autenticado.
create policy "products_select_auth" on public.products
  for select using (auth.role() = 'authenticated');
create policy "products_insert_auth" on public.products
  for insert with check (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- Solicitudes de pedido
-- ------------------------------------------------------------
create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  solicitante_id  uuid references public.profiles (id) on delete set null,
  solicitante_name text not null,
  piso            text not null,
  status          text not null default 'pendiente'
                  check (status in ('pendiente', 'aprobado', 'rechazado', 'entregado')),
  supervisor_id   uuid references public.profiles (id) on delete set null,
  supervisor_name text,
  comments        text,
  approved_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "orders_select_auth" on public.orders
  for select using (auth.role() = 'authenticated');
create policy "orders_insert_auth" on public.orders
  for insert with check (auth.role() = 'authenticated');
create policy "orders_update_auth" on public.orders
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- Líneas de cada pedido (snapshot del producto al momento de pedir)
-- ------------------------------------------------------------
create table public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  product_id   uuid references public.products (id) on delete set null,
  product_name text not null,
  category     text not null check (category in ('cafeteria', 'aseo')),
  unit         text not null default 'unidad',
  quantity     numeric(8, 2) not null check (quantity > 0),
  created_at   timestamptz not null default now()
);

create index on public.order_items (order_id);
create index on public.orders (status);
create index on public.orders (piso);
create index on public.orders (created_at);

alter table public.order_items enable row level security;

create policy "order_items_select_auth" on public.order_items
  for select using (auth.role() = 'authenticated');
create policy "order_items_insert_auth" on public.order_items
  for insert with check (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- Trigger de updated_at
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute procedure public.set_updated_at();

-- ------------------------------------------------------------
-- Vista para métricas del contratista (cantidad pedida/aprobada)
-- ------------------------------------------------------------
create or replace view public.metric_totals as
select
  oi.category,
  oi.product_name,
  oi.unit,
  sum(oi.quantity)                          as total_quantity,
  count(distinct o.id)                      as order_count,
  count(*) filter (where o.status = 'aprobado') as approved_orders,
  date_trunc('month', coalesce(o.approved_at, o.created_at)) as period
from public.order_items oi
join public.orders o on o.id = oi.order_id
where o.status in ('aprobado', 'entregado')
group by oi.category, oi.product_name, oi.unit, period;