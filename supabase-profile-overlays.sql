-- ============================================================
-- RepWatchr Daily Profile Completion / Overlay Tables
-- ============================================================
-- Run after:
--   1. supabase-profile-claims.sql
--   2. supabase-superadmin-office.sql
--   3. supabase-social-monitoring.sql
--
-- These tables keep Git JSON as the public seed while Supabase carries the
-- daily live overlay: completion status, roll-call snapshots, source-backed
-- news/public-record items, and cron run logs.

create table if not exists public.profile_update_runs (
  id uuid primary key default gen_random_uuid(),
  scope text not null default 'federal_state_daily',
  status text not null default 'running' check (
    status in ('running', 'completed', 'completed_with_errors', 'failed')
  ),
  source_count integer not null default 0,
  inserted_count integer not null default 0,
  skipped_count integer not null default 0,
  error_count integer not null default 0,
  module_results jsonb not null default '[]'::jsonb,
  notes text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.profile_completion_snapshots (
  id uuid primary key default gen_random_uuid(),
  profile_type text not null check (
    profile_type in (
      'official',
      'school_board',
      'attorney',
      'law_firm',
      'media_company',
      'journalist',
      'editor',
      'law_enforcement_agency',
      'public_safety_official'
    )
  ),
  profile_id text not null,
  profile_name text not null,
  profile_path text not null,
  level text,
  state text,
  jurisdiction text,
  position text,
  completion_percent integer not null check (completion_percent between 0 and 100),
  priority text not null default 'yellow' check (priority in ('red', 'yellow', 'green')),
  is_complete boolean not null default false,
  loaded_items text[] not null default '{}',
  missing_items text[] not null default '{}',
  source_review_status text not null default 'needs_review' check (
    source_review_status in ('complete', 'needs_review')
  ),
  summary jsonb not null default '{}'::jsonb,
  last_static_review_at date,
  last_checked_at timestamptz not null default now(),
  run_id uuid references public.profile_update_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_type, profile_id)
);

