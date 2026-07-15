-- RepWatchr canonical civic and evidence foundation.
--
-- This migration is intentionally additive. Existing public.races,
-- public.race_candidates, public.race_sources, and public.profile_claims are
-- legacy application tables with incompatible meanings and state models, so
-- the canonical tables use a civic_ prefix. This migration does not copy,
-- publish, or otherwise trust data from those legacy tables.
--
-- Browser roles receive read-only grants and RLS limits them to reviewed,
-- published rows. All writes are reserved for service_role-backed server/admin
-- workflows, which must perform their own authenticated admin authorization and
-- write a civic_audit_events row in the same transaction.

begin;

create extension if not exists pgcrypto;
create schema if not exists private;

create or replace function private.set_civic_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_civic_updated_at() from public;

-- This helper is read-only and fails closed if the legacy user_roles table is
-- not present. It permits admins to inspect unpublished rows, but grants and
-- policies below still prohibit direct authenticated writes.
create or replace function private.is_civic_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  current_user_id uuid;
  result boolean := false;
begin
  current_user_id := auth.uid();

  if current_user_id is null or to_regclass('public.user_roles') is null then
    return false;
  end if;

  execute
    'select exists (
       select 1
       from public.user_roles
       where user_id = $1 and role = ''admin''
     )'
    into result
    using current_user_id;

  return coalesce(result, false);
end;
$$;

revoke all on function private.is_civic_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_civic_admin() to authenticated;

create table public.civic_jurisdictions (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.civic_jurisdictions(id) on delete restrict,
  slug text not null,
  name text not null,
  jurisdiction_type text not null,
  country_code text not null default 'US',
  state_code text,
  external_ids jsonb not null default '{}'::jsonb,
  review_state text not null default 'draft',
  publication_state text not null default 'private',
  reviewed_at timestamptz,
  reviewed_by uuid,
  published_at timestamptz,
  created_by uuid,
  updated_by uuid,
  provenance jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint civic_jurisdictions_slug_check
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint civic_jurisdictions_type_check
    check (jurisdiction_type in (
      'country', 'state', 'county', 'city', 'district', 'school_district',
      'special_district', 'other'
    )),
  constraint civic_jurisdictions_country_code_check
    check (country_code ~ '^[A-Z]{2}$'),
  constraint civic_jurisdictions_state_code_check
    check (state_code is null or state_code ~ '^[A-Z]{2}$'),
  constraint civic_jurisdictions_review_state_check
    check (review_state in (
      'draft', 'imported', 'needs_review', 'verified', 'disputed', 'rejected'
    )),
  constraint civic_jurisdictions_publication_state_check
    check (publication_state in (
      'private', 'staged', 'published', 'withdrawn', 'archived'
    )),
  constraint civic_jurisdictions_provenance_object_check
    check (jsonb_typeof(provenance) = 'object'),
  constraint civic_jurisdictions_metadata_object_check
    check (jsonb_typeof(metadata) = 'object'),
  constraint civic_jurisdictions_not_self_parent_check
    check (parent_id is null or parent_id <> id)
);

create unique index civic_jurisdictions_parent_slug_uidx
  on public.civic_jurisdictions (
    coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid),
    slug
  );

create table public.civic_source_records (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid references public.civic_jurisdictions(id) on delete set null,
  supersedes_source_id uuid references public.civic_source_records(id) on delete restrict,
  canonical_url text not null,
  title text not null,
  publisher text not null,
  issuing_authority text,
  source_type text not null,
  is_primary_source boolean not null default false,
  access_level text not null default 'public',
  issued_at timestamptz,
  retrieved_at timestamptz not null,
  content_hash text,
  snapshot_storage_path text,
  mime_type text,
  review_state text not null default 'draft',
  publication_state text not null default 'private',
  reviewed_at timestamptz,
  reviewed_by uuid,
  published_at timestamptz,
  created_by uuid,
  updated_by uuid,
  provenance jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint civic_source_records_url_check
    check (canonical_url ~* '^https?://'),
  constraint civic_source_records_type_check
    check (source_type in (
      'election_authority', 'government_record', 'legislation',
      'legislative_vote', 'campaign_finance_filing', 'court_record',
      'meeting_record', 'public_statement', 'campaign_controlled',
      'journalism', 'transcript', 'user_submission', 'other'
    )),
  constraint civic_source_records_access_level_check
    check (access_level in ('public', 'restricted', 'private')),
  constraint civic_source_records_hash_check
    check (content_hash is null or content_hash ~ '^[a-f0-9]{64}$'),
  constraint civic_source_records_review_state_check
    check (review_state in (
      'draft', 'imported', 'needs_review', 'verified', 'disputed', 'rejected'
    )),
  constraint civic_source_records_publication_state_check
    check (publication_state in (
      'private', 'staged', 'published', 'withdrawn', 'archived'
    )),
  constraint civic_source_records_publishable_check
    check (
      publication_state <> 'published'
      or (
        review_state = 'verified'
        and access_level = 'public'
        and reviewed_at is not null
        and reviewed_by is not null
        and published_at is not null
      )
    ),
  constraint civic_source_records_provenance_object_check
    check (jsonb_typeof(provenance) = 'object'),
  constraint civic_source_records_metadata_object_check
    check (jsonb_typeof(metadata) = 'object'),
  constraint civic_source_records_not_self_superseding_check
    check (supersedes_source_id is null or supersedes_source_id <> id)
);

