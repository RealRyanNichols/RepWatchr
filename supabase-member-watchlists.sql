-- ============================================================
-- RepWatchr Unlimited Member Watchlists
-- ============================================================
-- Run after supabase-superadmin-office.sql and
-- supabase-gideon-member-tools.sql.
--
-- Purpose:
-- - Let members create unlimited watchlists.
-- - Watch officials, cities, school boards, issues, bills, campaigns,
--   donors, PACs, county commissioners, agencies, courts, and judges.
-- - Store digest and alert preferences separately from watched entities.
-- - Keep alert events as return hooks without fake urgency.

create extension if not exists pgcrypto;

do $$
begin
  create type public.member_watch_entity_type as enum (
    'official',
    'city',
    'school_board',
    'issue',
    'bill',
    'campaign',
    'donor',
    'pac',
    'county_commissioner',
    'agency',
    'court',
    'judge',
    'race',
    'county',
    'research'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.member_watch_alert_type as enum (
    'weekly_digest',
    'daily_digest',
    'breaking_alerts',
    'major_vote_alerts',
    'new_funding',
    'new_source',
    'new_article',
    'new_correction',
    'new_meeting',
    'new_filing'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.member_watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null check (char_length(name) between 1 and 160),
  description text check (char_length(coalesce(description, '')) <= 1000),
  color text not null default 'blue' check (color in ('blue', 'red', 'gold', 'green', 'slate')),
  default_delivery_channels text[] not null default array['in_app']::text[],
  is_default boolean not null default false,
  archived_at timestamptz,
  last_alert_at timestamptz,
  last_digest_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (user_id, name)
);

create table if not exists public.member_watchlist_items (
  id uuid primary key default gen_random_uuid(),
  watchlist_id uuid references public.member_watchlists(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  entity_type public.member_watch_entity_type not null,
  entity_id text check (entity_id is null or char_length(entity_id) <= 180),
  label text not null check (char_length(label) between 1 and 220),
  href text check (href is null or char_length(href) <= 1000),
  jurisdiction text check (jurisdiction is null or char_length(jurisdiction) <= 180),
  source_context text check (source_context is null or char_length(source_context) <= 500),
  notes text check (notes is null or char_length(notes) <= 2000),
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (watchlist_id, entity_type, entity_id),
  unique (watchlist_id, entity_type, label)
);

create table if not exists public.member_watchlist_alert_preferences (
  id uuid primary key default gen_random_uuid(),
  watchlist_id uuid references public.member_watchlists(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  alert_type public.member_watch_alert_type not null,
  enabled boolean not null default true,
  delivery_channels text[] not null default array['in_app']::text[],
  minimum_severity text not null default 'normal' check (minimum_severity in ('low', 'normal', 'high', 'urgent')),
  last_sent_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (watchlist_id, alert_type)
);

create table if not exists public.member_watchlist_alert_events (
  id uuid primary key default gen_random_uuid(),
  watchlist_id uuid references public.member_watchlists(id) on delete cascade not null,
  watchlist_item_id uuid references public.member_watchlist_items(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade not null,
  alert_type public.member_watch_alert_type not null,
  title text not null check (char_length(title) between 1 and 240),
  summary text not null check (char_length(summary) between 1 and 2000),
  href text check (href is null or char_length(href) <= 1000),
  severity text not null default 'normal' check (severity in ('low', 'normal', 'high', 'urgent')),
  source_table text check (source_table is null or char_length(source_table) <= 120),
  source_id text check (source_id is null or char_length(source_id) <= 180),
  status text not null default 'unread' check (status in ('unread', 'read', 'dismissed')),
  triggered_at timestamptz default now() not null,
  read_at timestamptz,
  created_at timestamptz default now() not null
);

create table if not exists public.member_watchlist_digest_runs (
  id uuid primary key default gen_random_uuid(),
  watchlist_id uuid references public.member_watchlists(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  digest_type public.member_watch_alert_type not null check (digest_type in ('weekly_digest', 'daily_digest')),
  subject text not null check (char_length(subject) between 1 and 240),
  summary text not null check (char_length(summary) between 1 and 5000),
  item_count integer not null default 0 check (item_count >= 0),
  alert_count integer not null default 0 check (alert_count >= 0),
  delivered_at timestamptz,
  created_at timestamptz default now() not null
);

create index if not exists idx_member_watchlists_user
  on public.member_watchlists(user_id, updated_at desc)
  where archived_at is null;

create index if not exists idx_member_watchlist_items_user
  on public.member_watchlist_items(user_id, updated_at desc)
  where active = true;

create index if not exists idx_member_watchlist_items_watchlist
  on public.member_watchlist_items(watchlist_id, entity_type, updated_at desc);

create index if not exists idx_member_watchlist_alert_preferences_watchlist
  on public.member_watchlist_alert_preferences(watchlist_id, alert_type);

create index if not exists idx_member_watchlist_alert_events_user
  on public.member_watchlist_alert_events(user_id, triggered_at desc);

create index if not exists idx_member_watchlist_alert_events_watchlist
  on public.member_watchlist_alert_events(watchlist_id, status, triggered_at desc);

create index if not exists idx_member_watchlist_digest_runs_user
  on public.member_watchlist_digest_runs(user_id, created_at desc);

alter table public.member_watchlists enable row level security;
alter table public.member_watchlist_items enable row level security;
alter table public.member_watchlist_alert_preferences enable row level security;
alter table public.member_watchlist_alert_events enable row level security;
alter table public.member_watchlist_digest_runs enable row level security;

grant select, insert, update, delete on public.member_watchlists to authenticated, service_role;
grant select, insert, update, delete on public.member_watchlist_items to authenticated, service_role;
grant select, insert, update, delete on public.member_watchlist_alert_preferences to authenticated, service_role;
grant select, insert, update, delete on public.member_watchlist_alert_events to authenticated, service_role;
grant select, insert, update, delete on public.member_watchlist_digest_runs to authenticated, service_role;
grant usage on type public.member_watch_entity_type to authenticated, service_role;
grant usage on type public.member_watch_alert_type to authenticated, service_role;

drop policy if exists "Users can manage own watchlists" on public.member_watchlists;
drop policy if exists "Operators can manage all watchlists" on public.member_watchlists;
drop policy if exists "Users can manage own watchlist items" on public.member_watchlist_items;
drop policy if exists "Operators can manage all watchlist items" on public.member_watchlist_items;
drop policy if exists "Users can manage own watchlist alert preferences" on public.member_watchlist_alert_preferences;
drop policy if exists "Operators can manage all watchlist alert preferences" on public.member_watchlist_alert_preferences;
drop policy if exists "Users can manage own watchlist alert events" on public.member_watchlist_alert_events;
drop policy if exists "Operators can manage all watchlist alert events" on public.member_watchlist_alert_events;
drop policy if exists "Users can read own watchlist digest runs" on public.member_watchlist_digest_runs;
drop policy if exists "Operators can manage all watchlist digest runs" on public.member_watchlist_digest_runs;

create policy "Users can manage own watchlists"
  on public.member_watchlists for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Operators can manage all watchlists"
  on public.member_watchlists for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Users can manage own watchlist items"
  on public.member_watchlist_items for all
  to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.member_watchlists watchlists
      where watchlists.id = watchlist_id
        and watchlists.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.member_watchlists watchlists
      where watchlists.id = watchlist_id
        and watchlists.user_id = (select auth.uid())
    )
  );

create policy "Operators can manage all watchlist items"
  on public.member_watchlist_items for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Users can manage own watchlist alert preferences"
  on public.member_watchlist_alert_preferences for all
  to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.member_watchlists watchlists
      where watchlists.id = watchlist_id
        and watchlists.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.member_watchlists watchlists
      where watchlists.id = watchlist_id
        and watchlists.user_id = (select auth.uid())
    )
  );

create policy "Operators can manage all watchlist alert preferences"
  on public.member_watchlist_alert_preferences for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Users can manage own watchlist alert events"
  on public.member_watchlist_alert_events for all
  to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.member_watchlists watchlists
      where watchlists.id = watchlist_id
        and watchlists.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.member_watchlists watchlists
      where watchlists.id = watchlist_id
        and watchlists.user_id = (select auth.uid())
    )
  );

