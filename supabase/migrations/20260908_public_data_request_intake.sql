-- Restore the existing request form's private write path. Does not enable the
-- public API, issue keys, create exports, or activate billing.
begin;
create schema if not exists private;

create table if not exists public.api_access_requests (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text check (char_length(anonymous_id) <= 120),
  user_id uuid references auth.users(id) on delete set null,
  email text not null check (char_length(email) <= 254 and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  name text check (char_length(name) <= 255),
  organization text check (char_length(organization) <= 255),
  use_case text not null check (char_length(trim(use_case)) between 20 and 3000),
  requested_scope text not null check (requested_scope in (
    'public_profiles_read','public_sources_read','public_jurisdictions_read',
    'public_races_read','public_stories_read','public_questions_read',
    'aggregate_trends_read','exports_create'
  )),
  jurisdiction_focus text not null check (char_length(trim(jurisdiction_focus)) between 1 and 500),
  status text not null default 'new' check (status in ('new','reviewed','approved','denied','waitlist','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (nullif(trim(name),'') is not null or nullif(trim(organization),'') is not null)
);

create table if not exists public.api_usage_events (
  id uuid primary key default gen_random_uuid(),
  -- API keys are not launched. The request route logs null here; adding a
  -- foreign key belongs to a later, reviewed key-management migration.
  api_key_id uuid,
  user_id uuid references auth.users(id) on delete set null,
  endpoint text not null check (char_length(endpoint) between 1 and 500),
  method text not null check (method ~ '^[A-Z]{3,20}$'),
  status_code integer check (status_code between 100 and 599),
  records_returned integer not null default 0 check (records_returned >= 0),
  metadata jsonb not null default '{}' check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists api_access_requests_status_created_idx on public.api_access_requests(status,created_at desc);
create index if not exists api_usage_events_endpoint_created_idx on public.api_usage_events(endpoint,created_at desc);

alter table public.api_access_requests enable row level security;
alter table public.api_access_requests force row level security;
alter table public.api_usage_events enable row level security;
alter table public.api_usage_events force row level security;
revoke all on public.api_access_requests, public.api_usage_events from public, anon, authenticated, service_role;
grant select, insert, update, delete on public.api_access_requests, public.api_usage_events to service_role;
-- No public/member RLS policies: the request route and authenticated admin
-- routes validate input/authority before using their server-only client.

create or replace function private.touch_api_access_request()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.touch_api_access_request() from public, anon, authenticated;
drop trigger if exists set_api_access_requests_updated_at on public.api_access_requests;
create trigger set_api_access_requests_updated_at before update on public.api_access_requests
  for each row execute function private.touch_api_access_request();

comment on table public.api_access_requests is 'Private requests for public-data access or a data package. Contains contact/use-case information; server/admin workflow only. A request is not an approved API key or a purchase.';
comment on table public.api_usage_events is 'Private server-side API/request operational events. Do not include request messages, contact values, secrets, or identity evidence in metadata.';
commit;
