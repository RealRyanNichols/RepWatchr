# RepWatchr Build Map

Generated: 2026-07-01

Purpose: document the current app routes, systems, data sources, and build gaps without deleting or redesigning working functionality.

## System Map

| System | Current implementation | Status | Main blockers |
| --- | --- | --- | --- |
| Public site shell | `src/app/layout.tsx`, `Header`, `Footer`, `CivicLoopPanel` | Active | Visual consistency, mobile/media polish, complete CTA analytics |
| Static data loader | `src/lib/data.ts` reads JSON from `src/data` | Active | Source freshness, import health, profile completeness, duplicate detection |
| Official profiles | `/officials`, `/officials/[id]`, timeline/funding/vote helpers | Active but incomplete | Most profiles lack mapped charts, scorecards, funding, red flags, and verified source depth |
| School boards | `/school-boards` routes and `school-board-research` | Active | Member photo/source completeness and queue integration |
| Elections/races | `/elections`, `/elections/texas`, `/elections/texas/[raceSlug]`, contribute page | Active | County/district routes missing, unique thumbnails missing, candidate data incomplete |
| Stories/news/blog | `/news`, `/blog`, `/daily-wire`, RSS | Active | Dynamic OG, news sitemap, source labels, noisy wire governance |
| Source/correction intake | `/submit-source`, `/feedback`, `ReportButton`, Texas contribution form | Partial | Dedicated Supabase-backed queue not unified across forms |
| Member dashboard | `/dashboard` and child routes | Partial | Auth/noindex verification, persistence coverage, member data model maturity |
| Admin dashboard | `/admin/*` routes and APIs | Partial | Production role verification, audit logs, queue actions, import health |
| Analytics | `PageViewTracker`, `VisitorIntelligenceTracker`, admin analytics | Partial | Event taxonomy, funnel reporting, production data verification |
| SEO | global metadata, sitemap, robots, RSS | Partial | Sitemap index, split sitemaps, dynamic OG, JSON-LD, noindex consistency |
| Payments/revenue | service data, profile claim checkout/webhook, hidden future revenue rails | Dormant/partial | Paid services not live, fulfillment tables/workflow incomplete, legal/privacy review |
| Trust/safety | correction flow, source-first copy, policy docs | Partial | Enforced labels, risky-language review, universal source schema |

## Public Page Routes

Legend for gaps: CTA = missing/weak call to action; Analytics = missing explicit event coverage; SEO = missing canonical/metadata/JSON-LD/OG depth; Share = missing full source-backed sharing; Capture = missing form/data capture; Next = missing strong next-click path.

