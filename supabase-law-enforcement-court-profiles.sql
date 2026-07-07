-- ============================================================
-- RepWatchr Law Enforcement, Badge, Court, and Prosecutor Profiles
-- ============================================================
-- Run after supabase-profile-claims.sql and supabase-profile-scorecards.sql.
-- This schema stores public-role metadata only. Do not store private home
-- addresses, family/minor details, harassment targets, or unsupported claims.

create table if not exists public.law_enforcement_profiles (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null,
  entity_slug text,
  agency_name text,
  agency_type text,
  rank_or_title text,
  jurisdiction text,
  state text,
  county text,
  city text,
  official_agency_url text,
  official_policy_url text,
  public_info_url text,
  current_status text default 'unknown' not null,
  source_count int default 0 not null,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  check (source_count >= 0),
  check (current_status in ('unknown', 'active', 'source_seeded', 'verified', 'needs_review', 'archived'))
);

create table if not exists public.court_official_profiles (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null,
  entity_slug text,
  court_name text,
  court_type text,
  role_title text,
  jurisdiction text,
  state text,
  county text,
  official_court_url text,
  public_docket_url text,
  current_status text default 'unknown' not null,
  source_count int default 0 not null,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  check (source_count >= 0),
  check (current_status in ('unknown', 'active', 'source_seeded', 'verified', 'needs_review', 'archived'))
);

create index if not exists idx_law_enforcement_profiles_entity on public.law_enforcement_profiles(entity_id);
create index if not exists idx_law_enforcement_profiles_slug on public.law_enforcement_profiles(entity_slug);
create index if not exists idx_law_enforcement_profiles_location on public.law_enforcement_profiles(state, county, city);
create index if not exists idx_law_enforcement_profiles_status on public.law_enforcement_profiles(current_status, updated_at desc);

create index if not exists idx_court_official_profiles_entity on public.court_official_profiles(entity_id);
create index if not exists idx_court_official_profiles_slug on public.court_official_profiles(entity_slug);
create index if not exists idx_court_official_profiles_location on public.court_official_profiles(state, county);
create index if not exists idx_court_official_profiles_status on public.court_official_profiles(current_status, updated_at desc);

alter table public.law_enforcement_profiles enable row level security;
alter table public.court_official_profiles enable row level security;

grant select on public.law_enforcement_profiles to anon, authenticated;
grant select on public.court_official_profiles to anon, authenticated;
grant insert, update, delete on public.law_enforcement_profiles to authenticated;
grant insert, update, delete on public.court_official_profiles to authenticated;

drop policy if exists "Public can read visible law enforcement profiles" on public.law_enforcement_profiles;
drop policy if exists "Admins can manage law enforcement profiles" on public.law_enforcement_profiles;
drop policy if exists "Public can read visible court official profiles" on public.court_official_profiles;
drop policy if exists "Admins can manage court official profiles" on public.court_official_profiles;

create policy "Public can read visible law enforcement profiles"
  on public.law_enforcement_profiles for select
  using (current_status in ('unknown', 'active', 'source_seeded', 'verified'));

create policy "Admins can manage law enforcement profiles"
  on public.law_enforcement_profiles for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Public can read visible court official profiles"
  on public.court_official_profiles for select
  using (current_status in ('unknown', 'active', 'source_seeded', 'verified'));

create policy "Admins can manage court official profiles"
  on public.court_official_profiles for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

drop trigger if exists set_law_enforcement_profiles_updated_at on public.law_enforcement_profiles;
create trigger set_law_enforcement_profiles_updated_at
  before update on public.law_enforcement_profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists set_court_official_profiles_updated_at on public.court_official_profiles;
create trigger set_court_official_profiles_updated_at
  before update on public.court_official_profiles
  for each row execute function public.handle_updated_at();

alter table public.profile_claims
  drop constraint if exists profile_claims_profile_type_check;

alter table public.profile_claims
  add constraint profile_claims_profile_type_check
  check (
    profile_type in (
      'school_board',
      'official',
      'attorney',
      'law_firm',
      'media_company',
      'journalist',
      'editor',
      'newsroom_leadership',
      'law_enforcement_agency',
      'sheriff',
      'constable',
      'police_chief',
      'public_safety_official',
      'agency_official',
      'judge',
      'prosecutor',
      'district_attorney',
      'court_official',
      'oversight_agency'
    )
  );

alter table public.profile_scorecard_votes
  drop constraint if exists profile_scorecard_votes_target_type_check;

alter table public.profile_scorecard_votes
  add constraint profile_scorecard_votes_target_type_check
  check (
    target_type in (
      'official',
      'school_board',
      'attorney',
      'law_firm',
      'bar_source',
      'media_company',
      'journalist',
      'editor',
      'newsroom_leadership',
      'law_enforcement_agency',
      'sheriff',
      'constable',
      'police_chief',
      'public_safety_official',
      'agency_official',
      'judge',
      'prosecutor',
      'district_attorney',
      'court_official',
      'oversight_agency'
    )
  );
