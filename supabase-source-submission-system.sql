-- RepWatchr Source Submission and Review System
-- ============================================================
-- Run after supabase-superadmin-office.sql so public.is_repw_operator()
-- exists for admin/operator RLS checks.

create table if not exists public.source_submissions (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text check (anonymous_id is null or char_length(anonymous_id) between 16 and 120),
  user_id uuid references auth.users(id) on delete set null,
  submitter_name text check (submitter_name is null or char_length(submitter_name) <= 180),
  submitter_email text check (submitter_email is null or char_length(submitter_email) <= 180),
  target_type text not null check (
    target_type in (
      'public official',
      'candidate',
      'law enforcement official',
      'judge/court',
      'prosecutor',
      'agency',
      'city/county/state/federal office',
      'school board',
      'race/election',
      'vote',
      'funding',
      'story/article',
      'correction',
      'other'
    )
  ),
  target_id text check (target_id is null or char_length(target_id) <= 220),
  target_name text check (target_name is null or char_length(target_name) <= 220),
  office_or_agency text check (office_or_agency is null or char_length(office_or_agency) <= 220),
  jurisdiction text check (jurisdiction is null or char_length(jurisdiction) <= 220),
  state text check (state is null or char_length(state) <= 80),
  county text check (county is null or char_length(county) <= 120),
  city text check (city is null or char_length(city) <= 120),
  source_url text not null check (source_url ~* '^https?://' and char_length(source_url) <= 700),
  source_title text check (source_title is null or char_length(source_title) <= 260),
  source_publisher text check (source_publisher is null or char_length(source_publisher) <= 180),
  source_date date,
  source_type text not null check (
    source_type in (
      'official website',
      'meeting agenda',
      'meeting minutes',
      'meeting video',
      'vote record',
      'campaign finance filing',
      'ethics filing',
      'court record',
      'agency document',
      'public statement',
      'news article',
      'press release',
      'public social post',
      'public database',
      'procurement/vendor record',
      'election filing',
      'law enforcement public information',
      'other'
    )
  ),
  claim_summary text check (claim_summary is null or char_length(claim_summary) <= 5000),
  why_it_matters text check (why_it_matters is null or char_length(why_it_matters) <= 5000),
  requested_action text check (
    requested_action is null or requested_action in (
      'attach to profile',
      'create new profile',
      'correct existing profile',
      'add to story',
      'add to race',
      'report broken source',
      'request review',
      'other'
    )
  ),
  public_private_flag text not null default 'public_record' check (
    public_private_flag in ('public_record', 'private_review')
  ),
  confidence text not null default 'needs_review' check (
    confidence in ('needs_review', 'source_backed', 'official_record', 'weak_match', 'disputed', 'rejected')
  ),
  status text not null default 'new' check (
    status in (
      'new',
      'needs_review',
      'verified',
      'rejected',
      'needs_more_info',
      'duplicate',
      'attached_to_profile',
      'attached_to_story',
      'attached_to_race',
      'archived'
    )
  ),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  assigned_reviewer uuid references auth.users(id) on delete set null,
  duplicate_of uuid references public.source_submissions(id) on delete set null,
  attribution jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.source_submission_events (
  id uuid primary key default gen_random_uuid(),
  source_submission_id uuid not null references public.source_submissions(id) on delete cascade,
  event_type text not null check (char_length(event_type) between 2 and 120),
  actor_user_id uuid references auth.users(id) on delete set null,
  old_status text,
  new_status text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create table if not exists public.source_review_notes (
  id uuid primary key default gen_random_uuid(),
  source_submission_id uuid not null references public.source_submissions(id) on delete cascade,
  reviewer_user_id uuid references auth.users(id) on delete set null,
  note text not null check (char_length(note) between 1 and 5000),
  visibility text not null default 'internal' check (visibility in ('internal', 'public_summary')),
  created_at timestamptz default now() not null
);

create table if not exists public.source_links (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (char_length(entity_type) between 2 and 120),
  entity_id text not null check (char_length(entity_id) between 1 and 240),
  source_url text not null check (source_url ~* '^https?://' and char_length(source_url) <= 700),
  source_title text check (source_title is null or char_length(source_title) <= 260),
  source_publisher text check (source_publisher is null or char_length(source_publisher) <= 180),
  source_type text not null,
  source_date date,
  summary text check (summary is null or char_length(summary) <= 5000),
  confidence text not null default 'source_backed' check (
    confidence in ('source_backed', 'official_record', 'needs_review', 'weak_match', 'disputed')
  ),
  status text not null default 'active' check (status in ('active', 'under_review', 'archived', 'removed')),
  added_by uuid references auth.users(id) on delete set null,
  submission_id uuid references public.source_submissions(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(entity_type, entity_id, source_url)
);

create index if not exists idx_source_submissions_status_created
  on public.source_submissions(status, created_at desc);
create index if not exists idx_source_submissions_target
  on public.source_submissions(target_type, target_id, target_name);
create index if not exists idx_source_submissions_geo
  on public.source_submissions(state, county, city, created_at desc);
create index if not exists idx_source_submissions_source_type
  on public.source_submissions(source_type, created_at desc);
create index if not exists idx_source_submissions_user_created
  on public.source_submissions(user_id, created_at desc)
  where user_id is not null;
create index if not exists idx_source_submissions_anonymous_created
  on public.source_submissions(anonymous_id, created_at desc)
  where anonymous_id is not null;
create index if not exists idx_source_submissions_url
  on public.source_submissions(source_url);
create index if not exists idx_source_submission_events_submission
  on public.source_submission_events(source_submission_id, created_at desc);
create index if not exists idx_source_review_notes_submission
  on public.source_review_notes(source_submission_id, created_at desc);
create index if not exists idx_source_links_entity
  on public.source_links(entity_type, entity_id, status, created_at desc);
create index if not exists idx_source_links_submission
  on public.source_links(submission_id)
  where submission_id is not null;

alter table public.source_submissions enable row level security;
alter table public.source_submission_events enable row level security;
alter table public.source_review_notes enable row level security;
alter table public.source_links enable row level security;

grant insert on public.source_submissions to anon, authenticated;
grant select on public.source_submissions to authenticated, service_role;
grant update, delete on public.source_submissions to authenticated, service_role;

grant select on public.source_submission_events to authenticated, service_role;
grant insert, update, delete on public.source_submission_events to service_role;

grant select, insert, update, delete on public.source_review_notes to authenticated, service_role;

grant select on public.source_links to anon, authenticated;
grant insert, update, delete on public.source_links to authenticated, service_role;

drop policy if exists "Public can insert source submissions" on public.source_submissions;
drop policy if exists "Users can read own source submissions" on public.source_submissions;
drop policy if exists "Operators manage source submissions" on public.source_submissions;
drop policy if exists "Users can read own source submission events" on public.source_submission_events;
drop policy if exists "Operators manage source submission events" on public.source_submission_events;
drop policy if exists "Operators manage source review notes" on public.source_review_notes;
drop policy if exists "Public reads active source links" on public.source_links;
drop policy if exists "Operators manage source links" on public.source_links;

create policy "Public can insert source submissions"
  on public.source_submissions for insert
  to anon, authenticated
  with check (
    status = 'new'
    and confidence = 'needs_review'
    and assigned_reviewer is null
    and duplicate_of is null
    and (user_id is null or (select auth.uid()) = user_id)
  );

create policy "Users can read own source submissions"
  on public.source_submissions for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Operators manage source submissions"
  on public.source_submissions for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Users can read own source submission events"
  on public.source_submission_events for select
  to authenticated
  using (
    exists (
      select 1
      from public.source_submissions ss
      where ss.id = source_submission_events.source_submission_id
        and ss.user_id = (select auth.uid())
    )
  );

create policy "Operators manage source submission events"
  on public.source_submission_events for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Operators manage source review notes"
  on public.source_review_notes for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Public reads active source links"
  on public.source_links for select
  to anon, authenticated
  using (status = 'active');

create policy "Operators manage source links"
  on public.source_links for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

drop view if exists public.source_review_admin_summary;

create view public.source_review_admin_summary
with (security_invoker = true)
as
select
  count(*)::int as total_submissions,
  count(*) filter (where status = 'new')::int as new_submissions,
  count(*) filter (where status = 'needs_review')::int as needs_review,
  count(*) filter (where status = 'verified')::int as verified,
  count(*) filter (where status in ('attached_to_profile', 'attached_to_story', 'attached_to_race'))::int as attached,
  count(*) filter (where priority in ('high', 'urgent'))::int as high_priority,
  count(*) filter (where created_at >= now() - interval '7 days')::int as last_7_days,
  max(created_at) as latest_submission_at
from public.source_submissions;

grant select on public.source_review_admin_summary to authenticated;