| Route | Purpose | Current status | Data used | Indexing | Gaps | Monetization signal |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | Homepage and public entry point | Active | Static data stats, search, story/action modules | Index | Analytics, unique visuals, stronger next-click measurement | High: search, service, source-packet intent |
| `/about` | Mission/about page | Active | Static copy | Index | SEO depth, Share, Capture | Low-medium: trust building |
| `/officials` | Search/discovery for officials | Active | `getAllOfficials`, client filters/search | Index cautiously | Analytics, advanced filters, pagination performance, empty-state capture | High: search demand and official interest |
| `/officials/[id]` | Official accountability dossier | Active but uneven | Official JSON, scores, vote records, funding, red flags, timelines, overlays | Index when source-backed | Score confidence, source trail consistency, Share depth, Capture, profile completeness | Very high: profile demand, paid brief, watchlist |
| `/officials/[id]/timeline` | Public official timeline | Active | Static/timeline events and Supabase timeline view fallback | Index | Embed/share depth, source event completeness | High: watchlist, source attachment, reports |
| `/officials/[id]/timeline/embed` | Embeddable timeline | Active | Timeline data | Noindex or embed-only | Confirm noindex, analytics minimal | Medium: publisher/embed signal |
| `/search` | Search page | Active | Predictive/search components | Index cautiously | Saved search, share search, trend analytics | High: search terms and intent graph |
| `/state-reps` | Texas/state representative lane | Active | Texas/state profile data | Index | Duplicates `/officials` unless canonical strategy is clear | High: Texas profile demand |
| `/school-boards` | School-board discovery | Active | School-board research data | Index | Member photos, unique visuals, source coverage, Capture | High: local education demand |
| `/school-boards/[districtSlug]` | School-board district dossier | Active | School-board district data | Index | Unique OG, source trail, watch/follow, correction queue | High: school-board source packs |
| `/school-boards/[districtSlug]/[candidateId]` | School-board member/candidate dossier | Active | School-board candidate data | Index if source-backed | Photos, source labels, Share snippets, correction history | High: local official brief |
| `/elections` | All elections hub | Active | Race links/static content | Index | County/district routing, unique cards, analytics | High: race-pack funnel |
| `/elections/texas` | Texas election hub | Active | `TEXAS_ELECTION_RACES` | Index | Unique visuals per race, filters, race watch CTA analytics | Very high: Texas race funnel |
| `/elections/texas/[raceSlug]` | Texas race page | Active | `TEXAS_ELECTION_RACES`, official IDs, source links | Index | Candidate depth, filings, finance, unique OG, county/district variants | Very high: race source pack |
| `/elections/texas/contribute` | Texas election source packet/contribution page | Active | race data, Texas contribution form, optional Supabase table | Index | Public setup-copy cleanup, thank-you IDs, unified queue | High: source leads and accounts |
| `/votes` | Vote/bill index | Active | `src/data/votes` | Index | Full vote import, filters, source links, vote reaction capture | High: issue/vote intent |
| `/votes/[billId]` | Bill/vote detail page | Active | bill JSON | Index | Official roll-call source links, reaction analytics, share snippets | High: vote-level feedback |
| `/funding` | Funding index | Active | funding files | Index | Coverage too small, source freshness, donor filters | High: money-trail services |
| `/funding/[officialId]` | Funding detail | Active for officials with funding file | Funding JSON | Index only when data exists | Source links, FEC/TEC provenance, donor context warnings | High: funding data products |
| `/red-flags` | Red-flag index | Active | red-flag data | Index cautiously | Enforced labels, source URLs, reviewer status | High but high-risk |
| `/issues` | Issue categories | Active | issue JSON | Index | Issue-specific source capture and internal linking | Medium-high |
| `/issues/[id]` | Issue detail | Active | issue data, related records | Index | Unique OG, source trails, follow issue CTA | High: interest graph |
| `/scorecards` | Scorecard index | Active | issue categories/scores | Index | Methodology clarity, score confidence labels | High-risk/high-signal |
| `/scorecards/[category]` | Scorecard category detail | Active | issue category and profile data | Index | Source mapping depth, share cards | High |
| `/news` | Story archive | Active | news JSON | Index | News sitemap, unique images, quality labels | High: media funnel |
| `/news/[id]` | Story detail | Active | news JSON | Index if source-backed | Article JSON-LD, unique OG, source labels | High: share/conversion |
| `/blog` | Blog landing | Active | news/story data | Index | Same content relationship with `/news`, unique visuals | Medium-high |
| `/daily-wire` | Daily Watch/Wire | Active | daily-wire Supabase/static sources | Index cautiously | Quarantine labels, admin approval, noisy item filtering | High but high-risk |
| `/feed` | Social feed | Active | social/news feed data | Index cautiously | Source labels, fresh data, share analytics | Medium |
| `/media` | Media/authority figures index | Active | media-watch data | Index | Source labels, profile images, correction flow | Medium |
| `/media/[slug]` | Media profile | Active | media profile data | Index cautiously | Source trail, public-question labels | Medium |
| `/attorneys` | Attorney watch index | Active | attorney data | Index cautiously | Risk labels, source trail, legal-safety copy | Medium |
| `/attorneys/[slug]` | Attorney profile | Active | attorney profile data | Index cautiously | Source trail, correction history, risk wording review | Medium |
| `/authority-watch` | Authority-watch hub | Active | public authority/watch data | Index | Stronger segmentation and source labels | Medium |
| `/public-safety` | Public safety watch index | Active | public-safety data | Index cautiously | Source labels, safety review, no private info | Medium |
| `/public-safety/[slug]` | Public safety profile | Active | public-safety data | Index cautiously | Risk review, source labels, correction flow | Medium |
| `/east-texas-predator-watch` | Predator Watch index | Active | predator-watch Supabase/static data | Index cautiously | Legal/safety review, source handling | Medium but high-risk |
| `/east-texas-predator-watch/[slug]` | Predator Watch detail | Active | predator-watch profile data | Index cautiously | Strong evidence labels, privacy review | Medium but high-risk |
| `/services` | Paid/free service package index | Active | `REPWATCHR_SERVICES` | Index | Checkout/fallback form proof, analytics, service request table | Very high |
| `/services/[slug]` | Service detail/package page | Active | `REPWATCHR_SERVICES`, request packet builder | Index | Payment not fully wired, fulfillment workflow, FAQ/SEO depth | Very high |
| `/data-reports` | Data products/licensing interest | Active | stats, interest form/API | Index | Privacy/terms review, sample reports, attribution | Very high |
| `/profiles/claim` | Claim official/profile page | Active | profile claim form/Supabase | Index cautiously | Payment/status clarity, review policy | High |
| `/contributors` | Contributor public index | Active | contributor Supabase data/fallback | Index | Production leaderboard verification, abuse controls | Medium |
| `/contributors/[handle]` | Public contributor profile | Active | contributor profile data | Index when profile exists | Privacy controls, moderation, source accuracy | Medium |
| `/growth-engine` | Growth/data flywheel page | Active | growth intake components | Index | Public copy safety, funnel analytics | High |
| `/faretta-ai` | Faretta AI helper page | Active | AI fallback/API | Index cautiously | Public setup-copy cleanup, source-gap guardrails | Medium |
| `/gideon` | Gideon helper page | Active | AI fallback/API | Index cautiously | Scope clarity, legal-advice guardrails | Medium |
| `/authors` | Author/source mission tools | Active | author mission builder | Index | Capture persistence, contributor linkage | Medium |
| `/feedback` | Source/correction page | Active | `ReportButton` packet/Supabase reports | Index | Dedicated queue, submission ID, thank-you page | High |
| `/submit-source` | Submit Source alias | Active but re-exports feedback | Index | Dedicated source-submission workflow | High |
| `/methodology` | Scoring/source methodology | Active | static methodology copy | Index | Link every score back to this, JSON-LD | High trust |
| `/privacy` | Privacy policy | Active | static legal copy | Index | Update for visitor intelligence and data products | High trust |
| `/terms` | Terms | Active | static legal copy | Index | Update for services/data products/contributors | High trust |
| `/rss.xml` | RSS feed | Active route | Index/feed | News/story data | News-only filtering and feed metadata | Medium |
| `/buildout` | Internal/buildout page | Active | buildout data | Noindex | Keep hidden from sitemap; verify no public nav unless intended | Internal |
| `/uap` | UAP topic page | Active noindex | static/topic data | Noindex | Confirm intentional hidden/test status | Low |

