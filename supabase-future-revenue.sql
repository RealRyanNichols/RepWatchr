-- ============================================================
-- RepWatchr Future Revenue Infrastructure
-- ============================================================
-- Do NOT enable public monetization from this file.
--
-- Purpose:
-- - Register future revenue packages without exposing them publicly.
-- - Create hidden feature flags, organization/team/account rails,
--   subscriptions, API keys, credits, invoices, licenses, exports, and audit.
-- - Keep everything dormant until an admin activates flags later.
--
-- Privacy and safety:
-- - No raw API keys are stored. Store only prefix + hash.
-- - No anonymous access.
-- - No public checkout enablement.
-- - No raw private identity-document resale workflow.

create extension if not exists pgcrypto;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.future_revenue_feature_flags (
  flag_key text primary key check (flag_key ~ '^[a-z0-9_]{3,120}$'),
  label text not null check (char_length(label) between 2 and 160),
  description text not null default '' check (char_length(description) <= 1000),
  enabled boolean not null default false,
  scope text not null default 'future_revenue'
    check (scope in ('future_revenue', 'package', 'api', 'billing', 'export', 'account', 'reporting', 'licensing')),
  activation_status text not null default 'hidden' check (activation_status in ('hidden', 'internal_preview', 'active', 'paused', 'retired')),
  activated_by uuid references auth.users(id) on delete set null,
  activated_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.future_revenue_packages (
  slug text primary key check (slug ~ '^[a-z0-9-]{3,120}$'),
  name text not null check (char_length(name) between 2 and 160),
  category text not null check (category in ('research', 'election', 'monitoring', 'dashboard', 'desk', 'api', 'export', 'reporting', 'account', 'billing', 'licensing')),
  audience text not null check (char_length(audience) between 2 and 500),
  internal_purpose text not null check (char_length(internal_purpose) between 2 and 1200),
  status text not null default 'hidden' check (status in ('hidden', 'planned', 'internal_preview', 'active', 'retired')),
  default_feature_flag text references public.future_revenue_feature_flags(flag_key) on delete set null,
  capabilities jsonb not null default '[]'::jsonb,
  requires_contract boolean not null default true,
  requires_admin_activation boolean not null default true,
  public_copy_allowed boolean not null default false,
  checkout_enabled boolean not null default false,
  stripe_enabled boolean not null default false,
  api_enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.future_revenue_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 180),
  organization_type text not null default 'lead'
    check (organization_type in ('lead', 'campaign', 'media', 'law_firm', 'research', 'advocacy', 'vendor', 'investor', 'government_contractor', 'enterprise', 'other')),
  status text not null default 'lead' check (status in ('lead', 'qualified', 'trial', 'active', 'paused', 'canceled', 'rejected')),
  primary_email text check (primary_email is null or char_length(primary_email) between 5 and 180),
  owner_user_id uuid references auth.users(id) on delete set null,
  stripe_customer_id text unique,
  billing_notes text check (billing_notes is null or char_length(billing_notes) <= 2500),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.future_revenue_team_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.future_revenue_organizations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  email text not null check (char_length(email) between 5 and 180),
  role text not null default 'member' check (role in ('owner', 'admin', 'analyst', 'member', 'viewer', 'billing')),
  status text not null default 'invited' check (status in ('invited', 'active', 'suspended', 'removed')),
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (organization_id, email)
);

create table if not exists public.future_revenue_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.future_revenue_organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  package_slug text references public.future_revenue_packages(slug) on delete restrict not null,
  status text not null default 'planned' check (status in ('planned', 'lead', 'trial', 'active', 'past_due', 'paused', 'canceled', 'expired')),
  stripe_customer_id text,
  stripe_subscription_id text unique,
  stripe_price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.future_revenue_entitlements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.future_revenue_organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  package_slug text references public.future_revenue_packages(slug) on delete restrict not null,
  entitlement_key text not null check (entitlement_key ~ '^[a-z0-9_:-]{3,160}$'),
  status text not null default 'hidden' check (status in ('hidden', 'pending', 'active', 'suspended', 'expired', 'revoked')),
  quota_limit integer check (quota_limit is null or quota_limit >= 0),
  quota_used integer not null default 0 check (quota_used >= 0),
  starts_at timestamptz,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  check (organization_id is not null or user_id is not null),
  unique (organization_id, user_id, package_slug, entitlement_key)
);

