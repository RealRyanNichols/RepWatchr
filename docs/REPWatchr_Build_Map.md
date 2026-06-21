# RepWatchr Build Map

Audit date: 2026-06-21

Source tree audited: `/tmp/repwatchr-deploy` at commit `7fc2860 Import Texas legislative vote records`.

Checks run before this map:

- Route inventory from `src/app`
- Static data inventory from `src/data`
- Supabase, Stripe, auth, cron, analytics, sitemap, robots, manifest, RSS, and OG route scan
- `eslint`
- `next build`

## Current Routes

### Public Page Routes

| Route | File | What it does |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Main RepWatchr home page: Search. Grade. Source. Share. Includes search, official discovery, source packet CTAs, election/news sections, and record-first positioning. |
| `/about` | `src/app/about/page.tsx` | Explains the RepWatchr mission, method, public-record guardrails, and accountability model. |
| `/authority-watch` | `src/app/authority-watch/page.tsx` | Public-power category landing page for officials, badge/custody roles, school systems, and other authority lanes. |
| `/authors` | `src/app/authors/page.tsx` | Citizen Author Desk for turning sourced issues into structured public posts and record packets. |
| `/blog` | `src/app/blog/page.tsx` | Blog/editorial landing page driven by source-backed news and service/election content. |
| `/daily-wire` | `src/app/daily-wire/page.tsx` | Dynamic daily watch wire, using persisted Supabase clips when configured and fallback clip logic otherwise. |
| `/feed` | `src/app/feed/page.tsx` | Political attention feed with Daily Watch, news, source actions, and share paths. |
| `/feedback` | `src/app/feedback/page.tsx` | Source/correction submission page using the unified Supabase-backed source queue with copy/export fallback. |
| `/submit-source` | `src/app/submit-source/page.tsx` | Alias that re-exports `/feedback` as the source-submission page. |
| `/submit-source/thanks` | `src/app/submit-source/thanks/page.tsx` | Post-submission thank-you page showing submission ID, copyable source packet, next action, share link, and account prompt. |
| `/funding` | `src/app/funding/page.tsx` | Campaign funding index for officials with funding summaries or campaign-finance source paths. |
| `/funding/[officialId]` | `src/app/funding/[officialId]/page.tsx` | Per-official funding page with raised/spent/cash, donor breakdown, geography, donors, and source panel where available. |
| `/methodology` | `src/app/methodology/page.tsx` | Explains scoring, vote evidence, constitutional alignment, source rules, and guardrails. |
| `/news` | `src/app/news/page.tsx` | Public accountability story index. Only publishable source-backed news records are exposed. |
| `/news/[id]` | `src/app/news/[id]/page.tsx` | Individual news/story page with metadata, source labels, source links, and share CTAs. |
| `/officials` | `src/app/officials/page.tsx` | National elected-officials directory with filters, command search, buildout summaries, and official cards. |
| `/officials/[id]` | `src/app/officials/[id]/page.tsx` | Core official profile: identity, score, ideology chart, constitutional alignment, issue scorecard, voting record, funding, public records/controversies, trading watch, scorecard vote, social/public statements. |
| `/school-boards` | `src/app/school-boards/page.tsx` | National school-board watch landing page, with Texas roster/district buildout, picker, engagement counters, and dossiers. |
| `/school-boards/[districtSlug]` | `src/app/school-boards/[districtSlug]/page.tsx` | School district page with district facts, member profiles, source feeds, questions, gaps, and records. |
| `/school-boards/[districtSlug]/[candidateId]` | `src/app/school-boards/[districtSlug]/[candidateId]/page.tsx` | Individual school-board candidate/member dossier. |
| `/scorecards` | `src/app/scorecards/page.tsx` | Universal scorecard index for issue categories and profile community scoring. |
| `/scorecards/[category]` | `src/app/scorecards/[category]/page.tsx` | Category scorecard page for an issue family. |
| `/issues` | `src/app/issues/page.tsx` | Texas issue-category index. |
| `/issues/[id]` | `src/app/issues/[id]/page.tsx` | Issue detail page with related officials, votes, and scorecard framing. |
| `/votes` | `src/app/votes/page.tsx` | Tracked vote index from static `src/data/votes`. |
| `/votes/[billId]` | `src/app/votes/[billId]/page.tsx` | Individual bill/vote detail page. |
| `/elections` | `src/app/elections/page.tsx` | Election command center: Texas races, records, school boards, scorecards, and story links. |
| `/elections/texas` | `src/app/elections/texas/page.tsx` | Texas election race index for 2026 race watch lanes. |
| `/elections/texas/[raceSlug]` | `src/app/elections/texas/[raceSlug]/page.tsx` | Individual Texas race watch page. |
| `/elections/texas/contribute` | `src/app/elections/texas/contribute/page.tsx` | Texas election source contribution form; writes to the unified source queue and keeps local packet export as backup. |
| `/services` | `src/app/services/page.tsx` | Free and paid service offering index. Paid cards start server-side Stripe Checkout when configured, otherwise route to the request packet form. |
| `/services/[slug]` | `src/app/services/[slug]/page.tsx` | Individual service page with checkout CTA, request packet builder, and service details. |
| `/services/checkout/success` | `src/app/services/checkout/success/page.tsx` | Stripe Checkout success page with source-context next step and checkout analytics. |
| `/services/checkout/cancel` | `src/app/services/checkout/cancel/page.tsx` | Stripe Checkout cancel page with retry/request-package path and cancellation analytics. |
| `/state-reps` | `src/app/state-reps/page.tsx` | State representative directory shortcut focused on state-level official discovery. |
| `/data-reports` | `src/app/data-reports/page.tsx` | Public data/buildout report page summarizing loaded records and gaps. |
| `/red-flags` | `src/app/red-flags/page.tsx` | Red-flag/public-record issue index. |
| `/attorneys` | `src/app/attorneys/page.tsx` | Attorney, public defender, and law-firm watch landing page. |
| `/attorneys/[slug]` | `src/app/attorneys/[slug]/page.tsx` | Individual attorney/law-firm profile page. |
| `/media` | `src/app/media/page.tsx` | Media and newsroom watch landing page. |
| `/media/[slug]` | `src/app/media/[slug]/page.tsx` | Individual media profile page. |
| `/public-safety` | `src/app/public-safety/page.tsx` | Public-safety agency/official watch landing page. |
| `/public-safety/[slug]` | `src/app/public-safety/[slug]/page.tsx` | Individual public-safety profile page. |
| `/east-texas-predator-watch` | `src/app/east-texas-predator-watch/page.tsx` | East Texas Predator Watch page with source-seeded profiles and private report intake. |
| `/east-texas-predator-watch/[slug]` | `src/app/east-texas-predator-watch/[slug]/page.tsx` | Individual registry-profile watch page with report form. |
| `/faretta-ai` | `src/app/faretta-ai/page.tsx` | Faretta AI console for search/research prompts, file text preview, source-link context, and optional external chat endpoint. |
| `/gideon` | `src/app/gideon/page.tsx` | Legacy Gideon route using the same Faretta API handlers. |
| `/search` | `src/app/search/page.tsx` | Search/AI entry page using Faretta-style search framing. |
| `/uap` | `src/app/uap/page.tsx` | UAP records watch page; explicitly `noindex`. |
| `/privacy` | `src/app/privacy/page.tsx` | Privacy policy. |
| `/terms` | `src/app/terms/page.tsx` | Terms of service. |

