-- ============================================================
-- RepWatchr GideonAI and Member Tracking Tables
-- ============================================================
-- Submitted searches/prompts are collected. Raw keystrokes are not logged.
-- Use this after the base Supabase schema and role tables.

create table if not exists public.gideon_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('search', 'chat', 'research_note', 'prompt_button')),
  content text not null check (char_length(content) between 1 and 5000),
  page_path text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create table if not exists public.member_tracked_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  label text not null check (char_length(label) between 1 and 200),
  href text not null check (char_length(href) between 1 and 1000),
  item_type text not null default 'official'
    check (item_type in ('official', 'school_board', 'county', 'race', 'research')),
  notes text check (char_length(coalesce(notes, '')) <= 2000),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.member_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  display_name text check (char_length(coalesce(display_name, '')) <= 120),
  home_location text check (char_length(coalesce(home_location, '')) <= 200),
  preferred_state text not null default 'TX' check (char_length(preferred_state) between 2 and 40),
  research_focus text check (char_length(coalesce(research_focus, '')) <= 2000),
  public_profile_enabled boolean not null default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.member_research_theories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null check (char_length(title) between 1 and 240),
  target text not null check (char_length(target) between 1 and 240),
  summary text not null check (char_length(summary) between 1 and 3000),
  source_links text[] not null default '{}'::text[],
  next_check text check (char_length(coalesce(next_check, '')) <= 2000),
  status text not null default 'Needs source'
    check (status in ('Needs source', 'Testing', 'Record-backed', 'Ready to share')),
  confidence text not null default 'Lead'
    check (confidence in ('Lead', 'Medium', 'Strong')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.member_action_packets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  target text not null check (char_length(target) between 1 and 240),
  jurisdiction text check (char_length(coalesce(jurisdiction, '')) <= 180),
  issue text not null check (char_length(issue) between 1 and 3000),
  evidence_links text[] not null default '{}'::text[],
  next_moves text[] not null default '{}'::text[],
  records_request text check (char_length(coalesce(records_request, '')) <= 8000),
  timeline_starter text check (char_length(coalesce(timeline_starter, '')) <= 8000),
  share_brief text check (char_length(coalesce(share_brief, '')) <= 5000),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_gideon_interactions_user on public.gideon_interactions(user_id, created_at desc);
create index if not exists idx_gideon_interactions_kind on public.gideon_interactions(kind, created_at desc);
create index if not exists idx_member_tracked_items_user on public.member_tracked_items(user_id, created_at desc);
create index if not exists idx_member_profiles_user on public.member_profiles(user_id);
create index if not exists idx_member_research_theories_user on public.member_research_theories(user_id, updated_at desc);
create index if not exists idx_member_action_packets_user on public.member_action_packets(user_id, created_at desc);

alter table public.gideon_interactions enable row level security;
alter table public.member_tracked_items enable row level security;
alter table public.member_profiles enable row level security;
alter table public.member_research_theories enable row level security;
alter table public.member_action_packets enable row level security;

drop policy if exists "Submitted Gideon interactions can be collected" on public.gideon_interactions;
drop policy if exists "Users can read own Gideon interactions and admins can read all" on public.gideon_interactions;
drop policy if exists "Users can manage own tracked items" on public.member_tracked_items;
drop policy if exists "Users can manage own member profile" on public.member_profiles;
drop policy if exists "Users can manage own research theories" on public.member_research_theories;
drop policy if exists "Users can manage own action packets" on public.member_action_packets;

create policy "Submitted Gideon interactions can be collected"
  on public.gideon_interactions for insert
  to anon, authenticated
  with check (user_id is null or auth.uid() = user_id);

create policy "Users can read own Gideon interactions and admins can read all"
  on public.gideon_interactions for select
  using (auth.uid() = user_id or public.is_repw_admin());

create policy "Users can manage own tracked items"
  on public.member_tracked_items for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own member profile"
  on public.member_profiles for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own research theories"
  on public.member_research_theories for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own action packets"
  on public.member_action_packets for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists set_member_tracked_items_updated_at on public.member_tracked_items;
create trigger set_member_tracked_items_updated_at
  before update on public.member_tracked_items
  for each row execute function public.handle_updated_at();

drop trigger if exists set_member_profiles_updated_at on public.member_profiles;
create trigger set_member_profiles_updated_at
  before update on public.member_profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists set_member_research_theories_updated_at on public.member_research_theories;
create trigger set_member_research_theories_updated_at
  before update on public.member_research_theories
  for each row execute function public.handle_updated_at();

drop trigger if exists set_member_action_packets_updated_at on public.member_action_packets;
create trigger set_member_action_packets_updated_at
  before update on public.member_action_packets
  for each row execute function public.handle_updated_at();