create table if not exists public.profile_enrichment_items (
  id uuid primary key default gen_random_uuid(),
  profile_type text not null,
  profile_id text not null,
  profile_name text not null,
  profile_path text not null,
  category text not null check (
    category in ('news', 'public_record', 'controversy', 'lawsuit', 'ethics', 'scandal', 'funding', 'statement')
  ),
  title text not null check (char_length(title) between 1 and 300),
  summary text check (char_length(coalesce(summary, '')) <= 2000),
  source_url text not null,
  source_name text not null,
  source_tier text not null check (
    source_tier in ('official_record', 'named_news', 'other_public', 'weak_match')
  ),
  event_date timestamptz,
  status text not null default 'needs_review' check (
    status in ('auto_published', 'approved', 'needs_review', 'rejected', 'archived')
  ),
  source_hash text not null unique,
  run_id uuid references public.profile_update_runs(id) on delete set null,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vote_issue_rules (
  id uuid primary key default gen_random_uuid(),
  source_vote_id text not null unique,
  issue_label text not null,
  right_position text check (right_position in ('yea', 'nay')),
  weight integer not null default 1 check (weight between 1 and 10),
  rationale text not null check (char_length(rationale) between 1 and 2000),
  review_status text not null default 'needs_review' check (
    review_status in ('needs_review', 'approved', 'rejected', 'archived')
  ),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_vote_snapshots (
  id uuid primary key default gen_random_uuid(),
  profile_type text not null default 'official',
  profile_id text not null,
  profile_name text not null,
  source_vote_id text not null,
  chamber text,
  session text,
  roll_call text,
  vote_date date,
  issue text,
  question text,
  vote_type text,
  result text,
  vote_cast text,
  source_url text not null,
  source_xml_url text,
  source_hash text not null,
  rule_review_status text not null default 'unmapped' check (
    rule_review_status in ('unmapped', 'needs_review', 'approved', 'rejected')
  ),
  issue_label text,
  right_position text check (right_position in ('yea', 'nay')),
  ideology_weight integer,
  run_id uuid references public.profile_update_runs(id) on delete set null,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_type, profile_id, source_vote_id)
);

create index if not exists idx_profile_update_runs_started
  on public.profile_update_runs(started_at desc);
create index if not exists idx_profile_completion_priority
  on public.profile_completion_snapshots(priority, completion_percent, state);
create index if not exists idx_profile_completion_profile
  on public.profile_completion_snapshots(profile_type, profile_id);
create index if not exists idx_profile_enrichment_public
  on public.profile_enrichment_items(profile_type, profile_id, status, event_date desc);
create index if not exists idx_profile_enrichment_review
  on public.profile_enrichment_items(status, source_tier, created_at desc);
create index if not exists idx_profile_vote_snapshots_profile
  on public.profile_vote_snapshots(profile_type, profile_id, vote_date desc);
create index if not exists idx_profile_vote_snapshots_rule
  on public.profile_vote_snapshots(rule_review_status, vote_date desc);

alter table public.profile_update_runs enable row level security;
alter table public.profile_completion_snapshots enable row level security;
alter table public.profile_enrichment_items enable row level security;
alter table public.vote_issue_rules enable row level security;
alter table public.profile_vote_snapshots enable row level security;

drop policy if exists "Operators can read profile update runs" on public.profile_update_runs;
drop policy if exists "Public can read profile completion snapshots" on public.profile_completion_snapshots;
drop policy if exists "Operators can manage profile completion snapshots" on public.profile_completion_snapshots;
drop policy if exists "Public can read approved profile enrichment" on public.profile_enrichment_items;
drop policy if exists "Operators can manage profile enrichment" on public.profile_enrichment_items;
drop policy if exists "Public can read profile vote snapshots" on public.profile_vote_snapshots;
drop policy if exists "Operators can manage profile vote snapshots" on public.profile_vote_snapshots;
drop policy if exists "Public can read approved vote issue rules" on public.vote_issue_rules;
drop policy if exists "Operators can manage vote issue rules" on public.vote_issue_rules;

create policy "Operators can read profile update runs"
  on public.profile_update_runs for select
  to authenticated
  using (public.is_repw_operator());

create policy "Public can read profile completion snapshots"
  on public.profile_completion_snapshots for select
  using (true);

create policy "Operators can manage profile completion snapshots"
  on public.profile_completion_snapshots for all
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Public can read approved profile enrichment"
  on public.profile_enrichment_items for select
  using (status in ('auto_published', 'approved') or public.is_repw_operator());

create policy "Operators can manage profile enrichment"
  on public.profile_enrichment_items for all
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Public can read profile vote snapshots"
  on public.profile_vote_snapshots for select
  using (true);

create policy "Operators can manage profile vote snapshots"
  on public.profile_vote_snapshots for all
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Public can read approved vote issue rules"
  on public.vote_issue_rules for select
  using (review_status = 'approved' or public.is_repw_operator());

create policy "Operators can manage vote issue rules"
  on public.vote_issue_rules for all
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

drop trigger if exists set_profile_completion_snapshots_updated_at on public.profile_completion_snapshots;
create trigger set_profile_completion_snapshots_updated_at
  before update on public.profile_completion_snapshots
  for each row execute function public.handle_updated_at();

drop trigger if exists set_profile_enrichment_items_updated_at on public.profile_enrichment_items;
create trigger set_profile_enrichment_items_updated_at
  before update on public.profile_enrichment_items
  for each row execute function public.handle_updated_at();

drop trigger if exists set_vote_issue_rules_updated_at on public.vote_issue_rules;
create trigger set_vote_issue_rules_updated_at
  before update on public.vote_issue_rules
  for each row execute function public.handle_updated_at();

drop trigger if exists set_profile_vote_snapshots_updated_at on public.profile_vote_snapshots;
create trigger set_profile_vote_snapshots_updated_at
  before update on public.profile_vote_snapshots
  for each row execute function public.handle_updated_at();