create table if not exists public.future_revenue_api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.future_revenue_organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  package_slug text references public.future_revenue_packages(slug) on delete restrict,
  label text not null check (char_length(label) between 2 and 160),
  key_prefix text not null check (char_length(key_prefix) between 6 and 32),
  key_hash text not null unique check (char_length(key_hash) between 32 and 256),
  scopes text[] not null default '{}'::text[],
  status text not null default 'disabled' check (status in ('disabled', 'active', 'suspended', 'revoked', 'expired')),
  quota_limit integer check (quota_limit is null or quota_limit >= 0),
  quota_used integer not null default 0 check (quota_used >= 0),
  last_used_at timestamptz,
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  revoked_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  check (organization_id is not null or user_id is not null)
);

create table if not exists public.future_revenue_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.future_revenue_organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  package_slug text references public.future_revenue_packages(slug) on delete restrict,
  ledger_type text not null check (ledger_type in ('grant', 'purchase', 'usage', 'refund', 'adjustment', 'expiration')),
  credit_delta integer not null,
  balance_after integer check (balance_after is null or balance_after >= 0),
  reason text not null check (char_length(reason) between 2 and 500),
  related_export_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create table if not exists public.future_revenue_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.future_revenue_organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  invoice_number text unique check (invoice_number is null or char_length(invoice_number) <= 80),
  status text not null default 'draft' check (status in ('draft', 'open', 'sent', 'paid', 'void', 'uncollectible', 'refunded')),
  amount_cents integer not null default 0 check (amount_cents >= 0),
  currency text not null default 'usd' check (currency ~ '^[a-z]{3}$'),
  stripe_invoice_id text unique,
  pdf_storage_path text check (pdf_storage_path is null or char_length(pdf_storage_path) <= 1000),
  due_at timestamptz,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.future_revenue_licenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.future_revenue_organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  package_slug text references public.future_revenue_packages(slug) on delete restrict not null,
  license_key text unique check (license_key is null or char_length(license_key) <= 120),
  status text not null default 'draft' check (status in ('draft', 'active', 'suspended', 'expired', 'terminated')),
  seat_limit integer check (seat_limit is null or seat_limit >= 0),
  api_scope_limit text[] not null default '{}'::text[],
  terms_summary text check (terms_summary is null or char_length(terms_summary) <= 3000),
  starts_at timestamptz,
  ends_at timestamptz,
  signed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.future_revenue_export_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.future_revenue_organizations(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  package_slug text references public.future_revenue_packages(slug) on delete restrict,
  export_type text not null check (export_type in ('csv', 'pdf_report', 'api_batch', 'weekly_intelligence', 'dataset', 'white_label')),
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'canceled', 'revoked')),
  export_scope jsonb not null default '{}'::jsonb,
  row_count integer not null default 0 check (row_count >= 0),
  credit_cost integer not null default 0 check (credit_cost >= 0),
  storage_path text check (storage_path is null or char_length(storage_path) <= 1000),
  error_message text check (error_message is null or char_length(error_message) <= 2000),
  created_at timestamptz default now() not null,
  completed_at timestamptz,
  updated_at timestamptz default now() not null
);

create table if not exists public.future_revenue_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  organization_id uuid references public.future_revenue_organizations(id) on delete set null,
  event_type text not null check (char_length(event_type) between 2 and 120),
  target_table text check (target_table is null or char_length(target_table) <= 120),
  target_id text check (target_id is null or char_length(target_id) <= 160),
  before_value jsonb,
  after_value jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create index if not exists idx_future_revenue_flags_status
  on public.future_revenue_feature_flags(enabled, activation_status, scope);
