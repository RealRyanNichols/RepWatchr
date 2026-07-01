-- ============================================================
-- RepWatchr Supabase Security / RLS Hardening
-- ============================================================
-- Run after:
-- 1. supabase-schema.sql
-- 2. supabase-profile-claims.sql
-- 3. supabase-superadmin-office.sql
-- 4. the feature-table SQL files used by the app
--
-- Purpose:
-- - Make database roles, not client-side role checks, the source of truth.
-- - Preserve anonymous intake and public-approved reads.
-- - Prevent anonymous users from mutating public records or review queues.
-- - Add explicit grants for Supabase Data API behavior after the 2026 default
--   grant changes.
-- - Keep service-role work server-side.

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Role model
-- ------------------------------------------------------------

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null default 'authenticated_user',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null,
  unique(user_id, role)
);

alter table public.user_roles
  alter column role set default 'authenticated_user';

alter table public.user_roles
  drop constraint if exists user_roles_role_check;

alter table public.user_roles
  add constraint user_roles_role_check
  check (
    role in (
      'authenticated_user',
      'contributor',
      'verified_contributor',
      'admin',
      'super_admin',
      'reviewer',
      'researcher',
      'claimed_official',
      'journalist',
      'voter'
    )
  );

create unique index if not exists idx_user_roles_user_role
  on public.user_roles(user_id, role);

create index if not exists idx_user_roles_role_user
  on public.user_roles(role, user_id);

alter table public.user_roles enable row level security;

grant select on public.user_roles to authenticated;
grant select, insert, update, delete on public.user_roles to service_role;
revoke all on public.user_roles from anon;

-- Central role helpers. These are intentionally small boolean helpers used by
-- RLS policies only. They read public.user_roles, never user-editable metadata.
create or replace function public.has_repw_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = any(required_roles)
  );
$$;

create or replace function public.is_repw_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_repw_role(array['super_admin']);
$$;

create or replace function public.is_repw_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_repw_role(array['admin', 'super_admin']);
$$;

create or replace function public.is_repw_operator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_repw_role(array['admin', 'super_admin', 'reviewer', 'researcher']);
$$;

create or replace function public.is_repw_contributor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_repw_role(array['contributor', 'verified_contributor', 'admin', 'super_admin']);
$$;

create or replace function public.is_repw_verified_contributor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_repw_role(array['verified_contributor', 'admin', 'super_admin']);
$$;

revoke all on function public.has_repw_role(text[]) from public;
revoke all on function public.is_repw_super_admin() from public;
revoke all on function public.is_repw_admin() from public;
revoke all on function public.is_repw_operator() from public;
revoke all on function public.is_repw_contributor() from public;
revoke all on function public.is_repw_verified_contributor() from public;

grant execute on function public.has_repw_role(text[]) to authenticated;
grant execute on function public.is_repw_super_admin() to authenticated;
grant execute on function public.is_repw_admin() to authenticated;
grant execute on function public.is_repw_operator() to authenticated;
grant execute on function public.is_repw_contributor() to authenticated;
grant execute on function public.is_repw_verified_contributor() to authenticated;

-- Some public-read policies reference is_repw_operator() in an OR branch. Grant
-- anon execute for compatibility; the function returns false without auth.uid().
grant execute on function public.has_repw_role(text[]) to anon;
grant execute on function public.is_repw_operator() to anon;
grant execute on function public.is_repw_admin() to anon;

drop policy if exists "Users can read own roles and admins can read all roles" on public.user_roles;
drop policy if exists "Admins can manage roles" on public.user_roles;
drop policy if exists "Users read own roles" on public.user_roles;
drop policy if exists "Admins read all roles" on public.user_roles;
drop policy if exists "Super admins manage roles" on public.user_roles;

create policy "Users read own roles"
  on public.user_roles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Admins read all roles"
  on public.user_roles
  for select
  to authenticated
  using (public.is_repw_admin());

create policy "Super admins manage roles"
  on public.user_roles
  for all
  to authenticated
  using (public.is_repw_super_admin())
  with check (public.is_repw_super_admin());

-- ------------------------------------------------------------
-- Base member verification and citizen feedback
-- ------------------------------------------------------------

alter table if exists public.profiles enable row level security;
alter table if exists public.citizen_votes enable row level security;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.citizen_votes to authenticated;
grant select, insert, update, delete on public.profiles to service_role;
grant select, insert, update, delete on public.citizen_votes to service_role;
revoke all on public.profiles from anon;
revoke all on public.citizen_votes from anon;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can manage user profiles" on public.profiles;

