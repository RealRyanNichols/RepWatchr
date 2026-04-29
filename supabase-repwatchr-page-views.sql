-- ============================================================
-- RepWatchr owned page-view analytics
-- ============================================================
-- Run this after supabase-profile-claims.sql and
-- supabase-superadmin-office.sql so public.is_repw_operator() exists.
-- This stores public-page counts only. Raw IP addresses and raw user-agent
-- strings are not stored.

create table if not exists public.site_page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null check (path ~ '^/' and char_length(path) between 1 and 500),
  referrer_host text check (referrer_host is null or char_length(referrer_host) <= 120),
  visitor_hash text check (visitor_hash is null or char_length(visitor_hash) = 64),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  device_kind text not null default 'unknown' check (device_kind in ('desktop', 'mobile', 'tablet', 'bot', 'unknown')),
  source text not null default 'repwatchr_client',
  created_at timestamptz default now() not null
);

create index if not exists idx_site_page_views_created_at
  on public.site_page_views(created_at desc);

create index if not exists idx_site_page_views_path_created_at
  on public.site_page_views(path, created_at desc);

create index if not exists idx_site_page_views_visitor_hash_created_at
  on public.site_page_views(visitor_hash, created_at desc)
  where visitor_hash is not null;

alter table public.site_page_views enable row level security;

drop policy if exists "Operators can read page view analytics" on public.site_page_views;

create policy "Operators can read page view analytics"
  on public.site_page_views for select
  to authenticated
  using (public.is_repw_operator());

drop view if exists public.site_page_view_summary;

create view public.site_page_view_summary
with (security_invoker = true)
as
select
  'all_time'::text as period,
  count(*)::int as page_views,
  count(distinct visitor_hash) filter (where visitor_hash is not null)::int as unique_daily_visitors,
  max(created_at) as last_view_at
from public.site_page_views
union all
select
  'last_7_days'::text as period,
  count(*)::int as page_views,
  count(distinct visitor_hash) filter (where visitor_hash is not null)::int as unique_daily_visitors,
  max(created_at) as last_view_at
from public.site_page_views
where created_at >= now() - interval '7 days'
union all
select
  'last_24_hours'::text as period,
  count(*)::int as page_views,
  count(distinct visitor_hash) filter (where visitor_hash is not null)::int as unique_daily_visitors,
  max(created_at) as last_view_at
from public.site_page_views
where created_at >= now() - interval '24 hours';

grant select on public.site_page_view_summary to authenticated;
