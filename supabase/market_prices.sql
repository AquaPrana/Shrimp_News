create extension if not exists pgcrypto;

create table if not exists public.market_prices (
  id uuid primary key default gen_random_uuid(),
  symbol text unique not null,
  label text not null,
  category text not null,
  species text,
  count_size text,
  market text,
  currency text not null default 'INR',
  unit text not null default 'kg',
  price numeric not null check (price >= 0),
  previous_price numeric,
  change_value numeric,
  change_percent numeric,
  direction text not null default 'neutral' check (direction in ('up', 'down', 'neutral')),
  source_name text not null,
  source_url text,
  is_live boolean not null default false,
  is_active boolean not null default true,
  observed_at timestamptz not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  display_order integer
);

create index if not exists market_prices_symbol_idx on public.market_prices (symbol);
create index if not exists market_prices_category_idx on public.market_prices (category);
create index if not exists market_prices_is_active_idx on public.market_prices (is_active);
create index if not exists market_prices_observed_at_idx on public.market_prices (observed_at);
create index if not exists market_prices_updated_at_idx on public.market_prices (updated_at);

alter table public.market_prices enable row level security;

create policy if not exists market_prices_public_select
  on public.market_prices
  for select
  using (is_active = true);

create policy if not exists market_prices_public_no_insert
  on public.market_prices
  for insert
  with check (false);

create policy if not exists market_prices_public_no_update
  on public.market_prices
  for update
  using (false);

create policy if not exists market_prices_public_no_delete
  on public.market_prices
  for delete
  using (false);
