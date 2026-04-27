-- ============================================================
-- RepWatchr Faretta AI Analytics
-- ============================================================
-- Stores submitted Faretta searches and chat prompts.
-- Raw keystrokes are not logged. Content is inserted only after submit.

create table if not exists public.faretta_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('search', 'chat', 'research_note', 'prompt_button')),
  content text not null check (char_length(content) between 1 and 5000),
  page_path text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create index if not exists idx_faretta_interactions_user
  on public.faretta_interactions(user_id, created_at desc);

create index if not exists idx_faretta_interactions_kind
  on public.faretta_interactions(kind, created_at desc);

alter table public.faretta_interactions enable row level security;

drop policy if exists "Submitted Faretta interactions can be collected" on public.faretta_interactions;
drop policy if exists "Users can read own Faretta interactions and admins can read all" on public.faretta_interactions;

create policy "Submitted Faretta interactions can be collected"
  on public.faretta_interactions for insert
  to anon, authenticated
  with check (user_id is null or auth.uid() = user_id);

create policy "Users can read own Faretta interactions and admins can read all"
  on public.faretta_interactions for select
  using (auth.uid() = user_id or public.is_repw_admin());

create or replace view public.faretta_interaction_counts as
select
  kind,
  count(*)::int as total,
  max(created_at) as last_interaction_at
from public.faretta_interactions
group by kind;

grant select on public.faretta_interaction_counts to authenticated;
