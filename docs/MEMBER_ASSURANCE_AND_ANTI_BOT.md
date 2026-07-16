# Member Assurance and Anti-Bot Plan

Status: preview foundation; community voting remains disabled

## Trust labels

| Level | Proves | Does not prove |
| --- | --- | --- |
| Confirmed account | Control of an email/account | Human uniqueness, residence, or voter eligibility |
| Verified person | A live person completed identity proofing or an equivalent manual review | Current residence, citizenship, or voter registration |
| Verified resident | Current residence was independently confirmed and mapped to a jurisdiction | Citizenship or voter registration |
| Registered voter | An authorized state/county voter record matched as of a stated date | How the person voted or future eligibility |

RepWatchr must not call a verified person or resident a “verified voter.” Voter-file access and permitted uses vary by state and require a separate legal/data program.

## Recommended pilot stack

- Supabase confirmed email/account.
- Cloudflare Turnstile on signup and later on recovery, verification-session creation, first participation on a new device, and suspicious bursts.
- Stripe Identity in test mode for government document plus matching selfie/liveness.
- A separate postal residence code and server-side jurisdiction mapper.
- A camera-free/manual route with equivalent privileges, accessibility help, reason codes, appeal, and a second reviewer for denial.

Stripe is the first pilot choice because it is pay-as-you-go and fits the existing server-side integration. Persona can be reconsidered when proof-of-address workflows and case orchestration justify its larger commitment.

## Data boundary

The browser can never write trusted person status, residence status, county, district, provider outcome, duplicate decision, or reviewer outcome.

The private migration `20260715234500_member_identity_assurance.sql` stores:

- provider/session references and status;
- separate assurance levels and dates;
- keyed HMAC duplicate controls;
- coarse jurisdiction, verification method, expiry, and address-deletion time;
- manual-review and appeal state;
- non-sensitive audit events.

It must never store raw document numbers, dates of birth, names from the identity document, ID/selfie images, plaintext street addresses, or unkeyed document hashes.

## Fairness and abuse rules

- One person gets equal weight regardless of provider, manual method, party, ideology, device, or wealth.
- Shared households, campuses, shelters, and networks are not blocked merely because an address, device, or IP is shared.
- Name/date-of-birth similarity triggers review, never automatic rejection.
- Limit automated identity submissions to three in 30 days, then offer manual review.
- Reviewers cannot see the applicant's political comments, follows, candidate ratings, or party information.
- No verification or fraud score may use political activity.
- Votes should use a per-poll server nullifier and coarse jurisdiction; public/member-facing vote records must not join back to identity-review evidence.
- Publish geographic aggregates only above a privacy threshold.

## Retention targets

| Data | Target |
| --- | --- |
| ID/selfie images at RepWatchr | Never store |
| Successful provider evidence | Request redaction within 24–72 hours |
| Failed/appealed evidence | Until appeal closes, no more than 30 days |
| Manual evidence | Delete within 24 hours of final decision, no more than 30 days |
| Plaintext street address | Never store in RepWatchr; use an opaque postal-delivery reference |
| Provider reference/outcome | Active account plus 30 days |
| Duplicate HMAC | Active account plus 30 days; longer only for confirmed abuse |
| Pseudonymized security logs | No more than 30 days |
| Evidence-free verification audit events | 24 months |

Before production, publish the biometric notice, consent, retention/destruction policy, accessibility route, and appeal process; complete legal review; configure provider redaction; and pass webhook replay, shared-household, duplicate, accessibility, RLS, and deletion tests.
