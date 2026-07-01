# RepWatchr Beta Access System

The beta access system captures demand before public payment launch. It is not checkout, not a guarantee of access, and not a promise of turnaround or political results.

## Public Route

`/beta-access`

Query parameter:

- `?package=quick-record-check`
- `?package=official-record-brief`
- `?package=local-race-source-pack`
- `?package=election-watch-desk`
- `?package=school-board-monitor`

The page collects:

- name
- email
- package
- jurisdiction
- organization type
- urgency
- use case

## API Route

`POST /api/beta-access`

The route validates with Zod, rejects honeypot spam, allowlists package keys, inserts `beta_access_requests`, inserts a `pricing_experiment_events` row, and tracks `beta_access_requested`.

If Supabase service-role access or the table is missing, the route returns a clean failure. It does not expose secrets or payment setup details.

## Admin Route

`/admin/pricing`

Admin can:

- review requests
- change status
- invite beta users
- see package demand
- see pricing events
- inspect feature flags

Beta statuses:

- `new`
- `reviewed`
- `invited`
- `active`
- `not_fit`
- `waitlist`
- `archived`

## Database Tables

Migration: `supabase-pricing-experiments.sql`

Main table:

- `beta_access_requests`

Related tables:

- `pricing_experiments`
- `pricing_experiment_assignments`
- `pricing_experiment_events`
- `feature_flags`

## RLS Policy

- Public users may insert beta access requests.
- Authenticated users may read their own requests.
- Admins may read and manage all requests.
- Only admins may update status, invite code, and invite timestamps.

## Safety Language

The beta form must keep these boundaries clear:

- no payment is collected
- access is not guaranteed
- package scope is reviewed before acceptance
- RepWatchr does not provide legal advice
- RepWatchr does not promise political outcomes
- work is source organization, public-record review, monitoring, and civic intelligence

## Next Actions After Submission

The thank-you state shows:

1. submission ID
2. copyable summary text
3. services link
4. submit-source link
5. free account CTA

## Production Checklist

- Run `supabase-pricing-experiments.sql`.
- Confirm `/api/beta-access` inserts a row.
- Confirm `/admin/pricing` lists the row.
- Confirm paid service CTAs route to `/beta-access` when `ENABLE_PAYMENTS` is false.
- Confirm no public "Stripe not configured" or broken payment language appears.
- Confirm admin status changes write `admin_audit_logs` when that table exists.
