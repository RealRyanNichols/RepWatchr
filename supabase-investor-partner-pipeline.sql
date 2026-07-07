-- ============================================================
-- RepWatchr Investor, Partner, Sponsor, and B2B Pipeline
-- ============================================================
-- Interest capture and admin pipeline tracking for investors, civic partners,
-- data/API partners, journalists, legal/research customers, campaigns/public
-- affairs customers, watchdog groups, monitoring customers, organizations,
-- and clearly labeled civic education sponsors.
--
-- This is not a public securities offering. It does not create investment
-- terms, guaranteed returns, hidden sponsored content, or checkout/payment.

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

create table if not exists public.partner_interest (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  organization text,
  title text,
  website text,
  interest_type text not null,
  budget_or_check_size text,
  jurisdiction_focus text,
  message text,
  attribution jsonb not null default '{}'::jsonb,
  status text not null default 'new',
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_interest_email_shape check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint partner_interest_website_shape check (website is null or website ~* '^https?://'),
  constraint partner_interest_attribution_object check (jsonb_typeof(attribution) = 'object'),
  constraint partner_interest_type_check check (
    interest_type in (
      'investor',
      'data_api_partner',
      'media_partner',
      'legal_research_customer',
      'journalist',
      'civic_group',
      'nonprofit',
      'campaign_public_affairs',
      'school_board_monitoring',
      'county_monitoring',
      'organization_dashboard',
      'sponsor_civic_education',
      'government_contractor_monitoring',
      'other'
    )
  ),
  constraint partner_interest_status_check check (
    status in (
      'new',
      'reviewed',
      'contacted',
      'meeting_scheduled',
      'qualified',
      'not_fit',
      'partner',
      'investor_interest',
      'archived'
    )
  )
);

alter table public.partner_interest add column if not exists anonymous_id text;
alter table public.partner_interest add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.partner_interest add column if not exists name text;
alter table public.partner_interest add column if not exists email text;
alter table public.partner_interest add column if not exists organization text;
alter table public.partner_interest add column if not exists title text;
alter table public.partner_interest add column if not exists website text;
alter table public.partner_interest add column if not exists interest_type text;
alter table public.partner_interest add column if not exists budget_or_check_size text;
alter table public.partner_interest add column if not exists jurisdiction_focus text;
alter table public.partner_interest add column if not exists message text;
alter table public.partner_interest add column if not exists attribution jsonb not null default '{}'::jsonb;
alter table public.partner_interest add column if not exists status text not null default 'new';
alter table public.partner_interest add column if not exists assigned_to uuid references auth.users(id) on delete set null;
alter table public.partner_interest add column if not exists created_at timestamptz not null default now();
alter table public.partner_interest add column if not exists updated_at timestamptz not null default now();

create table if not exists public.partner_pipeline_events (
  id uuid primary key default gen_random_uuid(),
  partner_interest_id uuid not null references public.partner_interest(id) on delete cascade,
  event_type text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint partner_pipeline_events_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint partner_pipeline_events_type_check check (
    event_type in (
      'submitted',
      'status_changed',
      'note_added',
      'assigned',
      'meeting_scheduled',
      'account_created',
      'exported',
      'archived'
    )
  )
);

alter table public.partner_pipeline_events add column if not exists partner_interest_id uuid references public.partner_interest(id) on delete cascade;
alter table public.partner_pipeline_events add column if not exists event_type text;
alter table public.partner_pipeline_events add column if not exists actor_user_id uuid references auth.users(id) on delete set null;
alter table public.partner_pipeline_events add column if not exists notes text;
alter table public.partner_pipeline_events add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.partner_pipeline_events add column if not exists created_at timestamptz not null default now();

create table if not exists public.partner_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  account_type text not null,
  website text,
  contact_email text,
  status text not null default 'prospect',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_accounts_email_shape check (contact_email is null or contact_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint partner_accounts_website_shape check (website is null or website ~* '^https?://'),
  constraint partner_accounts_type_check check (
    account_type in (
      'investor',
      'data_api_partner',
      'media_partner',
      'legal_research_customer',
      'journalist',
      'civic_group',
      'nonprofit',
      'campaign_public_affairs',
      'school_board_monitoring',
      'county_monitoring',
      'organization_dashboard',
      'sponsor_civic_education',
      'government_contractor_monitoring',
      'other'
    )
  ),
  constraint partner_accounts_status_check check (
    status in ('prospect', 'active', 'paused', 'not_fit', 'archived')
  )
);

alter table public.partner_accounts add column if not exists name text;
alter table public.partner_accounts add column if not exists account_type text;
alter table public.partner_accounts add column if not exists website text;
alter table public.partner_accounts add column if not exists contact_email text;
alter table public.partner_accounts add column if not exists status text not null default 'prospect';
alter table public.partner_accounts add column if not exists notes text;
alter table public.partner_accounts add column if not exists created_at timestamptz not null default now();
alter table public.partner_accounts add column if not exists updated_at timestamptz not null default now();

create index if not exists partner_interest_created_at_idx on public.partner_interest(created_at desc);
create index if not exists partner_interest_status_idx on public.partner_interest(status);
create index if not exists partner_interest_type_idx on public.partner_interest(interest_type);
create index if not exists partner_interest_assigned_idx on public.partner_interest(assigned_to);
create index if not exists partner_interest_user_idx on public.partner_interest(user_id, created_at desc);
create index if not exists partner_pipeline_events_interest_idx on public.partner_pipeline_events(partner_interest_id, created_at desc);
create index if not exists partner_pipeline_events_type_idx on public.partner_pipeline_events(event_type, created_at desc);
create index if not exists partner_accounts_type_status_idx on public.partner_accounts(account_type, status);
create index if not exists partner_accounts_created_at_idx on public.partner_accounts(created_at desc);

alter table public.partner_interest enable row level security;
alter table public.partner_pipeline_events enable row level security;
alter table public.partner_accounts enable row level security;

revoke all on public.partner_interest from anon, authenticated;
revoke all on public.partner_pipeline_events from anon, authenticated;
revoke all on public.partner_accounts from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant insert on public.partner_interest to anon, authenticated;
grant select on public.partner_interest to authenticated;
grant select, insert, update, delete on public.partner_pipeline_events to authenticated;
grant select, insert, update, delete on public.partner_accounts to authenticated;
grant update on public.partner_interest to authenticated;

drop policy if exists "Public can insert partner interest" on public.partner_interest;
create policy "Public can insert partner interest"
  on public.partner_interest for insert
  to anon, authenticated
  with check (
    status = 'new'
    and assigned_to is null
    and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    and (
      user_id is null
      or user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can read own partner interest" on public.partner_interest;
create policy "Users can read own partner interest"
  on public.partner_interest for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Admins can manage partner interest" on public.partner_interest;
create policy "Admins can manage partner interest"
  on public.partner_interest for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop policy if exists "Admins can manage partner pipeline events" on public.partner_pipeline_events;
create policy "Admins can manage partner pipeline events"
  on public.partner_pipeline_events for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop policy if exists "Admins can manage partner accounts" on public.partner_accounts;
create policy "Admins can manage partner accounts"
  on public.partner_accounts for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop trigger if exists set_partner_interest_updated_at on public.partner_interest;
create trigger set_partner_interest_updated_at
  before update on public.partner_interest
  for each row execute function public.handle_updated_at();

drop trigger if exists set_partner_accounts_updated_at on public.partner_accounts;
create trigger set_partner_accounts_updated_at
  before update on public.partner_accounts
  for each row execute function public.handle_updated_at();
