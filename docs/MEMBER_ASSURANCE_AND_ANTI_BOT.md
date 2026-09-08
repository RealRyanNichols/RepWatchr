# Member assurance and community participation

Status: identity/residence verification and verification pricing remain unlaunched. The Marion County community pulse is a separate signed-in-account feature. The hardening migration was applied to the confirmed production database on September 8, 2026 and checked read-only at 03:54 UTC. Application deployment is tracked separately. This document distinguishes the implemented restrictions from the remaining design work.

## Current production audit

Read-only inspection of the database whose public host matches Vercel production found one auth account and one legacy `profiles.verified = true` row, with zero profile claims, comments, or race pulse responses. No personal values were retrieved for this baseline. The old verified flag was client-writable and cannot substantiate identity or residence.

The old policies also allowed member-supplied approved claims and comment badges. The shared `is_repw_admin()` helper included researchers/reviewers, so those roles could acquire administrative powers. Operator invites had the same researcher/reviewer escalation path, granted roles before email confirmation, and remained reusable. These are database authorization failures; hiding controls in the browser does not fix them.

Production has no Stripe secret or Stripe webhook secret configured. No payment, identity session, paid provider, or district-voting feature is activated by this release.

## Applied database hardening

`supabase/migrations/20260908_member_trust_hardening.sql` was reviewed, passed isolated Postgres tests twice and applied successfully. Post-application checks confirmed the policies, grants, three changed/new triggers and strict admin helper. Aggregate counts remained one existing account, one preserved legacy profile, zero new assurance records, zero claims, zero comments and zero race responses. Its SHA256 is `21d566f6a0a42bc4c0534b4ab76e20055a8d5e569d38c6892511a5210a1cfb7e`. It:

- Adds server-managed `member_assurance`, with separate fee, person and residence states and expiry dates. Members can read only their own state and cannot write it. No old verified flag is promoted.
- Preserves old profiles and responses while freezing client writes to legacy verified flags and the three held district-voting tables. An app feature flag cannot bypass the database restriction.
- Restricts the admin helper to the actual admin role. Explicit admin-only RLS and column grants preserve the existing claim/content/media review workflow; members cannot self-approve and admins cannot review their own submissions.
- Restricts operator invitation management to admins, requires confirmed email, consumes each invite once and removes automatic residence verification from the bootstrap. Existing operator roles remain untouched.
- Requires pending claims and binds claimant drafts/media to their exact approved claim, profile and subscription. Payment alone never creates an approved claim.
- Assigns comment badges, county, rank and moderation state in a trusted database trigger. Historical untrusted badges are not certified. Public reads exclude removed comments. New account comments are serialized for a five-per-minute limit; persistent abuse controls remain future work.
- Checks a race pulse's open window and active option inside the write transaction, locking those rows against a simultaneous close/deactivation.
- Removes unnecessary client table privileges, including TRUNCATE on the scoped trust/content tables.

The application reads only new assurance records for verified badges. Missing tables, query failures, incomplete records and expired checks fail closed. Legacy `verified = true`, payment and self-reported locations never produce verified residence. Comment labels do not certify historical client-supplied official badges.

Validation: `scripts/test-member-assurance.mjs` executes the TypeScript assurance and aggregation functions. `scripts/test-member-trust-migration.mjs` creates a fresh in-memory PGlite database, loads the baseline schemas, applies the new migration twice, then exercises 33 rejection cases plus authenticated/anonymous/service-role access, valid admin review, confirmed-email single-use invites, forbidden approvals, isolated private records, and poll windows. The harness never accepts a database URL. Set `REPWATCHR_PGLITE_PATH` to a local PGlite `dist/index.js` to run it without installing a production dependency.

## Honest labels

| Label | Evidence | Limits |
| --- | --- | --- |
| Confirmed account | Control of an email/account | No uniqueness, identity or residence proof |
| Paid account, if offered | Server-confirmed fee payment | No identity or residence proof; no extra vote weight |
| Verified person | Accepted identity proofing and liveness, or equivalent manual review | Does not establish current residence, citizenship or voter registration |
| Verified resident | Current person check plus separately confirmed residence, dated jurisdiction mapping and expiry | Does not establish voter registration |
| Registered voter | A separately authorized state/county match as of a stated date | Not part of this pilot; never inferred from payment or identity |

No service is described as unhackable, and RepWatchr community feedback is not a government election system. Identity checks reduce specific abuse risks; they do not guarantee one unique natural person under every failure mode.

## What a $0.99 fee buys

Pricing is a product decision still awaiting confirmation. Free signed-in participation remains the default. If a fee is offered, label it an account/support payment and keep any waiver path equivalent in access and weight.

