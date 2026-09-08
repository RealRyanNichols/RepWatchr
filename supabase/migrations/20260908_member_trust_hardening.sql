-- Review and test before application. Does not activate verification, payments,
-- or district voting; does not delete or promote any existing evidence/response.
-- Apply after the base profile/claims/comments/scorecards, owner bootstrap,
-- and race pulse schemas (all confirmed present in production).
begin;
create schema if not exists private;

-- A reviewer/researcher must never acquire role-management or billing powers
-- through the shared helper. Application admin routes require this same role.
create or replace function public.is_repw_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin');
$$;
revoke all on function public.is_repw_admin() from public, anon;
grant execute on function public.is_repw_admin() to anon, authenticated, service_role;
revoke all on public.user_roles from public, anon, authenticated;
grant select, insert, update, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

-- Operator invitations are another path to privileged roles. A researcher or
-- reviewer cannot create an admin invitation. Only a confirmed email can redeem
-- an unclaimed invitation, once; an operator role never verifies residence.
revoke all on public.repw_operator_invites from public, anon, authenticated;
grant select, insert, update, delete on public.repw_operator_invites to authenticated;
grant all on public.repw_operator_invites to service_role;
drop policy if exists "Operators manage operator invites" on public.repw_operator_invites;
create policy "Operators manage operator invites" on public.repw_operator_invites for all to authenticated
  using (public.is_repw_admin()) with check (public.is_repw_admin());

create or replace function private.apply_repw_operator_invite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite_row public.repw_operator_invites%rowtype;
  role_name text;
begin
  if new.email is null or new.email_confirmed_at is null then
    return new;
  end if;

  select *
    into invite_row
    from public.repw_operator_invites
    where email = lower(trim(new.email))
      and is_active and claimed_by is null and claimed_at is null
    limit 1 for update;

  if not found then
    return new;
  end if;

  if to_regclass('public.member_profiles') is not null then
    insert into public.member_profiles (
      user_id,
      display_name,
      preferred_state,
      research_focus
    )
    values (
      new.id,
      coalesce(invite_row.display_name, split_part(lower(trim(new.email)), '@', 1)),
      invite_row.preferred_state,
      'RepWatchr owner/operator: Texas elections, public officials, source review, accountability cases, and site growth.'
    )
    on conflict (user_id) do update
      set display_name = coalesce(public.member_profiles.display_name, excluded.display_name),
          preferred_state = coalesce(public.member_profiles.preferred_state, excluded.preferred_state),
          research_focus = coalesce(public.member_profiles.research_focus, excluded.research_focus),
          updated_at = now();
  end if;

  foreach role_name in array invite_row.roles loop
    insert into public.user_roles (user_id, role, created_by)
    values (new.id, role_name, invite_row.created_by)
    on conflict (user_id, role) do nothing;
  end loop;

  update public.repw_operator_invites
    set is_active = false,
        claimed_by = new.id,
        claimed_at = coalesce(claimed_at, now()),
        updated_at = now()
    where id = invite_row.id;

  return new;
end;
$$;

revoke all on function private.apply_repw_operator_invite() from public;
revoke all on function private.apply_repw_operator_invite() from anon;
revoke all on function private.apply_repw_operator_invite() from authenticated;

drop trigger if exists on_auth_user_repw_operator_invite on auth.users;
create trigger on_auth_user_repw_operator_invite
  after insert or update of email, email_confirmed_at on auth.users
  for each row execute function private.apply_repw_operator_invite();


-- Old self-asserted verified flags remain preserved for audit, but are frozen
-- and must never be copied into member_assurance or used for new eligibility.
revoke all on public.profiles from public, anon, authenticated;
grant select (user_id, county, district, verified, created_at, updated_at) on public.profiles to authenticated;
grant all on public.profiles to service_role;

create table if not exists public.member_assurance (
  user_id uuid primary key references auth.users(id) on delete cascade,
  account_fee_status text not null default 'unpaid' check (account_fee_status in ('unpaid','paid','waived','refunded')),
  person_status text not null default 'not_started' check (person_status in ('not_started','pending','verified','rejected','expired')),
  person_verified_at timestamptz,
  person_expires_at timestamptz,
  residence_status text not null default 'not_started' check (residence_status in ('not_started','pending','verified','rejected','expired')),
  residence_verified_at timestamptz,
  residence_expires_at timestamptz,
  county text,
  district text,
  jurisdiction_version text,
  updated_at timestamptz not null default now(),
  check (person_status <> 'verified' or (person_verified_at is not null and person_expires_at is not null and person_expires_at > person_verified_at)),
  check (residence_status <> 'verified' or (person_status = 'verified' and residence_verified_at is not null and residence_expires_at is not null and residence_expires_at > residence_verified_at and county is not null and jurisdiction_version is not null))
);
alter table public.member_assurance enable row level security;
alter table public.member_assurance force row level security;
revoke all on public.member_assurance from public, anon, authenticated;
grant select on public.member_assurance to authenticated;
grant all on public.member_assurance to service_role;
drop policy if exists "Members read own assurance" on public.member_assurance;
create policy "Members read own assurance" on public.member_assurance for select to authenticated using (user_id = auth.uid());
comment on table public.member_assurance is 'Server-managed assurance only. Payment proves no identity or residence. No legacy verification backfill. No raw identity evidence or street address.';

