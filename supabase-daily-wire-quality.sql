-- RepWatchr Daily Watch Wire quality gate and moderation controls.
-- Runtime scoring is backward-compatible, but this migration stores the fields
-- admins need for durable review, source controls, and audit trails.

alter table if exists public.repwatchr_daily_clips
  add column if not exists jurisdiction_match text,
  add column if not exists geographic_relevance text,
  add column if not exists source_domain text,
  add column if not exists topic_tags text[] default '{}',
  add column if not exists official_person_matches text[] default '{}',
  add column if not exists state_matches text[] default '{}',
  add column if not exists county_matches text[] default '{}',
  add column if not exists city_matches text[] default '{}',
  add column if not exists duplicate_score numeric default 0,
  add column if not exists quality_score numeric default 0,
  add column if not exists source_tier text,
  add column if not exists publish_date timestamptz,
  add column if not exists quarantine_status text default 'needs_review',
  add column if not exists public_labels text[] default '{}',
  add column if not exists review_reasons text[] default '{}',
  add column if not exists source_watch_id text,
  add column if not exists query_lane text,
  add column if not exists attached_target_type text,
  add column if not exists attached_target_id text,
  add column if not exists promoted_story_id text,
  add column if not exists reviewed_by uuid,
  add column if not exists reviewed_at timestamptz;

create index if not exists repwatchr_daily_clips_status_idx
  on public.repwatchr_daily_clips (status);

create index if not exists repwatchr_daily_clips_quality_idx
  on public.repwatchr_daily_clips (quality_score desc, published_at desc);

create index if not exists repwatchr_daily_clips_query_lane_idx
  on public.repwatchr_daily_clips (query_lane, status);

create table if not exists public.repwatchr_daily_wire_source_controls (
  id uuid primary key default gen_random_uuid(),
  control_type text not null check (control_type in ('source', 'query_lane', 'domain')),
  source_id text,
  query_lane text,
  domain text,
  allow_domains text[] default '{}',
  deny_domains text[] default '{}',
  required_terms text[] default '{}',
  denied_terms text[] default '{}',
  accept_quality_score numeric default 74,
  review_quality_score numeric default 48,
  quarantine_quality_score numeric default 34,
  require_jurisdiction_match boolean default true,
  require_geographic_relevance boolean default true,
  enabled boolean default true,
  note text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.repwatchr_daily_wire_events (
  id uuid primary key default gen_random_uuid(),
  wire_item_id text not null,
  old_status text,
  new_status text not null,
  action text not null,
  note text,
  attach_target_type text,
  attach_target_id text,
  promoted_story_id text,
  actor_user_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.repwatchr_daily_wire_source_controls enable row level security;
alter table public.repwatchr_daily_wire_events enable row level security;

drop policy if exists "Admins can read daily wire controls" on public.repwatchr_daily_wire_source_controls;
create policy "Admins can read daily wire controls"
on public.repwatchr_daily_wire_source_controls
for select
using (exists (
  select 1 from public.user_roles
  where user_roles.user_id = auth.uid()
  and user_roles.role = 'admin'
));

drop policy if exists "Admins can manage daily wire controls" on public.repwatchr_daily_wire_source_controls;
create policy "Admins can manage daily wire controls"
on public.repwatchr_daily_wire_source_controls
for all
using (exists (
  select 1 from public.user_roles
  where user_roles.user_id = auth.uid()
  and user_roles.role = 'admin'
))
with check (exists (
  select 1 from public.user_roles
  where user_roles.user_id = auth.uid()
  and user_roles.role = 'admin'
));

drop policy if exists "Admins can read daily wire events" on public.repwatchr_daily_wire_events;
create policy "Admins can read daily wire events"
on public.repwatchr_daily_wire_events
for select
using (exists (
  select 1 from public.user_roles
  where user_roles.user_id = auth.uid()
  and user_roles.role = 'admin'
));

drop policy if exists "Admins can insert daily wire events" on public.repwatchr_daily_wire_events;
create policy "Admins can insert daily wire events"
on public.repwatchr_daily_wire_events
for insert
with check (exists (
  select 1 from public.user_roles
  where user_roles.user_id = auth.uid()
  and user_roles.role = 'admin'
));
