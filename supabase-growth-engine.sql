-- ============================================================
-- RepWatchr Growth Engine, Prediction Desk, and Story Queue
-- ============================================================
-- Purpose:
-- - Capture public-record questions, prediction ideas, story leads, and data
--   product signals.
-- - Route sourced leads into forecasts, story opportunities, graphic/OG-image
--   work, and admin review.
-- - Keep predictions labeled as forecasts with source gaps, confidence, and
--   public resolution rules.

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

create or replace function public.is_repw_admin()
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
      and role in ('admin', 'reviewer', 'researcher')
  );
$$;

create table if not exists public.growth_question_intake (
  id uuid primary key default gen_random_uuid(),
  submission_id text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  submitter_name text check (submitter_name is null or char_length(submitter_name) <= 120),
  submitter_email text not null check (char_length(submitter_email) between 5 and 180),
  target_type text not null check (
    target_type in (
      'Official',
      'Race',
      'School board',
      'Vote',
      'Funding',
      'Red flag',
      'Story lead',
      'Prediction',
      'Data request'
    )
  ),
  target_name text not null check (char_length(target_name) between 2 and 220),
  geography text check (geography is null or char_length(geography) <= 180),
  public_source_url text check (public_source_url is null or char_length(public_source_url) <= 700),
  question_summary text not null check (char_length(question_summary) between 20 and 2500),
  prediction_prompt text check (prediction_prompt is null or char_length(prediction_prompt) <= 1200),
  story_angle text check (story_angle is null or char_length(story_angle) <= 1200),
  public_use_consent boolean default false not null,
  commercial_use_consent boolean default false not null,
  status text not null default 'new' check (
    status in (
      'new',
      'needs_source',
      'needs_review',
      'accepted',
      'rejected',
      'attached_to_profile',
      'attached_to_race',
      'promoted_to_story',
      'promoted_to_prediction',
      'spam'
    )
  ),
  assigned_to uuid references auth.users(id) on delete set null,
  reviewer uuid references auth.users(id) on delete set null,
  reviewer_notes text check (reviewer_notes is null or char_length(reviewer_notes) <= 2500),
  reject_reason text check (reject_reason is null or char_length(reject_reason) <= 800),
  attached_profile_id text,
  attached_race_slug text,
  attached_story_id text,
  attached_forecast_id uuid,
  utm jsonb default '{}'::jsonb not null,
  referrer text,
  user_agent text,
  reviewed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.prediction_forecasts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (char_length(title) between 8 and 220),
  target_type text not null check (target_type in ('official', 'race', 'school_board', 'vote', 'issue', 'funding', 'story', 'profile')),
  target_id text,
  geography text,
  forecast_type text not null check (
    forecast_type in (
      'race_pressure',
      'issue_salience',
      'profile_completion',
      'story_likelihood',
      'funding_attention',
      'watchlist_growth',
      'source_gap'
    )
  ),
  forecast_label text not null,
  forecast_value numeric(8,2),
  confidence integer not null default 1 check (confidence between 1 and 100),
  confidence_label text not null default 'low' check (confidence_label in ('low', 'medium', 'high')),
  sample_size integer default 0 not null check (sample_size >= 0),
  source_count integer default 0 not null check (source_count >= 0),
  source_urls text[] default '{}'::text[] not null,
  source_gaps text[] default '{}'::text[] not null,
  input_summary text not null check (char_length(input_summary) between 20 and 2500),
  resolution_rule text not null check (char_length(resolution_rule) between 20 and 1200),
  status text not null default 'draft' check (
    status in ('draft', 'active', 'resolved_true', 'resolved_false', 'resolved_mixed', 'voided', 'archived')
  ),
  public_note text check (public_note is null or char_length(public_note) <= 1500),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.prediction_forecast_updates (
  id uuid primary key default gen_random_uuid(),
  forecast_id uuid references public.prediction_forecasts(id) on delete cascade not null,
  update_type text not null default 'signal_update' check (
    update_type in ('signal_update', 'source_added', 'confidence_change', 'status_change', 'resolved', 'admin_note')
  ),
  previous_value jsonb default '{}'::jsonb not null,
  new_value jsonb default '{}'::jsonb not null,
  source_url text,
  note text check (note is null or char_length(note) <= 1500),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null
);

create table if not exists public.story_opportunities (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null check (char_length(title) between 8 and 220),
  lane text not null check (
    lane in ('daily_watch', 'profile_gap', 'funding_movement', 'vote_reaction', 'race_update', 'school_board', 'data_gap')
  ),
  hook text not null check (char_length(hook) between 20 and 1200),
  target_type text check (target_type is null or target_type in ('official', 'race', 'school_board', 'vote', 'issue', 'funding', 'red_flag')),
  target_id text,
  geography text,
  source_urls text[] default '{}'::text[] not null,
  missing_proof text[] default '{}'::text[] not null,
  safe_share_line text check (safe_share_line is null or char_length(safe_share_line) <= 500),
  public_question text check (public_question is null or char_length(public_question) <= 700),
  graphic_prompt text check (graphic_prompt is null or char_length(graphic_prompt) <= 1200),
  status text not null default 'queued' check (
    status in ('queued', 'drafting', 'needs_review', 'approved', 'published', 'rejected', 'quarantined')
  ),
  promoted_article_id text,
  reviewer uuid references auth.users(id) on delete set null,
  reviewer_notes text check (reviewer_notes is null or char_length(reviewer_notes) <= 2500),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.story_generation_runs (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid references public.story_opportunities(id) on delete set null,
  model_name text,
  prompt_version text,
  source_count integer default 0 not null check (source_count >= 0),
  output_summary text check (output_summary is null or char_length(output_summary) <= 2000),
  output_storage_path text,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'discarded')),
  error_message text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null,
  completed_at timestamptz
);

