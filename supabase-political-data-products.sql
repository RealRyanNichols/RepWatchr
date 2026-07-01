-- ============================================================
-- RepWatchr Political Data Products and Verified Feedback
-- ============================================================
-- Purpose:
-- - Capture account-based political feedback without allowing duplicate spam to
--   dictate public data.
-- - Separate constituent, district, state, and outsider signals.
-- - Monetize aggregate political intelligence, custom reports, data licensing,
--   profile-claim workflows, and verified panels.
-- - Avoid selling raw private identity documents or doxxing material.

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

create table if not exists public.user_identity_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  email_verified boolean default false not null,
  phone_verified boolean default false not null,
  identity_provider text,
  identity_status text not null default 'unverified'
    check (identity_status in ('unverified', 'email_verified', 'phone_verified', 'id_verified', 'voter_file_matched', 'manual_review', 'rejected')),
  duplicate_risk_score numeric(5,2) default 0 not null,
  identity_hash text,
  device_hash text,
  state text,
  county text,
  city text,
  congressional_district text,
  state_house_district text,
  state_senate_district text,
  voter_registration_status text check (
    voter_registration_status is null
    or voter_registration_status in ('unknown', 'self_reported', 'matched', 'not_matched', 'not_eligible')
  ),
  commercial_data_consent boolean default false not null,
  research_panel_consent boolean default false not null,
  public_display_consent boolean default false not null,
  consent_updated_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.political_feedback_questions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  question text not null check (char_length(question) between 8 and 500),
  description text,
  target_type text not null default 'official'
    check (target_type in ('official', 'race', 'school_board', 'vote', 'issue', 'funding', 'red_flag')),
  response_type text not null
    check (response_type in ('yes_no', 'yes_no_unsure', 'choice', 'scale_1_5', 'grade_af', 'multi_select', 'text_short')),
  choices jsonb default '[]'::jsonb not null,
  commercial_signal_key text,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'archived')),
  requires_verified_account boolean default true not null,
  requires_constituency_match boolean default false not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.political_feedback_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  question_id uuid references public.political_feedback_questions(id) on delete cascade not null,
  target_type text not null check (target_type in ('official', 'race', 'school_board', 'vote', 'issue', 'funding', 'red_flag')),
  target_id text not null,
  answer jsonb not null,
  confidence integer check (confidence is null or confidence between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 800),
  constituency_scope text not null default 'unknown'
    check (constituency_scope in ('constituent', 'in_district', 'in_county', 'in_state', 'out_of_district', 'out_of_state', 'unknown')),
  self_reported_past_vote text check (
    self_reported_past_vote is null
    or self_reported_past_vote in ('voted_for', 'voted_against', 'did_not_vote', 'not_eligible', 'prefer_not_to_say')
  ),
  voter_intent text check (
    voter_intent is null
    or voter_intent in ('vote_for', 'vote_against', 'undecided', 'would_not_vote', 'not_eligible')
  ),
  action_intent jsonb default '{}'::jsonb not null,
  commercial_use_consent boolean default false not null,
  public_display_consent boolean default false not null,
  source_context_url text,
  utm jsonb default '{}'::jsonb not null,
  referrer text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, question_id, target_type, target_id)
);

create table if not exists public.official_vote_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  official_id text not null,
  vote_id text not null,
  bill_id text,
  reaction text not null check (reaction in ('approve', 'disapprove', 'mixed', 'need_more_context')),
  importance integer check (importance between 1 and 5),
  constituency_scope text not null default 'unknown'
    check (constituency_scope in ('constituent', 'in_district', 'in_county', 'in_state', 'out_of_district', 'out_of_state', 'unknown')),
  comment text check (comment is null or char_length(comment) <= 800),
  commercial_use_consent boolean default false not null,
  source_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, official_id, vote_id)
);

create table if not exists public.data_product_interests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 5 and 180),
  organization text check (organization is null or char_length(organization) <= 180),
  interest_type text not null check (
    interest_type in (
      'Data licensing',
      'Custom political report',
      'Verified constituent panel',
      'Campaign research desk',
      'Claimed profile / official response',
      'Partnership'
    )
  ),
  geography text check (geography is null or char_length(geography) <= 180),
  use_case text not null check (char_length(use_case) between 20 and 2500),
  budget_range text check (budget_range is null or char_length(budget_range) <= 120),
  consent boolean default false not null,
  status text not null default 'new' check (status in ('new', 'qualified', 'contacted', 'proposal_sent', 'won', 'lost', 'spam')),
  referrer text,
  user_agent text,
  reviewer uuid references auth.users(id) on delete set null,
  reviewer_notes text check (reviewer_notes is null or char_length(reviewer_notes) <= 2000),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.data_export_customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organization text,
  email text not null,
  customer_type text not null
    check (customer_type in ('campaign', 'pac', 'media', 'researcher', 'advocacy', 'official', 'consultant', 'other')),
  subscription_status text not null default 'lead'
    check (subscription_status in ('lead', 'trial', 'active', 'paused', 'canceled', 'rejected')),
  allowed_products text[] default '{}'::text[] not null,
  contract_notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.data_export_runs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.data_export_customers(id) on delete set null,
  product_slug text not null,
  export_scope jsonb default '{}'::jsonb not null,
  row_count integer default 0 not null,
  storage_path text,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'revoked')),
  generated_by uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz default now() not null,
  completed_at timestamptz
);

