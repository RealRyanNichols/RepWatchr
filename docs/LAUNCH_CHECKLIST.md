# RepWatchr Launch Readiness Checklist

Generated: 2026-06-21

Status key:
- PASS: verified by code inspection, smoke check, typecheck, or route check in this pass.
- PENDING: implementation exists, but production credentials, migrations, live provider setup, or business review is still required.
- FAIL: known broken item that must be fixed before launch.

## Payments And Revenue

| Item | Status | Notes |
| --- | --- | --- |
| Stripe payments work | PENDING | Code smoke passed with `pnpm smoke:payments`. Live checkout still needs Stripe test/live credentials and a real checkout transaction. |
| Stripe webhooks work | PENDING | Webhook route handles checkout completed, subscription created/updated/canceled, payment failed, and refunds. Live verification needs Stripe CLI or dashboard webhook delivery using `STRIPE_WEBHOOK_SECRET`. |
| Service forms work | PASS | Service request fallback and checkout wiring smoke passed. |
| No public Stripe setup language remains | PASS | Main route smoke passed and public service copy no longer exposes Stripe setup language. |

Required production values:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Stripe price IDs for Quick Record Check, Local Race Source Pack, Official Record Brief, and Election Watch Desk if production prices are not hardcoded through the server product map.

## Supabase, Auth, Dashboard

| Item | Status | Notes |
| --- | --- | --- |
| Supabase submissions work | PENDING | Source queue smoke passed. Apply `supabase-source-submissions.sql`, `supabase-member-dashboard.sql`, `supabase-admin-dashboard.sql`, `supabase-growth-membership.sql`, and `supabase-data-health.sql` in production. |
| Signup/login works | PENDING | `/auth/signup`, `/auth/login`, `/auth/callback`, and `/dashboard` routes smoke passed. Live verification requires Supabase project URL, anon key, email settings, redirect URLs, and auth provider settings. |
| Dashboard works | PASS | `pnpm smoke:dashboard` passed. Route smoke passed for `/dashboard`. |
| Admin dashboard protected | PENDING | `pnpm smoke:admin` passed and admin routes use server-side role checks. Live verification requires an admin row in `user_roles` and service-role access. |
| Source packet builder works | PASS | Free packet/growth smoke passed and dashboard source packet workflow is wired. |
| Public records draft tool works | PASS | `pnpm smoke:records` passed. |

