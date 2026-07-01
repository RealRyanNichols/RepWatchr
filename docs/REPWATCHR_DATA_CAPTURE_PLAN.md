# RepWatchr Data Capture Plan

Generated: 2026-07-01

Goal: capture the data RepWatchr needs before selling services, reports, subscriptions, exports, or political intelligence. The rule is simple: collect enough to understand demand and fulfill work, but do not collect or expose private sensitive data that RepWatchr does not need.

## Data Capture Principles

1. Public records first.
2. Consent where data may be used for product, analytics, digests, or aggregate reports.
3. Separate public, private, admin-only, and under-review data.
4. Do not sell raw private identity data, private addresses, minor-child data, raw ID images, raw private evidence, or doxxing material.
5. Keep political feedback aggregate and de-identified unless explicit public-display consent exists.
6. Preserve source URL, date, jurisdiction, submitter, reviewer, status, and audit history.
7. Every monetization workflow needs attribution: page, route, referrer, UTM, anonymous session, user ID when logged in, and package/source/profile context.

## Core Entities To Capture

| Entity | Why it matters | Public/private | Current status | Needed next |
| --- | --- | --- | --- | --- |
| Anonymous visitor | Measures demand before signup | Private/internal | Visitor tracker exists | Verify tables, merge to user, retention policy |
| User/member | Dashboard, watchlists, contributions | Private/internal with public profile option | Supabase auth exists | Verified account levels and consent |
| Official profile | Core public data product | Public with admin-only fields | Static JSON exists | Completeness, source audit, import health |
| Source submission | Drives record quality | Private until reviewed | Packet/report/Texas contribution flows | Unified queue and status history |
| Source attachment | Connects source to profile/vote/race/story | Public when approved | Partial | Required source URL/date/jurisdiction |
| Correction request | Trust and safety | Private until reviewed | ReportButton exists | Correction queue and public correction history |
| Watchlist item | Retention and demand | Private/user-specific | Watchlist APIs exist | Alerts/digests and interest scoring |
| Search term | Demand and personalization | Private/internal | Search APIs exist | Saved/popular/trending search governance |
| Share event | Distribution signal | Internal aggregate | ShareButtons and visitor tracker exist | Unified share event taxonomy |
| Profile vote/sentiment | Political data product | Aggregate, consent-bound | Profile score/vote components exist | Verified buckets, duplicate risk, privacy policy |
| Package interest | Revenue demand | Private/internal | data product interest exists | Service request table and CRM states |
| Paid order | Revenue | Private/admin | Profile claim Stripe exists | Package orders, status, webhook events |
| Admin review action | Safety/audit | Admin-only | Partial admin routes exist | Audit log with before/after values |
| Import run | Maintainability | Admin-only | Some run tables/migrations exist | Universal import_runs and errors |
| Broken link | Data quality | Admin-only until fixed | Health checks partial | Automated link checks and resolve state |

## Visitor Intelligence

Capture for anonymous visitors:

- anonymous visitor ID
- session ID
- entry page
- exit page
- referrer host
- UTM source, medium, campaign, term, content
- device/browser basics
- route/path
- search terms
- officials viewed
- topics/issues viewed
- counties/cities viewed
- races viewed
- time spent
- scroll depth
- page depth
- buttons clicked
- source clicks
- shares
- packet builds
- downloads
- watch/follow clicks
- package CTA clicks

When a visitor creates an account:

- Merge anonymous visitor history into the user profile.
- Keep a stable audit row showing merge time and source anonymous ID.
- Do not expose anonymous history publicly.
- Allow privacy controls and deletion/export policy where required.

## Interest Graph

Every click should increase weighted interest scores.

Suggested interests:

- Texas
- East Texas
- School Boards
- Property Taxes
- Water Rights
- Congress
- Sheriffs
- Judges
- Courts
- County Commissioners
- Campaign Finance
- Transparency
- Open Records
- Veterans
- Education
- Energy
- Immigration
- Infrastructure
- Election Integrity
- Public Safety
- Local Government
- Donors
- PACs
- Red Flags
- Vote Records

Signals:

- page view: low weight
- profile open: medium
- timeline/funding/vote open: medium-high
- source click: high
- share/copy: high
- watchlist add: very high
- packet build: very high
- paid package request: very high
- source submission accepted: very high

Uses:

- recommended stories
- recommended officials
- recommended races
- email/digest topics
- dashboard ordering
- watchlist suggestions
- internal demand reports
- aggregate data products after consent/legal review

## Source Submission Queue

All source forms should eventually write into one queue.

Required fields:

- submission ID
- submitter user ID when logged in
- submitter name
- submitter email
- target official/agency/board/race
- target type
- target internal ID when available
- jurisdiction
- county/city/state/district
- source URL
- source title/label
- source type
- source date
- claim/question summary
- what needs to be checked
- public/private flag
- status: new, needs_review, verified, rejected, attached_to_profile, needs_more_info
- reviewer ID
- review notes
- attachment records
- status history
- UTM/referrer/session/anonymous ID
- created/updated timestamps

