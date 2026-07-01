-- ============================================================
-- RepWatchr Behavioral Analytics Engine
-- ============================================================
-- Run after:
--   1. supabase-superadmin-office.sql
--   2. supabase-visitor-intelligence.sql
--   3. supabase-contributor-profiles.sql
--
-- Purpose:
-- - Score every public page by engagement.
-- - Track CTR, time on page, return rate, session length, share rate,
--   watchlists, packets, source submissions, follows, email signup, checkout,
--   heatmaps, funnels, cohorts, and top entities.
--
-- Privacy boundary:
-- - No raw IP addresses.
-- - No raw user agents.
-- - No form field values.
-- - Raw behavioral rows are admin/operator controlled; public product pages
--   should use aggregate summaries only.

create extension if not exists pgcrypto;

create table if not exists public.behavioral_heatmap_events (
  id uuid primary key default gen_random_uuid(),
  visitor_event_id uuid references public.visitor_events(id) on delete set null,
  visitor_profile_id uuid references public.visitor_profiles(id) on delete cascade not null,
  session_id uuid references public.visitor_sessions(id) on delete set null,
  anonymous_id text not null check (char_length(anonymous_id) between 16 and 120),
  user_id uuid references auth.users(id) on delete set null,
  path text not null check (path ~ '^/' and char_length(path) <= 500),
  element_label text check (element_label is null or char_length(element_label) <= 160),
  element_href text check (element_href is null or char_length(element_href) <= 500),
  element_role text check (element_role is null or char_length(element_role) <= 60),
  x_percent integer not null check (x_percent between 0 and 100),
  y_percent integer not null check (y_percent between 0 and 100),
  viewport_width integer check (viewport_width is null or viewport_width between 0 and 10000),
  viewport_height integer check (viewport_height is null or viewport_height between 0 and 10000),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz default now() not null,
  created_at timestamptz default now() not null
);

create index if not exists idx_behavioral_heatmap_path
  on public.behavioral_heatmap_events(path, occurred_at desc);

create index if not exists idx_behavioral_heatmap_profile
  on public.behavioral_heatmap_events(visitor_profile_id, occurred_at desc);

create index if not exists idx_behavioral_heatmap_user
  on public.behavioral_heatmap_events(user_id, occurred_at desc)
  where user_id is not null;

alter table public.behavioral_heatmap_events enable row level security;

grant select on public.behavioral_heatmap_events to authenticated, service_role;
grant insert, update, delete on public.behavioral_heatmap_events to service_role;

drop policy if exists "Users can read own behavioral heatmap events" on public.behavioral_heatmap_events;
drop policy if exists "Operators can manage behavioral heatmap events" on public.behavioral_heatmap_events;

create policy "Users can read own behavioral heatmap events"
  on public.behavioral_heatmap_events for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Operators can manage behavioral heatmap events"
  on public.behavioral_heatmap_events for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

drop view if exists public.behavioral_retention_cohorts;
drop view if exists public.behavioral_funnel_summary;
drop view if exists public.behavioral_heatmap_summary;
drop view if exists public.behavioral_top_lists;
drop view if exists public.behavioral_top_entities;
drop view if exists public.behavioral_kpi_summary;
drop view if exists public.behavioral_page_engagement_scores;

