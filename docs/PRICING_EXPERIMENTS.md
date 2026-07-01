# RepWatchr Pricing Experiments

RepWatchr is not publicly charging in this phase unless `ENABLE_PAYMENTS=true`. The current goal is to learn demand, scope, urgency, and price sensitivity before checkout opens.

## Packages Under Test

| Package | Candidate prices | Launch posture |
| --- | --- | --- |
| Quick Record Check | $49, $79, $99 | Beta interest only until payments are enabled. |
| Official Record Brief | $199, $299, $499 | Beta interest only until payments are enabled. |
| Local Race Source Pack | $149, $299, $499 | Beta interest only until payments are enabled. |
| Election Watch Desk | $500/mo, $750/mo, $1,500/mo | Beta interest only until payments are enabled. |
| School Board Monitor | $99/mo, $199/mo, $499/mo | Future package candidate. |

## Data Model

Migration: `supabase-pricing-experiments.sql`

Tables:

- `pricing_experiments`
- `pricing_experiment_assignments`
- `pricing_experiment_events`
- `beta_access_requests`
- `feature_flags`

All experiments are seeded as `draft`. Admins can move an experiment to `active`, `paused`, `completed`, or `archived` from `/admin/pricing`.

## Events

Tracked events:

- `pricing_experiment_viewed`
- `pricing_variant_assigned`
- `pricing_variant_viewed`
- `pricing_cta_clicked`
- `beta_access_requested`
- `package_interest_submitted`
- `checkout_started` later
- `checkout_completed` later

## Public Behavior

When `ENABLE_PAYMENTS` is false:

- no public checkout link is rendered
- paid service CTAs route to `/beta-access`
- package pages say RepWatchr is collecting demand before paid checkout opens
- no "buy now" language is shown
- no fake scarcity is shown

When `ENABLE_BETA_PACKAGES` is false:

- the public pages avoid price-range testing language
- beta forms still collect package demand when linked directly

When `ENABLE_PAYMENTS` is true:

- package pages may render payment links only if the matching payment env var exists
- missing payment links fall back to beta access instead of showing broken setup language

## Admin Review

Admin route: `/admin/pricing`

Admin can:

- view feature flags
- view seeded pricing experiments
- update experiment status
- view beta demand by package
- review beta access requests
- mark requests reviewed, waitlisted, not fit, archived, or invited
- generate an invite code
- create audit log entries for status changes

## Copy Rules

Use:

- "Request beta access"
- "Tell us what you need monitored"
- "RepWatchr is collecting demand before launching paid packages."

Avoid:

- "Buy now"
- "Limited spots" unless a real limit is configured
- "Guaranteed results"
- "Win your election"
- "Expose officials"

## Launch Criteria Before Charging

- Payment processor is configured.
- Terms/privacy/payment refund language is reviewed.
- Package scopes are clear.
- Fulfillment owner is assigned.
- Admin queue is working.
- Beta demand shows enough signal to justify the package.
- `ENABLE_PAYMENTS=true` is deliberately set in production.
