-- ============================================================
-- RepWatchr Race Hub System
-- ============================================================
-- Race pages are staged through the secure admin dashboard. Public visitors
-- can read only published race rows. Admins can create/edit all rows.

create extension if not exists pgcrypto;
create schema if not exists private;

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function private.is_repw_admin()
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function private.is_repw_admin() from public;
grant execute on function private.is_repw_admin() to authenticated;

create table if not exists public.race_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  office text not null,
  jurisdiction text not null,
  state text not null default 'TX',
  election_date text,
  election_year integer,
  summary text not null default '',
  public_status text not null default 'staged',
  county_slugs text[] not null default '{}',
  district_slugs text[] not null default '{}',
  candidates jsonb not null default '[]'::jsonb,
  source_links jsonb not null default '[]'::jsonb,
  story_links jsonb not null default '[]'::jsonb,
  funding_links jsonb not null default '[]'::jsonb,
  red_flags jsonb not null default '[]'::jsonb,
  missing_records jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint race_pages_slug_check check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint race_pages_public_status_check check (public_status in ('staged', 'needs_review', 'published', 'archived')),
  constraint race_pages_candidates_array_check check (jsonb_typeof(candidates) = 'array'),
  constraint race_pages_source_links_array_check check (jsonb_typeof(source_links) = 'array'),
  constraint race_pages_story_links_array_check check (jsonb_typeof(story_links) = 'array'),
  constraint race_pages_funding_links_array_check check (jsonb_typeof(funding_links) = 'array'),
  constraint race_pages_red_flags_array_check check (jsonb_typeof(red_flags) = 'array'),
  constraint race_pages_missing_records_array_check check (jsonb_typeof(missing_records) = 'array')
);

alter table public.race_pages add column if not exists slug text;
alter table public.race_pages add column if not exists title text;
alter table public.race_pages add column if not exists office text;
alter table public.race_pages add column if not exists jurisdiction text;
alter table public.race_pages add column if not exists state text not null default 'TX';
alter table public.race_pages add column if not exists election_date text;
alter table public.race_pages add column if not exists election_year integer;
alter table public.race_pages add column if not exists summary text not null default '';
alter table public.race_pages add column if not exists public_status text not null default 'staged';
alter table public.race_pages add column if not exists county_slugs text[] not null default '{}';
alter table public.race_pages add column if not exists district_slugs text[] not null default '{}';
alter table public.race_pages add column if not exists candidates jsonb not null default '[]'::jsonb;
alter table public.race_pages add column if not exists source_links jsonb not null default '[]'::jsonb;
alter table public.race_pages add column if not exists story_links jsonb not null default '[]'::jsonb;
alter table public.race_pages add column if not exists funding_links jsonb not null default '[]'::jsonb;
alter table public.race_pages add column if not exists red_flags jsonb not null default '[]'::jsonb;
alter table public.race_pages add column if not exists missing_records jsonb not null default '[]'::jsonb;
alter table public.race_pages add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.race_pages add column if not exists updated_by uuid references auth.users(id) on delete set null;
alter table public.race_pages add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.race_pages add column if not exists created_at timestamptz not null default now();
alter table public.race_pages add column if not exists updated_at timestamptz not null default now();

create unique index if not exists race_pages_slug_idx on public.race_pages(slug);
create index if not exists race_pages_status_idx on public.race_pages(public_status);
create index if not exists race_pages_state_idx on public.race_pages(state);
create index if not exists race_pages_updated_at_idx on public.race_pages(updated_at desc);

