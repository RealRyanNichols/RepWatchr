-- Add the article store already referenced by the application.
-- Drafts and run logs are service-role only. The public may read approved,
-- published articles whose publication time has arrived.
begin;

create table if not exists public.repwatchr_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 160),
  title text not null check (length(title) between 1 and 200),
  dek text not null check (length(dek) between 1 and 1000),
  content text not null check (length(content) between 100 and 150000),
  author text not null default 'RepWatchr Editorial Desk',
  topic_key text not null,
  scope text not null check (scope in ('national', 'texas', 'east-texas')),
  official_ids text[] not null default '{}',
  tags text[] not null default '{}',
  source_links jsonb not null default '[]' check (jsonb_typeof(source_links) = 'array'),
  source_clip_ids text[] not null default '{}',
  primary_source_count integer not null default 0 check (primary_source_count >= 0),
  independent_publisher_count integer not null default 0 check (independent_publisher_count >= 0),
  midterm_relevance smallint not null default 0 check (midterm_relevance between 0 and 3),
  risk_flags text[] not null default '{}',
  editorial_status text not null default 'in_review' check (editorial_status in ('in_review', 'approved', 'rejected')),
  publish_status text not null default 'draft' check (publish_status in ('draft', 'published', 'archived')),
  reviewed_by text,
  reviewed_at timestamptz,
  published_at timestamptz,
  model text,
  prompt_version text,
  idempotency_key text unique,
  metadata jsonb not null default '{}' check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_article_requires_review check (
    publish_status <> 'published' or (
      editorial_status = 'approved' and reviewed_at is not null
      and nullif(trim(reviewed_by), '') is not null and published_at is not null
      and jsonb_array_length(source_links) > 0
    )
  )
);

create index if not exists repwatchr_articles_public_date_idx
  on public.repwatchr_articles (published_at desc)
  where editorial_status = 'approved' and publish_status = 'published';

create table if not exists public.repwatchr_editorial_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null check (status in ('started', 'completed', 'partial', 'failed')),
  target_count integer not null check (target_count between 1 and 5),
  drafted_count integer not null default 0 check (drafted_count >= 0),
  published_count integer not null default 0 check (published_count >= 0),
  held_count integer not null default 0 check (held_count >= 0),
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.repwatchr_articles enable row level security;
alter table public.repwatchr_editorial_runs enable row level security;
revoke all on public.repwatchr_articles from public, anon, authenticated;
revoke all on public.repwatchr_editorial_runs from public, anon, authenticated;

-- Do not expose draft prompts, risk notes or run logs in public article queries.
grant select (
  slug, title, dek, content, author, scope, official_ids, tags, source_links,
  primary_source_count, independent_publisher_count, midterm_relevance,
  published_at, reviewed_by, reviewed_at, topic_key, editorial_status, publish_status
) on public.repwatchr_articles to anon, authenticated;
grant all on public.repwatchr_articles, public.repwatchr_editorial_runs to service_role;

drop policy if exists repwatchr_articles_public_read on public.repwatchr_articles;
create policy repwatchr_articles_public_read on public.repwatchr_articles for select to anon, authenticated
  using (editorial_status = 'approved' and publish_status = 'published' and published_at <= now());

comment on table public.repwatchr_articles is 'Approved public articles and private editorial drafts. A generated draft is not a reviewed publication.';
comment on table public.repwatchr_editorial_runs is 'Private editorial execution records. Never expose to public API or article readers.';
commit;
