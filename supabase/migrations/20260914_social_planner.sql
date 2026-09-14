-- The social planner: drafts stop here before anything reaches X or Facebook.
--
-- AGENTS.md: "Do not auto-publish, auto-text, auto-email, auto-DM ... without
-- approval" and "Any result that would publish ... must stop in approval_queue."
-- The existing autopost lane went straight from cron to the platform APIs with
-- no human in between. This table is the human.
--
-- The rules are constraints, not application code, so a bug in a route or a
-- future caller that forgets the gate still cannot publish an unreviewed post
-- in Ryan's name.
begin;

create table if not exists public.repwatchr_social_drafts (
  id uuid primary key default gen_random_uuid(),

  platform text not null check (platform in ('x', 'facebook')),
  body text not null check (length(btrim(body)) between 1 and 5000),
  -- The first line, stored separately so the planner list is scannable.
  hook text not null check (length(btrim(hook)) between 1 and 200),
  link_url text check (link_url is null or link_url ~ '^https?://'),

  -- Rotating the flavor is what keeps a feed from reading like a bot.
  flavor text not null default 'receipts' check (flavor in (
    'receipts', 'curiosity', 'local-accountability', 'legal-precision',
    'short-punch', 'pressure-build', 'record-correction'
  )),

  -- Provenance. Every draft says where it came from.
  source_kind text not null check (source_kind in (
    'daily_wire', 'notion', 'google_drive', 'fieldy_lead', 'x_trending', 'manual'
  )),
  source_links jsonb not null default '[]' check (jsonb_typeof(source_links) = 'array'),
  source_note text,

  -- Fieldy carries other people's recorded words. A lead drawn from a
  -- conversation names who was in it and can never be approved silently.
  conversation_participants text[] not null default '{}',
  requires_confirmation boolean not null default false,

  scope text not null check (scope in ('home-district', 'east-texas', 'texas', 'national')),
  official_ids text[] not null default '{}',

  editorial_status text not null default 'in_review'
    check (editorial_status in ('in_review', 'approved', 'rejected')),
  publish_status text not null default 'draft'
    check (publish_status in ('draft', 'posted', 'failed', 'archived')),
  reviewed_by text,
  reviewed_at timestamptz,
  review_note text,

  posted_at timestamptz,
  post_url text,
  post_error text,

  scheduled_for timestamptz,
  idempotency_key text unique,
  metadata jsonb not null default '{}' check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Nothing reaches a platform without a named human having approved it.
  constraint posted_requires_review check (
    publish_status <> 'posted' or (
      editorial_status = 'approved'
      and reviewed_at is not null
      and nullif(btrim(reviewed_by), '') is not null
      and posted_at is not null
    )
  ),

  -- "Report the truth" made structural: approval requires a source to point at.
  constraint approved_requires_source check (
    editorial_status <> 'approved' or jsonb_array_length(source_links) > 0
  ),

  -- A Fieldy-derived lead cannot be approved without a reviewer on the record.
  constraint confirmation_requires_reviewer check (
    not requires_confirmation
    or editorial_status <> 'approved'
    or nullif(btrim(reviewed_by), '') is not null
  ),

  -- X rejects >280 at the API. Catch it at write time, not at post time.
  constraint x_body_fits check (platform <> 'x' or length(body) <= 280)
);

create index if not exists repwatchr_social_drafts_queue_idx
  on public.repwatchr_social_drafts (created_at desc)
  where editorial_status = 'in_review' and publish_status = 'draft';

create index if not exists repwatchr_social_drafts_ready_idx
  on public.repwatchr_social_drafts (scheduled_for asc)
  where editorial_status = 'approved' and publish_status = 'draft';

create index if not exists repwatchr_social_drafts_posted_idx
  on public.repwatchr_social_drafts (posted_at desc)
  where publish_status = 'posted';

create or replace function public.repwatchr_social_drafts_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists repwatchr_social_drafts_touch on public.repwatchr_social_drafts;
create trigger repwatchr_social_drafts_touch
  before update on public.repwatchr_social_drafts
  for each row execute function public.repwatchr_social_drafts_touch();

-- Drafts are never public. They hold unreviewed claims about named people and,
-- for Fieldy leads, the names of people recorded in a private conversation.
--
-- Unlike repwatchr_articles there is no public-read policy and no column-level
-- select grant, because no row in this table is ever meant for a reader. The
-- published artifact is the post on the platform, not the draft.
alter table public.repwatchr_social_drafts enable row level security;

revoke all on public.repwatchr_social_drafts from public, anon, authenticated;
grant all on public.repwatchr_social_drafts to service_role;

comment on table public.repwatchr_social_drafts is
  'Private social drafts awaiting human review. Never expose to public queries: rows hold unreviewed claims and, for Fieldy leads, the names of people recorded in a private conversation.';

commit;
