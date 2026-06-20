-- ============================================================
-- RepWatchr Texas Election Contributions
-- ============================================================
-- Run after supabase-profile-claims.sql and supabase-superadmin-office.sql.
-- Do not run until the Supabase project is paid/active again.
-- After applying this SQL, set NEXT_PUBLIC_TEXAS_ELECTION_DB_SUBMISSIONS=true
-- in Vercel to switch the public Texas contribution form from packet mode to
-- live database review mode.
-- Citizen submissions default to private review. Operators decide what becomes
-- public so election pages stay source-backed instead of rumor-driven.

create table if not exists public.texas_election_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  race_slug text not null check (char_length(race_slug) between 1 and 160),
  race_title text not null check (char_length(race_title) between 1 and 240),
  contribution_type text not null check (
    contribution_type in (
      'candidate_info',
      'source_link',
      'event',
      'debate_clip',
      'funding_record',
      'local_issue',
      'county_result',
      'question_for_candidate',
      'correction',
      'other'
    )
  ),
  title text not null check (char_length(title) between 1 and 180),
  summary text not null check (char_length(summary) between 1 and 3000),
  source_url text not null check (source_url ~* '^https?://'),
  source_label text check (char_length(coalesce(source_label, '')) <= 180),
  county text check (char_length(coalesce(county, '')) <= 120),
  city text check (char_length(coalesce(city, '')) <= 120),
  contact_email text check (char_length(coalesce(contact_email, '')) <= 240),
  status text not null default 'needs_review' check (
    status in (
      'needs_review',
      'source_check',
      'accepted',
      'published',
      'rejected',
      'privacy_hold'
    )
  ),
  visibility_status text not null default 'private_review' check (
    visibility_status in (
      'private_review',
      'public_summary',
      'held',
      'removed'
    )
  ),
  reviewer_notes text check (char_length(coalesce(reviewer_notes, '')) <= 5000),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_texas_election_contributions_race
  on public.texas_election_contributions(race_slug, status, created_at desc);

create index if not exists idx_texas_election_contributions_user
  on public.texas_election_contributions(user_id, created_at desc);

create index if not exists idx_texas_election_contributions_review
  on public.texas_election_contributions(status, visibility_status, created_at desc);

alter table public.texas_election_contributions enable row level security;

drop policy if exists "Users create own Texas election contributions" on public.texas_election_contributions;
drop policy if exists "Users read own Texas election contributions" on public.texas_election_contributions;
drop policy if exists "Public reads approved Texas election contributions" on public.texas_election_contributions;
drop policy if exists "Operators manage Texas election contributions" on public.texas_election_contributions;

create policy "Users create own Texas election contributions"
  on public.texas_election_contributions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users read own Texas election contributions"
  on public.texas_election_contributions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Public reads approved Texas election contributions"
  on public.texas_election_contributions for select
  using (
    visibility_status = 'public_summary'
    and status in ('accepted', 'published')
  );

create policy "Operators manage Texas election contributions"
  on public.texas_election_contributions for all
  using (public.is_repw_operator())
  with check (public.is_repw_operator());

drop trigger if exists set_texas_election_contributions_updated_at on public.texas_election_contributions;
create trigger set_texas_election_contributions_updated_at
  before update on public.texas_election_contributions
  for each row execute function public.handle_updated_at();

grant select on public.texas_election_contributions to anon, authenticated;
grant insert on public.texas_election_contributions to authenticated;
grant update, delete on public.texas_election_contributions to authenticated;
