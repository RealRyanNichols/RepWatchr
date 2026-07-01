# RepWatchr Launch Readiness Checklist

Audit date: 2026-07-01

Scope: launch-readiness, mobile, performance, accessibility, SEO, analytics, safety, and monetization-readiness pass for the current RepWatchr Next.js app.

Important verification note: the repo is currently in a Google Drive-backed clone. Broad `rg`, `git diff --check`, `eslint`, `tsc`, and `next build` commands either hung silently or required interruption in this workspace. Treat code-inspection pass/fail results separately from production verification.

## Route Readiness

| Status | Route/file affected | What failed or passed | Fix recommendation | Credentials needed | Business decision needed | Recommended next prompt |
|---|---|---|---|---|---|---|
| partial | `/` | Homepage exists with metadata, tracking, command palette, footer/header, and next-action rail. Browser console, mobile screenshots, and production analytics were not verified. | Run Playwright/Lighthouse against local and Vercel production. | no | no | Run browser-based homepage launch verification. |
| partial | `/search` | Search route and command-palette infrastructure exist. Search index persistence and saved searches depend on Supabase tables/RLS being applied. | Verify search endpoint with seeded data and Supabase migrations. | yes | no | Verify search, saved searches, and command palette in production. |
| partial | `/officials` | Officials route exists. Profile completeness/data freshness remains a data-quality blocker. | Run officials data health report and image/source coverage pass. | maybe | yes | Audit official profile completeness and public-source coverage. |
| partial | `/officials/[id]` | Profile route exists and has dossier components, source/correction/share/watch flows. Current score/vote/funding accuracy was not independently verified. | Lock score methodology and run source-backed profile audit on representative sample. | maybe | yes | Verify profile methodology and score data for Texas officials. |
| partial | `/submit-source` | Source submission route exists. Persistence requires Supabase admin credentials and migrations. | Submit a real test source in staging/prod and verify admin queue item. | yes | no | Production-test source submission and admin review queue. |
| partial | `/sources/submit` | Source submission alias exists. Same persistence dependency as `/submit-source`. | Confirm canonical path and redirect/canonical behavior. | yes | yes | Decide canonical source submission route and verify aliases. |
| partial | `/free-packet` | Free packet builder exists and uses source-safe copy. Persistence/thank-you behavior needs production test. | Submit free packet in production and verify stored record, thank-you page, analytics. | yes | no | Production-test free packet funnel end to end. |
| partial | `/tools/source-packet-builder` | Tool route exists. Save/export behavior needs browser verification. | Test mobile/desktop form, copy/export, and source safety validation. | maybe | no | Verify source packet builder UX and storage. |
| partial | `/tools/public-records-request` | Public-records request tool route exists. Storage and dashboard status visibility need production test. | Test draft, save, status, and dashboard visibility. | yes | no | Verify public records request generator workflow. |
| partial | `/packages/quick-record-check` | Dynamic package route exists through `/packages/[packageSlug]`. It is demand-capture only unless payments flag is enabled. | Confirm package slug renders, interest form stores, no checkout visible while payments disabled. | yes | yes | Production-test package interest capture for Quick Record Check. |
| partial | `/packages/official-record-brief` | Same package system. | Same as above. | yes | yes | Production-test Official Record Brief package page. |
| partial | `/packages/local-race-source-pack` | Same package system. | Same as above. | yes | yes | Production-test Local Race Source Pack package page. |
| partial | `/packages/election-watch-desk` | Same package system. | Same as above. | yes | yes | Production-test Election Watch Desk package page. |
| pass | `/privacy` | Privacy route exists and has metadata. | Verify footer/nav link and privacy request form behavior. | maybe | no | Browser-test privacy and privacy controls routes. |
| pass | `/methodology` | Methodology route exists and should be public/indexable. | Verify metadata and internal links. | no | no | SEO-check methodology route. |
| partial | `/sitemap.xml` | Sitemap index route exists. Static/profile/etc. sitemap routes exist by code inspection. Full URL counts not verified because broad scans/build hung. | Fetch every sitemap route in local/prod and compare expected counts. | no | no | Run sitemap endpoint smoke test and URL count report. |
| pass | `/robots.txt` | Robots route exists and disallows admin/auth/dashboard/API-style private areas. | Fetch in production and confirm sitemap references. | no | no | Verify robots.txt and sitemap references in production. |
| partial | `/dashboard` | Dashboard route exists and member dashboard API requires login. Frontend guard and data load need browser/auth test. | Log in with a real user and verify dashboard modules, saved data, and empty states. | yes | no | Production-test signup/login/dashboard. |
| pass | `/dashboard/privacy` | Dashboard privacy route exists and is private/noindex by route category. | Verify login required and controls save. | yes | no | Verify dashboard privacy controls. |
| pass | `/admin` | Admin layout performs server-side access checks and redirects non-admins. | Test with admin and non-admin production users. | yes | no | Production-test admin role enforcement. |
| partial | `/admin/analytics` | Admin analytics route exists. Data depends on analytics tables and events being written. | Verify event tables and dashboard totals. | yes | no | Production-test admin analytics dashboard. |
| partial | `/admin/sources` | Source review admin route exists. Queue depends on Supabase submissions. | Submit a test source and review it as admin. | yes | no | Production-test source queue review. |
| partial | `/admin/monetization` | Monetization route exists. Demand/revenue data depends on tables and package events. | Verify package interest rows and feature flag status. | yes | yes | Verify monetization readiness dashboard. |
| partial | `/admin/seo` | SEO audit route exists. Current SEO report has placeholders for missing metadata/duplicate scans. | Implement real scanner or run a build-time report script. | no | no | Build real SEO audit scanner. |

