-- RepWatchr automated QA, monitoring, and error-log foundation.
-- Apply in Supabase SQL editor or a migration after review.

create extension if not exists pgcrypto;

create table if not exists public.app_error_logs (
  id uuid primary key default gen_random_uuid(),
  error_type text,
  message text not null,
  stack text,
  route text,
  user_id uuid,
  anonymous_id text,
  severity text not null default 'error' check (severity in ('debug', 'info', 'warn', 'error', 'critical')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists app_error_logs_created_at_idx on public.app_error_logs (created_at desc);
create index if not exists app_error_logs_severity_created_at_idx on public.app_error_logs (severity, created_at desc);
create index if not exists app_error_logs_route_idx on public.app_error_logs (route);
create index if not exists app_error_logs_user_id_idx on public.app_error_logs (user_id);
create index if not exists app_error_logs_anonymous_id_idx on public.app_error_logs (anonymous_id);

alter table public.app_error_logs enable row level security;

revoke all on table public.app_error_logs from anon;
revoke all on table public.app_error_logs from authenticated;

comment on table public.app_error_logs is 'Sanitized application error logs for RepWatchr admin quality monitoring. Public clients submit through /api/quality/error only.';
comment on column public.app_error_logs.stack is 'Sanitized stack trace. Do not store raw form payloads, private submissions, private documents, or secret values.';
comment on column public.app_error_logs.metadata is 'Small sanitized metadata only. No private addresses, minors, evidence contents, secrets, or raw payloads.';
