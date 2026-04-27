-- ============================================================
-- RepWatchr SuperAdmin Office, Case Builder, Profile Questions
-- ============================================================
-- Run this after supabase-profile-claims.sql and supabase-faretta-analytics.sql.
-- Intake records default to private review. Operators decide whether a case is
-- held, sent for answer, made public, or escalated into a public article.

create or replace function public.is_repw_operator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('admin', 'reviewer', 'researcher')
  );
$$;

create table if not exists public.operator_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 240),
  category text not null default 'General',
  severity text not null default 'yellow' check (severity in ('red', 'yellow', 'green')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'done', 'blocked', 'archived')),
  notes text check (char_length(coalesce(notes, '')) <= 5000),
  due_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.operator_asks (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(question) between 1 and 500),
  context text check (char_length(coalesce(context, '')) <= 3000),
  options jsonb not null default '[]'::jsonb,
  selected_option text,
  response_notes text check (char_length(coalesce(response_notes, '')) <= 3000),
  status text not null default 'open' check (status in ('open', 'answered', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  answered_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.accountability_cases (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 240),
  summary text not null check (char_length(summary) between 1 and 10000),
  source_site text not null default 'repwatchr_admin',
  source_submission_id text,
  intake_channel text not null default 'manual',
  status text not null default 'intake_review' check (
    status in (
      'intake_review',
      'source_review',
      'question_sent',
      'response_received',
      'revision_needed',
      'approved_public',
      'held_private',
      'escalate_article',
      'closed'
    )
  ),
  priority text not null default 'yellow' check (priority in ('red', 'yellow', 'green')),
  visibility_status text not null default 'private_review' check (
    visibility_status in ('private_review', 'sent_to_target', 'public', 'held', 'removed')
  ),
  submitter_name text,
  submitter_email text,
  submitter_phone text,
  county text,
  requested_action text check (char_length(coalesce(requested_action, '')) <= 1000),
  final_determination text check (char_length(coalesce(final_determination, '')) <= 5000),
  evidence_urls text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.accountability_case_entities (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.accountability_cases(id) on delete cascade not null,
  entity_type text not null check (
    entity_type in ('official', 'school_board', 'district', 'government_entity', 'organization', 'other')
  ),
  entity_id text,
  entity_name text not null check (char_length(entity_name) between 1 and 240),
  district_slug text,
  profile_url text,
  involvement text not null default 'subject_of_review',
  created_at timestamptz default now() not null
);

create table if not exists public.profile_questions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.accountability_cases(id) on delete set null,
  target_type text not null check (
    target_type in ('official', 'school_board', 'district', 'government_entity', 'organization', 'other')
  ),
  target_id text,
  district_slug text,
  target_name text not null check (char_length(target_name) between 1 and 240),
  question text not null check (char_length(question) between 1 and 3000),
  source_summary text check (char_length(coalesce(source_summary, '')) <= 3000),
  status text not null default 'needs_review' check (
    status in ('draft', 'needs_review', 'sent', 'answered', 'escalate', 'closed')
  ),
  visibility_status text not null default 'private_review' check (
    visibility_status in ('private_review', 'sent_to_target', 'public', 'held', 'removed')
  ),
  due_at timestamptz,
  sent_at timestamptz,
  answered_at timestamptz,
  response_summary text check (char_length(coalesce(response_summary, '')) <= 5000),
  source_url text,
  created_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.profile_question_responses (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references public.profile_questions(id) on delete cascade not null,
  responder_user_id uuid references auth.users(id) on delete set null,
  responder_name text,
  response text not null check (char_length(response) between 1 and 5000),
  source_url text,
  status text not null default 'pending_review' check (status in ('pending_review', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now() not null
);

create index if not exists idx_operator_tasks_status
  on public.operator_tasks(status, severity, created_at desc);

create index if not exists idx_operator_asks_status
  on public.operator_asks(status, created_at desc);

create index if not exists idx_accountability_cases_status
  on public.accountability_cases(status, priority, created_at desc);

create index if not exists idx_accountability_cases_source
  on public.accountability_cases(source_site, source_submission_id);

create index if not exists idx_accountability_case_entities_case
  on public.accountability_case_entities(case_id);

create index if not exists idx_accountability_case_entities_target
  on public.accountability_case_entities(entity_type, entity_id);

create index if not exists idx_profile_questions_target
  on public.profile_questions(target_type, target_id, visibility_status, created_at desc);

create index if not exists idx_profile_questions_case
  on public.profile_questions(case_id);

create index if not exists idx_profile_question_responses_question
  on public.profile_question_responses(question_id, status, created_at desc);

alter table public.operator_tasks enable row level security;
alter table public.operator_asks enable row level security;
alter table public.accountability_cases enable row level security;
alter table public.accountability_case_entities enable row level security;
alter table public.profile_questions enable row level security;
alter table public.profile_question_responses enable row level security;

drop policy if exists "Operators manage office tasks" on public.operator_tasks;
drop policy if exists "Operators manage office asks" on public.operator_asks;
drop policy if exists "Operators manage accountability cases" on public.accountability_cases;
drop policy if exists "Public reads approved accountability cases" on public.accountability_cases;
drop policy if exists "Operators manage accountability case entities" on public.accountability_case_entities;
drop policy if exists "Public reads approved accountability case entities" on public.accountability_case_entities;
drop policy if exists "Operators manage profile questions" on public.profile_questions;
drop policy if exists "Public reads public profile questions" on public.profile_questions;
drop policy if exists "Claimants read sent profile questions" on public.profile_questions;
drop policy if exists "Operators manage profile question responses" on public.profile_question_responses;
drop policy if exists "Claimants create profile question responses" on public.profile_question_responses;
drop policy if exists "Public reads approved profile question responses" on public.profile_question_responses;

create policy "Operators manage office tasks"
  on public.operator_tasks for all
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Operators manage office asks"
  on public.operator_asks for all
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Operators manage accountability cases"
  on public.accountability_cases for all
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Public reads approved accountability cases"
  on public.accountability_cases for select
  using (visibility_status = 'public');

create policy "Operators manage accountability case entities"
  on public.accountability_case_entities for all
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Public reads approved accountability case entities"
  on public.accountability_case_entities for select
  using (
    exists (
      select 1
      from public.accountability_cases ac
      where ac.id = case_id
        and ac.visibility_status = 'public'
    )
  );

create policy "Operators manage profile questions"
  on public.profile_questions for all
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Public reads public profile questions"
  on public.profile_questions for select
  using (visibility_status = 'public');

create policy "Claimants read sent profile questions"
  on public.profile_questions for select
  to authenticated
  using (
    visibility_status = 'sent_to_target'
    and exists (
      select 1
      from public.profile_claims pc
      where pc.user_id = auth.uid()
        and pc.profile_id = target_id
        and pc.status = 'approved'
    )
  );

create policy "Operators manage profile question responses"
  on public.profile_question_responses for all
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Claimants create profile question responses"
  on public.profile_question_responses for insert
  to authenticated
  with check (
    responder_user_id = auth.uid()
    and exists (
      select 1
      from public.profile_questions pq
      join public.profile_claims pc on pc.profile_id = pq.target_id
      where pq.id = question_id
        and pq.visibility_status in ('sent_to_target', 'public')
        and pc.user_id = auth.uid()
        and pc.status = 'approved'
    )
  );

create policy "Public reads approved profile question responses"
  on public.profile_question_responses for select
  using (status = 'approved');

drop trigger if exists set_operator_tasks_updated_at on public.operator_tasks;
create trigger set_operator_tasks_updated_at
  before update on public.operator_tasks
  for each row execute function public.handle_updated_at();

drop trigger if exists set_operator_asks_updated_at on public.operator_asks;
create trigger set_operator_asks_updated_at
  before update on public.operator_asks
  for each row execute function public.handle_updated_at();

drop trigger if exists set_accountability_cases_updated_at on public.accountability_cases;
create trigger set_accountability_cases_updated_at
  before update on public.accountability_cases
  for each row execute function public.handle_updated_at();

drop trigger if exists set_profile_questions_updated_at on public.profile_questions;
create trigger set_profile_questions_updated_at
  before update on public.profile_questions
  for each row execute function public.handle_updated_at();

grant execute on function public.is_repw_operator() to anon, authenticated;
grant select on public.accountability_cases to anon, authenticated;
grant select on public.accountability_case_entities to anon, authenticated;
grant select on public.profile_questions to anon, authenticated;
grant select on public.profile_question_responses to anon, authenticated;
grant insert on public.profile_question_responses to authenticated;
grant all on public.operator_tasks to authenticated;
grant all on public.operator_asks to authenticated;
grant all on public.accountability_cases to authenticated;
grant all on public.accountability_case_entities to authenticated;
grant all on public.profile_questions to authenticated;
grant all on public.profile_question_responses to authenticated;
