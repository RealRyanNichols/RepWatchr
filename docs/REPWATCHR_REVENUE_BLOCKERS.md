# RepWatchr Revenue Blockers

Generated: 2026-07-01

RepWatchr should monetize as a source-backed civic intelligence and political data company, not as an ad-heavy outrage site. The blocker is not lack of ideas. The blocker is production-grade capture, trust, fulfillment, consent, and proof.

## Practical Recommendation

Do not enable broad monetization yet. Keep future revenue infrastructure hidden while building:

1. Reliable account and source submission capture.
2. Verified profile/source/funding/vote data quality.
3. Admin review and fulfillment workflow.
4. Attribution from visitor to packet to account to paid request.
5. Legal/privacy/terms language for political data and services.

## Existing Revenue Assets

- `/services` public package index.
- `/services/[slug]` package pages for current service definitions.
- Service config in `src/data/repwatchr-services.ts`:
  - Free Source Packet
  - Quick Record Check
  - Local Race Source Pack
  - Official Record Brief
  - Election Watch Desk
- `/data-reports` page for aggregate political data/report interest.
- `/api/data-product-interest` endpoint.
- Profile claim flow and claim dashboard.
- Stripe checkout endpoint for approved profile claims.
- Stripe webhook endpoint for checkout completed and subscription create/update/delete.
- Hidden future revenue model in `src/data/future-revenue.ts` and `supabase-future-revenue.sql`.
- Admin future-revenue and monetization-readiness routes.

## Hard Blockers Before Selling Paid Services

| Blocker | Why it blocks revenue | Required fix |
| --- | --- | --- |
| Service checkout is not fully wired | Package cards cannot reliably become paid orders | Server-side service checkout sessions, service request records, success/cancel pages |
| No unified `service_requests` lifecycle | Paid work needs fulfillment status and internal notes | Table plus admin revenue desk |
| No normalized `orders` and `customers` flow for packages | Stripe events need durable records | Order/customer/subscription tables and webhook writes |
| Webhook coverage is incomplete for paid services | Refunds, payment failures, and package-specific metadata are not fully handled | Expand webhook event handling and tests |
| No production fulfillment dashboard | Ryan/operator needs queue, status, due date, deliverable links | Admin revenue desk and service request workflow |
| Source queue is not unified | Paid research depends on submitted sources, corrections, and attachments | Normalize source submission queue first |
| Profile data completeness is uneven | Paid reports need trustworthy data | Completion dashboard, source audit, import health |
| Payment fallback language and UX not verified | Missing env should not expose setup issues | Public request forms and internal-only setup diagnostics |
| No clear refund/support terms | Paid services need expectations and dispute path | Terms/service policy update |
| No legal/privacy review for political data | Political feedback and data licensing are sensitive | Consent, retention, export, and de-identification review |

## Hard Blockers Before Selling Data Products

| Blocker | Why it blocks data revenue | Required fix |
| --- | --- | --- |
| No verified consent model for political feedback | Aggregate data needs lawful collection and clear consent | Consent fields, purpose labels, privacy policy update |
| No constituency bucket enforcement | Out-of-state or anonymous users can distort local data | verified/in-district/in-state/out-of-district/unknown segmentation |
| No duplicate-risk scoring | One person could create many accounts | duplicate risk table, email/device signals, admin review |
| No durable identity verification policy | ID verification can create privacy risk | provider strategy, storage limits, no public ID images |
| Visitor analytics not linked to consent boundaries | Behavioral data can become sensitive if overused | privacy-safe event schema and retention limits |
| No data export governance | Buyers need contracts, limits, logs, and revocation | export jobs, licenses, audit log, access controls |
| No proof-of-demand dashboard | Need to know what people actually search/watch/request | interest graph, package interest, search, source, and watchlist funnels |
| No buyer segmentation | Campaigns, reporters, attorneys, researchers, local groups need different products | segment field on interest forms and dashboard |

## Revenue Lane Blockers

### 1. Quick Record Check - $49

Current asset: service definition and service page.

Blockers:

- No service request table tied to the package.
- No checkout session for this specific package.
- No fallback request form persistence.
- No deadline/turnaround fulfillment queue.
- No deliverable upload/link field.
- No refund/payment-failed handling.

Minimum launch requirement:

