# RepWatchr QA Monitoring System

RepWatchr now has a first-pass automated quality foundation for launch and post-deploy checks.

## What Exists

- Admin-only quality dashboard: `/admin/quality`
- Admin data endpoint: `/api/admin/quality`
- Sanitized app-error intake endpoint: `/api/quality/error`
- Shared monitoring utility: `src/lib/qa-monitoring.ts`
- Static QA smoke script: `npm run qa:static`
- Route smoke script: `npm run qa:routes`
- Supabase error-log schema: `supabase-qa-monitoring.sql`
- Branded app error boundary: `src/app/error.tsx`
- Branded 404 page: `src/app/not-found.tsx`

## What The System Checks

- Required and optional environment variables are present.
- Secret keys are not exposed as `NEXT_PUBLIC_` variables.
- Feature-flagged systems stay off until intentionally enabled.
- Public and private route smoke targets are listed.
- Known route gaps are visible instead of hidden.
- Existing source-submission, package-interest, SEO, OG, mobile PWA, admin, dashboard, profile, race, and sharing smoke scripts remain available.
- Recent sanitized app errors are shown to admins.
- Build, lint, typecheck, static smoke, and route smoke commands are documented.

## Existing Smoke Coverage Reused

The repo already has useful domain smoke scripts. This QA layer does not replace them.

- Source submissions and correction paths: `npm run smoke:sources`
- Package interest and beta pricing: `npm run smoke:pricing`
- SEO and sitemap foundation: `npm run smoke:seo`
- OG/social previews: `npm run smoke:og`
- Public officials search: `npm run smoke:officials`
- Profile dossier pages: `npm run smoke:profile-dossier`
- Race hubs: `npm run smoke:race-hub`
- Admin dashboard: `npm run smoke:admin`
- Member dashboard: `npm run smoke:dashboard`
- Mobile PWA shell: `npm run smoke:mobile-pwa`

## Manual Accessibility Baseline

Before a production push, manually check:

- keyboard focus reaches every major action
- icon buttons have accessible labels
- form fields have visible labels and errors
- meaningful images have alt text
- text contrast is readable
- reduced-motion preference is respected for heavy effects
- tables are usable on mobile
- there is no horizontal scroll on common mobile widths

## Error Logging Rules

The app-error endpoint stores only sanitized diagnostic data:

- error type
- sanitized message
- sanitized stack
- route
- anonymous visitor ID where supplied
- user ID only if supplied server-side
- severity
- small safe metadata

Do not store form payloads, source submissions, private documents, private addresses, minors, raw evidence, secrets, tokens, payment data, or admin notes in the error log.

## Admin Dashboard

The quality dashboard shows:

- environment checks
- feature flag state
- route smoke inventory
- known route gaps
- recent sanitized errors
- preflight command stack

Access is protected server-side with `requireAdminPageAccess()`. Client-side UI does not decide admin access.

## Current Known Product Gaps

The route inventory intentionally marks these as gaps:

- `/tools/source-packet-builder`
- `/tools/public-records-request`
- `/search` currently redirects to `/faretta-ai` and is noindex
- `/packages/quick-record-check`
- `/packages/official-record-brief`
- `/packages/local-race-source-pack`
- `/packages/election-watch-desk`
- `/jurisdictions/texas`
- `/dashboard/privacy`
- `/admin/analytics`
- `/admin/sources`
- `/admin/monetization`
- `/admin/seo`

Some of these have equivalent functionality elsewhere, but the prompted routes do not currently exist as dedicated pages.

## Quality Workflow

Before deploy:

1. Apply reviewed SQL if error logging is needed.
2. Run `npm run qa:static`.
3. Start the app or point at production.
4. Run `REPWATCHR_SMOKE_BASE_URL=https://your-domain npm run qa:routes`.
5. Run lint/typecheck/build.
6. Open `/admin/quality`.
7. Fix failures or document credential/business blockers.

## Analytics Events

The system registers:

- `quality_dashboard_open`
- `smoke_tests_run`
- `smoke_test_failed`
- `app_error_logged`
- `env_validation_failed`
- `deploy_checklist_open`

These are product-quality events, not private-user behavior records.
