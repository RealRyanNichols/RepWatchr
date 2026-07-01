# RepWatchr Product Audit

Generated: 2026-07-01

Scope: product, code, routes, data, SEO, analytics, design, revenue, and trust/safety. This is an audit only. It does not redesign the site, add payments, delete pages, or make unsupported public claims.

## Executive Finding

RepWatchr has grown from a searchable civic site into a broad civic intelligence prototype. The foundation is real: public routes exist, static official data exists, Supabase migrations exist, member/admin surfaces exist, telemetry components exist, and source-first language is present across the app.

The site is not launch-complete as a monetized data product yet. The biggest blockers are not one missing component. They are data quality, profile completeness, source review workflow, OG/social image uniqueness, private-route noindex coverage, conversion capture, and production verification of Supabase/Stripe/analytics flows.

## What Exists Now

- Next.js App Router project with public, auth, dashboard, admin, API, cron, sitemap, robots, and RSS routes.
- Static data loader in `src/lib/data.ts` reading JSON under `src/data`.
- Large static official corpus under `src/data/officials`.
- Static vote records under `src/data/vote-records`.
- Small static score, funding, and red-flag datasets.
- Texas race data in `src/data/texas-election-races.ts`.
- Service/package data in `src/data/repwatchr-services.ts`.
- School-board research layer in `src/lib/school-board-research.ts`.
- Visitor intelligence, page-view tracking, Vercel Analytics, interest graph, predictive search, watchlists, contributor profiles, profile timelines, future revenue scaffolding, and admin analytics routes.
- Supabase migration files for reports, member watchlists, profile claims, profile scorecards, behavioral analytics, visitor intelligence, future revenue, timelines, comments, contributors, school boards, and more.
- Sitemap and robots routes.
- Global Open Graph/Twitter metadata with static fallback images.
- Header/footer navigation covering the main public lanes.
- Public correction/report packet fallback if Supabase report tables are not available.
- Civic loop/next-action panels intended to avoid dead ends.

## Primary Product Blockers

1. **Profile completion is uneven.** The app has thousands of official profiles, but only a small subset has full score, funding, red-flag, and mapped vote data.
2. **The source submission queue is still partly packet/fallback driven.** `/submit-source` reuses the feedback page and ReportButton packet flow instead of a dedicated end-to-end review queue.
3. **Votes are not fully normalized into score methodology.** Vote-record JSON exists, but left/right charts and issue scorecards are only mapped for a small number of profiles.
4. **Funding is not broadly imported.** Funding files exist for only a few officials, so most profile/funding pages are incomplete or absent.
5. **OG/social image system is static.** There are only a few public images and no dynamic OG image routes found under `src/app`.
6. **SEO is present but not serious enough yet.** There is one sitemap route, not a sitemap index split by type. Some private routes rely on robots disallow instead of route-level noindex metadata.
7. **Analytics exists but is not complete attribution.** Page views and visitor intelligence exist, but every CTA, source click, package interest, watchlist action, profile open, and funnel step needs consistent event naming and admin reporting.
8. **Revenue rails exist but paid services are not production-proven.** Services and profile-claim Stripe code exist, but package checkout, fulfillment, subscriptions, refunds, and customer lifecycle are not launch-verified.
9. **Trust labels are not universal.** Source-backed/under-review/public-question labels exist in concept, but every red flag, score, vote, claim, article, and source card needs enforced labels and admin review states.
10. **Design quality is inconsistent.** Some screens are strong, but many cards, tables, dashboards, and empty states still read as flat panels rather than a premium civic intelligence system.

## Route Audit Summary

- Public pages: homepage, officials, profile pages, school boards, votes, funding, issues, scorecards, news/blog, media, attorneys, public safety, elections, services, data reports, contributors, growth, search, submit source, methodology, terms, privacy.
- Auth/member pages: login, signup, verify, dashboard, dashboard claims, dashboard profile editor, settings, watchlists.
- Admin pages: claims, content review, control center, superadmin, preview, behavioral analytics, future revenue, monetization readiness.
- API routes: analytics, visitor merge, auth/X OAuth, admin dashboards, daily cron, dashboard coverage, data-product interest, Faretta/Gideon, growth intake, health checks, member APIs, profile timelines, personalization, predictive search, profile overlays, predator watch report, Stripe checkout/webhook.
- SEO routes: `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/rss.xml/route.ts`.
- Missing OG routes: no `opengraph-image.tsx` or `twitter-image.tsx` route files were found.