-- Freeze legacy voting paths while the new assurance program is inactive.
-- Client feature flags alone cannot protect direct Data API writes.
revoke all on public.citizen_votes, public.citizen_grades, public.profile_scorecard_votes from public, anon, authenticated;
grant select on public.citizen_votes, public.citizen_grades, public.profile_scorecard_votes to authenticated;
grant all on public.citizen_votes, public.citizen_grades, public.profile_scorecard_votes to service_role;

-- Pending claims are still accepted. Approval and review fields are trusted.
revoke all on public.profile_claims from public, anon, authenticated;
grant select on public.profile_claims to authenticated;
grant insert (user_id,profile_type,profile_id,profile_name,district_slug,official_email,role_title,proof_url,proof_storage_path,proof_notes,status) on public.profile_claims to authenticated;
grant update (status, reviewer_notes, reviewed_by, reviewed_at) on public.profile_claims to authenticated;
grant all on public.profile_claims to service_role;
drop policy if exists "Users can create own profile claims" on public.profile_claims;
create policy "Users can create own profile claims" on public.profile_claims for insert to authenticated with check (
  auth.uid() = user_id and status = 'pending' and reviewed_by is null and reviewed_at is null and reviewer_notes is null
);

drop policy if exists "Admins can update profile claims" on public.profile_claims;
create policy "Admins can update profile claims" on public.profile_claims for update to authenticated
  using (public.is_repw_admin() and user_id <> auth.uid())
  with check (public.is_repw_admin() and user_id <> auth.uid() and reviewed_by = auth.uid() and reviewed_at is not null);

-- Billing/approval audit records are not member-authored assertions.
revoke insert, update, delete, truncate, references, trigger on public.subscriptions, public.profile_claim_audit from public, anon, authenticated;
grant all on public.subscriptions, public.profile_claim_audit to service_role;
grant insert (claim_id,actor_id,action,details) on public.profile_claim_audit to authenticated;
drop policy if exists "Authenticated users can insert claim audit" on public.profile_claim_audit;
create policy "Authenticated users can insert claim audit" on public.profile_claim_audit for insert to authenticated
  with check (public.is_repw_admin() and actor_id = auth.uid());

-- Claimants can submit drafts, never their own published approval. Keep the
-- existing admin review screens working through explicit columns and RLS.
revoke all on public.claimed_profile_content, public.profile_media from public, anon, authenticated;
grant select on public.claimed_profile_content, public.profile_media to anon, authenticated;
grant insert (claim_id,user_id,profile_id,about_me,personal_statement,official_website,campaign_website,facebook_url,x_url,youtube_url,status,version)
  on public.claimed_profile_content to authenticated;
grant insert (claim_id,user_id,profile_id,media_type,storage_bucket,storage_path,public_url,source_url,caption,credit,status)
  on public.profile_media to authenticated;
grant update (status,reviewer_notes,reviewed_by,reviewed_at) on public.claimed_profile_content to authenticated;
grant update (status,reviewer_notes,reviewed_by,reviewed_at,storage_bucket,storage_path) on public.profile_media to authenticated;
grant all on public.claimed_profile_content, public.profile_media to service_role;
drop policy if exists "Approved subscribed claimants can submit profile content" on public.claimed_profile_content;
create policy "Approved subscribed claimants can submit profile content" on public.claimed_profile_content for insert to authenticated with check (
  user_id = auth.uid() and status in ('draft','pending_review') and reviewed_by is null and reviewed_at is null and reviewer_notes is null
  and exists (select 1 from public.profile_claims pc join public.subscriptions s on s.claim_id = pc.id where pc.id = claimed_profile_content.claim_id and pc.user_id = auth.uid() and pc.profile_id = claimed_profile_content.profile_id and pc.status = 'approved' and s.status in ('active','trialing'))
);
drop policy if exists "Approved subscribed claimants can submit profile media" on public.profile_media;
create policy "Approved subscribed claimants can submit profile media" on public.profile_media for insert to authenticated with check (
  user_id = auth.uid() and status = 'pending_review' and reviewed_by is null and reviewed_at is null and reviewer_notes is null
  and exists (select 1 from public.profile_claims pc join public.subscriptions s on s.claim_id = pc.id where pc.id = profile_media.claim_id and pc.user_id = auth.uid() and pc.profile_id = profile_media.profile_id and pc.status = 'approved' and s.status in ('active','trialing'))
);

