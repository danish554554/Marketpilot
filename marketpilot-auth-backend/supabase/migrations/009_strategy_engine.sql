-- Module 7: Strategy Engine Migration
-- Creates marketing_strategies and strategy_campaign_pillars tables for end-to-end strategic campaign orchestration

create type strategy_status as enum ('draft', 'approved', 'active', 'archived');
create type campaign_channel as enum ('instagram', 'tiktok', 'facebook', 'linkedin', 'x', 'youtube', 'email', 'whatsapp', 'general');
create type strategy_timeframe as enum ('weekly', 'monthly', 'quarterly');

-- 1. Marketing Strategies Table
create table if not exists marketing_strategies (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references business_workspaces(id) on delete cascade,
    created_by uuid not null references auth.users(id) on delete cascade,
    title text not null,
    timeframe strategy_timeframe not null default 'monthly',
    status strategy_status not null default 'draft',
    executive_summary text not null,
    target_audience_summary text not null,
    budget_allocation_summary jsonb not null default '{}'::jsonb,
    product_priorities_summary jsonb not null default '{}'::jsonb,
    strategic_rationale jsonb not null default '{}'::jsonb,
    generation_log_id uuid references ai_generation_logs(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_marketing_strategies_workspace_id on marketing_strategies(workspace_id);
create index if not exists idx_marketing_strategies_status on marketing_strategies(status);
create index if not exists idx_marketing_strategies_created_at on marketing_strategies(created_at desc);

-- 2. Strategy Campaign Pillars Table
create table if not exists strategy_campaign_pillars (
    id uuid primary key default gen_random_uuid(),
    strategy_id uuid not null references marketing_strategies(id) on delete cascade,
    pillar_name text not null,
    objective text not null default 'increase_product_awareness',
    channel_type text not null default 'organic', -- 'organic' | 'paid'
    platform campaign_channel not null default 'instagram',
    focus_product_id uuid references products(id) on delete set null,
    offer_id uuid references offers(id) on delete set null,
    trend_signal_id uuid references trend_signals(id) on delete set null,
    creative_angle text not null,
    hook_ideas jsonb not null default '[]'::jsonb,
    suggested_ctas jsonb not null default '[]'::jsonb,
    content_formats jsonb not null default '[]'::jsonb,
    estimated_effort text not null default 'medium', -- 'low', 'medium', 'high'
    rationale text not null,
    order_index integer not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_strategy_campaign_pillars_strategy_id on strategy_campaign_pillars(strategy_id);
create index if not exists idx_strategy_campaign_pillars_order on strategy_campaign_pillars(strategy_id, order_index);

-- Auto-update updated_at timestamps
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_marketing_strategies_updated_at on marketing_strategies;
create trigger set_marketing_strategies_updated_at
    before update on marketing_strategies
    for each row
    execute function public.set_updated_at();

drop trigger if exists set_strategy_campaign_pillars_updated_at on strategy_campaign_pillars;
create trigger set_strategy_campaign_pillars_updated_at
    before update on strategy_campaign_pillars
    for each row
    execute function public.set_updated_at();

-- Row Level Security (RLS)
alter table marketing_strategies enable row level security;
alter table strategy_campaign_pillars enable row level security;

-- 1. Marketing Strategies Policies
create policy "Workspace owners can view strategies"
    on marketing_strategies for select
    using (
        exists (
            select 1 from business_workspaces w
            where w.id = marketing_strategies.workspace_id
              and w.owner_id = auth.uid()
        )
    );

create policy "Workspace owners can insert strategies"
    on marketing_strategies for insert
    with check (
        exists (
            select 1 from business_workspaces w
            where w.id = marketing_strategies.workspace_id
              and w.owner_id = auth.uid()
        )
    );

create policy "Workspace owners can update strategies"
    on marketing_strategies for update
    using (
        exists (
            select 1 from business_workspaces w
            where w.id = marketing_strategies.workspace_id
              and w.owner_id = auth.uid()
        )
    );

create policy "Workspace owners can delete strategies"
    on marketing_strategies for delete
    using (
        exists (
            select 1 from business_workspaces w
            where w.id = marketing_strategies.workspace_id
              and w.owner_id = auth.uid()
        )
    );

create policy "Administrators full access to strategies"
    on marketing_strategies for all
    using (
        exists (
            select 1 from profiles p
            where p.id = auth.uid()
              and p.role = 'administrator'
        )
    );

-- 2. Strategy Campaign Pillars Policies
create policy "Workspace owners can view strategy pillars"
    on strategy_campaign_pillars for select
    using (
        exists (
            select 1 from marketing_strategies s
            join business_workspaces w on w.id = s.workspace_id
            where s.id = strategy_campaign_pillars.strategy_id
              and w.owner_id = auth.uid()
        )
    );

create policy "Workspace owners can insert strategy pillars"
    on strategy_campaign_pillars for insert
    with check (
        exists (
            select 1 from marketing_strategies s
            join business_workspaces w on w.id = s.workspace_id
            where s.id = strategy_campaign_pillars.strategy_id
              and w.owner_id = auth.uid()
        )
    );

create policy "Workspace owners can update strategy pillars"
    on strategy_campaign_pillars for update
    using (
        exists (
            select 1 from marketing_strategies s
            join business_workspaces w on w.id = s.workspace_id
            where s.id = strategy_campaign_pillars.strategy_id
              and w.owner_id = auth.uid()
        )
    );

create policy "Workspace owners can delete strategy pillars"
    on strategy_campaign_pillars for delete
    using (
        exists (
            select 1 from marketing_strategies s
            join business_workspaces w on w.id = s.workspace_id
            where s.id = strategy_campaign_pillars.strategy_id
              and w.owner_id = auth.uid()
        )
    );

create policy "Administrators full access to strategy pillars"
    on strategy_campaign_pillars for all
    using (
        exists (
            select 1 from profiles p
            where p.id = auth.uid()
              and p.role = 'administrator'
        )
    );
