-- ============================================================
-- RepWatchr Race Hub System
-- ============================================================
-- Race pages are staged through the secure admin dashboard. Public visitors
-- can read only published race rows. Admins can create/edit all rows.

create extension if not exists pgcrypto;
create schema if not exists private;

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function private.is_repw_admin()
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function private.is_repw_admin() from public;
grant execute on function private.is_repw_admin() to authenticated;

create table if not exists public.race_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  office text not null,
  jurisdiction text not null,
  state text not null default 'TX',
  election_date text,
  election_year integer,
  summary text not null default '',
  public_status text not null default 'staged',
  county_slugs text[] not null default '{}',
  district_slugs text[] not null default '{}',
  candidates jsonb not null default '[]'::jsonb,
  source_links jsonb not null default '[]'::jsonb,
  story_links jsonb not null default '[]'::jsonb,
  funding_links jsonb not null default '[]'::jsonb,
  red_flags jsonb not null default '[]'::jsonb,
  missing_records jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint race_pages_slug_check check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint race_pages_public_status_check check (public_status in ('staged', 'needs_review', 'published', 'archived')),
  constraint race_pages_candidates_array_check check (jsonb_typeof(candidates) = 'array'),
  constraint race_pages_source_links_array_check check (jsonb_typeof(source_links) = 'array'),
  constraint race_pages_story_links_array_check check (jsonb_typeof(story_links) = 'array'),
  constraint race_pages_funding_links_array_check check (jsonb_typeof(funding_links) = 'array'),
  constraint race_pages_red_flags_array_check check (jsonb_typeof(red_flags) = 'array'),
  constraint race_pages_missing_records_array_check check (jsonb_typeof(missing_records) = 'array')
);

alter table public.race_pages add column if not exists slug text;
alter table public.race_pages add column if not exists title text;
alter table public.race_pages add column if not exists office text;
alter table public.race_pages add column if not exists jurisdiction text;
alter table public.race_pages add column if not exists state text not null default 'TX';
alter table public.race_pages add column if not exists election_date text;
alter table public.race_pages add column if not exists election_year integer;
alter table public.race_pages add column if not exists summary text not null default '';
alter table public.race_pages add column if not exists public_status text not null default 'staged';
alter table public.race_pages add column if not exists county_slugs text[] not null default '{}';
alter table public.race_pages add column if not exists district_slugs text[] not null default '{}';
alter table public.race_pages add column if not exists candidates jsonb not null default '[]'::jsonb;
alter table public.race_pages add column if not exists source_links jsonb not null default '[]'::jsonb;
alter table public.race_pages add column if not exists story_links jsonb not null default '[]'::jsonb;
alter table public.race_pages add column if not exists funding_links jsonb not null default '[]'::jsonb;
alter table public.race_pages add column if not exists red_flags jsonb not null default '[]'::jsonb;
alter table public.race_pages add column if not exists missing_records jsonb not null default '[]'::jsonb;
alter table public.race_pages add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.race_pages add column if not exists updated_by uuid references auth.users(id) on delete set null;
alter table public.race_pages add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.race_pages add column if not exists created_at timestamptz not null default now();
alter table public.race_pages add column if not exists updated_at timestamptz not null default now();

create unique index if not exists race_pages_slug_idx on public.race_pages(slug);
create index if not exists race_pages_status_idx on public.race_pages(public_status);
create index if not exists race_pages_state_idx on public.race_pages(state);
create index if not exists race_pages_updated_at_idx on public.race_pages(updated_at desc);

create table if not exists public.race_page_events (
  id uuid primary key default gen_random_uuid(),
  race_page_id uuid references public.race_pages(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  note text,
  before_values jsonb not null default '{}'::jsonb,
  after_values jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists race_page_events_page_idx on public.race_page_events(race_page_id);
create index if not exists race_page_events_created_at_idx on public.race_page_events(created_at desc);

alter table public.race_pages enable row level security;
alter table public.race_page_events enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.race_pages to anon, authenticated;
grant select, insert, update, delete on public.race_pages to authenticated;
grant select, insert on public.race_page_events to authenticated;

drop policy if exists "Public can read published race pages" on public.race_pages;
create policy "Public can read published race pages"
  on public.race_pages for select
  to anon, authenticated
  using (public_status = 'published');

drop policy if exists "Admins can read all race pages" on public.race_pages;
create policy "Admins can read all race pages"
  on public.race_pages for select
  to authenticated
  using (private.is_repw_admin());

drop policy if exists "Admins can insert race pages" on public.race_pages;
create policy "Admins can insert race pages"
  on public.race_pages for insert
  to authenticated
  with check (private.is_repw_admin());

drop policy if exists "Admins can update race pages" on public.race_pages;
create policy "Admins can update race pages"
  on public.race_pages for update
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop policy if exists "Admins can delete race pages" on public.race_pages;
create policy "Admins can delete race pages"
  on public.race_pages for delete
  to authenticated
  using (private.is_repw_admin());

drop policy if exists "Admins can read race page events" on public.race_page_events;
create policy "Admins can read race page events"
  on public.race_page_events for select
  to authenticated
  using (private.is_repw_admin());

drop policy if exists "Admins can insert race page events" on public.race_page_events;
create policy "Admins can insert race page events"
  on public.race_page_events for insert
  to authenticated
  with check (private.is_repw_admin());

drop trigger if exists set_race_pages_updated_at on public.race_pages;
create trigger set_race_pages_updated_at
before update on public.race_pages
for each row execute function public.handle_updated_at();
