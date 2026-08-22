-- MarketPilot AI / Module 4 — Offers and Promotions.
-- Run after 004b_product_margins.sql.

create type public.discount_type as enum (
  'percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping'
);

create type public.offer_status as enum (
  'draft', 'active', 'expired', 'cancelled'
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.business_workspaces(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  title varchar(200) not null check (length(trim(title)) > 0),
  description text check (description is null or length(trim(description)) > 0),
  discount_type public.discount_type not null,
  discount_value numeric(12,2) not null check (discount_value > 0),
  minimum_order_value numeric(12,2) check (minimum_order_value is null or minimum_order_value >= 0),
  start_date date not null,
  end_date date not null,
  status public.offer_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index offers_workspace_status_idx on public.offers (workspace_id, status);
create index offers_workspace_product_idx on public.offers (workspace_id, product_id);

alter table public.offers enable row level security;
create policy "Workspace owners can read their offers"
  on public.offers for select to authenticated
  using (exists (
    select 1 from public.business_workspaces w
    where w.id = workspace_id and w.owner_id = auth.uid()
  ));

create trigger offers_set_updated_at
  before update on public.offers
  for each row execute procedure public.set_updated_at();