create index if not exists idx_user_identity_verifications_scope
  on public.user_identity_verifications(state, county, congressional_district, state_house_district, state_senate_district);
create index if not exists idx_political_feedback_questions_status
  on public.political_feedback_questions(status, target_type);
create index if not exists idx_political_feedback_responses_target
  on public.political_feedback_responses(target_type, target_id, question_id, constituency_scope);
create index if not exists idx_political_feedback_responses_user
  on public.political_feedback_responses(user_id, created_at desc);
create index if not exists idx_official_vote_reactions_vote
  on public.official_vote_reactions(official_id, vote_id, constituency_scope);
create index if not exists idx_data_product_interests_status
  on public.data_product_interests(status, created_at desc);
create index if not exists idx_data_export_runs_customer
  on public.data_export_runs(customer_id, created_at desc);

alter table public.user_identity_verifications enable row level security;
alter table public.political_feedback_questions enable row level security;
alter table public.political_feedback_responses enable row level security;
alter table public.official_vote_reactions enable row level security;
alter table public.data_product_interests enable row level security;
alter table public.data_export_customers enable row level security;
alter table public.data_export_runs enable row level security;

drop policy if exists "Users can read own identity verification and admins can read all" on public.user_identity_verifications;
drop policy if exists "Users can manage own identity verification" on public.user_identity_verifications;
drop policy if exists "Admins can manage identity verifications" on public.user_identity_verifications;
drop policy if exists "Public can read active feedback questions" on public.political_feedback_questions;
drop policy if exists "Admins can manage feedback questions" on public.political_feedback_questions;
drop policy if exists "Users can read own political feedback and admins can read all" on public.political_feedback_responses;
drop policy if exists "Verified users can submit political feedback" on public.political_feedback_responses;
drop policy if exists "Users can update own political feedback" on public.political_feedback_responses;
drop policy if exists "Users can read own vote reactions and admins can read all" on public.official_vote_reactions;
drop policy if exists "Verified users can submit vote reactions" on public.official_vote_reactions;
drop policy if exists "Users can update own vote reactions" on public.official_vote_reactions;
drop policy if exists "Anyone can submit data product interest" on public.data_product_interests;
drop policy if exists "Admins can manage data product interests" on public.data_product_interests;
drop policy if exists "Admins can manage data export customers" on public.data_export_customers;
drop policy if exists "Admins can manage data export runs" on public.data_export_runs;

create policy "Users can read own identity verification and admins can read all"
  on public.user_identity_verifications for select
  using (auth.uid() = user_id or public.is_repw_admin());

create policy "Users can manage own identity verification"
  on public.user_identity_verifications for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Admins can manage identity verifications"
  on public.user_identity_verifications for all
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Public can read active feedback questions"
  on public.political_feedback_questions for select
  using (status = 'active' or public.is_repw_admin());

create policy "Admins can manage feedback questions"
  on public.political_feedback_questions for all
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Users can read own political feedback and admins can read all"
  on public.political_feedback_responses for select
  using (auth.uid() = user_id or public.is_repw_admin());

create policy "Verified users can submit political feedback"
  on public.political_feedback_responses for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.user_identity_verifications verification
      where verification.user_id = auth.uid()
        and verification.identity_status in ('email_verified', 'phone_verified', 'id_verified', 'voter_file_matched', 'manual_review')
        and verification.duplicate_risk_score < 80
    )
  );

create policy "Users can update own political feedback"
  on public.political_feedback_responses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read own vote reactions and admins can read all"
  on public.official_vote_reactions for select
  using (auth.uid() = user_id or public.is_repw_admin());

create policy "Verified users can submit vote reactions"
  on public.official_vote_reactions for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.user_identity_verifications verification
      where verification.user_id = auth.uid()
        and verification.identity_status in ('email_verified', 'phone_verified', 'id_verified', 'voter_file_matched', 'manual_review')
        and verification.duplicate_risk_score < 80
    )
  );

create policy "Users can update own vote reactions"
  on public.official_vote_reactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Anyone can submit data product interest"
  on public.data_product_interests for insert
  to anon, authenticated
  with check (consent = true);

