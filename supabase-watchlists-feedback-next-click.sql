-- ============================================================
-- RepWatchr Watchlists, Civic Feedback, and Next-Click Signals
-- ============================================================
-- This is civic/product feedback infrastructure, not election voting.
-- Do not expose voter identity publicly.

create extension if not exists pgcrypto;

create or replace function public.is_repw_admin()
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
        and role = ''admin''
    )'
  into allowed;

  return coalesce(allowed, false);
end;
$$;

create or replace function public.repw_civic_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null check (char_length(name) between 1 and 160),
  description text check (description is null or char_length(description) <= 1000),
  visibility text default 'private' not null check (visibility in ('private', 'public', 'unlisted')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (user_id, name)
);

create table if not exists public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  watchlist_id uuid references public.watchlists(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  entity_type text not null check (entity_type in (
    'official',
    'candidate',
    'race',
    'office',
    'agency',
    'school_board',
    'city',
    'county',
    'state',
    'federal_district',
    'judge',
    'court',
    'sheriff',
    'police_department',
    'bill',
    'vote',
    'donor',
    'pac',
    'vendor',
    'story',
    'source',
    'issue',
    'search_query'
  )),
  entity_id text not null check (char_length(entity_id) between 1 and 240),
  entity_name text check (entity_name is null or char_length(entity_name) <= 220),
  entity_slug text check (entity_slug is null or char_length(entity_slug) <= 220),
  interest_tags jsonb default '[]'::jsonb not null,
  alert_level text default 'normal' not null check (alert_level in ('low', 'normal', 'high')),
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (watchlist_id, entity_type, entity_id)
);

create table if not exists public.watch_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text check (anonymous_id is null or char_length(anonymous_id) <= 120),
  watchlist_item_id uuid references public.watchlist_items(id) on delete set null,
  entity_type text not null check (char_length(entity_type) between 2 and 80),
  entity_id text not null check (char_length(entity_id) between 1 and 240),
  event_type text not null check (event_type in (
    'watch_button_clicked',
    'watch_reason_selected',
    'watchlist_created',
    'watchlist_add',
    'anonymous_watch_intent_created',
    'anonymous_watch_converted',
    'watchlist_remove'
  )),
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null
);

create table if not exists public.anonymous_watch_intents (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text not null check (char_length(anonymous_id) between 8 and 120),
  entity_type text not null check (char_length(entity_type) between 2 and 80),
  entity_id text not null check (char_length(entity_id) between 1 and 240),
  entity_name text check (entity_name is null or char_length(entity_name) <= 220),
  source_route text check (source_route is null or char_length(source_route) <= 500),
  reason text check (reason is null or char_length(reason) <= 120),
  created_at timestamptz default now() not null,
  converted_user_id uuid references auth.users(id) on delete set null,
  converted_at timestamptz
);

create table if not exists public.feedback_votes (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text check (anonymous_id is null or char_length(anonymous_id) <= 120),
  user_id uuid references auth.users(id) on delete set null,
  entity_type text not null check (char_length(entity_type) between 2 and 80),
  entity_id text not null check (char_length(entity_id) between 1 and 240),
  feedback_type text not null check (feedback_type in (
    'useful',
    'needs_more_sources',
    'i_am_watching',
    'request_review',
    'compare_this',
    'missing_information',
    'source_useful',
    'source_broken',
    'needs_context',
    'better_source_available',
    'supports_claim',
    'does_not_support_claim',
    'needs_more_records',
    'follow_topic',
    'send_updates',
    'share_receipt',
    'watching_race',
    'missing_candidate',
    'missing_finance_source',
    'missing_election_source',
    'build_comparison',
    'good_question',
    'needs_better_wording',
    'ask_at_meeting',
    'copied_question'
  )),
  feedback_value text not null check (char_length(feedback_value) between 1 and 120),
  weight int default 1 not null check (weight between -5 and 5),
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  check (anonymous_id is not null or user_id is not null)
);

create table if not exists public.feedback_rollups (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (char_length(entity_type) between 2 and 80),
  entity_id text not null check (char_length(entity_id) between 1 and 240),
  feedback_type text not null check (char_length(feedback_type) between 2 and 120),
  count int default 0 not null check (count >= 0),
  score numeric default 0 not null,
  updated_at timestamptz default now() not null,
  unique (entity_type, entity_id, feedback_type)
);

create unique index if not exists idx_feedback_votes_user_once
  on public.feedback_votes(user_id, entity_type, entity_id, feedback_type)
  where user_id is not null;

create unique index if not exists idx_feedback_votes_anonymous_once
  on public.feedback_votes(anonymous_id, entity_type, entity_id, feedback_type)
  where anonymous_id is not null and user_id is null;