create policy "Operators can manage all watchlist alert events"
  on public.member_watchlist_alert_events for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Users can read own watchlist digest runs"
  on public.member_watchlist_digest_runs for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.member_watchlists watchlists
      where watchlists.id = watchlist_id
        and watchlists.user_id = (select auth.uid())
    )
  );

create policy "Operators can manage all watchlist digest runs"
  on public.member_watchlist_digest_runs for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

drop trigger if exists set_member_watchlists_updated_at on public.member_watchlists;
create trigger set_member_watchlists_updated_at
  before update on public.member_watchlists
  for each row execute function public.handle_updated_at();

drop trigger if exists set_member_watchlist_items_updated_at on public.member_watchlist_items;
create trigger set_member_watchlist_items_updated_at
  before update on public.member_watchlist_items
  for each row execute function public.handle_updated_at();

drop trigger if exists set_member_watchlist_alert_preferences_updated_at on public.member_watchlist_alert_preferences;
create trigger set_member_watchlist_alert_preferences_updated_at
  before update on public.member_watchlist_alert_preferences
  for each row execute function public.handle_updated_at();

drop view if exists public.member_watchlist_summary;

create view public.member_watchlist_summary
with (security_invoker = true)
as
select
  watchlists.id as watchlist_id,
  watchlists.user_id,
  watchlists.name,
  watchlists.color,
  count(items.id)::int as active_item_count,
  count(alerts.id) filter (where alerts.status = 'unread')::int as unread_alert_count,
  max(alerts.triggered_at) as latest_alert_at,
  watchlists.updated_at
from public.member_watchlists watchlists
left join public.member_watchlist_items items
  on items.watchlist_id = watchlists.id
  and items.active = true
left join public.member_watchlist_alert_events alerts
  on alerts.watchlist_id = watchlists.id
where watchlists.archived_at is null
group by watchlists.id, watchlists.user_id, watchlists.name, watchlists.color, watchlists.updated_at;

grant select on public.member_watchlist_summary to authenticated, service_role;
