-- ============================================================
-- RepWatchr Visitor Intelligence System
-- ============================================================
-- Run this after supabase-superadmin-office.sql and
-- supabase-repwatchr-page-views.sql so public.is_repw_operator()
-- exists.
--
-- Purpose:
-- - Give every anonymous visitor a durable temporary profile.
-- - Store public-site behavior as first-party product analytics.
-- - Merge anonymous history into a signed-in user profile after account
--   creation/login.
--
-- Privacy boundary:
-- - Raw IP addresses are not stored.
-- - Raw user-agent strings are not stored.
-- - Events should store routes, public entity IDs, topic labels, device kind,
--   referrer host, scroll/depth/time metrics, and source/product actions.

create extension if not exists pgcrypto;

create table if not exists public.visitor_profiles (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text not null unique check (char_length(anonymous_id) between 16 and 120),
  user_id uuid references auth.users(id) on delete set null,
  first_seen_at timestamptz default now() not null,
  last_seen_at timestamptz default now() not null,
  merged_at timestamptz,
  entry_page text check (entry_page is null or (entry_page ~ '^/' and char_length(entry_page) <= 500)),
  exit_page text check (exit_page is null or (exit_page ~ '^/' and char_length(exit_page) <= 500)),
  referrer_host text check (referrer_host is null or char_length(referrer_host) <= 120),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  device_kind text not null default 'unknown' check (device_kind in ('desktop', 'mobile', 'tablet', 'bot', 'unknown')),
  session_count integer not null default 0 check (session_count >= 0),
  page_view_count integer not null default 0 check (page_view_count >= 0),
  button_click_count integer not null default 0 check (button_click_count >= 0),
  share_count integer not null default 0 check (share_count >= 0),
  packet_build_count integer not null default 0 check (packet_build_count >= 0),
  download_count integer not null default 0 check (download_count >= 0),
  max_depth integer not null default 0 check (max_depth >= 0),
  max_scroll_percent integer not null default 0 check (max_scroll_percent between 0 and 100),
  total_time_ms bigint not null default 0 check (total_time_ms >= 0),
  officials_viewed jsonb not null default '{}'::jsonb,
  topics_viewed jsonb not null default '{}'::jsonb,
  issues_viewed jsonb not null default '{}'::jsonb,
  counties_viewed jsonb not null default '{}'::jsonb,
  last_event_type text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.visitor_sessions (
  id uuid primary key default gen_random_uuid(),
  session_key text not null unique check (char_length(session_key) between 16 and 120),
  visitor_profile_id uuid references public.visitor_profiles(id) on delete cascade not null,
  anonymous_id text not null check (char_length(anonymous_id) between 16 and 120),
  user_id uuid references auth.users(id) on delete set null,
  started_at timestamptz default now() not null,
  last_seen_at timestamptz default now() not null,
  entry_page text check (entry_page is null or (entry_page ~ '^/' and char_length(entry_page) <= 500)),
  exit_page text check (exit_page is null or (exit_page ~ '^/' and char_length(exit_page) <= 500)),
  referrer_host text check (referrer_host is null or char_length(referrer_host) <= 120),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  device_kind text not null default 'unknown' check (device_kind in ('desktop', 'mobile', 'tablet', 'bot', 'unknown')),
  page_depth integer not null default 0 check (page_depth >= 0),
  max_scroll_percent integer not null default 0 check (max_scroll_percent between 0 and 100),
  total_time_ms bigint not null default 0 check (total_time_ms >= 0),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.visitor_events (
  id uuid primary key default gen_random_uuid(),
  visitor_profile_id uuid references public.visitor_profiles(id) on delete cascade not null,
  session_id uuid references public.visitor_sessions(id) on delete set null,
  anonymous_id text not null check (char_length(anonymous_id) between 16 and 120),
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (char_length(event_type) between 2 and 80),
  path text check (path is null or (path ~ '^/' and char_length(path) <= 500)),
  entry_page text check (entry_page is null or (entry_page ~ '^/' and char_length(entry_page) <= 500)),
  exit_page text check (exit_page is null or (exit_page ~ '^/' and char_length(exit_page) <= 500)),
  referrer_host text check (referrer_host is null or char_length(referrer_host) <= 120),
  device_kind text not null default 'unknown' check (device_kind in ('desktop', 'mobile', 'tablet', 'bot', 'unknown')),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  session_depth integer check (session_depth is null or session_depth >= 0),
  time_spent_ms integer check (time_spent_ms is null or time_spent_ms >= 0),
  scroll_percent integer check (scroll_percent is null or scroll_percent between 0 and 100),
  entity_type text check (entity_type is null or char_length(entity_type) <= 80),
  entity_id text check (entity_id is null or char_length(entity_id) <= 180),
  entity_label text check (entity_label is null or char_length(entity_label) <= 220),
  topic text check (topic is null or char_length(topic) <= 160),
  issue_id text check (issue_id is null or char_length(issue_id) <= 160),
  county text check (county is null or char_length(county) <= 120),
  search_term text check (search_term is null or char_length(search_term) <= 180),
  button_label text check (button_label is null or char_length(button_label) <= 160),
  button_href text check (button_href is null or char_length(button_href) <= 500),
  share_channel text check (share_channel is null or char_length(share_channel) <= 60),
  download_name text check (download_name is null or char_length(download_name) <= 180),
  packet_type text check (packet_type is null or char_length(packet_type) <= 120),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz default now() not null,
  created_at timestamptz default now() not null
);

create table if not exists public.visitor_profile_merges (
  id uuid primary key default gen_random_uuid(),
  visitor_profile_id uuid references public.visitor_profiles(id) on delete cascade not null,
  anonymous_id text not null check (char_length(anonymous_id) between 16 and 120),
  user_id uuid references auth.users(id) on delete set null,
  merge_source text not null default 'auth_session' check (char_length(merge_source) between 2 and 80),
  events_linked integer not null default 0 check (events_linked >= 0),
  sessions_linked integer not null default 0 check (sessions_linked >= 0),
  merged_at timestamptz default now() not null
);

alter table public.visitor_profiles
  add column if not exists interest_profile jsonb not null default '{}'::jsonb;

create table if not exists public.interest_taxonomy (
  slug text primary key check (slug ~ '^[a-z0-9-]+$' and char_length(slug) between 2 and 80),
  label text not null check (char_length(label) between 2 and 120),
  category text not null default 'issue' check (category in ('place', 'office', 'issue', 'workflow')),
  description text not null default '' check (char_length(description) <= 500),
  keywords text[] not null default '{}'::text[],
  active boolean not null default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

insert into public.interest_taxonomy (slug, label, category, description, keywords)
values
  ('texas', 'Texas', 'place', 'Texas statewide, county, and district records.', array['texas', 'tx', 'east texas', 'statewide texas', 'sos', 'texas ethics', 'texas election']),
  ('school-boards', 'School Boards', 'office', 'School-board trustees, districts, meetings, bonds, and education governance.', array['school board', 'school-board', 'trustee', 'isd', 'district meeting', 'board meeting', 'superintendent']),
  ('property-taxes', 'Property Taxes', 'issue', 'Property-tax, appraisal, bond, budget, and local tax records.', array['property tax', 'property taxes', 'appraisal', 'cad', 'tax', 'bond', 'budget', 'rate']),
  ('water-rights', 'Water Rights', 'issue', 'Water infrastructure, water rights, conservation, and local utility records.', array['water', 'water rights', 'water infrastructure', 'utility', 'reservoir', 'groundwater', 'river']),
  ('congress', 'Congress', 'office', 'U.S. House, U.S. Senate, federal votes, committees, and national records.', array['congress', 'u.s. house', 'us house', 'u.s. senate', 'us senate', 'federal', 'bioguide', 'roll call']),
  ('sheriffs', 'Sheriffs', 'office', 'Sheriffs, public safety offices, jail oversight, and law-enforcement records.', array['sheriff', 'sheriffs', 'jail', 'public safety', 'law enforcement', 'constable']),
  ('judges', 'Judges', 'office', 'Judicial offices, court records, rulings, and court-administration issues.', array['judge', 'judges', 'judicial', 'court', 'supreme court', 'appeals', 'district court']),
  ('county-commissioners', 'County Commissioners', 'office', 'County commissioners, county judges, county budgets, and local government votes.', array['county commissioner', 'commissioners court', 'county judge', 'county budget', 'county']),
  ('campaign-finance', 'Campaign Finance', 'issue', 'Donors, PACs, FEC, state finance filings, spending, and money trails.', array['campaign finance', 'funding', 'donor', 'donors', 'pac', 'fec', 'money', 'cash on hand', 'raised', 'spent']),
  ('transparency', 'Transparency', 'workflow', 'Source-backed accountability, score review, red flags, and public proof.', array['transparency', 'accountability', 'red flag', 'red flags', 'ethics', 'receipts', 'source-backed', 'source backed']),
  ('open-records', 'Open Records', 'workflow', 'Public records requests, FOIA, Texas PIA, source packets, and missing proof.', array['open records', 'public records', 'foia', 'pia', 'request', 'source', 'sources', 'source packet', 'records']),
  ('veterans', 'Veterans', 'issue', 'Veteran policy, service-member records, benefits, and public commitments.', array['veteran', 'veterans', 'military', 'service member', 'va', 'glo']),
  ('education', 'Education', 'issue', 'Education policy, curriculum, trustees, school finance, and student-safety records.', array['education', 'schools', 'curriculum', 'student', 'teacher', 'parents', 'parental', 'sboe']),
  ('energy', 'Energy', 'issue', 'Energy, oil, gas, grid, utilities, and Texas production records.', array['energy', 'oil', 'gas', 'grid', 'pipeline', 'railroad commission', 'ercot', 'production']),
  ('immigration', 'Immigration', 'issue', 'Border, immigration, detention, federal-state enforcement, and local impact records.', array['immigration', 'border', 'migrant', 'asylum', 'customs', 'ice', 'border security']),
  ('infrastructure', 'Infrastructure', 'issue', 'Roads, bridges, water systems, broadband, capital projects, and public works.', array['infrastructure', 'roads', 'bridge', 'bridges', 'transportation', 'public works', 'broadband', 'water']),
  ('election-integrity', 'Election Integrity', 'issue', 'Elections, ballots, voting systems, filing records, and election administration.', array['election integrity', 'election', 'elections', 'ballot', 'voter', 'voting', 'polling', 'filing', 'candidate'])
on conflict (slug) do update set
  label = excluded.label,
  category = excluded.category,
  description = excluded.description,
  keywords = excluded.keywords,
  active = true,
  updated_at = now();

create table if not exists public.visitor_interest_scores (
  id uuid primary key default gen_random_uuid(),
  visitor_profile_id uuid references public.visitor_profiles(id) on delete cascade not null,
  anonymous_id text not null check (char_length(anonymous_id) between 16 and 120),
  user_id uuid references auth.users(id) on delete set null,
  interest_slug text references public.interest_taxonomy(slug) on delete restrict not null,
  score numeric(12,2) not null default 0 check (score >= 0),
  raw_event_count integer not null default 0 check (raw_event_count >= 0),
  last_weight numeric(8,2) not null default 0,
  last_reason text check (last_reason is null or char_length(last_reason) <= 500),
  first_scored_at timestamptz default now() not null,
  last_scored_at timestamptz default now() not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (visitor_profile_id, interest_slug)
);

create table if not exists public.visitor_interest_events (
  id uuid primary key default gen_random_uuid(),
  visitor_profile_id uuid references public.visitor_profiles(id) on delete cascade not null,
  session_id uuid references public.visitor_sessions(id) on delete set null,
  visitor_event_id uuid references public.visitor_events(id) on delete set null,
  anonymous_id text not null check (char_length(anonymous_id) between 16 and 120),
  user_id uuid references auth.users(id) on delete set null,
  interest_slug text references public.interest_taxonomy(slug) on delete restrict not null,
  weight numeric(8,2) not null check (weight > 0),
  source_event_type text not null check (char_length(source_event_type) between 2 and 80),
  path text check (path is null or (path ~ '^/' and char_length(path) <= 500)),
  reason text check (reason is null or char_length(reason) <= 500),
  created_at timestamptz default now() not null
);

create index if not exists idx_visitor_profiles_user_id
  on public.visitor_profiles(user_id, updated_at desc)
  where user_id is not null;

create index if not exists idx_visitor_profiles_last_seen
  on public.visitor_profiles(last_seen_at desc);

create index if not exists idx_visitor_sessions_profile
  on public.visitor_sessions(visitor_profile_id, last_seen_at desc);

create index if not exists idx_visitor_sessions_user_id
  on public.visitor_sessions(user_id, last_seen_at desc)
  where user_id is not null;

create index if not exists idx_visitor_events_profile
  on public.visitor_events(visitor_profile_id, occurred_at desc);

create index if not exists idx_visitor_events_user_id
  on public.visitor_events(user_id, occurred_at desc)
  where user_id is not null;

create index if not exists idx_visitor_events_type
  on public.visitor_events(event_type, occurred_at desc);

create index if not exists idx_visitor_events_entity
  on public.visitor_events(entity_type, entity_id, occurred_at desc)
  where entity_type is not null;

create index if not exists idx_visitor_events_topic
  on public.visitor_events(topic, occurred_at desc)
  where topic is not null;

create index if not exists idx_visitor_profile_merges_user_id
  on public.visitor_profile_merges(user_id, merged_at desc)
  where user_id is not null;

create index if not exists idx_visitor_interest_scores_profile
  on public.visitor_interest_scores(visitor_profile_id, score desc);

create index if not exists idx_visitor_interest_scores_user_id
  on public.visitor_interest_scores(user_id, score desc)
  where user_id is not null;

create index if not exists idx_visitor_interest_scores_slug
  on public.visitor_interest_scores(interest_slug, score desc);

create index if not exists idx_visitor_interest_events_profile
  on public.visitor_interest_events(visitor_profile_id, created_at desc);

create index if not exists idx_visitor_interest_events_user_id
  on public.visitor_interest_events(user_id, created_at desc)
  where user_id is not null;

create index if not exists idx_visitor_interest_events_slug
  on public.visitor_interest_events(interest_slug, created_at desc);

alter table public.visitor_profiles enable row level security;
alter table public.visitor_sessions enable row level security;
alter table public.visitor_events enable row level security;
alter table public.visitor_profile_merges enable row level security;
alter table public.interest_taxonomy enable row level security;
alter table public.visitor_interest_scores enable row level security;
alter table public.visitor_interest_events enable row level security;

grant select, insert, update, delete on public.visitor_profiles to authenticated, service_role;
grant select, insert, update, delete on public.visitor_sessions to authenticated, service_role;
grant select, insert, update, delete on public.visitor_events to authenticated, service_role;
grant select, insert, update, delete on public.visitor_profile_merges to authenticated, service_role;
grant select on public.interest_taxonomy to anon, authenticated, service_role;
grant select, insert, update, delete on public.interest_taxonomy to authenticated, service_role;
grant select, insert, update, delete on public.visitor_interest_scores to authenticated, service_role;
grant select, insert, update, delete on public.visitor_interest_events to authenticated, service_role;

drop policy if exists "Users can read own visitor profiles" on public.visitor_profiles;
drop policy if exists "Operators can manage visitor profiles" on public.visitor_profiles;
drop policy if exists "Users can read own visitor sessions" on public.visitor_sessions;
drop policy if exists "Operators can manage visitor sessions" on public.visitor_sessions;
drop policy if exists "Users can read own visitor events" on public.visitor_events;
drop policy if exists "Operators can manage visitor events" on public.visitor_events;
drop policy if exists "Users can read own visitor merges" on public.visitor_profile_merges;
drop policy if exists "Operators can manage visitor merges" on public.visitor_profile_merges;
drop policy if exists "Anyone can read active interest taxonomy" on public.interest_taxonomy;
drop policy if exists "Operators can manage interest taxonomy" on public.interest_taxonomy;
drop policy if exists "Users can read own visitor interest scores" on public.visitor_interest_scores;
drop policy if exists "Operators can manage visitor interest scores" on public.visitor_interest_scores;
drop policy if exists "Users can read own visitor interest events" on public.visitor_interest_events;
drop policy if exists "Operators can manage visitor interest events" on public.visitor_interest_events;

create policy "Users can read own visitor profiles"
  on public.visitor_profiles for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Operators can manage visitor profiles"
  on public.visitor_profiles for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Users can read own visitor sessions"
  on public.visitor_sessions for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Operators can manage visitor sessions"
  on public.visitor_sessions for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Users can read own visitor events"
  on public.visitor_events for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Operators can manage visitor events"
  on public.visitor_events for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Users can read own visitor merges"
  on public.visitor_profile_merges for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Operators can manage visitor merges"
  on public.visitor_profile_merges for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Anyone can read active interest taxonomy"
  on public.interest_taxonomy for select
  to anon, authenticated
  using (active = true);

create policy "Operators can manage interest taxonomy"
  on public.interest_taxonomy for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Users can read own visitor interest scores"
  on public.visitor_interest_scores for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Operators can manage visitor interest scores"
  on public.visitor_interest_scores for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Users can read own visitor interest events"
  on public.visitor_interest_events for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Operators can manage visitor interest events"
  on public.visitor_interest_events for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

drop view if exists public.visitor_intelligence_summary;

create view public.visitor_intelligence_summary
with (security_invoker = true)
as
select
  'all_time'::text as period,
  count(*)::int as visitor_profiles,
  count(*) filter (where user_id is not null)::int as merged_profiles,
  coalesce(sum(page_view_count), 0)::int as page_views,
  coalesce(sum(share_count), 0)::int as shares,
  coalesce(sum(packet_build_count), 0)::int as packet_builds,
  coalesce(sum(download_count), 0)::int as downloads,
  coalesce(max(last_seen_at), null) as last_seen_at
from public.visitor_profiles
union all
select
  'last_7_days'::text as period,
  count(*)::int as visitor_profiles,
  count(*) filter (where user_id is not null)::int as merged_profiles,
  coalesce(sum(page_view_count), 0)::int as page_views,
  coalesce(sum(share_count), 0)::int as shares,
  coalesce(sum(packet_build_count), 0)::int as packet_builds,
  coalesce(sum(download_count), 0)::int as downloads,
  coalesce(max(last_seen_at), null) as last_seen_at
from public.visitor_profiles
where last_seen_at >= now() - interval '7 days'
union all
select
  'last_24_hours'::text as period,
  count(*)::int as visitor_profiles,
  count(*) filter (where user_id is not null)::int as merged_profiles,
  coalesce(sum(page_view_count), 0)::int as page_views,
  coalesce(sum(share_count), 0)::int as shares,
  coalesce(sum(packet_build_count), 0)::int as packet_builds,
  coalesce(sum(download_count), 0)::int as downloads,
  coalesce(max(last_seen_at), null) as last_seen_at
from public.visitor_profiles
where last_seen_at >= now() - interval '24 hours';

grant select on public.visitor_intelligence_summary to authenticated;

drop view if exists public.visitor_interest_graph_summary;

create view public.visitor_interest_graph_summary
with (security_invoker = true)
as
select
  taxonomy.slug as interest_slug,
  taxonomy.label,
  taxonomy.category,
  count(scores.id)::int as visitor_score_rows,
  count(scores.id) filter (where scores.user_id is not null)::int as merged_user_rows,
  coalesce(sum(scores.score), 0)::numeric(14,2) as total_score,
  coalesce(avg(scores.score), 0)::numeric(14,2) as average_score,
  coalesce(sum(scores.raw_event_count), 0)::int as raw_event_count,
  max(scores.last_scored_at) as last_scored_at
from public.interest_taxonomy taxonomy
left join public.visitor_interest_scores scores on scores.interest_slug = taxonomy.slug
where taxonomy.active = true
group by taxonomy.slug, taxonomy.label, taxonomy.category
order by total_score desc, taxonomy.label asc;

grant select on public.visitor_interest_graph_summary to authenticated;

-- ============================================================
-- RepWatchr Analytics Foundation v2
-- ============================================================
-- Purpose:
-- - Canonical event stream for monetization-readiness reporting.
-- - Explicit anonymous visitor/session IDs without IP or raw UA storage.
-- - Attribution touches for referrer/UTM funnel analysis.
-- - Compatibility columns on the existing visitor tables.

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null check (char_length(event_name) between 2 and 120),
  event_family text check (event_family is null or char_length(event_family) <= 80),
  anonymous_id text check (anonymous_id is null or char_length(anonymous_id) between 16 and 120),
  user_id uuid references auth.users(id) on delete set null,
  session_id text check (session_id is null or char_length(session_id) between 16 and 120),
  route text check (route is null or (route ~ '^/' and char_length(route) <= 500)),
  pathname text check (pathname is null or (pathname ~ '^/' and char_length(pathname) <= 500)),
  referrer text check (referrer is null or char_length(referrer) <= 500),
  utm_source text check (utm_source is null or char_length(utm_source) <= 120),
  utm_medium text check (utm_medium is null or char_length(utm_medium) <= 120),
  utm_campaign text check (utm_campaign is null or char_length(utm_campaign) <= 160),
  utm_term text check (utm_term is null or char_length(utm_term) <= 160),
  utm_content text check (utm_content is null or char_length(utm_content) <= 160),
  device_type text check (device_type is null or char_length(device_type) <= 40),
  browser text check (browser is null or char_length(browser) <= 80),
  os text check (os is null or char_length(os) <= 80),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null
);

alter table public.visitor_profiles
  add column if not exists first_route text check (first_route is null or (first_route ~ '^/' and char_length(first_route) <= 500)),
  add column if not exists last_route text check (last_route is null or (last_route ~ '^/' and char_length(last_route) <= 500)),
  add column if not exists first_referrer text check (first_referrer is null or char_length(first_referrer) <= 500),
  add column if not exists latest_referrer text check (latest_referrer is null or char_length(latest_referrer) <= 500),
  add column if not exists first_utm jsonb not null default '{}'::jsonb,
  add column if not exists latest_utm jsonb not null default '{}'::jsonb,
  add column if not exists profile_view_count int not null default 0 check (profile_view_count >= 0),
  add column if not exists search_count int not null default 0 check (search_count >= 0),
  add column if not exists source_click_count int not null default 0 check (source_click_count >= 0),
  add column if not exists source_submission_count int not null default 0 check (source_submission_count >= 0),
  add column if not exists watch_click_count int not null default 0 check (watch_click_count >= 0),
  add column if not exists share_click_count int not null default 0 check (share_click_count >= 0),
  add column if not exists package_interest_count int not null default 0 check (package_interest_count >= 0),
  add column if not exists signup_converted_at timestamptz,
  add column if not exists converted_user_id uuid references auth.users(id) on delete set null,
  add column if not exists interest_scores jsonb not null default '{}'::jsonb;

update public.visitor_profiles
set
  first_route = coalesce(first_route, entry_page),
  last_route = coalesce(last_route, exit_page),
  first_referrer = coalesce(first_referrer, referrer_host),
  latest_referrer = coalesce(latest_referrer, referrer_host),
  profile_view_count = greatest(profile_view_count, coalesce(jsonb_object_length(officials_viewed), 0)),
  share_click_count = greatest(share_click_count, share_count)
where first_route is null or last_route is null or share_click_count < share_count;

alter table public.visitor_sessions
  add column if not exists session_id text check (session_id is null or char_length(session_id) between 16 and 120),
  add column if not exists ended_at timestamptz,
  add column if not exists entry_route text check (entry_route is null or (entry_route ~ '^/' and char_length(entry_route) <= 500)),
  add column if not exists exit_route text check (exit_route is null or (exit_route ~ '^/' and char_length(exit_route) <= 500)),
  add column if not exists referrer text check (referrer is null or char_length(referrer) <= 500),
  add column if not exists utm jsonb not null default '{}'::jsonb,
  add column if not exists page_views int not null default 0 check (page_views >= 0),
  add column if not exists events_count int not null default 0 check (events_count >= 0),
  add column if not exists engaged_seconds int not null default 0 check (engaged_seconds >= 0);

update public.visitor_sessions
set
  session_id = coalesce(session_id, session_key),
  entry_route = coalesce(entry_route, entry_page),
  exit_route = coalesce(exit_route, exit_page),
  referrer = coalesce(referrer, referrer_host)
where session_id is null or entry_route is null or exit_route is null;

create unique index if not exists idx_visitor_sessions_session_id_unique
  on public.visitor_sessions(session_id)
  where session_id is not null;

alter table public.visitor_interest_events
  add column if not exists interest_key text,
  add column if not exists interest_family text,
  add column if not exists source_event text,
  add column if not exists source_entity_type text,
  add column if not exists source_entity_id text,
  add column if not exists route text check (route is null or (route ~ '^/' and char_length(route) <= 500)),
  add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.visitor_interest_events
set
  interest_key = coalesce(interest_key, interest_slug),
  interest_family = coalesce(interest_family, 'issue'),
  source_event = coalesce(source_event, source_event_type),
  route = coalesce(route, path)
where interest_key is null or interest_family is null or source_event is null or route is null;

alter table public.visitor_interest_events
  alter column visitor_profile_id drop not null,
  alter column anonymous_id drop not null,
  alter column interest_slug drop not null,
  alter column source_event_type drop not null,
  alter column interest_key set not null,
  alter column interest_family set not null;

create table if not exists public.attribution_touches (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text check (anonymous_id is null or char_length(anonymous_id) between 16 and 120),
  user_id uuid references auth.users(id) on delete set null,
  session_id text check (session_id is null or char_length(session_id) between 16 and 120),
  touch_type text not null check (char_length(touch_type) between 2 and 120),
  route text check (route is null or (route ~ '^/' and char_length(route) <= 500)),
  referrer text check (referrer is null or char_length(referrer) <= 500),
  utm_source text check (utm_source is null or char_length(utm_source) <= 120),
  utm_medium text check (utm_medium is null or char_length(utm_medium) <= 120),
  utm_campaign text check (utm_campaign is null or char_length(utm_campaign) <= 160),
  utm_term text check (utm_term is null or char_length(utm_term) <= 160),
  utm_content text check (utm_content is null or char_length(utm_content) <= 160),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create index if not exists idx_analytics_events_created_at
  on public.analytics_events(created_at desc);
create index if not exists idx_analytics_events_event_name
  on public.analytics_events(event_name, created_at desc);
create index if not exists idx_analytics_events_family
  on public.analytics_events(event_family, created_at desc)
  where event_family is not null;
create index if not exists idx_analytics_events_route
  on public.analytics_events(pathname, created_at desc)
  where pathname is not null;
create index if not exists idx_analytics_events_anonymous
  on public.analytics_events(anonymous_id, created_at desc)
  where anonymous_id is not null;
create index if not exists idx_analytics_events_user
  on public.analytics_events(user_id, created_at desc)
  where user_id is not null;

create index if not exists idx_attribution_touches_created_at
  on public.attribution_touches(created_at desc);
create index if not exists idx_attribution_touches_anonymous
  on public.attribution_touches(anonymous_id, created_at desc)
  where anonymous_id is not null;
create index if not exists idx_attribution_touches_user
  on public.attribution_touches(user_id, created_at desc)
  where user_id is not null;
create index if not exists idx_visitor_interest_events_key
  on public.visitor_interest_events(interest_key, created_at desc);
create index if not exists idx_visitor_interest_events_family
  on public.visitor_interest_events(interest_family, created_at desc);

alter table public.analytics_events enable row level security;
alter table public.attribution_touches enable row level security;

grant insert on public.analytics_events to anon, authenticated;
grant select on public.analytics_events to authenticated, service_role;
grant insert, update, delete on public.analytics_events to service_role;

grant insert on public.attribution_touches to anon, authenticated;
grant select on public.attribution_touches to authenticated, service_role;
grant insert, update, delete on public.attribution_touches to service_role;

drop policy if exists "Public can insert analytics events" on public.analytics_events;
drop policy if exists "Users can read own analytics events" on public.analytics_events;
drop policy if exists "Operators can manage analytics events" on public.analytics_events;
drop policy if exists "Public can insert attribution touches" on public.attribution_touches;
drop policy if exists "Users can read own attribution touches" on public.attribution_touches;
drop policy if exists "Operators can manage attribution touches" on public.attribution_touches;

create policy "Public can insert analytics events"
  on public.analytics_events for insert
  to anon, authenticated
  with check (true);

create policy "Users can read own analytics events"
  on public.analytics_events for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Operators can manage analytics events"
  on public.analytics_events for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Public can insert attribution touches"
  on public.attribution_touches for insert
  to anon, authenticated
  with check (true);

create policy "Users can read own attribution touches"
  on public.attribution_touches for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Operators can manage attribution touches"
  on public.attribution_touches for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

drop view if exists public.analytics_admin_summary;
drop view if exists public.analytics_top_routes;
drop view if exists public.analytics_top_search_terms;
drop view if exists public.analytics_top_profiles;
drop view if exists public.analytics_top_next_actions;

create view public.analytics_admin_summary
with (security_invoker = true)
as
select
  count(*)::int as total_events,
  count(*) filter (where event_name = 'page_view')::int as page_views,
  count(distinct anonymous_id)::int as unique_anonymous_visitors,
  count(distinct session_id)::int as sessions,
  count(*) filter (where event_name like '%search%')::int as searches,
  count(*) filter (where event_name = 'profile_open')::int as profile_opens,
  count(*) filter (where event_name in ('external_source_click', 'source_trail_opened'))::int as source_clicks,
  count(*) filter (where event_name = 'source_submit_completed')::int as source_submissions,
  count(*) filter (where event_name in ('profile_watch_clicked', 'watchlist_add'))::int as watchlist_clicks,
  count(*) filter (where event_name like 'package_interest%')::int as package_interest,
  max(created_at) as last_event_at
from public.analytics_events;

create view public.analytics_top_routes
with (security_invoker = true)
as
select
  coalesce(pathname, route, '/') as route,
  count(*)::int as event_count,
  count(*) filter (where event_name = 'page_view')::int as page_views,
  count(distinct anonymous_id)::int as unique_visitors,
  max(created_at) as last_event_at
from public.analytics_events
where coalesce(pathname, route) is not null
group by coalesce(pathname, route, '/')
order by page_views desc, event_count desc;

create view public.analytics_top_search_terms
with (security_invoker = true)
as
select
  nullif(lower(metadata->>'searchTerm'), '') as search_term,
  count(*)::int as search_count,
  count(distinct anonymous_id)::int as unique_visitors,
  max(created_at) as last_event_at
from public.analytics_events
where event_name like '%search%'
  and nullif(lower(metadata->>'searchTerm'), '') is not null
group by nullif(lower(metadata->>'searchTerm'), '')
order by search_count desc, last_event_at desc;

create view public.analytics_top_profiles
with (security_invoker = true)
as
select
  coalesce(metadata->>'entityId', metadata->>'entity_id') as profile_id,
  count(*)::int as open_count,
  count(distinct anonymous_id)::int as unique_visitors,
  max(created_at) as last_event_at
from public.analytics_events
where event_name = 'profile_open'
  and coalesce(metadata->>'entityId', metadata->>'entity_id') is not null
group by coalesce(metadata->>'entityId', metadata->>'entity_id')
order by open_count desc, last_event_at desc;

create view public.analytics_top_next_actions
with (security_invoker = true)
as
select
  event_name,
  event_family,
  count(*)::int as event_count,
  count(distinct anonymous_id)::int as unique_visitors,
  max(created_at) as last_event_at
from public.analytics_events
where event_name <> 'page_view'
group by event_name, event_family
order by event_count desc, last_event_at desc;

grant select on public.analytics_admin_summary to authenticated;
grant select on public.analytics_top_routes to authenticated;
grant select on public.analytics_top_search_terms to authenticated;
grant select on public.analytics_top_profiles to authenticated;
grant select on public.analytics_top_next_actions to authenticated;
