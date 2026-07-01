-- ============================================================
-- RepWatchr Public Data Import Adapter Layer
-- ============================================================
-- Run after:
-- 1. supabase-admin-dashboard.sql
-- 2. supabase-security-rls-hardening.sql may be run again after this file
--
-- Purpose:
-- - Register public-data sources and their normalized fields.
-- - Preserve import run/error history for admin review.
-- - Keep imported rows admin-reviewed before public display.
-- - Never expose API keys or raw private data through public grants.

create extension if not exists pgcrypto;

create or replace function public.repw_data_imports_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.data_sources (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique check (char_length(source_key) between 2 and 120),
  display_name text not null check (char_length(display_name) between 2 and 180),
  description text check (description is null or char_length(description) <= 2000),
  official_url text check (official_url is null or official_url ~* '^https?://' and char_length(official_url) <= 700),
  api_docs_url text check (api_docs_url is null or api_docs_url ~* '^https?://' and char_length(api_docs_url) <= 700),
  requires_api_key boolean not null default false,
  api_key_env_var text check (api_key_env_var is null or char_length(api_key_env_var) <= 120),
  status text not null default 'planned' check (status in ('active', 'manual_only', 'planned', 'disabled', 'retired')),
  supported_records jsonb not null default '[]'::jsonb,
  import_cadence text check (import_cadence is null or char_length(import_cadence) <= 500),
  last_import_run_id uuid references public.import_runs(id) on delete set null,
  last_success_at timestamptz,
  last_error_at timestamptz,
  record_count integer not null default 0 check (record_count >= 0),
  error_count integer not null default 0 check (error_count >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.data_source_fields (
  id uuid primary key default gen_random_uuid(),
  data_source_id uuid not null references public.data_sources(id) on delete cascade,
  field_name text not null check (char_length(field_name) between 2 and 160),
  field_label text check (field_label is null or char_length(field_label) <= 180),
  field_type text not null default 'text' check (field_type in ('text', 'number', 'date', 'datetime', 'url', 'boolean', 'json', 'enum')),
  normalized_field text check (normalized_field is null or char_length(normalized_field) <= 160),
  required boolean not null default false,
  public_safe boolean not null default true,
  notes text check (notes is null or char_length(notes) <= 1200),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(data_source_id, field_name)
);

create table if not exists public.import_runs (
  id uuid primary key default gen_random_uuid(),
  source_key text check (source_key is null or char_length(source_key) <= 120),
  source_name text check (source_name is null or char_length(source_name) <= 180),
  import_type text check (import_type is null or char_length(import_type) <= 120),
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'partial', 'failed', 'canceled')),
  started_at timestamptz default now() not null,
  completed_at timestamptz,
  records_seen integer not null default 0 check (records_seen >= 0),
  records_created integer not null default 0 check (records_created >= 0),
  records_updated integer not null default 0 check (records_updated >= 0),
  records_skipped integer not null default 0 check (records_skipped >= 0),
  errors_count integer not null default 0 check (errors_count >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create table if not exists public.import_errors (
  id uuid primary key default gen_random_uuid(),
  import_run_id uuid references public.import_runs(id) on delete cascade,
  source_key text check (source_key is null or char_length(source_key) <= 120),
  severity text not null default 'warning' check (severity in ('info', 'warning', 'error', 'critical')),
  message text not null check (char_length(message) between 1 and 5000),
  raw_payload jsonb,
  entity_type text check (entity_type is null or char_length(entity_type) <= 120),
  entity_id text check (entity_id is null or char_length(entity_id) <= 240),
  created_at timestamptz default now() not null
);

create index if not exists idx_data_sources_status
  on public.data_sources(status, updated_at desc);
create index if not exists idx_data_sources_key
  on public.data_sources(source_key);
create index if not exists idx_data_source_fields_source
  on public.data_source_fields(data_source_id, field_name);
create index if not exists idx_import_runs_source_status
  on public.import_runs(source_key, status, started_at desc);
create index if not exists idx_import_errors_run
  on public.import_errors(import_run_id, created_at desc)
  where import_run_id is not null;
create index if not exists idx_import_errors_source
  on public.import_errors(source_key, severity, created_at desc);

drop trigger if exists trg_data_sources_updated_at on public.data_sources;
create trigger trg_data_sources_updated_at
before update on public.data_sources
for each row execute function public.repw_data_imports_set_updated_at();

drop trigger if exists trg_data_source_fields_updated_at on public.data_source_fields;
create trigger trg_data_source_fields_updated_at
before update on public.data_source_fields
for each row execute function public.repw_data_imports_set_updated_at();

alter table public.data_sources enable row level security;
alter table public.data_source_fields enable row level security;
alter table public.import_runs enable row level security;
alter table public.import_errors enable row level security;

grant select, insert, update, delete on public.data_sources to authenticated, service_role;
grant select, insert, update, delete on public.data_source_fields to authenticated, service_role;
grant select, insert, update, delete on public.import_runs to authenticated, service_role;
grant select, insert, update, delete on public.import_errors to authenticated, service_role;

revoke all on public.data_sources from anon;
revoke all on public.data_source_fields from anon;
revoke all on public.import_runs from anon;
revoke all on public.import_errors from anon;

drop policy if exists "Admins manage data sources" on public.data_sources;
drop policy if exists "Admins manage data source fields" on public.data_source_fields;
drop policy if exists "Admins manage import runs" on public.import_runs;
drop policy if exists "Admins manage import errors" on public.import_errors;

create policy "Admins manage data sources"
  on public.data_sources for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Admins manage data source fields"
  on public.data_source_fields for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Admins manage import runs"
  on public.import_runs for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Admins manage import errors"
  on public.import_errors for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

insert into public.data_sources (
  source_key,
  display_name,
  description,
  official_url,
  api_docs_url,
  requires_api_key,
  api_key_env_var,
  status,
  supported_records,
  import_cadence,
  metadata
)
values
  (
    'fec',
    'Federal Election Commission',
    'Federal candidates, committees, receipts, disbursements, reports, and filings.',
    'https://www.fec.gov/data/',
    'https://api.open.fec.gov/developers/',
    true,
    'FEC_API_KEY',
    'planned',
    '["candidates","committees","receipts","disbursements","filings"]'::jsonb,
    'Nightly or manual batch once the API key is configured.',
    '{"public_record_only":true,"auto_publish":false}'::jsonb
  ),
  (
    'congress_gov',
    'Congress.gov',
    'Federal bills, members, actions, committees, and available roll-call metadata.',
    'https://www.congress.gov/',
    'https://api.congress.gov/',
    true,
    'CONGRESS_API_KEY',
    'planned',
    '["members","bills","actions","committees","roll_calls_if_available"]'::jsonb,
    'Daily or manual batch once the API key is configured.',
    '{"public_record_only":true,"auto_publish":false}'::jsonb
  ),
  (
    'openstates',
    'Open States',
    'State legislators, bills, votes, committees, and legislative events.',
    'https://openstates.org/',
    'https://docs.openstates.org/api-v3/',
    true,
    'OPENSTATES_API_KEY',
    'planned',
    '["state_legislators","bills","votes","committees","events"]'::jsonb,
    'Daily for active states after source/legal review.',
    '{"public_record_only":true,"auto_publish":false}'::jsonb
  ),
  (
    'texas_ethics_commission',
    'Texas Ethics Commission',
    'Texas campaign finance and ethics records through manual/import-ready files when automation is not feasible.',
    'https://www.ethics.state.tx.us/',
    null,
    false,
    null,
    'manual_only',
    '["campaign_finance_exports","candidate_reports","committee_reports","filings"]'::jsonb,
    'Manual file import first. Automation requires format-specific review.',
    '{"public_record_only":true,"auto_publish":false,"manual_import":true}'::jsonb
  ),
  (
    'local_manual_sources',
    'Local Manual Sources',
    'County elections pages, school board agendas/minutes, city minutes, law-enforcement public information pages, court/public records pages, and uploaded packets.',
    'https://www.repwatchr.com/submit-source',
    null,
    false,
    null,
    'active',
    '["county_elections","school_boards","city_minutes","agency_pages","court_sources","manual_packets"]'::jsonb,
    'Manual and admin-reviewed.',
    '{"public_record_only":true,"auto_publish":false,"manual_import":true}'::jsonb
  )
on conflict (source_key) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  official_url = excluded.official_url,
  api_docs_url = excluded.api_docs_url,
  requires_api_key = excluded.requires_api_key,
  api_key_env_var = excluded.api_key_env_var,
  status = excluded.status,
  supported_records = excluded.supported_records,
  import_cadence = excluded.import_cadence,
  metadata = excluded.metadata,
  updated_at = now();

with source_fields(source_key, field_name, field_label, field_type, normalized_field, required, public_safe, notes) as (
  values
    ('fec', 'candidate_id', 'Candidate ID', 'text', 'external_id', true, true, 'Public FEC identifier.'),
    ('fec', 'committee_id', 'Committee ID', 'text', 'committee_external_id', false, true, 'Public FEC committee identifier.'),
    ('fec', 'transaction_amt', 'Transaction amount', 'number', 'amount', false, true, 'Public campaign finance amount.'),
    ('fec', 'transaction_dt', 'Transaction date', 'date', 'transaction_date', false, true, 'Public filing transaction date.'),
    ('fec', 'contributor_name', 'Contributor name', 'text', 'counterparty_name', false, true, 'Use public filings only; do not enrich with private data.'),
    ('congress_gov', 'bioguideId', 'Bioguide ID', 'text', 'external_id', true, true, 'Public congressional member identifier.'),
    ('congress_gov', 'billNumber', 'Bill number', 'text', 'bill_external_id', false, true, 'Public bill identifier.'),
    ('congress_gov', 'latestAction', 'Latest action', 'json', 'bill_action', false, true, 'Public bill action payload.'),
    ('openstates', 'person_id', 'Person ID', 'text', 'external_id', true, true, 'Open States public person identifier.'),
    ('openstates', 'vote_event_id', 'Vote event ID', 'text', 'vote_external_id', false, true, 'Open States public vote identifier.'),
    ('openstates', 'jurisdiction', 'Jurisdiction', 'text', 'jurisdiction', false, true, 'State or local public jurisdiction label.'),
    ('texas_ethics_commission', 'filer_name', 'Filer name', 'text', 'candidate_name', false, true, 'Manual/public file field.'),
    ('texas_ethics_commission', 'amount', 'Amount', 'number', 'amount', false, true, 'Public filing amount.'),
    ('texas_ethics_commission', 'report_date', 'Report date', 'date', 'transaction_date', false, true, 'Public filing date.'),
    ('local_manual_sources', 'source_url', 'Source URL', 'url', 'source_url', true, true, 'Required for every manual source.'),
    ('local_manual_sources', 'target_entity', 'Target entity', 'text', 'entity_id', false, true, 'Official, agency, board, race, story, or source packet target.'),
    ('local_manual_sources', 'summary', 'Summary', 'text', 'public_summary', false, true, 'Admin-reviewed summary only.')
)
insert into public.data_source_fields (
  data_source_id,
  field_name,
  field_label,
  field_type,
  normalized_field,
  required,
  public_safe,
  notes
)
select
  ds.id,
  sf.field_name,
  sf.field_label,
  sf.field_type,
  sf.normalized_field,
  sf.required,
  sf.public_safe,
  sf.notes
from source_fields sf
join public.data_sources ds on ds.source_key = sf.source_key
on conflict (data_source_id, field_name) do update set
  field_label = excluded.field_label,
  field_type = excluded.field_type,
  normalized_field = excluded.normalized_field,
  required = excluded.required,
  public_safe = excluded.public_safe,
  notes = excluded.notes,
  updated_at = now();
