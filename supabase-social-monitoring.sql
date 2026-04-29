-- ============================================================
-- RepWatchr Public Social Account and Statement Monitoring
-- ============================================================
-- Stores public-source links and reviewed statement snapshots.
-- This schema does not enable scraping by itself. A compliant collector must
-- respect platform terms, rate limits, public-source rules, and admin review.

create table if not exists public.profile_social_accounts (
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
      'newsroom_leadership',
      'tribal_government',
      'public_agency'
    )
  ),
  profile_id text not null,
  profile_name text not null,
  platform text not null check (platform in ('x', 'facebook', 'instagram', 'youtube', 'tiktok', 'website', 'rss', 'press_release')),
  handle text,
  public_url text not null,
  source_url text,
  is_official boolean not null default false,
  status text not null default 'needs_review' check (status in ('needs_review', 'approved', 'rejected', 'archived')),
  last_checked_at timestamptz,
  reviewer_notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(profile_type, profile_id, platform, public_url)
);

create table if not exists public.public_statement_snapshots (
  id uuid primary key default gen_random_uuid(),
  social_account_id uuid references public.profile_social_accounts(id) on delete cascade not null,
  profile_type text not null,
  profile_id text not null,
  platform text not null,
  external_id text,
  statement_url text not null,
  statement_date timestamptz,
  excerpt text check (char_length(coalesce(excerpt, '')) <= 1000),
  context_note text check (char_length(coalesce(context_note, '')) <= 2000),
  review_status text not null default 'needs_review' check (review_status in ('needs_review', 'approved', 'rejected', 'archived')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(platform, statement_url)
);

create table if not exists public.social_monitoring_jobs (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('x', 'facebook', 'instagram', 'youtube', 'tiktok', 'website', 'rss', 'press_release')),
  label text not null,
  query text,
  status text not null default 'paused' check (status in ('paused', 'ready', 'running', 'error', 'archived')),
  last_run_at timestamptz,
  next_run_at timestamptz,
  last_error text,
  policy_note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_profile_social_accounts_profile on public.profile_social_accounts(profile_type, profile_id);
create index if not exists idx_profile_social_accounts_status on public.profile_social_accounts(status, platform);
create index if not exists idx_public_statement_snapshots_profile on public.public_statement_snapshots(profile_type, profile_id, review_status);
create index if not exists idx_public_statement_snapshots_date on public.public_statement_snapshots(statement_date desc);
create index if not exists idx_social_monitoring_jobs_status on public.social_monitoring_jobs(status, platform);

alter table public.profile_social_accounts enable row level security;
alter table public.public_statement_snapshots enable row level security;
alter table public.social_monitoring_jobs enable row level security;

drop policy if exists "Public can read approved social accounts" on public.profile_social_accounts;
drop policy if exists "Admins can manage social accounts" on public.profile_social_accounts;
drop policy if exists "Public can read approved statement snapshots" on public.public_statement_snapshots;
drop policy if exists "Admins can manage statement snapshots" on public.public_statement_snapshots;
drop policy if exists "Admins can manage social monitoring jobs" on public.social_monitoring_jobs;

create policy "Public can read approved social accounts"
  on public.profile_social_accounts for select
  using (status = 'approved' or public.is_repw_admin());

create policy "Admins can manage social accounts"
  on public.profile_social_accounts for all
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Public can read approved statement snapshots"
  on public.public_statement_snapshots for select
  using (review_status = 'approved' or public.is_repw_admin());

create policy "Admins can manage statement snapshots"
  on public.public_statement_snapshots for all
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Admins can manage social monitoring jobs"
  on public.social_monitoring_jobs for all
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

drop trigger if exists set_profile_social_accounts_updated_at on public.profile_social_accounts;
create trigger set_profile_social_accounts_updated_at
  before update on public.profile_social_accounts
  for each row execute function public.handle_updated_at();

drop trigger if exists set_public_statement_snapshots_updated_at on public.public_statement_snapshots;
create trigger set_public_statement_snapshots_updated_at
  before update on public.public_statement_snapshots
  for each row execute function public.handle_updated_at();

drop trigger if exists set_social_monitoring_jobs_updated_at on public.social_monitoring_jobs;
create trigger set_social_monitoring_jobs_updated_at
  before update on public.social_monitoring_jobs
  for each row execute function public.handle_updated_at();
