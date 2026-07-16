-- RepWatchr performance grade and privacy-thresholded community sentiment v1.
--
-- Performance grades are immutable calculation snapshots in normal operation:
-- corrections create a new row and point supersedes_snapshot_id at the prior
-- row. Browser roles can read only reviewed, published snapshots. All writes
-- remain reserved for service_role-backed admin/scoring workflows.
--
-- Community sentiment is intentionally separate from performance. Raw member
-- votes remain behind their existing owner-only RLS. A trusted aggregation job
-- writes reviewed aggregate snapshots here; the public view applies the n >= 25
-- privacy gate and Bayesian shrinkage toward neutral 50 with k = 50.

begin;

create table public.performance_grade_snapshots (
  id uuid primary key default gen_random_uuid(),
  official_id text not null,
  person_id uuid references public.civic_people(id) on delete restrict,
  office_term_id uuid references public.civic_office_terms(id) on delete restrict,
  supersedes_snapshot_id uuid references public.performance_grade_snapshots(id) on delete restrict,
  target_name text not null,
  target_path text not null,
  role_template text not null,
  methodology_version text not null default 'performance-grade-v1',
  methodology_reference text not null default 'docs/PERFORMANCE_GRADE_METHOD_V1.md',
  result_state text not null default 'insufficient',
  overall_score numeric(5,2),
  letter_grade text,
  planned_weight_pct numeric(5,2) not null default 100,
  scoreable_weight_pct numeric(5,2) not null default 0,
  weighted_coverage_pct numeric(5,2) not null default 0,
  confidence_pct numeric(5,2) not null default 0,
  scoreable_category_count smallint not null default 0,
  ethics_category_scoreable boolean not null default false,
  category_scores jsonb not null default '{}'::jsonb,
  source_manifest jsonb not null default '[]'::jsonb,
  calculation_details jsonb not null default '{}'::jsonb,
  period_start date not null,
  period_end date not null,
  calculated_at timestamptz not null default now(),
  review_state text not null default 'draft',
  publication_state text not null default 'private',
  reviewed_at timestamptz,
  reviewed_by uuid,
  published_at timestamptz,
  appeal_state text not null default 'none',
  response_received_at timestamptz,
  appeal_resolved_at timestamptz,
  public_note text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint performance_grade_official_id_check
    check (char_length(btrim(official_id)) between 1 and 200),
  constraint performance_grade_target_name_check
    check (char_length(btrim(target_name)) between 1 and 240),
  constraint performance_grade_target_path_check
    check (target_path ~ '^/[^[:space:]]*$'),
  constraint performance_grade_role_template_check
    check (role_template in ('legislator', 'executive', 'local_board', 'judicial', 'other')),
  constraint performance_grade_methodology_version_check
    check (methodology_version ~ '^[a-z0-9]+([._-][a-z0-9]+)*$'),
  constraint performance_grade_result_state_check
    check (result_state in ('full_grade', 'provisional', 'insufficient')),
  constraint performance_grade_score_range_check
    check (overall_score is null or overall_score between 0 and 100),
  constraint performance_grade_letter_check
    check (letter_grade is null or letter_grade in ('A', 'B', 'C', 'D', 'F')),
  constraint performance_grade_percent_ranges_check
    check (
      planned_weight_pct between 0 and 100
      and scoreable_weight_pct between 0 and 100
      and weighted_coverage_pct between 0 and 100
      and confidence_pct between 0 and 100
      and scoreable_weight_pct <= planned_weight_pct
    ),
  constraint performance_grade_category_count_check
    check (scoreable_category_count between 0 and 5),
  constraint performance_grade_json_shapes_check
    check (
      jsonb_typeof(category_scores) = 'object'
      and jsonb_typeof(source_manifest) = 'array'
      and jsonb_typeof(calculation_details) = 'object'
    ),
  constraint performance_grade_period_check
    check (period_end >= period_start),
  constraint performance_grade_review_state_check
    check (review_state in ('draft', 'needs_review', 'verified', 'disputed', 'rejected')),
  constraint performance_grade_publication_state_check
    check (publication_state in ('private', 'staged', 'published', 'withdrawn', 'archived')),
  constraint performance_grade_appeal_state_check
    check (appeal_state in ('none', 'notice_sent', 'response_received', 'under_appeal', 'resolved', 'corrected')),
  constraint performance_grade_not_self_superseding_check
    check (supersedes_snapshot_id is null or supersedes_snapshot_id <> id),
  constraint performance_grade_result_gate_check
    check (
      (
        result_state = 'full_grade'
        and overall_score is not null
        and letter_grade is not null
        and scoreable_weight_pct >= 80
        and weighted_coverage_pct >= 70
        and confidence_pct >= 65
        and scoreable_category_count >= 4
        and ethics_category_scoreable = true
      )
      or
      (
        result_state = 'provisional'
        and overall_score is not null
        and letter_grade is null
        and scoreable_weight_pct >= 60
        and confidence_pct >= 45
      )
      or
      (
        result_state = 'insufficient'
        and overall_score is null
        and letter_grade is null
      )
    ),
  constraint performance_grade_letter_matches_score_check
    check (
      letter_grade is null
      or letter_grade = case
        when overall_score >= 90 then 'A'
        when overall_score >= 80 then 'B'
        when overall_score >= 70 then 'C'
        when overall_score >= 60 then 'D'
        else 'F'
      end
    ),
  constraint performance_grade_publishable_check
    check (
      publication_state <> 'published'
      or (
        review_state = 'verified'
        and reviewed_at is not null
        and reviewed_by is not null
        and published_at is not null
        and calculated_at is not null
      )
    )
);