create index if not exists idx_future_revenue_packages_status
  on public.future_revenue_packages(status, category);
create index if not exists idx_future_revenue_orgs_status
  on public.future_revenue_organizations(status, organization_type, created_at desc);
create index if not exists idx_future_revenue_team_org
  on public.future_revenue_team_members(organization_id, status);
create index if not exists idx_future_revenue_subscriptions_org
  on public.future_revenue_subscriptions(organization_id, status, package_slug);
create index if not exists idx_future_revenue_entitlements_subject
  on public.future_revenue_entitlements(organization_id, user_id, status);
create index if not exists idx_future_revenue_api_keys_subject
  on public.future_revenue_api_keys(organization_id, user_id, status);
create index if not exists idx_future_revenue_credit_ledger_subject
  on public.future_revenue_credit_ledger(organization_id, user_id, created_at desc);
create index if not exists idx_future_revenue_invoices_subject
  on public.future_revenue_invoices(organization_id, user_id, status, created_at desc);
create index if not exists idx_future_revenue_licenses_subject
  on public.future_revenue_licenses(organization_id, user_id, status);
create index if not exists idx_future_revenue_exports_subject
  on public.future_revenue_export_jobs(organization_id, requested_by, status, created_at desc);
create index if not exists idx_future_revenue_audit_subject
  on public.future_revenue_audit_events(organization_id, actor_user_id, created_at desc);

alter table public.future_revenue_feature_flags enable row level security;
alter table public.future_revenue_packages enable row level security;
alter table public.future_revenue_organizations enable row level security;
alter table public.future_revenue_team_members enable row level security;
alter table public.future_revenue_subscriptions enable row level security;
alter table public.future_revenue_entitlements enable row level security;
alter table public.future_revenue_api_keys enable row level security;
alter table public.future_revenue_credit_ledger enable row level security;
alter table public.future_revenue_invoices enable row level security;
alter table public.future_revenue_licenses enable row level security;
alter table public.future_revenue_export_jobs enable row level security;
alter table public.future_revenue_audit_events enable row level security;

grant select on public.future_revenue_feature_flags to authenticated, service_role;
grant select on public.future_revenue_packages to authenticated, service_role;
grant select on public.future_revenue_organizations to authenticated, service_role;
grant select on public.future_revenue_team_members to authenticated, service_role;
grant select on public.future_revenue_subscriptions to authenticated, service_role;
grant select on public.future_revenue_entitlements to authenticated, service_role;
grant select on public.future_revenue_api_keys to authenticated, service_role;
grant select on public.future_revenue_credit_ledger to authenticated, service_role;
grant select on public.future_revenue_invoices to authenticated, service_role;
grant select on public.future_revenue_licenses to authenticated, service_role;
grant select on public.future_revenue_export_jobs to authenticated, service_role;
grant select on public.future_revenue_audit_events to authenticated, service_role;
grant insert, update, delete on public.future_revenue_feature_flags to service_role;
grant insert, update, delete on public.future_revenue_packages to service_role;
grant insert, update, delete on public.future_revenue_organizations to service_role;
grant insert, update, delete on public.future_revenue_team_members to service_role;
grant insert, update, delete on public.future_revenue_subscriptions to service_role;
grant insert, update, delete on public.future_revenue_entitlements to service_role;
grant insert, update, delete on public.future_revenue_api_keys to service_role;
grant insert, update, delete on public.future_revenue_credit_ledger to service_role;
grant insert, update, delete on public.future_revenue_invoices to service_role;
grant insert, update, delete on public.future_revenue_licenses to service_role;
grant insert, update, delete on public.future_revenue_export_jobs to service_role;
grant insert, update, delete on public.future_revenue_audit_events to service_role;

