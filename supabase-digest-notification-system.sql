-- ============================================================
-- RepWatchr Digest and Notification Queue
-- ============================================================
-- Consent-first email digest infrastructure. This creates preferences,
-- queue rows, queue items, and notification events. It does not send email
-- by itself; application code must also require ENABLE_EMAIL_SENDING=true.

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
set search_path = public
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

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  email text,
  weekly_digest boolean not null default true,
  daily_digest boolean not null default false,
  breaking_alerts boolean not null default false,
  watched_official_updates boolean not null default true,
  watched_race_updates boolean not null default true,
  watched_jurisdiction_updates boolean not null default true,
  source_review_updates boolean not null default true,
  contribution_updates boolean not null default true,
  package_updates boolean not null default false,
  records_request_updates boolean not null default true,
  email_consent_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_preferences_email_format check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

alter table public.notification_preferences add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.notification_preferences add column if not exists email text;
alter table public.notification_preferences add column if not exists weekly_digest boolean not null default true;
alter table public.notification_preferences add column if not exists daily_digest boolean not null default false;
alter table public.notification_preferences add column if not exists breaking_alerts boolean not null default false;
alter table public.notification_preferences add column if not exists watched_official_updates boolean not null default true;
alter table public.notification_preferences add column if not exists watched_race_updates boolean not null default true;
alter table public.notification_preferences add column if not exists watched_jurisdiction_updates boolean not null default true;
alter table public.notification_preferences add column if not exists source_review_updates boolean not null default true;
alter table public.notification_preferences add column if not exists contribution_updates boolean not null default true;
alter table public.notification_preferences add column if not exists package_updates boolean not null default false;
alter table public.notification_preferences add column if not exists records_request_updates boolean not null default true;
alter table public.notification_preferences add column if not exists email_consent_at timestamptz;
alter table public.notification_preferences add column if not exists unsubscribed_at timestamptz;
alter table public.notification_preferences add column if not exists created_at timestamptz not null default now();
alter table public.notification_preferences add column if not exists updated_at timestamptz not null default now();

create table if not exists public.digest_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  digest_type text not null,
  subject text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  scheduled_for timestamptz,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint digest_queue_digest_type_check check (
    digest_type in (
      'weekly_watchlist',
      'daily_watchlist',
      'source_review_update',
      'records_request_update',
      'contribution_update',
      'race_update',
      'jurisdiction_update',
      'package_update',
      'admin_test'
    )
  ),
  constraint digest_queue_status_check check (status in ('pending', 'queued', 'sending_disabled', 'sent', 'failed', 'canceled'))
);

alter table public.digest_queue add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.digest_queue add column if not exists digest_type text;
alter table public.digest_queue add column if not exists subject text;
alter table public.digest_queue add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.digest_queue add column if not exists status text not null default 'pending';
alter table public.digest_queue add column if not exists scheduled_for timestamptz;
alter table public.digest_queue add column if not exists sent_at timestamptz;
alter table public.digest_queue add column if not exists error_message text;
alter table public.digest_queue add column if not exists created_at timestamptz not null default now();
alter table public.digest_queue add column if not exists updated_at timestamptz not null default now();

create table if not exists public.digest_items (
  id uuid primary key default gen_random_uuid(),
  digest_queue_id uuid not null references public.digest_queue(id) on delete cascade,
  entity_type text,
  entity_id text,
  title text not null,
  summary text,
  url text,
  priority int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.digest_items add column if not exists digest_queue_id uuid references public.digest_queue(id) on delete cascade;
alter table public.digest_items add column if not exists entity_type text;
alter table public.digest_items add column if not exists entity_id text;
alter table public.digest_items add column if not exists title text;
alter table public.digest_items add column if not exists summary text;
alter table public.digest_items add column if not exists url text;
alter table public.digest_items add column if not exists priority int not null default 0;
alter table public.digest_items add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.digest_items add column if not exists created_at timestamptz not null default now();

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  digest_queue_id uuid references public.digest_queue(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.notification_events add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.notification_events add column if not exists digest_queue_id uuid references public.digest_queue(id) on delete set null;
alter table public.notification_events add column if not exists event_type text;
alter table public.notification_events add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.notification_events add column if not exists created_at timestamptz not null default now();

create index if not exists notification_preferences_user_idx on public.notification_preferences(user_id);
create index if not exists digest_queue_user_status_idx on public.digest_queue(user_id, status, created_at desc);
create index if not exists digest_queue_scheduled_idx on public.digest_queue(status, scheduled_for);
create index if not exists digest_items_queue_priority_idx on public.digest_items(digest_queue_id, priority desc);
create index if not exists notification_events_user_created_idx on public.notification_events(user_id, created_at desc);
create index if not exists notification_events_digest_idx on public.notification_events(digest_queue_id, created_at desc);

alter table public.notification_preferences enable row level security;
alter table public.digest_queue enable row level security;
alter table public.digest_items enable row level security;
alter table public.notification_events enable row level security;

revoke all on public.notification_preferences from anon, authenticated;
revoke all on public.digest_queue from anon, authenticated;
revoke all on public.digest_items from anon, authenticated;
revoke all on public.notification_events from anon, authenticated;

grant usage on schema public to authenticated;
grant select, insert, update on public.notification_preferences to authenticated;
grant select on public.digest_queue to authenticated;
grant select on public.digest_items to authenticated;
grant select on public.notification_events to authenticated;

drop policy if exists "Users can read own notification preferences" on public.notification_preferences;
create policy "Users can read own notification preferences"
  on public.notification_preferences for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own notification preferences" on public.notification_preferences;
create policy "Users can insert own notification preferences"
  on public.notification_preferences for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own notification preferences" on public.notification_preferences;
create policy "Users can update own notification preferences"
  on public.notification_preferences for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Admins can manage notification preferences" on public.notification_preferences;
create policy "Admins can manage notification preferences"
  on public.notification_preferences for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop policy if exists "Users can read own digest queue" on public.digest_queue;
create policy "Users can read own digest queue"
  on public.digest_queue for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Admins can manage digest queue" on public.digest_queue;
create policy "Admins can manage digest queue"
  on public.digest_queue for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop policy if exists "Users can read own digest items" on public.digest_items;
create policy "Users can read own digest items"
  on public.digest_items for select
  to authenticated
  using (
    exists (
      select 1
      from public.digest_queue dq
      where dq.id = digest_queue_id
        and dq.user_id = (select auth.uid())
    )
  );

drop policy if exists "Admins can manage digest items" on public.digest_items;
create policy "Admins can manage digest items"
  on public.digest_items for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop policy if exists "Users can read own notification events" on public.notification_events;
create policy "Users can read own notification events"
  on public.notification_events for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Admins can manage notification events" on public.notification_events;
create policy "Admins can manage notification events"
  on public.notification_events for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop trigger if exists set_notification_preferences_updated_at on public.notification_preferences;
create trigger set_notification_preferences_updated_at
  before update on public.notification_preferences
  for each row execute function public.handle_updated_at();

drop trigger if exists set_digest_queue_updated_at on public.digest_queue;
create trigger set_digest_queue_updated_at
  before update on public.digest_queue
  for each row execute function public.handle_updated_at();
