begin;

create table if not exists public.race_polls (
  slug text primary key,
  question text not null,
  status text not null default 'draft'
    check (status in ('draft', 'open', 'closed', 'archived')),
  opens_at timestamptz,
  closes_at timestamptz,
  minimum_public_segment_size integer not null default 25
    check (minimum_public_segment_size between 10 and 500),
  methodology_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.race_poll_options (
  poll_slug text not null references public.race_polls(slug) on delete cascade,
  option_id text not null,
  label text not null,
  display_order integer not null,
  active boolean not null default true,
  primary key (poll_slug, option_id),
  unique (poll_slug, display_order)
);

create table if not exists public.race_poll_responses (
  id uuid primary key default gen_random_uuid(),
  poll_slug text not null references public.race_polls(slug) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  option_id text not null,
  segment text not null
    check (segment in ('verified_marion', 'verified_outside', 'residence_unverified')),
  verification_status_at_vote text not null,
  geography_verified_at timestamptz,
  human_check text not null check (human_check in ('turnstile')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (poll_slug, user_id),
  foreign key (poll_slug, option_id)
    references public.race_poll_options(poll_slug, option_id)
);

create table if not exists private.race_poll_response_history (
  id bigint generated always as identity primary key,
  response_id uuid not null,
  poll_slug text not null,
  user_id uuid not null,
  previous_option_id text,
  next_option_id text not null,
  previous_segment text,
  next_segment text not null,
  changed_at timestamptz not null default now()
);

create or replace function private.repw_audit_race_poll_response()
returns trigger
language plpgsql
security definer
set search_path = private, public
as $$
begin
  insert into private.race_poll_response_history (
    response_id,
    poll_slug,
    user_id,
    previous_option_id,
    next_option_id,
    previous_segment,
    next_segment
  )
  values (
    new.id,
    new.poll_slug,
    new.user_id,
    case when tg_op = 'UPDATE' then old.option_id else null end,
    new.option_id,
    case when tg_op = 'UPDATE' then old.segment else null end,
    new.segment
  );
  return new;
end;
$$;

drop trigger if exists repw_audit_race_poll_response on public.race_poll_responses;
create trigger repw_audit_race_poll_response
after insert or update of option_id, segment
on public.race_poll_responses
for each row execute function private.repw_audit_race_poll_response();

alter table public.race_polls enable row level security;
alter table public.race_poll_options enable row level security;
alter table public.race_poll_responses enable row level security;
alter table public.race_poll_responses force row level security;
alter table private.race_poll_response_history enable row level security;
alter table private.race_poll_response_history force row level security;

drop policy if exists race_polls_public_open_read on public.race_polls;
create policy race_polls_public_open_read
on public.race_polls for select
to anon, authenticated
using (status in ('open', 'closed'));

drop policy if exists race_poll_options_public_read on public.race_poll_options;
create policy race_poll_options_public_read
on public.race_poll_options for select
to anon, authenticated
using (
  active
  and exists (
    select 1
    from public.race_polls p
    where p.slug = race_poll_options.poll_slug
      and p.status in ('open', 'closed')
  )
);

revoke all on table public.race_poll_responses from public, anon, authenticated;
revoke all on table private.race_poll_response_history from public, anon, authenticated;
grant select on table public.race_polls to anon, authenticated, service_role;
grant select on table public.race_poll_options to anon, authenticated, service_role;
grant all on table public.race_poll_responses to service_role;
grant all on table private.race_poll_response_history to service_role;
grant usage, select on sequence private.race_poll_response_history_id_seq to service_role;

insert into public.race_polls (
  slug,
  question,
  status,
  opens_at,
  closes_at,
  minimum_public_segment_size,
  methodology_version
)
values (
  'marion-county-judge-2026',
  'If the election were today, who would you support for Marion County Judge?',
  'draft',
  null,
  '2026-11-04 06:00:00+00',
  25,
  'race-community-pulse-v1'
)
on conflict (slug) do update
set question = excluded.question,
    minimum_public_segment_size = excluded.minimum_public_segment_size,
    methodology_version = excluded.methodology_version,
    updated_at = now();

insert into public.race_poll_options (poll_slug, option_id, label, display_order)
values
  ('marion-county-judge-2026', 'dina-k-carroll', 'Dina K. Carroll', 1),
  ('marion-county-judge-2026', 'leward-j-lafleur-ii', 'Leward J. LaFleur II', 2)
on conflict (poll_slug, option_id) do update
set label = excluded.label,
    display_order = excluded.display_order,
    active = true;

comment on table public.race_poll_responses is
  'Private one-account/one-current-response ledger. Segment and verification fields are server stamped; no raw row is client-readable.';
comment on table private.race_poll_response_history is
  'Immutable audit trail of response and verified-geography segment changes.';

commit;
