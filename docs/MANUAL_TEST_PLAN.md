# RepWatchr Manual Test Plan

Audit date: 2026-07-01

Use this plan after deploying to staging or production. Do not mark an item pass until it is tested in the browser and, where relevant, confirmed in Supabase/admin.

## Preflight

1. Confirm the Vercel project points to the intended branch.
2. Confirm these env groups are set where needed:
   - public site URL and Supabase anon URL/key
   - Supabase service role for server-only queues/admin dashboards
   - admin email allowlist
   - payments disabled unless intentionally launching
   - analytics IDs if used
3. Confirm migrations for analytics, source submissions, corrections, package interest, free packets, records requests, watchlists, and admin audit logs are applied.
4. Confirm admin account exists and is in the admin allowlist/role table.
5. Use a test user that is not an admin.

## Public Route Smoke Test

For each route below, test mobile and desktop:

| Route | Expected result |
|---|---|
| `/` | Homepage loads, no console errors, search/primary CTAs work, next-action rail visible. |
| `/search` | Search input accepts query, filters open, result cards link somewhere useful, no-results state offers source submission. |
| `/officials` | Officials page loads, cards link to profiles, filters/sort do not break. |
| `/officials/[known-id]` | Hero, record summary, source trail, score/methodology, votes, funding, correction, share, watch, and source CTAs are visible. |
| `/submit-source` | Form validates required fields, rejects unsafe text, submits source, shows ID/summary/next action. |
| `/sources/submit` | Same as `/submit-source` or redirects/canonicals cleanly. |
| `/free-packet` | Email/target/source flow creates packet, shows copy/download, account prompt, Quick Record Check upsell. |
| `/tools/source-packet-builder` | Builder generates copyable packet, save/export works or has clear disabled state. |
| `/tools/public-records-request` | Draft generator creates full/short/follow-up versions and saves when logged in. |
| `/packages/quick-record-check` | Package page loads, no payment shown if payments disabled, interest form submits. |
| `/packages/official-record-brief` | Same as above. |
| `/packages/local-race-source-pack` | Same as above. |
| `/packages/election-watch-desk` | Same as above. |
| `/privacy` | Privacy page loads, correction/privacy controls links work. |
| `/methodology` | Methodology loads and links from score/profile areas. |
| `/sitemap.xml` | Returns XML sitemap index with public sitemap links. |
| `/robots.txt` | Disallows admin/dashboard/auth/API and references sitemap. |
| `/does-not-exist-launch-test` | Branded 404 page appears with useful CTAs. |

## Private Route Test

| Route | Anonymous expected | Logged-in non-admin expected | Admin expected |
|---|---|---|---|
| `/dashboard` | Login prompt/redirect or safe empty state | Dashboard loads own data | Dashboard loads own data |
| `/dashboard/privacy` | Login prompt/redirect | Privacy controls visible | Privacy controls visible |
| `/admin` | Redirect/block | Redirect/block | Admin overview loads |
| `/admin/analytics` | Redirect/block | Redirect/block | Analytics dashboard loads |
| `/admin/sources` | Redirect/block | Redirect/block | Source queue loads |
| `/admin/monetization` | Redirect/block | Redirect/block | Monetization readiness loads |
| `/admin/seo` | Redirect/block | Redirect/block | SEO audit loads |

## Data Intake Tests

1. Submit a source with a public URL.
2. Confirm thank-you page shows:
   - submission ID
   - source packet summary
   - next suggested action
   - account prompt
3. Confirm admin source queue shows the submission.
4. Change status to `needs_review`, then `verified` or `rejected`.
5. Confirm status events/audit log are created.
6. Submit correction request from a profile/story page.
7. Confirm unsafe text rejection:
   - private address wording
   - minor child wording
   - threat/harassment wording
8. Submit free packet.
9. Submit package interest for each package page.
10. Submit privacy request from privacy controls.

## Analytics Tests

Use a URL with UTM parameters:

`/?utm_source=test&utm_medium=manual&utm_campaign=launch-readiness`

Verify events:

- `page_view`
- anonymous visitor/session creation
- `search_query_submitted`
- `profile_open`
- `source_submit_completed`
- `correction_completed`
- `free_packet_completed`
- `package_interest_submitted`
- `watchlist_add` or anonymous watch intent
- `feedback_vote_clicked`
- admin action event after status change

Confirm stored event rows contain:

- route
- anonymous ID or user ID
- referrer
- UTM fields
- non-sensitive metadata
- timestamp

## SEO And Sharing Tests

1. Fetch `/sitemap.xml`.
2. Fetch every linked sitemap:
   - `/sitemaps/static.xml`
   - `/sitemaps/profiles.xml`
   - `/sitemaps/officials.xml`
   - `/sitemaps/agencies.xml`
   - `/sitemaps/jurisdictions.xml`
   - `/sitemaps/races.xml`
   - `/sitemaps/school-boards.xml`
   - `/sitemaps/stories.xml`
   - `/sitemaps/sources.xml`
   - `/sitemaps/news.xml`
3. Confirm no admin/dashboard/auth/API/private URLs appear.
4. Inspect page source for:
   - title
   - description
   - canonical
   - OpenGraph image
   - Twitter card
   - robots directive
   - JSON-LD where applicable
5. Fetch OG images:
   - `/api/og?type=home`
   - `/api/og?type=official&id=[known-id]`
   - `/api/og?type=package&slug=quick-record-check`
6. Use X/Facebook/LinkedIn preview validators after production deploy.

## Mobile And Accessibility Tests

1. Test widths: 390, 768, 1440, 1920.
2. Confirm no horizontal scroll.
3. Confirm images keep aspect ratio.
4. Confirm mobile bottom action dock does not block form submit buttons.
5. Confirm all tap targets are at least roughly 44px high/wide.
6. Keyboard test:
   - Tab through header/search/forms/modals/footer.
   - Open command palette with Cmd/Ctrl + K.
   - Close modal/palette with Escape or close button.
7. Run Lighthouse or axe on homepage, profile, source form, dashboard, and admin.

## Monetization Readiness Tests

1. Confirm `ENABLE_PAYMENTS=false` unless intentionally launching checkout.
2. Confirm package pages never show broken Stripe/setup copy.
3. Confirm package interest form submits and appears in admin monetization.
4. Confirm demand events write to analytics.
5. If enabling payments later:
   - test Stripe checkout in test mode
   - verify webhook events
   - verify orders/subscriptions/service requests
   - verify refund/payment-failed events
