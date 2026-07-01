# RepWatchr Feature Flags

RepWatchr defaults risky or revenue-related features to off. A feature is public only when the server environment or the database flag explicitly enables it.

## Core Flags

| Flag | Default | Purpose |
| --- | ---: | --- |
| `ENABLE_PAYMENTS` | off | Allows public payment/checkout CTAs to use live payment links. |
| `ENABLE_AI_SOURCE_REVIEW` | off | Allows the admin AI source-review assistant when a provider key is configured. |
| `ENABLE_EMAIL_SENDING` | off | Allows outbound email through a configured provider. |
| `ENABLE_PUBLIC_API` | off | Allows public/API data-product surfaces. |
| `ENABLE_BETA_PACKAGES` | off | Allows beta package messaging and optional expected-range display. |
| `ENABLE_ORGANIZATION_DASHBOARD` | off | Allows organization/team dashboard surfaces. |
| `ENABLE_ADVANCED_ANALYTICS` | off | Allows advanced analytics/reporting surfaces. |
| `ENABLE_EXPORTS` | off | Allows CSV/PDF/export tools. |
| `ENABLE_PWA_INSTALL_PROMPT` | off | Allows install-prompt UI after engagement thresholds. |
| `ENABLE_DATA_IMPORTS` | off | Allows protected admin import execution. Missing provider keys still block provider-specific imports. |

## Resolution Order

1. Server environment wins.
2. If no environment value exists, RepWatchr checks the `feature_flags` table.
3. If neither exists or the table is missing, the flag is false.

Accepted truthy environment values: `1`, `true`, `yes`, `on`, `enabled`.

## Admin Route

`/admin/pricing` shows:

- environment flag snapshot
- database feature flags
- rollout percentages
- pricing experiments
- beta access requests

Only admins can update database flags. Environment flags still win over database flags because production launch switches must be deliberate.

## Payment Rule

Public checkout is disabled unless:

1. `ENABLE_PAYMENTS=true`
2. the payment link for the package is configured
3. the public page deliberately renders the payment CTA

If payments are off, paid package CTAs route to `/beta-access`.

## Supabase Notes

Run `supabase-pricing-experiments.sql` before relying on DB-backed flags. Supabase changed default API exposure behavior for new tables in 2026; confirm these tables are exposed only where intended.

Run `supabase-data-import-adapters.sql` before using the import registry. Keep `ENABLE_DATA_IMPORTS=false` until dry runs, source URL mapping, and admin review statuses are verified.

## Guardrails

- Do not expose server secrets to client components.
- Do not use client-side flags for security decisions.
- Do not enable payment, API, exports, or email sending from UI copy alone.
- Do not enable data imports until provider keys, source-specific mappings, and import review workflows are tested.
- Keep beta and demand capture separate from actual checkout.
