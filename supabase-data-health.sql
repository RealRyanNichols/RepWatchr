-- ============================================================
-- RepWatchr Data Import + Health Monitoring
-- ============================================================
-- Run after supabase-admin-dashboard.sql so private.is_repw_admin()
-- and public.handle_updated_at() exist.

create extension if not exists pgcrypto;

create table if not exists public.import_runs (
  id uuid primary key default gen_random_uuid(),
  import_type text not null,
  provider text not null,
  status text not null default 'queued',
  records_seen integer not null default 0,
  records_inserted integer not null default 0,
  records_updated integer not null default 0,
  records_skipped integer not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  last_success_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint import_runs_status_check check (status in ('queued', 'running', 'success', 'partial', 'failed'))
);

create table if not exists public.import_errors (
  id uuid primary key default gen_random_uuid(),
  import_run_id uuid references public.import_runs(id) on delete set null,
  provider text,
  severity text not null default 'warn',
  message text not null,
  source_url text,
  raw_payload jsonb not null default '{}'::jsonb,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  constraint import_errors_severity_check check (severity in ('info', 'warn', 'error', 'critical')),
  constraint import_errors_status_check check (status in ('new', 'resolved', 'ignored'))
);

create table if not exists public.data_quality_issues (
  id uuid primary key default gen_random_uuid(),
  issue_type text not null,
  entity_type text not null,
  entity_id text,
  severity text not null default 'warn',
  title text not null,
  detail text,
  source_url text,
  status text not null default 'open',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  constraint data_quality_issues_severity_check check (severity in ('info', 'warn', 'error', 'critical')),
  constraint data_quality_issues_status_check check (status in ('open', 'resolved', 'ignored', 'quarantined'))
);

create table if not exists public.broken_links (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  source_context text,
  entity_type text,
  entity_id text,
  http_status integer,
  status text not null default 'new',
  last_checked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  constraint broken_links_status_check check (status in ('new', 'confirmed', 'fixed', 'ignored')),
  constraint broken_links_url_check check (url ~* '^https?://')
);

create table if not exists public.duplicate_candidates (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  primary_entity_id text,
  duplicate_entity_id text,
  confidence_score numeric(5,2) not null default 0,
  reason text,
  status text not null default 'open',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  constraint duplicate_candidates_status_check check (status in ('open', 'merged', 'ignored', 'resolved')),
  constraint duplicate_candidates_confidence_check check (confidence_score >= 0 and confidence_score <= 100)
);

create table if not exists public.member_digest_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weekly_digest_enabled boolean not null default false,
  email text,
  topics text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create index if not exists import_runs_type_status_idx on public.import_runs(import_type, status);
create index if not exists import_runs_started_at_idx on public.import_runs(started_at desc);
create index if not exists import_errors_status_idx on public.import_errors(status, severity);
create index if not exists data_quality_issues_status_idx on public.data_quality_issues(status, severity);
create index if not exists data_quality_issues_entity_idx on public.data_quality_issues(entity_type, entity_id);
create index if not exists broken_links_status_idx on public.broken_links(status);
create index if not exists broken_links_entity_idx on public.broken_links(entity_type, entity_id);
create index if not exists duplicate_candidates_status_idx on public.duplicate_candidates(status);
create index if not exists duplicate_candidates_entity_idx on public.duplicate_candidates(entity_type, primary_entity_id, duplicate_entity_id);
create index if not exists member_digest_preferences_user_idx on public.member_digest_preferences(user_id);

drop trigger if exists import_runs_updated_at on public.import_runs;
create trigger import_runs_updated_at before update on public.import_runs
for each row execute function public.handle_updated_at();

drop trigger if exists broken_links_updated_at on public.broken_links;
create trigger broken_links_updated_at before update on public.broken_links
for each row execute function public.handle_updated_at();

drop trigger if exists member_digest_preferences_updated_at on public.member_digest_preferences;
create trigger member_digest_preferences_updated_at before update on public.member_digest_preferences
for each row execute function public.handle_updated_at();

alter table public.import_runs enable row level security;
alter table public.import_errors enable row level security;
alter table public.data_quality_issues enable row level security;
alter table public.broken_links enable row level security;
alter table public.duplicate_candidates enable row level security;
alter table public.member_digest_preferences enable row level security;

drop policy if exists "Admins manage import runs" on public.import_runs;
create policy "Admins manage import runs" on public.import_runs
for all to authenticated using (private.is_repw_admin()) with check (private.is_repw_admin());

drop policy if exists "Admins manage import errors" on public.import_errors;
create policy "Admins manage import errors" on public.import_errors
for all to authenticated using (private.is_repw_admin()) with check (private.is_repw_admin());

drop policy if exists "Admins manage data quality issues" on public.data_quality_issues;
create policy "Admins manage data quality issues" on public.data_quality_issues
for all to authenticated using (private.is_repw_admin()) with check (private.is_repw_admin());

drop policy if exists "Admins manage broken links" on public.broken_links;
create policy "Admins manage broken links" on public.broken_links
for all to authenticated using (private.is_repw_admin()) with check (private.is_repw_admin());

drop policy if exists "Admins manage duplicate candidates" on public.duplicate_candidates;
create policy "Admins manage duplicate candidates" on public.duplicate_candidates
for all to authenticated using (private.is_repw_admin()) with check (private.is_repw_admin());

drop policy if exists "Members manage own digest preferences" on public.member_digest_preferences;
create policy "Members manage own digest preferences" on public.member_digest_preferences
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Admins view digest preferences" on public.member_digest_preferences;
create policy "Admins view digest preferences" on public.member_digest_preferences
for select to authenticated using (private.is_repw_admin());

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.import_runs to authenticated;
grant select, insert, update, delete on public.import_errors to authenticated;
grant select, insert, update, delete on public.data_quality_issues to authenticated;
grant select, insert, update, delete on public.broken_links to authenticated;
grant select, insert, update, delete on public.duplicate_candidates to authenticated;
grant select, insert, update, delete on public.member_digest_preferences to authenticated;

