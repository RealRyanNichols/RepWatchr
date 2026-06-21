-- ============================================================
-- RepWatchr Source Submission Queue
-- ============================================================
-- Run in the Supabase SQL Editor after the base auth/user_roles schema.
-- These tables are private review records. Public users may insert source
-- submissions, signed-in users may read their own rows, and admins may manage
-- review/status workflow.

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

do $$
begin
  if not exists (select 1 from pg_type where typname = 'source_submission_status') then
    create type public.source_submission_status as enum (
      'new',
      'needs_review',
      'verified',
      'rejected',
      'attached_to_profile',
      'needs_more_info'
    );
  end if;
end $$;

create table if not exists public.source_submissions (
  id uuid primary key default gen_random_uuid(),
  submitter_user_id uuid references auth.users(id) on delete set null,
  submitter_name text,
  submitter_email text,
  target_name text not null,
  target_type text,
  target_profile_id text,
  target_page_url text,
  jurisdiction text,
  source_url text,
  source_type text not null default 'source_link',
  source_title text,
  source_date date,
  claim_summary text not null,
  check_request text,
  public_flag boolean not null default false,
  status public.source_submission_status not null default 'new',
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  referrer text,
  landing_page text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint source_submissions_submitter_email_shape check (
    submitter_email is null
    or submitter_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  constraint source_submissions_source_url_shape check (
    source_url is null
    or source_url ~* '^https?://'
  )
);

alter table public.source_submissions add column if not exists submitter_user_id uuid references auth.users(id) on delete set null;
alter table public.source_submissions add column if not exists submitter_name text;
alter table public.source_submissions add column if not exists submitter_email text;
alter table public.source_submissions add column if not exists target_name text;
alter table public.source_submissions add column if not exists target_type text;
alter table public.source_submissions add column if not exists target_profile_id text;
alter table public.source_submissions add column if not exists target_page_url text;
alter table public.source_submissions add column if not exists jurisdiction text;
alter table public.source_submissions add column if not exists source_url text;
alter table public.source_submissions add column if not exists source_type text not null default 'source_link';
alter table public.source_submissions add column if not exists source_title text;
alter table public.source_submissions add column if not exists source_date date;
alter table public.source_submissions add column if not exists claim_summary text;
alter table public.source_submissions add column if not exists check_request text;
alter table public.source_submissions add column if not exists public_flag boolean not null default false;
alter table public.source_submissions add column if not exists status public.source_submission_status not null default 'new';
alter table public.source_submissions add column if not exists reviewer_id uuid references auth.users(id) on delete set null;
alter table public.source_submissions add column if not exists reviewed_at timestamptz;
alter table public.source_submissions add column if not exists referrer text;
alter table public.source_submissions add column if not exists landing_page text;
alter table public.source_submissions add column if not exists utm_source text;
alter table public.source_submissions add column if not exists utm_medium text;
alter table public.source_submissions add column if not exists utm_campaign text;
alter table public.source_submissions add column if not exists utm_term text;
alter table public.source_submissions add column if not exists utm_content text;
alter table public.source_submissions add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.source_submissions add column if not exists created_at timestamptz not null default now();
alter table public.source_submissions add column if not exists updated_at timestamptz not null default now();

create index if not exists source_submissions_status_idx on public.source_submissions(status);
create index if not exists source_submissions_created_at_idx on public.source_submissions(created_at desc);
create index if not exists source_submissions_submitter_user_id_idx on public.source_submissions(submitter_user_id);
create index if not exists source_submissions_target_profile_id_idx on public.source_submissions(target_profile_id);
create index if not exists source_submissions_source_type_idx on public.source_submissions(source_type);

create table if not exists public.source_submission_events (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.source_submissions(id) on delete cascade,
  event_type text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists source_submission_events_submission_id_idx on public.source_submission_events(submission_id);
create index if not exists source_submission_events_created_at_idx on public.source_submission_events(created_at desc);

create table if not exists public.source_submission_attachments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.source_submissions(id) on delete cascade,
  attachment_type text not null default 'source_url',
  label text,
  url text,
  storage_bucket text,
  storage_path text,
  mime_type text,
  file_size_bytes integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint source_submission_attachments_url_shape check (
    url is null
    or url ~* '^https?://'
  )
);

create index if not exists source_submission_attachments_submission_id_idx on public.source_submission_attachments(submission_id);

create table if not exists public.source_review_notes (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.source_submissions(id) on delete cascade,
  reviewer_id uuid references auth.users(id) on delete set null,
  note text not null,
  visibility text not null default 'internal',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists source_review_notes_submission_id_idx on public.source_review_notes(submission_id);

create table if not exists public.source_status_history (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.source_submissions(id) on delete cascade,
  old_status public.source_submission_status,
  new_status public.source_submission_status not null,
  changed_by uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists source_status_history_submission_id_idx on public.source_status_history(submission_id);
create index if not exists source_status_history_created_at_idx on public.source_status_history(created_at desc);

alter table public.source_submissions enable row level security;
alter table public.source_submission_events enable row level security;
alter table public.source_submission_attachments enable row level security;
alter table public.source_review_notes enable row level security;
alter table public.source_status_history enable row level security;

drop policy if exists "Public can insert source submissions" on public.source_submissions;
create policy "Public can insert source submissions"
  on public.source_submissions for insert
  to anon, authenticated
  with check (
    status = 'new'
    and reviewer_id is null
    and reviewed_at is null
    and (
      (auth.uid() is null and submitter_user_id is null)
      or submitter_user_id = auth.uid()
    )
  );

drop policy if exists "Users can read own source submissions" on public.source_submissions;
create policy "Users can read own source submissions"
  on public.source_submissions for select
  to authenticated
  using (submitter_user_id = auth.uid());

drop policy if exists "Admins can read all source submissions" on public.source_submissions;
create policy "Admins can read all source submissions"
  on public.source_submissions for select
  to authenticated
  using (private.is_repw_admin());

drop policy if exists "Admins can update source submissions" on public.source_submissions;
create policy "Admins can update source submissions"
  on public.source_submissions for update
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop policy if exists "Users can read own source events" on public.source_submission_events;
create policy "Users can read own source events"
  on public.source_submission_events for select
  to authenticated
  using (
    exists (
      select 1 from public.source_submissions s
      where s.id = source_submission_events.submission_id
        and s.submitter_user_id = auth.uid()
    )
  );

drop policy if exists "Admins can manage source events" on public.source_submission_events;
create policy "Admins can manage source events"
  on public.source_submission_events for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop policy if exists "Users can read own source attachments" on public.source_submission_attachments;
create policy "Users can read own source attachments"
  on public.source_submission_attachments for select
  to authenticated
  using (
    exists (
      select 1 from public.source_submissions s
      where s.id = source_submission_attachments.submission_id
        and s.submitter_user_id = auth.uid()
    )
  );

drop policy if exists "Admins can manage source attachments" on public.source_submission_attachments;
create policy "Admins can manage source attachments"
  on public.source_submission_attachments for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop policy if exists "Admins can manage source review notes" on public.source_review_notes;
create policy "Admins can manage source review notes"
  on public.source_review_notes for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

drop policy if exists "Users can read own source status history" on public.source_status_history;
create policy "Users can read own source status history"
  on public.source_status_history for select
  to authenticated
  using (
    exists (
      select 1 from public.source_submissions s
      where s.id = source_status_history.submission_id
        and s.submitter_user_id = auth.uid()
    )
  );

drop policy if exists "Admins can manage source status history" on public.source_status_history;
create policy "Admins can manage source status history"
  on public.source_status_history for all
  to authenticated
  using (private.is_repw_admin())
  with check (private.is_repw_admin());

grant select, insert on public.source_submissions to anon, authenticated;
grant update on public.source_submissions to authenticated;
grant select on public.source_submission_events to authenticated;
grant insert, update, delete on public.source_submission_events to authenticated;
grant select on public.source_submission_attachments to authenticated;
grant insert, update, delete on public.source_submission_attachments to authenticated;
grant select, insert, update, delete on public.source_review_notes to authenticated;
grant select, insert, update, delete on public.source_status_history to authenticated;

drop trigger if exists set_source_submissions_updated_at on public.source_submissions;
create trigger set_source_submissions_updated_at
  before update on public.source_submissions
  for each row execute function public.handle_updated_at();

drop trigger if exists set_source_review_notes_updated_at on public.source_review_notes;
create trigger set_source_review_notes_updated_at
  before update on public.source_review_notes
  for each row execute function public.handle_updated_at();
