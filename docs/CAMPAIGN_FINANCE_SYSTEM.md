# RepWatchr Campaign Finance System

RepWatchr treats campaign finance as public filing data, not proof of misconduct. The money trail system tracks contributions, expenditures, committees, donor/source aggregates, public vendors, source gaps, and package-interest signals while keeping every public claim tied to a source.

## Public Surfaces

- `/funding` remains the campaign funding index for officials with loaded summaries or source paths.
- `/funding/[officialId]` shows the full official funding detail page.
- `/money` is the broader money trail index for finance records, committees, donor/source aggregates, and public vendor lanes.
- `/money/committees/[slug]` shows committee/source-path detail pages. These are `noindex` until public value is high enough.
- `/money/donors/[slug]` shows donor/source aggregate pages. These are `noindex` by default for privacy and quality control.
- Official profiles render a neutral money trail section below votes and scorecards.
- Texas race pages render a race money section with candidate finance links, cycles, filing status, and source gaps.

## Data Sources

Current production data comes from:

- `src/data/funding/*.json`
- `src/lib/campaign-finance-sources.ts`
- official profile source links
- race hub finance source links

The normalized adapter is `src/lib/money-trail.ts`. It converts static funding files into records shaped like the future database tables. This lets the product ship UI now while keeping the database model ready for FEC, Texas Ethics Commission, public procurement, and admin imports.

## Database

SQL file:

- `supabase-campaign-finance-money-trail.sql`

Tables:

- `finance_records`
- `committees`
- `donor_entities`
- `vendor_records`

All tables:

- use RLS
- grant explicit Data API access to `anon` and `authenticated`
- allow public read only for active/review rows
- allow writes only through admin role checks

## Admin Workflow

Admin route:

- `/admin/money`

Admin API:

- `/api/admin/money`

Admins can stage:

- finance records
- committees
- donor/source entities
- public vendor records

Admin changes write to `admin_audit_log` when Supabase is configured.

## Source Gaps

Every profile/race can show:

- missing finance summary
- missing committee link
- missing cycle
- missing filing source
- missing itemized expenditures

Each gap links to source submission.

## Analytics

Events:

- `finance_section_open`
- `finance_record_clicked`
- `finance_source_clicked`
- `finance_filter_used`
- `finance_gap_submit_clicked`
- `money_package_interest_clicked`

## Future Import Lanes

The next import targets are:

1. FEC candidate and committee IDs.
2. FEC itemized receipts/disbursements.
3. Texas Ethics Commission filer IDs and report PDFs/CSVs.
4. Public procurement and vendor records for agencies, counties, districts, and school boards.
5. Duplicate matching across donor/source aggregates, committees, and vendors.