drop policy if exists "Admins can manage future revenue flags" on public.future_revenue_feature_flags;
drop policy if exists "Admins can manage future revenue packages" on public.future_revenue_packages;
drop policy if exists "Admins can manage future revenue organizations" on public.future_revenue_organizations;
drop policy if exists "Organization members can read future revenue organizations" on public.future_revenue_organizations;
drop policy if exists "Admins can manage future revenue team members" on public.future_revenue_team_members;
drop policy if exists "Organization members can read own future revenue team rows" on public.future_revenue_team_members;
drop policy if exists "Admins can manage future revenue subscriptions" on public.future_revenue_subscriptions;
drop policy if exists "Organization members can read future revenue subscriptions" on public.future_revenue_subscriptions;
drop policy if exists "Admins can manage future revenue entitlements" on public.future_revenue_entitlements;
drop policy if exists "Users can read own future revenue entitlements" on public.future_revenue_entitlements;
drop policy if exists "Admins can manage future revenue api keys" on public.future_revenue_api_keys;
drop policy if exists "Users can read own future revenue api keys" on public.future_revenue_api_keys;
drop policy if exists "Admins can manage future revenue credits" on public.future_revenue_credit_ledger;
drop policy if exists "Users can read own future revenue credits" on public.future_revenue_credit_ledger;
drop policy if exists "Admins can manage future revenue invoices" on public.future_revenue_invoices;
drop policy if exists "Users can read own future revenue invoices" on public.future_revenue_invoices;
drop policy if exists "Admins can manage future revenue licenses" on public.future_revenue_licenses;
drop policy if exists "Users can read own future revenue licenses" on public.future_revenue_licenses;
drop policy if exists "Admins can manage future revenue exports" on public.future_revenue_export_jobs;
drop policy if exists "Users can read own future revenue exports" on public.future_revenue_export_jobs;
drop policy if exists "Admins can manage future revenue audit" on public.future_revenue_audit_events;

create policy "Admins can manage future revenue flags"
  on public.future_revenue_feature_flags for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Admins can manage future revenue packages"
  on public.future_revenue_packages for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Admins can manage future revenue organizations"
  on public.future_revenue_organizations for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Organization members can read future revenue organizations"
  on public.future_revenue_organizations for select
  to authenticated
  using (
    owner_user_id = (select auth.uid())
    or exists (
      select 1
      from public.future_revenue_team_members member
      where member.organization_id = future_revenue_organizations.id
        and member.user_id = (select auth.uid())
        and member.status = 'active'
    )
  );

create policy "Admins can manage future revenue team members"
  on public.future_revenue_team_members for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Organization members can read own future revenue team rows"
  on public.future_revenue_team_members for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Admins can manage future revenue subscriptions"
  on public.future_revenue_subscriptions for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Organization members can read future revenue subscriptions"
  on public.future_revenue_subscriptions for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1
      from public.future_revenue_team_members member
      where member.organization_id = future_revenue_subscriptions.organization_id
        and member.user_id = (select auth.uid())
        and member.status = 'active'
    )
  );

create policy "Admins can manage future revenue entitlements"
  on public.future_revenue_entitlements for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Users can read own future revenue entitlements"
  on public.future_revenue_entitlements for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1
      from public.future_revenue_team_members member
      where member.organization_id = future_revenue_entitlements.organization_id
        and member.user_id = (select auth.uid())
        and member.status = 'active'
    )
  );

create policy "Admins can manage future revenue api keys"
  on public.future_revenue_api_keys for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

-- API-key rows stay admin-only. A later customer-facing key screen should use
-- a redacted view that never exposes key_hash.

create policy "Admins can manage future revenue credits"
  on public.future_revenue_credit_ledger for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Users can read own future revenue credits"
  on public.future_revenue_credit_ledger for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Admins can manage future revenue invoices"
  on public.future_revenue_invoices for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Users can read own future revenue invoices"
  on public.future_revenue_invoices for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Admins can manage future revenue licenses"
  on public.future_revenue_licenses for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Users can read own future revenue licenses"
  on public.future_revenue_licenses for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Admins can manage future revenue exports"
  on public.future_revenue_export_jobs for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Users can read own future revenue exports"
  on public.future_revenue_export_jobs for select
  to authenticated
  using (requested_by = (select auth.uid()));

