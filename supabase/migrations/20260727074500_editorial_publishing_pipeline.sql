-- Original RepWatchr reporting and distribution pipeline.
-- Public readers only see rows that have passed the explicit publish gate.

create table if not exists public.repwatchr_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  dek text not null,
  content text not null,
  author text not null default 'RepWatchr News Desk',
  scope text not null default 'national',
  topic_key text not null,
  official_ids text[] not null default '{}',
  tags text[] not null default '{}',
  source_links jsonb not null default '[]'::jsonb,
  source_clip_ids text[] not null default '{}',
  primary_source_count integer not null default 0 check (primary_source_count >= 0),
  independent_publisher_count integer not null default 0 check (independent_publisher_count >= 0),
  midterm_relevance smallint not null default 0 check (midterm_relevance between 0 and 3),
  editorial_status text not null default 'draft'
    check (editorial_status in ('draft', 'in_review', 'approved', 'rejected', 'archived')),
  publish_status text not null default 'draft'
    check (publish_status in ('draft', 'scheduled', 'published', 'withdrawn')),
  generation_status text not null default 'generated'
    check (generation_status in ('generated', 'failed', 'manual')),
  risk_flags text[] not null default '{}',
  review_notes text,
  reviewed_by text,
  reviewed_at timestamptz,
  scheduled_for timestamptz,
  published_at timestamptz,
  correction_status text not null default 'none'
    check (correction_status in ('none', 'under_review', 'corrected')),
  social_status text not null default 'pending'
    check (social_status in ('pending', 'partial', 'posted', 'held')),
  model text,
  prompt_version text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint repwatchr_articles_publish_gate check (
    publish_status <> 'published'
    or (
      editorial_status = 'approved'
      and reviewed_at is not null
      and reviewed_by is not null
      and published_at is not null
      and jsonb_array_length(source_links) >= 2
      and primary_source_count >= 1
      and cardinality(risk_flags) = 0
    )
  )
);

create index if not exists repwatchr_articles_public_idx
  on public.repwatchr_articles (published_at desc)
  where publish_status = 'published' and editorial_status = 'approved';

create index if not exists repwatchr_articles_queue_idx
  on public.repwatchr_articles (social_status, published_at)
  where publish_status = 'published' and editorial_status = 'approved';

alter table public.repwatchr_articles enable row level security;
revoke all on public.repwatchr_articles from anon, authenticated;
grant select on public.repwatchr_articles to anon, authenticated;

drop policy if exists "Public reads approved RepWatchr articles" on public.repwatchr_articles;
create policy "Public reads approved RepWatchr articles"
on public.repwatchr_articles
for select
to anon, authenticated
using (
  editorial_status = 'approved'
  and publish_status = 'published'
  and published_at <= now()
);

create table if not exists public.repwatchr_editorial_runs (
  id uuid primary key default gen_random_uuid(),
  run_date date not null default current_date,
  status text not null check (status in ('started', 'completed', 'partial', 'failed', 'skipped')),
  target_count smallint not null check (target_count between 1 and 5),
  drafted_count smallint not null default 0,
  published_count smallint not null default 0,
  held_count smallint not null default 0,
  source_clip_ids text[] not null default '{}',
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists repwatchr_editorial_runs_date_idx
  on public.repwatchr_editorial_runs (run_date desc, created_at desc);

alter table public.repwatchr_editorial_runs enable row level security;
revoke all on public.repwatchr_editorial_runs from anon, authenticated;