alter table public.civic_jurisdictions
  add column primary_source_record_id uuid
    references public.civic_source_records(id) on delete restrict;

alter table public.civic_jurisdictions
  add constraint civic_jurisdictions_publishable_check
  check (
    publication_state <> 'published'
    or (
      review_state = 'verified'
      and reviewed_at is not null
      and reviewed_by is not null
      and published_at is not null
      and primary_source_record_id is not null
    )
  );

create table public.civic_people (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  given_name text,
  middle_name text,
  family_name text,
  suffix text,
  sortable_name text,
  image_url text,
  external_ids jsonb not null default '{}'::jsonb,
  primary_source_record_id uuid not null
    references public.civic_source_records(id) on delete restrict,
  review_state text not null default 'draft',
  publication_state text not null default 'private',
  reviewed_at timestamptz,
  reviewed_by uuid,
  published_at timestamptz,
  created_by uuid,
  updated_by uuid,
  provenance jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint civic_people_slug_check
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint civic_people_image_url_check
    check (image_url is null or image_url ~* '^https?://'),
  constraint civic_people_review_state_check
    check (review_state in (
      'draft', 'imported', 'needs_review', 'verified', 'disputed', 'rejected'
    )),
  constraint civic_people_publication_state_check
    check (publication_state in (
      'private', 'staged', 'published', 'withdrawn', 'archived'
    )),
  constraint civic_people_publishable_check
    check (
      publication_state <> 'published'
      or (
        review_state = 'verified'
        and reviewed_at is not null
        and reviewed_by is not null
        and published_at is not null
      )
    ),
  constraint civic_people_external_ids_object_check
    check (jsonb_typeof(external_ids) = 'object'),
  constraint civic_people_provenance_object_check
    check (jsonb_typeof(provenance) = 'object'),
  constraint civic_people_metadata_object_check
    check (jsonb_typeof(metadata) = 'object')
);

create table public.civic_offices (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null
    references public.civic_jurisdictions(id) on delete restrict,
  slug text not null,
  name text not null,
  office_type text not null,
  government_level text not null,
  branch text,
  district_label text,
  seat_label text,
  is_elected boolean not null default true,
  primary_source_record_id uuid not null
    references public.civic_source_records(id) on delete restrict,
  review_state text not null default 'draft',
  publication_state text not null default 'private',
  reviewed_at timestamptz,
  reviewed_by uuid,
  published_at timestamptz,
  created_by uuid,
  updated_by uuid,
  provenance jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint civic_offices_slug_check
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint civic_offices_type_check
    check (office_type in (
      'executive', 'legislative', 'judicial', 'school_board',
      'party_office', 'administrative', 'other'
    )),
  constraint civic_offices_level_check
    check (government_level in (
      'federal', 'state', 'county', 'municipal', 'school_district',
      'special_district', 'party', 'other'
    )),
  constraint civic_offices_branch_check
    check (branch is null or branch in (
      'executive', 'legislative', 'judicial', 'administrative', 'other'
    )),
  constraint civic_offices_review_state_check
    check (review_state in (
      'draft', 'imported', 'needs_review', 'verified', 'disputed', 'rejected'
    )),
  constraint civic_offices_publication_state_check
    check (publication_state in (
      'private', 'staged', 'published', 'withdrawn', 'archived'
    )),
  constraint civic_offices_publishable_check
    check (
      publication_state <> 'published'
      or (
        review_state = 'verified'
        and reviewed_at is not null
        and reviewed_by is not null
        and published_at is not null
      )
    ),
  constraint civic_offices_provenance_object_check
    check (jsonb_typeof(provenance) = 'object'),
  constraint civic_offices_metadata_object_check
    check (jsonb_typeof(metadata) = 'object'),
  unique (jurisdiction_id, slug)
);

