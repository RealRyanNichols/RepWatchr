-- RepWatchr Universal Public Entity / Public Power Profile Model
-- =============================================================
-- Run after supabase-superadmin-office.sql and supabase-source-submission-system.sql.
--
-- This schema is intentionally broader than "politician profiles." It models
-- people, offices, courts, agencies, boards, races, and other public-power
-- entities while keeping private personal data out of the public profile layer.

create or replace function public.is_repw_operator()
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

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.jurisdictions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (char_length(slug) between 2 and 180),
  name text not null check (char_length(name) between 2 and 240),
  jurisdiction_type text not null check (
    jurisdiction_type in (
      'federal',
      'state',
      'county',
      'city',
      'school_district',
      'special_district',
      'court',
      'agency',
      'board',
      'commission'
    )
  ),
  state_code text check (state_code is null or char_length(state_code) between 2 and 8),
  county_name text check (county_name is null or char_length(county_name) <= 140),
  city_name text check (city_name is null or char_length(city_name) <= 140),
  parent_jurisdiction_id uuid references public.jurisdictions(id) on delete set null,
  official_url text check (official_url is null or official_url ~* '^https?://' and char_length(official_url) <= 700),
  source_url text check (source_url is null or source_url ~* '^https?://' and char_length(source_url) <= 700),
  source_count integer not null default 0 check (source_count >= 0),
  confidence_label text not null default 'needs_source' check (
    confidence_label in ('official_record', 'source_backed', 'needs_source', 'under_review', 'disputed')
  ),
  status text not null default 'active' check (status in ('active', 'under_review', 'archived', 'hidden')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.public_entities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (char_length(slug) between 2 and 220),
  display_name text not null check (char_length(display_name) between 1 and 240),
  entity_type text not null check (
    entity_type in (
      'elected_official',
      'appointed_official',
      'candidate',
      'law_enforcement_official',
      'sheriff',
      'police_chief',
      'constable',
      'judge',
      'prosecutor',
      'district_attorney',
      'county_commissioner',
      'city_council_member',
      'mayor',
      'school_board_member',
      'state_legislator',
      'governor',
      'federal_legislator',
      'agency_head',
      'board_member',
      'commission_member',
      'public_body',
      'agency',
      'office',
      'race',
      'court',
      'other_public_role'
    )
  ),
  office_level text check (
    office_level is null or office_level in (
      'federal',
      'state',
      'county',
      'city',
      'school_district',
      'special_district',
      'court',
      'agency',
      'board',
      'commission'
    )
  ),
  jurisdiction_id uuid references public.jurisdictions(id) on delete set null,
  parent_entity_id uuid references public.public_entities(id) on delete set null,
  state_code text check (state_code is null or char_length(state_code) between 2 and 8),
  county_name text check (county_name is null or char_length(county_name) <= 140),
  city_name text check (city_name is null or char_length(city_name) <= 140),
  profile_path text check (profile_path is null or char_length(profile_path) between 1 and 500),
  primary_source_url text check (
    primary_source_url is null or primary_source_url ~* '^https?://' and char_length(primary_source_url) <= 700
  ),
  source_count integer not null default 0 check (source_count >= 0),
  confidence_label text not null default 'needs_source' check (
    confidence_label in ('official_record', 'source_backed', 'needs_source', 'under_review', 'disputed')
  ),
  public_boundary text not null default 'public_role_only' check (
    public_boundary in ('public_role_only', 'public_body', 'private_review', 'redacted')
  ),
  review_status text not null default 'needs_review' check (
    review_status in ('needs_review', 'source_seeded', 'verified', 'under_review', 'disputed', 'archived')
  ),
  index_status text not null default 'indexable' check (index_status in ('indexable', 'noindex', 'hidden')),
  status text not null default 'active' check (status in ('draft', 'active', 'under_review', 'archived', 'hidden')),
  summary text check (summary is null or char_length(summary) <= 3000),
  source_gap_summary text check (source_gap_summary is null or char_length(source_gap_summary) <= 3000),
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  last_source_added_at timestamptz,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references public.public_entities(id) on delete set null,
  jurisdiction_id uuid references public.jurisdictions(id) on delete set null,
  parent_agency_id uuid references public.agencies(id) on delete set null,
  slug text not null unique check (char_length(slug) between 2 and 220),
  name text not null check (char_length(name) between 2 and 240),
  agency_type text not null default 'agency' check (
    agency_type in (
      'agency',
      'department',
      'court',
      'law_enforcement_agency',
      'school_district',
      'election_office',
      'board',
      'commission',
      'public_authority',
      'special_district',
      'other_public_body'
    )
  ),
  official_url text check (official_url is null or official_url ~* '^https?://' and char_length(official_url) <= 700),
  public_contact_url text check (
    public_contact_url is null or public_contact_url ~* '^https?://' and char_length(public_contact_url) <= 700
  ),
  official_phone text check (official_phone is null or char_length(official_phone) <= 80),
  official_email text check (official_email is null or char_length(official_email) <= 180),
  public_office_address text check (public_office_address is null or char_length(public_office_address) <= 500),
  source_count integer not null default 0 check (source_count >= 0),
  confidence_label text not null default 'needs_source' check (
    confidence_label in ('official_record', 'source_backed', 'needs_source', 'under_review', 'disputed')
  ),
  status text not null default 'active' check (status in ('active', 'under_review', 'archived', 'hidden')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.official_profiles (
  entity_id uuid primary key references public.public_entities(id) on delete cascade,
  first_name text check (first_name is null or char_length(first_name) <= 120),
  middle_name text check (middle_name is null or char_length(middle_name) <= 120),
  last_name text check (last_name is null or char_length(last_name) <= 120),
  suffix text check (suffix is null or char_length(suffix) <= 40),
  party text check (party is null or char_length(party) <= 80),
  biography text check (biography is null or char_length(biography) <= 5000),
  photo_url text check (photo_url is null or char_length(photo_url) <= 700),
  photo_source_url text check (photo_source_url is null or photo_source_url ~* '^https?://' and char_length(photo_source_url) <= 700),
  photo_credit text check (photo_credit is null or char_length(photo_credit) <= 260),
  official_website text check (official_website is null or official_website ~* '^https?://' and char_length(official_website) <= 700),
  official_contact_url text check (
    official_contact_url is null or official_contact_url ~* '^https?://' and char_length(official_contact_url) <= 700
  ),
  official_email text check (official_email is null or char_length(official_email) <= 180),
  official_phone text check (official_phone is null or char_length(official_phone) <= 80),
  public_office_address text check (public_office_address is null or char_length(public_office_address) <= 500),
  public_contact_kind text not null default 'official_public' check (public_contact_kind in ('official_public', 'none')),
  vote_profile_status text not null default 'not_loaded' check (
    vote_profile_status in ('not_applicable', 'not_loaded', 'partial', 'loaded', 'under_review')
  ),
  funding_profile_status text not null default 'not_loaded' check (
    funding_profile_status in ('not_applicable', 'not_loaded', 'partial', 'loaded', 'under_review')
  ),
  score_profile_status text not null default 'not_loaded' check (
    score_profile_status in ('not_applicable', 'not_loaded', 'partial', 'loaded', 'under_review')
  ),
  correction_status text not null default 'open' check (correction_status in ('open', 'requested', 'resolved', 'disputed')),
  source_notes text check (source_notes is null or char_length(source_notes) <= 3000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.public_roles (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.public_entities(id) on delete cascade,
  jurisdiction_id uuid references public.jurisdictions(id) on delete set null,
  agency_id uuid references public.agencies(id) on delete set null,
  role_title text not null check (char_length(role_title) between 1 and 220),
  office_level text not null check (
    office_level in (
      'federal',
      'state',
      'county',
      'city',
      'school_district',
      'special_district',
      'court',
      'agency',
      'board',
      'commission'
    )
  ),
  office_type text check (office_type is null or char_length(office_type) <= 140),
  district text check (district is null or char_length(district) <= 140),
  seat text check (seat is null or char_length(seat) <= 140),
  selection_method text check (
    selection_method is null or selection_method in ('elected', 'appointed', 'hired', 'candidate', 'ex_officio', 'unknown')
  ),
  term_start date,
  term_end date,
  is_current boolean not null default true,
  source_url text check (source_url is null or source_url ~* '^https?://' and char_length(source_url) <= 700),
  source_title text check (source_title is null or char_length(source_title) <= 260),
  confidence_label text not null default 'needs_source' check (
    confidence_label in ('official_record', 'source_backed', 'needs_source', 'under_review', 'disputed')
  ),
  review_status text not null default 'needs_review' check (
    review_status in ('needs_review', 'source_seeded', 'verified', 'under_review', 'disputed', 'archived')
  ),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_completeness_snapshots (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.public_entities(id) on delete cascade,
  profile_type text not null default 'public_entity',
  profile_slug text not null check (char_length(profile_slug) between 2 and 220),
  profile_name text not null check (char_length(profile_name) between 1 and 240),
  completeness_score integer not null check (completeness_score between 0 and 100),
  completeness_label text not null default 'needs_buildout' check (
    completeness_label in ('complete', 'nearly_complete', 'needs_buildout', 'thin_profile', 'not_ready')
  ),
  loaded_items text[] not null default '{}',
  missing_items text[] not null default '{}',
  source_gaps jsonb not null default '[]'::jsonb,
  source_count integer not null default 0 check (source_count >= 0),
  confidence_label text not null default 'needs_source' check (
    confidence_label in ('official_record', 'source_backed', 'needs_source', 'under_review', 'disputed')
  ),
  data_completeness_only boolean not null default true check (data_completeness_only = true),
  notes text check (notes is null or char_length(notes) <= 3000),
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(entity_id, calculated_at)
);

create index if not exists idx_jurisdictions_type_state
  on public.jurisdictions(jurisdiction_type, state_code, name);
create index if not exists idx_public_entities_type_geo
  on public.public_entities(entity_type, office_level, state_code, county_name, city_name);
create index if not exists idx_public_entities_public
  on public.public_entities(status, index_status, review_status, source_count desc);
create index if not exists idx_public_entities_tags
  on public.public_entities using gin(tags);
create index if not exists idx_agencies_jurisdiction
  on public.agencies(jurisdiction_id, agency_type, status);
create index if not exists idx_public_roles_entity
  on public.public_roles(entity_id, is_current, role_title);
create index if not exists idx_public_roles_jurisdiction
  on public.public_roles(jurisdiction_id, office_level, is_current);
create index if not exists idx_profile_completeness_entity
  on public.profile_completeness_snapshots(entity_id, calculated_at desc);

alter table public.jurisdictions enable row level security;
alter table public.public_entities enable row level security;
alter table public.agencies enable row level security;
alter table public.official_profiles enable row level security;
alter table public.public_roles enable row level security;
alter table public.profile_completeness_snapshots enable row level security;

grant select on public.jurisdictions to anon, authenticated;
grant select on public.public_entities to anon, authenticated;
grant select on public.agencies to anon, authenticated;
grant select on public.official_profiles to anon, authenticated;
grant select on public.public_roles to anon, authenticated;
grant select on public.profile_completeness_snapshots to anon, authenticated;

grant select, insert, update, delete on public.jurisdictions to service_role;
grant select, insert, update, delete on public.public_entities to service_role;
grant select, insert, update, delete on public.agencies to service_role;
grant select, insert, update, delete on public.official_profiles to service_role;
grant select, insert, update, delete on public.public_roles to service_role;
grant select, insert, update, delete on public.profile_completeness_snapshots to service_role;

grant insert, update, delete on public.jurisdictions to authenticated;
grant insert, update, delete on public.public_entities to authenticated;
grant insert, update, delete on public.agencies to authenticated;
grant insert, update, delete on public.official_profiles to authenticated;
grant insert, update, delete on public.public_roles to authenticated;
grant insert, update, delete on public.profile_completeness_snapshots to authenticated;

drop policy if exists "Public reads active jurisdictions" on public.jurisdictions;
drop policy if exists "Operators manage jurisdictions" on public.jurisdictions;
drop policy if exists "Public reads active public entities" on public.public_entities;
drop policy if exists "Operators manage public entities" on public.public_entities;
drop policy if exists "Public reads active agencies" on public.agencies;
drop policy if exists "Operators manage agencies" on public.agencies;
drop policy if exists "Public reads safe official profiles" on public.official_profiles;
drop policy if exists "Operators manage official profiles" on public.official_profiles;
drop policy if exists "Public reads active public roles" on public.public_roles;
drop policy if exists "Operators manage public roles" on public.public_roles;
drop policy if exists "Public reads latest public completeness snapshots" on public.profile_completeness_snapshots;
drop policy if exists "Operators manage profile completeness snapshots" on public.profile_completeness_snapshots;

create policy "Public reads active jurisdictions"
  on public.jurisdictions for select
  using (status = 'active' or public.is_repw_operator());

create policy "Operators manage jurisdictions"
  on public.jurisdictions for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Public reads active public entities"
  on public.public_entities for select
  using (
    (
      status = 'active'
      and public_boundary in ('public_role_only', 'public_body')
      and index_status <> 'hidden'
    )
    or public.is_repw_operator()
  );

create policy "Operators manage public entities"
  on public.public_entities for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Public reads active agencies"
  on public.agencies for select
  using (status = 'active' or public.is_repw_operator());

create policy "Operators manage agencies"
  on public.agencies for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Public reads safe official profiles"
  on public.official_profiles for select
  using (
    exists (
      select 1
      from public.public_entities entity
      where entity.id = public.official_profiles.entity_id
        and entity.status = 'active'
        and entity.public_boundary = 'public_role_only'
        and entity.index_status <> 'hidden'
    )
    or public.is_repw_operator()
  );

create policy "Operators manage official profiles"
  on public.official_profiles for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Public reads active public roles"
  on public.public_roles for select
  using (
    (
      is_current = true
      and review_status in ('source_seeded', 'verified')
      and exists (
        select 1
        from public.public_entities entity
        where entity.id = public.public_roles.entity_id
          and entity.status = 'active'
          and entity.public_boundary in ('public_role_only', 'public_body')
          and entity.index_status <> 'hidden'
      )
    )
    or public.is_repw_operator()
  );

create policy "Operators manage public roles"
  on public.public_roles for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

create policy "Public reads latest public completeness snapshots"
  on public.profile_completeness_snapshots for select
  using (
    exists (
      select 1
      from public.public_entities entity
      where entity.id = public.profile_completeness_snapshots.entity_id
        and entity.status = 'active'
        and entity.public_boundary in ('public_role_only', 'public_body')
        and entity.index_status <> 'hidden'
    )
    or public.is_repw_operator()
  );

create policy "Operators manage profile completeness snapshots"
  on public.profile_completeness_snapshots for all
  to authenticated
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

drop trigger if exists set_jurisdictions_updated_at on public.jurisdictions;
create trigger set_jurisdictions_updated_at
  before update on public.jurisdictions
  for each row execute function public.handle_updated_at();

drop trigger if exists set_public_entities_updated_at on public.public_entities;
create trigger set_public_entities_updated_at
  before update on public.public_entities
  for each row execute function public.handle_updated_at();

drop trigger if exists set_agencies_updated_at on public.agencies;
create trigger set_agencies_updated_at
  before update on public.agencies
  for each row execute function public.handle_updated_at();

drop trigger if exists set_official_profiles_updated_at on public.official_profiles;
create trigger set_official_profiles_updated_at
  before update on public.official_profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists set_public_roles_updated_at on public.public_roles;
create trigger set_public_roles_updated_at
  before update on public.public_roles
  for each row execute function public.handle_updated_at();

create or replace view public.public_entity_profile_index
with (security_invoker = true)
as
select
  entity.id,
  entity.slug,
  entity.display_name,
  entity.entity_type,
  entity.office_level,
  entity.profile_path,
  entity.state_code,
  entity.county_name,
  entity.city_name,
  entity.source_count,
  entity.confidence_label,
  entity.review_status,
  entity.index_status,
  entity.updated_at,
  jurisdiction.name as jurisdiction_name,
  latest.completeness_score,
  latest.completeness_label,
  latest.missing_items
from public.public_entities entity
left join public.jurisdictions jurisdiction
  on jurisdiction.id = entity.jurisdiction_id
left join lateral (
  select snapshot.completeness_score, snapshot.completeness_label, snapshot.missing_items
  from public.profile_completeness_snapshots snapshot
  where snapshot.entity_id = entity.id
  order by snapshot.calculated_at desc
  limit 1
) latest on true
where entity.status = 'active'
  and entity.public_boundary in ('public_role_only', 'public_body')
  and entity.index_status <> 'hidden';

grant select on public.public_entity_profile_index to anon, authenticated, service_role;
