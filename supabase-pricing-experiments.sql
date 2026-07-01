-- ============================================================
-- RepWatchr Pricing Experiments, Feature Flags, and Beta Access
-- ============================================================
-- Payments remain disabled unless ENABLE_PAYMENTS=true in the server environment.
-- Public checkout links should not be exposed from these tables by default.

create extension if not exists pgcrypto;

create or replace function public.is_repw_pricing_admin()
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

create or replace function public.repw_pricing_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text unique not null check (key ~ '^[A-Z0-9_]{2,120}$'),
  description text check (description is null or char_length(description) <= 1000),
  enabled boolean default false not null,
  rollout_percentage int default 0 not null check (rollout_percentage between 0 and 100),
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.pricing_experiments (
  id uuid primary key default gen_random_uuid(),
  key text unique not null check (key ~ '^[a-z0-9_-]{2,120}$'),
  package_key text not null check (package_key in (
    'quick-record-check',
    'official-record-brief',
    'local-race-source-pack',
    'election-watch-desk',
    'school-board-monitor'
  )),
  name text not null check (char_length(name) between 2 and 180),
  status text default 'draft' not null check (status in ('draft', 'active', 'paused', 'completed', 'archived')),
  hypothesis text check (hypothesis is null or char_length(hypothesis) <= 2000),
  variants jsonb default '[]'::jsonb not null,
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.pricing_experiment_assignments (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.pricing_experiments(id) on delete cascade,
  anonymous_id text check (anonymous_id is null or char_length(anonymous_id) <= 120),
  user_id uuid references auth.users(id) on delete cascade,
  variant_key text not null check (char_length(variant_key) between 2 and 120),
  assigned_at timestamptz default now() not null,
  unique (experiment_id, anonymous_id),
  unique (experiment_id, user_id)
);

create table if not exists public.pricing_experiment_events (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid references public.pricing_experiments(id) on delete set null,
  anonymous_id text check (anonymous_id is null or char_length(anonymous_id) <= 120),
  user_id uuid references auth.users(id) on delete set null,
  variant_key text check (variant_key is null or char_length(variant_key) <= 120),
  event_name text not null check (event_name in (
    'pricing_variant_viewed',
    'pricing_cta_clicked',
    'beta_access_requested',
    'package_interest_submitted',
    'checkout_started',
    'checkout_completed',
    'pricing_experiment_viewed',
    'pricing_variant_assigned',
    'beta_invite_sent'
  )),
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null
);

create table if not exists public.beta_access_requests (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text check (anonymous_id is null or char_length(anonymous_id) <= 120),
  user_id uuid references auth.users(id) on delete set null,
  email text not null check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' and char_length(email) <= 180),
  name text check (name is null or char_length(name) <= 120),
  package_key text not null check (package_key in (
    'quick-record-check',
    'official-record-brief',
    'local-race-source-pack',
    'election-watch-desk',
    'school-board-monitor'
  )),
  use_case text check (use_case is null or char_length(use_case) <= 3000),
  jurisdiction text check (jurisdiction is null or char_length(jurisdiction) <= 180),
  organization_type text check (organization_type is null or char_length(organization_type) <= 120),
  urgency text check (urgency is null or char_length(urgency) <= 80),
  status text default 'new' not null check (status in ('new', 'reviewed', 'invited', 'active', 'not_fit', 'waitlist', 'archived')),
  invite_code text check (invite_code is null or char_length(invite_code) <= 120),
  invited_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_feature_flags_key
  on public.feature_flags(key);
create index if not exists idx_pricing_experiments_package_status
  on public.pricing_experiments(package_key, status, updated_at desc);
create index if not exists idx_pricing_experiment_assignments_experiment
  on public.pricing_experiment_assignments(experiment_id, assigned_at desc);
create index if not exists idx_pricing_experiment_assignments_user
  on public.pricing_experiment_assignments(user_id, assigned_at desc)
  where user_id is not null;
create index if not exists idx_pricing_experiment_assignments_anonymous
  on public.pricing_experiment_assignments(anonymous_id, assigned_at desc)
  where anonymous_id is not null;
create index if not exists idx_pricing_experiment_events_name
  on public.pricing_experiment_events(event_name, created_at desc);
create index if not exists idx_pricing_experiment_events_package
  on public.pricing_experiment_events(((metadata ->> 'package_key')), created_at desc);
create index if not exists idx_beta_access_requests_status
  on public.beta_access_requests(status, created_at desc);
create index if not exists idx_beta_access_requests_package
  on public.beta_access_requests(package_key, status, created_at desc);
create index if not exists idx_beta_access_requests_user
  on public.beta_access_requests(user_id, created_at desc)
  where user_id is not null;
create index if not exists idx_beta_access_requests_email
  on public.beta_access_requests(lower(email), created_at desc);

drop trigger if exists trg_feature_flags_updated_at on public.feature_flags;
create trigger trg_feature_flags_updated_at
before update on public.feature_flags
for each row execute function public.repw_pricing_set_updated_at();

drop trigger if exists trg_pricing_experiments_updated_at on public.pricing_experiments;
create trigger trg_pricing_experiments_updated_at
before update on public.pricing_experiments
for each row execute function public.repw_pricing_set_updated_at();

drop trigger if exists trg_beta_access_requests_updated_at on public.beta_access_requests;
create trigger trg_beta_access_requests_updated_at
before update on public.beta_access_requests
for each row execute function public.repw_pricing_set_updated_at();

alter table public.feature_flags enable row level security;
alter table public.pricing_experiments enable row level security;
alter table public.pricing_experiment_assignments enable row level security;
alter table public.pricing_experiment_events enable row level security;
alter table public.beta_access_requests enable row level security;

grant select, insert, update, delete on public.feature_flags to authenticated, service_role;
grant select, insert, update, delete on public.pricing_experiments to authenticated, service_role;
grant select, insert, update, delete on public.pricing_experiment_assignments to authenticated, service_role;
grant select, insert on public.pricing_experiment_events to anon, authenticated;
grant select, insert, update, delete on public.pricing_experiment_events to service_role;
grant select, insert on public.beta_access_requests to anon, authenticated;
grant select, insert, update, delete on public.beta_access_requests to service_role;

drop policy if exists "Admins manage feature flags" on public.feature_flags;
drop policy if exists "Admins manage pricing experiments" on public.pricing_experiments;
drop policy if exists "Admins manage pricing assignments" on public.pricing_experiment_assignments;
drop policy if exists "Admins manage pricing events" on public.pricing_experiment_events;
drop policy if exists "Public inserts pricing events" on public.pricing_experiment_events;
drop policy if exists "Admins manage beta requests" on public.beta_access_requests;
drop policy if exists "Public inserts beta requests" on public.beta_access_requests;
drop policy if exists "Users read own beta requests" on public.beta_access_requests;

create policy "Admins manage feature flags"
  on public.feature_flags for all
  to authenticated
  using (public.is_repw_pricing_admin())
  with check (public.is_repw_pricing_admin());

create policy "Admins manage pricing experiments"
  on public.pricing_experiments for all
  to authenticated
  using (public.is_repw_pricing_admin())
  with check (public.is_repw_pricing_admin());

create policy "Admins manage pricing assignments"
  on public.pricing_experiment_assignments for all
  to authenticated
  using (public.is_repw_pricing_admin())
  with check (public.is_repw_pricing_admin());

create policy "Admins manage pricing events"
  on public.pricing_experiment_events for all
  to authenticated
  using (public.is_repw_pricing_admin())
  with check (public.is_repw_pricing_admin());

create policy "Public inserts pricing events"
  on public.pricing_experiment_events for insert
  to anon, authenticated
  with check (
    event_name in (
      'pricing_variant_viewed',
      'pricing_cta_clicked',
      'beta_access_requested',
      'package_interest_submitted',
      'checkout_started',
      'checkout_completed',
      'pricing_experiment_viewed',
      'pricing_variant_assigned'
    )
    and (user_id is null or user_id = auth.uid())
  );

create policy "Admins manage beta requests"
  on public.beta_access_requests for all
  to authenticated
  using (public.is_repw_pricing_admin())
  with check (public.is_repw_pricing_admin());

create policy "Public inserts beta requests"
  on public.beta_access_requests for insert
  to anon, authenticated
  with check (
    status = 'new'
    and invite_code is null
    and invited_at is null
    and (user_id is null or user_id = auth.uid())
  );

create policy "Users read own beta requests"
  on public.beta_access_requests for select
  to authenticated
  using (
    user_id = auth.uid()
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or public.is_repw_pricing_admin()
  );

insert into public.feature_flags (key, description, enabled, rollout_percentage, metadata)
values
  ('ENABLE_PAYMENTS', 'Allows public checkout/payment routes to expose live payment CTAs. Defaults off.', false, 0, '{"server_only": true}'::jsonb),
  ('ENABLE_AI_SOURCE_REVIEW', 'Allows admin AI source-review assistant when provider keys are configured.', false, 0, '{"server_only": true}'::jsonb),
  ('ENABLE_EMAIL_SENDING', 'Allows outbound email sending through configured provider. Defaults off.', false, 0, '{"server_only": true}'::jsonb),
  ('ENABLE_PUBLIC_API', 'Allows public API/data product surfaces. Defaults off.', false, 0, '{"server_only": true}'::jsonb),
  ('ENABLE_BETA_PACKAGES', 'Allows public beta package interest and expected-range messaging. Defaults off.', false, 0, '{"public_ui": true}'::jsonb),
  ('ENABLE_ORGANIZATION_DASHBOARD', 'Allows organization/team dashboard surfaces. Defaults off.', false, 0, '{"public_ui": false}'::jsonb),
  ('ENABLE_ADVANCED_ANALYTICS', 'Allows advanced analytics dashboards and aggregate reports. Defaults off.', false, 0, '{"public_ui": false}'::jsonb),
  ('ENABLE_EXPORTS', 'Allows CSV/PDF/export features. Defaults off.', false, 0, '{"public_ui": false}'::jsonb),
  ('ENABLE_PWA_INSTALL_PROMPT', 'Allows install prompt UI after engagement thresholds. Defaults off.', false, 0, '{"public_ui": true}'::jsonb)
on conflict (key) do update
set
  description = excluded.description,
  metadata = public.feature_flags.metadata || excluded.metadata,
  updated_at = now();

insert into public.pricing_experiments (key, package_key, name, status, hypothesis, variants)
values
  (
    'quick-record-check-beta-pricing',
    'quick-record-check',
    'Quick Record Check beta pricing',
    'draft',
    'Test whether a narrow one-record package converts better at $49, $79, or $99 before enabling checkout.',
    '[{"key":"quick_49","label":"$49 one-time","price_cents":4900},{"key":"quick_79","label":"$79 one-time","price_cents":7900},{"key":"quick_99","label":"$99 one-time","price_cents":9900}]'::jsonb
  ),
  (
    'official-record-brief-beta-pricing',
    'official-record-brief',
    'Official Record Brief beta pricing',
    'draft',
    'Test whether official-profile record briefs should launch at $199, $299, or $499 based on demand and scope.',
    '[{"key":"brief_199","label":"$199 one-time","price_cents":19900},{"key":"brief_299","label":"$299 one-time","price_cents":29900},{"key":"brief_499","label":"$499 one-time","price_cents":49900}]'::jsonb
  ),
  (
    'local-race-source-pack-beta-pricing',
    'local-race-source-pack',
    'Local Race Source Pack beta pricing',
    'draft',
    'Test local race packet demand across $149, $299, and $499 before public checkout.',
    '[{"key":"race_149","label":"$149 one-time","price_cents":14900},{"key":"race_299","label":"$299 one-time","price_cents":29900},{"key":"race_499","label":"$499 one-time","price_cents":49900}]'::jsonb
  ),
  (
    'election-watch-desk-beta-pricing',
    'election-watch-desk',
    'Election Watch Desk beta pricing',
    'draft',
    'Test recurring election-watch demand across $500/mo, $750/mo, and $1,500/mo.',
    '[{"key":"watch_500","label":"$500/mo","price_cents":50000},{"key":"watch_750","label":"$750/mo","price_cents":75000},{"key":"watch_1500","label":"$1,500/mo","price_cents":150000}]'::jsonb
  ),
  (
    'school-board-monitor-beta-pricing',
    'school-board-monitor',
    'School Board Monitor beta pricing',
    'draft',
    'Test school-board monitoring demand across $99/mo, $199/mo, and $499/mo.',
    '[{"key":"school_99","label":"$99/mo","price_cents":9900},{"key":"school_199","label":"$199/mo","price_cents":19900},{"key":"school_499","label":"$499/mo","price_cents":49900}]'::jsonb
  )
on conflict (key) do update
set
  package_key = excluded.package_key,
  name = excluded.name,
  hypothesis = excluded.hypothesis,
  variants = excluded.variants,
  updated_at = now();