### Auth, Member, Dashboard, And Admin Routes

| Route | File | What it does |
| --- | --- | --- |
| `/auth/login` | `src/app/auth/login/page.tsx` | Supabase email/password and magic-link login. |
| `/auth/signup` | `src/app/auth/signup/page.tsx` | Supabase signup and initial member profile creation. |
| `/auth/verify` | `src/app/auth/verify/page.tsx` | Identity/residency verification form for verified-profile features. |
| `/auth/callback` | `src/app/auth/callback/route.ts` | Exchanges Supabase auth code and redirects to `next` path. |
| `/login` | `src/app/login/page.tsx` | Redirects to `/auth/login`. |
| `/create-account` | `src/app/create-account/page.tsx` | Redirects to `/auth/signup`. |
| `/dashboard` | `src/app/dashboard/page.tsx` | Login-required member workspace with Watchlist, Source Packet Builder, Public Records Request Drafts, Timeline Starter, Faretta research notes, My Submissions, and paid-service upgrade cards. |
| `/dashboard/claims` | `src/app/dashboard/claims/page.tsx` | Member profile-claim list. |
| `/dashboard/official-profile/[claimId]` | `src/app/dashboard/official-profile/[claimId]/page.tsx` | Claimed-profile editor for approved claims; submission tools are intentionally paused unless subscription is active. |
| `/dashboard/settings` | `src/app/dashboard/settings/page.tsx` | Member settings and profile tools. |
| `/profiles/claim` | `src/app/profiles/claim/page.tsx` | Profile ownership claim form. Uploads proof to `profile-submissions` and creates `profile_claims`. |
| `/admin` | `src/app/admin/page.tsx` | Server-gated admin dashboard for overview metrics, source review queue, profile manager, revenue desk, content desk, data health, and audit log. Requires `user_roles.role = admin` before rendering. |
| `/admin/claims` | `src/app/admin/claims/page.tsx` | Admin/reviewer profile-claim queue. Client checks `user_roles`. |
| `/admin/content-review` | `src/app/admin/content-review/page.tsx` | Admin/reviewer queue for claimed profile content/media; admins also review source submissions and change source status. |
| `/admin/control-center` | `src/app/admin/control-center/page.tsx` | Admin data, coverage, table-count, connection, and daily pipeline control center. |
| `/admin/superadmin` | `src/app/admin/superadmin/page.tsx` | SuperAdmin office shell for operator tasks, cases, questions, asks, and internal command flow. |
| `/admin/superadmin/preview` | `src/app/admin/superadmin/preview/page.tsx` | SuperAdmin preview page. |