create view public.behavioral_page_engagement_scores
with (security_invoker = true)
as
with page_events as (
  select
    events.path,
    count(*) filter (where events.event_type = 'page_view')::int as page_views,
    count(distinct events.visitor_profile_id)::int as unique_visitors,
    count(distinct events.session_id) filter (where events.session_id is not null)::int as sessions,
    count(*) filter (
      where events.event_type not in ('page_view', 'time_spent', 'scroll_depth', 'exit', 'heatmap_click')
    )::int as action_clicks,
    count(*) filter (where events.event_type = 'heatmap_click')::int as heatmap_clicks,
    count(*) filter (where events.event_type = 'share')::int as shares,
    count(*) filter (where events.event_type in ('watchlist_creation', 'watch_record'))::int as watchlist_creations,
    count(*) filter (where events.event_type in ('packet_creation', 'packet_build'))::int as packet_creations,
    count(*) filter (where events.event_type in ('source_submission', 'submit_source'))::int as source_submissions,
    count(*) filter (where events.event_type = 'official_follow')::int as official_follows,
    count(*) filter (where events.event_type = 'race_follow')::int as race_follows,
    count(*) filter (where events.event_type = 'email_signup')::int as email_signups,
    count(*) filter (where events.event_type = 'checkout_started')::int as checkout_starts,
    count(*) filter (where events.event_type = 'checkout_completed')::int as checkout_completions,
    count(*) filter (where events.event_type = 'exit')::int as exits,
    coalesce(avg(events.time_spent_ms) filter (
      where events.event_type in ('time_spent', 'exit') and events.time_spent_ms is not null
    ), 0)::numeric as avg_time_on_page_ms,
    coalesce(sum(events.time_spent_ms) filter (
      where events.event_type in ('time_spent', 'exit') and events.time_spent_ms is not null
    ), 0)::numeric as total_time_on_page_ms,
    coalesce(avg(events.scroll_percent) filter (
      where events.scroll_percent is not null
    ), 0)::numeric as avg_scroll_percent,
    max(events.occurred_at) as last_event_at
  from public.visitor_events events
  where events.path is not null
  group by events.path
),
scored as (
  select
    page_events.*,
    (
      page_events.watchlist_creations +
      page_events.packet_creations +
      page_events.source_submissions +
      page_events.official_follows +
      page_events.race_follows +
      page_events.email_signups +
      page_events.checkout_completions
    )::numeric as conversion_actions
  from page_events
)
select
  path,
  page_views,
  unique_visitors,
  sessions,
  action_clicks,
  heatmap_clicks,
  shares,
  watchlist_creations,
  packet_creations,
  source_submissions,
  official_follows,
  race_follows,
  email_signups,
  checkout_starts,
  checkout_completions,
  exits,
  round(avg_time_on_page_ms / 1000, 2) as avg_time_on_page_seconds,
  round(total_time_on_page_ms / 1000, 2) as total_time_on_page_seconds,
  round(avg_scroll_percent, 2) as avg_scroll_percent,
  coalesce(round((action_clicks::numeric / nullif(page_views, 0)) * 100, 2), 0) as ctr_percent,
  coalesce(round((shares::numeric / nullif(page_views, 0)) * 100, 2), 0) as share_rate_percent,
  coalesce(round((exits::numeric / nullif(page_views, 0)) * 100, 2), 0) as exit_rate_percent,
  least(100, greatest(0, round(
    coalesce((least(avg_time_on_page_ms / 1000, 180) / 180) * 22, 0) +
    coalesce((least(avg_scroll_percent, 100) / 100) * 18, 0) +
    coalesce((least(action_clicks::numeric / nullif(page_views, 0), 4) / 4) * 16, 0) +
    coalesce(least(shares::numeric / nullif(page_views, 0), 1) * 14, 0) +
    coalesce(least(conversion_actions / nullif(page_views, 0), 1) * 22, 0) +
    coalesce((least(sessions::numeric / nullif(unique_visitors, 0), 3) / 3) * 8, 0)
  )::int)) as engagement_score,
  last_event_at
from scored
order by engagement_score desc, page_views desc, last_event_at desc;

