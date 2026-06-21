-- ============================================================
-- RepWatchr Growth Funnels, Analytics, Partner Interest, Membership
-- ============================================================
-- Run after the base auth/user_roles, source queue, payments, member
-- dashboard, and admin dashboard migrations.
--
-- Supabase projects no longer expose new tables to the Data and GraphQL API
-- automatically. These grants and RLS policies are explicit on purpose.

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

create table if not exists public.email_captures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  source text not null default 'free_packet',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  referrer text,
  landing_page text,
  consent boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint email_captures_email_shape check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

alter table public.email_captures add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.email_captures add column if not exists email text;
alter table public.email_captures add column if not exists source text not null default 'free_packet';
alter table public.email_captures add column if not exists utm_source text;
alter table public.email_captures add column if not exists utm_medium text;
alter table public.email_captures add column if not exists utm_campaign text;
alter table public.email_captures add column if not exists utm_term text;
alter table public.email_captures add column if not exists utm_content text;
alter table public.email_captures add column if not exists referrer text;
alter table public.email_captures add column if not exists landing_page text;
alter table public.email_captures add column if not exists consent boolean not null default false;
alter table public.email_captures add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.email_captures add column if not exists created_at timestamptz not null default now();

create index if not exists email_captures_email_idx on public.email_captures(email);
create index if not exists email_captures_source_idx on public.email_captures(source);
create index if not exists email_captures_created_at_idx on public.email_captures(created_at desc);

create table if not exists public.partner_interest_forms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  organization text,
  interest_type text not null,
  check_size_or_partnership_type text,
  message text,
  status text not null default 'new',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_interest_forms_email_shape check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint partner_interest_forms_status_check check (status in ('new', 'reviewing', 'contacted', 'closed', 'spam'))
);

alter table public.partner_interest_forms add column if not exists name text;
alter table public.partner_interest_forms add column if not exists email text;
alter table public.partner_interest_forms add column if not exists organization text;
alter table public.partner_interest_forms add column if not exists interest_type text;
alter table public.partner_interest_forms add column if not exists check_size_or_partnership_type text;
alter table public.partner_interest_forms add column if not exists message text;
alter table public.partner_interest_forms add column if not exists status text not null default 'new';
alter table public.partner_interest_forms add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.partner_interest_forms add column if not exists created_at timestamptz not null default now();
alter table public.partner_interest_forms add column if not exists updated_at timestamptz not null default now();

create index if not exists partner_interest_forms_status_idx on public.partner_interest_forms(status);
create index if not exists partner_interest_forms_created_at_idx on public.partner_interest_forms(created_at desc);

create table if not exists public.site_analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  user_id uuid references auth.users(id) on delete set null,
  anonymous_session_id text,
  route text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  device_kind text,
  browser_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint site_analytics_events_route_check check (
    route is null
    or (
      route like '/%'
      and route not like '/api%'
      and route not like '/admin%'
      and route not like '/dashboard%'
      and route not like '/auth%'
    )
  ),
  constraint site_analytics_events_name_check check (
    event_name in (
      'page_view',
      'profile_open',
      'official_search',
      'filter_used',
      'source_submit_started',
      'source_submit_completed',
      'share_copy_clicked',
      'native_share_clicked',
      'social_share_clicked',
      'source_snippet_copied',
      'profile_watch_clicked',
      'watchlist_add',
      'signup_started',
      'signup_completed',
      'login',
      'checkout_started',
      'checkout_completed',
      'checkout_canceled',
      'service_request_submitted',
      'subscription_started',
      'article_open',
      'daily_wire_item_open',
      'admin_review_completed',
      'public_records_request_created',
      'free_packet_started',
      'free_packet_completed',
      'email_captured',
      'account_prompt_clicked',
      'upsell_clicked'
    )
  )
);

alter table public.site_analytics_events add column if not exists event_name text;
alter table public.site_analytics_events add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.site_analytics_events add column if not exists anonymous_session_id text;
alter table public.site_analytics_events add column if not exists route text;
alter table public.site_analytics_events add column if not exists referrer text;
alter table public.site_analytics_events add column if not exists utm_source text;
alter table public.site_analytics_events add column if not exists utm_medium text;
alter table public.site_analytics_events add column if not exists utm_campaign text;
alter table public.site_analytics_events add column if not exists utm_term text;
alter table public.site_analytics_events add column if not exists utm_content text;
alter table public.site_analytics_events add column if not exists device_kind text;
alter table public.site_analytics_events add column if not exists browser_name text;
alter table public.site_analytics_events add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.site_analytics_events add column if not exists created_at timestamptz not null default now();

create index if not exists site_analytics_events_event_name_idx on public.site_analytics_events(event_name);
create index if not exists site_analytics_events_route_idx on public.site_analytics_events(route);
create index if not exists site_analytics_events_user_id_idx on public.site_analytics_events(user_id);
create index if not exists site_analytics_events_created_at_idx on public.site_analytics_events(created_at desc);