create table if not exists public.graphic_generation_queue (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (
    target_type in ('homepage', 'official', 'race', 'school_board', 'vote', 'funding', 'red_flag', 'story', 'service', 'source_packet')
  ),
  target_id text,
  title text not null check (char_length(title) between 4 and 220),
  jurisdiction text,
  image_prompt text not null check (char_length(image_prompt) between 20 and 1600),
  required_text text[] default '{}'::text[] not null,
  style_token text not null default 'repwatchr_source_first',
  status text not null default 'queued' check (status in ('queued', 'generated', 'approved', 'attached', 'rejected', 'needs_revision')),
  storage_path text,
  public_url text,
  reviewer uuid references auth.users(id) on delete set null,
  reviewer_notes text check (reviewer_notes is null or char_length(reviewer_notes) <= 1500),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.growth_engine_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null check (
    event_name in (
      'growth_question_submitted',
      'prediction_created',
      'prediction_updated',
      'story_opportunity_created',
      'story_promoted',
      'graphic_queued',
      'graphic_attached',
      'data_signal_created',
      'admin_growth_review_completed'
    )
  ),
  target_type text,
  target_id text,
  anonymous_session_id text,
  user_id uuid references auth.users(id) on delete set null,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null
);

create index if not exists idx_growth_question_intake_status
  on public.growth_question_intake(status, created_at desc);
create index if not exists idx_growth_question_intake_target
  on public.growth_question_intake(target_type, target_name, geography);
create index if not exists idx_prediction_forecasts_status
  on public.prediction_forecasts(status, forecast_type, updated_at desc);
create index if not exists idx_prediction_forecasts_target
  on public.prediction_forecasts(target_type, target_id);
create index if not exists idx_prediction_forecast_updates_forecast
  on public.prediction_forecast_updates(forecast_id, created_at desc);
create index if not exists idx_story_opportunities_status
  on public.story_opportunities(status, lane, updated_at desc);
create index if not exists idx_graphic_generation_queue_status
  on public.graphic_generation_queue(status, target_type, updated_at desc);
create index if not exists idx_growth_engine_events_name
  on public.growth_engine_events(event_name, created_at desc);

alter table public.growth_question_intake enable row level security;
alter table public.prediction_forecasts enable row level security;
alter table public.prediction_forecast_updates enable row level security;
alter table public.story_opportunities enable row level security;
alter table public.story_generation_runs enable row level security;
alter table public.graphic_generation_queue enable row level security;
alter table public.growth_engine_events enable row level security;

drop policy if exists "Anyone can submit growth question intake" on public.growth_question_intake;
drop policy if exists "Users can read own growth question intake" on public.growth_question_intake;
drop policy if exists "Admins can manage growth question intake" on public.growth_question_intake;
drop policy if exists "Public can read active prediction forecasts" on public.prediction_forecasts;
drop policy if exists "Admins can manage prediction forecasts" on public.prediction_forecasts;
drop policy if exists "Public can read updates for public forecasts" on public.prediction_forecast_updates;
drop policy if exists "Admins can manage prediction forecast updates" on public.prediction_forecast_updates;
drop policy if exists "Public can read published story opportunities" on public.story_opportunities;
drop policy if exists "Admins can manage story opportunities" on public.story_opportunities;
drop policy if exists "Admins can manage story generation runs" on public.story_generation_runs;
drop policy if exists "Public can read approved graphics" on public.graphic_generation_queue;
drop policy if exists "Admins can manage graphic queue" on public.graphic_generation_queue;
drop policy if exists "Anyone can insert growth engine events" on public.growth_engine_events;
drop policy if exists "Admins can read growth engine events" on public.growth_engine_events;

