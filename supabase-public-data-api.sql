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

create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  description text,
  enabled boolean not null default false,
  rollout_percentage int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  organization_name text null,
  key_hash text not null,
  key_prefix text not null,
  label text null,
  status text not null default 'active',
  scopes jsonb not null default '[]'::jsonb check (jsonb_typeof(scopes) = 'array'),
  rate_limit_per_day int not null default 1000 check (rate_limit_per_day > 0),
  created_at timestamptz default now(),
  last_used_at timestamptz null,
  revoked_at timestamptz null
);

create table if not exists public.api_usage_events (
  id uuid primary key default gen_random_uuid(),
  api_key_id uuid null references public.api_keys(id) on delete set null,
  user_id uuid null,
  endpoint text not null,
  method text not null,
  status_code int null,
  records_returned int not null default 0,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz default now()
);

create table if not exists public.data_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  export_type text not null,
  status text not null default 'pending',
  filters jsonb not null default '{}'::jsonb check (jsonb_typeof(filters) = 'object'),
  file_path text null,
  row_count int null,
  created_at timestamptz default now(),
  completed_at timestamptz null,
  expires_at timestamptz null
);

create table if not exists public.api_access_requests (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text null,
  user_id uuid null,
  email text not null,
  name text null,
  organization text null,
  use_case text null,
  requested_scope text null,
  jurisdiction_focus text null,
  status text not null default 'new',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists api_keys_hash_idx on public.api_keys(key_hash);
create index if not exists api_keys_status_idx on public.api_keys(status);
create index if not exists api_usage_events_key_created_idx on public.api_usage_events(api_key_id, created_at desc);
create index if not exists api_usage_events_endpoint_idx on public.api_usage_events(endpoint);
create index if not exists data_exports_user_status_idx on public.data_exports(user_id, status);
create index if not exists api_access_requests_status_idx on public.api_access_requests(status);
create index if not exists api_access_requests_email_idx on public.api_access_requests(email);

alter table public.api_keys enable row level security;
alter table public.api_usage_events enable row level security;
alter table public.data_exports enable row level security;
alter table public.api_access_requests enable row level security;

grant usage on schema public to anon, authenticated;

revoke all on table public.api_keys from anon, authenticated;
revoke all on table public.api_usage_events from anon, authenticated;
revoke all on table public.data_exports from anon, authenticated;
revoke all on table public.api_access_requests from anon, authenticated;

grant insert on table public.api_access_requests to anon, authenticated;
grant select on table public.api_access_requests to authenticated;
grant select, insert on table public.data_exports to authenticated;

drop policy if exists "public can request api access" on public.api_access_requests;
create policy "public can request api access"
on public.api_access_requests
for insert
to anon, authenticated
with check (email is not null and length(email) <= 254);

drop policy if exists "users can view own api access requests" on public.api_access_requests;
create policy "users can view own api access requests"
on public.api_access_requests
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "users can create own data exports" on public.data_exports;
create policy "users can create own data exports"
on public.data_exports
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "users can view own data exports" on public.data_exports;
create policy "users can view own data exports"
on public.data_exports
for select
to authenticated
using ((select auth.uid()) = user_id);

drop trigger if exists set_api_access_requests_updated_at on public.api_access_requests;
create trigger set_api_access_requests_updated_at
before update on public.api_access_requests
for each row execute function public.handle_updated_at();

insert into public.feature_flags (key, description, enabled, rollout_percentage, metadata)
values (
  'ENABLE_PUBLIC_API',
  'Controls RepWatchr public API responses and API key issuance. Default off until public adapters, billing, and export policies are approved.',
  false,
  0,
  '{"system":"public_data_api"}'::jsonb
)
on conflict (key) do update
set description = excluded.description,
    updated_at = now();
