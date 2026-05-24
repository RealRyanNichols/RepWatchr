create table if not exists public.repwatchr_daily_clips (
  id text primary key,
  title text not null,
  summary text not null,
  source_url text not null,
  source_name text not null,
  published_at timestamptz,
  scope text not null check (scope in ('east-texas', 'texas', 'national')),
  state text,
  counties text[] not null default array[]::text[],
  cities text[] not null default array[]::text[],
  power_channels text[] not null default array[]::text[],
  matched_terms text[] not null default array[]::text[],
  status text not null default 'needs_review' check (status in ('needs_review', 'auto_published', 'approved', 'rejected', 'archived')),
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists repwatchr_daily_clips_source_url_idx
  on public.repwatchr_daily_clips (source_url);

create index if not exists repwatchr_daily_clips_published_at_idx
  on public.repwatchr_daily_clips (published_at desc);

create index if not exists repwatchr_daily_clips_scope_idx
  on public.repwatchr_daily_clips (scope);

alter table public.repwatchr_daily_clips enable row level security;

revoke all on public.repwatchr_daily_clips from anon, authenticated;

comment on table public.repwatchr_daily_clips is
  'Server-written RepWatchr daily wire clips collected from public RSS and news search sources.';

create table if not exists public.repwatchr_social_tokens (
  platform text primary key check (platform in ('facebook', 'x')),
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.repwatchr_social_tokens enable row level security;

revoke all on public.repwatchr_social_tokens from anon, authenticated;

comment on table public.repwatchr_social_tokens is
  'Server-only social OAuth token storage for RepWatchr autoposting. Never expose to public clients.';

create table if not exists public.repwatchr_social_posts (
  id uuid primary key default gen_random_uuid(),
  clip_id text not null,
  platform text not null check (platform in ('facebook', 'x')),
  status text not null check (status in ('pending', 'posted', 'skipped', 'error')),
  story_title text not null,
  story_url text not null,
  source_url text not null,
  source_name text not null,
  published_at timestamptz,
  message text not null,
  platform_post_id text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists repwatchr_social_posts_clip_platform_idx
  on public.repwatchr_social_posts (clip_id, platform);

create index if not exists repwatchr_social_posts_created_at_idx
  on public.repwatchr_social_posts (created_at desc);

create index if not exists repwatchr_social_posts_status_idx
  on public.repwatchr_social_posts (status);

alter table public.repwatchr_social_posts enable row level security;

revoke all on public.repwatchr_social_posts from anon, authenticated;

comment on table public.repwatchr_social_posts is
  'Server-only RepWatchr social autopost log. Used by the hourly cron to prevent duplicate Facebook and X posts.';