## Auth And Member Routes

| Route | Purpose | Current status | Data used | Indexing | Gaps | Monetization signal |
| --- | --- | --- | --- | --- | --- | --- |
| `/login` | Login alias/page | Active | Supabase auth | Noindex needed | Route-level noindex not confirmed | High: account funnel |
| `/auth/login` | Auth login | Active | Supabase browser client | Noindex needed | Public error copy, analytics privacy | High |
| `/auth/signup` | Signup | Active | Supabase browser client, member profile upsert | Noindex needed | Signup event consistency, redirect verification | High |
| `/auth/verify` | Verification/county flow | Active | Supabase profile verification | Noindex needed | ID/privacy policy, verification trust levels | Very high |
| `/auth/callback` | OAuth/session exchange route | Active route handler | Supabase server client | Noindex/API-like | Public setup error should be generic | High |
| `/create-account` | Account creation page | Active | member create API/auth | Noindex needed | Route consolidation with signup | High |
| `/dashboard` | Member dashboard | Active | Supabase citizen votes/grades and modules | Noindex needed | Route-level noindex, data persistence coverage | Very high |
| `/dashboard/claims` | Claimed profiles | Active | Supabase profile claims | Noindex needed | Error/loading states, fulfillment workflow | High |
| `/dashboard/official-profile/[claimId]` | Claimed profile editor | Active | Supabase claims/content/media/subscriptions | Noindex needed | Payment state, moderation status, audit log | High |
| `/dashboard/settings` | Member settings | Active | Supabase/member profile | Noindex needed | Digest/consent/privacy settings | High |
| `/dashboard/watchlists` | Member watchlists | Active | watchlist APIs/Supabase | Noindex needed | Alert delivery verification | High |

## Admin Routes

| Route | Purpose | Current status | Data used | Indexing | Gaps | Monetization signal |
| --- | --- | --- | --- | --- | --- | --- |
| `/admin/claims` | Claim review | Active | Supabase profile claims/content/media | Noindex | Role-check verification, audit log | Revenue/admin |
| `/admin/content-review` | Review queue | Active | claims/media/Texas sources | Noindex | Unified queue actions, source attach workflow | Revenue/admin |
| `/admin/control-center` | Admin control center | Active | admin API, system counts | Noindex | Health action buttons, import reruns | Admin |
| `/admin/superadmin` | Operator office | Active | many Supabase admin tables | Noindex | Audit logs and permission hardening | Admin |
| `/admin/superadmin/preview` | Preview mode | Active | preview/admin data | Noindex | Confirm not linked publicly | Admin |
| `/admin/behavioral-analytics` | Analytics dashboard | Active | behavioral analytics views | Noindex | Production view verification, retention cohorts | Revenue/admin |
| `/admin/future-revenue` | Hidden future revenue admin | Active/dormant | future revenue SQL/views | Noindex | Keep hidden until legal/business approval | Future revenue |
| `/admin/monetization-readiness` | Monetization readiness admin | Active/dormant | readiness checks | Noindex | Production validation | Revenue/admin |

