# RepWatchr Feature Flags

RepWatchr feature flags keep future monetization and advanced tooling hidden until the product, legal, privacy, payment, and data-quality pieces are ready.

## Core Rule

Default is off.

No public checkout, API access, AI review, organization dashboard, export, or email sending should appear just because code exists. Public behavior must be gated by a server-side feature flag and the required provider configuration.

## Core Flags

- `ENABLE_PAYMENTS`
- `ENABLE_AI_SOURCE_REVIEW`
- `ENABLE_EMAIL_SENDING`
- `ENABLE_PUBLIC_API`
- `ENABLE_BETA_PACKAGES`
- `ENABLE_ORGANIZATION_DASHBOARD`
- `ENABLE_ADVANCED_ANALYTICS`
- `ENABLE_EXPORTS`
- `ENABLE_PWA_INSTALL_PROMPT`

## Database Table

SQL file:

- `supabase-pricing-beta-access.sql`

Table:

- `feature_flags`

Fields:

- `id`
- `key`
- `description`
- `enabled`
- `rollout_percentage`
- `metadata`
- `created_at`
- `updated_at`

## Utility

File:

- `src/lib/feature-flags.ts`

Primary helper:

- `isFeatureEnabled(key, context)`

Behavior:

1. Normalize the key.
2. Check server environment first.
3. If the env var is explicitly true or false, use it.
4. If env var is absent, read the database flag with the server-side Supabase admin client.
5. Apply rollout percentage only when an anonymous ID or user ID exists.
6. Default to false.

Server-only secrets are never exposed to the browser.

## Payment Boundary

Public checkout requires:

1. `ENABLE_PAYMENTS=true`
2. Stripe server configuration
3. service checkout product exists
4. webhook and fulfillment path are ready

If `ENABLE_PAYMENTS` is missing or false, paid service CTAs must route to beta access or request forms.

## Public Disabled-State Behavior

Disabled features should not show broken buttons.

Use:

- `Request beta access`
- `Tell us what you need monitored`
- `RepWatchr is collecting demand before launching paid packages.`

Avoid:

- `Buy now`
- `Stripe not configured`
- `Payment disabled`
- `Limited spots`
- `Guaranteed results`
- `Win your election`
- `Expose officials`

## Admin Route

- `/admin/pricing`

Admins can:

- view flags
- enable or disable flags
- change rollout percentage
- audit changes
- review beta demand
- create pricing experiments

## RLS

Feature flags are admin-managed. Public users do not read the `feature_flags` table directly. Public behavior is mediated through server-side route logic and components.