## Foundation Checklist

| Status | Route/file affected | What failed or passed | Fix recommendation | Credentials needed | Business decision needed | Recommended next prompt |
|---|---|---|---|---|---|---|
| not verified | `npm run build` / `pnpm run build` | `npm` was unavailable on PATH. With bundled Node + pnpm, `next build` started and then hung silently for 60 seconds in this Drive-backed clone. | Run build in Vercel CI or a clean non-synced clone. | no | no | Run clean-clone build/type/lint verification. |
| not verified | `tsc --noEmit` | Local bin wrapper failed without Node on PATH; with bundled Node it started and hung silently for 60 seconds. | Run typecheck in clean clone/CI; add explicit `typecheck` script. | no | no | Add typecheck script and verify TypeScript in CI. |
| not verified | `eslint` | Local bin wrapper failed without Node on PATH; with bundled Node it started and hung silently for 60 seconds. | Run lint in clean clone/CI; investigate Drive file traversal slowness. | no | no | Run lint in clean clone and fix any findings. |
| pass | `/docs/ENVIRONMENT_VARIABLES.md` | Environment variables are now documented in this audit. | Keep updated when new services are added. | no | no | Keep env docs in release checklist. |
| partial | Public API fallbacks | Fixed explicit public service-role/not-configured wording found during audit. Some queue-unavailable copy remains intentionally generic. | Run full text scan in clean clone for `not configured`, `service-role`, `Stripe link`. | no | no | Run clean public-copy setup-language scan. |
| not verified | Header/footer nav | Header/footer exist. Link crawl was not completed because broad route scans hung. | Use Playwright link crawler on key pages. | no | no | Run no-broken-nav/footer smoke check. |
| pass | `src/app/not-found.tsx` | Root 404 page added. | Browser-test from a fake route. | no | no | Verify 404 UX on mobile and desktop. |
| pass | `src/app/error.tsx` | Root error boundary added. | Trigger controlled error in staging to verify reset path. | no | no | Verify root error boundary behavior. |
| partial | Buttons/actions | Most core CTAs have destinations or disabled state by inspection. Full click path audit not verified. | Run route-level button/link smoke test. | no | no | Run clickable CTA audit across core routes. |
| not verified | Browser console | No browser session was run in this pass. | Use Playwright or manual browser to check console errors. | no | no | Browser-smoke core routes and capture console errors. |

