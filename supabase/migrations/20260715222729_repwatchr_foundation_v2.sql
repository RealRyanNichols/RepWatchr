-- RepWatchr foundation v2: voter-integrity and server-only analytics hardening.
--
-- This migration is intentionally fail closed:
--   * every legacy profile is returned to needs_review;
--   * legacy vote rows are retained, but are not counted as verified votes;
--   * authenticated clients cannot create or modify trusted profile geography;
--   * vote identity, geography, verification epoch, and grade score are stamped
--     by Postgres before RLS validates the row;
--   * analytics storage is reachable only by service_role.
--
-- Apply the database migration before deploying UI that describes the new
-- verification flow. Do not mark a profile verified until a real verification
-- process has reviewed both identity and geography.

begin;

create extension if not exists pgcrypto;
create schema if not exists private;
-- Do not change schema-level USAGE here: other RepWatchr RLS helpers in the
-- private schema intentionally grant authenticated execution. Each function
-- created below is locked down individually.

-- ---------------------------------------------------------------------------
-- Trusted voter profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  state text not null default 'TX',
  county text not null,
  district text,
  verified boolean not null default false,
  verification_status text not null default 'needs_review',
  verified_at timestamptz,
  geography_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists state text,
  add column if not exists verification_status text,
  add column if not exists verified_at timestamptz,
  add column if not exists geography_verified_at timestamptz;

-- A raw SHA-256 hash of an eight-digit ID remains enumerable. Remove both the
-- collection target and all previously stored hashes.
alter table public.profiles drop column if exists dl_hash;

update public.profiles
set state = coalesce(nullif(upper(btrim(state)), ''), 'TX'),
    verified = false,
    verification_status = 'needs_review',
    verified_at = null,
    geography_verified_at = null,
    updated_at = now();

alter table public.profiles
  alter column state set default 'TX',
  alter column state set not null,
  alter column verified set default false,
  alter column verified set not null,
  alter column verification_status set default 'needs_review',
  alter column verification_status set not null;

alter table public.profiles
  drop constraint if exists profiles_state_shape_check,
  drop constraint if exists profiles_verification_status_check,
  drop constraint if exists profiles_verification_state_check;

alter table public.profiles
  add constraint profiles_state_shape_check
    check (state ~ '^[A-Z]{2}$'),
  add constraint profiles_verification_status_check
    check (verification_status in ('needs_review', 'verified', 'rejected', 'revoked')),
  add constraint profiles_verification_state_check
    check (
      (
        verified = true
        and verification_status = 'verified'
        and verified_at is not null
        and geography_verified_at is not null
      )
      or
      (
        verified = false
        and verification_status <> 'verified'
        and verified_at is null
        and geography_verified_at is null
      )
    );

create index if not exists idx_profiles_user_id on public.profiles(user_id);
create index if not exists idx_profiles_verification_status on public.profiles(verification_status);

create or replace function private.repw_enforce_profile_verification_state()
returns trigger
language plpgsql
security invoker
set search_path = public, private, pg_temp
as $$
begin
  -- Legacy owner/operator bootstrap code used to set only verified=true. Keep
  -- those role/bootstrap flows working, but fail the voter claim closed unless
  -- a trusted process supplies the complete verified state in one statement.
  if new.verified = true
     and new.verification_status = 'verified'
     and new.verified_at is not null
     and new.geography_verified_at is not null then
    return new;
  end if;

  new.verified := false;
  if new.verification_status = 'verified' then
    new.verification_status := 'needs_review';
  end if;
  new.verified_at := null;
  new.geography_verified_at := null;
  return new;
end;
$$;

create or replace function private.repw_lock_verified_geography()
returns trigger
language plpgsql
security invoker
set search_path = public, private, pg_temp
as $$
begin
  if tg_op = 'UPDATE'
     and (
       new.state is distinct from old.state
       or new.county is distinct from old.county
       or new.district is distinct from old.district
     )
     and new.verification_status = 'verified'
     and (
       new.verified_at is not distinct from old.verified_at
       or new.geography_verified_at is not distinct from old.geography_verified_at
     ) then
    raise exception using
      errcode = '23514',
      message = 'Verified geography changes require a new identity and geography verification timestamp.';
  end if;

  return new;
end;
$$;

