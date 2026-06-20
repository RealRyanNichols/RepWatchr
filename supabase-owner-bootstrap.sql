-- ============================================================
-- RepWatchr Owner / Operator Bootstrap
-- ============================================================
-- Run after supabase-profile-claims.sql, supabase-gideon-member-tools.sql,
-- and supabase-superadmin-office.sql.
--
-- This creates a private invite table and an auth.users trigger that grants
-- operator roles only when a new Supabase Auth user matches an active invite.
-- Do not commit private owner email seed rows to the public repository.

create table if not exists public.repw_operator_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  roles text[] not null default array['admin', 'reviewer', 'researcher']::text[],
  display_name text,
  preferred_state text not null default 'TX',
  county text,
  district text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint repw_operator_invites_email_normalized check (email = lower(trim(email))),
  constraint repw_operator_invites_email_shape check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint repw_operator_invites_roles_present check (array_length(roles, 1) > 0),
  constraint repw_operator_invites_roles_allowed check (
    roles <@ array['admin', 'reviewer', 'researcher', 'claimed_official', 'journalist', 'voter']::text[]
  )
);

create index if not exists idx_repw_operator_invites_active_email
  on public.repw_operator_invites(email)
  where is_active;

create schema if not exists private;

alter table public.repw_operator_invites enable row level security;

drop policy if exists "Operators manage operator invites" on public.repw_operator_invites;
drop policy if exists "Invited users can read own invite" on public.repw_operator_invites;

create policy "Operators manage operator invites"
  on public.repw_operator_invites for all
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Invited users can read own invite"
  on public.repw_operator_invites for select
  to authenticated
  using (
    is_active
    and lower(coalesce(auth.jwt() ->> 'email', '')) = email
  );

create or replace function private.apply_repw_operator_invite()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  invite_row public.repw_operator_invites%rowtype;
  role_name text;
begin
  if new.email is null then
    return new;
  end if;

  select *
    into invite_row
    from public.repw_operator_invites
    where email = lower(trim(new.email))
      and is_active
    limit 1;

  if not found then
    return new;
  end if;

  insert into public.profiles (user_id, county, district, verified)
  values (
    new.id,
    coalesce(invite_row.county, 'Gregg County'),
    invite_row.district,
    true
  )
  on conflict (user_id) do update
    set county = coalesce(excluded.county, public.profiles.county),
        district = coalesce(excluded.district, public.profiles.district),
        verified = true,
        updated_at = now();

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
    values (new.id, role_name, new.id)
    on conflict (user_id, role) do nothing;
  end loop;

  update public.repw_operator_invites
    set claimed_by = coalesce(claimed_by, new.id),
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
  after insert or update of email on auth.users
  for each row execute function private.apply_repw_operator_invite();

drop function if exists public.apply_repw_operator_invite();

grant select on public.repw_operator_invites to authenticated;
grant insert, update, delete on public.repw_operator_invites to authenticated;
