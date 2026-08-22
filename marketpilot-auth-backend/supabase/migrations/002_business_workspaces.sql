-- MarketPilot AI / Module 2: Business Workspace. Run after supabase/schema.sql.

create table if not exists public.business_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(id) on delete cascade,
  business_name varchar(160) not null check (length(trim(business_name)) > 0),
  industry varchar(100) not null check (length(trim(industry)) > 0),
  website text,
  country char(2) not null check (country ~ '^[A-Z]{2}$'),
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  target_market varchar(160) not null check (length(trim(target_market)) > 0),
  business_description varchar(3000) not null check (length(trim(business_description)) > 0),
  marketing_objectives text[] not null check (
    cardinality(marketing_objectives) between 1 and 7
    and marketing_objectives <@ array[
      'increase_sales', 'increase_engagement', 'increase_product_awareness',
      'generate_whatsapp_enquiries', 'introduce_new_product', 'promote_an_offer',
      'clear_existing_stock'
    ]::text[]
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.business_workspaces enable row level security;

create policy "Owners can read their own workspace"
  on public.business_workspaces for select to authenticated
  using (auth.uid() = owner_id);

create trigger business_workspaces_set_updated_at
  before update on public.business_workspaces
  for each row execute procedure public.set_updated_at();
