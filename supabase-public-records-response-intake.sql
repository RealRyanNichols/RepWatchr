-- ============================================================
-- RepWatchr Public Records Response Intake
-- ============================================================
-- Private-by-default workflow for records responses, uploaded documents,
-- admin review, source-packet creation, and controlled public summaries.

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

create table if not exists public.records_responses (
  id uuid primary key default gen_random_uuid(),
  records_request_id uuid,
  anonymous_id text,
  user_id uuid references auth.users(id) on delete set null,
  response_title text,
  agency_name text,
  jurisdiction text,
  response_type text,
  response_date date,
  response_url text,
  response_text text,
  status text not null default 'new',
  sensitivity_status text not null default 'needs_review',
  public_summary text,
  attribution jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint records_responses_response_type_check check (
    response_type is null or response_type in (
      'fulfilled',
      'partially_fulfilled',
      'denied',
      'clarification_requested',
      'no_records',
      'fee_estimate',
      'extension_notice',
      'other'
    )
  ),
  constraint records_responses_status_check check (
    status in (
      'new',
      'needs_review',
      'saved_private',
      'reviewed',
      'converted_to_packet',
      'attached_to_profile',
      'attached_to_story',
      'attached_to_timeline',
      'rejected',
      'archived'
    )
  ),
  constraint records_responses_sensitivity_status_check check (
    sensitivity_status in (
      'needs_review',
      'safe_public_record',
      'contains_private_info',
      'redaction_needed',
      'do_not_publish',
      'published_summary_only'
    )
  ),
  constraint records_responses_response_url_check check (response_url is null or response_url ~* '^https?://'),
  constraint records_responses_agency_required check (char_length(coalesce(agency_name, '')) > 0),
  constraint records_responses_no_public_summary_on_public_insert check (
    public_summary is null or sensitivity_status in ('safe_public_record', 'published_summary_only')
  )
);

alter table public.records_responses add column if not exists records_request_id uuid;
alter table public.records_responses add column if not exists anonymous_id text;
alter table public.records_responses add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.records_responses add column if not exists response_title text;
alter table public.records_responses add column if not exists agency_name text;
alter table public.records_responses add column if not exists jurisdiction text;
alter table public.records_responses add column if not exists response_type text;
alter table public.records_responses add column if not exists response_date date;
alter table public.records_responses add column if not exists response_url text;
alter table public.records_responses add column if not exists response_text text;
alter table public.records_responses add column if not exists status text not null default 'new';
alter table public.records_responses add column if not exists sensitivity_status text not null default 'needs_review';
alter table public.records_responses add column if not exists public_summary text;
alter table public.records_responses add column if not exists attribution jsonb not null default '{}'::jsonb;
alter table public.records_responses add column if not exists created_at timestamptz not null default now();
alter table public.records_responses add column if not exists updated_at timestamptz not null default now();

create table if not exists public.records_response_files (
  id uuid primary key default gen_random_uuid(),
  records_response_id uuid not null references public.records_responses(id) on delete cascade,
  storage_path text,
  file_name text not null,
  mime_type text,
  file_size int,
  page_count int,
  extracted_text text,
  extraction_status text not null default 'not_started',
  sensitivity_flags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint records_response_files_extraction_status_check check (
    extraction_status in ('not_started', 'metadata_only', 'text_extracted', 'failed', 'upload_failed')
  ),
  constraint records_response_files_sensitivity_flags_array check (jsonb_typeof(sensitivity_flags) = 'array')
);

alter table public.records_response_files add column if not exists records_response_id uuid references public.records_responses(id) on delete cascade;
alter table public.records_response_files add column if not exists storage_path text;
alter table public.records_response_files add column if not exists file_name text;
alter table public.records_response_files add column if not exists mime_type text;
alter table public.records_response_files add column if not exists file_size int;
alter table public.records_response_files add column if not exists page_count int;
alter table public.records_response_files add column if not exists extracted_text text;
alter table public.records_response_files add column if not exists extraction_status text not null default 'not_started';
alter table public.records_response_files add column if not exists sensitivity_flags jsonb not null default '[]'::jsonb;
alter table public.records_response_files add column if not exists created_at timestamptz not null default now();

