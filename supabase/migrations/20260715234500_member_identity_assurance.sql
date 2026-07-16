-- RepWatchr member identity assurance.
--
-- Separates account confirmation, person proofing, residence proofing, and
-- voter-registration matching. A verified person must never be described as a
-- registered voter unless the separate voter-file process succeeded.
--
-- Provider evidence and duplicate controls remain private/server-only. Raw
-- identity documents, selfies, document numbers, dates of birth, and street
-- addresses must never be inserted into this database.

begin;

create extension if not exists pgcrypto;
create schema if not exists private;

create table if not exists private.member_assurance (
  user_id uuid primary key references auth.users(id) on delete cascade,
  verification_subject_id uuid not null unique default gen_random_uuid(),
  account_status text not null default 'unconfirmed',
  person_status text not null default 'not_started',
  residence_status text not null default 'not_started',
  voter_registration_status text not null default 'not_checked',
  person_verified_at timestamptz,
  residence_verified_at timestamptz,
  residence_expires_at timestamptz,
  voter_registration_checked_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_assurance_account_status_check
    check (account_status in ('unconfirmed', 'confirmed', 'suspended')),
  constraint member_assurance_person_status_check
    check (person_status in ('not_started', 'pending', 'verified', 'manual_review', 'rejected', 'revoked')),
  constraint member_assurance_residence_status_check
    check (residence_status in ('not_started', 'pending', 'verified', 'manual_review', 'rejected', 'expired', 'revoked')),
  constraint member_assurance_voter_status_check
    check (voter_registration_status in ('not_checked', 'pending', 'matched', 'not_matched', 'manual_review', 'revoked')),
  constraint member_assurance_person_time_check
    check ((person_status = 'verified') = (person_verified_at is not null)),
  constraint member_assurance_residence_time_check
    check (
      (residence_status = 'verified' and residence_verified_at is not null and residence_expires_at is not null)
      or
      (residence_status <> 'verified' and residence_verified_at is null and residence_expires_at is null)
    )
);

create table if not exists private.identity_verification_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('stripe_identity', 'persona', 'veriff', 'manual')),
  provider_session_id text,
  method text not null check (method in ('document_and_selfie', 'document_only', 'manual_referee')),
  status text not null default 'created'
    check (status in ('created', 'requires_input', 'processing', 'verified', 'manual_review', 'canceled', 'failed', 'redacted')),
  provider_outcome_code text,
  idempotency_key uuid not null default gen_random_uuid(),
  attempt_number integer not null default 1 check (attempt_number between 1 and 3),
  evidence_delete_by timestamptz not null default (now() + interval '30 days'),
  provider_redacted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_session_id),
  unique (user_id, idempotency_key)
);

create unique index if not exists idx_identity_one_active_attempt
  on private.identity_verification_attempts(user_id)
  where status in ('created', 'requires_input', 'processing');

create index if not exists idx_identity_attempts_retention
  on private.identity_verification_attempts(evidence_delete_by)
  where provider_redacted_at is null;

create table if not exists private.identity_duplicate_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key_version smallint not null check (key_version > 0),
  document_hmac bytea not null,
  person_hint_hmac bytea,
  review_status text not null default 'clear'
    check (review_status in ('clear', 'manual_review', 'confirmed_abuse', 'released')),
  retain_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (key_version, document_hmac)
);

create table if not exists private.residence_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  state text not null check (state ~ '^[A-Z]{2}$'),
  county text not null check (char_length(btrim(county)) between 2 and 120),
  district text,
  jurisdiction_source text not null,
  method text not null check (method in ('postal_code', 'document_review', 'trusted_referee')),
  status text not null default 'pending'
    check (status in ('pending', 'verified', 'manual_review', 'rejected', 'expired', 'revoked')),
  delivery_reference text,
  challenge_digest bytea,
  challenge_expires_at timestamptz,
  verified_at timestamptz,
  expires_at timestamptz,
  exact_address_deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint residence_claim_verification_times_check
    check (
      (status = 'verified' and verified_at is not null and expires_at is not null and exact_address_deleted_at is not null)
      or status <> 'verified'
    )
);

create unique index if not exists idx_residence_one_current_claim
  on private.residence_claims(user_id)
  where status in ('pending', 'verified', 'manual_review');