create index performance_grade_snapshots_official_idx
  on public.performance_grade_snapshots (official_id, calculated_at desc);
create index performance_grade_snapshots_person_idx
  on public.performance_grade_snapshots (person_id, calculated_at desc)
  where person_id is not null;
create index performance_grade_snapshots_term_idx
  on public.performance_grade_snapshots (office_term_id, calculated_at desc)
  where office_term_id is not null;
create index performance_grade_snapshots_public_idx
  on public.performance_grade_snapshots (official_id, methodology_version, published_at desc)
  where publication_state = 'published' and review_state = 'verified';
create unique index performance_grade_snapshots_supersedes_uidx
  on public.performance_grade_snapshots (supersedes_snapshot_id)
  where supersedes_snapshot_id is not null;

create trigger set_performance_grade_snapshots_updated_at
before update on public.performance_grade_snapshots
for each row execute function private.set_civic_updated_at();

alter table public.performance_grade_snapshots enable row level security;
alter table public.performance_grade_snapshots force row level security;

create policy "Public can read published performance grade snapshots"
  on public.performance_grade_snapshots for select
  to anon, authenticated
  using (
    publication_state = 'published'
    and review_state = 'verified'
    and published_at is not null
    and published_at <= now()
  );

revoke all on table public.performance_grade_snapshots from public, anon, authenticated;
grant select on table public.performance_grade_snapshots to anon, authenticated;
grant all privileges on table public.performance_grade_snapshots to service_role;

comment on table public.performance_grade_snapshots is
  'Versioned, reviewed RepWatchr job-performance snapshots. Community sentiment and ideological alignment are excluded.';
comment on column public.performance_grade_snapshots.source_manifest is
  'Published evidence identifiers and source metadata sufficient to reproduce the snapshot.';
comment on column public.performance_grade_snapshots.calculation_details is
  'Expected and observed denominators, exclusions, effective weights, and other reproducibility inputs.';

create table public.community_sentiment_snapshots (
  id uuid primary key default gen_random_uuid(),
  supersedes_snapshot_id uuid references public.community_sentiment_snapshots(id) on delete restrict,
  target_type text not null,
  target_id text not null,
  target_name text not null,
  target_path text not null,
  voter_scope text not null default 'in_district',
  methodology_version text not null default 'community-sentiment-v1',
  sample_window_start timestamptz not null,
  sample_window_end timestamptz not null,
  eligible_vote_count integer not null,
  excluded_vote_count integer not null default 0,
  a_count integer not null default 0,
  b_count integer not null default 0,
  c_count integer not null default 0,
  d_count integer not null default 0,
  f_count integer not null default 0,
  last_vote_at timestamptz,
  aggregation_run_id text not null,
  anomaly_state text not null default 'clear',
  review_state text not null default 'draft',
  publication_state text not null default 'private',
  reviewed_at timestamptz,
  reviewed_by uuid,
  published_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_sentiment_target_type_check
    check (target_type ~ '^[a-z][a-z0-9_]{0,79}$'),
  constraint community_sentiment_target_id_check
    check (char_length(btrim(target_id)) between 1 and 200),
  constraint community_sentiment_target_name_check
    check (char_length(btrim(target_name)) between 1 and 240),
  constraint community_sentiment_target_path_check
    check (target_path ~ '^/[^[:space:]]*$'),
  constraint community_sentiment_scope_check
    check (voter_scope in ('in_district', 'in_state', 'out_of_district', 'out_of_state', 'verified_unknown')),
  constraint community_sentiment_methodology_version_check
    check (methodology_version ~ '^[a-z0-9]+([._-][a-z0-9]+)*$'),
  constraint community_sentiment_window_check
    check (sample_window_end >= sample_window_start),
  constraint community_sentiment_counts_nonnegative_check
    check (
      eligible_vote_count >= 0
      and excluded_vote_count >= 0
      and a_count >= 0
      and b_count >= 0
      and c_count >= 0
      and d_count >= 0
      and f_count >= 0
    ),
  constraint community_sentiment_counts_total_check
    check (eligible_vote_count = a_count + b_count + c_count + d_count + f_count),
  constraint community_sentiment_last_vote_check
    check (
      last_vote_at is null
      or (last_vote_at >= sample_window_start and last_vote_at <= sample_window_end)
    ),
  constraint community_sentiment_anomaly_state_check
    check (anomaly_state in ('clear', 'reviewed', 'blocked')),
  constraint community_sentiment_review_state_check
    check (review_state in ('draft', 'needs_review', 'verified', 'disputed', 'rejected')),
  constraint community_sentiment_publication_state_check
    check (publication_state in ('private', 'staged', 'published', 'withdrawn', 'archived')),
  constraint community_sentiment_not_self_superseding_check
    check (supersedes_snapshot_id is null or supersedes_snapshot_id <> id),
  constraint community_sentiment_publishable_check
    check (
      publication_state <> 'published'
      or (
        review_state = 'verified'
        and anomaly_state in ('clear', 'reviewed')
        and eligible_vote_count >= 25
        and reviewed_at is not null
        and reviewed_by is not null
        and published_at is not null
      )
    )
);

