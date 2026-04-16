-- ============================================================
-- RepWatchr - Feedback / Report Incorrect Info Schema
-- ============================================================
-- Run this in your Supabase SQL Editor.

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  official_id text,
  page_url text not null,
  report_type text not null check (report_type in ('wrong-name', 'wrong-position', 'wrong-contact', 'wrong-party', 'wrong-score', 'wrong-funding', 'outdated', 'other')),
  description text not null check (char_length(description) between 1 and 5000),
  suggested_correction text,
  email text,
  status text default 'pending' check (status in ('pending', 'reviewed', 'fixed', 'dismissed')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_reports_status on public.reports(status, created_at desc);
create index if not exists idx_reports_official on public.reports(official_id);

alter table public.reports enable row level security;

-- Anyone can submit a report (even without logging in)
create policy "Anyone can insert reports"
  on public.reports for insert
  with check (true);

-- Only the submitter can see their own reports
create policy "Users can view own reports"
  on public.reports for select
  using (auth.uid() = user_id);

create trigger set_reports_updated_at
  before update on public.reports
  for each row execute function public.handle_updated_at();
