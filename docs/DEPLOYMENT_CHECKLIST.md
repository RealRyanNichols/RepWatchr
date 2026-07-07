# RepWatchr Deployment Checklist

Use this before pushing a preview or production deployment.

## Required Commands

```bash
npm run qa:static
npm run smoke:sources
npm run smoke:pricing
npm run smoke:seo
npm run smoke:og
npm run smoke:mobile-pwa
npm run lint
npm run build
```

Run route smoke checks against a live server:

```bash
REPWATCHR_SMOKE_BASE_URL=https://www.repwatchr.com npm run qa:routes
```

If using the bundled Codex runtime locally, prepend its Node path before running direct binaries.

## Checks

| Item | Status | Notes |
| --- | --- | --- |
| Build passes | not verified | Run during deploy handoff. |
| TypeScript passes | not verified | Use `tsc --noEmit` if available. |
| Lint passes | not verified | Existing image warnings may remain unless separately fixed. |
| Static QA passes | not verified | `npm run qa:static`. |
| Route smoke passes | not verified | Requires running server or deployed URL. |
| Admin quality dashboard opens | not verified | Requires admin auth. |
| Supabase error table applied | not verified | Apply `supabase-qa-monitoring.sql`. |
| Private routes noindex/redirect | partial | Route smoke allows redirects; verify metadata in private pages. |
| Sitemap works | not verified | Smoke checks `/sitemap.xml`. |
| Robots works | not verified | Smoke checks `/robots.txt`. |
| Public setup-language hidden | partial | Static and route smoke checks catch obvious strings. |
| Payments disabled unless approved | pass by default | `ENABLE_PAYMENTS` should remain false until launch. |
| Email disabled unless approved | pass by default | `ENABLE_EMAIL_SENDING` should remain false until consent/provider setup. |
| AI disabled unless approved | pass by default | AI features default off. |
| Public API disabled unless approved | pass by default | `ENABLE_PUBLIC_API` should remain false until launch. |

## Credential Blockers

These require production credentials or account access:

- Supabase project URL and anon key
- Supabase service role key
- Stripe keys and webhook secret if payments are enabled
- email provider key if email sending is enabled
- AI provider key if AI tools are enabled
- Vercel project access for deploy/log checks

## Business Decision Blockers

- Whether `/packages/[slug]` should redirect to `/services/[slug]`
- Whether `/tools/source-packet-builder` should be a standalone page or redirect to `/free-packet`
- Whether `/tools/public-records-request` should be launched before public records response intake
- Whether dedicated `/admin/analytics`, `/admin/sources`, `/admin/monetization`, and `/admin/seo` routes are needed or if the unified admin dashboard is sufficient

## Post-Deploy

1. Open production homepage.
2. Open `/search`.
3. Open a profile.
4. Submit a test source only in a safe staging/prod test flow.
5. Open `/admin/quality`.
6. Confirm no fresh critical errors.
7. Run route smoke against the deployed URL.