Forms to wire:

- `/submit-source`
- `/feedback`
- profile-level report/correction buttons
- Texas election contribution page
- service request packet builder
- dashboard source packet builder
- free packet funnel when built
- red flag/source packet CTAs

After submission:

- Show thank-you page.
- Show submission ID.
- Show copyable source packet.
- Suggest next action.
- Offer share link back to RepWatchr.
- Prompt account creation.

## Profile Data Capture

For every official profile, capture:

- official ID/slug
- name
- office
- jurisdiction
- level
- district/county/city/state
- party when available
- source URLs
- official website
- contact links
- photo URL and photo source/credit
- term/election dates
- vote records
- scorecard data
- left/right score methodology and confidence
- constitutional/civic alignment methodology and confidence
- funding data
- donor breakdown
- red flags with source labels
- timeline events
- public questions
- correction history
- source count
- completeness score
- last updated
- import source/run ID

Do not publicly display:

- private home addresses
- private emails/phones unless official public contact
- minor children
- raw verification documents
- private evidence
- private admin notes

## Political Feedback Capture

Feedback questions should be structured and consent-bound.

Initial questions:

- Would you vote for this official again today?
- Did you vote for this official and do you like the job they are doing now?
- How much do you trust this official to represent your area?
- Which issue should RepWatchr watch most closely?
- Do you approve of this specific vote?
- Would you donate, volunteer, share, attend a meeting, or ask a public question?

Required fields:

- question ID
- target type and target ID
- user ID
- verified account level
- constituency bucket: constituent, in district, in county, in state, out of district, out of state, unknown
- self-reported past vote status, clearly labeled self-reported
- response
- issue tag
- optional source link
- public display consent
- aggregate data consent
- duplicate-risk score
- created/updated timestamps

Public display:

- Show aggregates only by default.
- Label sample size.
- Separate constituent from out-of-district/out-of-state.
- Do not imply official ballot history.

## Revenue Capture

Before live payments, capture package interest and fulfillment demand.

Tables/records needed:

- customers
- service_requests
- orders
- subscriptions
- payment_events
- refunds
- fulfillment_notes
- deliverables
- data_product_interests
- package_interest_events

Fields:

- package slug
- price at time of request
- billing mode
- customer email
- user ID when logged in
- target official/race/board/issue
- source URLs submitted
- requested turnaround
- UTM/referrer/session
- status: requested, checkout_started, paid, in_review, in_progress, delivered, canceled, refunded, failed
- Stripe customer/session/payment/subscription IDs
- admin owner
- internal notes
- deliverable URL or summary

## Analytics Event Dictionary

Minimum public events:

- `page_view`
- `profile_open`
- `official_search`
- `filter_used`
- `source_submit_started`
- `source_submit_completed`
- `correction_submit_started`
- `correction_submit_completed`
- `share_copy_clicked`
- `native_share_clicked`
- `social_share_clicked`
- `source_snippet_copied`
- `watchlist_add`
- `watchlist_remove`
- `signup_started`
- `signup_completed`
- `login`
- `free_packet_started`
- `free_packet_completed`
- `package_interest_clicked`
- `service_request_submitted`
- `checkout_started`
- `checkout_completed`
- `checkout_canceled`
- `article_open`
- `daily_wire_item_open`
- `public_records_request_created`
- `admin_review_completed`

Metadata for events:

- route
- canonical URL
- referrer
- UTM
- anonymous visitor ID
- session ID
- user ID when logged in
- target type
- target ID
- county/state/district
- issue tags
- package slug
- source count
- timestamp

## Admin-Only Data

Keep admin-only:

- reviewer notes
- internal risk labels
- admin audit log
- rejected submissions
- private submitter emails unless public consent
- identity verification details
- duplicate-risk details
- raw Stripe payloads where not needed publicly
- API keys, hashes, license data
- import errors
- broken-link queue

## Public Data

Safe public data when source-backed:

- official names/offices/jurisdictions
- official public contact links
- public records and source URLs
- public votes
- campaign finance summaries with source
- profile source count
- profile completeness label
- reviewed source submissions
- correction history summary
- red flags only when labeled and source-backed
- aggregate political feedback with sample size and constituency bucket

## Data Products Later

Do not sell raw visitor histories. Potential sellable products after consent/legal review:

- aggregate search/watch demand by county/race/issue
- profile completeness and source-gap reports
- funding/source trail summaries
- verified constituent aggregate sentiment
- vote reaction aggregate summaries
- race source maps
- public-record gap reports
- API/export access to source-backed public data

## Build Sequence

1. Normalize event dictionary.
2. Verify visitor intelligence tables and merge flow.
3. Build unified source submission queue.
4. Build admin source review queue.
5. Add profile completeness snapshots and import health.
6. Add package interest capture to every service CTA.
7. Add service request table and admin revenue queue.
8. Update privacy/terms for analytics and political data.
9. Add verified feedback buckets.
10. Add aggregate data product reporting only after consent and legal review.
