-- Module 8: Planner, Editorial Calendar & Content Batch Generation Migration
-- Creates planner_content_items table for managing text-first scheduled marketing content

create type content_status as enum ('draft', 'scheduled', 'published', 'archived');
create type content_format as enum ('post_caption', 'carousel_slides', 'short_video_script', 'email_newsletter', 'direct_message');

-- 1. Planner Content Items Table
create table if not exists planner_content_items (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references business_workspaces(id) on delete cascade,
    created_by uuid not null references auth.users(id) on delete cascade,
    strategy_id uuid references marketing_strategies(id) on delete set null,
    pillar_id uuid references strategy_campaign_pillars(id) on delete set null,
    focus_product_id uuid references products(id) on delete set null,
    offer_id uuid references offers(id) on delete set null,
    trend_signal_id uuid references trend_signals(id) on delete set null,
    title text not null,
    channel campaign_channel not null default 'instagram',
    channel_type text not null default 'organic', -- 'organic' | 'paid'
    format content_format not null default 'post_caption',
    status content_status not null default 'scheduled',
    scheduled_date date not null,
    scheduled_time_slot text not null default 'morning_09_00', -- 'morning_09_00', 'afternoon_14_00', 'evening_18_00'
    hook text not null,
    primary_text text not null,
    structured_content jsonb not null default '{}'::jsonb,
    call_to_action text not null,
    strategic_rationale text not null default '',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_planner_content_workspace_id on planner_content_items(workspace_id);
create index if not exists idx_planner_content_scheduled_date on planner_content_items(scheduled_date);
create index if not exists idx_planner_content_channel on planner_content_items(channel);
create index if not exists idx_planner_content_status on planner_content_items(status);
create index if not exists idx_planner_content_strategy_id on planner_content_items(strategy_id);

-- Auto-update updated_at timestamps
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_planner_content_items_updated_at on planner_content_items;
create trigger set_planner_content_items_updated_at
    before update on planner_content_items
    for each row
    execute function public.set_updated_at();

-- Row Level Security (RLS)
alter table planner_content_items enable row level security;

create policy "Workspace owners can view planner content items"
    on planner_content_items for select
    using (
        exists (
            select 1 from business_workspaces w
            where w.id = planner_content_items.workspace_id
              and w.owner_id = auth.uid()
        )
    );

create policy "Workspace owners can insert planner content items"
    on planner_content_items for insert
    with check (
        exists (
            select 1 from business_workspaces w
            where w.id = planner_content_items.workspace_id
              and w.owner_id = auth.uid()
        )
    );

create policy "Workspace owners can update planner content items"
    on planner_content_items for update
    using (
        exists (
            select 1 from business_workspaces w
            where w.id = planner_content_items.workspace_id
              and w.owner_id = auth.uid()
        )
    );

create policy "Workspace owners can delete planner content items"
    on planner_content_items for delete
    using (
        exists (
            select 1 from business_workspaces w
            where w.id = planner_content_items.workspace_id
              and w.owner_id = auth.uid()
        )
    );

create policy "Administrators full access to planner content items"
    on planner_content_items for all
    using (
        exists (
            select 1 from profiles p
            where p.id = auth.uid()
              and p.role = 'administrator'
        )
    );
