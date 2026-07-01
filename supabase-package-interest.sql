-- ============================================================
-- RepWatchr Package Interest Capture
-- ============================================================
-- Public checkout stays disabled unless ENABLE_PAYMENTS=true.
-- This table captures demand signals for future packages without selling
-- private user behavior or individual political-interest profiles.

create extension if not exists pgcrypto;

create or replace function public.is_repw_package_interest_admin()
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

create or replace function public.repw_package_interest_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.package_interest (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text check (anonymous_id is null or char_length(anonymous_id) <= 120),
  user_id uuid references auth.users(id) on delete set null,
  email text check (
    email is null
    or (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' and char_length(email) <= 180)
  ),
  name text check (name is null or char_length(name) <= 120),
  package_key text not null check (package_key in (
    'quick_record_check',
    'official_record_brief',
    'local_race_source_pack',
    'election_watch_desk',
    'school_board_monitor',
    'county_monitor',
    'journalist_desk',
    'attorney_research_desk',
    'campaign_finance_tracker',
    'organization_dashboard',
    'public_data_api',
    'bulk_profile_export',
    'custom_research',
    'investor_partner'
  )),
  package_name text not null check (char_length(package_name) between 2 and 180),
  source_route text check (source_route is null or char_length(source_route) <= 500),
  entity_type text check (entity_type is null or char_length(entity_type) <= 80),
  entity_id text check (entity_id is null or char_length(entity_id) <= 180),
  jurisdiction text check (jurisdiction is null or char_length(jurisdiction) <= 180),
  urgency text check (urgency is null or urgency in (
    'just exploring',
    'this week',
    'this month',
    'before an election',
    'before a meeting',
    'ongoing monitoring'
  )),
  use_case text check (use_case is null or char_length(use_case) <= 3000),
  budget_range text check (budget_range is null or budget_range in (
    'not sure yet',
    'under $100',
    '$100-$299',
    '$300-$749',
    '$750-$1,499',
    '$1,500+',
    'monthly budget'
  )),
  organization_type text check (organization_type is null or organization_type in (
    'individual citizen',
    'journalist',
    'attorney/legal team',
    'campaign',
    'civic group',
    'nonprofit',
    'business',
    'investor',
    'researcher',
    'government contractor',
    'other'
  )),
  message text check (message is null or char_length(message) <= 2000),
  attribution jsonb default '{}'::jsonb not null,
  status text default 'new' not null check (status in (
    'new',
    'reviewed',
    'contacted',
    'qualified',
    'beta_candidate',
    'not_fit',
    'converted_to_order',
    'archived'
  )),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

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

create index if not exists idx_package_interest_created
  on public.package_interest(created_at desc);
create index if not exists idx_package_interest_package_status
  on public.package_interest(package_key, status, created_at desc);
create index if not exists idx_package_interest_jurisdiction
  on public.package_interest(jurisdiction, created_at desc)
  where jurisdiction is not null;
create index if not exists idx_package_interest_source_route
  on public.package_interest(source_route, created_at desc)
  where source_route is not null;
create index if not exists idx_package_interest_org_urgency
  on public.package_interest(organization_type, urgency, created_at desc);
create index if not exists idx_package_interest_user
  on public.package_interest(user_id, created_at desc)
  where user_id is not null;
create index if not exists idx_package_interest_email
  on public.package_interest(lower(email), created_at desc)
  where email is not null;
create index if not exists idx_package_interest_attribution
  on public.package_interest using gin (attribution);

drop trigger if exists trg_package_interest_updated_at on public.package_interest;
create trigger trg_package_interest_updated_at
before update on public.package_interest
for each row execute function public.repw_package_interest_set_updated_at();

drop trigger if exists trg_package_interest_feature_flags_updated_at on public.feature_flags;
create trigger trg_package_interest_feature_flags_updated_at
before update on public.feature_flags
for each row execute function public.repw_package_interest_set_updated_at();

alter table public.package_interest enable row level security;
alter table public.feature_flags enable row level security;

grant select, insert on public.package_interest to anon, authenticated;
grant select, insert, update, delete on public.package_interest to service_role;
grant select, insert, update, delete on public.feature_flags to authenticated, service_role;

drop policy if exists "Public inserts package interest" on public.package_interest;
drop policy if exists "Users read own package interest" on public.package_interest;
drop policy if exists "Admins manage package interest" on public.package_interest;
drop policy if exists "Admins manage package interest feature flags" on public.feature_flags;

create policy "Public inserts package interest"
  on public.package_interest for insert
  to anon, authenticated
  with check (
    status = 'new'
    and (user_id is null or user_id = auth.uid())
  );

create policy "Users read own package interest"
  on public.package_interest for select
  to authenticated
  using (
    user_id = auth.uid()
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or public.is_repw_package_interest_admin()
  );

create policy "Admins manage package interest"
  on public.package_interest for all
  to authenticated
  using (public.is_repw_package_interest_admin())
  with check (public.is_repw_package_interest_admin());

create policy "Admins manage package interest feature flags"
  on public.feature_flags for all
  to authenticated
  using (public.is_repw_package_interest_admin())
  with check (public.is_repw_package_interest_admin());

-- Seed payment flag if the pricing-experiments migration has not already done it.
insert into public.feature_flags (key, description, enabled, rollout_percentage, metadata)
values (
  'ENABLE_PAYMENTS',
  'Allows public checkout/payment routes to expose live payment CTAs. Defaults off.',
  false,
  0,
  '{"server_only": true, "package_interest_default": true}'::jsonb
)
on conflict (key) do update
set
  description = excluded.description,
  metadata = public.feature_flags.metadata || excluded.metadata,
  updated_at = now();
