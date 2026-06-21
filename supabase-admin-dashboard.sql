-- ============================================================
-- RepWatchr Secure Admin Dashboard
-- ============================================================
-- Run after the base auth/user_roles schema, source queue, payments, and
-- member dashboard migrations. Admin dashboard mutations are server-side, but
-- RLS and grants are still applied as defense in depth.

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

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  admin_email text,
  action text not null,
  target_type text not null,
  target_id text not null,
  before_values jsonb not null default '{}'::jsonb,
  after_values jsonb not null default '{}'::jsonb,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log add column if not exists admin_user_id uuid references auth.users(id) on delete set null;
alter table public.admin_audit_log add column if not exists admin_email text;
alter table public.admin_audit_log add column if not exists action text;
alter table public.admin_audit_log add column if not exists target_type text;
alter table public.admin_audit_log add column if not exists target_id text;
alter table public.admin_audit_log add column if not exists before_values jsonb not null default '{}'::jsonb;
alter table public.admin_audit_log add column if not exists after_values jsonb not null default '{}'::jsonb;
alter table public.admin_audit_log add column if not exists note text;
alter table public.admin_audit_log add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.admin_audit_log add column if not exists created_at timestamptz not null default now();

create index if not exists admin_audit_log_created_at_idx on public.admin_audit_log(created_at desc);
create index if not exists admin_audit_log_admin_user_idx on public.admin_audit_log(admin_user_id);
create index if not exists admin_audit_log_target_idx on public.admin_audit_log(target_type, target_id);

create table if not exists public.admin_profile_edits (
  id uuid primary key default gen_random_uuid(),
  profile_type text not null default 'official',
  profile_id text not null,
  profile_name text not null,
  public_fields jsonb not null default '{}'::jsonb,
  source_links jsonb not null default '[]'::jsonb,
  missing_data jsonb not null default '[]'::jsonb,
  red_flags jsonb not null default '[]'::jsonb,
  score_status text,
  status text not null default 'staged',
  created_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  applied_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_profile_edits_status_check check (status in ('staged', 'applied', 'rejected', 'archived')),
  constraint admin_profile_edits_source_links_array_check check (jsonb_typeof(source_links) = 'array'),
  constraint admin_profile_edits_missing_data_array_check check (jsonb_typeof(missing_data) = 'array'),
  constraint admin_profile_edits_red_flags_array_check check (jsonb_typeof(red_flags) = 'array')
);

alter table public.admin_profile_edits add column if not exists profile_type text not null default 'official';
alter table public.admin_profile_edits add column if not exists profile_id text;
alter table public.admin_profile_edits add column if not exists profile_name text;
alter table public.admin_profile_edits add column if not exists public_fields jsonb not null default '{}'::jsonb;
alter table public.admin_profile_edits add column if not exists source_links jsonb not null default '[]'::jsonb;
alter table public.admin_profile_edits add column if not exists missing_data jsonb not null default '[]'::jsonb;
alter table public.admin_profile_edits add column if not exists red_flags jsonb not null default '[]'::jsonb;
alter table public.admin_profile_edits add column if not exists score_status text;
alter table public.admin_profile_edits add column if not exists status text not null default 'staged';
alter table public.admin_profile_edits add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.admin_profile_edits add column if not exists reviewed_by uuid references auth.users(id) on delete set null;
alter table public.admin_profile_edits add column if not exists applied_at timestamptz;
alter table public.admin_profile_edits add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.admin_profile_edits add column if not exists created_at timestamptz not null default now();
alter table public.admin_profile_edits add column if not exists updated_at timestamptz not null default now();

create index if not exists admin_profile_edits_profile_idx on public.admin_profile_edits(profile_type, profile_id);
create index if not exists admin_profile_edits_status_idx on public.admin_profile_edits(status);
create index if not exists admin_profile_edits_created_at_idx on public.admin_profile_edits(created_at desc);

create table if not exists public.admin_content_items (
  id uuid primary key default gen_random_uuid(),
  content_type text not null default 'story_draft',
  title text not null,
  slug text,
  summary text,
  body text,
  source_links jsonb not null default '[]'::jsonb,
  official_ids text[] not null default '{}',
  status text not null default 'draft',
  share_snippet text,
  created_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_content_items_content_type_check check (content_type in ('story_draft', 'daily_watch')),
  constraint admin_content_items_status_check check (status in ('draft', 'published', 'unpublished', 'archived')),
  constraint admin_content_items_source_links_array_check check (jsonb_typeof(source_links) = 'array')
);