create table public.civic_elections (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null
    references public.civic_jurisdictions(id) on delete restrict,
  slug text not null,
  name text not null,
  election_type text not null,
  cycle text not null,
  election_date date not null,
  filing_deadline timestamptz,
  timezone text not null default 'America/Chicago',
  election_status text not null default 'scheduled',
  primary_source_record_id uuid not null
    references public.civic_source_records(id) on delete restrict,
  review_state text not null default 'draft',
  publication_state text not null default 'private',
  reviewed_at timestamptz,
  reviewed_by uuid,
  published_at timestamptz,
  created_by uuid,
  updated_by uuid,
  provenance jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint civic_elections_slug_check
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint civic_elections_type_check
    check (election_type in (
      'primary', 'runoff', 'general', 'special', 'local',
      'nonpartisan', 'party_office', 'other'
    )),
  constraint civic_elections_status_check
    check (election_status in (
      'scheduled', 'filing', 'ballot_set', 'voting',
      'unofficial_results', 'certified', 'cancelled'
    )),
  constraint civic_elections_review_state_check
    check (review_state in (
      'draft', 'imported', 'needs_review', 'verified', 'disputed', 'rejected'
    )),
  constraint civic_elections_publication_state_check
    check (publication_state in (
      'private', 'staged', 'published', 'withdrawn', 'archived'
    )),
  constraint civic_elections_publishable_check
    check (
      publication_state <> 'published'
      or (
        review_state = 'verified'
        and reviewed_at is not null
        and reviewed_by is not null
        and published_at is not null
      )
    ),
  constraint civic_elections_provenance_object_check
    check (jsonb_typeof(provenance) = 'object'),
  constraint civic_elections_metadata_object_check
    check (jsonb_typeof(metadata) = 'object'),
  unique (jurisdiction_id, slug)
);

create table public.civic_races (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null
    references public.civic_elections(id) on delete restrict,
  office_id uuid references public.civic_offices(id) on delete restrict,
  slug text not null,
  name text not null,
  race_type text not null,
  seat_label text,
  district_label text,
  race_status text not null default 'upcoming',
  primary_source_record_id uuid not null
    references public.civic_source_records(id) on delete restrict,
  legacy_key text,
  review_state text not null default 'draft',
  publication_state text not null default 'private',
  reviewed_at timestamptz,
  reviewed_by uuid,
  published_at timestamptz,
  created_by uuid,
  updated_by uuid,
  provenance jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint civic_races_slug_check
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint civic_races_type_check
    check (race_type in (
      'office', 'judicial_retention', 'party_office', 'ballot_measure', 'other'
    )),
  constraint civic_races_office_check
    check (race_type = 'ballot_measure' or office_id is not null),
  constraint civic_races_status_check
    check (race_status in (
      'upcoming', 'filing', 'ballot_set', 'voting',
      'unofficial_results', 'certified', 'cancelled'
    )),
  constraint civic_races_review_state_check
    check (review_state in (
      'draft', 'imported', 'needs_review', 'verified', 'disputed', 'rejected'
    )),
  constraint civic_races_publication_state_check
    check (publication_state in (
      'private', 'staged', 'published', 'withdrawn', 'archived'
    )),
  constraint civic_races_publishable_check
    check (
      publication_state <> 'published'
      or (
        review_state = 'verified'
        and reviewed_at is not null
        and reviewed_by is not null
        and published_at is not null
      )
    ),
  constraint civic_races_provenance_object_check
    check (jsonb_typeof(provenance) = 'object'),
  constraint civic_races_metadata_object_check
    check (jsonb_typeof(metadata) = 'object'),
  unique (election_id, slug)
);

create table public.civic_candidacies (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null
    references public.civic_races(id) on delete restrict,
  person_id uuid not null
    references public.civic_people(id) on delete restrict,
  ballot_name text not null,
  party_label text,
  incumbent boolean not null default false,
  ballot_status text not null default 'needs_source',
  announced_at date,
  filed_at date,
  status_effective_at date,
  campaign_url text,
  primary_source_record_id uuid not null
    references public.civic_source_records(id) on delete restrict,
  legacy_key text,
  review_state text not null default 'draft',
  publication_state text not null default 'private',
  reviewed_at timestamptz,
  reviewed_by uuid,
  published_at timestamptz,
  created_by uuid,
  updated_by uuid,
  provenance jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint civic_candidacies_ballot_status_check
    check (ballot_status in (
      'needs_source', 'announced', 'filed', 'qualified', 'withdrawn',
      'disqualified', 'lost_primary', 'winner'
    )),
  constraint civic_candidacies_campaign_url_check
    check (campaign_url is null or campaign_url ~* '^https?://'),
  constraint civic_candidacies_review_state_check
    check (review_state in (
      'draft', 'imported', 'needs_review', 'verified', 'disputed', 'rejected'
    )),
  constraint civic_candidacies_publication_state_check
    check (publication_state in (
      'private', 'staged', 'published', 'withdrawn', 'archived'
    )),
  constraint civic_candidacies_publishable_check
    check (
      publication_state <> 'published'
      or (
        review_state = 'verified'
        and reviewed_at is not null
        and reviewed_by is not null
        and published_at is not null
      )
    ),
  constraint civic_candidacies_provenance_object_check
    check (jsonb_typeof(provenance) = 'object'),
  constraint civic_candidacies_metadata_object_check
    check (jsonb_typeof(metadata) = 'object'),
  unique (race_id, person_id)
);