- User submits target, source URL, summary, email, jurisdiction, deadline.
- Server creates service request.
- Stripe checkout creates order metadata.
- Webhook marks paid.
- Admin sees request and can mark in progress, delivered, refunded, closed.

### 2. Local Race Source Pack - $149

Current asset: race pages and service definition.

Blockers:

- Texas race data does not yet cover every county/district route.
- Candidate/filing/finance links are incomplete.
- No race-specific source queue attachment.
- No sample deliverable.
- No paid fulfillment workflow.

Minimum launch requirement:

- Race/source pack request form.
- Race page/source list export.
- Admin source attach flow.
- Deliverable outline and status lifecycle.

### 3. Official Record Brief - $299

Current asset: official profiles and source trails.

Blockers:

- Most profiles are incomplete.
- Vote/funding/red-flag/source depth is uneven.
- No official brief fulfillment template.
- No required source checklist.
- No source confidence report.

Minimum launch requirement:

- Official request intake.
- Profile completeness snapshot.
- Source gap list.
- Admin deliverable builder.
- Public-safe brief export.

### 4. Election Watch Desk - $750 Monthly

Current asset: daily wire, race pages, future revenue rails, watchlists.

Blockers:

- No subscription package checkout for this service.
- No recurring customer workspace.
- No monthly deliverable cadence tracking.
- No alert/digest infrastructure verified in production.
- No written boundaries for what the watch desk will and will not do.

Minimum launch requirement:

- Subscription checkout.
- Workspace/watch lane record.
- Weekly queue and monthly brief tracking.
- Cancellation/payment-failed status handling.

## Account And Membership Blockers

- Login/signup exists, but production verification is needed.
- Dashboard exists, but its modules are partly local/fallback and need persistence verification.
- Watchlists exist, but alert delivery is not fully proven.
- Contributor profiles exist, but reputation/XP abuse controls need admin review.
- Verification flow exists, but ID/privacy/constituency policy must be documented before it influences sellable data.

## Analytics And Attribution Blockers

RepWatchr cannot responsibly sell services/data until it can answer:

- Which pages create account signups?
- Which searches lead to profile opens?
- Which profiles get watched or shared?
- Which source packets become submissions?
- Which submissions become accepted sources?
- Which package CTAs get clicked?
- Which package requests become paid orders?
- Which issues/counties/races show real demand?
- Which visitors return after digest/watchlist/source activity?

Current telemetry exists, but every major CTA needs consistent event names and shared metadata.

## Design And Conversion Blockers

- Some package/service sections still feel like static cards instead of actionable offers.
- Race/story/profile thumbnails are often repeated or missing.
- CTA hierarchy varies route to route.
- Share components are not yet complete source-backed share cards.
- Empty states should convert to source submission, watchlist, free packet, or request review.
- Paid package pages need sample deliverables before purchase.

## Trust/Safety Revenue Blockers

Revenue cannot create a way to buy influence over public records.

Rules before monetization:

- Paid customers cannot remove public records.
- Paid customers cannot suppress correction history.
- Claimed officials cannot edit scores or red flags directly.
- Paid service output must distinguish confirmed record, public question, allegation, needs source, opinion, and correction requested.
- No private home addresses, minor children, threats, doxxing, harassment instructions, private personal data, or unsourced criminal accusations.
- Political data products should be aggregate and de-identified unless a user explicitly consents to public display.
- Public copy must not imply legal advice, private investigation, law enforcement work, guaranteed results, or guaranteed political outcomes.

## What Can Monetize First

Best first paid product after blockers:

1. Quick Record Check.
2. Local Race Source Pack.
3. Official Record Brief.
4. Election Watch Desk.

Best first data product after blockers:

1. Public data coverage report by county/race/profile.
2. Aggregate search/watch/source demand report.
3. Funding/source gap report.
4. Verified constituent sentiment only after verification and privacy policy are finished.

## Launch Gate

Do not turn on paid checkout until these are true:

- Supabase production tables exist and RLS is verified.
- Stripe test checkout and webhook pass.
- Admin can see and fulfill a request.
- Customer receives success/cancel/confirmation path.
- Refund/payment-failed/cancel states are handled.
- Privacy/terms/service policies are updated.
- No public setup-language leaks remain.
- Public pages make source limits clear.