revoke all on function private.repw_enforce_profile_verification_state() from public, anon, authenticated;
revoke all on function private.repw_lock_verified_geography() from public, anon, authenticated;

drop trigger if exists repw_00_enforce_profile_verification_state on public.profiles;
create trigger repw_00_enforce_profile_verification_state
  before insert or update on public.profiles
  for each row execute function private.repw_enforce_profile_verification_state();

drop trigger if exists repw_lock_verified_geography on public.profiles;
create trigger repw_lock_verified_geography
  before update on public.profiles
  for each row execute function private.repw_lock_verified_geography();

-- ---------------------------------------------------------------------------
-- Vote storage with a common trusted-voter stamp
-- ---------------------------------------------------------------------------

create table if not exists public.citizen_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  official_id text not null,
  vote text not null check (vote in ('approve', 'disapprove')),
  county text not null,
  voter_state text,
  voter_county text,
  voter_district text,
  verification_status_at_vote text not null default 'needs_review',
  voter_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, official_id)
);

alter table public.citizen_votes
  add column if not exists voter_state text,
  add column if not exists voter_county text,
  add column if not exists voter_district text,
  add column if not exists verification_status_at_vote text not null default 'needs_review',
  add column if not exists voter_verified_at timestamptz;

create table if not exists public.citizen_grades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  official_id text not null,
  grade text not null check (grade in ('A', 'B', 'C', 'D', 'F')),
  score integer not null,
  county text not null,
  voter_state text,
  voter_county text,
  voter_district text,
  verification_status_at_vote text not null default 'needs_review',
  voter_verified_at timestamptz,
  rationale text check (rationale is null or char_length(rationale) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, official_id)
);

alter table public.citizen_grades
  add column if not exists score integer,
  add column if not exists voter_state text,
  add column if not exists voter_county text,
  add column if not exists voter_district text,
  add column if not exists verification_status_at_vote text not null default 'needs_review',
  add column if not exists voter_verified_at timestamptz;

create table if not exists public.profile_scorecard_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null,
  target_id text not null,
  target_name text not null,
  target_path text not null,
  grade text not null check (grade in ('A', 'B', 'C', 'D', 'F')),
  score integer not null,
  county text not null,
  voter_scope text not null default 'verified_unknown',
  voter_state text,
  voter_county text,
  voter_district text,
  verification_status_at_vote text not null default 'needs_review',
  voter_verified_at timestamptz,
  would_vote_again text,
  voted_for_last_time text,
  approval_after_vote text,
  top_issue text,
  rationale text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, target_type, target_id)
);

alter table public.profile_scorecard_votes
  add column if not exists voter_scope text not null default 'verified_unknown',
  add column if not exists voter_state text,
  add column if not exists voter_county text,
  add column if not exists voter_district text,
  add column if not exists verification_status_at_vote text not null default 'needs_review',
  add column if not exists voter_verified_at timestamptz;

-- Preserve legacy rows for audit/user deletion, but never present them as
-- verified. A verified user must explicitly save again after verification.
update public.citizen_votes
set verification_status_at_vote = 'needs_review',
    voter_verified_at = null,
    voter_state = null,
    voter_county = null,
    voter_district = null;

update public.citizen_grades
set score = case grade
      when 'A' then 100
      when 'B' then 80
      when 'C' then 60
      when 'D' then 40
      when 'F' then 0
    end,
    verification_status_at_vote = 'needs_review',
    voter_verified_at = null,
    voter_state = null,
    voter_county = null,
    voter_district = null;

update public.profile_scorecard_votes
set score = case grade
      when 'A' then 100
      when 'B' then 80
      when 'C' then 60
      when 'D' then 40
      when 'F' then 0
    end,
    voter_scope = 'verified_unknown',
    verification_status_at_vote = 'needs_review',
    voter_verified_at = null,
    voter_state = null,
    voter_county = null,
    voter_district = null;

alter table public.citizen_grades alter column score set not null;

alter table public.citizen_votes
  drop constraint if exists citizen_votes_verification_status_at_vote_check;
alter table public.citizen_votes
  add constraint citizen_votes_verification_status_at_vote_check
    check (verification_status_at_vote in ('needs_review', 'verified'));

alter table public.citizen_grades
  drop constraint if exists citizen_grades_score_exact_check,
  drop constraint if exists citizen_grades_verification_status_at_vote_check;