create policy "Admins can manage future revenue audit"
  on public.future_revenue_audit_events for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

insert into public.future_revenue_feature_flags (flag_key, label, description, scope, enabled, activation_status)
values
  ('future_revenue', 'Future Revenue Master Switch', 'Master switch for future revenue infrastructure. Keep disabled until launch approval.', 'future_revenue', false, 'hidden'),
  ('future_revenue_research_pro', 'Research Pro', 'Hidden flag for Research Pro.', 'package', false, 'hidden'),
  ('future_revenue_election_hq', 'Election HQ', 'Hidden flag for Election HQ.', 'package', false, 'hidden'),
  ('future_revenue_campaign_intel', 'Campaign Intel', 'Hidden flag for Campaign Intel.', 'package', false, 'hidden'),
  ('future_revenue_county_monitor', 'County Monitor', 'Hidden flag for County Monitor.', 'package', false, 'hidden'),
  ('future_revenue_school_board_monitor', 'School Board Monitor', 'Hidden flag for School Board Monitor.', 'package', false, 'hidden'),
  ('future_revenue_local_media_dashboard', 'Local Media Dashboard', 'Hidden flag for Local Media Dashboard.', 'package', false, 'hidden'),
  ('future_revenue_journalist_desk', 'Journalist Desk', 'Hidden flag for Journalist Desk.', 'package', false, 'hidden'),
  ('future_revenue_attorney_desk', 'Attorney Desk', 'Hidden flag for Attorney Desk.', 'package', false, 'hidden'),
  ('future_revenue_investor_dashboard', 'Investor Dashboard', 'Hidden flag for Investor Dashboard.', 'package', false, 'hidden'),
  ('future_revenue_government_contractor_monitor', 'Government Contractor Monitor', 'Hidden flag for Government Contractor Monitor.', 'package', false, 'hidden'),
  ('future_revenue_enterprise_api', 'Enterprise API', 'Hidden flag for Enterprise API.', 'api', false, 'hidden'),
  ('future_revenue_public_records_api', 'Public Records API', 'Hidden flag for Public Records API.', 'api', false, 'hidden'),
  ('future_revenue_data_export_api', 'Data Export API', 'Hidden flag for Data Export API.', 'api', false, 'hidden'),
  ('future_revenue_csv_export', 'CSV Export', 'Hidden flag for CSV Export.', 'export', false, 'hidden'),
  ('future_revenue_pdf_reports', 'PDF Reports', 'Hidden flag for PDF Reports.', 'reporting', false, 'hidden'),
  ('future_revenue_weekly_intelligence', 'Weekly Intelligence', 'Hidden flag for Weekly Intelligence.', 'reporting', false, 'hidden'),
  ('future_revenue_white_label', 'White Label', 'Hidden flag for White Label.', 'licensing', false, 'hidden'),
  ('future_revenue_organization_accounts', 'Organization Accounts', 'Hidden flag for Organization Accounts.', 'account', false, 'hidden'),
  ('future_revenue_team_accounts', 'Team Accounts', 'Hidden flag for Team Accounts.', 'account', false, 'hidden'),
  ('future_revenue_subscriptions', 'Subscriptions', 'Hidden flag for Subscriptions.', 'billing', false, 'hidden'),
  ('future_revenue_api_keys', 'API Keys', 'Hidden flag for API Keys.', 'api', false, 'hidden'),
  ('future_revenue_credits', 'Credits', 'Hidden flag for Credits.', 'billing', false, 'hidden'),
  ('future_revenue_invoices', 'Invoices', 'Hidden flag for Invoices.', 'billing', false, 'hidden'),
  ('future_revenue_licenses', 'Licenses', 'Hidden flag for Licenses.', 'licensing', false, 'hidden')
on conflict (flag_key) do update set
  label = excluded.label,
  description = excluded.description,
  scope = excluded.scope,
  updated_at = now();