alter table public.admin_content_items add column if not exists content_type text not null default 'story_draft';
alter table public.admin_content_items add column if not exists title text;
alter table public.admin_content_items add column if not exists slug text;
alter table public.admin_content_items add column if not exists summary text;
alter table public.admin_content_items add column if not exists body text;
alter table public.admin_content_items add column if not exists source_links jsonb not null default '[]'::jsonb;
alter table public.admin_content_items add column if not exists official_ids text[] not null default '{}';
alter table public.admin_content_items add column if not exists status text not null default 'draft';
alter table public.admin_content_items add column if not exists share_snippet text;
alter table public.admin_content_items add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.admin_content_items add column if not exists published_at timestamptz;
alter table public.admin_content_items add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.admin_content_items add column if not exists created_at timestamptz not null default now();
alter table public.admin_content_items add column if not exists updated_at timestamptz not null default now();

create index if not exists admin_content_items_status_idx on public.admin_content_items(status);
create index if not exists admin_content_items_type_idx on public.admin_content_items(content_type);
create index if not exists admin_content_items_created_at_idx on public.admin_content_items(created_at desc);

create table if not exists public.admin_broken_source_links (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  source_context text,
  profile_type text,
  profile_id text,
  http_status integer,
  status text not null default 'new',
  note text,
  last_checked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_broken_source_links_status_check check (status in ('new', 'confirmed', 'fixed', 'ignored')),
  constraint admin_broken_source_links_url_check check (url ~* '^https?://')
);

alter table public.admin_broken_source_links add column if not exists url text;
alter table public.admin_broken_source_links add column if not exists source_context text;
alter table public.admin_broken_source_links add column if not exists profile_type text;
alter table public.admin_broken_source_links add column if not exists profile_id text;
alter table public.admin_broken_source_links add column if not exists http_status integer;
alter table public.admin_broken_source_links add column if not exists status text not null default 'new';
alter table public.admin_broken_source_links add column if not exists note text;
alter table public.admin_broken_source_links add column if not exists last_checked_at timestamptz;
alter table public.admin_broken_source_links add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.admin_broken_source_links add column if not exists created_at timestamptz not null default now();
alter table public.admin_broken_source_links add column if not exists updated_at timestamptz not null default now();

create index if not exists admin_broken_source_links_status_idx on public.admin_broken_source_links(status);
create index if not exists admin_broken_source_links_profile_idx on public.admin_broken_source_links(profile_type, profile_id);
create index if not exists admin_broken_source_links_created_at_idx on public.admin_broken_source_links(created_at desc);

create table if not exists public.admin_import_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  status text not null default 'queued',
  inserted_count integer not null default 0,
  updated_count integer not null default 0,
  skipped_count integer not null default 0,
  error_count integer not null default 0,
  error_summary text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_import_runs_status_check check (status in ('queued', 'running', 'complete', 'failed', 'partial'))
);

alter table public.admin_import_runs add column if not exists job_name text;
alter table public.admin_import_runs add column if not exists status text not null default 'queued';
alter table public.admin_import_runs add column if not exists inserted_count integer not null default 0;
alter table public.admin_import_runs add column if not exists updated_count integer not null default 0;
alter table public.admin_import_runs add column if not exists skipped_count integer not null default 0;
alter table public.admin_import_runs add column if not exists error_count integer not null default 0;
alter table public.admin_import_runs add column if not exists error_summary text;
alter table public.admin_import_runs add column if not exists started_at timestamptz not null default now();
alter table public.admin_import_runs add column if not exists finished_at timestamptz;
alter table public.admin_import_runs add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.admin_import_runs add column if not exists created_at timestamptz not null default now();
alter table public.admin_import_runs add column if not exists updated_at timestamptz not null default now();

create index if not exists admin_import_runs_started_at_idx on public.admin_import_runs(started_at desc);
create index if not exists admin_import_runs_status_idx on public.admin_import_runs(status);

create table if not exists public.site_share_events (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  channel text not null,
  profile_type text,
  profile_id text,
  district_slug text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint site_share_events_channel_check check (channel in ('copy', 'native', 'x', 'facebook', 'linkedin', 'snippet', 'talking_point', 'public_question', 'watch_record')),
  constraint site_share_events_path_check check (path like '/%' and path not like '/admin%' and path not like '/api%')
);

alter table public.site_share_events add column if not exists path text;
alter table public.site_share_events add column if not exists channel text;
alter table public.site_share_events add column if not exists profile_type text;
alter table public.site_share_events add column if not exists profile_id text;
alter table public.site_share_events add column if not exists district_slug text;
alter table public.site_share_events add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.site_share_events add column if not exists created_at timestamptz not null default now();