create table public.civic_office_terms (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null
    references public.civic_people(id) on delete restrict,
  office_id uuid not null
    references public.civic_offices(id) on delete restrict,
  election_id uuid references public.civic_elections(id) on delete set null,
  term_start date,
  term_end date,
  term_status text not null default 'unknown',
  selection_method text not null default 'unknown',
  primary_source_record_id uuid not null
    references public.civic_source_records(id) on delete restrict,
  review_state text not null default 'draft',
  publication_state text not null default 'private',
  reviewed_at timestamptz,
  reviewed_by uuid,
  published_at timestamptz,
  created_by uuid,
  updated_by uuid,
  provenance jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint civic_office_terms_dates_check
    check (term_end is null or term_start is null or term_end >= term_start),
  constraint civic_office_terms_status_check
    check (term_status in (
      'unknown', 'upcoming', 'active', 'completed', 'resigned', 'removed'
    )),
  constraint civic_office_terms_selection_check
    check (selection_method in (
      'unknown', 'elected', 'appointed', 'succession', 'acting'
    )),
  constraint civic_office_terms_review_state_check
    check (review_state in (
      'draft', 'imported', 'needs_review', 'verified', 'disputed', 'rejected'
    )),
  constraint civic_office_terms_publication_state_check
    check (publication_state in (
      'private', 'staged', 'published', 'withdrawn', 'archived'
    )),
  constraint civic_office_terms_publishable_check
    check (
      publication_state <> 'published'
      or (
        review_state = 'verified'
        and reviewed_at is not null
        and reviewed_by is not null
        and published_at is not null
      )
    ),
  constraint civic_office_terms_provenance_object_check
    check (jsonb_typeof(provenance) = 'object'),
  constraint civic_office_terms_metadata_object_check
    check (jsonb_typeof(metadata) = 'object')
);

create table public.civic_claims (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null,
  person_id uuid references public.civic_people(id) on delete restrict,
  jurisdiction_id uuid references public.civic_jurisdictions(id) on delete restrict,
  office_id uuid references public.civic_offices(id) on delete restrict,
  office_term_id uuid references public.civic_office_terms(id) on delete restrict,
  election_id uuid references public.civic_elections(id) on delete restrict,
  race_id uuid references public.civic_races(id) on delete restrict,
  candidacy_id uuid references public.civic_candidacies(id) on delete restrict,
  claim_type text not null,
  field_path text,
  statement text not null,
  value_json jsonb,
  effective_from timestamptz,
  effective_to timestamptz,
  claim_fingerprint text not null unique,
  review_state text not null default 'draft',
  publication_state text not null default 'private',
  reviewed_at timestamptz,
  reviewed_by uuid,
  published_at timestamptz,
  created_by uuid,
  updated_by uuid,
  provenance jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint civic_claims_subject_type_check
    check (subject_type in (
      'person', 'jurisdiction', 'office', 'office_term',
      'election', 'race', 'candidacy'
    )),
  constraint civic_claims_subject_check
    check (
      num_nonnulls(
        person_id, jurisdiction_id, office_id, office_term_id,
        election_id, race_id, candidacy_id
      ) = 1
      and (
        (subject_type = 'person' and person_id is not null)
        or (subject_type = 'jurisdiction' and jurisdiction_id is not null)
        or (subject_type = 'office' and office_id is not null)
        or (subject_type = 'office_term' and office_term_id is not null)
        or (subject_type = 'election' and election_id is not null)
        or (subject_type = 'race' and race_id is not null)
        or (subject_type = 'candidacy' and candidacy_id is not null)
      )
    ),
  constraint civic_claims_dates_check
    check (
      effective_to is null
      or effective_from is null
      or effective_to >= effective_from
    ),
  constraint civic_claims_fingerprint_check
    check (claim_fingerprint ~ '^[a-f0-9]{64}$'),
  constraint civic_claims_review_state_check
    check (review_state in (
      'draft', 'imported', 'needs_review', 'verified', 'disputed', 'rejected'
    )),
  constraint civic_claims_publication_state_check
    check (publication_state in (
      'private', 'staged', 'published', 'withdrawn', 'archived'
    )),
  constraint civic_claims_publishable_state_check
    check (
      publication_state <> 'published'
      or (
        review_state = 'verified'
        and reviewed_at is not null
        and reviewed_by is not null
        and published_at is not null
      )
    ),
  constraint civic_claims_provenance_object_check
    check (jsonb_typeof(provenance) = 'object'),
  constraint civic_claims_metadata_object_check
    check (jsonb_typeof(metadata) = 'object')
);