create view public.behavioral_kpi_summary
with (security_invoker = true)
as
with recent_events as (
  select *
  from public.visitor_events
  where occurred_at >= now() - interval '30 days'
),
recent_sessions as (
  select *
  from public.visitor_sessions
  where started_at >= now() - interval '30 days'
),
recent_profiles as (
  select *
  from public.visitor_profiles
  where last_seen_at >= now() - interval '30 days'
),
page_scores as (
  select *
  from public.behavioral_page_engagement_scores
),
event_summary as (
  select
    count(*) filter (where recent_events.event_type = 'page_view')::int as page_views,
    count(distinct recent_events.visitor_profile_id)::int as unique_visitors,
    count(*) filter (
      where recent_events.event_type not in ('page_view', 'time_spent', 'scroll_depth', 'exit', 'heatmap_click')
    )::int as action_clicks,
    count(*) filter (where recent_events.event_type = 'heatmap_click')::int as heatmap_clicks,
    count(*) filter (where recent_events.event_type = 'share')::int as shares,
    count(*) filter (where recent_events.event_type in ('watchlist_creation', 'watch_record'))::int as watchlist_creations,
    count(*) filter (where recent_events.event_type in ('packet_creation', 'packet_build'))::int as packet_creations,
    count(*) filter (where recent_events.event_type in ('source_submission', 'submit_source'))::int as source_submissions,
    count(*) filter (where recent_events.event_type = 'official_follow')::int as official_follows,
    count(*) filter (where recent_events.event_type = 'race_follow')::int as race_follows,
    count(*) filter (where recent_events.event_type = 'email_signup')::int as email_signups,
    count(*) filter (where recent_events.event_type = 'checkout_started')::int as checkout_starts,
    count(*) filter (where recent_events.event_type = 'checkout_completed')::int as checkout_completions,
    count(*) filter (where recent_events.event_type = 'admin_dashboard_opened')::int as admin_dashboard_opens,
    coalesce(round(avg(recent_events.time_spent_ms) filter (
      where recent_events.event_type in ('time_spent', 'exit') and recent_events.time_spent_ms is not null
    ) / 1000, 2), 0) as avg_time_on_page_seconds,
    coalesce(round(
      (
        count(*) filter (
          where recent_events.event_type not in ('page_view', 'time_spent', 'scroll_depth', 'exit', 'heatmap_click')
        )::numeric / nullif(count(*) filter (where recent_events.event_type = 'page_view'), 0)
      ) * 100,
      2
    ), 0) as ctr_percent,
    coalesce(round(
      (count(*) filter (where recent_events.event_type = 'share')::numeric / nullif(count(*) filter (where recent_events.event_type = 'page_view'), 0)) * 100,
      2
    ), 0) as share_rate_percent,
    max(recent_events.occurred_at) as last_event_at
  from recent_events
),
session_summary as (
  select
    count(*)::int as sessions,
    coalesce(round(avg(total_time_ms) / 1000, 2), 0) as avg_session_length_seconds
  from recent_sessions
),
profile_summary as (
  select
    coalesce(round(
      (count(*) filter (where session_count > 1)::numeric / nullif(count(*), 0)) * 100,
      2
    ), 0) as return_rate_percent
  from recent_profiles
),
score_summary as (
  select coalesce(round(avg(engagement_score), 2), 0) as avg_page_engagement_score
  from page_scores
)
select
  'last_30_days'::text as period,
  event_summary.page_views,
  event_summary.unique_visitors,
  session_summary.sessions,
  event_summary.action_clicks,
  event_summary.heatmap_clicks,
  event_summary.shares,
  event_summary.watchlist_creations,
  event_summary.packet_creations,
  event_summary.source_submissions,
  event_summary.official_follows,
  event_summary.race_follows,
  event_summary.email_signups,
  event_summary.checkout_starts,
  event_summary.checkout_completions,
  event_summary.admin_dashboard_opens,
  event_summary.avg_time_on_page_seconds,
  session_summary.avg_session_length_seconds,
  event_summary.ctr_percent,
  event_summary.share_rate_percent,
  profile_summary.return_rate_percent,
  score_summary.avg_page_engagement_score,
  event_summary.last_event_at
from event_summary
cross join session_summary
cross join profile_summary
cross join score_summary;

