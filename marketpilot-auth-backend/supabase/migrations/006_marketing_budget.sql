-- MarketPilot AI / Module 4 — Marketing Budget.
-- Run after 005_offers.sql.

create table public.marketing_budgets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.business_workspaces(id) on delete cascade,
  total_monthly_budget numeric(12,2) not null check (total_monthly_budget >= 0),
  organic_percentage numeric(5,2) not null default 70.00 check (organic_percentage >= 0 and organic_percentage <= 100),
  paid_percentage numeric(5,2) not null default 30.00 check (paid_percentage >= 0 and paid_percentage <= 100),
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (organic_percentage + paid_percentage = 100)
);

alter table public.marketing_budgets enable row level security;
create policy "Workspace owners can read their marketing budget"
  on public.marketing_budgets for select to authenticated
  using (exists (
    select 1 from public.business_workspaces w
    where w.id = workspace_id and w.owner_id = auth.uid()
  ));

create trigger marketing_budgets_set_updated_at
  before update on public.marketing_budgets
  for each row execute procedure public.set_updated_at();