Stripe's published U.S. domestic-card rate is 2.9% plus $0.30, and document/selfie Identity checks are $1.50 per completed verification. A $0.99 card charge therefore yields about $0.66 before identity costs: roughly $0.84 short of the Identity check alone, before residence confirmation and manual review. That price requires a subsidy rather than a claim that $0.99 funds full verification. [Stripe pricing](https://stripe.com/pricing)

Ordinary card CVC and billing-address checks compare payment details with the issuer. A billing match or entered cardholder name is not proof that the account holder is the named resident. Stripe's separate address verification check is invite-only and uses name/date-of-birth/address data; it still needs an explicit current-residence policy. [Card verification](https://docs.stripe.com/disputes/prevention/verification), [Identity address checks](https://docs.stripe.com/identity/verification-checks?type=address)

## Proposed identity and residence workflow

Use provider-hosted document/selfie capture in test mode first, explicit consent before collection, and a camera-free manual route with equivalent privileges and an appeal path. Provider references belong in a private table unavailable to the browser. A document/selfie success alone is not a declaration of NIST IAL2 compliance. [Stripe document checks](https://docs.stripe.com/identity/verification-checks?type=document), [Stripe selfie checks](https://docs.stripe.com/identity/verification-checks?type=selfie), [NIST identity proofing requirements](https://pages.nist.gov/800-63-4/sp800-63a/ial-general/)

A mailed random, short-lived confirmation code demonstrates access to an address, not legal residence by itself. Define acceptable residence evidence and exceptions before assigning the resident label. Keep verification method, decision date, expiry, coarse jurisdiction and boundary version. Retain no raw ID number, ID image, selfie, birth date or plaintext street address in RepWatchr.

Geocoding maps an address to boundaries; it does not prove a person lives there. Use an explicit Census benchmark/vintage and the authoritative local boundary for offices Census cannot resolve. Current-office and upcoming-election boundaries can differ. [Census geocoder](https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html), [2026 TIGER boundaries](https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-geodatabase-file.2026.html)

Shared cards, households, shelters, campuses, networks and devices must not cause automatic rejection. Name/birth-date similarity is a review signal, not a unique-person key. Reviewers must not see political comments, candidate responses, follows or ideology when deciding identity/residence. Publish consent, retention, accessibility and appeal details before enabling the provider.

Request provider evidence redaction after the stated review window and track completion. Stripe says redaction can take up to four days; a request is not completed deletion. Keep an evidence-free decision audit and retention schedule, and test failed redactions and appeals. [Stripe redaction](https://docs.stripe.com/api/identity/verification_sessions/redact)

## Community pulse and future district feedback

The live Marion County pulse accepts one current response per completed, signed-in account. Display name and home location are self-reported. BotID screens the endpoint, and only the server service role accesses poll tables. No IP, identity evidence, email or geography is stored with a response. This is an account-level rule, not proven person-level uniqueness.

The release withholds candidate counts, percentages and candidate timestamps at the API until `minimum_sample` is met (currently 25), including after a member responds. The UI shows total responses and explains the threshold. This is a product/privacy threshold, not statistical validity. After release, live cumulative totals can still permit inference from changes; do not publish granular district or demographic breakdowns without a separate disclosure review.

Label the pulse self-selected and non-scientific. Publish the exact question/options, sponsor, collection dates, recruitment, eligibility, fee/waiver rules, exclusions and sample size. Do not claim a representative electorate or a conventional margin of sampling error for an opt-in sample. Never fold pulse popularity into an official's evidence grade. [AAPOR transparency](https://aapor.org/standards-and-ethics/transparency-initiative/), [AAPOR best practices](https://aapor.org/standards-and-ethics/best-practices/)

Before activating district feedback, build a server-only submission transaction that verifies current person/residence eligibility, boundary version, poll window and active option. Use an internal person key and per-poll nullifier, unique constraints, an idempotency key plus payload hash, and separate private identity records from response storage. Do not accept geography, badges, prices, approval or vote weight from browser input.

Tamper evidence requires more than a database row or hash: add append-only change events, reconciliation against the current response table, and independently retained signed daily checkpoints. Privileged operators can still compromise systems and signing keys. That ledger/checkpoint system is not implemented by this hardening migration.

Before enabling payment webhooks, implement transactional processed-event claims, order/session uniqueness, verified event/session amounts and currencies, paid-status checks and idempotent fulfillment. Stripe retries events and does not guarantee ordering. The existing event logging is not a complete replay guard. [Stripe webhooks](https://docs.stripe.com/webhooks), [Idempotent requests](https://docs.stripe.com/api/idempotent_requests)