alter table public.citizen_grades
  add constraint citizen_grades_score_exact_check
    check (
      score = case grade
        when 'A' then 100
        when 'B' then 80
        when 'C' then 60
        when 'D' then 40
        when 'F' then 0
      end
    ),
  add constraint citizen_grades_verification_status_at_vote_check
    check (verification_status_at_vote in ('needs_review', 'verified'));

alter table public.profile_scorecard_votes
  drop constraint if exists profile_scorecard_votes_score_exact_check,
  drop constraint if exists profile_scorecard_votes_verification_status_at_vote_check;
alter table public.profile_scorecard_votes
  add constraint profile_scorecard_votes_score_exact_check
    check (
      score = case grade
        when 'A' then 100
        when 'B' then 80
        when 'C' then 60
        when 'D' then 40
        when 'F' then 0
      end
    ),
  add constraint profile_scorecard_votes_verification_status_at_vote_check
    check (verification_status_at_vote in ('needs_review', 'verified'));

create index if not exists idx_citizen_votes_official on public.citizen_votes(official_id);
create index if not exists idx_citizen_votes_official_county on public.citizen_votes(official_id, county);
create index if not exists idx_citizen_votes_user on public.citizen_votes(user_id);
create index if not exists idx_citizen_grades_official on public.citizen_grades(official_id);
create index if not exists idx_citizen_grades_official_county on public.citizen_grades(official_id, county);
create index if not exists idx_citizen_grades_user on public.citizen_grades(user_id);
create index if not exists idx_profile_scorecard_votes_target on public.profile_scorecard_votes(target_type, target_id);
create index if not exists idx_profile_scorecard_votes_target_county on public.profile_scorecard_votes(target_type, target_id, county);
create index if not exists idx_profile_scorecard_votes_target_scope on public.profile_scorecard_votes(target_type, target_id, voter_scope);
create index if not exists idx_profile_scorecard_votes_user on public.profile_scorecard_votes(user_id, updated_at desc);

create or replace function private.repw_stamp_verified_voter()
returns trigger
language plpgsql
security invoker
set search_path = public, private, auth, pg_temp
as $$
declare
  actor_user_id uuid;
  trusted_state text;
  trusted_county text;
  trusted_district text;
  trusted_verified_at timestamptz;
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    actor_user_id := new.user_id;
  else
    actor_user_id := auth.uid();
  end if;

  if actor_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'A signed-in verified voter is required.';
  end if;

  select p.state, p.county, p.district, p.verified_at
    into trusted_state, trusted_county, trusted_district, trusted_verified_at
  from public.profiles p
  where p.user_id = actor_user_id
    and p.verified = true
    and p.verification_status = 'verified'
    and p.verified_at is not null
    and p.geography_verified_at is not null;

  if not found then
    raise exception using
      errcode = '42501',
      message = 'Voting remains locked until identity and geography verification are complete.';
  end if;

  new.user_id := actor_user_id;
  new.county := trusted_county;
  new.voter_state := trusted_state;
  new.voter_county := trusted_county;
  new.voter_district := trusted_district;
  new.verification_status_at_vote := 'verified';
  new.voter_verified_at := trusted_verified_at;

  -- Target geography is not canonical in Postgres yet. Keep this honest rather
  -- than accepting a client assertion that a voter is in-district.
  if tg_table_name = 'profile_scorecard_votes' then
    new.voter_scope := 'verified_unknown';
  end if;

  return new;
end;
$$;

create or replace function private.repw_stamp_exact_grade_score()
returns trigger
language plpgsql
security invoker
set search_path = public, private, pg_temp
as $$
begin
  new.grade := upper(new.grade);
  new.score := case new.grade
    when 'A' then 100
    when 'B' then 80
    when 'C' then 60
    when 'D' then 40
    when 'F' then 0
    else null
  end;

  if new.score is null then
    raise exception using
      errcode = '23514',
      message = 'Grade must be A, B, C, D, or F.';
  end if;

  return new;
end;
$$;

revoke all on function private.repw_stamp_verified_voter() from public, anon, authenticated;
revoke all on function private.repw_stamp_exact_grade_score() from public, anon, authenticated;

