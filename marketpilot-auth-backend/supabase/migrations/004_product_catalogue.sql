-- MarketPilot AI / Module 4: Product Catalogue.
-- Run after the Module 1, 2, and 3 migrations.
create type public.product_status as enum ('draft', 'active', 'archived');
create type public.product_priority as enum ('low', 'normal', 'high', 'featured');

create table public.products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.business_workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 200),
  description text not null check (char_length(description) between 2 and 5000),
  category text,
  sku text,
  price numeric(12,2) not null check (price > 0),
  compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price > 0),
  stock_quantity integer not null default 0 check (stock_quantity between 0 and 10000000),
  track_inventory boolean not null default true,
  status public.product_status not null default 'draft',
  priority public.product_priority not null default 'normal',
  images jsonb not null default '[]'::jsonb check (jsonb_typeof(images) = 'array' and jsonb_array_length(images) <= 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, sku)
);

create index products_workspace_status_idx on public.products (workspace_id, status);
create index products_workspace_category_idx on public.products (workspace_id, category);

alter table public.products enable row level security;
create policy "Workspace owners can read products"
  on public.products for select to authenticated
  using (exists (select 1 from public.business_workspaces w where w.id = workspace_id and w.owner_id = auth.uid()));

create trigger products_set_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();