### API, Cron, Auth Callback, SEO, RSS, And OG Routes

| Route | Method | File | What it does |
| --- | --- | --- | --- |
| `/api/admin/control-center` | GET | `src/app/api/admin/control-center/route.ts` | Admin-only JSON for coverage, Supabase table counts, connection status, and profile completion. |
| `/api/admin/actions` | POST | `src/app/api/admin/actions/route.ts` | Server-gated admin mutation endpoint for source reviews, staged profile edits, revenue fulfillment status, content desk saves, broken-link updates, and audit logging. |
| `/api/admin/profile-completion` | GET | `src/app/api/admin/profile-completion/route.ts` | Admin-only profile-completion JSON and review-count summary. |
| `/api/analytics/event` | POST | `src/app/api/analytics/event/route.ts` | Client analytics event ingestion for checkout/service events into `payment_events` when Supabase admin is configured. |
| `/api/analytics/page-view` | POST | `src/app/api/analytics/page-view/route.ts` | Client page-view ingestion into `site_page_views`; silently no-ops if Supabase admin is missing. |
| `/api/analytics/share` | POST | `src/app/api/analytics/share/route.ts` | Stores public profile share events for most-shared admin reporting; stores path/channel/profile IDs only. |
| `/api/auth/x/start` | GET | `src/app/api/auth/x/start/route.ts` | Secret-gated X OAuth setup start for social posting. |
| `/api/auth/x/callback` | GET | `src/app/api/auth/x/callback/route.ts` | X OAuth token exchange and token storage in `repwatchr_social_tokens`. |
| `/api/cron/daily-updates` | GET | `src/app/api/cron/daily-updates/route.ts` | Secret-gated daily job: fetch daily clips, persist clips, and run profile overlay updates. |
| `/api/cron/hourly-social-posts` | GET | `src/app/api/cron/hourly-social-posts/route.ts` | Secret-gated hourly social autopost job with dry-run support. |
| `/api/dashboard/coverage` | GET | `src/app/api/dashboard/coverage/route.ts` | Public dynamic coverage/buildout JSON for dashboard panels. |
| `/api/faretta/chat` | POST | `src/app/api/faretta/chat/route.ts` | Faretta chat proxy; returns fallback when no endpoint is configured. |
| `/api/faretta/collect` | POST | `src/app/api/faretta/collect/route.ts` | Stores Faretta interaction metadata in Supabase. |
| `/api/faretta/intake` | POST | `src/app/api/faretta/intake/route.ts` | Secret-gated external intake into accountability cases/entities/questions. |
| `/api/gideon/chat` | POST | `src/app/api/gideon/chat/route.ts` | Legacy alias for Faretta chat handler. |
| `/api/gideon/collect` | POST | `src/app/api/gideon/collect/route.ts` | Legacy alias for Faretta collect handler. |
| `/api/health/integrations` | GET | `src/app/api/health/integrations/route.ts` | Bearer-secret integration health check for env, Supabase tables/views, social tokens, clips, and posts. |
| `/api/member-create-account` | GET/POST | `src/app/api/member-create-account/route.ts` | Legacy form endpoint that redirects to auth signup or signs up through Supabase. |
| `/api/member-login` | GET/POST | `src/app/api/member-login/route.ts` | Legacy form endpoint that redirects to login or signs in through Supabase. |
| `/api/og/news` | GET | `src/app/api/og/news/route.tsx` | Dynamic OG image for news pages. |
| `/api/og/official` | GET | `src/app/api/og/official/route.tsx` | Dynamic OG image for official profiles. |
| `/api/og/race` | GET | `src/app/api/og/race/route.tsx` | Dynamic OG image for election race pages. |
| `/api/og/school-board` | GET | `src/app/api/og/school-board/route.tsx` | Dynamic OG image for school-board pages. |
| `/api/predator-watch/report` | POST | `src/app/api/predator-watch/report/route.ts` | Private report intake with required acknowledgments, rate limit, hashed IP/user-agent, file limits, and private evidence storage. |
| `/api/profile-overlays/[type]/[id]` | GET | `src/app/api/profile-overlays/[type]/[id]/route.ts` | Public overlay JSON for completion, enrichment items, vote snapshots, social accounts, and public statements. |
| `/api/services/request` | POST | `src/app/api/services/request/route.ts` | Stores service request packet submissions when Supabase admin is configured and records request analytics. |
| `/api/source-submissions` | GET/POST | `src/app/api/source-submissions/route.ts` | POST stores source submissions, events, status history, and source-url attachments. GET returns reviewed public source summaries only. |
| `/api/stripe/create-checkout-session` | POST | `src/app/api/stripe/create-checkout-session/route.ts` | Creates Stripe subscription checkout for approved claimed profiles. |
| `/api/stripe/service-checkout` | POST | `src/app/api/stripe/service-checkout/route.ts` | Creates server-side Stripe Checkout sessions for paid RepWatchr service packages. |
| `/api/stripe/webhook` | POST | `src/app/api/stripe/webhook/route.ts` | Verifies Stripe webhooks, reconciles service orders/subscriptions, and keeps claimed-profile subscription status. |
| `/rss.xml` | GET | `src/app/rss.xml/route.ts` | RSS feed combining publishable news and Daily Watch clips. |
| `/sitemap.xml` | GET | `src/app/sitemap.ts` | Generates static/dynamic sitemap from officials, funding, votes, news, issues, scorecards, Texas races, services, and school boards. |
| `/robots.txt` | GET | `src/app/robots.ts` | Allows public pages and disallows admin/auth/dashboard/login/buildout/uap. |
| `/manifest.webmanifest` | GET | `src/app/manifest.ts` | PWA manifest using RepWatchr name, theme, and logo. |