Detailed route map is in `docs/REPWATCHR_BUILD_MAP.md`.

## Data Audit Summary

### Static Data

- `src/data/officials`: 8,830 JSON profiles found.
- `src/data/vote-records`: 680 vote-record JSON files found.
- `src/data/scores`: 6 scorecard JSON files found.
- `src/data/funding`: 6 funding JSON files found.
- `src/data/red-flags`: 12 red-flag JSON files found.
- `src/data/news`: 16 story JSON files found.
- `src/data/votes`: bill/vote JSON files exist for core examples.
- `src/data/issues/categories.json`: issue taxonomy exists.
- `src/data/official-ideology-master.json`: ideology master data exists.
- `src/data/congress-trading`: public disclosure tracker import exists.

### Supabase/Database Layer

Migration files exist for many systems, including:

- `supabase-schema.sql`
- `supabase-reports.sql`
- `supabase-profile-claims.sql`
- `supabase-profile-scorecards.sql`
- `supabase-member-watchlists.sql`
- `supabase-visitor-intelligence.sql`
- `supabase-behavioral-analytics.sql`
- `supabase-predictive-search.sql`
- `supabase-political-data-products.sql`
- `supabase-future-revenue.sql`
- `supabase-official-timelines.sql`
- `supabase-texas-election-contributions.sql`
- `supabase-contributor-profiles.sql`
- `supabase-daily-news-clips.sql`
- `supabase-social-autopost.sql`

### Data Problems

- Static files are the main product source of truth, but many are shells with incomplete verified record depth.
- Funding, scorecard, red-flag, and left/right chart data are concentrated in a small subset.
- Official photo coverage is better than score/funding coverage, but there is no audit-enforced image source/credit policy on every profile.
- Race pages have source links but not enough unique art/media and not enough candidate-specific record depth.
- School-board data exists but needs consistent member photos, source URL coverage, and correction paths.
- Vote records need source IDs, official vote URLs, category tags, score-impact rules, and confidence labels before charts should claim strong ideological conclusions.
- Source submissions need one normalized queue instead of multiple partially overlapping forms.

## SEO Audit Summary

### Working

- Global metadata exists in `src/app/layout.tsx`.
- `sitemap.ts` includes static routes, services, Texas races, officials, timelines, funding pages, votes, news, issues, scorecards, school-board districts, and school-board member pages.
- `robots.ts` disallows admin, auth, dashboard, login, buildout, and uap.
- RSS route exists.
- Several major pages have route metadata and canonical URLs.

### Missing/Incomplete

- No sitemap index.
- No separate sitemap files by content type.
- No image sitemap.
- No news sitemap.
- No dynamic OG image route system.
- Many pages use the same fallback image.
- Some public routes have metadata but no canonical.
- Some auth/dashboard/private routes do not have route-level noindex metadata even though robots disallows them.
- Query/filter URL indexing rules are not clearly enforced.
- JSON-LD coverage is incomplete.
- Internal linking blocks are inconsistent.
- Orphan-page report route/script is not present.

## Analytics Audit Summary

### Working

- Vercel Analytics is mounted.
- `PageViewTracker` sends `pages_per_session_progress` and posts to `/api/analytics/page-view`.
- `VisitorIntelligenceTracker` assigns anonymous visitor/session IDs, tracks page depth, scroll, clicks, shares, downloads, packet creation, source submission, watch record, and request-review signals.
- API routes exist for visitor tracking and visitor-user merge.
- Interest-profile route exists.
- Admin behavioral analytics route and page exist.

### Missing/Incomplete

- CTA event taxonomy is not enforced across every component.
- Profile open, official search, source click, source submission, correction submission, package interest, signup, watchlist, share, checkout, dashboard, and admin events need a normalized dictionary.
- UTM/referrer capture exists in pieces but is not enforced at every conversion point.
- Data-product and paid-service interest need shared attribution.
- Admin analytics needs production verification against real Supabase rows/views.
- Privacy policy should explicitly cover behavior analytics, aggregate political interest, and consent boundaries before selling data products.

