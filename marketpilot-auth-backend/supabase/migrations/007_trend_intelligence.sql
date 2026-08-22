-- MarketPilot AI / Module 5 — Trend Intelligence Engine.
-- Run after 006_marketing_budget.sql.

create type public.trend_platform as enum (
  'tiktok', 'instagram', 'facebook', 'linkedin', 'x', 'youtube', 'google_trends', 'general'
);

create table if not exists public.trend_signals (
  id uuid primary key default gen_random_uuid(),
  topic varchar(200) not null check (length(trim(topic)) > 0),
  headline text not null check (length(trim(headline)) > 0),
  summary text not null check (length(trim(summary)) > 0),
  platform public.trend_platform not null default 'general',
  category varchar(100) not null check (length(trim(category)) > 0),
  target_audience text check (target_audience is null or length(trim(target_audience)) > 0),
  suggested_angles text[] not null default '{}'::text[] check (cardinality(suggested_angles) <= 5),
  hashtags text[] not null default '{}'::text[] check (cardinality(hashtags) <= 15),
  source_name varchar(150) not null check (length(trim(source_name)) > 0),
  source_url text not null check (length(trim(source_url)) > 0),
  collection_date date not null check (collection_date <= current_date),
  confidence_score integer not null check (confidence_score between 1 and 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trend_signals_platform_active_idx on public.trend_signals (platform, is_active);
create index if not exists trend_signals_category_active_idx on public.trend_signals (category, is_active);
create index if not exists trend_signals_collection_date_idx on public.trend_signals (collection_date desc);

alter table public.trend_signals enable row level security;

-- All authenticated users can read active trend signals for strategy planning
drop policy if exists "Authenticated users can read active trends" on public.trend_signals;
create policy "Authenticated users can read active trends"
  on public.trend_signals for select to authenticated
  using (is_active = true or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'administrator'
  ));

drop trigger if exists trend_signals_set_updated_at on public.trend_signals;
create trigger trend_signals_set_updated_at
  before update on public.trend_signals
  for each row execute procedure public.set_updated_at();
