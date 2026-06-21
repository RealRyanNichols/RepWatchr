-- ============================================================
-- RepWatchr Universal Profile Scorecards
-- ============================================================
-- One verified RepWatchr profile can cast one scorecard vote on any public
-- profile target: officials, school-board members, attorneys, firms, media
-- companies, journalists, editors, and future public-power profiles.

create table if not exists public.profile_scorecard_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  target_type text not null check (
    target_type in (
      'official',
      'school_board',
      'attorney',
      'law_firm',
      'bar_source',
      'media_company',
      'journalist',
      'editor',
      'newsroom_leadership',
      'law_enforcement_agency',
      'sheriff',
      'police_chief',
      'public_safety_official',
      'oversight_agency'
    )
  ),
  target_id text not null,
  target_name text not null,
  target_path text not null,
  grade text not null check (grade in ('A', 'B', 'C', 'D', 'F')),
  score integer not null check (score >= 0 and score <= 100),
  county text not null,
  voter_scope text not null default 'verified_unknown' check (
    voter_scope in (
      'in_district',
      'in_state',
      'out_of_district',
      'out_of_state',
      'verified_unknown'
    )
  ),
  voter_state text,
  voter_county text,
  voter_district text,
  would_vote_again text check (
    would_vote_again is null or would_vote_again in ('yes', 'no', 'unsure', 'not_eligible')
  ),
  voted_for_last_time text check (
    voted_for_last_time is null or voted_for_last_time in (
      'voted_for',
      'voted_against',
      'did_not_vote',
      'not_eligible',
      'prefer_not_to_say'
    )
  ),
  approval_after_vote text check (
    approval_after_vote is null or approval_after_vote in (
      'approve',
      'disapprove',
      'mixed',
      'not_applicable'
    )
  ),
  top_issue text check (top_issue is null or char_length(top_issue) <= 80),
  rationale text check (rationale is null or char_length(rationale) <= 500),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, target_type, target_id)
);

alter table public.profile_scorecard_votes
  add column if not exists voter_scope text not null default 'verified_unknown',
  add column if not exists voter_state text,
  add column if not exists voter_county text,
  add column if not exists voter_district text,
  add column if not exists would_vote_again text,
  add column if not exists voted_for_last_time text,
  add column if not exists approval_after_vote text,
  add column if not exists top_issue text;

create index if not exists idx_profile_scorecard_votes_target
  on public.profile_scorecard_votes(target_type, target_id);
create index if not exists idx_profile_scorecard_votes_target_county
  on public.profile_scorecard_votes(target_type, target_id, county);
create index if not exists idx_profile_scorecard_votes_target_scope
  on public.profile_scorecard_votes(target_type, target_id, voter_scope);
create index if not exists idx_profile_scorecard_votes_user
  on public.profile_scorecard_votes(user_id, updated_at desc);

alter table public.profile_scorecard_votes enable row level security;

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop policy if exists "Users can view own profile scorecard votes" on public.profile_scorecard_votes;
drop policy if exists "Verified users can insert own profile scorecard votes" on public.profile_scorecard_votes;
drop policy if exists "Verified users can update own profile scorecard votes" on public.profile_scorecard_votes;
drop policy if exists "Users can delete own profile scorecard votes" on public.profile_scorecard_votes;

create policy "Users can view own profile scorecard votes"
  on public.profile_scorecard_votes for select
  using (auth.uid() = user_id);

create policy "Verified users can insert own profile scorecard votes"
  on public.profile_scorecard_votes for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.verified = true
    )
  );

create policy "Verified users can update own profile scorecard votes"
  on public.profile_scorecard_votes for update
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.verified = true
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.verified = true
    )
  );

create policy "Users can delete own profile scorecard votes"
  on public.profile_scorecard_votes for delete
  using (auth.uid() = user_id);

create or replace view public.profile_scorecard_summary as
select
  target_type,
  target_id,
  max(target_name) as target_name,
  max(target_path) as target_path,
  count(*) as total_votes,
  count(*) filter (where grade = 'A') as a_count,
  count(*) filter (where grade = 'B') as b_count,
  count(*) filter (where grade = 'C') as c_count,
  count(*) filter (where grade = 'D') as d_count,
  count(*) filter (where grade = 'F') as f_count,
  round(avg(score)::numeric, 1) as average_score,
  max(updated_at) as last_vote_at
from public.profile_scorecard_votes
group by target_type, target_id;

create or replace view public.profile_scorecard_summary_by_county as
select
  target_type,
  target_id,
  county,
  count(*) as total_votes,
  count(*) filter (where grade = 'A') as a_count,
  count(*) filter (where grade = 'B') as b_count,
  count(*) filter (where grade = 'C') as c_count,
  count(*) filter (where grade = 'D') as d_count,
  count(*) filter (where grade = 'F') as f_count,
  round(avg(score)::numeric, 1) as average_score,
  max(updated_at) as last_vote_at
from public.profile_scorecard_votes
group by target_type, target_id, county;

create or replace view public.profile_scorecard_summary_by_scope as
select
  target_type,
  target_id,
  voter_scope,
  count(*) as total_votes,
  count(*) filter (where grade = 'A') as a_count,
  count(*) filter (where grade = 'B') as b_count,
  count(*) filter (where grade = 'C') as c_count,
  count(*) filter (where grade = 'D') as d_count,
  count(*) filter (where grade = 'F') as f_count,
  round(avg(score)::numeric, 1) as average_score,
  count(*) filter (where would_vote_again = 'yes') as would_vote_again_yes,
  count(*) filter (where would_vote_again = 'no') as would_vote_again_no,
  count(*) filter (where voted_for_last_time = 'voted_for') as voted_for_last_time_yes,
  count(*) filter (where approval_after_vote = 'approve') as approval_after_vote_yes,
  count(*) filter (where approval_after_vote = 'disapprove') as approval_after_vote_no,
  max(updated_at) as last_vote_at
from public.profile_scorecard_votes
group by target_type, target_id, voter_scope;

create or replace view public.profile_scorecard_algorithm as
select
  target_type,
  target_id,
  target_name,
  target_path,
  total_votes,
  average_score,
  round(least(1.0, ln(total_votes + 1) / ln(26))::numeric, 2) as confidence_weight,
  round((average_score * least(1.0, ln(total_votes + 1) / ln(26)))::numeric, 1) as weighted_community_score,
  last_vote_at
from public.profile_scorecard_summary;

grant select on public.profile_scorecard_summary to anon, authenticated;
grant select on public.profile_scorecard_summary_by_county to anon, authenticated;
grant select on public.profile_scorecard_summary_by_scope to anon, authenticated;
grant select on public.profile_scorecard_algorithm to anon, authenticated;

drop trigger if exists set_profile_scorecard_votes_updated_at on public.profile_scorecard_votes;
create trigger set_profile_scorecard_votes_updated_at
  before update on public.profile_scorecard_votes
  for each row execute function public.handle_updated_at();
