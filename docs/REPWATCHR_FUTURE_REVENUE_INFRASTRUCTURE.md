# RepWatchr Future Revenue Infrastructure

Status: hidden and dormant. Do not enable public monetization from this file set.

This work creates the rails for later paid data, intelligence, export, API, and organization account workflows without exposing them to public users.

## Hidden Packages

- Research Pro
- Election HQ
- Campaign Intel
- County Monitor
- School Board Monitor
- Local Media Dashboard
- Journalist Desk
- Attorney Desk
- Investor Dashboard
- Government Contractor Monitor
- Enterprise API
- Public Records API
- Data Export API
- CSV Export
- PDF Reports
- Weekly Intelligence
- White Label
- Organization Accounts
- Team Accounts
- Subscriptions
- API Keys
- Credits
- Invoices
- Licenses

## Feature Flags

Master server env flag:

```text
REPWATCHR_FUTURE_REVENUE_ENABLED
```

Package flags are generated from each package `flagKey`:

```text
REPWATCHR_FUTURE_REVENUE_RESEARCH_PRO_ENABLED
REPWATCHR_FUTURE_REVENUE_ELECTION_HQ_ENABLED
REPWATCHR_FUTURE_REVENUE_CAMPAIGN_INTEL_ENABLED
```

Default behavior:

- Master flag missing or false: every package stays hidden.
- Master flag true but package flag missing: that package stays hidden.
- Database rows also default to `hidden`, `checkout_enabled = false`, `stripe_enabled = false`, `api_enabled = false`, and `public_copy_allowed = false`.

## Supabase Migration

Run:

```sql
-- supabase-future-revenue.sql
```

The migration creates:

- `future_revenue_feature_flags`
- `future_revenue_packages`
- `future_revenue_organizations`
- `future_revenue_team_members`
- `future_revenue_subscriptions`
- `future_revenue_entitlements`
- `future_revenue_api_keys`
- `future_revenue_credit_ledger`
- `future_revenue_invoices`
- `future_revenue_licenses`
- `future_revenue_export_jobs`
- `future_revenue_audit_events`

It also creates:

- `future_revenue_package_registry`
- `future_revenue_admin_summary`

## Admin Visibility

Admin route:

```text
/admin/future-revenue
```

Admin API:

```text
/api/admin/future-revenue
```

Both are blocked by the existing Supabase admin-role check. Public users do not get a page, checkout flow, export flow, API key creation flow, invoice flow, or license flow.

## Guardrails

- Do not label these as public store items.
- Do not publish public package pages until a launch decision is made.
- Do not expose checkout, API issuance, exports, invoices, or licenses until pricing, terms, privacy, and fulfillment rules are approved.
- Store API key prefix and hash only. Never store raw API keys.
- Keep data monetization aggregate, source-backed, consent-aware, and privacy-safe.
- Do not sell private identity documents, private contact details, private voter records, raw verification documents, or sensitive user behavior.
- Use contracts and terms before enabling enterprise, white-label, data export, or API access.

## Activation Path Later

1. Confirm legal/privacy terms for the target package.
2. Confirm pricing, fulfillment, support load, and refund rules.
3. Run or verify `supabase-future-revenue.sql`.
4. Turn on the database flag for the package.
5. Set the matching server env flag.
6. Build the public/service page or authenticated tool surface.
7. Add checkout or manual invoice handling.
8. Add usage enforcement for seats, credits, exports, API quotas, and licenses.
9. Add audit events for every admin/account/billing change.
10. Run smoke tests before publishing.

## Current Non-Goals

- No public checkout.
- No public paid package pages.
- No live API key creation.
- No live CSV/PDF export delivery.
- No invoice sending.
- No license generation.
- No public marketing language.
