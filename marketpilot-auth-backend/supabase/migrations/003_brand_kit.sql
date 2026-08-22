-- MarketPilot AI / Module 3: Brand Kit.
-- Run after 001 Module 1 schema and 002_business_workspaces.sql.
create table public.brand_kits (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.business_workspaces(id) on delete cascade,
  brand_voice text not null check (char_length(brand_voice) between 2 and 100),
  preferred_language text not null check (char_length(preferred_language) between 2 and 50),
  target_audience text not null check (char_length(target_audience) between 2 and 1000),
  content_style text not null check (char_length(content_style) between 2 and 100),
  brand_tone jsonb not null check (jsonb_typeof(brand_tone) = 'array' and jsonb_array_length(brand_tone) between 1 and 8),
  primary_colors jsonb not null check (jsonb_typeof(primary_colors) = 'array' and jsonb_array_length(primary_colors) between 1 and 5),
  secondary_colors jsonb not null default '[]'::jsonb check (jsonb_typeof(secondary_colors) = 'array' and jsonb_array_length(secondary_colors) <= 5),
  fonts jsonb not null default '[]'::jsonb check (jsonb_typeof(fonts) = 'array' and jsonb_array_length(fonts) <= 4),
  preferred_ctas jsonb not null default '[]'::jsonb check (jsonb_typeof(preferred_ctas) = 'array' and jsonb_array_length(preferred_ctas) <= 12),
  prohibited_words jsonb not null default '[]'::jsonb check (jsonb_typeof(prohibited_words) = 'array' and jsonb_array_length(prohibited_words) <= 30),
  approved_caption_examples jsonb not null default '[]'::jsonb check (jsonb_typeof(approved_caption_examples) = 'array' and jsonb_array_length(approved_caption_examples) <= 10),
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.brand_kits enable row level security;
create policy "Workspace owners can read their Brand Kit"
  on public.brand_kits for select to authenticated
  using (exists (select 1 from public.business_workspaces w where w.id = workspace_id and w.owner_id = auth.uid()));

create trigger brand_kits_set_updated_at
  before update on public.brand_kits
  for each row execute procedure public.set_updated_at();
