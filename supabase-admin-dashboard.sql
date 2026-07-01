-- ============================================================
-- RepWatchr Admin Dashboard Tables
-- ============================================================
-- Run after the base auth/user_roles schema. These tables are admin-only.
-- Public users should never read or update this data.

create extension if not exists pgcrypto;

create or replace function public.is_repw_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  allowed boolean := false;
begin
  if to_regclass('public.user_roles') is null then
    return false;
  end if;

  execute
    'select exists (
      select 1
      from public.user_roles
      where user_id = auth.uid()
        and role = ''admin''
    )'
  into allowed;

  return coalesce(allowed, false);
end;
$$;

create or replace function public.repw_admin_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 2 and 120),
  entity_type text check (entity_type is null or char_length(entity_type) <= 120),
  entity_id text check (entity_id is null or char_length(entity_id) <= 240),
  before_value jsonb,
  after_value jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create table if not exists public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  entity_type text not null check (char_length(entity_type) between 2 and 120),
  entity_id text not null check (char_length(entity_id) between 1 and 240),
  note text not null check (char_length(note) between 1 and 5000),
  visibility text not null default 'internal' check (visibility in ('internal', 'public_summary')),
  created_at timestamptz default now() not null
);

create table if not exists public.admin_assignments (
  id uuid primary key default gen_random_uuid(),
  assigned_to uuid references auth.users(id) on delete set null,
  assigned_by uuid references auth.users(id) on delete set null,
  entity_type text not null check (char_length(entity_type) between 2 and 120),
  entity_id text not null check (char_length(entity_id) between 1 and 240),
  status text not null default 'open' check (status in ('open', 'in_progress', 'blocked', 'done', 'archived')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.import_runs (
  id uuid primary key default gen_random_uuid(),
  source_key text check (source_key is null or char_length(source_key) <= 120),
  source_name text check (source_name is null or char_length(source_name) <= 180),
  import_type text check (import_type is null or char_length(import_type) <= 120),
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'partial', 'failed', 'canceled')),
  started_at timestamptz default now() not null,
  completed_at timestamptz,
  records_seen integer not null default 0 check (records_seen >= 0),
  records_created integer not null default 0 check (records_created >= 0),
  records_updated integer not null default 0 check (records_updated >= 0),
  records_skipped integer not null default 0 check (records_skipped >= 0),
  errors_count integer not null default 0 check (errors_count >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create table if not exists public.import_errors (
  id uuid primary key default gen_random_uuid(),
  import_run_id uuid references public.import_runs(id) on delete cascade,
  source_key text check (source_key is null or char_length(source_key) <= 120),
  severity text not null default 'warning' check (severity in ('info', 'warning', 'error', 'critical')),
  message text not null check (char_length(message) between 1 and 5000),
  raw_payload jsonb,
  entity_type text check (entity_type is null or char_length(entity_type) <= 120),
  entity_id text check (entity_id is null or char_length(entity_id) <= 240),
  created_at timestamptz default now() not null
);

create table if not exists public.data_quality_issues (
  id uuid primary key default gen_random_uuid(),
  issue_type text not null check (char_length(issue_type) between 2 and 120),
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  entity_type text check (entity_type is null or char_length(entity_type) <= 120),
  entity_id text check (entity_id is null or char_length(entity_id) <= 240),
  title text check (title is null or char_length(title) <= 240),
  description text check (description is null or char_length(description) <= 5000),
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved', 'ignored', 'archived')),
  detected_at timestamptz default now() not null,
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.broken_links (
  id uuid primary key default gen_random_uuid(),
  url text not null check (url ~* '^https?://' and char_length(url) <= 700),
  entity_type text check (entity_type is null or char_length(entity_type) <= 120),
  entity_id text check (entity_id is null or char_length(entity_id) <= 240),
  status_code integer check (status_code is null or status_code between 100 and 599),
  last_checked_at timestamptz,
  status text not null default 'open' check (status in ('open', 'checking', 'broken', 'redirected', 'resolved', 'ignored', 'archived')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.duplicate_candidates (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (char_length(entity_type) between 2 and 120),
  entity_id_a text check (entity_id_a is null or char_length(entity_id_a) <= 240),
  entity_id_b text check (entity_id_b is null or char_length(entity_id_b) <= 240),
  similarity_score numeric(8,4) check (similarity_score is null or (similarity_score >= 0 and similarity_score <= 1)),
  reason text check (reason is null or char_length(reason) <= 1000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'merged', 'not_duplicate', 'archived')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_admin_audit_logs_entity
  on public.admin_audit_logs(entity_type, entity_id, created_at desc);
create index if not exists idx_admin_audit_logs_actor
  on public.admin_audit_logs(actor_user_id, created_at desc)
  where actor_user_id is not null;
create index if not exists idx_admin_notes_entity
  on public.admin_notes(entity_type, entity_id, created_at desc);
create index if not exists idx_admin_assignments_entity
  on public.admin_assignments(entity_type, entity_id, status, updated_at desc);
create index if not exists idx_admin_assignments_assignee
  on public.admin_assignments(assigned_to, status, updated_at desc)
  where assigned_to is not null;
create index if not exists idx_import_runs_source_status
  on public.import_runs(source_key, status, started_at desc);
create index if not exists idx_import_errors_run
  on public.import_errors(import_run_id, created_at desc)
  where import_run_id is not null;
create index if not exists idx_data_quality_issues_status
  on public.data_quality_issues(status, severity, created_at desc);
create index if not exists idx_data_quality_issues_entity
  on public.data_quality_issues(entity_type, entity_id, status, created_at desc);
create index if not exists idx_broken_links_status
  on public.broken_links(status, last_checked_at desc nulls last, created_at desc);
create index if not exists idx_broken_links_entity
  on public.broken_links(entity_type, entity_id, status, created_at desc);
create index if not exists idx_duplicate_candidates_status
  on public.duplicate_candidates(entity_type, status, similarity_score desc nulls last, created_at desc);

drop trigger if exists trg_admin_assignments_updated_at on public.admin_assignments;
create trigger trg_admin_assignments_updated_at
before update on public.admin_assignments
for each row execute function public.repw_admin_set_updated_at();

drop trigger if exists trg_data_quality_issues_updated_at on public.data_quality_issues;
create trigger trg_data_quality_issues_updated_at
before update on public.data_quality_issues
for each row execute function public.repw_admin_set_updated_at();

drop trigger if exists trg_broken_links_updated_at on public.broken_links;
create trigger trg_broken_links_updated_at
before update on public.broken_links
for each row execute function public.repw_admin_set_updated_at();

drop trigger if exists trg_duplicate_candidates_updated_at on public.duplicate_candidates;
create trigger trg_duplicate_candidates_updated_at
before update on public.duplicate_candidates
for each row execute function public.repw_admin_set_updated_at();

alter table public.admin_audit_logs enable row level security;
alter table public.admin_notes enable row level security;
alter table public.admin_assignments enable row level security;
alter table public.import_runs enable row level security;
alter table public.import_errors enable row level security;
alter table public.data_quality_issues enable row level security;
alter table public.broken_links enable row level security;
alter table public.duplicate_candidates enable row level security;

grant select, insert, update, delete on public.admin_audit_logs to authenticated, service_role;
grant select, insert, update, delete on public.admin_notes to authenticated, service_role;
grant select, insert, update, delete on public.admin_assignments to authenticated, service_role;
grant select, insert, update, delete on public.import_runs to authenticated, service_role;
grant select, insert, update, delete on public.import_errors to authenticated, service_role;
grant select, insert, update, delete on public.data_quality_issues to authenticated, service_role;
grant select, insert, update, delete on public.broken_links to authenticated, service_role;
grant select, insert, update, delete on public.duplicate_candidates to authenticated, service_role;

drop policy if exists "Admins manage admin audit logs" on public.admin_audit_logs;
drop policy if exists "Admins manage admin notes" on public.admin_notes;
drop policy if exists "Admins manage admin assignments" on public.admin_assignments;
drop policy if exists "Admins manage import runs" on public.import_runs;
drop policy if exists "Admins manage import errors" on public.import_errors;
drop policy if exists "Admins manage data quality issues" on public.data_quality_issues;
drop policy if exists "Admins manage broken links" on public.broken_links;
drop policy if exists "Admins manage duplicate candidates" on public.duplicate_candidates;

create policy "Admins manage admin audit logs"
  on public.admin_audit_logs for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Admins manage admin notes"
  on public.admin_notes for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Admins manage admin assignments"
  on public.admin_assignments for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Admins manage import runs"
  on public.import_runs for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Admins manage import errors"
  on public.import_errors for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Admins manage data quality issues"
  on public.data_quality_issues for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Admins manage broken links"
  on public.broken_links for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Admins manage duplicate candidates"
  on public.duplicate_candidates for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());
