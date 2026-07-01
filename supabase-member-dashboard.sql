-- ============================================================
-- RepWatchr Member Dashboard Foundation
-- ============================================================
-- Purpose:
-- - Add digest preferences and contribution event tracking.
-- - Keep member dashboard rows private by default.
-- - Add compatibility columns for contributor profiles when the richer
--   contributor migration already exists.
--
-- Supabase Data API note:
-- New public tables need explicit grants in addition to RLS policies.

create extension if not exists pgcrypto;

create or replace function public.is_repw_dashboard_operator()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  allowed boolean := false;
begin
  if to_regclass('public.user_roles') is null then
    return false;
  end if;

  execute
    'select exists (
      select 1
      from public.user_roles
      where user_id = auth.uid()
        and role in (''admin'', ''reviewer'', ''researcher'')
    )'
  into allowed;

  return coalesce(allowed, false);
end;
$$;

create or replace function public.repw_member_dashboard_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.contributor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  display_name text,
  handle text unique,
  bio text,
  home_state text,
  home_county text,
  public_profile_enabled boolean not null default false,
  contribution_score int not null default 0,
  accepted_sources_count int not null default 0,
  rejected_sources_count int not null default 0,
  correction_count int not null default 0,
  packet_count int not null default 0,
  watchlist_count int not null default 0,
  badges jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.contributor_profiles
  add column if not exists bio text,
  add column if not exists home_state text,
  add column if not exists home_county text,
  add column if not exists contribution_score int not null default 0,
  add column if not exists rejected_sources_count int not null default 0,
  add column if not exists correction_count int not null default 0,
  add column if not exists packet_count int not null default 0,
  add column if not exists watchlist_count int not null default 0,
  add column if not exists badges jsonb not null default '[]'::jsonb;

create table if not exists public.contribution_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  event_type text not null check (char_length(event_type) between 2 and 120),
  entity_type text check (entity_type is null or char_length(entity_type) <= 80),
  entity_id text check (entity_id is null or char_length(entity_id) <= 240),
  points int not null default 0,
  status text not null default 'submitted'
    check (status in ('submitted', 'needs_review', 'accepted', 'verified', 'rejected', 'needs_more_info', 'attached_to_profile', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  weekly_digest boolean not null default true,
  daily_digest boolean not null default false,
  breaking_alerts boolean not null default false,
  watched_official_updates boolean not null default true,
  watched_race_updates boolean not null default true,
  source_review_updates boolean not null default true,
  contribution_updates boolean not null default true,
  package_updates boolean not null default false,
  email text check (email is null or char_length(email) <= 180),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_contribution_events_user
  on public.contribution_events(user_id, created_at desc);

create index if not exists idx_contribution_events_entity
  on public.contribution_events(entity_type, entity_id, created_at desc)
  where entity_type is not null and entity_id is not null;

create index if not exists idx_notification_preferences_user
  on public.notification_preferences(user_id, updated_at desc);

alter table public.contributor_profiles enable row level security;
alter table public.contribution_events enable row level security;
alter table public.notification_preferences enable row level security;

grant select on public.contributor_profiles to authenticated, service_role;
grant insert, update on public.contributor_profiles to authenticated;
grant select, insert, update, delete on public.contributor_profiles to service_role;

grant select, insert on public.contribution_events to authenticated;
grant select, insert, update, delete on public.contribution_events to service_role;

grant select, insert, update, delete on public.notification_preferences to authenticated, service_role;

drop policy if exists "Dashboard users read own contributor profile" on public.contributor_profiles;
drop policy if exists "Dashboard users create own contributor profile" on public.contributor_profiles;
drop policy if exists "Dashboard users update own contributor profile" on public.contributor_profiles;
drop policy if exists "Dashboard operators manage contributor profiles" on public.contributor_profiles;
drop policy if exists "Dashboard users read own contribution events" on public.contribution_events;
drop policy if exists "Dashboard users create own contribution events" on public.contribution_events;
drop policy if exists "Dashboard operators manage contribution events" on public.contribution_events;
drop policy if exists "Dashboard users manage own notification preferences" on public.notification_preferences;
drop policy if exists "Dashboard operators manage notification preferences" on public.notification_preferences;

create policy "Dashboard users read own contributor profile"
  on public.contributor_profiles for select
  to authenticated
  using ((select auth.uid()) = user_id or public_profile_enabled = true or public.is_repw_dashboard_operator());

create policy "Dashboard users create own contributor profile"
  on public.contributor_profiles for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Dashboard users update own contributor profile"
  on public.contributor_profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Dashboard operators manage contributor profiles"
  on public.contributor_profiles for all
  to authenticated
  using (public.is_repw_dashboard_operator())
  with check (public.is_repw_dashboard_operator());

create policy "Dashboard users read own contribution events"
  on public.contribution_events for select
  to authenticated
  using ((select auth.uid()) = user_id or public.is_repw_dashboard_operator());

create policy "Dashboard users create own contribution events"
  on public.contribution_events for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Dashboard operators manage contribution events"
  on public.contribution_events for all
  to authenticated
  using (public.is_repw_dashboard_operator())
  with check (public.is_repw_dashboard_operator());

create policy "Dashboard users manage own notification preferences"
  on public.notification_preferences for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Dashboard operators manage notification preferences"
  on public.notification_preferences for all
  to authenticated
  using (public.is_repw_dashboard_operator())
  with check (public.is_repw_dashboard_operator());

drop trigger if exists set_notification_preferences_updated_at on public.notification_preferences;
create trigger set_notification_preferences_updated_at
  before update on public.notification_preferences
  for each row
  execute function public.repw_member_dashboard_set_updated_at();

drop trigger if exists set_contributor_profiles_dashboard_updated_at on public.contributor_profiles;
create trigger set_contributor_profiles_dashboard_updated_at
  before update on public.contributor_profiles
  for each row
  execute function public.repw_member_dashboard_set_updated_at();
