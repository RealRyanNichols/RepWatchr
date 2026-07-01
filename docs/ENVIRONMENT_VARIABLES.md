# RepWatchr Environment Variables

Audit date: 2026-07-01

Never expose server-only keys in client components, logs, public pages, analytics metadata, or screenshots. The Supabase service role and Stripe secret/webhook keys are server-only.

## Core Public Site

| Variable | Required for launch | Public/client-safe | Purpose | Notes |
|---|---:|---:|---|---|
| `NEXT_PUBLIC_SITE_URL` | yes | yes | Canonical site URL and redirects. | Should be `https://www.repwatchr.com` in production. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | optional | yes | GA4 measurement ID. | Optional if Vercel Analytics/internal analytics are primary. |

## Supabase

| Variable | Required for launch | Public/client-safe | Purpose | Notes |
|---|---:|---:|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | yes | Supabase project URL for auth/client calls. | Required for signup/login and client/server Supabase clients. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | yes | Supabase anonymous key. | Must rely on RLS for access control. |
| `SUPABASE_SERVICE_ROLE_KEY` | yes for admin queues | no | Server-only admin client for intake, admin dashboards, analytics, package interest, corrections, source review. | Never expose client-side. Verify RLS and grants even with service role. |
| `NEXT_PUBLIC_ENABLE_SUPABASE_AUTH` | optional | yes | Public auth feature toggle. | Example file defaults true. |
| `NEXT_PUBLIC_ENABLE_SUPABASE_REPORTS` | optional | yes | Public reports toggle. | Confirm current usage before relying on it. |
| `NEXT_PUBLIC_TEXAS_ELECTION_DB_SUBMISSIONS` | optional | yes | Texas election submission toggle. | Confirm current usage before relying on it. |

## Admin And Security

| Variable | Required for launch | Public/client-safe | Purpose | Notes |
|---|---:|---:|---|---|
| `REPWATCHR_ADMIN_EMAILS` | yes | no | Admin email allowlist for server-side admin access. | Confirm admin layout/role helper uses this plus any role table. |
| `CRON_SECRET` | yes if cron routes enabled | no | Protects cron endpoints. | Use a long random value. |
| `REPORT_INTAKE_HASH_SECRET` | if report intake enabled | no | Hash/signing secret for report/intake flows. | Confirm current usage before enabling. |
| `MEMBER_SESSION_SECRET` | if custom sessions enabled | no | Member/session signing. | Confirm current usage before enabling. |

## Feature Flags

Feature flags default false unless enabled by env or database table.

| Variable | Required for launch | Public/client-safe | Purpose | Launch setting |
|---|---:|---:|---|---|
| `ENABLE_PAYMENTS` or `REPWATCHR_ENABLE_PAYMENTS` | no | no | Enables checkout/payment behavior. | Keep false until payment/webhook/legal readiness is verified. |
| `ENABLE_AI_SOURCE_REVIEW` or `REPWATCHR_ENABLE_AI_SOURCE_REVIEW` | no | no | Enables admin AI source review. | Keep false until provider/key/safety review. |
| `ENABLE_EMAIL_SENDING` or `REPWATCHR_ENABLE_EMAIL_SENDING` | no | no | Enables real email delivery. | Keep false until consent/unsubscribe/provider tests. |
| `ENABLE_PUBLIC_API` or `REPWATCHR_ENABLE_PUBLIC_API` | no | no | Future public API access. | Keep false. |
| `ENABLE_BETA_PACKAGES` or `REPWATCHR_ENABLE_BETA_PACKAGES` | optional | no | Enables beta package surfaces if used. | Business decision. |
| `ENABLE_ORGANIZATION_DASHBOARD` or `REPWATCHR_ENABLE_ORGANIZATION_DASHBOARD` | no | no | Future organization dashboard. | Keep false. |
| `ENABLE_ADVANCED_ANALYTICS` or `REPWATCHR_ENABLE_ADVANCED_ANALYTICS` | optional | no | Advanced analytics views. | Admin-only. |
| `ENABLE_EXPORTS` or `REPWATCHR_ENABLE_EXPORTS` | no | no | Future export features. | Keep false until privacy review. |
| `ENABLE_PWA_INSTALL_PROMPT` or `REPWATCHR_ENABLE_PWA_INSTALL_PROMPT` | optional | no | PWA install prompt. | Enable only after mobile QA. |
| `ENABLE_DATA_IMPORTS` or `REPWATCHR_ENABLE_DATA_IMPORTS` | no | no | Enables protected admin import execution. | Keep false until source-specific dry runs and review. |

## Stripe