create table if not exists private.identity_review_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reason_code text not null,
  method text not null default 'manual',
  status text not null default 'open'
    check (status in ('open', 'assigned', 'approved', 'denied', 'appealed', 'closed')),
  first_reviewer_id uuid references auth.users(id) on delete set null,
  second_reviewer_id uuid references auth.users(id) on delete set null,
  decision_code text,
  appeal_of uuid references private.identity_review_requests(id) on delete set null,
  evidence_delete_by timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  constraint identity_denial_two_reviewers_check
    check (
      status <> 'denied'
      or (
        first_reviewer_id is not null
        and second_reviewer_id is not null
        and first_reviewer_id <> second_reviewer_id
      )
    )
);

create table if not exists private.identity_audit_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  reason_code text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 months'),
  constraint identity_audit_no_evidence_check
    check (
      not (metadata ?| array[
        'document_number',
        'date_of_birth',
        'full_name',
        'street_address',
        'document_image',
        'selfie'
      ])
    )
);

alter table private.member_assurance enable row level security;
alter table private.member_assurance force row level security;
alter table private.identity_verification_attempts enable row level security;
alter table private.identity_verification_attempts force row level security;
alter table private.identity_duplicate_keys enable row level security;
alter table private.identity_duplicate_keys force row level security;
alter table private.residence_claims enable row level security;
alter table private.residence_claims force row level security;
alter table private.identity_review_requests enable row level security;
alter table private.identity_review_requests force row level security;
alter table private.identity_audit_events enable row level security;
alter table private.identity_audit_events force row level security;

revoke all on all tables in schema private from public, anon, authenticated;
grant all privileges on table private.member_assurance to service_role;
grant all privileges on table private.identity_verification_attempts to service_role;
grant all privileges on table private.identity_duplicate_keys to service_role;
grant all privileges on table private.residence_claims to service_role;
grant all privileges on table private.identity_review_requests to service_role;
grant all privileges on table private.identity_audit_events to service_role;
grant usage, select on sequence private.identity_audit_events_id_seq to service_role;

create or replace function public.get_my_assurance_status()
returns table (
  account_status text,
  person_status text,
  residence_status text,
  voter_registration_status text,
  person_verified_at timestamptz,
  residence_verified_at timestamptz,
  residence_expires_at timestamptz
)
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  select
    coalesce(a.account_status, 'unconfirmed'),
    coalesce(a.person_status, 'not_started'),
    coalesce(a.residence_status, 'not_started'),
    coalesce(a.voter_registration_status, 'not_checked'),
    a.person_verified_at,
    a.residence_verified_at,
    a.residence_expires_at
  from (select auth.uid() as user_id) caller
  left join private.member_assurance a on a.user_id = caller.user_id
  where caller.user_id is not null;
$$;

revoke all on function public.get_my_assurance_status() from public, anon;
grant execute on function public.get_my_assurance_status() to authenticated, service_role;

create or replace function private.repw_sync_profile_assurance(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  assurance private.member_assurance%rowtype;
  residence private.residence_claims%rowtype;
begin
  select * into assurance
  from private.member_assurance
  where user_id = target_user_id;

  select * into residence
  from private.residence_claims
  where user_id = target_user_id
    and status = 'verified'
    and expires_at > now()
  order by verified_at desc
  limit 1;

  if assurance.person_status = 'verified'
     and assurance.residence_status = 'verified'
     and assurance.residence_expires_at > now()
     and residence.id is not null then
    update public.profiles
    set state = residence.state,
        county = residence.county,
        district = residence.district,
        verified = true,
        verification_status = 'verified',
        verified_at = assurance.person_verified_at,
        geography_verified_at = assurance.residence_verified_at,
        updated_at = now()
    where user_id = target_user_id;
  else
    update public.profiles
    set verified = false,
        verification_status = case when assurance.revoked_at is not null then 'revoked' else 'needs_review' end,
        verified_at = null,
        geography_verified_at = null,
        updated_at = now()
    where user_id = target_user_id;
  end if;
end;
$$;

revoke all on function private.repw_sync_profile_assurance(uuid) from public, anon, authenticated;
grant execute on function private.repw_sync_profile_assurance(uuid) to service_role;

comment on table private.member_assurance is
  'Server-only assurance levels. Person, residence, and voter-registration claims are deliberately separate.';
comment on table private.identity_duplicate_keys is
  'Keyed HMAC duplicate controls only. Never store raw identifiers or unkeyed document hashes.';
comment on table private.residence_claims is
  'Coarse jurisdiction and postal-verification state. Never store a plaintext street address.';

commit;
