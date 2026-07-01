-- ============================================================
-- RepWatchr Search and Discovery System
-- ============================================================
-- Purpose:
-- - Public searchable index for officials, agencies, races, stories, sources,
--   votes, funding records, tools, packages, and jurisdiction hubs.
-- - User-owned saved searches with optional alert preference.
-- - Explicit grants for Supabase Data API compatibility after the 2026 public
--   schema default-grants change.

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_repw_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'owner', 'operator', 'super_admin')
    or (auth.jwt() -> 'app_metadata' -> 'roles') ?| array['admin', 'owner', 'operator', 'super_admin'],
    false
  );
$$;

create table if not exists public.search_index (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  title text not null,
  subtitle text,
  body text,
  slug text,
  url text not null,
  state text,
  county text,
  city text,
  office_type text,
  office_level text,
  tags jsonb not null default '[]'::jsonb,
  source_count int not null default 0,
  completeness_score int not null default 0,
  popularity_score numeric not null default 0,
  watch_count int not null default 0,
  share_count int not null default 0,
  visibility text not null default 'public',
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  indexed_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(subtitle, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(state, '') || ' ' || coalesce(county, '') || ' ' || coalesce(city, '') || ' ' || coalesce(office_type, '') || ' ' || coalesce(office_level, '')), 'B')
  ) stored,
  unique(entity_type, entity_id),
  check (jsonb_typeof(tags) = 'array'),
  check (jsonb_typeof(metadata) = 'object'),
  check (source_count >= 0),
  check (completeness_score between 0 and 100),
  check (watch_count >= 0),
  check (share_count >= 0),
  check (visibility in ('public', 'private', 'admin')),
  check (status in ('active', 'needs_review', 'under_review', 'archived', 'private'))
);

create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  query text not null,
  filters jsonb not null default '{}'::jsonb,
  alert_enabled boolean not null default false,
  normalized_query text,
  title text,
  scope text not null default 'all',
  alert_frequency text not null default 'none',
  public_share_enabled boolean not null default false,
  share_id uuid not null default gen_random_uuid(),
  last_opened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, normalized_query, scope),
  check (char_length(query) between 1 and 220),
  check (jsonb_typeof(filters) = 'object')
);

alter table public.saved_searches
  add column if not exists name text,
  add column if not exists filters jsonb not null default '{}'::jsonb,
  add column if not exists alert_enabled boolean not null default false,
  add column if not exists normalized_query text,
  add column if not exists title text,
  add column if not exists scope text not null default 'all',
  add column if not exists alert_frequency text not null default 'none',
  add column if not exists public_share_enabled boolean not null default false,
  add column if not exists share_id uuid not null default gen_random_uuid(),
  add column if not exists last_opened_at timestamptz;

create index if not exists idx_search_index_vector
  on public.search_index using gin(search_vector);

create index if not exists idx_search_index_public_type
  on public.search_index(entity_type, state, county, office_type)
  where visibility = 'public' and status = 'active';

create index if not exists idx_search_index_popularity
  on public.search_index(popularity_score desc, watch_count desc, source_count desc)
  where visibility = 'public' and status = 'active';

create index if not exists idx_search_index_updated
  on public.search_index(updated_at desc)
  where visibility = 'public' and status = 'active';

create index if not exists idx_search_index_tags
  on public.search_index using gin(tags);

create index if not exists idx_saved_searches_user_updated
  on public.saved_searches(user_id, updated_at desc);

alter table public.search_index enable row level security;
alter table public.saved_searches enable row level security;

drop policy if exists "Public reads public search index" on public.search_index;
drop policy if exists "Admins manage search index" on public.search_index;
drop policy if exists "Users manage own saved searches" on public.saved_searches;
drop policy if exists "Admins manage saved searches" on public.saved_searches;

create policy "Public reads public search index"
  on public.search_index
  for select
  to anon, authenticated
  using (visibility = 'public' and status = 'active');

create policy "Admins manage search index"
  on public.search_index
  for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Users manage own saved searches"
  on public.saved_searches
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Admins manage saved searches"
  on public.saved_searches
  for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

drop trigger if exists set_search_index_updated_at on public.search_index;
create trigger set_search_index_updated_at
  before update on public.search_index
  for each row execute function public.handle_updated_at();

drop trigger if exists set_saved_searches_updated_at on public.saved_searches;
create trigger set_saved_searches_updated_at
  before update on public.saved_searches
  for each row execute function public.handle_updated_at();

grant select on public.search_index to anon, authenticated;
grant select, insert, update, delete on public.search_index to service_role;

grant select, insert, update, delete on public.saved_searches to authenticated;
grant select, insert, update, delete on public.saved_searches to service_role;

insert into public.search_index (
  entity_type,
  entity_id,
  title,
  subtitle,
  body,
  slug,
  url,
  state,
  office_type,
  office_level,
  tags,
  source_count,
  completeness_score,
  popularity_score
)
values
  ('tool_page', 'search', 'RepWatchr Search', 'Discovery tool', 'Search officials, agencies, races, school boards, votes, funding, stories, sources, and public questions.', 'search', '/search', null, 'tool', 'public', '["tool","search","discovery"]'::jsonb, 1, 95, 100),
  ('tool_page', 'submit-source', 'Submit Source', 'Source intake', 'Send a public source URL, correction, missing record, meeting clip, or official record into the review queue.', 'submit-source', '/submit-source', null, 'tool', 'public', '["tool","source","open-records","needs-source"]'::jsonb, 1, 90, 95),
  ('tool_page', 'free-packet', 'Free Source Packet Builder', 'Free packet tool', 'Turn one public source into a clean packet with safe share text and next action.', 'free-packet', '/free-packet', null, 'tool', 'public', '["tool","source-packet","open-records"]'::jsonb, 1, 80, 88),
  ('package_page', 'quick-record-check', 'Quick Record Check', 'Beta package', 'Request RepWatchr review of one public record lane or source packet.', 'quick-record-check', '/services/quick-record-check', null, 'package', 'public', '["package","record-check","beta"]'::jsonb, 1, 75, 82),
  ('package_page', 'local-race-source-pack', 'Local Race Source Pack', 'Beta package', 'Organize public election, candidate, filing, finance, and source links for a local race.', 'local-race-source-pack', '/services/local-race-source-pack', null, 'package', 'public', '["package","race","campaign-finance","beta"]'::jsonb, 1, 75, 80),
  ('methodology_page', 'methodology', 'RepWatchr Methodology', 'Trust and safety', 'How RepWatchr labels records, separates claims from proof, and handles source confidence.', 'methodology', '/methodology', null, 'methodology', 'public', '["methodology","trust","safety"]'::jsonb, 1, 85, 70),
  ('privacy_page', 'privacy', 'RepWatchr Privacy', 'Privacy and safety', 'Privacy boundaries for user submissions, analytics, watchlists, and public records.', 'privacy', '/privacy', null, 'privacy', 'public', '["privacy","trust","safety"]'::jsonb, 1, 85, 70)
on conflict (entity_type, entity_id) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  body = excluded.body,
  slug = excluded.slug,
  url = excluded.url,
  state = excluded.state,
  office_type = excluded.office_type,
  office_level = excluded.office_level,
  tags = excluded.tags,
  source_count = excluded.source_count,
  completeness_score = excluded.completeness_score,
  popularity_score = excluded.popularity_score,
  visibility = 'public',
  status = 'active',
  indexed_at = now(),
  updated_at = now();