create index community_sentiment_snapshots_target_idx
  on public.community_sentiment_snapshots (
    target_type,
    target_id,
    voter_scope,
    sample_window_end desc
  );
create index community_sentiment_snapshots_public_idx
  on public.community_sentiment_snapshots (target_type, target_id, published_at desc)
  where publication_state = 'published' and review_state = 'verified';
create unique index community_sentiment_snapshots_run_uidx
  on public.community_sentiment_snapshots (
    target_type,
    target_id,
    voter_scope,
    methodology_version,
    aggregation_run_id
  );
create unique index community_sentiment_snapshots_supersedes_uidx
  on public.community_sentiment_snapshots (supersedes_snapshot_id)
  where supersedes_snapshot_id is not null;

create trigger set_community_sentiment_snapshots_updated_at
before update on public.community_sentiment_snapshots
for each row execute function private.set_civic_updated_at();

alter table public.community_sentiment_snapshots enable row level security;
alter table public.community_sentiment_snapshots force row level security;

create policy "Public can read thresholded community sentiment snapshots"
  on public.community_sentiment_snapshots for select
  to anon, authenticated
  using (
    publication_state = 'published'
    and review_state = 'verified'
    and anomaly_state in ('clear', 'reviewed')
    and eligible_vote_count >= 25
    and published_at is not null
    and published_at <= now()
  );

revoke all on table public.community_sentiment_snapshots from public, anon, authenticated;
grant select on table public.community_sentiment_snapshots to anon, authenticated;
grant all privileges on table public.community_sentiment_snapshots to service_role;

create or replace view public.community_sentiment_public
with (security_barrier = true, security_invoker = true)
as
select
  snapshot.id,
  snapshot.target_type,
  snapshot.target_id,
  snapshot.target_name,
  snapshot.target_path,
  snapshot.voter_scope,
  snapshot.methodology_version,
  snapshot.sample_window_start,
  snapshot.sample_window_end,
  snapshot.eligible_vote_count as sample_size,
  snapshot.excluded_vote_count,
  snapshot.a_count,
  snapshot.b_count,
  snapshot.c_count,
  snapshot.d_count,
  snapshot.f_count,
  round(
    (
      100 * snapshot.a_count
      + 80 * snapshot.b_count
      + 60 * snapshot.c_count
      + 40 * snapshot.d_count
    )::numeric / snapshot.eligible_vote_count,
    1
  ) as raw_average_score,
  round(
    (
      100 * snapshot.a_count
      + 80 * snapshot.b_count
      + 60 * snapshot.c_count
      + 40 * snapshot.d_count
      + 50 * 50
    )::numeric / (snapshot.eligible_vote_count + 50),
    1
  ) as bayesian_score,
  50::integer as prior_mean,
  50::integer as prior_weight,
  25::integer as public_sample_gate,
  snapshot.last_vote_at,
  snapshot.published_at,
  'RepWatchr verified participant sentiment - not an election or scientific poll.'::text as public_label
from public.community_sentiment_snapshots snapshot
where snapshot.publication_state = 'published'
  and snapshot.review_state = 'verified'
  and snapshot.anomaly_state in ('clear', 'reviewed')
  and snapshot.eligible_vote_count >= 25
  and snapshot.published_at is not null
  and snapshot.published_at <= now();

revoke all on table public.community_sentiment_public from public, anon, authenticated;
grant select on table public.community_sentiment_public to anon, authenticated, service_role;

comment on table public.community_sentiment_snapshots is
  'Reviewed aggregate member-sentiment snapshots only; contains no member identity or raw vote rows.';