create table if not exists public.records_response_events (
  id uuid primary key default gen_random_uuid(),
  records_response_id uuid not null references public.records_responses(id) on delete cascade,
  event_type text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.records_response_events add column if not exists records_response_id uuid references public.records_responses(id) on delete cascade;
alter table public.records_response_events add column if not exists event_type text;
alter table public.records_response_events add column if not exists actor_user_id uuid references auth.users(id) on delete set null;
alter table public.records_response_events add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.records_response_events add column if not exists created_at timestamptz not null default now();

create index if not exists records_responses_user_created_idx on public.records_responses(user_id, created_at desc);
create index if not exists records_responses_status_idx on public.records_responses(status, sensitivity_status, created_at desc);
create index if not exists records_responses_response_type_idx on public.records_responses(response_type);
create index if not exists records_responses_records_request_idx on public.records_responses(records_request_id);
create index if not exists records_response_files_response_idx on public.records_response_files(records_response_id, created_at desc);
create index if not exists records_response_events_response_idx on public.records_response_events(records_response_id, created_at desc);

alter table public.records_responses enable row level security;
alter table public.records_response_files enable row level security;
alter table public.records_response_events enable row level security;

revoke all on public.records_responses from anon, authenticated;
revoke all on public.records_response_files from anon, authenticated;
revoke all on public.records_response_events from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant insert on public.records_responses to anon;
grant select, insert on public.records_responses to authenticated;
grant update on public.records_responses to authenticated;
grant select, insert on public.records_response_files to authenticated;
grant select, insert on public.records_response_events to authenticated;

drop policy if exists "Public may create private records responses" on public.records_responses;
create policy "Public may create private records responses"
  on public.records_responses for insert
  to anon, authenticated
  with check (
    public_summary is null
    and status in ('new', 'saved_private')
    and sensitivity_status in ('needs_review', 'contains_private_info', 'redaction_needed', 'do_not_publish')
    and (user_id is null or auth.uid() = user_id)
  );

drop policy if exists "Users can read own records responses" on public.records_responses;
create policy "Users can read own records responses"
  on public.records_responses for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Admins can manage all records responses" on public.records_responses;
create policy "Admins can manage all records responses"
  on public.records_responses for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop policy if exists "Users can read own records response files" on public.records_response_files;
create policy "Users can read own records response files"
  on public.records_response_files for select
  to authenticated
  using (
    exists (
      select 1
      from public.records_responses rr
      where rr.id = records_response_id
        and rr.user_id = auth.uid()
    )
  );

drop policy if exists "Admins can manage records response files" on public.records_response_files;
create policy "Admins can manage records response files"
  on public.records_response_files for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop policy if exists "Users can read own records response events" on public.records_response_events;
create policy "Users can read own records response events"
  on public.records_response_events for select
  to authenticated
  using (
    exists (
      select 1
      from public.records_responses rr
      where rr.id = records_response_id
        and rr.user_id = auth.uid()
    )
  );

drop policy if exists "Admins can manage records response events" on public.records_response_events;
create policy "Admins can manage records response events"
  on public.records_response_events for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop trigger if exists set_records_responses_updated_at on public.records_responses;
create trigger set_records_responses_updated_at
  before update on public.records_responses
  for each row execute function public.handle_updated_at();

insert into storage.buckets (id, name, public)
values ('records-response-private', 'records-response-private', false)
on conflict (id) do nothing;

drop policy if exists "Users can read own records response storage" on storage.objects;
drop policy if exists "Users can upload own records response storage" on storage.objects;
drop policy if exists "Admins can manage records response storage" on storage.objects;

create policy "Users can upload own records response storage"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'records-response-private'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own records response storage"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'records-response-private'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Admins can manage records response storage"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'records-response-private' and private.is_repw_admin())
  with check (bucket_id = 'records-response-private' and private.is_repw_admin());
