-- MarketPilot AI / Module 4b: Product margins, features, and pain points.
-- Run after 004_product_catalogue.sql.

alter table public.products
  add column if not exists cost_price numeric(12,2) check (cost_price is null or cost_price >= 0);

alter table public.products
  add column if not exists features text[] not null default '{}'::text[]
  check (cardinality(features) <= 10);

alter table public.products
  add column if not exists pain_points text[] not null default '{}'::text[]
  check (cardinality(pain_points) <= 10);