## Data Sources

### Static Repo Data

- `src/data/officials/**`: 9,000+ JSON profile files across federal, state, county, city, school-board, state executive, and state-legislature folders.
- `src/data/vote-records`: 710 public vote-record files loaded from federal XML and Texas Legislature sources.
- `src/data/votes`: 6 scored/tracked bill records used by the legacy scorecard/votes pages.
- `src/data/scores`: 6 manual scorecards.
- `src/data/funding`: 6 campaign funding summaries.
- `src/data/red-flags`: 12 red-flag/public-record files.
- `src/data/news`: 16 source/story JSON records, with publish filtering in `getAllNews`.
- `src/data/congress-trading`: secondary tracker snapshot plus official source links.
- `src/data/*.ts`: services, election races, school board rosters/elections, attorney/media/public-safety/predator data, SEO plan, and national buildout metadata.

### Supabase Data Used By Code

The code expects Supabase tables/views for:

- Member and identity: `profiles`, `member_profiles`, `user_roles`
- Voting and grades: `citizen_votes`, `citizen_grades`, `profile_scorecard_votes`
- Public aggregates: `approval_ratings`, `approval_ratings_by_county`, `citizen_grade_summary`, `citizen_grade_summary_by_county`, `profile_scorecard_summary`, `profile_scorecard_summary_by_county`, `profile_scorecard_summary_by_scope`, `profile_scorecard_algorithm`
- Claims and review: `profile_claims`, `profile_claim_audit`, `claimed_profile_content`, `profile_media`
- Reports and comments: `reports`, `comments`
- Member tools: `member_tracked_items`, `member_source_packet_drafts`, `member_public_record_requests`, `member_timeline_starters`, `member_faretta_notes`, `member_research_theories`, `member_action_packets`
- Analytics: `site_page_views`, `site_page_view_summary`
- Faretta/Gideon: `faretta_interactions`, `gideon_interactions`, `accountability_cases`, `accountability_case_entities`, `profile_questions`, `profile_question_responses`
- Source submission queue: `source_submissions`, `source_submission_events`, `source_submission_attachments`, `source_review_notes`, `source_status_history`
- Secure admin dashboard: `admin_audit_log`, `admin_profile_edits`, `admin_content_items`, `admin_broken_source_links`, `admin_import_runs`, `site_share_events`
- Legacy Texas election intake display table: `texas_election_contributions` is now optional legacy data; new Texas source submissions use `source_submissions`.
- Social/daily pipeline: `repwatchr_daily_clips`, `repwatchr_social_tokens`, `repwatchr_social_posts`, `profile_update_runs`, `profile_completion_snapshots`, `profile_enrichment_items`, `profile_vote_snapshots`, `vote_issue_rules`, `profile_social_accounts`, `public_statement_snapshots`, `social_monitoring_jobs`
- Predator Watch: `predator_profiles`, `predator_reports`, `predator_report_evidence`, `predator_public_notes`
- Operator office: `repw_operator_invites`, `operator_tasks`, `operator_asks`