create policy "Anyone can submit growth question intake"
  on public.growth_question_intake for insert
  to anon, authenticated
  with check (public_use_consent = true);

create policy "Users can read own growth question intake"
  on public.growth_question_intake for select
  to authenticated
  using (
    auth.uid() = user_id
    or lower(coalesce(auth.jwt() ->> 'email', '')) = lower(submitter_email)
    or public.is_repw_admin()
  );

create policy "Admins can manage growth question intake"
  on public.growth_question_intake for all
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Public can read active prediction forecasts"
  on public.prediction_forecasts for select
  using (status in ('active', 'resolved_true', 'resolved_false', 'resolved_mixed') or public.is_repw_admin());

create policy "Admins can manage prediction forecasts"
  on public.prediction_forecasts for all
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Public can read updates for public forecasts"
  on public.prediction_forecast_updates for select
  using (
    exists (
      select 1
      from public.prediction_forecasts pf
      where pf.id = forecast_id
        and pf.status in ('active', 'resolved_true', 'resolved_false', 'resolved_mixed')
    )
    or public.is_repw_admin()
  );

create policy "Admins can manage prediction forecast updates"
  on public.prediction_forecast_updates for all
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Public can read published story opportunities"
  on public.story_opportunities for select
  using (status = 'published' or public.is_repw_admin());

create policy "Admins can manage story opportunities"
  on public.story_opportunities for all
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Admins can manage story generation runs"
  on public.story_generation_runs for all
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Public can read approved graphics"
  on public.graphic_generation_queue for select
  using (status in ('approved', 'attached') or public.is_repw_admin());

create policy "Admins can manage graphic queue"
  on public.graphic_generation_queue for all
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Anyone can insert growth engine events"
  on public.growth_engine_events for insert
  to anon, authenticated
  with check (true);

create policy "Admins can read growth engine events"
  on public.growth_engine_events for select
  using (public.is_repw_admin());

drop trigger if exists set_growth_question_intake_updated_at on public.growth_question_intake;
create trigger set_growth_question_intake_updated_at
  before update on public.growth_question_intake
  for each row execute function public.handle_updated_at();

drop trigger if exists set_prediction_forecasts_updated_at on public.prediction_forecasts;
create trigger set_prediction_forecasts_updated_at
  before update on public.prediction_forecasts
  for each row execute function public.handle_updated_at();

drop trigger if exists set_story_opportunities_updated_at on public.story_opportunities;
create trigger set_story_opportunities_updated_at
  before update on public.story_opportunities
  for each row execute function public.handle_updated_at();

drop trigger if exists set_graphic_generation_queue_updated_at on public.graphic_generation_queue;
create trigger set_graphic_generation_queue_updated_at
  before update on public.graphic_generation_queue
  for each row execute function public.handle_updated_at();

create or replace view public.growth_question_intake_summary as
select
  target_type,
  geography,
  status,
  count(*) as intake_count,
  count(*) filter (where public_source_url is not null) as sourced_count,
  count(*) filter (where prediction_prompt is not null) as prediction_prompt_count,
  count(*) filter (where story_angle is not null) as story_angle_count,
  max(created_at) as latest_created_at
from public.growth_question_intake
where public_use_consent = true
group by target_type, geography, status;

create or replace view public.prediction_forecast_public_summary as
select
  slug,
  title,
  target_type,
  target_id,
  geography,
  forecast_type,
  forecast_label,
  confidence,
  confidence_label,
  sample_size,
  source_count,
  source_gaps,
  resolution_rule,
  status,
  updated_at
from public.prediction_forecasts
where status in ('active', 'resolved_true', 'resolved_false', 'resolved_mixed');

create or replace view public.story_opportunity_public_summary as
select
  slug,
  title,
  lane,
  target_type,
  target_id,
  geography,
  safe_share_line,
  public_question,
  status,
  updated_at
from public.story_opportunities
where status = 'published';

grant insert on public.growth_question_intake to anon, authenticated;
grant insert on public.growth_engine_events to anon, authenticated;
grant select on public.prediction_forecasts to anon, authenticated;
grant select on public.prediction_forecast_updates to anon, authenticated;
grant select on public.story_opportunities to anon, authenticated;
grant select on public.graphic_generation_queue to anon, authenticated;
grant select on public.growth_question_intake_summary to anon, authenticated;
grant select on public.prediction_forecast_public_summary to anon, authenticated;
grant select on public.story_opportunity_public_summary to anon, authenticated;
grant all on public.growth_question_intake to authenticated;
grant all on public.prediction_forecasts to authenticated;
grant all on public.prediction_forecast_updates to authenticated;
grant all on public.story_opportunities to authenticated;
grant all on public.story_generation_runs to authenticated;
grant all on public.graphic_generation_queue to authenticated;
grant all on public.growth_engine_events to authenticated;