drop trigger if exists repw_10_stamp_verified_voter on public.citizen_votes;
create trigger repw_10_stamp_verified_voter
  before insert or update on public.citizen_votes
  for each row execute function private.repw_stamp_verified_voter();

drop trigger if exists repw_10_stamp_verified_voter on public.citizen_grades;
create trigger repw_10_stamp_verified_voter
  before insert or update on public.citizen_grades
  for each row execute function private.repw_stamp_verified_voter();

drop trigger if exists repw_20_stamp_exact_grade_score on public.citizen_grades;
create trigger repw_20_stamp_exact_grade_score
  before insert or update on public.citizen_grades
  for each row execute function private.repw_stamp_exact_grade_score();

drop trigger if exists repw_10_stamp_verified_voter on public.profile_scorecard_votes;
create trigger repw_10_stamp_verified_voter
  before insert or update on public.profile_scorecard_votes
  for each row execute function private.repw_stamp_verified_voter();

drop trigger if exists repw_20_stamp_exact_grade_score on public.profile_scorecard_votes;
create trigger repw_20_stamp_exact_grade_score
  before insert or update on public.profile_scorecard_votes
  for each row execute function private.repw_stamp_exact_grade_score();

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists set_citizen_votes_updated_at on public.citizen_votes;
create trigger set_citizen_votes_updated_at
  before update on public.citizen_votes
  for each row execute function public.handle_updated_at();

drop trigger if exists set_citizen_grades_updated_at on public.citizen_grades;
create trigger set_citizen_grades_updated_at
  before update on public.citizen_grades
  for each row execute function public.handle_updated_at();

drop trigger if exists set_profile_scorecard_votes_updated_at on public.profile_scorecard_votes;
create trigger set_profile_scorecard_votes_updated_at
  before update on public.profile_scorecard_votes
  for each row execute function public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: profile truth is server-managed; verified users may manage only their
-- own votes. Unverified users may still delete legacy rows they own.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.citizen_votes enable row level security;
alter table public.citizen_grades enable row level security;
alter table public.profile_scorecard_votes enable row level security;

do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'citizen_votes', 'citizen_grades', 'profile_scorecard_votes')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  end loop;
end;
$$;

create policy "Users can read own trusted profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read own citizen votes"
  on public.citizen_votes for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Verified users can insert own citizen votes"
  on public.citizen_votes for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid())
        and p.verified = true
        and p.verification_status = 'verified'
        and p.verified_at is not null
        and p.geography_verified_at is not null
        and p.county = citizen_votes.county
    )
  );

create policy "Verified users can update own citizen votes"
  on public.citizen_votes for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid())
        and p.verified = true
        and p.verification_status = 'verified'
        and p.verified_at is not null
        and p.geography_verified_at is not null
        and p.county = citizen_votes.county
    )
  );

create policy "Users can delete own citizen votes"
  on public.citizen_votes for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read own citizen grades"
  on public.citizen_grades for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Verified users can insert own citizen grades"
  on public.citizen_grades for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid())
        and p.verified = true
        and p.verification_status = 'verified'
        and p.verified_at is not null
        and p.geography_verified_at is not null
        and p.county = citizen_grades.county
    )
  );

create policy "Verified users can update own citizen grades"
  on public.citizen_grades for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid())
        and p.verified = true
        and p.verification_status = 'verified'
        and p.verified_at is not null
        and p.geography_verified_at is not null
        and p.county = citizen_grades.county
    )
  );

create policy "Users can delete own citizen grades"
  on public.citizen_grades for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read own profile scorecard votes"
  on public.profile_scorecard_votes for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Verified users can insert own profile scorecard votes"
  on public.profile_scorecard_votes for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid())
        and p.verified = true
        and p.verification_status = 'verified'
        and p.verified_at is not null
        and p.geography_verified_at is not null
        and p.county = profile_scorecard_votes.county
    )
  );

create policy "Verified users can update own profile scorecard votes"
  on public.profile_scorecard_votes for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid())
        and p.verified = true
        and p.verification_status = 'verified'
        and p.verified_at is not null
        and p.geography_verified_at is not null
        and p.county = profile_scorecard_votes.county
    )
  );

create policy "Users can delete own profile scorecard votes"
  on public.profile_scorecard_votes for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.citizen_votes from public, anon, authenticated;
revoke all on table public.citizen_grades from public, anon, authenticated;
revoke all on table public.profile_scorecard_votes from public, anon, authenticated;