create table public.civic_claim_citations (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null
    references public.civic_claims(id) on delete cascade,
  source_record_id uuid not null
    references public.civic_source_records(id) on delete restrict,
  relationship text not null default 'supports',
  locator text,
  excerpt text,
  reviewer_note text,
  review_state text not null default 'draft',
  publication_state text not null default 'private',
  reviewed_at timestamptz,
  reviewed_by uuid,
  published_at timestamptz,
  created_by uuid,
  updated_by uuid,
  provenance jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint civic_claim_citations_relationship_check
    check (relationship in ('supports', 'contradicts', 'context')),
  constraint civic_claim_citations_review_state_check
    check (review_state in (
      'draft', 'imported', 'needs_review', 'verified', 'disputed', 'rejected'
    )),
  constraint civic_claim_citations_publication_state_check
    check (publication_state in (
      'private', 'staged', 'published', 'withdrawn', 'archived'
    )),
  constraint civic_claim_citations_publishable_check
    check (
      publication_state <> 'published'
      or (
        review_state = 'verified'
        and reviewed_at is not null
        and reviewed_by is not null
        and published_at is not null
      )
    ),
  constraint civic_claim_citations_provenance_object_check
    check (jsonb_typeof(provenance) = 'object'),
  constraint civic_claim_citations_metadata_object_check
    check (jsonb_typeof(metadata) = 'object')
);

create unique index civic_claim_citations_identity_uidx
  on public.civic_claim_citations (
    claim_id,
    source_record_id,
    relationship,
    coalesce(locator, '')
  );

create table public.civic_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  actor_type text not null default 'service',
  action text not null,
  record_table text not null,
  record_id uuid not null,
  request_id text,
  before_values jsonb not null default '{}'::jsonb,
  after_values jsonb not null default '{}'::jsonb,
  reason text,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint civic_audit_events_actor_type_check
    check (actor_type in ('admin', 'reviewer', 'service', 'ingestion', 'system')),
  constraint civic_audit_events_before_object_check
    check (jsonb_typeof(before_values) = 'object'),
  constraint civic_audit_events_after_object_check
    check (jsonb_typeof(after_values) = 'object'),
  constraint civic_audit_events_provenance_object_check
    check (jsonb_typeof(provenance) = 'object')
);

-- A public claim is invalid unless at least one public, reviewed citation and
-- source supports it. The constraint is deferred so a claim and its citation
-- can be published atomically in either insert order.
create or replace function private.assert_civic_claim_has_support()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_claim_id uuid;
  target_is_published boolean;
begin
  -- This function is shared by claims and citations, so read the transition
  -- records through JSON rather than assuming both tables have the same fields.
  -- Checking OLD as well as NEW prevents moving the last citation away from a
  -- published claim.
  for target_claim_id in
    select distinct candidate_id
    from unnest(
      case
        when tg_table_name = 'civic_claims' then array[
          (to_jsonb(new) ->> 'id')::uuid
        ]
        else array[
          (to_jsonb(new) ->> 'claim_id')::uuid,
          (to_jsonb(old) ->> 'claim_id')::uuid
        ]
      end
    ) as candidates(candidate_id)
    where candidate_id is not null
  loop
    select publication_state = 'published' and review_state = 'verified'
      into target_is_published
    from public.civic_claims
    where id = target_claim_id;

    if coalesce(target_is_published, false) and not exists (
      select 1
      from public.civic_claim_citations citation
      join public.civic_source_records source
        on source.id = citation.source_record_id
      where citation.claim_id = target_claim_id
        and citation.relationship = 'supports'
        and citation.review_state = 'verified'
        and citation.publication_state = 'published'
        and source.review_state = 'verified'
        and source.publication_state = 'published'
        and source.access_level = 'public'
    ) then
      raise exception
        'Published civic claim % requires a published supporting citation and public source',
        target_claim_id
        using errcode = '23514';
    end if;
  end loop;

  return null;
end;
$$;

revoke all on function private.assert_civic_claim_has_support() from public;

create constraint trigger civic_claims_require_support
after insert or update of review_state, publication_state
on public.civic_claims
deferrable initially deferred
for each row execute function private.assert_civic_claim_has_support();

create constraint trigger civic_claim_citations_preserve_support
after insert or update or delete
on public.civic_claim_citations
deferrable initially deferred
for each row execute function private.assert_civic_claim_has_support();

-- A source status/access change can invalidate a published claim without
-- touching its citation row, so check every published claim that cites it.
create or replace function private.assert_civic_source_dependents_supported()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_source_id uuid;
  dependent_claim_id uuid;
begin
  target_source_id := case when tg_op = 'DELETE' then old.id else new.id end;

  for dependent_claim_id in
    select distinct claim.id
    from public.civic_claims claim
    join public.civic_claim_citations citation on citation.claim_id = claim.id
    where citation.source_record_id = target_source_id
      and claim.review_state = 'verified'
      and claim.publication_state = 'published'
  loop
    if not exists (
      select 1
      from public.civic_claim_citations other_citation
      join public.civic_source_records other_source
        on other_source.id = other_citation.source_record_id
      where other_citation.claim_id = dependent_claim_id
        and other_citation.relationship = 'supports'
        and other_citation.review_state = 'verified'
        and other_citation.publication_state = 'published'
        and other_source.review_state = 'verified'
        and other_source.publication_state = 'published'
        and other_source.access_level = 'public'
    ) then
      raise exception
        'Source change would leave published civic claim % without public support',
        dependent_claim_id
        using errcode = '23514';
    end if;
  end loop;

  return null;
end;
$$;

revoke all on function private.assert_civic_source_dependents_supported() from public;