## Design Audit Summary

### Working

- Brand is recognizable: navy, red, gold, source-first copy, Search. Grade. Source. Share.
- Header/footer cover main lanes.
- Homepage has active modules and next-action panels.
- Some profile and dashboard modules are richer than simple cards.

### Blockers

- Visual system is inconsistent across routes.
- Several pages still use flat white cards and dense text.
- Repeated static images make race/story previews feel duplicated.
- Some cards do not look clickable.
- Tables and fallback forms need stronger states.
- Mobile/desktop media aspect ratios need stricter constraints.
- Many pages need unique visuals: profile portraits, race thumbnails, school-board images, story covers, charts, maps, donor bars, score graphics, and share cards.
- Motion/interaction should be added later, after data and trust systems are stable.

## Revenue Audit Summary

### Existing Revenue Assets

- `/services` and `/services/[slug]` routes exist.
- Service definitions exist for Free Source Packet, Quick Record Check, Local Race Source Pack, Official Record Brief, and Election Watch Desk.
- `/data-reports` exists for aggregate political data products.
- `/api/data-product-interest` exists.
- Future revenue package registry exists in code and Supabase SQL, intentionally hidden.
- Profile claim checkout exists for a subscription-like Stripe flow.

### Revenue Blockers

- Paid service checkout is not fully wired to the service cards.
- Stripe checkout code appears focused on approved profile claims, not the current service packages.
- Webhook coverage handles checkout completed and subscription create/update/delete, but not every requested paid service event or refund/payment-failed lifecycle.
- No production-verified order, customer, fulfillment, service-request, refund, and support workflow.
- No clear customer segmentation across voters, contributors, campaigns, journalists, attorneys, local groups, researchers, and data buyers.
- No verified conversion funnel from visitor to source packet to account to paid review.
- No production proof that dashboards/admin queues can support real customers.

Detailed revenue blockers are in `docs/REPWATCHR_REVENUE_BLOCKERS.md`.

## Trust And Safety Audit

### Working

- Public-source-first language appears in footer, submit/source flows, election contribution page, profile concepts, and data monetization docs.
- Report/correction button exists.
- Report packet fallback avoids losing a source when database is unavailable.
- Several pages distinguish public records, questions, and review language.
- Future revenue docs explicitly prohibit selling private IDs, private addresses, minors' information, doxxing material, raw private evidence, and unsourced allegations.

### Blockers

- Source-backed labels are not enforced as a shared schema across all public record cards.
- Red flags need required source URL, date, jurisdiction, why-it-matters, status label, reviewer state, and audit history.
- Public story/article data needs a stronger source confidence model.
- Profiles need correction history and source trail consistently displayed.
- Admin review warnings for risky language are not universally enforced.
- No single policy layer blocks private addresses, minors, threats, doxxing, harassment instructions, unsourced criminal accusations, or claims beyond the source.
- Political sentiment/feedback must distinguish verified constituent, in-district, in-state, out-of-district, out-of-state, account-verified, and anonymous signals.

## Safe Fix Candidates Found

These are safe because they do not change routes, data shape, or product scope:

- Replace public "not configured/env vars/Supabase" language with user-facing "packet mode" or "temporarily unavailable" language.
- Avoid exposing setup details in auth callback errors.
- Keep detailed setup errors in admin/API surfaces only.

## What Should Not Be Done In This Audit Pass

- Do not claim profiles are 100% complete.
- Do not add or activate paid checkout.
- Do not generate public allegations or score claims without source-backed data.
- Do not turn on future revenue packages.
- Do not redesign the visual system before fixing data/source/SEO/analytics foundations.
- Do not remove routes or collapse existing feature work.

## Highest-Risk Areas Before Public Launch

1. Profile scores and charts that appear more certain than the underlying mapped vote data.
2. Red flags or controversies without enforced source labels.
3. Repeated/default OG imagery that makes pages look unfinished when shared.
4. Public forms that are not persisted or reviewable in production.
5. Private/admin/dashboard pages relying only on robots disallow.
6. Stripe/payment endpoints returning setup details to users.
7. Aggregate political data monetization without consent, privacy, retention, and export rules.
8. Source imports without import-run audit logs and broken-link monitoring.
