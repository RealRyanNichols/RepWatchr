-- ============================================================
-- RepWatchr Member Dashboard Workspace
-- ============================================================
-- Run in the Supabase SQL Editor after the base auth/profile schema.
-- These tables hold private member workspace records. Members may manage only
-- their own dashboard rows. Public/anon access is intentionally not granted.

create extension if not exists pgcrypto;

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

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

create table if not exists public.member_tracked_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  href text not null default '/search',
  item_type text not null default 'official',
  notes text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_tracked_items_item_type_check check (
    item_type in ('official', 'school_board', 'race', 'issue', 'attorney', 'media', 'authority')
  )
);

alter table public.member_tracked_items add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.member_tracked_items add column if not exists label text;
alter table public.member_tracked_items add column if not exists href text not null default '/search';
alter table public.member_tracked_items add column if not exists item_type text not null default 'official';
alter table public.member_tracked_items add column if not exists notes text not null default '';
alter table public.member_tracked_items add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.member_tracked_items add column if not exists created_at timestamptz not null default now();
alter table public.member_tracked_items add column if not exists updated_at timestamptz not null default now();

create index if not exists member_tracked_items_user_created_idx on public.member_tracked_items(user_id, created_at desc);
create index if not exists member_tracked_items_item_type_idx on public.member_tracked_items(item_type);

create table if not exists public.member_source_packet_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_submission_id uuid,
  target_name text not null,
  jurisdiction text,
  source_url text not null,
  source_type text not null default 'official_record',
  claim_summary text not null,
  check_request text,
  public_flag boolean not null default true,
  packet_text text not null,
  status text not null default 'draft',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_source_packet_drafts_status_check check (status in ('draft', 'submitted')),
  constraint member_source_packet_drafts_source_url_check check (source_url ~* '^https?://')
);

alter table public.member_source_packet_drafts add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.member_source_packet_drafts add column if not exists source_submission_id uuid;
alter table public.member_source_packet_drafts add column if not exists target_name text;
alter table public.member_source_packet_drafts add column if not exists jurisdiction text;
alter table public.member_source_packet_drafts add column if not exists source_url text;
alter table public.member_source_packet_drafts add column if not exists source_type text not null default 'official_record';
alter table public.member_source_packet_drafts add column if not exists claim_summary text;
alter table public.member_source_packet_drafts add column if not exists check_request text;
alter table public.member_source_packet_drafts add column if not exists public_flag boolean not null default true;
alter table public.member_source_packet_drafts add column if not exists packet_text text;
alter table public.member_source_packet_drafts add column if not exists status text not null default 'draft';
alter table public.member_source_packet_drafts add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.member_source_packet_drafts add column if not exists created_at timestamptz not null default now();
alter table public.member_source_packet_drafts add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if to_regclass('public.source_submissions') is not null
    and not exists (
      select 1
      from pg_constraint
      where conname = 'member_source_packet_drafts_source_submission_id_fkey'
    )
  then
    alter table public.member_source_packet_drafts
      add constraint member_source_packet_drafts_source_submission_id_fkey
      foreign key (source_submission_id) references public.source_submissions(id) on delete set null;
  end if;
end $$;

create index if not exists member_source_packet_drafts_user_created_idx on public.member_source_packet_drafts(user_id, created_at desc);
create index if not exists member_source_packet_drafts_status_idx on public.member_source_packet_drafts(status);
create index if not exists member_source_packet_drafts_submission_idx on public.member_source_packet_drafts(source_submission_id);

create table if not exists public.member_public_record_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  state text not null default 'TX',
  agency text not null,
  jurisdiction text,
  record_type text not null,
  subject text not null,
  date_range text,
  names_offices text,
  meeting_event text,
  preferred_delivery_method text,
  requester_name text,
  requester_email text,
  requester_phone text,
  notes text,
  draft_text text not null,
  email_text text,
  follow_up_text text,
  overdue_follow_up_text text,
  denial_clarification_text text,
  share_with_repwatchr boolean not null default false,
  shared_at timestamptz,
  status text not null default 'draft',
  sent_at timestamptz,
  response_received_at timestamptz,
  partially_fulfilled_at timestamptz,
  denied_at timestamptz,
  overdue_at timestamptz,
  closed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_public_record_requests_status_check check (
    status in ('draft', 'sent', 'response_received', 'partially_fulfilled', 'denied', 'overdue', 'closed')
  )
);

