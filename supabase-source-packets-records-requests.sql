-- ============================================================
-- RepWatchr Source Packet Builder + Public Records Request Tool
-- ============================================================
-- Drafts are private by default. Public users may create drafts.
-- Authenticated users may read/update their own drafts.
-- Operators/admins may manage the review queue.

create extension if not exists pgcrypto;

create or replace function public.is_repw_tools_operator()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  allowed boolean := false;
begin
  if to_regclass('public.user_roles') is null then
    return false;
  end if;

  execute
    'select exists (
      select 1
      from public.user_roles
      where user_id = auth.uid()
        and role in (''admin'', ''owner'', ''operator'')
    )'
  into allowed;

  return coalesce(allowed, false);
end;
$$;

grant execute on function public.is_repw_tools_operator() to anon, authenticated, service_role;

create or replace function public.repw_tools_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.source_packets (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text check (anonymous_id is null or char_length(anonymous_id) <= 120),
  user_id uuid references auth.users(id) on delete set null,
  title text check (title is null or char_length(title) <= 220),
  packet_type text not null check (packet_type in (
    'official_record',
    'vote_record',
    'funding_record',
    'meeting_record',
    'school_board_record',
    'race_candidate_record',
    'agency_record',
    'correction_packet',
    'public_question_packet',
    'media_tip_packet',
    'open_records_packet'
  )),
  target_type text check (target_type is null or char_length(target_type) <= 80),
  target_id text check (target_id is null or char_length(target_id) <= 180),
  target_name text check (target_name is null or char_length(target_name) <= 220),
  jurisdiction text check (jurisdiction is null or char_length(jurisdiction) <= 220),
  source_url text not null check (source_url ~ '^https?://' and char_length(source_url) <= 700),
  source_title text check (source_title is null or char_length(source_title) <= 220),
  source_date date,
  summary text check (summary is null or char_length(summary) <= 5000),
  claim_language text check (claim_language is null or char_length(claim_language) <= 5000),
  missing_context text check (missing_context is null or char_length(missing_context) <= 5000),
  public_question text check (public_question is null or char_length(public_question) <= 1000),
  generated_markdown text,
  generated_text text,
  status text not null default 'draft' check (status in (
    'draft',
    'submitted',
    'needs_review',
    'verified',
    'rejected',
    'attached_to_profile',
    'converted_to_packet',
    'archived'
  )),
  submitted_source_id uuid,
  attribution jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.records_requests (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text check (anonymous_id is null or char_length(anonymous_id) <= 120),
  user_id uuid references auth.users(id) on delete set null,
  title text check (title is null or char_length(title) <= 220),
  state text check (state is null or char_length(state) <= 80),
  jurisdiction text check (jurisdiction is null or char_length(jurisdiction) <= 180),
  agency text check (agency is null or char_length(agency) <= 220),
  record_type text check (record_type is null or char_length(record_type) <= 120),
  date_range_start date,
  date_range_end date,
  subject text check (subject is null or char_length(subject) <= 700),
  generated_request text,
  short_email_version text,
  followup_version text,
  overdue_followup_version text,
  status text not null default 'draft' check (status in (
    'draft',
    'sent',
    'response_received',
    'partially_fulfilled',
    'denied',
    'overdue',
    'closed'
  )),
  sent_at timestamptz,
  response_received_at timestamptz,
  notes text check (notes is null or char_length(notes) <= 5000),
  attribution jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_source_packets_user_created
  on public.source_packets(user_id, created_at desc)
  where user_id is not null;
create index if not exists idx_source_packets_anonymous_created
  on public.source_packets(anonymous_id, created_at desc)
  where anonymous_id is not null;
create index if not exists idx_source_packets_status_created
  on public.source_packets(status, created_at desc);
create index if not exists idx_source_packets_target
  on public.source_packets(target_type, target_id, target_name);

create index if not exists idx_records_requests_user_created
  on public.records_requests(user_id, created_at desc)
  where user_id is not null;
create index if not exists idx_records_requests_anonymous_created
  on public.records_requests(anonymous_id, created_at desc)
  where anonymous_id is not null;
create index if not exists idx_records_requests_status_created
  on public.records_requests(status, created_at desc);
create index if not exists idx_records_requests_agency
  on public.records_requests(state, jurisdiction, agency);

drop trigger if exists trg_source_packets_updated_at on public.source_packets;
create trigger trg_source_packets_updated_at
before update on public.source_packets
for each row execute function public.repw_tools_set_updated_at();

drop trigger if exists trg_records_requests_updated_at on public.records_requests;
create trigger trg_records_requests_updated_at
before update on public.records_requests
for each row execute function public.repw_tools_set_updated_at();

alter table public.source_packets enable row level security;
alter table public.records_requests enable row level security;

grant insert on public.source_packets to anon, authenticated;
grant select, update on public.source_packets to authenticated;
grant select, insert, update, delete on public.source_packets to service_role;

grant insert on public.records_requests to anon, authenticated;
grant select, update on public.records_requests to authenticated;
grant select, insert, update, delete on public.records_requests to service_role;

drop policy if exists "Public can insert source packet drafts" on public.source_packets;
drop policy if exists "Users can read own source packets" on public.source_packets;
drop policy if exists "Users can update own source packets" on public.source_packets;
drop policy if exists "Operators can manage source packets" on public.source_packets;
drop policy if exists "Public can insert records request drafts" on public.records_requests;
drop policy if exists "Users can read own records requests" on public.records_requests;
drop policy if exists "Users can update own records requests" on public.records_requests;
drop policy if exists "Operators can manage records requests" on public.records_requests;

create policy "Public can insert source packet drafts"
  on public.source_packets for insert
  to anon, authenticated
  with check (
    status in ('draft', 'submitted')
    and (user_id is null or (select auth.uid()) = user_id)
  );

create policy "Users can read own source packets"
  on public.source_packets for select
  to authenticated
  using ((select auth.uid()) = user_id or public.is_repw_tools_operator());

create policy "Users can update own source packets"
  on public.source_packets for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Operators can manage source packets"
  on public.source_packets for all
  to authenticated
  using (public.is_repw_tools_operator())
  with check (public.is_repw_tools_operator());

create policy "Public can insert records request drafts"
  on public.records_requests for insert
  to anon, authenticated
  with check (
    status in ('draft', 'sent')
    and (user_id is null or (select auth.uid()) = user_id)
  );

create policy "Users can read own records requests"
  on public.records_requests for select
  to authenticated
  using ((select auth.uid()) = user_id or public.is_repw_tools_operator());

create policy "Users can update own records requests"
  on public.records_requests for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Operators can manage records requests"
  on public.records_requests for all
  to authenticated
  using (public.is_repw_tools_operator())
  with check (public.is_repw_tools_operator());