create table if not exists public.member_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tier text not null default 'free_founder',
  status text not null default 'active',
  source text not null default 'founder_access',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_memberships_user_unique unique (user_id),
  constraint member_memberships_tier_check check (tier in ('free_founder', 'watcher_pro', 'research_desk')),
  constraint member_memberships_status_check check (status in ('active', 'trialing', 'past_due', 'canceled', 'paused'))
);

alter table public.member_memberships add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.member_memberships add column if not exists tier text not null default 'free_founder';
alter table public.member_memberships add column if not exists status text not null default 'active';
alter table public.member_memberships add column if not exists source text not null default 'founder_access';
alter table public.member_memberships add column if not exists stripe_customer_id text;
alter table public.member_memberships add column if not exists stripe_subscription_id text;
alter table public.member_memberships add column if not exists current_period_end timestamptz;
alter table public.member_memberships add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.member_memberships add column if not exists created_at timestamptz not null default now();
alter table public.member_memberships add column if not exists updated_at timestamptz not null default now();

create unique index if not exists member_memberships_user_id_idx on public.member_memberships(user_id);
create index if not exists member_memberships_tier_idx on public.member_memberships(tier);
create index if not exists member_memberships_status_idx on public.member_memberships(status);

alter table public.email_captures enable row level security;
alter table public.partner_interest_forms enable row level security;
alter table public.site_analytics_events enable row level security;
alter table public.member_memberships enable row level security;

grant usage on schema public to anon, authenticated;
grant insert on public.email_captures to anon, authenticated;
grant insert on public.partner_interest_forms to anon, authenticated;
grant insert on public.site_analytics_events to anon, authenticated;
grant select, insert, update, delete on public.email_captures to authenticated;
grant select, insert, update, delete on public.partner_interest_forms to authenticated;
grant select, insert, update, delete on public.site_analytics_events to authenticated;
grant select, insert, update, delete on public.member_memberships to authenticated;

drop policy if exists "Public can insert consenting email captures" on public.email_captures;
create policy "Public can insert consenting email captures"
  on public.email_captures for insert
  to anon, authenticated
  with check (
    consent = true
    and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    and (
      (auth.uid() is null and user_id is null)
      or user_id = auth.uid()
    )
  );

drop policy if exists "Users can read own email captures" on public.email_captures;
create policy "Users can read own email captures"
  on public.email_captures for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Admins can manage email captures" on public.email_captures;
create policy "Admins can manage email captures"
  on public.email_captures for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop policy if exists "Public can insert partner interest" on public.partner_interest_forms;
create policy "Public can insert partner interest"
  on public.partner_interest_forms for insert
  to anon, authenticated
  with check (
    status = 'new'
    and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  );

drop policy if exists "Admins can manage partner interest" on public.partner_interest_forms;
create policy "Admins can manage partner interest"
  on public.partner_interest_forms for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop policy if exists "Public can insert analytics events" on public.site_analytics_events;
create policy "Public can insert analytics events"
  on public.site_analytics_events for insert
  to anon, authenticated
  with check (
    event_name in (
      'page_view',
      'profile_open',
      'official_search',
      'filter_used',
      'source_submit_started',
      'source_submit_completed',
      'share_copy_clicked',
      'native_share_clicked',
      'social_share_clicked',
      'source_snippet_copied',
      'profile_watch_clicked',
      'watchlist_add',
      'signup_started',
      'signup_completed',
      'login',
      'checkout_started',
      'checkout_completed',
      'checkout_canceled',
      'service_request_submitted',
      'subscription_started',
      'article_open',
      'daily_wire_item_open',
      'admin_review_completed',
      'public_records_request_created',
      'free_packet_started',
      'free_packet_completed',
      'email_captured',
      'account_prompt_clicked',
      'upsell_clicked'
    )
    and (
      route is null
      or (
        route like '/%'
        and route not like '/api%'
        and route not like '/admin%'
        and route not like '/dashboard%'
        and route not like '/auth%'
      )
    )
    and (
      user_id is null
      or user_id = auth.uid()
    )
  );

drop policy if exists "Admins can read analytics events" on public.site_analytics_events;
create policy "Admins can read analytics events"
  on public.site_analytics_events for select
  to authenticated
  using (private.is_repw_admin());

drop policy if exists "Admins can manage analytics events" on public.site_analytics_events;
create policy "Admins can manage analytics events"
  on public.site_analytics_events for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop policy if exists "Users can read own membership" on public.member_memberships;
create policy "Users can read own membership"
  on public.member_memberships for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can insert own founder membership" on public.member_memberships;
create policy "Users can insert own founder membership"
  on public.member_memberships for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and tier = 'free_founder'
    and status = 'active'
  );

drop policy if exists "Admins can manage memberships" on public.member_memberships;
create policy "Admins can manage memberships"
  on public.member_memberships for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop trigger if exists set_partner_interest_forms_updated_at on public.partner_interest_forms;
create trigger set_partner_interest_forms_updated_at
  before update on public.partner_interest_forms
  for each row execute function public.handle_updated_at();

drop trigger if exists set_member_memberships_updated_at on public.member_memberships;
create trigger set_member_memberships_updated_at
  before update on public.member_memberships
  for each row execute function public.handle_updated_at();