alter table public.member_public_record_requests add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.member_public_record_requests add column if not exists state text not null default 'TX';
alter table public.member_public_record_requests add column if not exists agency text;
alter table public.member_public_record_requests add column if not exists jurisdiction text;
alter table public.member_public_record_requests add column if not exists record_type text;
alter table public.member_public_record_requests add column if not exists subject text;
alter table public.member_public_record_requests add column if not exists date_range text;
alter table public.member_public_record_requests add column if not exists names_offices text;
alter table public.member_public_record_requests add column if not exists meeting_event text;
alter table public.member_public_record_requests add column if not exists preferred_delivery_method text;
alter table public.member_public_record_requests add column if not exists requester_name text;
alter table public.member_public_record_requests add column if not exists requester_email text;
alter table public.member_public_record_requests add column if not exists requester_phone text;
alter table public.member_public_record_requests add column if not exists notes text;
alter table public.member_public_record_requests add column if not exists draft_text text;
alter table public.member_public_record_requests add column if not exists email_text text;
alter table public.member_public_record_requests add column if not exists follow_up_text text;
alter table public.member_public_record_requests add column if not exists overdue_follow_up_text text;
alter table public.member_public_record_requests add column if not exists denial_clarification_text text;
alter table public.member_public_record_requests add column if not exists share_with_repwatchr boolean not null default false;
alter table public.member_public_record_requests add column if not exists shared_at timestamptz;
alter table public.member_public_record_requests add column if not exists status text not null default 'draft';
alter table public.member_public_record_requests add column if not exists sent_at timestamptz;
alter table public.member_public_record_requests add column if not exists response_received_at timestamptz;
alter table public.member_public_record_requests add column if not exists partially_fulfilled_at timestamptz;
alter table public.member_public_record_requests add column if not exists denied_at timestamptz;
alter table public.member_public_record_requests add column if not exists overdue_at timestamptz;
alter table public.member_public_record_requests add column if not exists closed_at timestamptz;
alter table public.member_public_record_requests add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.member_public_record_requests add column if not exists created_at timestamptz not null default now();
alter table public.member_public_record_requests add column if not exists updated_at timestamptz not null default now();

alter table public.member_public_record_requests
  drop constraint if exists member_public_record_requests_status_check;
alter table public.member_public_record_requests
  add constraint member_public_record_requests_status_check
  check (status in ('draft', 'sent', 'response_received', 'partially_fulfilled', 'denied', 'overdue', 'closed'));

create index if not exists member_public_record_requests_user_created_idx on public.member_public_record_requests(user_id, created_at desc);
create index if not exists member_public_record_requests_status_idx on public.member_public_record_requests(status);
create index if not exists member_public_record_requests_shared_idx on public.member_public_record_requests(share_with_repwatchr, created_at desc);

create table if not exists public.member_timeline_starters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  jurisdiction text,
  events jsonb not null default '[]'::jsonb,
  missing_proof text,
  next_records text,
  timeline_text text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_timeline_starters_events_array_check check (jsonb_typeof(events) = 'array')
);

alter table public.member_timeline_starters add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.member_timeline_starters add column if not exists title text;
alter table public.member_timeline_starters add column if not exists jurisdiction text;
alter table public.member_timeline_starters add column if not exists events jsonb not null default '[]'::jsonb;
alter table public.member_timeline_starters add column if not exists missing_proof text;
alter table public.member_timeline_starters add column if not exists next_records text;
alter table public.member_timeline_starters add column if not exists timeline_text text;
alter table public.member_timeline_starters add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.member_timeline_starters add column if not exists created_at timestamptz not null default now();
alter table public.member_timeline_starters add column if not exists updated_at timestamptz not null default now();

create index if not exists member_timeline_starters_user_created_idx on public.member_timeline_starters(user_id, created_at desc);

create table if not exists public.member_faretta_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt text not null,
  source_links jsonb not null default '[]'::jsonb,
  note_text text not null,
  saved_from text not null default 'dashboard',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_faretta_notes_source_links_array_check check (jsonb_typeof(source_links) = 'array')
);

alter table public.member_faretta_notes add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.member_faretta_notes add column if not exists prompt text;
alter table public.member_faretta_notes add column if not exists source_links jsonb not null default '[]'::jsonb;
alter table public.member_faretta_notes add column if not exists note_text text;
alter table public.member_faretta_notes add column if not exists saved_from text not null default 'dashboard';
alter table public.member_faretta_notes add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.member_faretta_notes add column if not exists created_at timestamptz not null default now();
alter table public.member_faretta_notes add column if not exists updated_at timestamptz not null default now();

create index if not exists member_faretta_notes_user_created_idx on public.member_faretta_notes(user_id, created_at desc);

alter table public.member_tracked_items enable row level security;
alter table public.member_source_packet_drafts enable row level security;
alter table public.member_public_record_requests enable row level security;
alter table public.member_timeline_starters enable row level security;
alter table public.member_faretta_notes enable row level security;

