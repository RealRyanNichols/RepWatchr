-- ============================================================
-- RepWatchr Pricing Experiments, Feature Flags, and Beta Access
-- ============================================================
-- Builds demand and pricing-sensitivity infrastructure without publicly
-- launching payments. Checkout remains hidden unless ENABLE_PAYMENTS is true
-- in server configuration and the Stripe service is configured.

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

create schema if not exists private;

create or replace function private.is_repw_admin()
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.user_roles
    where user_roles.user_id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function private.is_repw_admin() from public;
grant execute on function private.is_repw_admin() to authenticated;

create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  description text,
  enabled boolean not null default false,
  rollout_percentage int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feature_flags_key_shape check (key ~ '^[A-Z0-9_]{3,120}$'),
  constraint feature_flags_rollout_range check (rollout_percentage between 0 and 100),
  constraint feature_flags_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.pricing_experiments (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  package_key text not null,
  name text not null,
  status text not null default 'draft',
  hypothesis text,
  variants jsonb not null default '[]'::jsonb,
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pricing_experiments_key_shape check (key ~ '^[a-z0-9][a-z0-9_-]{2,120}$'),
  constraint pricing_experiments_package_key_shape check (package_key ~ '^[a-z0-9][a-z0-9_-]{2,120}$'),
  constraint pricing_experiments_status_check check (status in ('draft', 'active', 'paused', 'completed', 'archived')),
  constraint pricing_experiments_variants_array check (jsonb_typeof(variants) = 'array')
);

create table if not exists public.pricing_experiment_assignments (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.pricing_experiments(id) on delete cascade,
  anonymous_id text,
  user_id uuid references auth.users(id) on delete set null,
  variant_key text not null,
  assigned_at timestamptz not null default now(),
  constraint pricing_experiment_assignments_actor_check check (anonymous_id is not null or user_id is not null)
);

create table if not exists public.pricing_experiment_events (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid references public.pricing_experiments(id) on delete set null,
  anonymous_id text,
  user_id uuid references auth.users(id) on delete set null,
  variant_key text,
  event_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint pricing_experiment_events_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint pricing_experiment_events_name_check check (
    event_name in (
      'pricing_experiment_viewed',
      'pricing_variant_assigned',
      'pricing_variant_viewed',
      'pricing_cta_clicked',
      'beta_access_requested',
      'package_interest_submitted',
      'checkout_started',
      'checkout_completed',
      'beta_invite_sent',
      'beta_status_changed',
      'experiment_created',
      'experiment_status_changed',
      'feature_flag_changed'
    )
  )
);

create table if not exists public.beta_access_requests (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  name text,
  package_key text not null,
  use_case text,
  jurisdiction text,
  organization_type text,
  urgency text,
  status text not null default 'new',
  invite_code text,
  invited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint beta_access_email_shape check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint beta_access_package_key_shape check (package_key ~ '^[a-z0-9][a-z0-9_-]{2,120}$'),
  constraint beta_access_status_check check (status in ('new', 'reviewed', 'invited', 'active', 'not_fit', 'waitlist', 'archived'))
);

create index if not exists feature_flags_key_idx on public.feature_flags(key);
create index if not exists pricing_experiments_package_status_idx on public.pricing_experiments(package_key, status);
create index if not exists pricing_experiments_status_idx on public.pricing_experiments(status);
create index if not exists pricing_experiment_assignments_experiment_idx on public.pricing_experiment_assignments(experiment_id, assigned_at desc);
create index if not exists pricing_experiment_assignments_user_idx on public.pricing_experiment_assignments(user_id, assigned_at desc);
create index if not exists pricing_experiment_assignments_anon_idx on public.pricing_experiment_assignments(anonymous_id, assigned_at desc);
create index if not exists pricing_experiment_events_experiment_idx on public.pricing_experiment_events(experiment_id, created_at desc);
create index if not exists pricing_experiment_events_event_idx on public.pricing_experiment_events(event_name, created_at desc);
create index if not exists beta_access_requests_package_status_idx on public.beta_access_requests(package_key, status);
create index if not exists beta_access_requests_created_at_idx on public.beta_access_requests(created_at desc);
create index if not exists beta_access_requests_user_idx on public.beta_access_requests(user_id, created_at desc);