insert into public.future_revenue_packages (slug, name, category, audience, internal_purpose, default_feature_flag, capabilities)
values
  ('research-pro', 'Research Pro', 'research', 'researchers, campaigns, watchdogs, and source runners', 'Expanded saved research, source maps, timelines, exports, and brief generation.', 'future_revenue_research_pro', '["saved research workspaces", "expanded packets", "export queue", "priority source review"]'::jsonb),
  ('election-hq', 'Election HQ', 'election', 'campaigns, local parties, civic groups, donors, and reporters', 'Race watch command center with candidates, filings, source gaps, finance, and questions.', 'future_revenue_election_hq', '["race dashboards", "candidate comparison", "filing monitor", "question builder"]'::jsonb),
  ('campaign-intel', 'Campaign Intel', 'research', 'campaigns, consultants, PACs, donors, and opposition researchers', 'Source-backed campaign intelligence with vote, funding, profile, and issue cuts.', 'future_revenue_campaign_intel', '["official dossiers", "funding cuts", "vote reactions", "issue pressure map"]'::jsonb),
  ('county-monitor', 'County Monitor', 'monitoring', 'county watchdogs, local media, attorneys, vendors, and civic groups', 'County official, meeting, filing, source, and public-record change monitoring.', 'future_revenue_county_monitor', '["county watchlists", "weekly digest", "meeting alerts", "missing-source queue"]'::jsonb),
  ('school-board-monitor', 'School Board Monitor', 'monitoring', 'parents, local reporters, candidates, and education groups', 'School board members, bond elections, meetings, votes, and source gaps.', 'future_revenue_school_board_monitor', '["board profiles", "bond tracking", "meeting clips", "public questions"]'::jsonb),
  ('local-media-dashboard', 'Local Media Dashboard', 'dashboard', 'local newsrooms, newsletter writers, and civic media operators', 'Source-backed story leads, official pages, questions, and share snippets.', 'future_revenue_local_media_dashboard', '["story leads", "source packets", "official context", "safe share snippets"]'::jsonb),
  ('journalist-desk', 'Journalist Desk', 'desk', 'journalists, editors, freelancers, and civic publishers', 'Reporter workflow for public records, source trails, timelines, and corrections.', 'future_revenue_journalist_desk', '["source trail builder", "timeline export", "public-record drafts", "correction history"]'::jsonb),
  ('attorney-desk', 'Attorney Desk', 'desk', 'attorneys, paralegals, investigators, and legal researchers', 'Public-record organization and official/agency source tracking without legal-advice claims.', 'future_revenue_attorney_desk', '["agency tracker", "record packet export", "timeline builder", "source gap report"]'::jsonb),
  ('investor-dashboard', 'Investor Dashboard', 'dashboard', 'investors, partners, and strategic buyers', 'Internal traction, coverage, data volume, revenue readiness, and growth signal view.', 'future_revenue_investor_dashboard', '["traction metrics", "coverage counters", "revenue pipeline", "data moat summary"]'::jsonb),
  ('government-contractor-monitor', 'Government Contractor Monitor', 'monitoring', 'vendors, watchdogs, reporters, attorneys, and procurement researchers', 'Public contract, vendor, donation, official, and agency relationship tracking.', 'future_revenue_government_contractor_monitor', '["vendor watchlists", "contract source links", "official relationships", "filing alerts"]'::jsonb),
  ('enterprise-api', 'Enterprise API', 'api', 'enterprise buyers, data customers, research teams, and integrations', 'Contract-gated API access with keys, scopes, quotas, credits, and audit logs.', 'future_revenue_enterprise_api', '["API keys", "scoped access", "quota enforcement", "usage audits"]'::jsonb),
  ('public-records-api', 'Public Records API', 'api', 'newsrooms, watchdogs, civic apps, and data teams', 'API lane for public source URLs, record metadata, source gaps, and profile links.', 'future_revenue_public_records_api', '["source metadata", "record links", "profile references", "change feed"]'::jsonb),
  ('data-export-api', 'Data Export API', 'api', 'data buyers, campaigns, consultants, and analysts', 'Programmatic export queue for aggregate data, source-backed datasets, and report runs.', 'future_revenue_data_export_api', '["export jobs", "dataset scopes", "usage credits", "delivery webhooks"]'::jsonb),
  ('csv-export', 'CSV Export', 'export', 'campaigns, researchers, journalists, and local operators', 'CSV output entitlement for profiles, sources, votes, funding, and watchlists.', 'future_revenue_csv_export', '["CSV queue", "row caps", "scope controls", "download audit"]'::jsonb),
  ('pdf-reports', 'PDF Reports', 'reporting', 'campaigns, local watchdogs, journalists, attorneys, and donors', 'Source-backed PDF report generation for officials, races, counties, and boards.', 'future_revenue_pdf_reports', '["PDF queue", "report templates", "source appendix", "fulfillment status"]'::jsonb),
  ('weekly-intelligence', 'Weekly Intelligence', 'reporting', 'members, teams, campaigns, media, and local civic operators', 'Paid digest lane for watched officials, counties, races, issues, and sources.', 'future_revenue_weekly_intelligence', '["weekly digest", "major changes", "new filings", "source gaps"]'::jsonb),
  ('white-label', 'White Label', 'licensing', 'local publishers, civic groups, media brands, and partner organizations', 'Partner-branded RepWatchr data experiences with strict source and safety controls.', 'future_revenue_white_label', '["partner branding", "organization tenancy", "scoped datasets", "license terms"]'::jsonb),
  ('organization-accounts', 'Organization Accounts', 'account', 'campaigns, firms, newsrooms, civic groups, and research teams', 'Shared account container for billing, seats, entitlements, exports, and audit logs.', 'future_revenue_organization_accounts', '["organization profile", "billing owner", "team seats", "shared workspaces"]'::jsonb),
  ('team-accounts', 'Team Accounts', 'account', 'multi-user research, campaign, legal, media, and civic teams', 'Seat-based member management and role-based access for organization workflows.', 'future_revenue_team_accounts', '["seat roles", "member invites", "workspace permissions", "audit log"]'::jsonb),
  ('subscriptions', 'Subscriptions', 'billing', 'recurring customers and organization accounts', 'Recurring billing container for future package activation without enabling checkout.', 'future_revenue_subscriptions', '["subscription records", "Stripe mapping", "status changes", "period tracking"]'::jsonb),
  ('api-keys', 'API Keys', 'api', 'contracted API customers and internal integrations', 'Hashed API-key registry with scopes, quotas, status, expiration, and audit logs.', 'future_revenue_api_keys', '["key prefix", "hashed key", "scopes", "expiration"]'::jsonb),
  ('credits', 'Credits', 'billing', 'export, API, report, and intelligence customers', 'Credit ledger for metered exports, API requests, reports, and paid review work.', 'future_revenue_credits', '["credit ledger", "usage deductions", "manual grants", "balance snapshots"]'::jsonb),
  ('invoices', 'Invoices', 'billing', 'B2B customers, organizations, and contracted data buyers', 'Invoice records for manual billing, Stripe invoices, PDFs, and status tracking.', 'future_revenue_invoices', '["invoice status", "amounts", "Stripe mapping", "PDF storage path"]'::jsonb),
  ('licenses', 'Licenses', 'licensing', 'data, API, white-label, and enterprise customers', 'License and contract terms for package access, exports, seats, and API scopes.', 'future_revenue_licenses', '["license terms", "seat limits", "contract dates", "revocation status"]'::jsonb)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  audience = excluded.audience,
  internal_purpose = excluded.internal_purpose,
  default_feature_flag = excluded.default_feature_flag,
  capabilities = excluded.capabilities,
  updated_at = now();

