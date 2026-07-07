create extension if not exists pgcrypto;

create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  description text,
  enabled boolean not null default false,
  rollout_percentage int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_writing_runs (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text null,
  user_id uuid null,
  actor_role text null,
  use_case text not null,
  input_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(input_payload) = 'object'),
  output_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(output_payload) = 'object'),
  safety_flags jsonb not null default '[]'::jsonb check (jsonb_typeof(safety_flags) = 'array'),
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

create table if not exists public.ai_writing_feedback (
  id uuid primary key default gen_random_uuid(),
  ai_writing_run_id uuid not null references public.ai_writing_runs(id) on delete cascade,
  user_id uuid null,
  rating text null,
  feedback text null,
  created_at timestamptz not null default now()
);

create index if not exists ai_writing_runs_user_created_idx on public.ai_writing_runs(user_id, created_at desc);
create index if not exists ai_writing_runs_use_case_idx on public.ai_writing_runs(use_case);
create index if not exists ai_writing_runs_status_idx on public.ai_writing_runs(status);
create index if not exists ai_writing_feedback_run_idx on public.ai_writing_feedback(ai_writing_run_id);

alter table public.ai_writing_runs enable row level security;
alter table public.ai_writing_feedback enable row level security;

grant usage on schema public to anon, authenticated;

revoke all on table public.ai_writing_runs from anon, authenticated;
revoke all on table public.ai_writing_feedback from anon, authenticated;

grant select on table public.ai_writing_runs to authenticated;
grant select, insert on table public.ai_writing_feedback to authenticated;

drop policy if exists "users can view own ai writing runs" on public.ai_writing_runs;
create policy "users can view own ai writing runs"
on public.ai_writing_runs
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "users can view own ai writing feedback" on public.ai_writing_feedback;
create policy "users can view own ai writing feedback"
on public.ai_writing_feedback
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "users can create own ai writing feedback" on public.ai_writing_feedback;
create policy "users can create own ai writing feedback"
on public.ai_writing_feedback
for insert
to authenticated
with check ((select auth.uid()) = user_id);

insert into public.feature_flags (key, description, enabled, rollout_percentage, metadata)
values (
  'ENABLE_AI_WRITING_ASSISTANT',
  'Allows RepWatchr safe AI writing assistant generation when provider keys are configured. Default off; manual templates remain available.',
  false,
  0,
  '{"system":"safe_ai_writing_assistant"}'::jsonb
)
on conflict (key) do update
set description = excluded.description,
    updated_at = now();
