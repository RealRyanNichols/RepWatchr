-- ============================================================
-- RepWatchr School Board and Local Meeting Tracker
-- ============================================================
-- Run after the base schema and admin dashboard schema.
-- This model stores public body rosters, public meetings, agenda/minutes/video
-- sources, item-level actions, and vote rows. User-submitted records should
-- remain under review until an admin attaches a public source.

create table if not exists public.public_bodies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  body_type text not null,
  jurisdiction_id uuid,
  state text,
  county text,
  city text,
  official_url text,
  meetings_url text,
  source_count int default 0 not null,
  status text default 'active' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  check (body_type in ('school_board', 'city_council', 'county_commissioners', 'board', 'commission', 'committee', 'special_district', 'court', 'agency_board', 'other')),
  check (status in ('active', 'needs_review', 'archived')),
  check (source_count >= 0)
);

create table if not exists public.public_body_members (
  id uuid primary key default gen_random_uuid(),
  public_body_id uuid not null references public.public_bodies(id) on delete cascade,
  entity_id uuid,
  member_name text not null,
  role_title text,
  district_or_place text,
  term_start date,
  term_end date,
  source_url text,
  status text default 'active' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  check (status in ('active', 'needs_review', 'former', 'vacant', 'archived'))
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  public_body_id uuid references public.public_bodies(id) on delete set null,
  title text not null,
  slug text unique not null,
  meeting_date timestamptz,
  location text,
  agenda_url text,
  minutes_url text,
  video_url text,
  transcript_url text,
  status text default 'scheduled' not null,
  source_count int default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  check (status in ('scheduled', 'completed', 'canceled', 'minutes_pending', 'minutes_available', 'video_available', 'needs_sources')),
  check (source_count >= 0)
);

create table if not exists public.meeting_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  item_number text,
  title text not null,
  description text,
  action_type text,
  vote_result text,
  source_url text,
  status text default 'needs_review' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  check (status in ('needs_review', 'source_backed', 'verified', 'rejected', 'archived'))
);

create table if not exists public.meeting_votes (
  id uuid primary key default gen_random_uuid(),
  meeting_item_id uuid not null references public.meeting_items(id) on delete cascade,
  entity_id uuid,
  voter_name text,
  vote_position text,
  source_url text,
  confidence text default 'needs_review' not null,
  created_at timestamptz default now() not null,
  check (confidence in ('needs_review', 'source_backed', 'verified', 'missing_source'))
);

create index if not exists public_bodies_slug_idx on public.public_bodies(slug);
create index if not exists public_bodies_type_location_idx on public.public_bodies(body_type, state, county, city);
create index if not exists public_body_members_body_idx on public.public_body_members(public_body_id, status);
create index if not exists meetings_body_date_idx on public.meetings(public_body_id, meeting_date desc);
create index if not exists meetings_slug_idx on public.meetings(slug);
create index if not exists meeting_items_meeting_idx on public.meeting_items(meeting_id, status);
create index if not exists meeting_votes_item_idx on public.meeting_votes(meeting_item_id);

alter table public.public_bodies enable row level security;
alter table public.public_body_members enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_items enable row level security;
alter table public.meeting_votes enable row level security;

grant select on public.public_bodies to anon, authenticated;
grant select on public.public_body_members to anon, authenticated;
grant select on public.meetings to anon, authenticated;
grant select on public.meeting_items to anon, authenticated;
grant select on public.meeting_votes to anon, authenticated;

grant insert, update, delete on public.public_bodies to authenticated;
grant insert, update, delete on public.public_body_members to authenticated;
grant insert, update, delete on public.meetings to authenticated;
grant insert, update, delete on public.meeting_items to authenticated;
grant insert, update, delete on public.meeting_votes to authenticated;

drop policy if exists "Public can read active public bodies" on public.public_bodies;
drop policy if exists "Admins can manage public bodies" on public.public_bodies;
drop policy if exists "Public can read active public body members" on public.public_body_members;
drop policy if exists "Admins can manage public body members" on public.public_body_members;
drop policy if exists "Public can read public meetings" on public.meetings;
drop policy if exists "Admins can manage meetings" on public.meetings;
drop policy if exists "Public can read public meeting items" on public.meeting_items;
drop policy if exists "Admins can manage meeting items" on public.meeting_items;
drop policy if exists "Public can read public meeting votes" on public.meeting_votes;
drop policy if exists "Admins can manage meeting votes" on public.meeting_votes;

create policy "Public can read active public bodies"
  on public.public_bodies for select
  using (status in ('active', 'needs_review'));

create policy "Admins can manage public bodies"
  on public.public_bodies for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Public can read active public body members"
  on public.public_body_members for select
  using (status in ('active', 'needs_review', 'former', 'vacant'));

create policy "Admins can manage public body members"
  on public.public_body_members for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Public can read public meetings"
  on public.meetings for select
  using (status in ('scheduled', 'completed', 'minutes_pending', 'minutes_available', 'video_available', 'needs_sources'));

create policy "Admins can manage meetings"
  on public.meetings for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Public can read public meeting items"
  on public.meeting_items for select
  using (status in ('needs_review', 'source_backed', 'verified'));

create policy "Admins can manage meeting items"
  on public.meeting_items for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Public can read public meeting votes"
  on public.meeting_votes for select
  using (confidence in ('needs_review', 'source_backed', 'verified', 'missing_source'));

create policy "Admins can manage meeting votes"
  on public.meeting_votes for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

drop trigger if exists set_public_bodies_updated_at on public.public_bodies;
create trigger set_public_bodies_updated_at
  before update on public.public_bodies
  for each row execute function public.handle_updated_at();

drop trigger if exists set_public_body_members_updated_at on public.public_body_members;
create trigger set_public_body_members_updated_at
  before update on public.public_body_members
  for each row execute function public.handle_updated_at();

drop trigger if exists set_meetings_updated_at on public.meetings;
create trigger set_meetings_updated_at
  before update on public.meetings
  for each row execute function public.handle_updated_at();

drop trigger if exists set_meeting_items_updated_at on public.meeting_items;
create trigger set_meeting_items_updated_at
  before update on public.meeting_items
  for each row execute function public.handle_updated_at();
