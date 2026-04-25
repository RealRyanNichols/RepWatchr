-- ============================================================
-- East Texas Official Tracker - Comments Schema
-- ============================================================
-- Run this in your Supabase SQL Editor to add the comments system.

-- Comments table: public discussion on officials.
-- Lawful viewpoint disagreement stays visible. RepWatchr ranks comments by
-- verification and evidence; it does not shadow-ban constitutionally protected
-- speech because the viewpoint is unpopular.
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  official_id text not null,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  comment_kind text not null default 'comment'
    check (comment_kind in ('comment', 'question', 'official_answer', 'source_note')),
  author_type text not null default 'signed_in'
    check (author_type in ('claimed_official', 'verified_parent', 'verified_resident', 'journalist', 'signed_in', 'anonymous')),
  rank_score integer not null default 30 check (rank_score between 0 and 100),
  content text not null check (char_length(content) between 1 and 2000),
  display_name text not null check (char_length(display_name) between 1 and 50),
  county text not null,
  contains_source boolean not null default false,
  source_url text,
  question_status text not null default 'open'
    check (question_status in ('open', 'answered', 'needs_source', 'closed')),
  visibility_status text not null default 'visible'
    check (visibility_status in ('visible', 'flagged_for_review', 'removed_illegal')),
  moderation_reason text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Indexes
create index if not exists idx_comments_official on public.comments(official_id, created_at desc);
create index if not exists idx_comments_user on public.comments(user_id);
create index if not exists idx_comments_public_rank on public.comments(official_id, visibility_status, rank_score desc, created_at desc);
create index if not exists idx_comments_parent on public.comments(parent_comment_id, created_at asc);

-- Row Level Security
alter table public.comments enable row level security;

drop policy if exists "Verified users can insert comments" on public.comments;
drop policy if exists "Authenticated users can insert comments" on public.comments;

-- Anyone can read comments (they're public discussion)
create policy "Anyone can view comments"
  on public.comments for select
  using (true);

-- Any signed-in user can post. Verified/claimed/sourced comments rank higher;
-- anonymous signed-in comments remain visible unless illegal or privacy-violating.
create policy "Authenticated users can insert comments"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update their own comments
create policy "Users can update own comments"
  on public.comments for update
  using (auth.uid() = user_id);

-- Users can delete their own comments
create policy "Users can delete own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

-- Auto-update timestamps
create trigger set_comments_updated_at
  before update on public.comments
  for each row execute function public.handle_updated_at();