create constraint trigger civic_source_records_preserve_claim_support
after update of review_state, publication_state, access_level or delete
on public.civic_source_records
deferrable initially deferred
for each row execute function private.assert_civic_source_dependents_supported();

-- Query indexes.
create index civic_jurisdictions_state_idx
  on public.civic_jurisdictions (state_code, jurisdiction_type);
create index civic_jurisdictions_publication_idx
  on public.civic_jurisdictions (publication_state, review_state);
create index civic_source_records_url_idx
  on public.civic_source_records (canonical_url);
create index civic_source_records_hash_idx
  on public.civic_source_records (content_hash) where content_hash is not null;
create index civic_source_records_publication_idx
  on public.civic_source_records (publication_state, review_state, source_type);
create index civic_people_name_idx
  on public.civic_people (lower(display_name));
create index civic_people_publication_idx
  on public.civic_people (publication_state, review_state);
create index civic_offices_jurisdiction_idx
  on public.civic_offices (jurisdiction_id, office_type);
create index civic_offices_publication_idx
  on public.civic_offices (publication_state, review_state);
create index civic_elections_date_idx
  on public.civic_elections (election_date, jurisdiction_id);
create index civic_elections_publication_idx
  on public.civic_elections (publication_state, review_state);
create index civic_races_election_idx
  on public.civic_races (election_id, race_status);
create index civic_races_office_idx
  on public.civic_races (office_id) where office_id is not null;
create index civic_races_publication_idx
  on public.civic_races (publication_state, review_state);
create index civic_candidacies_race_idx
  on public.civic_candidacies (race_id, ballot_status);
create index civic_candidacies_person_idx
  on public.civic_candidacies (person_id);
create index civic_candidacies_publication_idx
  on public.civic_candidacies (publication_state, review_state);
create index civic_office_terms_person_idx
  on public.civic_office_terms (person_id, term_start desc);
create index civic_office_terms_office_idx
  on public.civic_office_terms (office_id, term_status);
create index civic_office_terms_publication_idx
  on public.civic_office_terms (publication_state, review_state);
create index civic_claims_person_idx
  on public.civic_claims (person_id, claim_type) where person_id is not null;
create index civic_claims_candidacy_idx
  on public.civic_claims (candidacy_id, claim_type) where candidacy_id is not null;
create index civic_claims_race_idx
  on public.civic_claims (race_id, claim_type) where race_id is not null;
create index civic_claims_publication_idx
  on public.civic_claims (publication_state, review_state, claim_type);
create index civic_claim_citations_claim_idx
  on public.civic_claim_citations (claim_id, publication_state);
create index civic_claim_citations_source_idx
  on public.civic_claim_citations (source_record_id);
create index civic_audit_events_record_idx
  on public.civic_audit_events (record_table, record_id, created_at desc);
create index civic_audit_events_actor_idx
  on public.civic_audit_events (actor_user_id, created_at desc)
  where actor_user_id is not null;
create index civic_audit_events_request_idx
  on public.civic_audit_events (request_id)
  where request_id is not null;

-- updated_at maintenance.
create trigger set_civic_jurisdictions_updated_at
before update on public.civic_jurisdictions
for each row execute function private.set_civic_updated_at();

create trigger set_civic_source_records_updated_at
before update on public.civic_source_records
for each row execute function private.set_civic_updated_at();

create trigger set_civic_people_updated_at
before update on public.civic_people
for each row execute function private.set_civic_updated_at();

create trigger set_civic_offices_updated_at
before update on public.civic_offices
for each row execute function private.set_civic_updated_at();

create trigger set_civic_elections_updated_at
before update on public.civic_elections
for each row execute function private.set_civic_updated_at();

create trigger set_civic_races_updated_at
before update on public.civic_races
for each row execute function private.set_civic_updated_at();

create trigger set_civic_candidacies_updated_at
before update on public.civic_candidacies
for each row execute function private.set_civic_updated_at();

create trigger set_civic_office_terms_updated_at
before update on public.civic_office_terms
for each row execute function private.set_civic_updated_at();

create trigger set_civic_claims_updated_at
before update on public.civic_claims
for each row execute function private.set_civic_updated_at();

create trigger set_civic_claim_citations_updated_at
before update on public.civic_claim_citations
for each row execute function private.set_civic_updated_at();

-- Defense-in-depth RLS. service_role retains BYPASSRLS; browser roles can only
-- select public rows or, for admins, inspect the review backlog.
alter table public.civic_jurisdictions enable row level security;
alter table public.civic_jurisdictions force row level security;
alter table public.civic_source_records enable row level security;
alter table public.civic_source_records force row level security;
alter table public.civic_people enable row level security;
alter table public.civic_people force row level security;
alter table public.civic_offices enable row level security;
alter table public.civic_offices force row level security;
alter table public.civic_elections enable row level security;
alter table public.civic_elections force row level security;
alter table public.civic_races enable row level security;
alter table public.civic_races force row level security;
alter table public.civic_candidacies enable row level security;
alter table public.civic_candidacies force row level security;
alter table public.civic_office_terms enable row level security;
alter table public.civic_office_terms force row level security;
alter table public.civic_claims enable row level security;
alter table public.civic_claims force row level security;
alter table public.civic_claim_citations enable row level security;
alter table public.civic_claim_citations force row level security;
alter table public.civic_audit_events enable row level security;
alter table public.civic_audit_events force row level security;

