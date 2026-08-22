-- Module 6: LLM Orchestration and Guardrails Migration
-- Creates ai_generation_logs table for audit trail, prompt history, structured outputs, and guardrail validation logs

create type guardrail_status as enum ('passed', 'warnings', 'failed', 'sanitized');
create type prompt_type as enum ('strategy_ideation', 'product_campaign', 'trend_alignment', 'custom');

create table if not exists ai_generation_logs (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references business_workspaces(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    prompt_type prompt_type not null default 'strategy_ideation',
    context_summary jsonb not null default '{}'::jsonb,
    raw_prompt text,
    raw_output text,
    structured_output jsonb,
    guardrail_status guardrail_status not null default 'passed',
    guardrail_violations jsonb not null default '[]'::jsonb,
    execution_latency_ms integer not null default 0,
    model_name text not null default 'marketpilot-v1-engine',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_ai_generation_logs_workspace_id on ai_generation_logs(workspace_id);
create index if not exists idx_ai_generation_logs_user_id on ai_generation_logs(user_id);
create index if not exists idx_ai_generation_logs_created_at on ai_generation_logs(created_at desc);
create index if not exists idx_ai_generation_logs_guardrail_status on ai_generation_logs(guardrail_status);

alter table ai_generation_logs enable row level security;

-- Row Level Security:
-- 1. Workspace owners can read logs for their workspace
create policy "Workspace owners can view generation logs"
    on ai_generation_logs for select
    using (
        exists (
            select 1 from business_workspaces w
            where w.id = ai_generation_logs.workspace_id
              and w.owner_id = auth.uid()
        )
    );

-- 2. Workspace owners can insert generation logs for their workspace
create policy "Workspace owners can insert generation logs"
    on ai_generation_logs for insert
    with check (
        exists (
            select 1 from business_workspaces w
            where w.id = ai_generation_logs.workspace_id
              and w.owner_id = auth.uid()
        )
    );

-- 3. Administrators have full access
create policy "Administrators full access to generation logs"
    on ai_generation_logs for all
    using (
        exists (
            select 1 from profiles p
            where p.id = auth.uid()
              and p.role = 'administrator'
        )
    );