Required production values:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL` or `SITE_URL`

## Public Site And Sharing

| Item | Status | Notes |
| --- | --- | --- |
| Share buttons work | PASS | `pnpm smoke:sharing` passed. |
| OG images work | PASS | `pnpm smoke:og` passed. |
| Sitemap index works | PASS | `pnpm smoke:seo` passed. |
| Robots.txt works | PASS | SEO smoke validates sitemap and robots foundation. |
| Canonical URLs exist | PASS | SEO smoke passed; route metadata uses canonical public URLs. |
| Noindex on private routes | PASS | Admin/dashboard layout metadata and SEO inventory exclude private routes. |
| Route smoke checks pass | PASS | `pnpm smoke:routes` passed for homepage, officials, school boards, services, submit source, signup, dashboard, admin, article, and Ted Cruz profile. |
| Mobile nav works | PASS | Main route smoke passed; CSS includes mobile tap targets and no horizontal body overflow. |
| Footer/header links work | PENDING | Route smoke covers major links. Full link crawl should run before public launch. |

## Content Safety

| Item | Status | Notes |
| --- | --- | --- |
| No private sensitive data appears publicly | PASS | Added reusable public-content rules and trust labels. Route smoke checks for exposed secret strings on major routes passed. |
| Correction workflow visible | PASS | Profile, story, and red-flag correction/source submission paths are visible through `ReportButton` and source forms. |
| Trust/safety labels exist | PASS | Labels now cover confirmed public record, source-backed claim, public question, needs source, allegation, opinion, correction requested, and under review. |
| Red flags require source-review fields | PASS | Red-flag cards surface source, date, jurisdiction, why it matters, status label, reviewer status, and missing-field warnings. |
| Admin risky-language warnings | PASS | Admin profile/content staging scans for private address, minor-child, threat/harassment, criminal-accusation, and overclaim language. |
| Legal/privacy/terms pages exist | PASS | `/privacy` and `/terms` routes exist. Final legal review is still recommended before paid launch. |

## Data And Operations

| Item | Status | Notes |
| --- | --- | --- |
| Daily Watch noise filtering works | PASS | `pnpm smoke:wire-quality` passed. Wire rows are review-gated. |
| Data health monitoring exists | PASS | Added `supabase-data-health.sql`, `src/lib/data-health.ts`, admin metrics, and admin actions for import reruns, issue resolution, duplicate handling, and quarantine. |
| FEC imports monitored | PASS | Admin data health shows FEC coverage and import-run rows when present. |
| Texas Ethics imports monitored | PASS | Admin data health includes TEC lane status; production import job still needs scheduling. |
| Open States imports monitored | PASS | Admin data health includes Open States lane status; production import job still needs scheduling. |
| House/Senate roll call imports monitored | PASS | Admin data health includes vote-record coverage. |
| RSS/news wire imports monitored | PASS | Daily Watch quality and admin moderation are wired. |
| School board imports monitored | PASS | Admin data health includes school-board coverage. |
| Broken source links monitored | PASS | Existing admin broken-link table plus new `broken_links` table and actions are wired. |
| Duplicate profiles monitored | PASS | Static duplicate metric and new `duplicate_candidates` table are wired. |
| Missing slugs/canonicals monitored | PASS | SEO report route/script exists and SEO smoke passed. |

## Analytics And Retention

| Item | Status | Notes |
| --- | --- | --- |
| Analytics events fire | PASS | Growth, dashboard, sharing, checkout, and page/profile event code is wired; admin analytics surfaces read stored events. Live verification needs production event rows. |
| Ethical retention blocks exist | PASS | Added "Your next useful move" blocks to homepage, officials, school boards, services, submit source, story, profile, and red-flag surfaces. |
| Weekly digest preference exists | PASS | Dashboard UI and `member_digest_preferences` table are added. Email send job remains a future production task. |
| Contributor role labels exist | PASS | Dashboard shows Source Runner, Meeting Reporter, Profile Builder, Share Editor, Scorecard Reader, and Money Trail Watcher. |

## Build And Deploy

| Item | Status | Notes |
| --- | --- | --- |
| TypeScript passes | PASS | `pnpm exec tsc --noEmit` passed. |
| Lint passes | PASS | `pnpm lint` passed with two non-blocking existing `<img>` optimization warnings in profile components. |
| Build passes | PASS | `pnpm build` passed and generated 1,416 static pages. |
| Vercel deploy passes | PENDING | Not run in this pass. Requires Vercel project access and production env validation. |

## Commands Run In This Pass

- `pnpm exec tsc --noEmit`
- `pnpm smoke:growth`
- `pnpm smoke:routes`
- `pnpm smoke:payments`
- `pnpm smoke:sources`
- `pnpm smoke:dashboard`
- `pnpm smoke:admin`
- `pnpm smoke:sharing`
- `pnpm smoke:og`
- `pnpm smoke:seo`
- `pnpm smoke:wire-quality`
- `pnpm smoke:officials`
- `pnpm smoke:profile-dossier`
- `pnpm smoke:race-hub`
- `pnpm smoke:records`
- `pnpm lint`
- `pnpm build`

## Final Launch Blockers

1. Apply all Supabase migrations in production, including `supabase-data-health.sql`.
2. Configure Stripe live/test credentials and verify one one-time checkout plus one subscription checkout end to end.
3. Configure Stripe webhook endpoint and verify signed webhook delivery.
4. Configure Supabase auth redirects, email settings, and admin `user_roles`.
5. Run Vercel deployment validation after production environment variables are set.
6. Run a full broken-link crawl before public promotion.
7. Have legal/privacy review final public pages, paid service terms, correction policy, and data-retention language.