drop view if exists public.future_revenue_admin_summary;
drop view if exists public.future_revenue_package_registry;

create view public.future_revenue_package_registry
with (security_invoker = true)
as
select
  packages.slug,
  packages.name,
  packages.category,
  packages.audience,
  packages.internal_purpose,
  packages.status,
  packages.public_copy_allowed,
  packages.checkout_enabled,
  packages.stripe_enabled,
  packages.api_enabled,
  packages.capabilities,
  flags.flag_key,
  coalesce(flags.enabled, false) as flag_enabled,
  coalesce(flags.activation_status, 'hidden') as flag_activation_status,
  packages.updated_at
from public.future_revenue_packages packages
left join public.future_revenue_feature_flags flags
  on flags.flag_key = packages.default_feature_flag;

create view public.future_revenue_admin_summary
with (security_invoker = true)
as
select
  'all_time'::text as period,
  (select count(*)::int from public.future_revenue_packages) as package_count,
  (select count(*)::int from public.future_revenue_packages where status = 'hidden') as hidden_package_count,
  (select count(*)::int from public.future_revenue_feature_flags where enabled = true) as enabled_flag_count,
  (select count(*)::int from public.future_revenue_organizations) as organization_count,
  (select count(*)::int from public.future_revenue_subscriptions where status in ('trial', 'active')) as live_subscription_count,
  (select count(*)::int from public.future_revenue_api_keys where status = 'active') as active_api_key_count,
  (select count(*)::int from public.future_revenue_export_jobs) as export_job_count,
  (select coalesce(sum(amount_cents), 0)::bigint from public.future_revenue_invoices where status = 'paid') as paid_invoice_cents;

