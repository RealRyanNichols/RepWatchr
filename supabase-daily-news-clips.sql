create table if not exists public.repwatchr_daily_clips (
  id text primary key,
  title text not null,
  summary text,
  source_url text not null unique,
  source_name text,
  published_at timestamptz,
  scope text,
  state text,
  counties text[] not null default '{}',
  cities text[] not null default '{}',
  power_channels text[] not null default '{}',
  matched_terms text[] not null default '{}',
  status text not null default 'needs_review',
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists repwatchr_daily_clips_published_idx
  on public.repwatchr_daily_clips (published_at desc);

create index if not exists repwatchr_daily_clips_scope_idx
  on public.repwatchr_daily_clips (scope, state, status);

create index if not exists repwatchr_daily_clips_channels_idx
  on public.repwatchr_daily_clips using gin (power_channels);

alter table public.repwatchr_daily_clips enable row level security;

comment on table public.repwatchr_daily_clips is
  'Daily public-source news clipping queue for RepWatchr. Cron inserts source-linked clips as needs_review; public publishing should require review.';