create index if not exists idx_watchlists_user
  on public.watchlists(user_id, updated_at desc);
create index if not exists idx_watchlist_items_user
  on public.watchlist_items(user_id, updated_at desc);
create index if not exists idx_watchlist_items_entity
  on public.watchlist_items(entity_type, entity_id, created_at desc);
create index if not exists idx_watch_events_entity
  on public.watch_events(entity_type, entity_id, event_type, created_at desc);
create index if not exists idx_watch_events_anonymous
  on public.watch_events(anonymous_id, created_at desc)
  where anonymous_id is not null;
create index if not exists idx_anonymous_watch_intents_pending
  on public.anonymous_watch_intents(anonymous_id, created_at desc)
  where converted_at is null;
create index if not exists idx_feedback_votes_entity
  on public.feedback_votes(entity_type, entity_id, feedback_type, updated_at desc);
create index if not exists idx_feedback_rollups_entity
  on public.feedback_rollups(entity_type, entity_id, updated_at desc);

drop trigger if exists trg_watchlists_updated_at on public.watchlists;
create trigger trg_watchlists_updated_at
before update on public.watchlists
for each row execute function public.repw_civic_set_updated_at();

drop trigger if exists trg_watchlist_items_updated_at on public.watchlist_items;
create trigger trg_watchlist_items_updated_at
before update on public.watchlist_items
for each row execute function public.repw_civic_set_updated_at();

drop trigger if exists trg_feedback_votes_updated_at on public.feedback_votes;
create trigger trg_feedback_votes_updated_at
before update on public.feedback_votes
for each row execute function public.repw_civic_set_updated_at();

alter table public.watchlists enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.watch_events enable row level security;
alter table public.anonymous_watch_intents enable row level security;
alter table public.feedback_votes enable row level security;
alter table public.feedback_rollups enable row level security;

grant select, insert, update, delete on public.watchlists to authenticated, service_role;
grant select, insert, update, delete on public.watchlist_items to authenticated, service_role;
grant insert on public.watch_events to anon, authenticated;
grant select, insert, update, delete on public.watch_events to service_role;
grant insert on public.anonymous_watch_intents to anon, authenticated;
grant select, insert, update, delete on public.anonymous_watch_intents to service_role;
grant insert on public.feedback_votes to anon, authenticated;
grant select, insert, update, delete on public.feedback_votes to service_role;
grant select on public.feedback_rollups to anon, authenticated;
grant select, insert, update, delete on public.feedback_rollups to service_role;

drop policy if exists "Users manage own watchlists" on public.watchlists;
drop policy if exists "Admins manage watchlists" on public.watchlists;
drop policy if exists "Users manage own watchlist items" on public.watchlist_items;
drop policy if exists "Admins manage watchlist items" on public.watchlist_items;
drop policy if exists "Public creates watch events" on public.watch_events;
drop policy if exists "Admins manage watch events" on public.watch_events;
drop policy if exists "Public creates anonymous watch intents" on public.anonymous_watch_intents;
drop policy if exists "Admins manage anonymous watch intents" on public.anonymous_watch_intents;
drop policy if exists "Public creates feedback votes" on public.feedback_votes;
drop policy if exists "Users read own feedback votes" on public.feedback_votes;
drop policy if exists "Admins manage feedback votes" on public.feedback_votes;
drop policy if exists "Public reads feedback rollups" on public.feedback_rollups;
drop policy if exists "Admins manage feedback rollups" on public.feedback_rollups;

create policy "Users manage own watchlists"
  on public.watchlists for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Admins manage watchlists"
  on public.watchlists for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Users manage own watchlist items"
  on public.watchlist_items for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Admins manage watchlist items"
  on public.watchlist_items for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Public creates watch events"
  on public.watch_events for insert
  to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

create policy "Admins manage watch events"
  on public.watch_events for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Public creates anonymous watch intents"
  on public.anonymous_watch_intents for insert
  to anon, authenticated
  with check (converted_user_id is null and converted_at is null);

create policy "Admins manage anonymous watch intents"
  on public.anonymous_watch_intents for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Public creates feedback votes"
  on public.feedback_votes for insert
  to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

create policy "Users read own feedback votes"
  on public.feedback_votes for select
  to authenticated
  using (user_id = auth.uid());

create policy "Admins manage feedback votes"
  on public.feedback_votes for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Public reads feedback rollups"
  on public.feedback_rollups for select
  to anon, authenticated
  using (count >= 3);

create policy "Admins manage feedback rollups"
  on public.feedback_rollups for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());
