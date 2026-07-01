-- RepWatchr RLS Smoke Checks
-- ============================================================
-- Run in Supabase SQL Editor after applying supabase-security-rls-hardening.sql.
-- This script is intentionally read-heavy. It does not seed production data.
--
-- Manual test matrix:
-- 1. Anonymous cannot read admin notes.
-- 2. Anonymous can insert source/form submissions only through the allowed insert policies.
-- 3. Authenticated users can read own private rows but not another user's rows.
-- 4. Admin/super_admin can read/manage review queues.
-- 5. Public users can read only approved public source links/search rows.

select
  'rls_enabled_public_tables' as check_name,
  count(*) filter (where not c.relrowsecurity) as public_tables_without_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
  and c.relname not like 'pg_%';

select
  'admin_notes_anon_grant' as check_name,
  has_table_privilege('anon', 'public.admin_notes', 'select') as anon_can_select_admin_notes,
  has_table_privilege('anon', 'public.admin_notes', 'insert') as anon_can_insert_admin_notes,
  has_table_privilege('anon', 'public.admin_notes', 'update') as anon_can_update_admin_notes;

select
  'source_submission_anon_grant' as check_name,
  has_table_privilege('anon', 'public.source_submissions', 'insert') as anon_can_insert_source_submissions,
  has_table_privilege('anon', 'public.source_submissions', 'select') as anon_can_select_source_submissions,
  has_table_privilege('anon', 'public.source_submissions', 'update') as anon_can_update_source_submissions;

select
  'form_submission_anon_grant' as check_name,
  has_table_privilege('anon', 'public.form_submissions', 'insert') as anon_can_insert_form_submissions,
  has_table_privilege('anon', 'public.form_submissions', 'select') as anon_can_select_form_submissions,
  has_table_privilege('anon', 'public.form_submissions', 'update') as anon_can_update_form_submissions;

select
  'watchlist_anon_grant' as check_name,
  has_table_privilege('anon', 'public.watchlists', 'select') as anon_can_select_watchlists,
  has_table_privilege('anon', 'public.watchlists', 'insert') as anon_can_insert_watchlists,
  has_table_privilege('anon', 'public.watchlists', 'update') as anon_can_update_watchlists;

select
  'public_source_link_grant' as check_name,
  has_table_privilege('anon', 'public.source_links', 'select') as anon_can_select_source_links,
  has_table_privilege('anon', 'public.source_links', 'insert') as anon_can_insert_source_links,
  has_table_privilege('anon', 'public.source_links', 'update') as anon_can_update_source_links;

select
  'role_management_grants' as check_name,
  has_table_privilege('anon', 'public.user_roles', 'select') as anon_can_select_roles,
  has_table_privilege('authenticated', 'public.user_roles', 'select') as auth_can_select_roles,
  has_table_privilege('authenticated', 'public.user_roles', 'update') as auth_can_update_roles;

select
  'dangerous_policies_without_to_clause' as check_name,
  schemaname,
  tablename,
  policyname,
  roles
from pg_policies
where schemaname = 'public'
  and roles = '{public}'
  and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
order by tablename, policyname;

select
  'public_security_definer_functions' as check_name,
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_userbyid(p.proowner) as owner_name
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
order by p.proname;

select
  'security_inventory_admin_view' as check_name,
  count(*) as visible_rows_for_current_role
from public.repw_security_table_inventory;