## Analytics Checklist

| Status | Route/file affected | What failed or passed | Fix recommendation | Credentials needed | Business decision needed | Recommended next prompt |
|---|---|---|---|---|---|---|
| partial | `src/components/shared/PageViewTracker.tsx` | Page-view tracker exists and excludes private routes. Production event write not verified. | Confirm `page_view` rows in Supabase/Vercel Analytics. | yes | no | Verify analytics event ingestion in production. |
| partial | `src/components/shared/VisitorIntelligenceTracker.tsx` | Anonymous visitor/session/scroll/click tracking exists by code inspection. | Verify visitor rows, session merge behavior, and privacy exclusions. | yes | no | Production-test visitor intelligence events. |
| partial | UTM/referrer capture | Attribution is passed through package, correction, source, and analytics code by inspection. | Verify stored UTM/referrer on real submissions. | yes | no | Submit UTM-tagged test flows and inspect database rows. |
| partial | Search events | Search event taxonomy/components exist. Event write not verified. | Search in browser and inspect analytics table. | yes | no | Verify search analytics and interest scoring. |
| partial | Profile/source/watch/feedback/package events | Event names exist in code paths. Actual firing not verified. | Click each CTA in staging/prod and inspect events. | yes | no | Verify key conversion events across the app. |
| partial | Admin actions | Admin routes and audit/admin event patterns exist. Complete audit log behavior not verified. | Change a non-public status in staging and inspect audit/event tables. | yes | no | Verify admin action audit logging. |

## Data Intake Checklist

| Status | Route/file affected | What failed or passed | Fix recommendation | Credentials needed | Business decision needed | Recommended next prompt |
|---|---|---|---|---|---|---|
| partial | Source submission | Form/API exists with validation, safety, analytics, and fallback summary. DB storage needs Supabase admin credentials/tables. | Run real test submission and verify admin queue. | yes | no | Production-test source submission queue. |
| partial | Correction request | Correction API has honeypot, rate limit, safety validation, and analytics. DB storage needs Supabase admin/tables. | Run correction request and inspect queue. | yes | no | Production-test correction workflow. |
| partial | Free packet builder | Route/tool exists. Storage and thank-you behavior need test. | Submit packet, verify ID, summary, next action, and dashboard visibility. | yes | no | Production-test free packet funnel. |
| partial | Package interest | Package interest modal/API exists with honeypot, safety checks, analytics, and Supabase insert. | Verify `package_interest` rows and admin monetization display. | yes | yes | Production-test package demand capture. |
| not verified | Investor/partner/contact forms | Existing docs mention pipelines, but route was not verified in this pass. | Confirm route/table/API or add to next build pass. | maybe | yes | Verify investor/partner pipeline route and admin view. |
| partial | Spam protection | Honeypots and some in-memory rate limiting exist. No durable distributed rate limit verified. | Add persistent rate limiting or edge protection for public forms. | maybe | yes | Build durable spam/rate-limit protection. |
| partial | Admin queue | Admin source/correction/monetization pages exist. Real queue review not verified. | Run seeded submissions and status-change test. | yes | no | Verify admin intake queues end to end. |
| partial | Thank-you/submission ID/next action | Several flows show IDs/summaries by code inspection. Browser verification not run. | Submit each form and capture screenshots. | yes | no | Browser-test intake thank-you pages. |

## User Checklist

