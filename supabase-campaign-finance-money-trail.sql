-- ============================================================
-- RepWatchr Campaign Finance and Money Trail System
-- ============================================================
-- Public campaign finance and public vendor/procurement records only.
-- These rows must stay neutral: a contribution, expenditure, contract, or
-- filing row does not imply wrongdoing by itself.

create table if not exists public.finance_records (
  id uuid primary key default gen_random_uuid(),
  entity_id text,
  entity_type text,
  race_id uuid,
  committee_name text,
  candidate_name text,
  counterparty_name text,
  counterparty_type text,
  record_type text not null,
  amount numeric,
  transaction_date date,
  cycle text,
  jurisdiction text,
  state text,
  source_url text not null,
  source_key text,
  external_id text,
  confidence text default 'source_backed' not null,
  status text default 'active' not null,
  raw_payload jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  check (record_type in ('contribution', 'expenditure', 'loan', 'refund', 'in_kind', 'transfer', 'debt', 'filing', 'report_summary', 'contract', 'payment', 'procurement', 'invoice', 'grant', 'award', 'reimbursement', 'other')),
  check (counterparty_type is null or counterparty_type in ('individual', 'PAC', 'committee', 'business', 'union', 'nonprofit', 'candidate', 'party', 'vendor', 'government_entity', 'unknown')),
  check (confidence in ('source_backed', 'needs_review', 'official_record', 'aggregate_source', 'missing_source')),
  check (status in ('active', 'needs_review', 'duplicate', 'archived', 'hidden', 'rejected')),
  check (amount is null or amount >= 0)
);

create table if not exists public.committees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  committee_type text,
  jurisdiction text,
  state text,
  fec_id text,
  state_id text,
  official_url text,
  source_url text,
  status text default 'active' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  check (committee_type is null or committee_type in ('candidate_committee', 'officeholder_account', 'PAC', 'party_committee', 'source_path', 'unknown')),
  check (status in ('active', 'needs_review', 'duplicate', 'archived', 'hidden'))
);

create table if not exists public.donor_entities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  donor_type text,
  jurisdiction text,
  state text,
  source_url text,
  status text default 'active' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  check (donor_type is null or donor_type in ('individual', 'PAC', 'committee', 'business', 'union', 'nonprofit', 'candidate', 'party', 'vendor', 'government_entity', 'unknown')),
  check (status in ('active', 'needs_review', 'duplicate', 'archived', 'hidden'))
);

create table if not exists public.vendor_records (
  id uuid primary key default gen_random_uuid(),
  entity_id text,
  agency_id uuid,
  vendor_name text not null,
  amount numeric,
  transaction_date date,
  record_type text,
  contract_or_invoice text,
  source_url text not null,
  confidence text default 'source_backed' not null,
  status text default 'active' not null,
  raw_payload jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  check (record_type is null or record_type in ('contract', 'payment', 'procurement', 'invoice', 'grant', 'award', 'reimbursement', 'other')),
  check (confidence in ('source_backed', 'needs_review', 'official_record', 'aggregate_source', 'missing_source')),
  check (status in ('active', 'needs_review', 'duplicate', 'archived', 'hidden', 'rejected')),
  check (amount is null or amount >= 0)
);

create index if not exists finance_records_entity_idx on public.finance_records(entity_type, entity_id, status);
create index if not exists finance_records_counterparty_idx on public.finance_records(counterparty_name, counterparty_type);
create index if not exists finance_records_cycle_state_idx on public.finance_records(cycle, state, jurisdiction);
create index if not exists finance_records_type_amount_idx on public.finance_records(record_type, amount desc);
create index if not exists committees_slug_idx on public.committees(slug);
create index if not exists committees_state_type_idx on public.committees(state, committee_type, status);
create index if not exists donor_entities_slug_idx on public.donor_entities(slug);
create index if not exists donor_entities_type_state_idx on public.donor_entities(donor_type, state, status);
create index if not exists vendor_records_entity_idx on public.vendor_records(entity_id, status);
create index if not exists vendor_records_vendor_idx on public.vendor_records(vendor_name, status);

alter table public.finance_records enable row level security;
alter table public.committees enable row level security;
alter table public.donor_entities enable row level security;
alter table public.vendor_records enable row level security;

grant select on public.finance_records to anon, authenticated;
grant select on public.committees to anon, authenticated;
grant select on public.donor_entities to anon, authenticated;
grant select on public.vendor_records to anon, authenticated;

grant insert, update, delete on public.finance_records to authenticated;
grant insert, update, delete on public.committees to authenticated;
grant insert, update, delete on public.donor_entities to authenticated;
grant insert, update, delete on public.vendor_records to authenticated;

drop policy if exists "Public can read active finance records" on public.finance_records;
drop policy if exists "Admins can manage finance records" on public.finance_records;
drop policy if exists "Public can read active committees" on public.committees;
drop policy if exists "Admins can manage committees" on public.committees;
drop policy if exists "Public can read active donor entities" on public.donor_entities;
drop policy if exists "Admins can manage donor entities" on public.donor_entities;
drop policy if exists "Public can read active vendor records" on public.vendor_records;
drop policy if exists "Admins can manage vendor records" on public.vendor_records;

create policy "Public can read active finance records"
  on public.finance_records for select
  using (status in ('active', 'needs_review', 'duplicate'));

create policy "Admins can manage finance records"
  on public.finance_records for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Public can read active committees"
  on public.committees for select
  using (status in ('active', 'needs_review', 'duplicate'));

create policy "Admins can manage committees"
  on public.committees for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Public can read active donor entities"
  on public.donor_entities for select
  using (status in ('active', 'needs_review', 'duplicate'));

create policy "Admins can manage donor entities"
  on public.donor_entities for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

create policy "Public can read active vendor records"
  on public.vendor_records for select
  using (status in ('active', 'needs_review', 'duplicate'));

create policy "Admins can manage vendor records"
  on public.vendor_records for all
  to authenticated
  using (public.is_repw_admin())
  with check (public.is_repw_admin());

drop trigger if exists set_finance_records_updated_at on public.finance_records;
create trigger set_finance_records_updated_at
  before update on public.finance_records
  for each row execute function public.handle_updated_at();

drop trigger if exists set_committees_updated_at on public.committees;
create trigger set_committees_updated_at
  before update on public.committees
  for each row execute function public.handle_updated_at();

drop trigger if exists set_donor_entities_updated_at on public.donor_entities;
create trigger set_donor_entities_updated_at
  before update on public.donor_entities
  for each row execute function public.handle_updated_at();

drop trigger if exists set_vendor_records_updated_at on public.vendor_records;
create trigger set_vendor_records_updated_at
  before update on public.vendor_records
  for each row execute function public.handle_updated_at();