create view public.behavioral_top_entities
with (security_invoker = true)
as
select
  events.entity_type,
  events.entity_id,
  coalesce(max(events.entity_label), events.entity_id) as entity_label,
  count(*)::int as event_count,
  count(*) filter (where events.event_type in ('page_view', 'profile_view'))::int as view_count,
  count(*) filter (where events.event_type = 'share')::int as share_count,
  count(*) filter (where events.event_type in ('watch_record', 'watchlist_creation', 'official_follow', 'race_follow'))::int as follow_count,
  count(distinct events.visitor_profile_id)::int as unique_visitors,
  max(events.occurred_at) as last_event_at
from public.visitor_events events
where events.entity_type is not null
  and events.entity_id is not null
group by events.entity_type, events.entity_id
order by event_count desc, unique_visitors desc, last_event_at desc;

create view public.behavioral_top_lists
with (security_invoker = true)
as
select
  'pages'::text as list_type,
  scores.path as item_key,
  scores.path as item_label,
  scores.page_views as metric_count,
  scores.unique_visitors,
  scores.engagement_score,
  scores.last_event_at
from public.behavioral_page_engagement_scores scores
union all
select
  'officials'::text as list_type,
  entity_id as item_key,
  entity_label as item_label,
  event_count as metric_count,
  unique_visitors,
  least(100, (view_count * 4) + (share_count * 10) + (follow_count * 14))::int as engagement_score,
  last_event_at
from public.behavioral_top_entities
where entity_type in ('official', 'official_funding')
union all
select
  'stories'::text as list_type,
  entity_id as item_key,
  entity_label as item_label,
  event_count as metric_count,
  unique_visitors,
  least(100, (view_count * 5) + (share_count * 12))::int as engagement_score,
  last_event_at
from public.behavioral_top_entities
where entity_type = 'article'
union all
select
  'counties'::text as list_type,
  events.county as item_key,
  events.county as item_label,
  count(*)::int as metric_count,
  count(distinct events.visitor_profile_id)::int as unique_visitors,
  least(100, count(*)::int)::int as engagement_score,
  max(events.occurred_at) as last_event_at
from public.visitor_events events
where events.county is not null
group by events.county
union all
select
  'searches'::text as list_type,
  lower(events.search_term) as item_key,
  events.search_term as item_label,
  count(*)::int as metric_count,
  count(distinct events.visitor_profile_id)::int as unique_visitors,
  least(100, count(*)::int * 3)::int as engagement_score,
  max(events.occurred_at) as last_event_at
from public.visitor_events events
where events.search_term is not null
group by lower(events.search_term), events.search_term
union all
select
  'exits'::text as list_type,
  coalesce(events.exit_page, events.path) as item_key,
  coalesce(events.exit_page, events.path) as item_label,
  count(*)::int as metric_count,
  count(distinct events.visitor_profile_id)::int as unique_visitors,
  greatest(0, 100 - count(*)::int)::int as engagement_score,
  max(events.occurred_at) as last_event_at
from public.visitor_events events
where events.event_type = 'exit'
  and coalesce(events.exit_page, events.path) is not null
group by coalesce(events.exit_page, events.path)
union all
select
  'contributors'::text as list_type,
  coalesce(contributors.handle, contributors.id::text) as item_key,
  coalesce(contributors.display_name, contributors.handle, 'Contributor') as item_label,
  contributors.contribution_count as metric_count,
  1::int as unique_visitors,
  least(100, round((contributors.total_xp::numeric / 25) + contributors.accuracy_score / 2)::int) as engagement_score,
  contributors.last_contributed_at as last_event_at
from public.contributor_profiles contributors
where contributors.public_profile_enabled = true
order by metric_count desc, unique_visitors desc, engagement_score desc;

create view public.behavioral_heatmap_summary
with (security_invoker = true)
as
select
  path,
  (floor(x_percent::numeric / 10) * 10)::int as x_bucket,
  (floor(y_percent::numeric / 10) * 10)::int as y_bucket,
  count(*)::int as click_count,
  count(distinct visitor_profile_id)::int as unique_visitors,
  max(occurred_at) as last_click_at