| Status | Route/file affected | What failed or passed | Fix recommendation | Credentials needed | Business decision needed | Recommended next prompt |
|---|---|---|---|---|---|---|
| not verified | `/auth/signup` | Signup route exists and targets `/dashboard`, but auth was not tested. | Test signup in Supabase-enabled staging/prod. | yes | no | Verify signup/login/dashboard redirect. |
| not verified | `/auth/login` | Login route exists, but production login not tested. | Test login/logout/session persistence. | yes | no | Verify auth session handling. |
| partial | `/dashboard` | API requires auth; page modules exist. Browser auth protection not verified. | Test anonymous, logged-in, expired-session states. | yes | no | Verify dashboard access and empty states. |
| partial | Watchlists | Watch API and dashboard modules exist. Storage and anonymous-to-user conversion need production test. | Watch an official anonymously, sign up, confirm merge. | yes | no | Test anonymous watch conversion. |
| partial | Packets/submissions visibility | Dashboard packet/submission modules exist by route inventory. Data join not verified. | Submit as logged-in user and verify dashboard rows. | yes | no | Verify user submissions in dashboard. |
| partial | Privacy controls | `/dashboard/privacy` and `/privacy/controls` exist. Save behavior not verified. | Save preferences and confirm database row. | yes | no | Verify privacy controls persistence. |
| pass | Anonymous CTA behavior | Package/source/watch flows have graceful fallback messages and account CTAs by inspection. | Browser-test no-auth flows. | no | no | Verify anonymous public conversion UX. |

## Admin Checklist

| Status | Route/file affected | What failed or passed | Fix recommendation | Credentials needed | Business decision needed | Recommended next prompt |
|---|---|---|---|---|---|---|
| pass | `src/app/admin/layout.tsx` | Server-side admin access check exists; non-admins redirected. | Test with real admin/non-admin accounts. | yes | no | Production-test admin access control. |
| partial | `/admin/sources` | Queue page exists; real submission/status workflow not verified. | Test source review, notes, status changes. | yes | no | Verify admin source queue workflow. |
| partial | `/admin/analytics` | Analytics visible by route, data not verified. | Seed/click events and inspect dashboard totals. | yes | no | Verify admin analytics dashboard. |
| partial | `/admin/monetization` | Monetization readiness page exists; data depends on package rows/events. | Submit package interest and confirm dashboard. | yes | yes | Verify monetization demand signals. |
| partial | Data health | Admin data-health/import route presence not fully verified in this pass. | Add or verify dedicated data-health page. | yes | yes | Build/verify data health monitoring dashboard. |
| partial | Audit log | Audit table patterns exist in prior systems; end-to-end admin audit not verified. | Perform admin action and verify audit row. | yes | no | Verify admin audit log for status changes. |
| pass | Admin noindex | Admin layout metadata sets noindex and sitemaps exclude admin routes. | Confirm rendered robots meta in browser. | no | no | Browser-check noindex on admin pages. |
| pass | Admin sitemap exclusion | Sitemap builder includes public groups only; admin not included. | Fetch sitemap in production. | no | no | Verify sitemap excludes private routes. |

## SEO Checklist

| Status | Route/file affected | What failed or passed | Fix recommendation | Credentials needed | Business decision needed | Recommended next prompt |
|---|---|---|---|---|---|---|
| partial | `/sitemap.xml` | Sitemap index implementation exists. Endpoint output not fetched in this pass. | Fetch sitemap index and each child sitemap in production. | no | no | Run sitemap endpoint smoke test. |
| partial | Dynamic sitemaps | Static/profile/official/agencies/jurisdictions/races/school-boards/stories/sources/news routes exist by inventory. Counts not verified. | Generate count report and compare public indexable data. | no | no | Build real sitemap count report. |
| pass | `/robots.txt` | Robots route exists and references sitemap entries. | Production fetch still recommended. | no | no | Verify robots.txt in production. |
| partial | Canonicals/metadata | Shared `getPageMetadata()` exists and several routes use it. Full coverage scan not completed due hanging broad scans. | Add metadata coverage script. | no | no | Build metadata/canonical audit script. |
| pass | Private noindex | Admin layout noindex exists; private routes are excluded from tracking and sitemap by code. | Browser-check dashboard/admin meta. | no | no | Verify private route noindex tags. |
| partial | OG images | Dynamic OG route exists for major page types. Image rendering not browser-tested. | Fetch OG URLs for home/profile/package/story/race. | no | no | Verify OG image rendering and social preview cards. |
| partial | JSON-LD | Organization/WebSite JSON-LD are in root layout; helpers exist for breadcrumbs, datasets, profiles. Full per-route JSON-LD coverage not verified. | Add route-level structured-data audit. | no | yes | Verify JSON-LD coverage across indexable route types. |
| not verified | Duplicate slugs | SEO report has placeholder lists; no real duplicate scan verified. | Implement duplicate slug scanner across static data/database. | maybe | no | Build duplicate slug and orphan page scanner. |
| partial | Sparse/under-review pages | Sitemap rules exclude some empty groups, but sparse profile noindex policy is not fully enforced. | Add data-quality gate for noindex on low-source pages. | maybe | yes | Implement sparse page indexing policy. |

