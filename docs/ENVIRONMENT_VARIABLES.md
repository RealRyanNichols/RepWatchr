# RepWatchr Environment Variables

This file documents the variables checked by the quality system. Do not put secret values in this document.

## Public Variables

These may be visible to the browser:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` if Google Analytics is used

Never prefix a server secret with `NEXT_PUBLIC_`.

## Server-Only Variables

These must stay server-side:

- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `OPENAI_API_KEY`
- `RESEND_API_KEY`
- `SENDGRID_API_KEY`
- `POSTMARK_API_KEY`
- cron or admin secret values if later added

## Feature Flags

Default false unless intentionally enabled:

- `ENABLE_PAYMENTS`
- `ENABLE_AI_SOURCE_REVIEW`
- `ENABLE_AI_WRITING_ASSISTANT`
- `ENABLE_EMAIL_SENDING`
- `ENABLE_PUBLIC_API`
- `ENABLE_BETA_PACKAGES`
- `ENABLE_ORGANIZATION_DASHBOARD`
- `ENABLE_ADVANCED_ANALYTICS`
- `ENABLE_EXPORTS`
- `ENABLE_PWA_INSTALL_PROMPT`

Disabled features should show clean interest-capture or disabled states, not broken provider errors.

## Route Smoke

- `REPWATCHR_SMOKE_BASE_URL`

Use this to point route smoke checks at local, preview, or production deployments.

## Required For Base App

- Supabase public URL
- Supabase anon key
- canonical public site URL

## Required For Admin QA Storage

- Supabase service role key

The service role is needed only server-side for admin-quality data and error logging. Missing service-role access should not break public browsing, but it will prevent `/admin/quality` from loading stored error rows.

## Conditional Requirements

Payments:

- `ENABLE_PAYMENTS` true
- Stripe secret key
- Stripe webhook secret

Email sending:

- `ENABLE_EMAIL_SENDING` true
- one supported provider key
- `FROM_EMAIL`

AI tools:

- AI feature flag true
- `AI_PROVIDER`
- OpenAI key or other provider key

Public API:

- `ENABLE_PUBLIC_API` true
- approved API key tables and admin controls

## Secret Exposure Checks

The quality system fails if these public-secret names are present:

- `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_OPENAI_API_KEY`
- `NEXT_PUBLIC_RESEND_API_KEY`
- `NEXT_PUBLIC_SENDGRID_API_KEY`
- `NEXT_PUBLIC_POSTMARK_API_KEY`