from public.behavioral_heatmap_events
group by path, (floor(x_percent::numeric / 10) * 10)::int, (floor(y_percent::numeric / 10) * 10)::int
order by click_count desc, last_click_at desc;

create view public.behavioral_funnel_summary
with (security_invoker = true)
as
select
  'source_loop'::text as funnel_name,
  1 as step_order,
  'page_view'::text as step_key,
  'Opened a page'::text as step_label,
  count(*) filter (where event_type = 'page_view')::int as event_count,
  count(distinct visitor_profile_id) filter (where event_type = 'page_view')::int as unique_visitors
from public.visitor_events
union all
select 'source_loop', 2, 'search', 'Searched a name or record',
  count(*) filter (where event_type = 'search')::int,
  count(distinct visitor_profile_id) filter (where event_type = 'search')::int
from public.visitor_events
union all
select 'source_loop', 3, 'official_or_story', 'Opened an official or story',
  count(*) filter (where entity_type in ('official', 'article') and event_type in ('page_view', 'profile_view'))::int,
  count(distinct visitor_profile_id) filter (where entity_type in ('official', 'article') and event_type in ('page_view', 'profile_view'))::int
from public.visitor_events
union all
select 'source_loop', 4, 'share', 'Shared or copied the receipt',
  count(*) filter (where event_type = 'share')::int,
  count(distinct visitor_profile_id) filter (where event_type = 'share')::int
from public.visitor_events
union all
select 'source_loop', 5, 'source_or_packet', 'Submitted source or built packet',
  count(*) filter (where event_type in ('source_submission', 'submit_source', 'packet_creation', 'packet_build'))::int,
  count(distinct visitor_profile_id) filter (where event_type in ('source_submission', 'submit_source', 'packet_creation', 'packet_build'))::int
from public.visitor_events
union all
select 'paid_services', 1, 'services_view', 'Opened service pages',
  count(*) filter (where path like '/services%')::int,
  count(distinct visitor_profile_id) filter (where path like '/services%')::int
from public.visitor_events
union all
select 'paid_services', 2, 'checkout_started', 'Started checkout',
  count(*) filter (where event_type = 'checkout_started')::int,
  count(distinct visitor_profile_id) filter (where event_type = 'checkout_started')::int
from public.visitor_events
union all
select 'paid_services', 3, 'checkout_completed', 'Completed checkout',
  count(*) filter (where event_type = 'checkout_completed')::int,
  count(distinct visitor_profile_id) filter (where event_type = 'checkout_completed')::int
from public.visitor_events;

create view public.behavioral_retention_cohorts
with (security_invoker = true)
as
select
  date_trunc('week', first_seen_at)::date as cohort_week,
  count(*)::int as cohort_visitors,
  count(*) filter (where session_count > 1)::int as returned_visitors,
  count(*) filter (where last_seen_at >= first_seen_at + interval '1 day')::int as retained_after_1d,
  count(*) filter (where last_seen_at >= first_seen_at + interval '7 days')::int as retained_after_7d,
  count(*) filter (where last_seen_at >= first_seen_at + interval '30 days')::int as retained_after_30d,
  coalesce(round((count(*) filter (where session_count > 1)::numeric / nullif(count(*), 0)) * 100, 2), 0) as return_rate_percent,
  coalesce(round(avg(total_time_ms) / 1000, 2), 0) as avg_total_time_seconds,
  max(last_seen_at) as last_seen_at
from public.visitor_profiles
group by date_trunc('week', first_seen_at)::date
order by cohort_week desc;

grant select on public.behavioral_page_engagement_scores to authenticated, service_role;
grant select on public.behavioral_kpi_summary to authenticated, service_role;
grant select on public.behavioral_top_entities to authenticated, service_role;
grant select on public.behavioral_top_lists to authenticated, service_role;
grant select on public.behavioral_heatmap_summary to authenticated, service_role;
grant select on public.behavioral_funnel_summary to authenticated, service_role;
grant select on public.behavioral_retention_cohorts to authenticated, service_role;
