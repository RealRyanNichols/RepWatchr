-- RepWatchr trust, safety, privacy, and correction infrastructure.
-- Apply in Supabase SQL editor after reviewing against the current project.

create extension if not exists "pgcrypto";

create or replace function public.set_repw_trust_safety_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_repw_trust_safety_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'
  )
  or coalesce(
    (
      coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb)
      -> 'app_metadata'
      ->> 'role'
    ),
    ''
  ) = 'admin';
$$;

revoke all on function public.is_repw_trust_safety_admin() from public;
grant execute on function public.is_repw_trust_safety_admin() to authenticated;

create table if not exists public.correction_requests (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text,
  user_id uuid,
  submitter_name text,
  submitter_email text,
  entity_type text not null,
  entity_id text not null,
  url text,
  correction_type text not null,
  current_text text,
  requested_correction text not null,
  source_url text,
  explanation text,
  status text default 'new',
  priority text default 'normal',
  assigned_to uuid,
  admin_resolution text,
  attribution jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint correction_requests_status_check check (
    status in (
      'new',
      'needs_review',
      'approved',
      'rejected',
      'needs_more_info',
      'attached_source',
      'entity_updated',
      'resolved',
      'archived'
    )
  ),
  constraint correction_requests_priority_check check (priority in ('low', 'normal', 'high', 'urgent')),
  constraint correction_requests_type_check check (
    correction_type in (
      'wrong official',
      'wrong office',
      'wrong party',
      'wrong jurisdiction',
      'wrong date',
      'broken source',
      'outdated record',
      'missing context',
      'unsafe/private information',
      'unsourced claim',
      'duplicate profile',
      'legal/privacy concern',
      'other'
    )
  )
);

drop trigger if exists correction_requests_set_updated_at on public.correction_requests;
create trigger correction_requests_set_updated_at
before update on public.correction_requests
for each row execute function public.set_repw_trust_safety_updated_at();

create index if not exists correction_requests_status_idx on public.correction_requests(status);
create index if not exists correction_requests_entity_idx on public.correction_requests(entity_type, entity_id);
create index if not exists correction_requests_created_at_idx on public.correction_requests(created_at desc);
create index if not exists correction_requests_user_idx on public.correction_requests(user_id);

alter table public.correction_requests enable row level security;

grant insert on public.correction_requests to anon, authenticated;
grant select, update on public.correction_requests to authenticated;
grant all on public.correction_requests to service_role;

drop policy if exists "correction requests public insert" on public.correction_requests;
create policy "correction requests public insert"
on public.correction_requests
for insert
to anon, authenticated
with check (true);

drop policy if exists "correction requests owner select" on public.correction_requests;
create policy "correction requests owner select"
on public.correction_requests
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "correction requests admin select" on public.correction_requests;
create policy "correction requests admin select"
on public.correction_requests
for select
to authenticated
using (public.is_repw_trust_safety_admin());

drop policy if exists "correction requests admin update" on public.correction_requests;
create policy "correction requests admin update"
on public.correction_requests
for update
to authenticated
using (public.is_repw_trust_safety_admin())
with check (public.is_repw_trust_safety_admin());

create table if not exists public.correction_events (
  id uuid primary key default gen_random_uuid(),
  correction_request_id uuid not null references public.correction_requests(id) on delete cascade,
  event_type text not null,
  actor_user_id uuid,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists correction_events_request_idx on public.correction_events(correction_request_id, created_at desc);
create index if not exists correction_events_actor_idx on public.correction_events(actor_user_id);

alter table public.correction_events enable row level security;

grant select on public.correction_events to authenticated;
grant insert on public.correction_events to authenticated;
grant all on public.correction_events to service_role;

drop policy if exists "correction events owner select" on public.correction_events;
create policy "correction events owner select"
on public.correction_events
for select
to authenticated
using (
  exists (
    select 1
    from public.correction_requests cr
    where cr.id = correction_events.correction_request_id
      and cr.user_id = auth.uid()
  )
);

drop policy if exists "correction events admin select" on public.correction_events;
create policy "correction events admin select"
on public.correction_events
for select
to authenticated
using (public.is_repw_trust_safety_admin());

drop policy if exists "correction events admin insert" on public.correction_events;
create policy "correction events admin insert"
on public.correction_events
for insert
to authenticated
with check (public.is_repw_trust_safety_admin());

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text,
  request_type text not null,
  status text default 'new',
  message text,
  admin_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint privacy_requests_type_check check (
    request_type in (
      'access',
      'correction',
      'deletion',
      'opt_out',
      'question',
      'account_deletion',
      'contributor_profile_removal'
    )
  ),
  constraint privacy_requests_status_check check (
    status in ('new', 'needs_review', 'in_progress', 'completed', 'rejected', 'needs_more_info', 'archived')
  )
);

drop trigger if exists privacy_requests_set_updated_at on public.privacy_requests;
create trigger privacy_requests_set_updated_at
before update on public.privacy_requests
for each row execute function public.set_repw_trust_safety_updated_at();

create index if not exists privacy_requests_status_idx on public.privacy_requests(status);
create index if not exists privacy_requests_user_idx on public.privacy_requests(user_id);
create index if not exists privacy_requests_created_at_idx on public.privacy_requests(created_at desc);

alter table public.privacy_requests enable row level security;

grant insert on public.privacy_requests to anon, authenticated;
grant select, update on public.privacy_requests to authenticated;
grant all on public.privacy_requests to service_role;

drop policy if exists "privacy requests public insert" on public.privacy_requests;
create policy "privacy requests public insert"
on public.privacy_requests
for insert
to anon, authenticated
with check (true);

drop policy if exists "privacy requests owner select" on public.privacy_requests;
create policy "privacy requests owner select"
on public.privacy_requests
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "privacy requests admin select" on public.privacy_requests;
create policy "privacy requests admin select"
on public.privacy_requests
for select
to authenticated
using (public.is_repw_trust_safety_admin());

drop policy if exists "privacy requests admin update" on public.privacy_requests;
create policy "privacy requests admin update"
on public.privacy_requests
for update
to authenticated
using (public.is_repw_trust_safety_admin())
with check (public.is_repw_trust_safety_admin());