drop policy if exists "Admins can review claimed profile content" on public.claimed_profile_content;
create policy "Admins can review claimed profile content" on public.claimed_profile_content for update to authenticated
  using (public.is_repw_admin() and user_id <> auth.uid())
  with check (public.is_repw_admin() and user_id <> auth.uid() and reviewed_by = auth.uid() and reviewed_at is not null);
drop policy if exists "Admins can review profile media" on public.profile_media;
create policy "Admins can review profile media" on public.profile_media for update to authenticated
  using (public.is_repw_admin() and user_id <> auth.uid())
  with check (public.is_repw_admin() and user_id <> auth.uid() and reviewed_by = auth.uid() and reviewed_at is not null);

-- Clients submit content. A trusted trigger sets all badges, geography, rank,
-- and moderation state; historical untrusted badges are not certified.
alter table public.comments add column if not exists assurance_basis text;
revoke all on public.comments from public, anon, authenticated;
grant select on public.comments to anon, authenticated;
grant delete on public.comments to authenticated;
grant insert (user_id,official_id,content,display_name,county,comment_kind,source_url) on public.comments to authenticated;
grant all on public.comments to service_role;
drop policy if exists "Anyone can view comments" on public.comments;
create policy "Anyone can view comments" on public.comments for select to anon, authenticated using (visibility_status <> 'removed_illegal');
drop policy if exists "Authenticated users can insert comments" on public.comments;
create policy "Authenticated users can insert comments" on public.comments for insert to authenticated with check (auth.uid() = user_id and comment_kind in ('comment','question','source_note') and visibility_status = 'visible');

create or replace function private.prepare_member_comment()
returns trigger language plpgsql security definer set search_path = '' as $$
declare assurance public.member_assurance%rowtype;
begin
  if auth.role() = 'service_role' then return new; end if;
  if auth.uid() is null or auth.uid() <> new.user_id then raise exception 'Sign in before commenting' using errcode = '42501'; end if;
  -- Serialize rate checks per account to close concurrent insertion races.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.user_id::text, 74821));
  if (select count(*) from public.comments where user_id = new.user_id and created_at > now() - interval '1 minute') >= 5 then
    raise exception 'Please wait before posting another comment' using errcode = 'P0001';
  end if;
  if new.source_url is not null and new.source_url !~* '^https?://[^[:space:]]+$' then raise exception 'Invalid source URL' using errcode = '23514'; end if;
  select * into assurance from public.member_assurance where user_id = new.user_id;
  new.author_type := 'signed_in';
  new.county := 'Not verified';
  if assurance.person_status = 'verified' and assurance.person_verified_at <= now() and assurance.person_expires_at > now()
     and assurance.residence_status = 'verified' and assurance.residence_verified_at <= now() and assurance.residence_expires_at > now() then
    new.author_type := 'verified_resident';
    new.county := assurance.county;
  end if;
  new.assurance_basis := 'member_assurance_v1';
  new.contains_source := new.source_url is not null;
  new.rank_score := public.comment_rank_for_author(new.author_type, new.contains_source);
  new.visibility_status := 'visible';
  new.moderation_reason := null;
  new.question_status := 'open';
  new.created_at := now();
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.prepare_member_comment() from public, anon, authenticated;
drop trigger if exists prepare_member_comment on public.comments;
create trigger prepare_member_comment before insert on public.comments for each row execute function private.prepare_member_comment();

-- Race pulse state is checked within the write transaction as well as the API.
-- This prevents a response from racing a concurrent close or option removal.
create or replace function private.enforce_race_pulse_window()
returns trigger language plpgsql set search_path = '' as $$
declare poll public.race_community_polls%rowtype;
begin
  select * into poll from public.race_community_polls where id = new.poll_id for share;
  if poll.status <> 'open' or (poll.opens_at is not null and poll.opens_at > clock_timestamp()) or (poll.closes_at is not null and poll.closes_at <= clock_timestamp()) then
    raise exception 'Community pulse is closed' using errcode = '23514';
  end if;
  perform 1 from public.race_community_poll_options where poll_id = new.poll_id and option_id = new.option_id and active for share;
  if not found then raise exception 'Inactive community pulse option' using errcode = '23514'; end if;
  return new;
end;
$$;
revoke all on function private.enforce_race_pulse_window() from public, anon, authenticated;
drop trigger if exists enforce_race_pulse_window on public.race_community_poll_responses;
create trigger enforce_race_pulse_window before insert or update on public.race_community_poll_responses for each row execute function private.enforce_race_pulse_window();
commit;