Current SQL files in this repo only define a smaller subset:

- `supabase-schema.sql`: `profiles`, `citizen_votes`, `approval_ratings`, `approval_ratings_by_county`
- `supabase-citizen-grades.sql`: `citizen_grades`, grade summary views
- `supabase-profile-scorecards.sql`: `profile_scorecard_votes`, scorecard summary views
- `supabase-source-submissions.sql`: unified source queue, source events, attachments, review notes, status history, RLS, and Data API grants
- `supabase-payments.sql`: service checkout orders, subscriptions, service requests, customers, and payment events
- `supabase-member-dashboard.sql`: member dashboard watchlist, source packet drafts, public-record request drafts, timeline starters, saved Faretta notes, RLS, and Data API grants
- `supabase-admin-dashboard.sql`: secure admin audit log, staged profile edits, content desk items, broken source links, import runs, share events, RLS, and Data API grants
- `supabase-owner-bootstrap.sql`: operator invites and auth trigger, but it references prerequisite SQL files/functions that are not present in this repo.

### Import And Build Scripts

- `scripts/import-national-federal-officials.py`
- `scripts/import-national-openstates-officials.py`
- `scripts/import-openstates-municipal-officials.py`
- `scripts/import-texas-officials.py`
- `scripts/import-texas-legislature-vote-records.py`
- `scripts/import-texas-senate-journal-vote-records.py`
- `scripts/import-federal-vote-records.py`
- `scripts/import-congress-trading.py`
- `scripts/import-texas-voter-registration.py`
- `scripts/import-predator-watch-official-records.mjs`
- `scripts/seed-texas-supreme-court-officials.py`
- `scripts/backfill-wikimedia-official-photos.py`
- `scripts/generate-official-ideology-master.py`
- `scripts/bootstrap-superadmin.mjs`

## Forms And Submit Flows