create policy "Users can view own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Admins can manage user profiles"
  on public.profiles
  for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

drop policy if exists "Users can view own votes" on public.citizen_votes;
drop policy if exists "Users can insert own votes" on public.citizen_votes;
drop policy if exists "Users can update own votes" on public.citizen_votes;
drop policy if exists "Users can delete own votes" on public.citizen_votes;
drop policy if exists "Admins can manage citizen votes" on public.citizen_votes;

create policy "Users can view own votes"
  on public.citizen_votes
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own votes"
  on public.citizen_votes
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own votes"
  on public.citizen_votes
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own votes"
  on public.citizen_votes
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Admins can manage citizen votes"
  on public.citizen_votes
  for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

-- ------------------------------------------------------------
-- Search, source, intake, dashboard, and admin safety grants
-- ------------------------------------------------------------
-- Existing feature SQL files define the detailed RLS predicates. This block
-- adds explicit grants required by Supabase Data API changes while preserving
-- those predicates.

do $$
begin
  if to_regclass('public.search_index') is not null then
    grant select on public.search_index to anon, authenticated;
    grant select, insert, update, delete on public.search_index to service_role;
  end if;

  if to_regclass('public.saved_searches') is not null then
    grant select, insert, update, delete on public.saved_searches to authenticated, service_role;
  end if;

  if to_regclass('public.source_links') is not null then
    grant select on public.source_links to anon, authenticated;
  end if;

  if to_regclass('public.source_submissions') is not null then
    grant insert on public.source_submissions to anon, authenticated;
    grant select on public.source_submissions to authenticated, service_role;
    grant update, delete on public.source_submissions to authenticated, service_role;
  end if;

  if to_regclass('public.source_submission_events') is not null then
    grant select on public.source_submission_events to authenticated, service_role;
  end if;

  if to_regclass('public.source_review_notes') is not null then
    grant select, insert, update, delete on public.source_review_notes to authenticated, service_role;
  end if;

  if to_regclass('public.form_definitions') is not null then
    grant select on public.form_definitions to anon, authenticated;
  end if;

  if to_regclass('public.form_submissions') is not null then
    grant insert on public.form_submissions to anon, authenticated;
    grant select, update, delete on public.form_submissions to authenticated, service_role;
  end if;

  if to_regclass('public.form_submission_events') is not null then
    grant select on public.form_submission_events to authenticated, service_role;
  end if;

  if to_regclass('public.member_watchlists') is not null then
    grant select, insert, update, delete on public.member_watchlists to authenticated, service_role;
  end if;

  if to_regclass('public.member_watchlist_items') is not null then
    grant select, insert, update, delete on public.member_watchlist_items to authenticated, service_role;
  end if;

  if to_regclass('public.member_watchlist_alert_preferences') is not null then
    grant select, insert, update, delete on public.member_watchlist_alert_preferences to authenticated, service_role;
  end if;

  if to_regclass('public.member_watchlist_alert_events') is not null then
    grant select, insert, update, delete on public.member_watchlist_alert_events to authenticated, service_role;
  end if;

  if to_regclass('public.member_watchlist_digest_runs') is not null then
    grant select, insert, update, delete on public.member_watchlist_digest_runs to authenticated, service_role;
  end if;

  if to_regclass('public.watchlists') is not null then
    grant select, insert, update, delete on public.watchlists to authenticated, service_role;
  end if;

  if to_regclass('public.watchlist_items') is not null then
    grant select, insert, update, delete on public.watchlist_items to authenticated, service_role;
  end if;

  if to_regclass('public.watch_events') is not null then
    grant insert on public.watch_events to anon, authenticated;
  end if;

  if to_regclass('public.anonymous_watch_intents') is not null then
    grant insert on public.anonymous_watch_intents to anon, authenticated;
  end if;

  if to_regclass('public.feedback_votes') is not null then
    grant insert on public.feedback_votes to anon, authenticated;
  end if;

  if to_regclass('public.feedback_rollups') is not null then
    grant select on public.feedback_rollups to anon, authenticated;
  end if;

  if to_regclass('public.admin_audit_logs') is not null then
    grant select, insert, update, delete on public.admin_audit_logs to authenticated, service_role;
  end if;

  if to_regclass('public.admin_notes') is not null then
    grant select, insert, update, delete on public.admin_notes to authenticated, service_role;
  end if;

  if to_regclass('public.admin_assignments') is not null then
    grant select, insert, update, delete on public.admin_assignments to authenticated, service_role;
  end if;

  if to_regclass('public.data_sources') is not null then
    grant select, insert, update, delete on public.data_sources to authenticated, service_role;
  end if;

  if to_regclass('public.data_source_fields') is not null then
    grant select, insert, update, delete on public.data_source_fields to authenticated, service_role;
  end if;

  if to_regclass('public.import_runs') is not null then
    grant select, insert, update, delete on public.import_runs to authenticated, service_role;
  end if;

  if to_regclass('public.import_errors') is not null then
    grant select, insert, update, delete on public.import_errors to authenticated, service_role;
  end if;

  if to_regclass('public.data_quality_issues') is not null then
    grant select, insert, update, delete on public.data_quality_issues to authenticated, service_role;
  end if;

  if to_regclass('public.broken_links') is not null then
    grant select, insert, update, delete on public.broken_links to authenticated, service_role;
  end if;

  if to_regclass('public.duplicate_candidates') is not null then
    grant select, insert, update, delete on public.duplicate_candidates to authenticated, service_role;
  end if;
