-- ============================================================
-- RepWatchr Official Timelines
-- ============================================================
-- Run after:
--   1. supabase-profile-claims.sql
--   2. supabase-superadmin-office.sql
--   3. supabase-profile-overlays.sql
--
-- Every public source can become a timeline event. Public reads only expose
-- source-backed, public-visible events; submitted leads stay private until
-- reviewed or attached by a RepWatchr operator.

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  create type public.official_timeline_event_type as enum (
    'speech',
    'vote',
    'donation',
    'campaign_filing',
    'meeting',
    'board_appointment',
    'committee_vote',
    'article',
    'investigation',
    'correction',
    'public_statement',
    'funding',
    'red_flag',
    'disclosure',
    'source_link',
    'profile_update'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.official_timeline_status as enum (
    'submitted',
    'needs_review',
    'verified',
    'rejected',
    'attached_to_profile',
    'needs_more_info',
    'hidden'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.official_timeline_source_tier as enum (
    'official_record',
    'named_news',
    'other_public',
    'weak_match'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.official_timeline_events (
  id uuid primary key default gen_random_uuid(),
  official_id text not null check (char_length(official_id) between 1 and 240),
  official_name text not null check (char_length(official_name) between 1 and 240),
  event_type public.official_timeline_event_type not null,
  event_date date,
  event_time timestamptz,
  title text not null check (char_length(title) between 1 and 300),
  summary text not null check (char_length(summary) between 1 and 2500),
  source_title text not null check (char_length(source_title) between 1 and 300),
  source_url text not null check (char_length(source_url) between 8 and 1200),
  source_domain text check (char_length(coalesce(source_domain, '')) <= 240),
  source_date date,
  source_tier public.official_timeline_source_tier not null default 'other_public',
  status public.official_timeline_status not null default 'submitted',
  public_visible boolean not null default false,
  jurisdiction text check (char_length(coalesce(jurisdiction, '')) <= 240),
  office text check (char_length(coalesce(office, '')) <= 180),
  state text check (char_length(coalesce(state, '')) <= 40),
  county text check (char_length(coalesce(county, '')) <= 120),
  tags text[] not null default '{}',
  source_table text check (char_length(coalesce(source_table, '')) <= 120),
  source_id text check (char_length(coalesce(source_id, '')) <= 240),
  source_hash text not null unique,
  share_snippet text check (char_length(coalesce(share_snippet, '')) <= 600),
  embed_allowed boolean not null default true,
  submitted_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text check (char_length(coalesce(review_note, '')) <= 3000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.official_timeline_event_sources (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.official_timeline_events(id) on delete cascade not null,
  source_title text not null check (char_length(source_title) between 1 and 300),
  source_url text not null check (char_length(source_url) between 8 and 1200),
  source_type text not null default 'public_source' check (char_length(source_type) between 1 and 80),
  source_date date,
  source_tier public.official_timeline_source_tier not null default 'other_public',
  notes text check (char_length(coalesce(notes, '')) <= 1000),
  created_at timestamptz not null default now()
);

create index if not exists idx_official_timeline_events_profile
  on public.official_timeline_events(official_id, public_visible, status, event_date desc nulls last, created_at desc);

create index if not exists idx_official_timeline_events_type
  on public.official_timeline_events(event_type, event_date desc nulls last);

create index if not exists idx_official_timeline_events_review
  on public.official_timeline_events(status, source_tier, created_at desc);

create index if not exists idx_official_timeline_events_tags
  on public.official_timeline_events using gin(tags);

create index if not exists idx_official_timeline_event_sources_event
  on public.official_timeline_event_sources(event_id);

alter table public.official_timeline_events enable row level security;
alter table public.official_timeline_event_sources enable row level security;

drop policy if exists "Public reads reviewed official timeline events" on public.official_timeline_events;
drop policy if exists "Users read own submitted official timeline events" on public.official_timeline_events;
drop policy if exists "Users submit official timeline event leads" on public.official_timeline_events;
drop policy if exists "Operators manage official timeline events" on public.official_timeline_events;
drop policy if exists "Public reads sources for public timeline events" on public.official_timeline_event_sources;
drop policy if exists "Operators manage timeline event sources" on public.official_timeline_event_sources;

create policy "Public reads reviewed official timeline events"
  on public.official_timeline_events for select
  using (
    (
      public_visible = true
      and status in ('verified', 'attached_to_profile')
    )
    or public.is_repw_operator()
  );

create policy "Users read own submitted official timeline events"
  on public.official_timeline_events for select
  to authenticated
  using ((select auth.uid()) = submitted_by);

create policy "Users submit official timeline event leads"
  on public.official_timeline_events for insert
  to authenticated
  with check (
    (select auth.uid()) = submitted_by
    and status = 'submitted'
    and public_visible = false
  );

create policy "Operators manage official timeline events"
  on public.official_timeline_events for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Public reads sources for public timeline events"
  on public.official_timeline_event_sources for select
  using (
    exists (
      select 1
      from public.official_timeline_events event
      where event.id = public.official_timeline_event_sources.event_id
        and (
          (
            event.public_visible = true
            and event.status in ('verified', 'attached_to_profile')
          )
          or public.is_repw_operator()
        )
    )
  );

create policy "Operators manage timeline event sources"
  on public.official_timeline_event_sources for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

drop trigger if exists set_official_timeline_events_updated_at on public.official_timeline_events;
create trigger set_official_timeline_events_updated_at
  before update on public.official_timeline_events
  for each row execute function public.handle_updated_at();

create or replace view public.official_timeline_public_events
with (security_invoker = true)
as
select
  id,
  official_id,
  official_name,
  event_type,
  event_date,
  event_time,
  title,
  summary,
  source_title,
  source_url,
  source_domain,
  source_date,
  source_tier,
  status,
  jurisdiction,
  office,
  state,
  county,
  tags,
  source_table,
  source_id,
  source_hash,
  share_snippet,
  embed_allowed,
  created_at,
  updated_at
from public.official_timeline_events
where public_visible = true
  and status in ('verified', 'attached_to_profile');

create or replace view public.official_timeline_event_counts
with (security_invoker = true)
as
select
  official_id,
  count(*)::integer as event_count,
  count(*) filter (where event_type = 'vote')::integer as vote_count,
  count(*) filter (where event_type in ('donation', 'funding', 'campaign_filing'))::integer as money_count,
  count(*) filter (where event_type in ('article', 'investigation', 'public_statement'))::integer as story_count,
  max(coalesce(event_date::timestamptz, created_at)) as latest_event_at
from public.official_timeline_public_events
group by official_id;

grant usage on type public.official_timeline_event_type to anon, authenticated, service_role;
grant usage on type public.official_timeline_status to anon, authenticated, service_role;
grant usage on type public.official_timeline_source_tier to anon, authenticated, service_role;

grant select on public.official_timeline_events to anon, authenticated, service_role;
grant insert on public.official_timeline_events to authenticated, service_role;
grant update, delete on public.official_timeline_events to authenticated, service_role;
grant select, insert, update, delete on public.official_timeline_event_sources to authenticated, service_role;
grant select on public.official_timeline_event_sources to anon;

grant select on public.official_timeline_public_events to anon, authenticated, service_role;
grant select on public.official_timeline_event_counts to anon, authenticated, service_role;