Payments should remain disabled unless `ENABLE_PAYMENTS=true` and the payment system has been verified.

| Variable | Required for payment launch | Public/client-safe | Purpose | Notes |
|---|---:|---:|---|---|
| `STRIPE_SECRET_KEY` | yes | no | Server-side Stripe API calls. | Use test key in staging, live key only after launch approval. |
| `STRIPE_WEBHOOK_SECRET` | yes | no | Webhook signature verification. | Required before accepting real payments. |
| `STRIPE_PROFILE_PRICE_ID` | if profile membership checkout exists | no | Stripe price ID. | Server-side source of truth. |
| `NEXT_PUBLIC_STRIPE_PROFILE_PRICE_ID` | avoid unless necessary | yes | Public fallback display only. | Do not use as authority for price/payment. |

## Social Autoposting

Keep autopost disabled until source policy, editorial review, and duplicate protection are production-tested.

| Variable | Required | Public/client-safe | Purpose | Launch setting |
|---|---:|---:|---|---|
| `SOCIAL_AUTOPOST_ENABLED` | no | no | Enables social autoposting job. | false |
| `SOCIAL_AUTOPOST_EDITORIAL_APPROVED` | no | no | Editorial safety gate. | false |
| `SOCIAL_AUTOPOST_MAX_AGE_HOURS` | optional | no | Source age window. | 72 in example. |
| `SOCIAL_AUTOPOST_SOURCE_LIMIT` | optional | no | Batch limit. | 24 in example. |
| `FACEBOOK_PAGE_ID` | if Facebook posting enabled | no | Facebook page target. | Do not enable without review. |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | if Facebook posting enabled | no | Facebook API token. | Secret. |
| `FACEBOOK_GRAPH_VERSION` | optional | no | Facebook API version. | Example `v24.0`. |
| `X_CLIENT_ID` | if X posting enabled | no | X OAuth client ID. | Secret enough to keep server-only. |
| `X_CLIENT_SECRET` | if X posting enabled | no | X OAuth client secret. | Secret. |
| `X_REFRESH_TOKEN` | if X posting enabled | no | X refresh token. | Secret. |
| `X_USER_ACCESS_TOKEN` | if X posting enabled | no | X user access token. | Secret. |

## GideonAI / AI

| Variable | Required | Public/client-safe | Purpose | Notes |
|---|---:|---:|---|---|
| `GIDEON_CHAT_URL` | optional | no | Server-side Gideon chat bridge target. | Use only for safe source-gap/next-record helper behavior. |
| `GIDEON_CHAT_BEARER` | optional | no | Bearer token for Gideon edge function. | Secret. |
| `NEXT_PUBLIC_GIDEON_CHAT_URL` | avoid unless intentional | yes | Browser-side Gideon chat URL. | Only expose if intentionally safe. |
| `OPENAI_API_KEY` | optional | no | Admin AI source review if `ENABLE_AI_SOURCE_REVIEW=true` and `AI_PROVIDER=openai`. | Never expose client-side. Never create `NEXT_PUBLIC_OPENAI_API_KEY`. |
| `AI_PROVIDER` | optional | no | AI provider selection for admin source review. | Current implementation supports `openai`; keep disabled unless reviewed. |
| `AI_SOURCE_REVIEW_MODEL` | optional | no | Model used by the admin AI source review assistant. | Defaults to `gpt-5.5` unless overridden. |

## Public Data Import Providers

Imports are admin-only and disabled by default. Provider keys must stay server-side and should only be configured after adapter mapping, source URL handling, and review status rules are verified.

| Variable | Required | Public/client-safe | Purpose | Notes |
|---|---:|---:|---|---|
| `FEC_API_KEY` | if FEC imports enabled | no | Federal Election Commission API access. | Missing key shows as adapter health warning. |
| `CONGRESS_API_KEY` | if Congress.gov imports enabled | no | Congress.gov API access. | Missing key does not break admin pages. |
| `OPENSTATES_API_KEY` | if Open States imports enabled | no | Open States API access. | Use only after state import scope is approved. |
| `TEC_IMPORT_MODE` | optional | no | Texas Ethics Commission import mode. | Default `manual`; use `disabled` to hide manual import readiness. |

## Launch Environment Rules

- Production package pages may collect demand while payments are disabled.
- Do not show live checkout unless `ENABLE_PAYMENTS=true` and Stripe webhooks are verified.
- Supabase anon key is public, but all sensitive data must be protected by RLS and server-only admin routes.
- Public submissions must never be auto-published as verified.
- Admin dashboards require server-side role checks, not client-only checks.
- Private routes must stay out of sitemap and must be noindex.
