-- ============================================================
-- RepWatchr Referral and Share Campaign System
-- ============================================================
-- Growth infrastructure for opt-in public-record sharing. This schema tracks
-- referral links, referral conversion events, share campaigns, and reusable
-- share assets. It does not send email, texts, DMs, or mass invites.

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

create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  code text unique not null,
  status text not null default 'active',
  source_context text,
  created_at timestamptz not null default now(),
  constraint referral_codes_code_shape check (code ~ '^[A-Za-z0-9_-]{6,64}$'),
  constraint referral_codes_status_check check (status in ('active', 'paused', 'archived'))
);

alter table public.referral_codes add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.referral_codes add column if not exists anonymous_id text;
alter table public.referral_codes add column if not exists code text;
alter table public.referral_codes add column if not exists status text not null default 'active';
alter table public.referral_codes add column if not exists source_context text;
alter table public.referral_codes add column if not exists created_at timestamptz not null default now();

create table if not exists public.referral_events (
  id uuid primary key default gen_random_uuid(),
  referral_code text references public.referral_codes(code) on delete set null,
  referring_user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  referred_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  route text,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint referral_events_event_type_check check (
    event_type in (
      'visit',
      'signup',
      'source_submission',
      'packet_build',
      'watchlist_add',
      'package_interest',
      'referral_link_created',
      'referral_link_copied',
      'referral_visit',
      'referral_signup',
      'referral_source_submission',
      'referral_packet_created',
      'share_campaign_viewed',
      'share_campaign_clicked',
      'safe_share_text_copied'
    )
  ),
  constraint referral_events_route_shape check (route is null or route like '/%'),
  constraint referral_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

alter table public.referral_events add column if not exists referral_code text references public.referral_codes(code) on delete set null;
alter table public.referral_events add column if not exists referring_user_id uuid references auth.users(id) on delete set null;
alter table public.referral_events add column if not exists anonymous_id text;
alter table public.referral_events add column if not exists referred_user_id uuid references auth.users(id) on delete set null;
alter table public.referral_events add column if not exists event_type text;
alter table public.referral_events add column if not exists route text;
alter table public.referral_events add column if not exists entity_type text;
alter table public.referral_events add column if not exists entity_id text;
alter table public.referral_events add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.referral_events add column if not exists created_at timestamptz not null default now();

create table if not exists public.share_campaigns (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  description text,
  campaign_type text not null,
  status text not null default 'active',
  default_share_text text,
  target_route text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint share_campaigns_type_check check (
    campaign_type in (
      'source_gap',
      'profile_watch',
      'race_watch',
      'county_hub',
      'school_board',
      'public_question',
      'free_packet',
      'records_request',
      'package_interest',
      'contributor_badge'
    )
  ),
  constraint share_campaigns_status_check check (status in ('active', 'paused', 'archived')),
  constraint share_campaigns_key_shape check (key ~ '^[a-z0-9][a-z0-9_-]{2,120}$'),
  constraint share_campaigns_target_route_shape check (target_route is null or target_route like '/%')
);

alter table public.share_campaigns add column if not exists key text;
alter table public.share_campaigns add column if not exists name text;
alter table public.share_campaigns add column if not exists description text;
alter table public.share_campaigns add column if not exists campaign_type text;
alter table public.share_campaigns add column if not exists status text not null default 'active';
alter table public.share_campaigns add column if not exists default_share_text text;
alter table public.share_campaigns add column if not exists target_route text;
alter table public.share_campaigns add column if not exists created_at timestamptz not null default now();
alter table public.share_campaigns add column if not exists updated_at timestamptz not null default now();

create table if not exists public.share_assets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.share_campaigns(id) on delete cascade,
  entity_type text,
  entity_id text,
  asset_type text not null,
  title text,
  copy_text text,
  url text,
  og_image_url text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  constraint share_assets_type_check check (
    asset_type in ('safe_text', 'public_question', 'source_gap', 'packet', 'link_card', 'og_image', 'talking_point')
  ),
  constraint share_assets_status_check check (status in ('active', 'paused', 'archived', 'needs_review')),
  constraint share_assets_url_shape check (url is null or url ~* '^https?://|^/'),
  constraint share_assets_og_url_shape check (og_image_url is null or og_image_url ~* '^https?://|^/')
);

alter table public.share_assets add column if not exists campaign_id uuid references public.share_campaigns(id) on delete cascade;
alter table public.share_assets add column if not exists entity_type text;
alter table public.share_assets add column if not exists entity_id text;
alter table public.share_assets add column if not exists asset_type text;
alter table public.share_assets add column if not exists title text;
alter table public.share_assets add column if not exists copy_text text;
alter table public.share_assets add column if not exists url text;
alter table public.share_assets add column if not exists og_image_url text;
alter table public.share_assets add column if not exists status text not null default 'active';
alter table public.share_assets add column if not exists created_at timestamptz not null default now();