grant select on public.future_revenue_package_registry to authenticated, service_role;
grant select on public.future_revenue_admin_summary to authenticated, service_role;

drop trigger if exists set_future_revenue_feature_flags_updated_at on public.future_revenue_feature_flags;
create trigger set_future_revenue_feature_flags_updated_at
  before update on public.future_revenue_feature_flags
  for each row execute function public.handle_updated_at();

drop trigger if exists set_future_revenue_packages_updated_at on public.future_revenue_packages;
create trigger set_future_revenue_packages_updated_at
  before update on public.future_revenue_packages
  for each row execute function public.handle_updated_at();

drop trigger if exists set_future_revenue_organizations_updated_at on public.future_revenue_organizations;
create trigger set_future_revenue_organizations_updated_at
  before update on public.future_revenue_organizations
  for each row execute function public.handle_updated_at();

drop trigger if exists set_future_revenue_team_members_updated_at on public.future_revenue_team_members;
create trigger set_future_revenue_team_members_updated_at
  before update on public.future_revenue_team_members
  for each row execute function public.handle_updated_at();

drop trigger if exists set_future_revenue_subscriptions_updated_at on public.future_revenue_subscriptions;
create trigger set_future_revenue_subscriptions_updated_at
  before update on public.future_revenue_subscriptions
  for each row execute function public.handle_updated_at();

drop trigger if exists set_future_revenue_entitlements_updated_at on public.future_revenue_entitlements;
create trigger set_future_revenue_entitlements_updated_at
  before update on public.future_revenue_entitlements
  for each row execute function public.handle_updated_at();

drop trigger if exists set_future_revenue_api_keys_updated_at on public.future_revenue_api_keys;
create trigger set_future_revenue_api_keys_updated_at
  before update on public.future_revenue_api_keys
  for each row execute function public.handle_updated_at();

drop trigger if exists set_future_revenue_invoices_updated_at on public.future_revenue_invoices;
create trigger set_future_revenue_invoices_updated_at
  before update on public.future_revenue_invoices
  for each row execute function public.handle_updated_at();

drop trigger if exists set_future_revenue_licenses_updated_at on public.future_revenue_licenses;
create trigger set_future_revenue_licenses_updated_at
  before update on public.future_revenue_licenses
  for each row execute function public.handle_updated_at();

drop trigger if exists set_future_revenue_export_jobs_updated_at on public.future_revenue_export_jobs;
create trigger set_future_revenue_export_jobs_updated_at
  before update on public.future_revenue_export_jobs
  for each row execute function public.handle_updated_at();