alter table public.feature_flags enable row level security;
alter table public.pricing_experiments enable row level security;
alter table public.pricing_experiment_assignments enable row level security;
alter table public.pricing_experiment_events enable row level security;
alter table public.beta_access_requests enable row level security;

revoke all on public.feature_flags from anon, authenticated;
revoke all on public.pricing_experiments from anon, authenticated;
revoke all on public.pricing_experiment_assignments from anon, authenticated;
revoke all on public.pricing_experiment_events from anon, authenticated;
revoke all on public.beta_access_requests from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant insert on public.beta_access_requests to anon, authenticated;
grant select on public.beta_access_requests to authenticated;
grant select, insert, update, delete on public.feature_flags to authenticated;
grant select, insert, update, delete on public.pricing_experiments to authenticated;
grant select, insert, update, delete on public.pricing_experiment_assignments to authenticated;
grant select, insert, update, delete on public.pricing_experiment_events to authenticated;
grant update on public.beta_access_requests to authenticated;

drop policy if exists "Public can request beta access" on public.beta_access_requests;
create policy "Public can request beta access"
  on public.beta_access_requests for insert
  to anon, authenticated
  with check (
    status = 'new'
    and invite_code is null
    and invited_at is null
    and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    and (
      user_id is null
      or user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can read own beta access requests" on public.beta_access_requests;
create policy "Users can read own beta access requests"
  on public.beta_access_requests for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Admins can manage feature flags" on public.feature_flags;
create policy "Admins can manage feature flags"
  on public.feature_flags for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop policy if exists "Admins can manage pricing experiments" on public.pricing_experiments;
create policy "Admins can manage pricing experiments"
  on public.pricing_experiments for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop policy if exists "Admins can manage pricing assignments" on public.pricing_experiment_assignments;
create policy "Admins can manage pricing assignments"
  on public.pricing_experiment_assignments for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop policy if exists "Admins can manage pricing events" on public.pricing_experiment_events;
create policy "Admins can manage pricing events"
  on public.pricing_experiment_events for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop policy if exists "Admins can manage beta access requests" on public.beta_access_requests;
create policy "Admins can manage beta access requests"
  on public.beta_access_requests for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop trigger if exists set_feature_flags_updated_at on public.feature_flags;
create trigger set_feature_flags_updated_at
  before update on public.feature_flags
  for each row execute function public.handle_updated_at();

drop trigger if exists set_pricing_experiments_updated_at on public.pricing_experiments;
create trigger set_pricing_experiments_updated_at
  before update on public.pricing_experiments
  for each row execute function public.handle_updated_at();

drop trigger if exists set_beta_access_requests_updated_at on public.beta_access_requests;
create trigger set_beta_access_requests_updated_at
  before update on public.beta_access_requests
  for each row execute function public.handle_updated_at();

insert into public.feature_flags (key, description, enabled, rollout_percentage, metadata)
values
  ('ENABLE_PAYMENTS', 'Allows public checkout entry points. Default false; Stripe config is still required.', false, 0, '{}'::jsonb),
  ('ENABLE_AI_SOURCE_REVIEW', 'Allows admin AI source review assistant when provider is configured.', false, 0, '{}'::jsonb),
  ('ENABLE_EMAIL_SENDING', 'Allows notification/digest email sending when provider is configured.', false, 0, '{}'::jsonb),
  ('ENABLE_PUBLIC_API', 'Allows future public API surface.', false, 0, '{}'::jsonb),
  ('ENABLE_BETA_PACKAGES', 'Allows beta package demand capture and optional expected ranges.', false, 0, '{}'::jsonb),
  ('ENABLE_ORGANIZATION_DASHBOARD', 'Allows future organization dashboard access.', false, 0, '{}'::jsonb),
  ('ENABLE_ADVANCED_ANALYTICS', 'Allows advanced analytics modules beyond basic product telemetry.', false, 0, '{}'::jsonb),
  ('ENABLE_EXPORTS', 'Allows future CSV/PDF/data exports.', false, 0, '{}'::jsonb),
  ('ENABLE_PWA_INSTALL_PROMPT', 'Allows subtle PWA install prompt after engagement threshold.', false, 0, '{}'::jsonb)
on conflict (key) do nothing;
