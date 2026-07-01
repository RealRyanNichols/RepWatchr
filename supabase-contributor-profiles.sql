-- ============================================================
-- RepWatchr Contributor Profiles, XP, Badges, and Rankings
-- ============================================================
-- Reputation only. No payment, bounty, or compensation workflow is created.
-- Run after supabase-profile-claims.sql and supabase-superadmin-office.sql.

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

grant execute on function public.is_repw_operator() to anon, authenticated;

do $$
begin
  create type public.contributor_level as enum (
    'source_runner',
    'meeting_reporter',
    'vote_hunter',
    'funding_tracker',
    'researcher',
    'fact_checker',
    'editor',
    'community_builder'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.contributor_contribution_kind as enum (
    'source_submission',
    'meeting_report',
    'vote_hunt',
    'funding_record',
    'research_note',
    'fact_check',
    'editorial_fix',
    'community_build'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.contributor_record_status as enum (
    'submitted',
    'needs_review',
    'accepted',
    'verified',
    'attached_to_profile',
    'rejected',
    'needs_more_info'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.contributor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  handle text unique check (handle is null or handle ~ '^[a-z0-9][a-z0-9_-]{2,38}$'),
  display_name text check (char_length(coalesce(display_name, '')) <= 120),
  public_bio text check (char_length(coalesce(public_bio, '')) <= 1000),
  county text check (char_length(coalesce(county, '')) <= 120),
  state text not null default 'TX' check (char_length(state) between 2 and 40),
  avatar_url text check (char_length(coalesce(avatar_url, '')) <= 1000),
  primary_level public.contributor_level not null default 'source_runner',
  public_profile_enabled boolean not null default false,
  reputation_status text not null default 'Building record'
    check (reputation_status in ('Building record', 'Verified contributor', 'High accuracy', 'Top county contributor', 'State leader', 'Under review')),
  total_xp integer not null default 0 check (total_xp >= 0),
  contribution_count integer not null default 0 check (contribution_count >= 0),
  accepted_sources_count integer not null default 0 check (accepted_sources_count >= 0),
  verified_contributions_count integer not null default 0 check (verified_contributions_count >= 0),
  useful_votes_count integer not null default 0 check (useful_votes_count >= 0),
  rejected_count integer not null default 0 check (rejected_count >= 0),
  accuracy_score numeric(5,2) not null default 100 check (accuracy_score between 0 and 100),
  last_contributed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create unique index if not exists idx_contributor_profiles_handle_lower
  on public.contributor_profiles(lower(handle))
  where handle is not null;

create index if not exists idx_contributor_profiles_public_rank
  on public.contributor_profiles(public_profile_enabled, total_xp desc, accuracy_score desc);

create index if not exists idx_contributor_profiles_location
  on public.contributor_profiles(state, county, total_xp desc)
  where public_profile_enabled = true;

create table if not exists public.contributor_records (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.contributor_profiles(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  kind public.contributor_contribution_kind not null,
  target_type text not null default 'record'
    check (target_type in ('official', 'school_board', 'race', 'vote', 'funding', 'meeting', 'issue', 'agency', 'court', 'judge', 'record')),
  target_id text check (char_length(coalesce(target_id, '')) <= 240),
  target_label text not null check (char_length(target_label) between 1 and 240),
  title text not null check (char_length(title) between 1 and 240),
  summary text not null check (char_length(summary) between 10 and 2500),
  source_url text check (char_length(coalesce(source_url, '')) <= 1200),
  source_date date,
  jurisdiction text check (char_length(coalesce(jurisdiction, '')) <= 180),
  county text check (char_length(coalesce(county, '')) <= 120),
  state text not null default 'TX' check (char_length(state) between 2 and 40),
  status public.contributor_record_status not null default 'submitted',
  xp_awarded integer not null default 0 check (xp_awarded >= 0),
  usefulness_score integer not null default 0 check (usefulness_score >= 0),
  accuracy_status text not null default 'unreviewed'
    check (accuracy_status in ('unreviewed', 'accurate', 'partially_accurate', 'inaccurate', 'needs_source')),
  reviewer_notes text check (char_length(coalesce(reviewer_notes, '')) <= 3000),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  attached_href text check (char_length(coalesce(attached_href, '')) <= 1000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_contributor_records_profile
  on public.contributor_records(profile_id, created_at desc);

create index if not exists idx_contributor_records_status
  on public.contributor_records(status, kind, created_at desc);

create index if not exists idx_contributor_records_location
  on public.contributor_records(state, county, kind, created_at desc);

create table if not exists public.contributor_xp_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.contributor_profiles(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  contribution_id uuid references public.contributor_records(id) on delete set null,
  event_type text not null check (char_length(event_type) between 1 and 80),
  xp_delta integer not null check (xp_delta between -1000 and 1000),
  reason text not null check (char_length(reason) between 1 and 500),
  created_by uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create index if not exists idx_contributor_xp_events_profile
  on public.contributor_xp_events(profile_id, created_at desc);

create table if not exists public.contributor_badges (
  badge_key text primary key check (badge_key ~ '^[a-z0-9_-]{3,80}$'),
  name text not null check (char_length(name) between 1 and 120),
  description text not null check (char_length(description) between 1 and 500),
  icon_label text not null default 'RW' check (char_length(icon_label) between 1 and 12),
  accent text not null default 'blue' check (accent in ('red', 'blue', 'gold', 'green', 'slate')),
  level public.contributor_level,
  xp_bonus integer not null default 0 check (xp_bonus >= 0),
  active boolean not null default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.contributor_badge_awards (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.contributor_profiles(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  badge_key text references public.contributor_badges(badge_key) on delete restrict not null,
  awarded_for_contribution_id uuid references public.contributor_records(id) on delete set null,
  awarded_by uuid references auth.users(id) on delete set null,
  reason text check (char_length(coalesce(reason, '')) <= 500),
  created_at timestamptz default now() not null,
  unique(profile_id, badge_key)
);

create index if not exists idx_contributor_badge_awards_profile
  on public.contributor_badge_awards(profile_id, created_at desc);

alter table public.contributor_profiles enable row level security;
alter table public.contributor_records enable row level security;
alter table public.contributor_xp_events enable row level security;
alter table public.contributor_badges enable row level security;
alter table public.contributor_badge_awards enable row level security;

grant usage on type public.contributor_level to anon, authenticated, service_role;
grant usage on type public.contributor_contribution_kind to anon, authenticated, service_role;
grant usage on type public.contributor_record_status to anon, authenticated, service_role;

grant select on public.contributor_profiles to anon, authenticated, service_role;
grant insert (user_id, handle, display_name, public_bio, county, state, avatar_url, primary_level, public_profile_enabled, metadata)
  on public.contributor_profiles to authenticated;
grant update (handle, display_name, public_bio, county, state, avatar_url, primary_level, public_profile_enabled, metadata, updated_at)
  on public.contributor_profiles to authenticated;
grant select, insert, update, delete on public.contributor_profiles to service_role;

grant select, insert, update, delete on public.contributor_records to authenticated, service_role;
grant select on public.contributor_records to anon;
grant select, insert, update, delete on public.contributor_xp_events to authenticated, service_role;
grant select on public.contributor_xp_events to anon;
grant select on public.contributor_badges to anon, authenticated, service_role;
grant insert, update, delete on public.contributor_badges to authenticated, service_role;
grant select, insert, update, delete on public.contributor_badge_awards to authenticated, service_role;
grant select on public.contributor_badge_awards to anon;

drop policy if exists "Public reads published contributor profiles" on public.contributor_profiles;
drop policy if exists "Users create own contributor profile" on public.contributor_profiles;
drop policy if exists "Users update own contributor profile" on public.contributor_profiles;
drop policy if exists "Operators manage contributor profiles" on public.contributor_profiles;
drop policy if exists "Public reads reviewed contributor records" on public.contributor_records;
drop policy if exists "Users read own contributor records" on public.contributor_records;
drop policy if exists "Users create own contributor records" on public.contributor_records;
drop policy if exists "Operators manage contributor records" on public.contributor_records;
drop policy if exists "Public reads visible XP events" on public.contributor_xp_events;
drop policy if exists "Users read own XP events" on public.contributor_xp_events;
drop policy if exists "Operators manage XP events" on public.contributor_xp_events;
drop policy if exists "Public reads active badges" on public.contributor_badges;
drop policy if exists "Operators manage badges" on public.contributor_badges;
drop policy if exists "Public reads visible badge awards" on public.contributor_badge_awards;
drop policy if exists "Users read own badge awards" on public.contributor_badge_awards;
drop policy if exists "Operators manage badge awards" on public.contributor_badge_awards;

create policy "Public reads published contributor profiles"
  on public.contributor_profiles for select
  to anon, authenticated
  using (public_profile_enabled = true or (select auth.uid()) = user_id or public.is_repw_operator());

create policy "Users create own contributor profile"
  on public.contributor_profiles for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update own contributor profile"
  on public.contributor_profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Operators manage contributor profiles"
  on public.contributor_profiles for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Public reads reviewed contributor records"
  on public.contributor_records for select
  to anon, authenticated
  using (
    status in ('accepted', 'verified', 'attached_to_profile')
    and exists (
      select 1
      from public.contributor_profiles cp
      where cp.id = profile_id
        and cp.public_profile_enabled = true
    )
  );

create policy "Users read own contributor records"
  on public.contributor_records for select
  to authenticated
  using ((select auth.uid()) = user_id or public.is_repw_operator());

create policy "Users create own contributor records"
  on public.contributor_records for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.contributor_profiles cp
      where cp.id = profile_id
        and cp.user_id = (select auth.uid())
    )
  );

create policy "Operators manage contributor records"
  on public.contributor_records for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Public reads visible XP events"
  on public.contributor_xp_events for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.contributor_profiles cp
      where cp.id = profile_id
        and cp.public_profile_enabled = true
    )
  );

create policy "Users read own XP events"
  on public.contributor_xp_events for select
  to authenticated
  using ((select auth.uid()) = user_id or public.is_repw_operator());

create policy "Operators manage XP events"
  on public.contributor_xp_events for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Public reads active badges"
  on public.contributor_badges for select
  to anon, authenticated
  using (active = true or public.is_repw_operator());

create policy "Operators manage badges"
  on public.contributor_badges for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Public reads visible badge awards"
  on public.contributor_badge_awards for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.contributor_profiles cp
      where cp.id = profile_id
        and cp.public_profile_enabled = true
    )
  );

create policy "Users read own badge awards"
  on public.contributor_badge_awards for select
  to authenticated
  using ((select auth.uid()) = user_id or public.is_repw_operator());

create policy "Operators manage badge awards"
  on public.contributor_badge_awards for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

drop trigger if exists set_contributor_profiles_updated_at on public.contributor_profiles;
create trigger set_contributor_profiles_updated_at
  before update on public.contributor_profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists set_contributor_records_updated_at on public.contributor_records;
create trigger set_contributor_records_updated_at
  before update on public.contributor_records
  for each row execute function public.handle_updated_at();

drop trigger if exists set_contributor_badges_updated_at on public.contributor_badges;
create trigger set_contributor_badges_updated_at
  before update on public.contributor_badges
  for each row execute function public.handle_updated_at();

insert into public.contributor_badges (badge_key, name, description, icon_label, accent, level, xp_bonus)
values
  ('first_receipt', 'First Receipt', 'Submitted the first contribution record for review.', '1', 'blue', 'source_runner', 0),
  ('source_runner_5', 'Source Runner', 'Five accepted source records attached or accepted.', 'SRC', 'red', 'source_runner', 25),
  ('meeting_reporter_3', 'Meeting Reporter', 'Three meeting, agenda, minutes, or clip records submitted.', 'MTG', 'gold', 'meeting_reporter', 20),
  ('vote_hunter_10', 'Vote Hunter', 'Ten vote records found, checked, or attached.', 'VOTE', 'blue', 'vote_hunter', 35),
  ('funding_tracker_5', 'Funding Tracker', 'Five campaign-finance, PAC, donor, or filing records submitted.', '$', 'green', 'funding_tracker', 30),
  ('verified_fact_checker', 'Verified Fact Checker', 'Repeatedly submitted accurate corrections or source checks.', 'CHK', 'slate', 'fact_checker', 25),
  ('county_builder', 'County Builder', 'Built useful records inside a county lane.', 'CTY', 'gold', 'community_builder', 20),
  ('no_paid_rewards', 'Reputation Only', 'RepWatchr recognizes reputation. Contributors are not paid for records.', 'REP', 'slate', null, 0)
on conflict (badge_key) do update
set name = excluded.name,
    description = excluded.description,
    icon_label = excluded.icon_label,
    accent = excluded.accent,
    level = excluded.level,
    xp_bonus = excluded.xp_bonus,
    active = true,
    updated_at = now();

create or replace view public.contributor_public_leaderboard
with (security_invoker = true)
as
select
  cp.id,
  cp.handle,
  cp.display_name,
  cp.public_bio,
  cp.county,
  cp.state,
  cp.avatar_url,
  cp.primary_level,
  cp.reputation_status,
  cp.total_xp,
  cp.contribution_count,
  cp.accepted_sources_count,
  cp.verified_contributions_count,
  cp.useful_votes_count,
  cp.rejected_count,
  cp.accuracy_score,
  cp.last_contributed_at,
  dense_rank() over (order by cp.total_xp desc, cp.verified_contributions_count desc, cp.accuracy_score desc, cp.created_at asc) as overall_rank,
  dense_rank() over (partition by cp.state order by cp.total_xp desc, cp.verified_contributions_count desc, cp.accuracy_score desc, cp.created_at asc) as state_rank,
  dense_rank() over (partition by cp.state, cp.county order by cp.total_xp desc, cp.verified_contributions_count desc, cp.accuracy_score desc, cp.created_at asc) as county_rank
from public.contributor_profiles cp
where cp.public_profile_enabled = true
  and cp.handle is not null;

create or replace view public.contributor_county_rankings
with (security_invoker = true)
as
select
  cp.state,
  cp.county,
  count(*)::int as contributor_count,
  sum(cp.total_xp)::int as total_xp,
  sum(cp.accepted_sources_count)::int as accepted_sources_count,
  sum(cp.verified_contributions_count)::int as verified_contributions_count,
  round(avg(cp.accuracy_score), 2) as average_accuracy,
  max(cp.last_contributed_at) as last_contributed_at,
  dense_rank() over (partition by cp.state order by sum(cp.total_xp) desc, sum(cp.verified_contributions_count) desc, round(avg(cp.accuracy_score), 2) desc) as state_county_rank
from public.contributor_profiles cp
where cp.public_profile_enabled = true
  and cp.county is not null
group by cp.state, cp.county;

create or replace view public.contributor_state_rankings
with (security_invoker = true)
as
select
  cp.state,
  count(*)::int as contributor_count,
  sum(cp.total_xp)::int as total_xp,
  sum(cp.accepted_sources_count)::int as accepted_sources_count,
  sum(cp.verified_contributions_count)::int as verified_contributions_count,
  round(avg(cp.accuracy_score), 2) as average_accuracy,
  max(cp.last_contributed_at) as last_contributed_at,
  dense_rank() over (order by sum(cp.total_xp) desc, sum(cp.verified_contributions_count) desc, round(avg(cp.accuracy_score), 2) desc) as national_rank
from public.contributor_profiles cp
where cp.public_profile_enabled = true
group by cp.state;

grant select on public.contributor_public_leaderboard to anon, authenticated, service_role;
grant select on public.contributor_county_rankings to anon, authenticated, service_role;
grant select on public.contributor_state_rankings to anon, authenticated, service_role;
