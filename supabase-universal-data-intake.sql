-- RepWatchr Universal Data Intake
-- ============================================================
-- Run after supabase-superadmin-office.sql so public.is_repw_operator()
-- exists for admin/operator RLS checks.

create table if not exists public.form_definitions (
  id uuid primary key default gen_random_uuid(),
  key text unique not null check (key ~ '^[a-z0-9_:-]+$' and char_length(key) <= 120),
  name text not null check (char_length(name) between 2 and 180),
  description text,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  schema jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_key text not null references public.form_definitions(key) on update cascade,
  anonymous_id text check (anonymous_id is null or char_length(anonymous_id) between 16 and 120),
  user_id uuid references auth.users(id) on delete set null,
  email text check (email is null or char_length(email) <= 180),
  name text check (name is null or char_length(name) <= 180),
  payload jsonb not null,
  normalized_payload jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (
    status in (
      'new',
      'needs_review',
      'verified',
      'rejected',
      'needs_more_info',
      'attached_to_profile',
      'converted_to_packet',
      'converted_to_order',
      'archived'
    )
  ),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  source_route text check (source_route is null or (source_route ~ '^/' and char_length(source_route) <= 500)),
  referrer text check (referrer is null or char_length(referrer) <= 500),
  utm jsonb not null default '{}'::jsonb,
  admin_notes text check (admin_notes is null or char_length(admin_notes) <= 5000),
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.form_submission_events (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.form_submissions(id) on delete cascade,
  event_type text not null check (char_length(event_type) between 2 and 120),
  actor_user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null
);

insert into public.form_definitions (key, name, description, status, schema)
values
  ('submit_source', 'Submit Source', 'Public-source packet intake for officials, races, boards, votes, filings, and missing records.', 'active', '{}'::jsonb),
  ('correction_request', 'Correction Request', 'Correction or report-incorrect-info workflow for public pages and profiles.', 'active', '{}'::jsonb),
  ('free_packet', 'Free Packet', 'Low-friction free source-packet builder and email capture flow.', 'active', '{}'::jsonb),
  ('package_interest', 'Package Interest', 'Paid service package interest and service request intake.', 'active', '{}'::jsonb),
  ('investor_interest', 'Investor Interest', 'Investor interest intake; not a securities offering.', 'active', '{}'::jsonb),
  ('partner_interest', 'Partner Interest', 'Partnership and organization inquiry intake.', 'active', '{}'::jsonb),
  ('data_source_suggestion', 'Data Source Suggestion', 'Suggestion queue for public datasets and source lanes.', 'active', '{}'::jsonb),
  ('missing_official', 'Missing Official', 'Missing official, candidate, or office profile request.', 'active', '{}'::jsonb),
  ('missing_agency', 'Missing Agency', 'Missing agency, public body, or board request.', 'active', '{}'::jsonb),
  ('report_broken_link', 'Report Broken Link', 'Broken source-link report queue.', 'active', '{}'::jsonb),
  ('newsletter_signup', 'Newsletter Signup', 'Newsletter or digest signup.', 'active', '{}'::jsonb),
  ('watchlist_signup', 'Watchlist Signup', 'Watchlist interest capture before account creation.', 'active', '{}'::jsonb),
  ('feedback', 'Feedback', 'General product feedback.', 'active', '{}'::jsonb),
  ('contact', 'Contact', 'General contact form.', 'active', '{}'::jsonb),
  ('research_request', 'Research Request', 'Custom public-record research and data request intake.', 'active', '{}'::jsonb),
  ('public_records_request', 'Public Records Request', 'Public-records request draft workflow intake.', 'active', '{}'::jsonb)
on conflict (key) do update
set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  updated_at = now();

create index if not exists idx_form_submissions_form_key_created
  on public.form_submissions(form_key, created_at desc);
create index if not exists idx_form_submissions_status_created
  on public.form_submissions(status, created_at desc);
create index if not exists idx_form_submissions_priority_created
  on public.form_submissions(priority, created_at desc);
create index if not exists idx_form_submissions_user_created
  on public.form_submissions(user_id, created_at desc)
  where user_id is not null;
create index if not exists idx_form_submissions_anonymous_created
  on public.form_submissions(anonymous_id, created_at desc)
  where anonymous_id is not null;
create index if not exists idx_form_submission_events_submission
  on public.form_submission_events(submission_id, created_at desc);

alter table public.form_definitions enable row level security;
alter table public.form_submissions enable row level security;
alter table public.form_submission_events enable row level security;

grant select on public.form_definitions to anon, authenticated;
grant insert, update, delete on public.form_definitions to service_role;

grant insert on public.form_submissions to anon, authenticated;
grant select on public.form_submissions to authenticated, service_role;
grant update, delete on public.form_submissions to authenticated, service_role;

grant select on public.form_submission_events to authenticated, service_role;
grant insert, update, delete on public.form_submission_events to service_role;

drop policy if exists "Public can read active form definitions" on public.form_definitions;
drop policy if exists "Operators can manage form definitions" on public.form_definitions;
drop policy if exists "Public can insert safe form submissions" on public.form_submissions;
drop policy if exists "Users can read own form submissions" on public.form_submissions;
drop policy if exists "Operators can manage form submissions" on public.form_submissions;
drop policy if exists "Users can read own submission events" on public.form_submission_events;
drop policy if exists "Operators can manage form submission events" on public.form_submission_events;

create policy "Public can read active form definitions"
  on public.form_definitions for select
  to anon, authenticated
  using (status = 'active');

create policy "Operators can manage form definitions"
  on public.form_definitions for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Public can insert safe form submissions"
  on public.form_submissions for insert
  to anon, authenticated
  with check (
    status = 'new'
    and priority in ('low', 'normal', 'high', 'urgent')
    and admin_notes is null
    and assigned_to is null
    and (user_id is null or (select auth.uid()) = user_id)
  );

create policy "Users can read own form submissions"
  on public.form_submissions for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Operators can manage form submissions"
  on public.form_submissions for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Users can read own submission events"
  on public.form_submission_events for select
  to authenticated
  using (
    exists (
      select 1
      from public.form_submissions fs
      where fs.id = form_submission_events.submission_id
        and fs.user_id = (select auth.uid())
    )
  );

create policy "Operators can manage form submission events"
  on public.form_submission_events for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

drop view if exists public.form_intake_admin_summary;

create view public.form_intake_admin_summary
with (security_invoker = true)
as
select
  count(*)::int as total_submissions,
  count(*) filter (where status = 'new')::int as new_submissions,
  count(*) filter (where status = 'needs_review')::int as needs_review,
  count(*) filter (where priority in ('high', 'urgent'))::int as high_priority,
  count(*) filter (where created_at >= now() - interval '7 days')::int as last_7_days,
  max(created_at) as latest_submission_at
from public.form_submissions;

grant select on public.form_intake_admin_summary to authenticated;
