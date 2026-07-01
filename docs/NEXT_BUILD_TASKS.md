# RepWatchr Next Build Tasks

Audit date: 2026-07-01

Priority is based on launch risk, monetization readiness, source safety, and user trust.

## Top 25 Next Prompts

1. Run clean-clone CI verification: build, typecheck, lint, route smoke, and `git diff --check`.
2. Production-test Supabase migrations, RLS, admin roles, and service-role-only server routes.
3. Run browser smoke checks on every route in `docs/MANUAL_TEST_PLAN.md`.
4. Verify source submission end to end: public form, thank-you page, admin queue, status changes, audit events.
5. Verify correction request workflow end to end on profile, story, red flag, and package pages.
6. Verify free packet funnel end to end: email capture, packet generation, Supabase save, copy/download, account prompt, upsell.
7. Verify package interest forms for all four packages and show results in `/admin/monetization`.
8. Verify signup, login, dashboard redirect, dashboard data modules, and privacy controls with real Supabase users.
9. Verify admin access with admin, non-admin, anonymous, and expired-session states.
10. Fetch and validate `/sitemap.xml`, all child sitemaps, and `/robots.txt` in production.
11. Fetch and validate OG images for homepage, profile, package, story, race, school board, source packet, and methodology.
12. Build a real SEO audit scanner for metadata, canonical, OG image, duplicate slugs, orphan pages, and sparse/noindex rules.
13. Run a public sensitive-data crawl for private addresses, minors, private contact info, threats, and unsupported accusations.
14. Run mobile visual QA at 390, 768, 1440, and 1920 widths; fix horizontal scroll and image distortion.
15. Enforce standard image aspect-ratio/object-fit wrappers for official portraits, race cards, school boards, stories, and OG thumbnails.
16. Complete profile data quality audit for Texas officials: photos, official URLs, vote source counts, funding source counts, and score confidence.
17. Verify Ted Cruz and other high-profile dossier pages against source-backed score/funding/vote methodology.
18. Build a score methodology/data coverage dashboard so incomplete profiles cannot show overconfident scores.
19. Add durable rate limiting for public forms beyond honeypots and in-memory counters.
20. Verify analytics events in Supabase/admin: page view, visitor profile, search, profile open, source click, source submit, correction, packet, watch, feedback, package interest.
21. Verify anonymous visitor-to-user merge after signup and watchlist conversion.
22. Build production data-health dashboard for imports, broken source links, duplicate profiles, missing slugs, missing canonicals, and sparse profiles.
23. Build a clean QA seed dataset for one official, one school board, one race, one package interest, one correction, one source submission, and one dashboard user.
24. Keep `ENABLE_PAYMENTS=false`; only enable Stripe after checkout, webhook, refund, subscription, and service request fulfillment tests pass.
25. Add CI checks that fail on public setup language: `not configured`, `service-role`, `Stripe link not configured`, and private credentials in public copy.

## Near-Term Product Quality Tasks

26. Turn dense vote/funding/admin tables into mobile card views.
27. Add route-level skeleton/loading states for profile, search, dashboard, and admin.
28. Add real command-palette recent/trending searches once analytics data is live.
29. Add visual status tags to every public claim: confirmed public record, source-backed claim, public question, needs source, under review.
30. Add share drawer to every profile, story, race, funding, source packet, and package page.
31. Add “next useful move” blocks where route-specific actions are better than the generic rail.
32. Add noindex rules for sparse, low-source, under-review public pages until useful.
33. Add production error monitoring and a private admin error feed.
34. Add admin source/correction package queues to a single intake overview.
35. Add exportable launch QA report generated from route smoke checks.

## Data And Monetization Tasks

36. Define the minimum data package RepWatchr can ethically sell: aggregate, non-sensitive, public-record-derived, source-backed.
37. Add customer segmentation fields to package interest and partner interest flows.
38. Build a “demand signal” dashboard: package, route, source, jurisdiction, search, watchlist, and conversion interest.
39. Add service fulfillment statuses: requested, scoped, accepted, in progress, delivered, declined, archived.
40. Build a paid-package readiness rubric before enabling checkout.
41. Add privacy review for every future export/API/data product.
42. Add internal-only data license boundaries before selling exports or API access.
43. Add public copy explaining aggregate intelligence without selling private identity data.

## Verification Commands To Run In Clean Clone/CI

```bash
pnpm install --frozen-lockfile
pnpm run lint
pnpm exec tsc --noEmit --pretty false
pnpm run build
git diff --check
```

If npm is chosen instead of pnpm, remove the extra lockfile and standardize scripts before launch.