| Surface | Component/API | Current behavior |
| --- | --- | --- |
| Source/correction submission | `SourceSubmissionForm`, `ReportButton`, `/api/source-submissions` | Writes to `source_submissions`, creates events/status history/attachments, then routes to `/submit-source/thanks`; copy/download packet remains as fallback. |
| Texas election contribution | `TexasElectionContributionForm`, `/api/source-submissions` | Writes Texas race submissions to the unified source queue using `target_type=texas_election_race`; local packet queue/export remains as backup. |
| Reviewed Texas race submissions | `TexasRacePublicContributions`, `/api/source-submissions` GET | Reads only reviewed public source summaries with statuses `verified` or `attached_to_profile`; submitter data stays private. |
| Profile claim | `ProfileClaimForm` | Requires login, uploads proof to `profile-submissions`, inserts `profile_claims`. |
| Claimed profile editor | `ClaimedProfileEditor` | Loads claim/subscription/content/media; public submissions are locked unless approved and subscribed. Current public copy says tools are paused while workflow moves out of public app. |
| Citizen approval | `ApproveButton` | Verified Supabase users can upsert `citizen_votes`. |
| Citizen grade | `GradeOfficialSection` | Verified Supabase users can upsert `citizen_grades`. |
| Universal scorecard vote | `ProfileScorecardVote` | Verified Supabase users can upsert `profile_scorecard_votes` with voter-scope questionnaire fields. |
| Comments | `CommentSection` | Uses Supabase `comments` and auth/profile state. |
| Predator Watch report | `PredatorWatchReportForm` + `/api/predator-watch/report` | Posts private reports with required acknowledgments, file limit, hashed submitter metadata, private status, and private evidence bucket. |
| Faretta console | `FarettaConsole` + `/api/faretta/chat` | Uses external endpoint when configured; falls back to local guidance otherwise. |
| Faretta collection | `/api/faretta/collect` | Stores interaction metadata when Supabase table exists. |
| Auth signup/login/verify | `/auth/*` | Supabase auth plus profile verification data. |
| Admin claims/content | Admin clients | Client-side role checks and Supabase mutations for review queues. |
| SuperAdmin office | `SuperAdminOfficeClient` | Reads and writes operator tasks, asks, accountability cases, entities, and questions. |

## Auth Flow

- Browser client: `src/lib/supabase.ts`
- Server client: `src/lib/supabase-server.ts`
- Admin client: `src/lib/supabase-admin.ts`
- Public auth enable flag: `NEXT_PUBLIC_ENABLE_SUPABASE_AUTH`
- Supabase public env required for live auth: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Service-role env required for admin/server writes: `SUPABASE_SERVICE_ROLE_KEY`
- Role model used by UI: `admin`, `reviewer`, `researcher`, `claimed_official`, `journalist`, `voter`
- The new `/admin` dashboard and `/api/admin/actions` route are server-gated by Supabase user plus `user_roles.role = admin`.
- Older deep admin shells under `/admin/claims`, `/admin/content-review`, `/admin/control-center`, and `/admin/superadmin` still rely on their existing client/API/Supabase checks and should be migrated behind the same server-side admin gate next.

## Stripe And Revenue Surfaces