revoke all on public.member_tracked_items from anon;
revoke all on public.member_source_packet_drafts from anon;
revoke all on public.member_public_record_requests from anon;
revoke all on public.member_timeline_starters from anon;
revoke all on public.member_faretta_notes from anon;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.member_tracked_items to authenticated;
grant select, insert, update, delete on public.member_source_packet_drafts to authenticated;
grant select, insert, update, delete on public.member_public_record_requests to authenticated;
grant select, insert, update, delete on public.member_timeline_starters to authenticated;
grant select, insert, update, delete on public.member_faretta_notes to authenticated;

drop policy if exists "Users can read own tracked items" on public.member_tracked_items;
create policy "Users can read own tracked items"
  on public.member_tracked_items for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own tracked items" on public.member_tracked_items;
create policy "Users can insert own tracked items"
  on public.member_tracked_items for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own tracked items" on public.member_tracked_items;
create policy "Users can update own tracked items"
  on public.member_tracked_items for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own tracked items" on public.member_tracked_items;
create policy "Users can delete own tracked items"
  on public.member_tracked_items for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can read own source packet drafts" on public.member_source_packet_drafts;
create policy "Users can read own source packet drafts"
  on public.member_source_packet_drafts for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own source packet drafts" on public.member_source_packet_drafts;
create policy "Users can insert own source packet drafts"
  on public.member_source_packet_drafts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own source packet drafts" on public.member_source_packet_drafts;
create policy "Users can update own source packet drafts"
  on public.member_source_packet_drafts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own source packet drafts" on public.member_source_packet_drafts;
create policy "Users can delete own source packet drafts"
  on public.member_source_packet_drafts for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can read own public record requests" on public.member_public_record_requests;
create policy "Users can read own public record requests"
  on public.member_public_record_requests for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Admins can read shared public record requests" on public.member_public_record_requests;
create policy "Admins can read shared public record requests"
  on public.member_public_record_requests for select
  to authenticated
  using (share_with_repwatchr = true and private.is_repw_admin());

drop policy if exists "Users can insert own public record requests" on public.member_public_record_requests;
create policy "Users can insert own public record requests"
  on public.member_public_record_requests for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own public record requests" on public.member_public_record_requests;
create policy "Users can update own public record requests"
  on public.member_public_record_requests for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own public record requests" on public.member_public_record_requests;
create policy "Users can delete own public record requests"
  on public.member_public_record_requests for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can read own timeline starters" on public.member_timeline_starters;
create policy "Users can read own timeline starters"
  on public.member_timeline_starters for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own timeline starters" on public.member_timeline_starters;
create policy "Users can insert own timeline starters"
  on public.member_timeline_starters for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own timeline starters" on public.member_timeline_starters;
create policy "Users can update own timeline starters"
  on public.member_timeline_starters for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own timeline starters" on public.member_timeline_starters;
create policy "Users can delete own timeline starters"
  on public.member_timeline_starters for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can read own Faretta notes" on public.member_faretta_notes;
create policy "Users can read own Faretta notes"
  on public.member_faretta_notes for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own Faretta notes" on public.member_faretta_notes;
create policy "Users can insert own Faretta notes"
  on public.member_faretta_notes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own Faretta notes" on public.member_faretta_notes;
create policy "Users can update own Faretta notes"
  on public.member_faretta_notes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own Faretta notes" on public.member_faretta_notes;
create policy "Users can delete own Faretta notes"
  on public.member_faretta_notes for delete
  to authenticated
  using (auth.uid() = user_id);

drop trigger if exists set_member_tracked_items_updated_at on public.member_tracked_items;
create trigger set_member_tracked_items_updated_at
  before update on public.member_tracked_items
  for each row execute function public.handle_updated_at();

drop trigger if exists set_member_source_packet_drafts_updated_at on public.member_source_packet_drafts;
create trigger set_member_source_packet_drafts_updated_at
  before update on public.member_source_packet_drafts
  for each row execute function public.handle_updated_at();

drop trigger if exists set_member_public_record_requests_updated_at on public.member_public_record_requests;
create trigger set_member_public_record_requests_updated_at
  before update on public.member_public_record_requests
  for each row execute function public.handle_updated_at();

drop trigger if exists set_member_timeline_starters_updated_at on public.member_timeline_starters;
create trigger set_member_timeline_starters_updated_at
  before update on public.member_timeline_starters
  for each row execute function public.handle_updated_at();

drop trigger if exists set_member_faretta_notes_updated_at on public.member_faretta_notes;
create trigger set_member_faretta_notes_updated_at
  before update on public.member_faretta_notes
  for each row execute function public.handle_updated_at();
