# RepWatchr Trust And Safety Policy

RepWatchr covers public power. That means every public page must be source-first, correction-friendly, and careful enough to survive a hostile read.

## Public Content Rules

RepWatchr public pages must not publish:

- Private home addresses.
- Minor children.
- Threats.
- Doxxing.
- Harassment instructions.
- Unsourced criminal accusations.
- Private medical information.
- Private family information.
- Personal financial information outside public campaign, procurement, court, or official records.
- Private personal contact information.
- Raw user-submitted allegations as verified fact.
- Claims beyond what the source supports.
- Fake urgency, fake public support, fake source counts, or fake metrics.

## Required Labels

Use these labels consistently:

- Confirmed public record
- Source-backed claim
- Public question
- Needs source
- Under review
- Correction requested
- Opinion
- Allegation
- Insufficient data
- Archived
- Updated

## Admin Review Standard

Admins should treat submitted material as unverified until reviewed. A source submission, correction request, or comment does not become a public fact until a reviewer verifies the public source and assigns the correct label.

High-risk content requires:

- Source URL.
- Status label.
- Reviewer confirmation.
- Audit/event log.
- Safer public wording if the claim is ambiguous.

## Current Implementation

- Safety rules and labels live in `src/lib/trust-safety.ts`.
- Public correction workflow uses `/api/corrections`.
- Admin correction review uses `/admin/corrections`.
- Privacy controls use `/privacy/controls` and `/dashboard/privacy`.
- Supabase schema is in `supabase-trust-safety-corrections.sql`.
