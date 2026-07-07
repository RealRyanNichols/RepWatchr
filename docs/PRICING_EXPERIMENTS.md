# RepWatchr Pricing Experiments

RepWatchr pricing experiments test interest, messaging, pricing sensitivity, package structure, and beta demand before charging.

Payments are not publicly launched unless `ENABLE_PAYMENTS=true`.

## Tables

SQL file:

- `supabase-pricing-beta-access.sql`

Tables:

- `pricing_experiments`
- `pricing_experiment_assignments`
- `pricing_experiment_events`

## Package Candidates

Static package candidates live in:

- `src/lib/pricing-beta.ts`

Current candidates:

| Package | Test Prices |
| --- | --- |
| Quick Record Check | $49, $79, $99 |
| Official Record Brief | $199, $299, $499 |
| Local Race Source Pack | $149, $299, $499 |
| Election Watch Desk | $500/mo, $750/mo, $1,500/mo |
| School Board Monitor | $99/mo, $199/mo, $499/mo |

Do not show all price tests at once unless an experiment is active and the public display logic intentionally assigns a variant.

## Experiment Statuses

- `draft`
- `active`
- `paused`
- `completed`
- `archived`

## Events

Tracked events:

- `pricing_experiment_viewed`
- `pricing_variant_assigned`
- `pricing_cta_clicked`
- `beta_access_requested`
- `package_interest_submitted`
- `checkout_started`
- `checkout_completed`
- `beta_invite_sent`

Admin-only events also include:

- `experiment_created`
- `experiment_status_changed`
- `feature_flag_changed`
- `beta_status_changed`

## Public Behavior

If payments are disabled:

- show `Request beta access`
- collect package demand
- avoid checkout language
- avoid fake scarcity
- avoid guaranteed-outcome language

Expected ranges are shown only when beta package display is enabled. Otherwise public service pages say the package is in beta request mode.

## Admin Route

- `/admin/pricing`

Admins can:

- view package demand
- create pricing experiments
- change experiment status
- view variants
- review beta access requests
- create invite codes
- update beta status
- manage core feature flags
- write audit log entries

## Checkout Boundary

Existing Stripe checkout code remains behind:

- `ENABLE_PAYMENTS=true`
- Stripe server-side configuration

The client cannot turn checkout on by changing a button, URL, or package slug.

## Safety Copy

Allowed:

- `Request beta access`
- `Tell us what you need monitored`
- `RepWatchr is collecting demand before launching paid packages.`

Avoid:

- `Buy now`
- `Limited spots` unless true and configured
- `Guaranteed results`
- `Win your election`
- `Expose officials`

## Production Checklist

Before enabling public payments:

1. Apply `supabase-pricing-beta-access.sql`.
2. Confirm `/admin/pricing` is protected.
3. Confirm beta access requests save.
4. Confirm `ENABLE_PAYMENTS` is false in production until ready.
5. Confirm Stripe test checkout and webhook are verified.
6. Confirm package fulfillment/admin review process is ready.
7. Confirm public copy does not promise results.