end $$;

-- Defensive RLS enablement for core feature tables that may have been created
-- manually before their feature SQL was applied.
alter table if exists public.search_index enable row level security;
alter table if exists public.saved_searches enable row level security;
alter table if exists public.source_submissions enable row level security;
alter table if exists public.source_submission_events enable row level security;
alter table if exists public.source_review_notes enable row level security;
alter table if exists public.source_links enable row level security;
alter table if exists public.form_definitions enable row level security;
alter table if exists public.form_submissions enable row level security;
alter table if exists public.form_submission_events enable row level security;
alter table if exists public.member_watchlists enable row level security;
alter table if exists public.member_watchlist_items enable row level security;
alter table if exists public.admin_audit_logs enable row level security;
alter table if exists public.admin_notes enable row level security;
alter table if exists public.admin_assignments enable row level security;
alter table if exists public.data_sources enable row level security;
alter table if exists public.data_source_fields enable row level security;

-- Automatic audit rows for admin-only tables. Review/intake queues still keep
-- their purpose-built event tables; this trigger covers the admin desk itself.
create or replace function public.repw_admin_audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_id text;
begin
  if tg_op = 'INSERT' then
    row_id := coalesce(new.id::text, null);
  else
    row_id := coalesce(old.id::text, null);
  end if;

  insert into public.admin_audit_logs (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    before_value,
    after_value,
    metadata
  )
  values (
    (select auth.uid()),
    lower(tg_op),
    tg_table_name,
    row_id,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
    jsonb_build_object('schema', tg_table_schema, 'trigger', tg_name)
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function public.repw_admin_audit_row_change() from public;
revoke all on function public.repw_admin_audit_row_change() from anon;
revoke all on function public.repw_admin_audit_row_change() from authenticated;

do $$
declare
  table_name text;
  trigger_name text;
begin
  foreach table_name in array array[
    'admin_notes',
    'admin_assignments',
    'data_sources',
    'data_source_fields',
    'import_runs',
    'import_errors',
    'data_quality_issues',
    'broken_links',
    'duplicate_candidates'
  ] loop
    if to_regclass('public.' || table_name) is not null then
      trigger_name := 'trg_repw_admin_audit_' || table_name;
      execute format('drop trigger if exists %I on public.%I', trigger_name, table_name);
      execute format(
        'create trigger %I after insert or update or delete on public.%I for each row execute function public.repw_admin_audit_row_change()',
        trigger_name,
        table_name
      );
    end if;
  end loop;
end $$;

-- ------------------------------------------------------------
-- Security smoke views for admins
-- ------------------------------------------------------------

drop view if exists public.rls_policy_inventory;
create view public.rls_policy_inventory
with (security_invoker = true)
as
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname in ('public', 'storage')
  and public.is_repw_admin();

grant select on public.rls_policy_inventory to authenticated, service_role;

drop view if exists public.repw_security_table_inventory;
create view public.repw_security_table_inventory
with (security_invoker = true)
as
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls,
  coalesce(policy_counts.policy_count, 0)::int as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join (
  select schemaname, tablename, count(*) as policy_count
  from pg_policies
  group by schemaname, tablename
) policy_counts
  on policy_counts.schemaname = n.nspname
  and policy_counts.tablename = c.relname
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
  and public.is_repw_admin()
order by c.relname;

grant select on public.repw_security_table_inventory to authenticated, service_role;

-- The inventory views are still gated by RLS/helper policies at query time.
-- Use them from the admin dashboard or SQL editor to audit gaps; do not expose
-- their raw output publicly.