grant select on table public.profiles to authenticated;
grant select, insert, update, delete on table public.citizen_votes to authenticated;
grant select, insert, update, delete on table public.citizen_grades to authenticated;
grant select, insert, update, delete on table public.profile_scorecard_votes to authenticated;

grant all privileges on table public.profiles to service_role;
grant all privileges on table public.citizen_votes to service_role;
grant all privileges on table public.citizen_grades to service_role;
grant all privileges on table public.profile_scorecard_votes to service_role;

-- ---------------------------------------------------------------------------
-- Server-readable aggregate views. V2 voting remains feature-gated until a
-- privacy-thresholded public snapshot layer is deployed. SECURITY INVOKER
-- also prevents these views from bypassing base-table RLS.
-- ---------------------------------------------------------------------------

create or replace view public.approval_ratings
with (security_barrier = true, security_invoker = true)
as
select
  v.official_id,
  count(*) as total_votes,
  count(*) filter (where v.vote = 'approve') as approve_count,
  count(*) filter (where v.vote = 'disapprove') as disapprove_count,
  round(
    (count(*) filter (where v.vote = 'approve'))::numeric / nullif(count(*), 0) * 100,
    1
  ) as approval_percentage
from public.citizen_votes v
join public.profiles p on p.user_id = v.user_id
where v.verification_status_at_vote = 'verified'
  and v.voter_verified_at = p.verified_at
  and p.verified = true
  and p.verification_status = 'verified'
group by v.official_id;

create or replace view public.approval_ratings_by_county
with (security_barrier = true, security_invoker = true)
as
select
  v.official_id,
  v.voter_county as county,
  count(*) as total_votes,
  count(*) filter (where v.vote = 'approve') as approve_count,
  count(*) filter (where v.vote = 'disapprove') as disapprove_count,
  round(
    (count(*) filter (where v.vote = 'approve'))::numeric / nullif(count(*), 0) * 100,
    1
  ) as approval_percentage
from public.citizen_votes v
join public.profiles p on p.user_id = v.user_id
where v.verification_status_at_vote = 'verified'
  and v.voter_verified_at = p.verified_at
  and p.verified = true
  and p.verification_status = 'verified'
group by v.official_id, v.voter_county;

create or replace view public.citizen_grade_summary
with (security_barrier = true, security_invoker = true)
as
select
  v.official_id,
  count(*) as total_grades,
  count(*) filter (where v.grade = 'A') as a_count,
  count(*) filter (where v.grade = 'B') as b_count,
  count(*) filter (where v.grade = 'C') as c_count,
  count(*) filter (where v.grade = 'D') as d_count,
  count(*) filter (where v.grade = 'F') as f_count,
  round(
    (
      4 * count(*) filter (where v.grade = 'A')
      + 3 * count(*) filter (where v.grade = 'B')
      + 2 * count(*) filter (where v.grade = 'C')
      + count(*) filter (where v.grade = 'D')
    )::numeric / nullif(count(*), 0),
    2
  ) as gpa
from public.citizen_grades v
join public.profiles p on p.user_id = v.user_id
where v.verification_status_at_vote = 'verified'
  and v.voter_verified_at = p.verified_at
  and p.verified = true
  and p.verification_status = 'verified'
group by v.official_id;

create or replace view public.citizen_grade_summary_by_county
with (security_barrier = true, security_invoker = true)
as
select
  v.official_id,
  v.voter_county as county,
  count(*) as total_grades,
  count(*) filter (where v.grade = 'A') as a_count,
  count(*) filter (where v.grade = 'B') as b_count,
  count(*) filter (where v.grade = 'C') as c_count,
  count(*) filter (where v.grade = 'D') as d_count,
  count(*) filter (where v.grade = 'F') as f_count,
  round(
    (
      4 * count(*) filter (where v.grade = 'A')
      + 3 * count(*) filter (where v.grade = 'B')
      + 2 * count(*) filter (where v.grade = 'C')
      + count(*) filter (where v.grade = 'D')
    )::numeric / nullif(count(*), 0),
    2
  ) as gpa
from public.citizen_grades v
join public.profiles p on p.user_id = v.user_id
where v.verification_status_at_vote = 'verified'
  and v.voter_verified_at = p.verified_at
  and p.verified = true
  and p.verification_status = 'verified'