create index if not exists referral_codes_user_idx on public.referral_codes(user_id, created_at desc);
create index if not exists referral_codes_anonymous_idx on public.referral_codes(anonymous_id, created_at desc);
create index if not exists referral_codes_code_status_idx on public.referral_codes(code, status);
create index if not exists referral_events_code_created_idx on public.referral_events(referral_code, created_at desc);
create index if not exists referral_events_type_created_idx on public.referral_events(event_type, created_at desc);
create index if not exists referral_events_route_created_idx on public.referral_events(route, created_at desc);
create index if not exists share_campaigns_type_status_idx on public.share_campaigns(campaign_type, status);
create index if not exists share_assets_campaign_idx on public.share_assets(campaign_id, status, created_at desc);
create index if not exists share_assets_entity_idx on public.share_assets(entity_type, entity_id, status);

alter table public.referral_codes enable row level security;
alter table public.referral_events enable row level security;
alter table public.share_campaigns enable row level security;
alter table public.share_assets enable row level security;

revoke all on public.referral_codes from anon, authenticated;
revoke all on public.referral_events from anon, authenticated;
revoke all on public.share_campaigns from anon, authenticated;
revoke all on public.share_assets from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select, insert on public.referral_codes to anon, authenticated;
grant insert on public.referral_events to anon, authenticated;
grant select on public.referral_events to authenticated;
grant select on public.share_campaigns to anon, authenticated;
grant select on public.share_assets to anon, authenticated;
grant insert, update, delete on public.share_campaigns to authenticated;
grant insert, update, delete on public.share_assets to authenticated;

drop policy if exists "Public can read active referral codes" on public.referral_codes;
create policy "Public can read active referral codes"
  on public.referral_codes for select
  to anon, authenticated
  using (status = 'active');

drop policy if exists "Public can create anonymous referral codes" on public.referral_codes;
create policy "Public can create anonymous referral codes"
  on public.referral_codes for insert
  to anon, authenticated
  with check (
    status = 'active'
    and (
      user_id is null
      or user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can read own referral codes" on public.referral_codes;
create policy "Users can read own referral codes"
  on public.referral_codes for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Admins can manage referral codes" on public.referral_codes;
create policy "Admins can manage referral codes"
  on public.referral_codes for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop policy if exists "Public can insert referral events" on public.referral_events;
create policy "Public can insert referral events"
  on public.referral_events for insert
  to anon, authenticated
  with check (
    event_type in (
      'visit',
      'signup',
      'source_submission',
      'packet_build',
      'watchlist_add',
      'package_interest',
      'referral_link_copied',
      'referral_visit',
      'referral_signup',
      'referral_source_submission',
      'referral_packet_created',
      'share_campaign_viewed',
      'share_campaign_clicked',
      'safe_share_text_copied'
    )
    and (
      referring_user_id is null
      or referring_user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can read own referral events" on public.referral_events;
create policy "Users can read own referral events"
  on public.referral_events for select
  to authenticated
  using (
    referring_user_id = (select auth.uid())
    or referred_user_id = (select auth.uid())
  );

drop policy if exists "Admins can manage referral events" on public.referral_events;
create policy "Admins can manage referral events"
  on public.referral_events for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop policy if exists "Public can read active share campaigns" on public.share_campaigns;
create policy "Public can read active share campaigns"
  on public.share_campaigns for select
  to anon, authenticated
  using (status = 'active');

drop policy if exists "Admins can manage share campaigns" on public.share_campaigns;
create policy "Admins can manage share campaigns"
  on public.share_campaigns for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop policy if exists "Public can read active share assets" on public.share_assets;
create policy "Public can read active share assets"
  on public.share_assets for select
  to anon, authenticated
  using (status = 'active');

drop policy if exists "Admins can manage share assets" on public.share_assets;
create policy "Admins can manage share assets"
  on public.share_assets for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop trigger if exists set_share_campaigns_updated_at on public.share_campaigns;
create trigger set_share_campaigns_updated_at
  before update on public.share_campaigns
  for each row execute function public.handle_updated_at();

insert into public.share_campaigns (key, name, description, campaign_type, default_share_text, target_route)
values
  ('source-gap-default', 'Source gap share', 'Ask people to add one missing public source.', 'source_gap', 'RepWatchr is looking for a public source on this record. Help attach the receipt.', '/submit-source'),
  ('profile-watch-default', 'Profile watch share', 'Invite people to follow public-record updates for an official or public body.', 'profile_watch', 'Watch public-record updates on RepWatchr. Check the source trail and add a better public source if one is missing.', '/officials'),
  ('race-watch-default', 'Race watch share', 'Invite people to follow sourced election updates.', 'race_watch', 'Follow public-record updates for this race on RepWatchr. Keep the filing links, source gaps, and public questions attached.', '/elections'),
  ('public-question-default', 'Public question share', 'Share one cautious public question tied to source context.', 'public_question', 'Public question: which public record answers this? RepWatchr keeps the source context attached.', '/submit-source'),
  ('free-packet-default', 'Free packet share', 'Invite another person to build a source packet.', 'free_packet', 'Build a public source packet on RepWatchr. Put the date, link, summary, and missing proof in one clean place.', '/free-packet'),
  ('correction-default', 'Correction share', 'Invite corrections without turning the share into an attack.', 'source_gap', 'See something wrong on a RepWatchr public profile? Request a correction and attach the better public source.', '/submit-source')
on conflict (key) do nothing;