comment on view public.community_sentiment_public is
  'Public n>=25 participant sentiment with a neutral prior mean of 50 and k=50; excluded from performance grades.';

-- Keep the legacy logarithmic scorecard aggregate server-only. New public UI
-- must use community_sentiment_public and must not present the legacy weighted
-- score as either performance or representative opinion.
revoke all on table public.profile_scorecard_algorithm from public, anon, authenticated;
grant select on table public.profile_scorecard_algorithm to service_role;

-- ---------------------------------------------------------------------------
-- Comment ranking integrity.
--
-- public.comments and the legacy claim/role tables currently live in root SQL
-- setup files rather than the timestamped migration chain. Define the trusted
-- derivation function now, but install its trigger only when the full enhanced
-- comments shape is present. This fails closed instead of inventing a partial
-- comments schema. The dynamic role lookup also fails closed when claims have
-- not been installed: no caller receives a claimed-official or journalist tier.
-- ---------------------------------------------------------------------------

create or replace function private.repw_enforce_comment_integrity()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  has_claimed_official boolean := false;
  has_journalist_claim boolean := false;
  has_verified_profile boolean := false;
  source_is_valid boolean := false;
begin
  -- A trusted role row alone is not enough for an authority badge. Require an
  -- approved claim as well, and require claimed officials to match the target.
  if to_regclass('public.user_roles') is not null
     and to_regclass('public.profile_claims') is not null then
    begin
      execute $query$
        select
          exists (
            select 1
            from public.user_roles role_row
            join public.profile_claims claim
              on claim.user_id = role_row.user_id
            where role_row.user_id = $1
              and role_row.role = 'claimed_official'
              and claim.status = 'approved'
              and claim.profile_id = $2
              and claim.profile_type in (
                'official', 'school_board', 'sheriff', 'police_chief',
                'public_safety_official'
              )
          ),
          exists (
            select 1
            from public.user_roles role_row
            join public.profile_claims claim
              on claim.user_id = role_row.user_id
            where role_row.user_id = $1
              and role_row.role = 'journalist'
              and claim.status = 'approved'
              and claim.profile_type = 'journalist'
          )
      $query$
      into has_claimed_official, has_journalist_claim
      using new.user_id, new.official_id;
    exception
      when undefined_table or undefined_column then
        has_claimed_official := false;
        has_journalist_claim := false;
    end;
  end if;

  select exists (
    select 1
    from public.profiles profile
    where profile.user_id = new.user_id
      and profile.verified = true
      and profile.verification_status = 'verified'
      and profile.verified_at is not null
      and profile.geography_verified_at is not null
  )
  into has_verified_profile;

  new.author_type := case
    when has_claimed_official then 'claimed_official'
    when has_journalist_claim then 'journalist'
    when has_verified_profile then 'verified_resident'
    else 'signed_in'
  end;

  source_is_valid := new.source_url is not null
    and char_length(btrim(new.source_url)) between 10 and 2048
    and btrim(new.source_url) ~* '^https?://[^[:space:]/?#]+([/?#][^[:space:]]*)?$';

  if source_is_valid then
    new.source_url := btrim(new.source_url);
    new.contains_source := true;
  else
    new.source_url := null;
    new.contains_source := false;
  end if;

  new.rank_score := least(
    100,
    case new.author_type
      when 'claimed_official' then 95
      when 'verified_parent' then 85
      when 'verified_resident' then 80
      when 'journalist' then 75
      when 'signed_in' then 45
      else 25
    end
    + case when new.contains_source then 10 else 0 end
  );

  return new;
end;
$$;

revoke all on function private.repw_enforce_comment_integrity() from public, anon, authenticated;

do $$
declare
  enhanced_comment_column_count integer;
begin
  if to_regclass('public.comments') is null then
    raise notice
      'Comment integrity trigger not installed: public.comments is not in the canonical migration chain yet.';
  else
    select count(*)
      into enhanced_comment_column_count
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'comments'
      and column_name in (
        'user_id', 'official_id', 'author_type', 'rank_score',
        'contains_source', 'source_url'
      );

    if enhanced_comment_column_count <> 6 then
      raise notice
        'Comment integrity trigger not installed: public.comments lacks one or more required ranking columns.';
    else
      execute 'drop trigger if exists set_comments_rank_score on public.comments';
      execute 'drop trigger if exists repw_enforce_comment_integrity on public.comments';
      execute $trigger$
        create trigger repw_enforce_comment_integrity
        before insert or update on public.comments
        for each row execute function private.repw_enforce_comment_integrity()
      $trigger$;

      -- Re-derive legacy client-supplied ranking fields immediately. Existing
      -- updated_at maintenance may record this security backfill as an update.
      execute 'update public.comments set rank_score = rank_score';
    end if;
  end if;
end;
$$;

commit;