create table if not exists public.race_page_events (
  id uuid primary key default gen_random_uuid(),
  race_page_id uuid references public.race_pages(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  note text,
  before_values jsonb not null default '{}'::jsonb,
  after_values jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists race_page_events_page_idx on public.race_page_events(race_page_id);
create index if not exists race_page_events_created_at_idx on public.race_page_events(created_at desc);

alter table public.race_pages enable row level security;
alter table public.race_page_events enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.race_pages to anon, authenticated;
grant select, insert, update, delete on public.race_pages to authenticated;
grant select, insert on public.race_page_events to authenticated;

drop policy if exists "Public can read published race pages" on public.race_pages;
create policy "Public can read published race pages"
  on public.race_pages for select
  to anon, authenticated
  using (public_status = 'published');

drop policy if exists "Admins can read all race pages" on public.race_pages;
create policy "Admins can read all race pages"
  on public.race_pages for select
  to authenticated
  using (private.is_repw_admin());

drop policy if exists "Admins can insert race pages" on public.race_pages;
create policy "Admins can insert race pages"
  on public.race_pages for insert
  to authenticated
  with check (private.is_repw_admin());

drop policy if exists "Admins can update race pages" on public.race_pages;
create policy "Admins can update race pages"
  on public.race_pages for update
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop policy if exists "Admins can delete race pages" on public.race_pages;
create policy "Admins can delete race pages"
  on public.race_pages for delete
  to authenticated
  using (private.is_repw_admin());

drop policy if exists "Admins can read race page events" on public.race_page_events;
create policy "Admins can read race page events"
  on public.race_page_events for select
  to authenticated
  using (private.is_repw_admin());

drop policy if exists "Admins can insert race page events" on public.race_page_events;
create policy "Admins can insert race page events"
  on public.race_page_events for insert
  to authenticated
  with check (private.is_repw_admin());

drop trigger if exists set_race_pages_updated_at on public.race_pages;
create trigger set_race_pages_updated_at
before update on public.race_pages
for each row execute function public.handle_updated_at();

-- ============================================================
-- Normalized Election Race Hub Tables
-- ============================================================
-- These tables support the public race hub and candidate-comparison system.
-- Public reads are limited to active/published records. Admins manage all rows.

create table if not exists public.races (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  office text not null,
  jurisdiction text not null,
  state text not null default 'TX',
  county text,
  city text,
  cycle text not null default '2026',
  race_type text not null default 'general',
  election_date date,
  filing_deadline date,
  source_url text,
  official_election_url text,
  finance_url text,
  summary text not null default '',
  status text not null default 'needs_review',
  noindex boolean not null default true,
  source_count integer not null default 0,
  completeness_score integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint races_slug_check check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint races_race_type_check check (
    race_type in (
      'primary',
      'runoff',
      'general',
      'special',
      'local',
      'school_board',
      'judicial',
      'nonpartisan',
      'party_office',
      'ballot_measure'
    )
  ),
  constraint races_status_check check (status in ('draft', 'needs_review', 'active', 'published', 'archived'))
);

create table if not exists public.race_candidates (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races(id) on delete cascade,
  entity_id text,
  candidate_name text not null,
  party text,
  incumbent boolean not null default false,
  ballot_status text not null default 'needs_source',
  profile_url text,
  campaign_url text,
  filing_url text,
  finance_url text,
  source_url text,
  source_count integer not null default 0,
  confidence text not null default 'needs_review',
  status text not null default 'active',
  display_order integer not null default 100,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint race_candidates_ballot_status_check check (
    ballot_status in ('filed', 'announced', 'qualified', 'withdrawn', 'lost_primary', 'winner', 'needs_source')
  ),
  constraint race_candidates_confidence_check check (confidence in ('source_backed', 'needs_review', 'admin_entered', 'imported')),
  constraint race_candidates_status_check check (status in ('active', 'needs_review', 'archived'))
);

create table if not exists public.race_sources (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races(id) on delete cascade,
  candidate_id uuid references public.race_candidates(id) on delete set null,
  title text not null,
  source_url text not null,
  source_type text not null default 'official_election',
  source_date date,
  official boolean not null default false,
  confidence text not null default 'needs_review',
  status text not null default 'active',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint race_sources_source_type_check check (
    source_type in (
      'official_election',
      'filing',
      'campaign',
      'finance',
      'school_board_bond',
      'meeting',
      'story',
      'profile',
      'correction',
      'general_reference'
    )
  ),
  constraint race_sources_confidence_check check (confidence in ('source_backed', 'needs_review', 'admin_entered', 'imported')),
  constraint race_sources_status_check check (status in ('active', 'needs_review', 'rejected', 'archived'))
);

create table if not exists public.race_public_questions (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races(id) on delete cascade,
  question text not null,
  label text,
  source_url text,
  status text not null default 'active',
  display_order integer not null default 100,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint race_public_questions_status_check check (status in ('active', 'needs_review', 'archived'))
);

create index if not exists races_state_cycle_idx on public.races(state, cycle);
create index if not exists races_status_idx on public.races(status);
create index if not exists races_noindex_idx on public.races(noindex);
create index if not exists race_candidates_race_idx on public.race_candidates(race_id, display_order);
create index if not exists race_sources_race_idx on public.race_sources(race_id);
create index if not exists race_sources_candidate_idx on public.race_sources(candidate_id);
create index if not exists race_public_questions_race_idx on public.race_public_questions(race_id, display_order);

alter table public.races enable row level security;
alter table public.race_candidates enable row level security;
alter table public.race_sources enable row level security;
alter table public.race_public_questions enable row level security;

grant select on public.races to anon, authenticated;
grant select on public.race_candidates to anon, authenticated;
grant select on public.race_sources to anon, authenticated;
grant select on public.race_public_questions to anon, authenticated;
grant select, insert, update, delete on public.races to authenticated;
grant select, insert, update, delete on public.race_candidates to authenticated;
grant select, insert, update, delete on public.race_sources to authenticated;
grant select, insert, update, delete on public.race_public_questions to authenticated;

drop policy if exists "Public can read active races" on public.races;
create policy "Public can read active races"
  on public.races for select
  to anon, authenticated
  using (status in ('active', 'published'));

drop policy if exists "Admins can manage races" on public.races;
create policy "Admins can manage races"
  on public.races for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop policy if exists "Public can read active race candidates" on public.race_candidates;
create policy "Public can read active race candidates"
  on public.race_candidates for select
  to anon, authenticated
  using (
    status = 'active'
    and exists (
      select 1 from public.races
      where races.id = race_candidates.race_id
        and races.status in ('active', 'published')
    )
  );

drop policy if exists "Admins can manage race candidates" on public.race_candidates;
create policy "Admins can manage race candidates"
  on public.race_candidates for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop policy if exists "Public can read active race sources" on public.race_sources;
create policy "Public can read active race sources"
  on public.race_sources for select
  to anon, authenticated
  using (
    status = 'active'
    and exists (
      select 1 from public.races
      where races.id = race_sources.race_id
        and races.status in ('active', 'published')
    )
  );

drop policy if exists "Admins can manage race sources" on public.race_sources;
create policy "Admins can manage race sources"
  on public.race_sources for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop policy if exists "Public can read active race public questions" on public.race_public_questions;
create policy "Public can read active race public questions"
  on public.race_public_questions for select
  to anon, authenticated
  using (
    status = 'active'
    and exists (
      select 1 from public.races
      where races.id = race_public_questions.race_id
        and races.status in ('active', 'published')
    )
  );

drop policy if exists "Admins can manage race public questions" on public.race_public_questions;
create policy "Admins can manage race public questions"
  on public.race_public_questions for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop trigger if exists set_races_updated_at on public.races;
create trigger set_races_updated_at
before update on public.races
for each row execute function public.handle_updated_at();

drop trigger if exists set_race_candidates_updated_at on public.race_candidates;
create trigger set_race_candidates_updated_at
before update on public.race_candidates
for each row execute function public.handle_updated_at();

drop trigger if exists set_race_sources_updated_at on public.race_sources;
create trigger set_race_sources_updated_at
before update on public.race_sources
for each row execute function public.handle_updated_at();

drop trigger if exists set_race_public_questions_updated_at on public.race_public_questions;
create trigger set_race_public_questions_updated_at
before update on public.race_public_questions
for each row execute function public.handle_updated_at();