create policy "Admins can manage data product interests"
  on public.data_product_interests for all
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Admins can manage data export customers"
  on public.data_export_customers for all
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Admins can manage data export runs"
  on public.data_export_runs for all
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create or replace view public.political_feedback_public_summary as
select
  response.target_type,
  response.target_id,
  response.question_id,
  question.slug as question_slug,
  question.question,
  response.constituency_scope,
  count(*)::int as response_count,
  count(*) filter (where response.commercial_use_consent)::int as commercial_consent_count,
  jsonb_agg(response.answer) as answer_sample
from public.political_feedback_responses response
join public.political_feedback_questions question on question.id = response.question_id
group by
  response.target_type,
  response.target_id,
  response.question_id,
  question.slug,
  question.question,
  response.constituency_scope;

create or replace view public.official_vote_reaction_summary as
select
  official_id,
  vote_id,
  bill_id,
  constituency_scope,
  count(*)::int as reaction_count,
  count(*) filter (where reaction = 'approve')::int as approve_count,
  count(*) filter (where reaction = 'disapprove')::int as disapprove_count,
  count(*) filter (where reaction = 'mixed')::int as mixed_count,
  count(*) filter (where reaction = 'need_more_context')::int as need_more_context_count,
  round(avg(importance)::numeric, 2) as average_importance
from public.official_vote_reactions
group by official_id, vote_id, bill_id, constituency_scope;

grant select on public.political_feedback_questions to anon, authenticated;
grant select on public.political_feedback_public_summary to anon, authenticated;
grant select on public.official_vote_reaction_summary to anon, authenticated;

drop trigger if exists set_user_identity_verifications_updated_at on public.user_identity_verifications;
create trigger set_user_identity_verifications_updated_at
  before update on public.user_identity_verifications
  for each row execute function public.handle_updated_at();

drop trigger if exists set_political_feedback_questions_updated_at on public.political_feedback_questions;
create trigger set_political_feedback_questions_updated_at
  before update on public.political_feedback_questions
  for each row execute function public.handle_updated_at();

drop trigger if exists set_political_feedback_responses_updated_at on public.political_feedback_responses;
create trigger set_political_feedback_responses_updated_at
  before update on public.political_feedback_responses
  for each row execute function public.handle_updated_at();

drop trigger if exists set_official_vote_reactions_updated_at on public.official_vote_reactions;
create trigger set_official_vote_reactions_updated_at
  before update on public.official_vote_reactions
  for each row execute function public.handle_updated_at();

drop trigger if exists set_data_product_interests_updated_at on public.data_product_interests;
create trigger set_data_product_interests_updated_at
  before update on public.data_product_interests
  for each row execute function public.handle_updated_at();

drop trigger if exists set_data_export_customers_updated_at on public.data_export_customers;
create trigger set_data_export_customers_updated_at
  before update on public.data_export_customers
  for each row execute function public.handle_updated_at();

insert into public.political_feedback_questions (
  slug,
  question,
  description,
  target_type,
  response_type,
  choices,
  commercial_signal_key,
  status,
  requires_verified_account
)
values
  (
    'vote-again-today',
    'Would you vote for this official again today?',
    'Core public sentiment signal for verified RepWatchr accounts.',
    'official',
    'choice',
    '[\"vote_for\", \"vote_against\", \"undecided\", \"would_not_vote\", \"not_eligible\"]'::jsonb,
    'vote_again_intent',
    'active',
    true
  ),
  (
    'past-vote-satisfaction',
    'Did you vote for this official, and do you like the job they are doing now?',
    'Self-reported supporter satisfaction and regret signal. This is not official ballot history.',
    'official',
    'choice',
    '[\"voted_for_like\", \"voted_for_dislike\", \"voted_against_like\", \"voted_against_dislike\", \"did_not_vote\", \"prefer_not_to_say\"]'::jsonb,
    'supporter_satisfaction',
    'active',
    true
  ),
  (
    'trust-score',
    'How much do you trust this official to represent your area?',
    'Trust pulse for constituent and outsider cuts.',
    'official',
    'scale_1_5',
    '[]'::jsonb,
    'trust_score',
    'active',
    true
  ),
  (
    'issue-priority',
    'Which issue should RepWatchr watch most closely on this profile?',
    'Issue intensity and source-priority signal.',
    'official',
    'multi_select',
    '[\"taxes\", \"water\", \"schools\", \"border\", \"spending\", \"constitutional-rights\", \"funding\", \"ethics\", \"local-control\", \"other\"]'::jsonb,
    'issue_priority',
    'active',
    true
  )
on conflict (slug) do update set
  question = excluded.question,
  description = excluded.description,
  choices = excluded.choices,
  status = excluded.status,
  updated_at = now();
