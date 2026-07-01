-- ============================================================
-- RepWatchr AI-Assisted Source Review
-- ============================================================
-- Run after:
-- - supabase-profile-claims.sql
-- - supabase-source-submission-system.sql
-- - supabase-admin-dashboard.sql
-- - supabase-security-rls-hardening.sql
--
-- AI suggestions are advisory only. They never publish, approve, attach, or
-- reject source submissions without a separate human admin action.

create extension if not exists pgcrypto;

create table if not exists public.ai_review_runs (
  id uuid primary key default gen_random_uuid(),
  source_submission_id uuid references public.source_submissions(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  provider text check (provider is null or char_length(provider) <= 80),
  model text check (model is null or char_length(model) <= 120),
  input_summary jsonb not null default '{}'::jsonb,
  output_summary jsonb not null default '{}'::jsonb,
  safety_flags jsonb not null default '[]'::jsonb,
  recommendation text check (
    recommendation is null or recommendation in (
      'attach_to_profile',
      'attach_to_race',
      'attach_to_story',
      'needs_more_info',
      'reject',
      'duplicate',
      'unsafe',
      'broken_link',
      'needs_human_review'
    )
  ),
  status text not null default 'completed' check (status in ('completed', 'failed', 'disabled')),
  created_at timestamptz default now() not null
);

create table if not exists public.ai_review_feedback (
  id uuid primary key default gen_random_uuid(),
  ai_review_run_id uuid not null references public.ai_review_runs(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  feedback text not null check (char_length(feedback) between 1 and 3000),
  rating text check (rating is null or rating in ('accepted', 'rejected', 'helpful', 'not_helpful', 'unsafe', 'wrong')),
  created_at timestamptz default now() not null
);

create index if not exists idx_ai_review_runs_submission
  on public.ai_review_runs(source_submission_id, created_at desc)
  where source_submission_id is not null;

create index if not exists idx_ai_review_runs_actor
  on public.ai_review_runs(actor_user_id, created_at desc)
  where actor_user_id is not null;

create index if not exists idx_ai_review_runs_status
  on public.ai_review_runs(status, recommendation, created_at desc);

create index if not exists idx_ai_review_feedback_run
  on public.ai_review_feedback(ai_review_run_id, created_at desc);

alter table public.ai_review_runs enable row level security;
alter table public.ai_review_feedback enable row level security;

grant select, insert, update, delete on public.ai_review_runs to authenticated, service_role;
grant select, insert, update, delete on public.ai_review_feedback to authenticated, service_role;
revoke all on public.ai_review_runs from anon;
revoke all on public.ai_review_feedback from anon;

drop policy if exists "Admins manage AI review runs" on public.ai_review_runs;
drop policy if exists "Admins manage AI review feedback" on public.ai_review_feedback;

create policy "Admins manage AI review runs"
  on public.ai_review_runs for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Admins manage AI review feedback"
  on public.ai_review_feedback for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());