## API Routes

| Route | Purpose | Current status | Data used | Access/indexing | Gaps |
| --- | --- | --- | --- | --- | --- |
| `/api/analytics/page-view` | Page-view ingestion | Active | page view table/Supabase | API, noindex | Verify RLS/service handling and retention |
| `/api/analytics/visitor` | Visitor intelligence ingestion | Active | visitor tables | API, noindex | Privacy policy and event schema |
| `/api/analytics/visitor/merge` | Merge anonymous visitor to user | Active | visitor/user tables | API, noindex | Signup flow verification |
| `/api/personalization/interest-profile` | Interest graph/profile | Active | visitor interest scores | API, noindex | Consent and personalization surfaces |
| `/api/search/predictive` | Predictive search suggestions | Active | static data/search indexes | API, noindex | Saved/trending search analytics |
| `/api/search/save` | Save search | Active | Supabase search tables | API, noindex | Auth and user ownership verification |
| `/api/search/track` | Search tracking | Active | analytics/search tables | API, noindex | Event taxonomy |
| `/api/member-create-account` | Signup helper | Active | Supabase auth/member profile | API, noindex | Duplicate with auth/signup review |
| `/api/member-login` | Login helper | Active | Supabase auth | API, noindex | Consolidation/error handling |
| `/api/member/watchlists` | Member watchlists CRUD | Active | member watchlist tables | Auth API | Alert workflow verification |
| `/api/member/watchlists/items` | Watchlist items CRUD | Active | member watchlist item tables | Auth API | Validation and item type schema |
| `/api/member/contributions` | Contributor events | Active | contributor tables | Auth API | Moderation/XP abuse controls |
| `/api/member/contributor-profile` | Contributor profile CRUD | Active | contributor profile tables | Auth API | Public/private field boundaries |
| `/api/admin/control-center` | Admin status/checks | Active | admin Supabase views/tables | Admin API | Production table existence checks |
| `/api/admin/profile-completion` | Profile completion admin data | Active | profile-completion lib/Supabase | Admin API | Import run/action controls |
| `/api/admin/behavioral-analytics` | Admin analytics | Active | behavioral views | Admin API | View deployment and data freshness |
| `/api/admin/future-revenue` | Future revenue admin data | Active/dormant | future revenue tables/views | Admin API | Hidden flags, legal approval |
| `/api/admin/monetization-readiness` | Readiness checks | Active/dormant | readiness lib/Supabase | Admin API | Confirm all checks point at production |
| `/api/officials/[id]/timeline` | Timeline events API | Active | timeline data | API, noindex | Embed/cache policy |
| `/api/profile-overlays/[type]/[id]` | Profile overlay data | Active | profile overlays/Supabase | API, noindex | Missing source/status handling |
| `/api/dashboard/coverage` | Dashboard coverage data | Active | data stats | API, noindex | Auth policy verification |
| `/api/data-product-interest` | Data/report buyer interest | Active | data product interest table | Public API | Spam control and attribution |
| `/api/growth-question-intake` | Growth question intake | Active | growth tables | Public/API | Admin review and spam control |
| `/api/faretta/chat` | Faretta chat | Active | AI/fallback | API | Guardrails and source-gap output |
| `/api/faretta/collect` | Faretta collection | Active | Faretta tables | API | Data retention/privacy |
| `/api/faretta/intake` | Faretta intake | Active | accountability case tables | Secret/API | Secret handling and public error copy |
| `/api/gideon/chat` | Gideon chat | Active | AI/fallback | API | Legal-advice guardrails |
| `/api/gideon/collect` | Gideon collection | Active | Gideon interaction tables | API | Retention/privacy |
| `/api/predator-watch/report` | Public safety report | Active | predator-watch tables | Public/API | High-risk moderation and privacy |
| `/api/health/integrations` | Integration health | Active | Supabase admin checks | API/admin-like | Restrict or avoid exposing details publicly |
| `/api/cron/daily-updates` | Daily update cron | Active | profile/import update libs | Cron/API | Cron auth and import health logs |
| `/api/cron/hourly-social-posts` | Social posting cron | Active | social autopost tables/X | Cron/API | Keep disabled until accounts/approval verified |
| `/api/auth/x/start` | X OAuth start | Active | X env/cookies | API | Generic public errors |
| `/api/auth/x/callback` | X OAuth callback | Active | X token + Supabase social token table | API | Generic public errors and token audit |
| `/api/stripe/create-checkout-session` | Profile-claim Stripe checkout | Active but narrow | Stripe API, subscriptions table | Auth API | Not wired for public packages; error copy |
| `/api/stripe/webhook` | Stripe webhook | Active but narrow | subscriptions table | Stripe webhook | Missing refunds/payment failed/package orders |