## Trust And Safety Checklist

| Status | Route/file affected | What failed or passed | Fix recommendation | Credentials needed | Business decision needed | Recommended next prompt |
|---|---|---|---|---|---|---|
| pass | Trust labels/components | Source labels, correction workflow docs/components, and safe language utilities exist. | Continue enforcing per public route. | no | no | Audit labels on all profile/story/red-flag pages. |
| pass | Correction CTA | Correction APIs/routes exist and safety-check user input. | Browser-test on profile/story/red-flag pages. | yes | no | Verify correction CTA placement sitewide. |
| pass | Risky content warning | Correction/package/privacy inputs reject threats/private addresses/minor/private medical language. | Extend scanner to all admin-created content. | maybe | yes | Build admin risky-language lint pass. |
| partial | No private addresses/minors shown publicly | Public safety rules exist in docs/utilities. Full rendered content scan not completed. | Crawl public pages and search for private address/minor patterns. | maybe | no | Run public-sensitive-data crawl. |
| pass | User submissions not auto-published | Source/correction/package submissions go to queues/status review, not public publishing. | Verify RLS/admin review in Supabase. | yes | no | Verify RLS and admin-only publication. |
| partial | Public claims labeled | Labeling exists by system design, but full route coverage not audited visually. | Review profile/story/race pages for label coverage. | no | yes | Visual trust-label audit for major public pages. |
| partial | Safe share snippets | Sharing system docs/components exist, but all route placements were not browser-verified. | Click share drawer on profile/story/race/package. | no | no | Verify share snippets across public page types. |

## Monetization Readiness Checklist

| Status | Route/file affected | What failed or passed | Fix recommendation | Credentials needed | Business decision needed | Recommended next prompt |
|---|---|---|---|---|---|---|
| partial | Package interest collection | Package interest flow exists with analytics and Supabase insert. Needs production table/env verification. | Submit a package interest request and inspect admin route. | yes | yes | Production-test package interest pipeline. |
| partial | Monetization dashboard | `/admin/monetization` exists. Data not verified. | Verify demand, package, and revenue signals in admin. | yes | yes | Verify admin monetization data. |
| pass | Package pages | Package dynamic route and four target package slugs exist by code. | Browser-test each page. | no | yes | Smoke-test package pages and CTAs. |
| pass | Payment feature flag | Feature flag utility defaults disabled unless env/database enables it. | Confirm `ENABLE_PAYMENTS` false in production until ready. | yes | yes | Verify payment feature flag in Vercel env. |
| pass | No public checkout unless enabled | Package pages show demand-capture/no payment copy while payments disabled. | Verify no live Stripe checkout appears in production. | yes | yes | Confirm payments-disabled public UX. |
| partial | No broken Stripe text | Package public copy is demand capture. Full text scan hung; known public setup language fixed. | Run clean-clone scan for `Stripe link`, `not configured`, `checkout not configured`. | no | no | Run clean public-copy payment scan. |
| partial | Demand signals tracked | Package interest events exist. Database rows/events not verified. | Inspect `package_interest` and event tables after test. | yes | yes | Verify demand signal tracking. |

## Design Checklist