revoke all on table public.civic_jurisdictions from public, anon, authenticated;
revoke all on table public.civic_source_records from public, anon, authenticated;
revoke all on table public.civic_people from public, anon, authenticated;
revoke all on table public.civic_offices from public, anon, authenticated;
revoke all on table public.civic_elections from public, anon, authenticated;
revoke all on table public.civic_races from public, anon, authenticated;
revoke all on table public.civic_candidacies from public, anon, authenticated;
revoke all on table public.civic_office_terms from public, anon, authenticated;
revoke all on table public.civic_claims from public, anon, authenticated;
revoke all on table public.civic_claim_citations from public, anon, authenticated;
revoke all on table public.civic_audit_events from public, anon, authenticated;

grant select on table public.civic_jurisdictions to anon, authenticated;
grant select on table public.civic_source_records to anon, authenticated;
grant select on table public.civic_people to anon, authenticated;
grant select on table public.civic_offices to anon, authenticated;
grant select on table public.civic_elections to anon, authenticated;
grant select on table public.civic_races to anon, authenticated;
grant select on table public.civic_candidacies to anon, authenticated;
grant select on table public.civic_office_terms to anon, authenticated;
grant select on table public.civic_claims to anon, authenticated;
grant select on table public.civic_claim_citations to anon, authenticated;
grant select on table public.civic_audit_events to authenticated;

grant all on table public.civic_jurisdictions to service_role;
grant all on table public.civic_source_records to service_role;
grant all on table public.civic_people to service_role;
grant all on table public.civic_offices to service_role;
grant all on table public.civic_elections to service_role;
grant all on table public.civic_races to service_role;
grant all on table public.civic_candidacies to service_role;
grant all on table public.civic_office_terms to service_role;
grant all on table public.civic_claims to service_role;
grant all on table public.civic_claim_citations to service_role;
grant all on table public.civic_audit_events to service_role;

create policy "Published civic jurisdictions are public"
on public.civic_jurisdictions
for select to anon, authenticated
using (
  review_state = 'verified'
  and publication_state = 'published'
  and exists (
    select 1 from public.civic_source_records source
    where source.id = primary_source_record_id
      and source.review_state = 'verified'
      and source.publication_state = 'published'
      and source.access_level = 'public'
  )
);

create policy "Published civic sources are public"
on public.civic_source_records
for select to anon, authenticated
using (
  review_state = 'verified'
  and publication_state = 'published'
  and access_level = 'public'
);

create policy "Published civic people are public"
on public.civic_people
for select to anon, authenticated
using (
  review_state = 'verified'
  and publication_state = 'published'
  and exists (
    select 1 from public.civic_source_records source
    where source.id = primary_source_record_id
      and source.review_state = 'verified'
      and source.publication_state = 'published'
      and source.access_level = 'public'
  )
);

create policy "Published civic offices are public"
on public.civic_offices
for select to anon, authenticated
using (
  review_state = 'verified'
  and publication_state = 'published'
  and exists (
    select 1 from public.civic_jurisdictions jurisdiction
    where jurisdiction.id = jurisdiction_id
      and jurisdiction.review_state = 'verified'
      and jurisdiction.publication_state = 'published'
  )
  and exists (
    select 1 from public.civic_source_records source
    where source.id = primary_source_record_id
      and source.review_state = 'verified'
      and source.publication_state = 'published'
      and source.access_level = 'public'
  )
);

create policy "Published civic elections are public"
on public.civic_elections
for select to anon, authenticated
using (
  review_state = 'verified'
  and publication_state = 'published'
  and exists (
    select 1 from public.civic_jurisdictions jurisdiction
    where jurisdiction.id = jurisdiction_id
      and jurisdiction.review_state = 'verified'
      and jurisdiction.publication_state = 'published'
  )
  and exists (
    select 1 from public.civic_source_records source
    where source.id = primary_source_record_id
      and source.review_state = 'verified'
      and source.publication_state = 'published'
      and source.access_level = 'public'
  )
);

create policy "Published civic races are public"
on public.civic_races
for select to anon, authenticated
using (
  review_state = 'verified'
  and publication_state = 'published'
  and exists (
    select 1 from public.civic_elections election
    where election.id = election_id
      and election.review_state = 'verified'
      and election.publication_state = 'published'
  )
  and (
    office_id is null
    or exists (
      select 1 from public.civic_offices office
      where office.id = office_id
        and office.review_state = 'verified'
        and office.publication_state = 'published'
    )
  )
  and exists (
    select 1 from public.civic_source_records source
    where source.id = primary_source_record_id
      and source.review_state = 'verified'
      and source.publication_state = 'published'
      and source.access_level = 'public'
  )
);