- `/services` and `/services/[slug]` show free and paid research services.
- Paid service cards create server-side Stripe Checkout sessions through `/api/stripe/service-checkout`.
- Service checkout products are fixed in `src/lib/repwatchr-payment-products.ts`; the client sends only the service slug.
- If `STRIPE_SECRET_KEY` is missing, service CTAs route to a clean request-package form.
- `/api/stripe/create-checkout-session` supports subscription checkout only for approved profile claims.
- `/api/stripe/webhook` verifies Stripe signatures, reconciles checkout completion, subscription lifecycle events, failed invoices, and refund events.
- `supabase-payments.sql` now defines `orders`, `subscriptions`, `service_requests`, `customers`, and `payment_events`.
- Required env:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PROFILE_PRICE_ID` or `NEXT_PUBLIC_STRIPE_PROFILE_PRICE_ID`
  - `NEXT_PUBLIC_SITE_URL`

## SEO, Indexing, And Share Assets

- Root metadata is in `src/app/layout.tsx`.
- Per-route metadata exists on major public pages and dynamic profiles.
- Dynamic OG image routes exist for news, official, race, and school-board pages.
- `sitemap.ts` includes many public routes and dynamic officials/funding/votes/news/issues/scorecards/Texas races/services/school boards.
- `robots.ts` disallows `/admin/`, `/auth/`, `/dashboard/`, `/login`, `/buildout`, and `/uap`.
- `rss.xml` publishes source-backed news and Daily Watch clips.
- `manifest.ts` uses RepWatchr icons and branding.
- Public assets currently present: `repwatchr-logo-america-first.png`, `repwatchr-cover-america-first.png`, legacy logo/banner/profile images.

## Broken Or Incomplete Features

1. Missing Supabase schema coverage. The app expects many tables/views that are not defined in the four SQL files currently in this repo.
2. `supabase-owner-bootstrap.sql` references prerequisite SQL files and `public.is_repw_operator()` that are not present in this repo.
3. Admin Control Center referenced `supabase-social-monitoring.sql`, but that file is not present. This was corrected in app copy to call out the missing schema instead of linking to a non-existent file.
4. `.env.local.example` did not cover the current app surface. This was expanded with non-secret placeholders for the env vars actually referenced by the repo.
5. Source submissions now have a Supabase-backed queue and admin review workflow, but production still requires running `supabase-source-submissions.sql`.
6. Service revenue pages now create Stripe Checkout sessions when `STRIPE_SECRET_KEY` is configured and fall back to request packets when it is not.
7. Claimed profile paid workflow exists in API shape, but public editor copy says profile submissions are paused, so this is not a live revenue loop yet.
8. Faretta AI works as a fallback guide unless `FARETTA_CHAT_URL`/bearer or Gideon endpoint env is configured.
9. Page-view tracking silently no-ops without Supabase admin env and the `site_page_views` schema.
10. Daily Wire and social autoposting require Supabase persistence tables plus social credentials before the cron does useful production work.
11. Profile completion can show a profile as complete because required sections exist, even when vote-direction review is still incomplete. Vote ingestion and ideology scoring are separate.
12. Public vote records are loaded broadly, but issue mapping and left/right scoring are not complete for every roll-call row.
13. Static funding, red-flag, scorecard, and tracked-vote data are shallow compared with the official profile universe.
14. Admin and SuperAdmin pages rely heavily on client-side role checks; API/data calls are gated, but route shells are discoverable.
15. Some public landing pages are not included in the current sitemap static list, including `/feed`, `/daily-wire`, `/authors`, `/attorneys`, `/media`, `/public-safety`, `/east-texas-predator-watch`, and `/state-reps`.

## Revenue Blockers

1. Service checkout code is present, but production still requires Stripe secret/webhook env and the Stripe webhook endpoint configured in Stripe.
2. `supabase-payments.sql` must be applied in Supabase before orders, service requests, subscriptions, customers, and payment events persist.
3. Stripe profile checkout requires approved claims, Supabase auth, service role, price ID, and webhook setup before it can convert.
4. Claimed profile editor currently tells approved claimants that submission tools are paused.
5. No order/admin fulfillment dashboard for paid research services.
6. No Stripe customer portal route.
7. Paid service fulfillment status tables now exist in SQL/code, but no admin fulfillment UI is built yet.
8. No public pricing environment map before this audit; `.env.local.example` now fills this gap.

## Supabase Blockers

1. Missing complete migration set for expected tables/views.
2. Missing storage bucket setup docs/policies for `profile-submissions`, `profile-media-approved`, and `predator-report-evidence`.
3. Missing RLS policies for many expected dynamic features in the current repo.
4. Admin health route checks more tables/views than repo SQL creates.
5. `member_profiles`, `user_roles`, `profile_claims`, `comments`, `reports`, `site_page_views`, social pipeline tables, overlay tables, and Predator Watch tables need real migrations.
6. Member dashboard tables now have a dedicated migration, but production must apply `supabase-member-dashboard.sql` before saved dashboard tools sync to accounts.
7. Owner/operator bootstrap depends on absent prerequisite SQL files.
8. Local placeholder Supabase client prevents public-page crashes, but write flows can still show database-specific errors if env is half-configured.

## SEO And Indexing Blockers

1. Sitemap omits several public routes that should likely be indexable.
2. No automated broken-link checker is configured.
3. OG routes exist, but not every public page appears wired to a dynamic OG image.
4. News JSON contains more files than exposed pages because non-publishable source-review items are filtered; this is correct behavior but needs editorial monitoring.
5. Robots intentionally blocks `/uap`; review before promoting UAP pages.
6. Some high-value pages need schema beyond the services JSON-LD, especially official profiles, articles, school boards, and FAQs.

## Admin And Dashboard Blockers

1. `/admin` and `/dashboard` are now server-gated. Older deep admin pages (`/admin/claims`, `/admin/content-review`, `/admin/control-center`, `/admin/superadmin`) still render client-gated shells and should be moved behind the same server-side guard.
2. Control center table health is only as good as the missing migration set.
3. SuperAdmin office depends on tables not in repo SQL.
4. Source submissions now have a unified admin queue, but reports, comments, profile submissions, and Predator Watch reports still need a shared moderation dashboard.
5. No owner-safe audit trail coverage across every moderation action.
6. No visible import-run dashboard for Texas vote import scripts beyond profile update runs.
7. No operator checklist showing which schema files have been applied to production.

## Data-Quality Blockers

1. Official profiles are broad, but many are source-seeded rather than fully reviewed.
2. Vote records and ideology scores are separate; a profile can have many raw votes but only a smaller reviewed/scored subset.
3. Texas House/Senate roll-call imports need an explicit coverage report by session, chamber, member, bill, and source URL.
4. Texas Supreme Court profiles exist as a seed script lane, but opinion/order coverage and scoring rules are not comparable to legislative roll calls yet.
5. Funding summaries are currently limited to a small set of officials.
6. Red flags/public controversies are intentionally source-backed, but coverage is sparse.
7. The completion meter does not mean "every vote counted"; it means required profile sections are present.
8. Need a source-link checker for official websites, FEC links, vote links, news links, and school-board source links.
9. Need source-tier and review-status dashboards for enrichment items before broader auto-publishing.
10. Need a stronger public explanation on profile pages separating raw roll-call count, reviewed ideology count, and community scorecard votes.

## Tracking And Analytics Blockers

1. Vercel Analytics and Speed Insights are mounted in `layout.tsx`.
2. Google Analytics loads only when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set.
3. Custom page-view tracking requires Supabase admin env and `site_page_views` schema.
4. Integration health is bearer-secret gated by `INTEGRATION_HEALTH_SECRET` or `CRON_SECRET`.
5. Social autopost has safety gates: `SOCIAL_AUTOPOST_ENABLED=true` plus `SOCIAL_AUTOPOST_EDITORIAL_APPROVED=true` and platform credentials.
6. No visible analytics dashboard is wired for non-Vercel page-view summaries unless Supabase views exist.

## Highest-Impact Build Order

1. Apply `supabase-source-submissions.sql`, `supabase-payments.sql`, `supabase-member-dashboard.sql`, and `supabase-admin-dashboard.sql`, then create one complete Supabase migration set that matches every remaining table/view/storage bucket the code expects.
2. Add server-side admin route protection for `/admin/*` and deeper `/dashboard/*` pages that should not render without auth.
3. Build a schema/status checklist in the admin control center from real migrations.
4. Apply `supabase-payments.sql`, configure Stripe webhook signing, and run a live test checkout in Stripe test mode.
5. Create a service fulfillment/admin queue tied to Stripe checkout sessions.
6. Add a route/link checker and include it in CI.
7. Expand sitemap coverage for public routes currently omitted.
8. Build a vote coverage dashboard that separates raw roll calls, reviewed issue mappings, left/right scoring, constitutional alignment, and community votes.
9. Create Texas House/Senate import coverage reports by chamber/session/member/source.
10. Add public profile wording that clearly explains raw votes loaded versus votes ideologically reviewed.
11. Expand campaign funding ingestion beyond the six static officials, starting with active Texas federal and state profiles.
12. Expand red-flag/public-record enrichment only from official records or named publications, with review status before publication.
13. Wire Daily Watch persistence and social post logs after social schema is present.
14. Add structured Article/Profile/FAQ schema for high-value public pages.
15. Add admin moderation queues for reports, comments, source packets, Predator Watch reports, profile submissions, and Texas election contributions.

## Current Verification Result

- Lint: passed with 2 existing Next image warnings for `<img>` usage.
- Build: passed. Next generated 1,376 static pages.
- TypeScript: passed during `next build`.