| Status | Route/file affected | What failed or passed | Fix recommendation | Credentials needed | Business decision needed | Recommended next prompt |
|---|---|---|---|---|---|---|
| partial | Homepage premium feel | Existing homepage/next-action systems appear visually branded by code. No screenshots captured in this pass. | Capture mobile/desktop screenshots and compare aspect ratios. | no | yes | Run visual QA for homepage aspect ratios and card depth. |
| partial | Profile page premium feel | Profile dossier exists; prior user feedback still calls for richer visuals/photos/data completion. | Continue data/visual asset pipeline for all profiles. | maybe | yes | Audit profile visuals, images, and vote/funding charts. |
| partial | Dashboard premium feel | Dashboard route/components exist; visual/browser test not run. | Test on mobile and desktop. | yes | yes | Dashboard UX visual QA. |
| partial | Admin usable | Admin routes exist and protected; no browser test. | Test admin workflows with seeded data. | yes | no | Admin usability smoke test. |
| partial | Flat/plain sections | Some new package/tool pages have stronger visual treatment; older pages may still be flat. | Visual inventory and prioritize core public pages. | no | yes | Run design flatness audit and fix top 10 sections. |
| pass | Mobile action dock | `NextActionRail` includes mobile fixed bottom action bar. | Browser-test safe area and overlap. | no | no | Verify mobile action dock on core routes. |
| pass | Sticky action rail | Sitewide `NextActionRail` in root layout. | Confirm it does not overlap content. | no | no | Visual QA sticky/next action rail. |
| partial | Glass panels/depth/contrast/aspect ratios | Many components use gradients/shadows/focus states. Aspect ratio/photo issues remain unverified. | Use Playwright screenshots at 390, 768, 1440, 1920 widths. | no | yes | Responsive visual regression pass. |

## Performance And Accessibility Checklist

| Status | Route/file affected | What failed or passed | Fix recommendation | Credentials needed | Business decision needed | Recommended next prompt |
|---|---|---|---|---|---|---|
| partial | Mobile-first layout | Responsive classes and mobile action bar exist. No horizontal-scroll test run. | Run Playwright viewport checks. | no | no | Mobile viewport smoke test. |
| not verified | No horizontal scroll | Not verified in browser. | Add automated viewport assertions. | no | no | Run horizontal-scroll detection across routes. |
| partial | Images optimized | Next image config exists. Actual remote/image coverage and distorted profile/race thumbnails need audit. | Inventory images and enforce aspect-ratio/object-fit patterns. | maybe | yes | Build image/aspect-ratio QA pass. |
| partial | Heavy effects | Graphs/visual components exist. Bundle/performance not measured. | Run Lighthouse and Next bundle analyzer. | no | no | Run performance budget and bundle audit. |
| partial | Reduced motion | Not fully audited. | Add `motion-reduce` classes or CSS reductions for animated effects. | no | yes | Audit and implement reduced-motion support. |
| not verified | Keyboard navigation | Focus-visible classes appear in new components. Full keyboard test not run. | Manual keyboard pass on forms, command palette, modal, admin table. | no | no | Run keyboard accessibility pass. |
| partial | Aria labels | Some dialog/button semantics exist. Full icon-button audit not done. | Scan all icon-only buttons for `aria-label`. | no | no | Run aria-label audit. |
| partial | Loading states | Dashboard/package forms have loading states. Not all routes verified. | Audit submit/loading/empty states route-by-route. | no | no | Verify loading and empty states. |
| partial | Tables mobile | Admin/data tables may need card/overflow treatment. Not verified visually. | Mobile test admin/source/finance/vote tables. | yes | no | Mobile table accessibility pass. |
| partial | Form errors clear | Current public forms show error messages. End-to-end not verified. | Submit invalid data to every public form. | no | no | Form validation UX smoke test. |

## Remaining Launch Blockers

1. Build, lint, and typecheck are not verified in this Drive-backed clone.
2. Production Supabase credentials, migrations, RLS, and admin roles must be verified.
3. Core public forms need real production test submissions and admin review confirmation.
4. Search/saved search/interest graph need seeded-data production verification.
5. SEO sitemap/OG/social preview endpoints need production fetch and social-card test.
6. Browser console, mobile screenshots, accessibility, and performance measurements are still not verified.
7. Official profile data quality, images, vote weighting, funding, and source completeness remain product/data blockers.
8. Payment checkout must remain disabled until business/legal/payment readiness is confirmed.