alter table public.site_share_events drop constraint if exists site_share_events_channel_check;
alter table public.site_share_events add constraint site_share_events_channel_check
  check (channel in ('copy', 'native', 'x', 'facebook', 'linkedin', 'snippet', 'talking_point', 'public_question', 'watch_record'));

create index if not exists site_share_events_path_idx on public.site_share_events(path);
create index if not exists site_share_events_profile_idx on public.site_share_events(profile_type, profile_id);
create index if not exists site_share_events_created_at_idx on public.site_share_events(created_at desc);

alter table public.admin_audit_log enable row level security;
alter table public.admin_profile_edits enable row level security;
alter table public.admin_content_items enable row level security;
alter table public.admin_broken_source_links enable row level security;
alter table public.admin_import_runs enable row level security;
alter table public.site_share_events enable row level security;

revoke all on public.admin_audit_log from anon;
revoke all on public.admin_profile_edits from anon;
revoke all on public.admin_content_items from anon;
revoke all on public.admin_broken_source_links from anon;
revoke all on public.admin_import_runs from anon;
revoke all on public.site_share_events from anon;

grant usage on schema public to anon, authenticated;
grant select, insert on public.site_share_events to anon, authenticated;
grant select, insert, update, delete on public.admin_audit_log to authenticated;
grant select, insert, update, delete on public.admin_profile_edits to authenticated;
grant select, insert, update, delete on public.admin_content_items to authenticated;
grant select, insert, update, delete on public.admin_broken_source_links to authenticated;
grant select, insert, update, delete on public.admin_import_runs to authenticated;
grant select, insert, update, delete on public.site_share_events to authenticated;

drop policy if exists "Public can insert share events" on public.site_share_events;
create policy "Public can insert share events"
  on public.site_share_events for insert
  to anon, authenticated
  with check (
    path like '/%'
    and path not like '/admin%'
    and path not like '/api%'
    and channel in ('copy', 'native', 'x', 'facebook', 'linkedin', 'snippet', 'talking_point', 'public_question', 'watch_record')
  );

drop policy if exists "Admins can read share events" on public.site_share_events;
create policy "Admins can read share events"
  on public.site_share_events for select
  to authenticated
  using (private.is_repw_admin());

drop policy if exists "Admins can manage share events" on public.site_share_events;
create policy "Admins can manage share events"
  on public.site_share_events for update
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop policy if exists "Admins can delete share events" on public.site_share_events;
create policy "Admins can delete share events"
  on public.site_share_events for delete
  to authenticated
  using (private.is_repw_admin());

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'admin_audit_log',
    'admin_profile_edits',
    'admin_content_items',
    'admin_broken_source_links',
    'admin_import_runs'
  ]
  loop
    execute format('drop policy if exists "Admins can read %I" on public.%I', table_name, table_name);
    execute format('create policy "Admins can read %I" on public.%I for select to authenticated using (private.is_repw_admin())', table_name, table_name);
    execute format('drop policy if exists "Admins can insert %I" on public.%I', table_name, table_name);
    execute format('create policy "Admins can insert %I" on public.%I for insert to authenticated with check (private.is_repw_admin())', table_name, table_name);
    execute format('drop policy if exists "Admins can update %I" on public.%I', table_name, table_name);
    execute format('create policy "Admins can update %I" on public.%I for update to authenticated using (private.is_repw_admin()) with check (private.is_repw_admin())', table_name, table_name);
    execute format('drop policy if exists "Admins can delete %I" on public.%I', table_name, table_name);
    execute format('create policy "Admins can delete %I" on public.%I for delete to authenticated using (private.is_repw_admin())', table_name, table_name);
  end loop;
end $$;

drop trigger if exists set_admin_profile_edits_updated_at on public.admin_profile_edits;
create trigger set_admin_profile_edits_updated_at
  before update on public.admin_profile_edits
  for each row execute function public.handle_updated_at();

drop trigger if exists set_admin_content_items_updated_at on public.admin_content_items;
create trigger set_admin_content_items_updated_at
  before update on public.admin_content_items
  for each row execute function public.handle_updated_at();

drop trigger if exists set_admin_broken_source_links_updated_at on public.admin_broken_source_links;
create trigger set_admin_broken_source_links_updated_at
  before update on public.admin_broken_source_links
  for each row execute function public.handle_updated_at();

drop trigger if exists set_admin_import_runs_updated_at on public.admin_import_runs;
create trigger set_admin_import_runs_updated_at
  before update on public.admin_import_runs
  for each row execute function public.handle_updated_at();