group by v.official_id, v.voter_county;

create or replace view public.profile_scorecard_summary
with (security_barrier = true, security_invoker = true)
as
select
  v.target_type,
  v.target_id,
  max(v.target_name) as target_name,
  max(v.target_path) as target_path,
  count(*) as total_votes,
  count(*) filter (where v.grade = 'A') as a_count,
  count(*) filter (where v.grade = 'B') as b_count,
  count(*) filter (where v.grade = 'C') as c_count,
  count(*) filter (where v.grade = 'D') as d_count,
  count(*) filter (where v.grade = 'F') as f_count,
  round(avg(v.score)::numeric, 1) as average_score,
  max(v.updated_at) as last_vote_at
from public.profile_scorecard_votes v
join public.profiles p on p.user_id = v.user_id
where v.verification_status_at_vote = 'verified'
  and v.voter_verified_at = p.verified_at
  and p.verified = true
  and p.verification_status = 'verified'
group by v.target_type, v.target_id;

create or replace view public.profile_scorecard_summary_by_county
with (security_barrier = true, security_invoker = true)
as
select
  v.target_type,
  v.target_id,
  v.voter_county as county,
  count(*) as total_votes,
  count(*) filter (where v.grade = 'A') as a_count,
  count(*) filter (where v.grade = 'B') as b_count,
  count(*) filter (where v.grade = 'C') as c_count,
  count(*) filter (where v.grade = 'D') as d_count,
  count(*) filter (where v.grade = 'F') as f_count,
  round(avg(v.score)::numeric, 1) as average_score,
  max(v.updated_at) as last_vote_at
from public.profile_scorecard_votes v
join public.profiles p on p.user_id = v.user_id
where v.verification_status_at_vote = 'verified'
  and v.voter_verified_at = p.verified_at
  and p.verified = true
  and p.verification_status = 'verified'
group by v.target_type, v.target_id, v.voter_county;

create or replace view public.profile_scorecard_summary_by_scope
with (security_barrier = true, security_invoker = true)
as
select
  v.target_type,
  v.target_id,
  v.voter_scope,
  count(*) as total_votes,
  count(*) filter (where v.grade = 'A') as a_count,
  count(*) filter (where v.grade = 'B') as b_count,
  count(*) filter (where v.grade = 'C') as c_count,
  count(*) filter (where v.grade = 'D') as d_count,
  count(*) filter (where v.grade = 'F') as f_count,
  round(avg(v.score)::numeric, 1) as average_score,
  count(*) filter (where v.would_vote_again = 'yes') as would_vote_again_yes,
  count(*) filter (where v.would_vote_again = 'no') as would_vote_again_no,
  count(*) filter (where v.voted_for_last_time = 'voted_for') as voted_for_last_time_yes,
  count(*) filter (where v.approval_after_vote = 'approve') as approval_after_vote_yes,
  count(*) filter (where v.approval_after_vote = 'disapprove') as approval_after_vote_no,
  max(v.updated_at) as last_vote_at
from public.profile_scorecard_votes v
join public.profiles p on p.user_id = v.user_id
where v.verification_status_at_vote = 'verified'
  and v.voter_verified_at = p.verified_at
  and p.verified = true
  and p.verification_status = 'verified'
group by v.target_type, v.target_id, v.voter_scope;

create or replace view public.profile_scorecard_algorithm
with (security_barrier = true, security_invoker = true)
as
select
  target_type,
  target_id,
  target_name,
  target_path,
  total_votes,
  average_score,
  round(least(1.0, ln(total_votes + 1) / ln(26))::numeric, 2) as confidence_weight,
  round((average_score * least(1.0, ln(total_votes + 1) / ln(26)))::numeric, 1) as weighted_community_score,
  last_vote_at
from public.profile_scorecard_summary;

revoke all on table public.approval_ratings from public, anon, authenticated;
revoke all on table public.approval_ratings_by_county from public, anon, authenticated;
revoke all on table public.citizen_grade_summary from public, anon, authenticated;
revoke all on table public.citizen_grade_summary_by_county from public, anon, authenticated;
revoke all on table public.profile_scorecard_summary from public, anon, authenticated;
revoke all on table public.profile_scorecard_summary_by_county from public, anon, authenticated;
revoke all on table public.profile_scorecard_summary_by_scope from public, anon, authenticated;
revoke all on table public.profile_scorecard_algorithm from public, anon, authenticated;

