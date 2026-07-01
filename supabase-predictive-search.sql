-- ============================================================
-- RepWatchr Predictive Search
-- ============================================================
-- Run after:
--   1. supabase-profile-claims.sql
--   2. supabase-superadmin-office.sql
--
-- Search events are private product telemetry. Public popular/trending search
-- suggestions come from a controlled suggestion catalog, not raw user queries.

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.search_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text check (char_length(coalesce(anonymous_id, '')) <= 120),
  session_id text check (char_length(coalesce(session_id, '')) <= 120),
  query text not null check (char_length(query) between 1 and 220),
  normalized_query text not null check (char_length(normalized_query) between 1 and 220),
  source_surface text not null default 'predictive_search' check (char_length(source_surface) between 1 and 80),
  route text check (char_length(coalesce(route, '')) <= 500),
  referrer text check (char_length(coalesce(referrer, '')) <= 1000),
  result_count integer not null default 0 check (result_count >= 0),
  result_types jsonb not null default '{}'::jsonb,
  selected_result_kind text check (char_length(coalesce(selected_result_kind, '')) <= 60),
  selected_result_id text check (char_length(coalesce(selected_result_id, '')) <= 240),
  selected_result_href text check (char_length(coalesce(selected_result_href, '')) <= 1000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  query text not null check (char_length(query) between 1 and 220),
  normalized_query text not null check (char_length(normalized_query) between 1 and 220),
  title text check (char_length(coalesce(title, '')) <= 160),
  scope text not null default 'all' check (
    scope in ('all', 'officials', 'boards', 'counties', 'agencies', 'stories', 'issues', 'votes', 'funding', 'campaigns', 'news')
  ),
  alert_frequency text not null default 'none' check (alert_frequency in ('none', 'daily', 'weekly')),
  public_share_enabled boolean not null default false,
  share_id uuid not null default gen_random_uuid(),
  last_opened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, normalized_query, scope)
);

create table if not exists public.search_public_suggestions (
  id uuid primary key default gen_random_uuid(),
  query text not null check (char_length(query) between 1 and 220),
  normalized_query text not null check (char_length(normalized_query) between 1 and 220),
  label text not null check (char_length(label) between 1 and 220),
  kind text not null default 'popular' check (kind in ('popular', 'trending', 'suggestion')),
  href text not null check (char_length(href) between 1 and 1000),
  priority integer not null default 50 check (priority between 0 and 1000),
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(normalized_query, kind)
);

create index if not exists idx_search_events_created
  on public.search_events(created_at desc);

create index if not exists idx_search_events_normalized
  on public.search_events(normalized_query, created_at desc);

create index if not exists idx_search_events_user
  on public.search_events(user_id, created_at desc)
  where user_id is not null;

create index if not exists idx_saved_searches_user
  on public.saved_searches(user_id, updated_at desc);

create index if not exists idx_search_public_suggestions_active
  on public.search_public_suggestions(kind, active, priority desc, updated_at desc);

alter table public.search_events enable row level security;
alter table public.saved_searches enable row level security;
alter table public.search_public_suggestions enable row level security;

drop policy if exists "Anyone can record predictive search usage" on public.search_events;
drop policy if exists "Users read own search events" on public.search_events;
drop policy if exists "Operators read all search events" on public.search_events;
drop policy if exists "Users manage own saved searches" on public.saved_searches;
drop policy if exists "Operators manage saved searches" on public.saved_searches;
drop policy if exists "Public reads active search suggestions" on public.search_public_suggestions;
drop policy if exists "Operators manage search suggestions" on public.search_public_suggestions;

create policy "Anyone can record predictive search usage"
  on public.search_events for insert
  to anon, authenticated
  with check (
    user_id is null
    or (select auth.uid()) = user_id
  );

create policy "Users read own search events"
  on public.search_events for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Operators read all search events"
  on public.search_events for select
  to authenticated
  using (public.is_repw_operator());

create policy "Users manage own saved searches"
  on public.saved_searches for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Operators manage saved searches"
  on public.saved_searches for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Public reads active search suggestions"
  on public.search_public_suggestions for select
  using (
    active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

create policy "Operators manage search suggestions"
  on public.search_public_suggestions for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

drop trigger if exists set_saved_searches_updated_at on public.saved_searches;
create trigger set_saved_searches_updated_at
  before update on public.saved_searches
  for each row execute function public.handle_updated_at();

drop trigger if exists set_search_public_suggestions_updated_at on public.search_public_suggestions;
create trigger set_search_public_suggestions_updated_at
  before update on public.search_public_suggestions
  for each row execute function public.handle_updated_at();

create or replace view public.search_public_suggestion_summary
with (security_invoker = true)
as
select
  id,
  query,
  normalized_query,
  label,
  kind,
  href,
  priority,
  updated_at
from public.search_public_suggestions
where active = true
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now());

grant insert on public.search_events to anon, authenticated;
grant select on public.search_events to authenticated, service_role;
grant select, insert, update, delete on public.search_events to service_role;

grant select, insert, update, delete on public.saved_searches to authenticated, service_role;

grant select on public.search_public_suggestions to anon, authenticated, service_role;
grant insert, update, delete on public.search_public_suggestions to authenticated, service_role;
grant select on public.search_public_suggestion_summary to anon, authenticated, service_role;

insert into public.search_public_suggestions (query, normalized_query, label, kind, href, priority)
values
  ('Texas U.S. Senate race', 'texas u s senate race', 'Texas U.S. Senate race', 'popular', '/search?q=Texas%20U.S.%20Senate%20race', 100),
  ('East Texas school boards', 'east texas school boards', 'East Texas school boards', 'popular', '/search?q=East%20Texas%20school%20boards', 94),
  ('campaign funding', 'campaign funding', 'Campaign funding', 'popular', '/search?q=campaign%20funding', 88),
  ('property tax votes', 'property tax votes', 'Property tax votes', 'trending', '/search?q=property%20tax%20votes', 96),
  ('open records', 'open records', 'Open records', 'trending', '/search?q=open%20records', 92),
  ('water rights', 'water rights', 'Water rights', 'suggestion', '/search?q=water%20rights', 82)
on conflict (normalized_query, kind) do update set
  label = excluded.label,
  href = excluded.href,
  priority = excluded.priority,
  active = true,
  updated_at = now();