## SEO Routes

| Route/file | Purpose | Status | Gaps |
| --- | --- | --- | --- |
| `src/app/sitemap.ts` -> `/sitemap.xml` | Single sitemap route | Active | Needs sitemap index and split type-specific sitemaps |
| `src/app/robots.ts` -> `/robots.txt` | Robots route | Active | Add sitemap index when built; route-level noindex still needed |
| `src/app/rss.xml/route.ts` -> `/rss.xml` | RSS feed | Active | Needs news-only discipline and feed metadata audit |
| OG image routes | Dynamic social previews | Missing | Build homepage/profile/race/story/source/methodology/service OG routes |

## Data Source Map

| Data family | Location | Public/admin use | Status | Action |
| --- | --- | --- | --- | --- |
| Official profiles | `src/data/officials/**/*.json` | Public profiles/search/sitemap | Large but uneven | Add import health, duplicate checks, source audit |
| Vote records | `src/data/vote-records/*.json` | Profiles/vote record | Partial mapping | Add source URLs, categories, score rules |
| Bills/votes | `src/data/votes/*.json` | `/votes` and vote pages | Small example set | Import full House/Senate/Texas roll calls |
| Scorecards | `src/data/scores/*.json` | profiles/scorecards | Very limited | Do not overclaim; expand with methodology |
| Funding | `src/data/funding/*.json` | funding pages/profiles | Very limited | Add FEC/TEC imports and provenance |
| Red flags | `src/data/red-flags/*.json` | red flags/profile overlays | Limited/high-risk | Require labels/source/reviewer status |
| News/stories | `src/data/news/*.json` | news/blog/RSS | Active small set | Add images, source labels, news sitemap |
| Issues | `src/data/issues/categories.json` | issues/scorecards/search | Active | Tie to votes, funding, watchlists |
| Texas races | `src/data/texas-election-races.ts` | elections/race pages/sitemap | Active | Add county/district pages and candidate data |
| Services | `src/data/repwatchr-services.ts` | services pages/sitemap | Active | Add service request persistence and checkout later |
| Daily wire sources | `src/data/daily-news-watch-sources.ts`, Supabase clips | daily wire/social | Partial | Quarantine/filter/admin approval |
| Visitor analytics | Supabase migrations + tracker | admin/personalization | Partial | Verify production tables/views |
| Future revenue | `src/data/future-revenue.ts`, `supabase-future-revenue.sql` | hidden admin | Dormant | Keep hidden until approved |

## Broken Or Missing Routes

These are not runtime errors; they are product gaps relative to prior product direction.

- `/free-packet` is not present as a dedicated route. Free packet currently routes through `/elections/texas/contribute` and service slug `free-source-packet`.
- `/elections/texas/[county]` and `/elections/texas/[district]` are not separate routes. Current dynamic route is race slug only.
- `/investors` or `/partner` is not present.
- Dedicated checkout success/cancel pages for paid services are not present.
- Dedicated source submission thank-you page with submission ID is not present.
- Dynamic OG image routes are not present.
- Sitemap index and split sitemap routes are not present.

## Indexing Rules Needed

- Index: public source-backed profiles, official/race/story/issue/vote/funding/school-board pages with enough data.
- Noindex: admin, dashboard, auth, login/create-account, API, cron, buildout/dev, embed-only pages unless intentionally shareable.
- Conditional index: red flags, public safety, attorney/media profiles, daily wire, predator watch. These need stronger source and review gates before broad indexing.
- Avoid indexing: duplicate filtered search URLs, infinite filters, packet temporary URLs, auth callbacks, checkout sessions, internal admin reports.

## Next Build Order

1. Source submission queue normalization.
2. Profile completeness/data health dashboard.
3. Dynamic OG image system and unique thumbnails.
4. Route-level metadata/noindex cleanup.
5. Event taxonomy and attribution capture.
6. Texas/Federal vote import health and scoring methodology.
7. Funding import pipeline and provenance.
8. Admin review/audit logs.
9. Service request/fulfillment workflow.
10. Payments only after the source/fulfillment/admin path is production-verified.
