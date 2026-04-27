-- ============================================================
-- RepWatchr Citizen Grades (A-F)
-- ============================================================
-- Verified Texas voters assign a letter grade A through F to an official or
-- school-board candidate. One grade per user per official, updatable. Public
-- aggregate views are available to anyone; individual grades are only readable
-- by the user who cast them.

create table if not exists public.citizen_grades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  official_id text not null,
  grade text check (grade in ('A', 'B', 'C', 'D', 'F')) not null,
  county text not null,
  rationale text check (rationale is null or char_length(rationale) <= 500),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, official_id)
);

create index if not exists idx_citizen_grades_official on public.citizen_grades(official_id);
create index if not exists idx_citizen_grades_official_county on public.citizen_grades(official_id, county);
create index if not exists idx_citizen_grades_user on public.citizen_grades(user_id);

alter table public.citizen_grades enable row level security;

create policy "Users can view own grades"
  on public.citizen_grades for select
  using (auth.uid() = user_id);

create policy "Users can insert own grades"
  on public.citizen_grades for insert
  with check (auth.uid() = user_id);

create policy "Users can update own grades"
  on public.citizen_grades for update
  using (auth.uid() = user_id);

create policy "Users can delete own grades"
  on public.citizen_grades for delete
  using (auth.uid() = user_id);

-- Statewide grade aggregate view. GPA scale A=4 ... F=0.
create or replace view public.citizen_grade_summary as
select
  official_id,
  count(*) as total_grades,
  count(*) filter (where grade = 'A') as a_count,
  count(*) filter (where grade = 'B') as b_count,
  count(*) filter (where grade = 'C') as c_count,
  count(*) filter (where grade = 'D') as d_count,
  count(*) filter (where grade = 'F') as f_count,
  round(
    (
      4 * count(*) filter (where grade = 'A') +
      3 * count(*) filter (where grade = 'B') +
      2 * count(*) filter (where grade = 'C') +
      1 * count(*) filter (where grade = 'D')
    )::numeric / nullif(count(*), 0),
    2
  ) as gpa
from public.citizen_grades
group by official_id;

create or replace view public.citizen_grade_summary_by_county as
select
  official_id,
  county,
  count(*) as total_grades,
  count(*) filter (where grade = 'A') as a_count,
  count(*) filter (where grade = 'B') as b_count,
  count(*) filter (where grade = 'C') as c_count,
  count(*) filter (where grade = 'D') as d_count,
  count(*) filter (where grade = 'F') as f_count,
  round(
    (
      4 * count(*) filter (where grade = 'A') +
      3 * count(*) filter (where grade = 'B') +
      2 * count(*) filter (where grade = 'C') +
      1 * count(*) filter (where grade = 'D')
    )::numeric / nullif(count(*), 0),
    2
  ) as gpa
from public.citizen_grades
group by official_id, county;

grant select on public.citizen_grade_summary to anon, authenticated;
grant select on public.citizen_grade_summary_by_county to anon, authenticated;

create trigger set_citizen_grades_updated_at
  before update on public.citizen_grades
  for each row execute function public.handle_updated_at();