grant select on table public.approval_ratings to service_role;
grant select on table public.approval_ratings_by_county to service_role;
grant select on table public.citizen_grade_summary to service_role;
grant select on table public.citizen_grade_summary_by_county to service_role;
grant select on table public.profile_scorecard_summary to service_role;
grant select on table public.profile_scorecard_summary_by_county to service_role;
grant select on table public.profile_scorecard_summary_by_scope to service_role;
grant select on table public.profile_scorecard_algorithm to service_role;

-- ---------------------------------------------------------------------------
-- Server-only site analytics storage matching /api/analytics/event.
-- ---------------------------------------------------------------------------

create table if not exists public.site_analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  user_id uuid references auth.users(id) on delete set null,
  anonymous_session_id text,
  route text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  device_kind text,
  browser_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.site_analytics_events
  add column if not exists event_name text,
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists anonymous_session_id text,
  add column if not exists route text,
  add column if not exists referrer text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_term text,
  add column if not exists utm_content text,
  add column if not exists device_kind text,
  add column if not exists browser_name text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now();

update public.site_analytics_events
set event_name = coalesce(nullif(lower(btrim(event_name)), ''), 'legacy_unknown'),
    route = case
      when route is null or btrim(route) = '' then null
      when route not like '/%' then null
      when route like '/api%' then null
      when route like '/admin%' then null
      when route like '/dashboard%' then null
      when route like '/auth%' then null
      when route like '/login%' then null
      when route like '/create-account%' then null
      else split_part(route, '#', 1)
    end,
    metadata = coalesce(metadata, '{}'::jsonb),
    created_at = coalesce(created_at, now());

alter table public.site_analytics_events
  alter column event_name set not null,
  alter column metadata set default '{}'::jsonb,
  alter column metadata set not null,
  alter column created_at set default now(),
  alter column created_at set not null;

alter table public.site_analytics_events
  drop constraint if exists site_analytics_events_name_check,
  drop constraint if exists site_analytics_events_route_check;

alter table public.site_analytics_events
  add constraint site_analytics_events_name_check
    check (event_name ~ '^[a-z][a-z0-9_]{0,119}$'),
  add constraint site_analytics_events_route_check
    check (
      route is null
      or (
        route like '/%'
        and route not like '/api%'
        and route not like '/admin%'
        and route not like '/dashboard%'
        and route not like '/auth%'
        and route not like '/login%'
        and route not like '/create-account%'
      )
    );

create index if not exists site_analytics_events_event_name_idx on public.site_analytics_events(event_name);
create index if not exists site_analytics_events_route_idx on public.site_analytics_events(route);
create index if not exists site_analytics_events_user_id_idx on public.site_analytics_events(user_id);
create index if not exists site_analytics_events_created_at_idx on public.site_analytics_events(created_at desc);

create or replace function private.repw_normalize_site_analytics_event()
returns trigger
language plpgsql
security invoker
set search_path = public, private, pg_temp
as $$
begin
  new.event_name := lower(btrim(new.event_name));
  new.route := nullif(split_part(btrim(coalesce(new.route, '')), '#', 1), '');

  if new.route is not null
     and (
       new.route not like '/%'
       or new.route like '/api%'
       or new.route like '/admin%'
       or new.route like '/dashboard%'
       or new.route like '/auth%'
       or new.route like '/login%'
       or new.route like '/create-account%'
     ) then
    new.route := null;
  end if;

  new.metadata := coalesce(new.metadata, '{}'::jsonb);
  return new;
end;
$$;

revoke all on function private.repw_normalize_site_analytics_event() from public, anon, authenticated;

drop trigger if exists repw_normalize_site_analytics_event on public.site_analytics_events;
create trigger repw_normalize_site_analytics_event
  before insert or update on public.site_analytics_events
  for each row execute function private.repw_normalize_site_analytics_event();

alter table public.site_analytics_events enable row level security;

do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'site_analytics_events'
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  end loop;
end;
$$;

revoke all on table public.site_analytics_events from public, anon, authenticated;
grant select, insert, update, delete on table public.site_analytics_events to service_role;

commit;
