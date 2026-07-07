# RepWatchr Investor, Partner, Sponsor, and B2B Pipeline

RepWatchr may need investors, civic partners, data/API partners, journalists, legal/research customers, campaigns, public affairs customers, school board monitoring customers, county monitoring customers, organization dashboard customers, and clearly labeled civic education sponsors.

This system captures interest and gives admins a pipeline to qualify demand. It does not launch payments, offer securities, promise investment terms, promise political outcomes, or create hidden sponsored content.

## Public Routes

- `/investors`: public investor/partner page with mission, problem, product, flywheel, current assets, future revenue paths, trust standards, and interest form.
- `/partner`: redirect route to `/investors`.

The public page uses real loaded counts where available:

- current profile count from the RepWatchr data layer
- current public source URL count from the RepWatchr data stats helper
- current story/article count from the content layer

Unknown traction items are labeled as `Tracking now being built.` No fake user, traffic, packet, revenue, or submission counts are shown.

## Admin Routes

- `/admin/partners`: server-side admin-protected partner pipeline.
- `/api/admin/partners`: admin-only API for status changes, notes, assignments, and partner account creation.

Admins can:

- view leads
- filter by interest type
- filter by status
- assign owner
- add internal notes
- change status
- create partner accounts
- export filtered CSV for admin use
- write admin audit log entries for changes

## Public Intake API

- `/api/investor-interest`: validates and normalizes the public form submission, writes `partner_interest`, and creates an initial `partner_pipeline_events` row.

The API returns a reference ID to the user and uses clean public fallback language if the server-side Supabase admin client is unavailable.

## Database Tables

SQL file:

- `supabase-investor-partner-pipeline.sql`

Tables:

- `partner_interest`
- `partner_pipeline_events`
- `partner_accounts`

### `partner_interest`

Captures public interest:

- anonymous visitor ID
- optional authenticated user ID
- name
- email
- organization
- title
- website
- interest type
- budget or check size
- jurisdiction focus
- message
- attribution metadata
- status
- assigned admin user
- timestamps

### `partner_pipeline_events`

Tracks the admin timeline:

- submitted
- status changed
- note added
- assigned
- meeting scheduled
- account created
- exported
- archived

### `partner_accounts`

Tracks qualified organizations or future B2B accounts:

- name
- account type
- website
- contact email
- status
- notes
- timestamps

## Interest Types

- `investor`
- `data_api_partner`
- `media_partner`
- `legal_research_customer`
- `journalist`
- `civic_group`
- `nonprofit`
- `campaign_public_affairs`
- `school_board_monitoring`
- `county_monitoring`
- `organization_dashboard`
- `sponsor_civic_education`
- `government_contractor_monitoring`
- `other`

## Pipeline Statuses

- `new`
- `reviewed`
- `contacted`
- `meeting_scheduled`
- `qualified`
- `not_fit`
- `partner`
- `investor_interest`
- `archived`

## Account Statuses

- `prospect`
- `active`
- `paused`
- `not_fit`
- `archived`

## Analytics Events

Public:

- `investor_page_open`
- `partner_page_open`
- `partner_interest_started`
- `partner_interest_submitted`

Admin:

- `partner_pipeline_open`
- `partner_status_changed`

## Security and RLS

The SQL enables RLS on every pipeline table.

Public users may insert `partner_interest` rows only with safe defaults:

- status must be `new`
- assigned owner must be empty
- email must match a basic email pattern
- authenticated users may only set their own `user_id`

Authenticated users can read their own `partner_interest` rows.

Admins can manage:

- all partner interest rows
- partner pipeline events
- partner accounts

Admin access is checked through the existing `user_roles` admin role helper and the server-side admin route guard.

## Business Boundary

The public page includes this disclaimer:

> This page is for interest collection and partnership conversations. It is not a public securities offering and does not offer investment terms.

RepWatchr can discuss future revenue paths without selling them publicly:

- memberships
- research packets
- election watch desk
- county monitor
- school board monitor
- journalist dashboard
- organization dashboard
- public data API
- enterprise subscriptions
- aggregate non-identifying reports

Do not add checkout or investment language unless the relevant legal, payment, and compliance decisions are complete.

## Launch Requirement

Before using the live pipeline:

1. Apply `supabase-investor-partner-pipeline.sql` in Supabase.
2. Confirm `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are configured server-side.
3. Confirm admin users have the `admin` role in `user_roles`.
4. Submit one test interest form.
5. Confirm the row appears in `/admin/partners`.
6. Change status and confirm `admin_audit_log` and `partner_pipeline_events` receive entries.
