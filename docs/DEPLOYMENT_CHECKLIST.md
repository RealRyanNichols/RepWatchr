# RepWatchr Deployment Checklist

Use this before pushing a preview or production deployment.

## Required Commands

```bash
npm run qa:static
npm run smoke:sources
npm run smoke:pricing
npm run smoke:seo
npm run smoke:og
npm run smoke:thumbnails
npm run smoke:mobile-pwa
npm run lint
npm run build
```

Run route smoke checks against a live server:

```bash
REPWATCHR_SMOKE_BASE_URL=https://www.repwatchr.com npm run qa:routes
```

Verify the Marion County race and both public portrait assets against the exact
preview or production host:

```bash
npm run verify:marion-deploy -- https://preview-or-production.example
```

If using the bundled Codex runtime locally, prepend its Node path before running direct binaries.

## Release State Vocabulary

These states are sequential. Report the highest state actually proven; never use
`live`, `published`, or `deployed to production` for an earlier state.

| State | Required proof | What may be reported |
| --- | --- | --- |
| **BUILT** | The production build passed for the current source tree. | “Built locally.” |
| **COMMITTED** | The exact source tree is recorded in a local commit SHA. | “Committed as `<sha>`.” |
| **PUSHED** | The exact commit SHA is reachable on the intended remote branch. | “Pushed to `<remote>/<branch>`.” |
| **PREVIEW VERIFIED** | A preview for that exact SHA exists and the relevant live-URL verifiers pass against its public URL. | “Preview verified at `<url>`.” |
| **PRODUCTION VERIFIED** | The exact SHA is serving on the canonical production host and the relevant live-URL verifiers pass against that host after deployment. | “Live in production and verified at `<url>`.” |

A successful build, commit, push, Vercel build record, or preview check is not
proof that production changed. Until **PRODUCTION VERIFIED**, report production
as unchanged, pending, or unverified.

For every preview or production verification, record:

- commit SHA
- public URL checked
- UTC verification time
- verifier command and pass/fail output

The Marion County source smoke runs in CI. Its post-deploy verifier is
intentionally not wired into source CI because it requires the public URL of the
specific deployment being verified.

## Editorial Visual Contract

- Every public page must declare a generated, page-specific Open Graph image.
- Every OG image route must use the shared renderer and pass a non-empty reader-facing headline and support line.
- Photo-based story and editorial preview media must use `EditorialThumbnail` with a required `message`.
- Graphic-only previews may use `RecordVisual`, which must keep its required visible `title`.
- Brand marks, micro-avatars, and detail-page portraits are not editorial thumbnails; explicit exemptions use `data-thumbnail-exempt="brand|micro-avatar|detail-portrait"`.

## Checks

| Item | Status | Notes |
| --- | --- | --- |
| Build passes | not verified | Run during deploy handoff. |
| TypeScript passes | not verified | Use `tsc --noEmit` if available. |
| Lint passes | not verified | Existing image warnings may remain unless separately fixed. |
| Static QA passes | not verified | `npm run qa:static`. |
| OG headlines pass | not verified | `npm run smoke:og`. |
| Editorial thumbnail headlines pass | not verified | `npm run smoke:thumbnails`. |
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
| Race polls disabled unless approved | pass by default | `NEXT_PUBLIC_ENABLE_RACE_POLLS_V1` remains false until a replacement migration and privacy tests pass. |
| Editorial publishing disabled unless approved | pass by default | `EDITORIAL_PIPELINE_ENABLED` remains false and no editorial cron is scheduled. |
| Social distribution disabled unless approved | pass by default | `SOCIAL_PIPELINE_V2_ENABLED`, `FACEBOOK_AUTOPOST_ENABLED`, and `X_AUTOPOST_ENABLED` remain false. |
| Marion County source release smoke passes | not verified | `npm run smoke:marion-release`; asserts both portrait files and rejects the legacy placeholder markup. |
| Marion County deployed page passes | not verified | Run `npm run verify:marion-deploy -- <public-url>` after each preview or production deployment. |

## Backend staging hold

Do not apply migration drafts from `agent/repwatchr-backend-staging-hold` to
production. Follow `docs/BACKEND_STAGING_HOLD.md` and replace those drafts with
additive, reversible migrations tested against a non-production snapshot.

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
8. Run feature-specific post-deploy verifiers against the same public URL.
9. Mark a release **PRODUCTION VERIFIED** only after the exact production commit and required verifiers are confirmed.