create policy "Published civic candidacies are public"
on public.civic_candidacies
for select to anon, authenticated
using (
  review_state = 'verified'
  and publication_state = 'published'
  and exists (
    select 1 from public.civic_races race
    where race.id = race_id
      and race.review_state = 'verified'
      and race.publication_state = 'published'
  )
  and exists (
    select 1 from public.civic_people person
    where person.id = person_id
      and person.review_state = 'verified'
      and person.publication_state = 'published'
  )
  and exists (
    select 1 from public.civic_source_records source
    where source.id = primary_source_record_id
      and source.review_state = 'verified'
      and source.publication_state = 'published'
      and source.access_level = 'public'
  )
);

create policy "Published civic office terms are public"
on public.civic_office_terms
for select to anon, authenticated
using (
  review_state = 'verified'
  and publication_state = 'published'
  and exists (
    select 1 from public.civic_people person
    where person.id = person_id
      and person.review_state = 'verified'
      and person.publication_state = 'published'
  )
  and exists (
    select 1 from public.civic_offices office
    where office.id = office_id
      and office.review_state = 'verified'
      and office.publication_state = 'published'
  )
  and exists (
    select 1 from public.civic_source_records source
    where source.id = primary_source_record_id
      and source.review_state = 'verified'
      and source.publication_state = 'published'
      and source.access_level = 'public'
  )
);

create policy "Published civic claims are public"
on public.civic_claims
for select to anon, authenticated
using (
  review_state = 'verified'
  and publication_state = 'published'
  and (
    (subject_type = 'person' and exists (
      select 1 from public.civic_people subject
      where subject.id = person_id
        and subject.review_state = 'verified'
        and subject.publication_state = 'published'
    ))
    or (subject_type = 'jurisdiction' and exists (
      select 1 from public.civic_jurisdictions subject
      where subject.id = jurisdiction_id
        and subject.review_state = 'verified'
        and subject.publication_state = 'published'
    ))
    or (subject_type = 'office' and exists (
      select 1 from public.civic_offices subject
      where subject.id = office_id
        and subject.review_state = 'verified'
        and subject.publication_state = 'published'
    ))
    or (subject_type = 'office_term' and exists (
      select 1 from public.civic_office_terms subject
      where subject.id = office_term_id
        and subject.review_state = 'verified'
        and subject.publication_state = 'published'
    ))
    or (subject_type = 'election' and exists (
      select 1 from public.civic_elections subject
      where subject.id = election_id
        and subject.review_state = 'verified'
        and subject.publication_state = 'published'
    ))
    or (subject_type = 'race' and exists (
      select 1 from public.civic_races subject
      where subject.id = race_id
        and subject.review_state = 'verified'
        and subject.publication_state = 'published'
    ))
    or (subject_type = 'candidacy' and exists (
      select 1 from public.civic_candidacies subject
      where subject.id = candidacy_id
        and subject.review_state = 'verified'
        and subject.publication_state = 'published'
    ))
  )
);

create policy "Published civic citations are public"
on public.civic_claim_citations
for select to anon, authenticated
using (
  review_state = 'verified'
  and publication_state = 'published'
  and exists (
    select 1 from public.civic_claims claim
    where claim.id = claim_id
      and claim.review_state = 'verified'
      and claim.publication_state = 'published'
  )
  and exists (
    select 1 from public.civic_source_records source
    where source.id = source_record_id
      and source.review_state = 'verified'
      and source.publication_state = 'published'
      and source.access_level = 'public'
  )
);

create policy "Civic admins can inspect jurisdictions"
on public.civic_jurisdictions
for select to authenticated
using (private.is_civic_admin());

create policy "Civic admins can inspect sources"
on public.civic_source_records
for select to authenticated
using (private.is_civic_admin());

create policy "Civic admins can inspect people"
on public.civic_people
for select to authenticated
using (private.is_civic_admin());

create policy "Civic admins can inspect offices"
on public.civic_offices
for select to authenticated
using (private.is_civic_admin());

create policy "Civic admins can inspect elections"
on public.civic_elections
for select to authenticated
using (private.is_civic_admin());

create policy "Civic admins can inspect races"
on public.civic_races
for select to authenticated
using (private.is_civic_admin());

create policy "Civic admins can inspect candidacies"
on public.civic_candidacies
for select to authenticated
using (private.is_civic_admin());

create policy "Civic admins can inspect office terms"
on public.civic_office_terms
for select to authenticated
using (private.is_civic_admin());

create policy "Civic admins can inspect claims"
on public.civic_claims
for select to authenticated
using (private.is_civic_admin());

create policy "Civic admins can inspect citations"
on public.civic_claim_citations
for select to authenticated
using (private.is_civic_admin());

create policy "Civic admins can inspect audit events"
on public.civic_audit_events
for select to authenticated
using (private.is_civic_admin());

commit;
