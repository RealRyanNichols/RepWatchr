# Document Review Policy

RepWatchr can intake records-response documents, but every uploaded or pasted response remains private until reviewed.

## Public-Record Boundary

RepWatchr may summarize public records, public filings, official responses, meeting records, and source-backed public documents.

RepWatchr must not publicly display:

- Private home addresses.
- Minor children or student details.
- Medical information.
- Bank, card, tax, or Social Security data.
- Sealed, restricted, privileged, or confidential records.
- Irrelevant private personal information.
- Threats or harassment language.
- Unsupported criminal accusations.
- Claims beyond what the source supports.

## Review Labels

Use these sensitivity statuses:

- `needs_review`: default. Nothing public yet.
- `safe_public_record`: reviewed and safe for a public summary or source attachment.
- `contains_private_info`: likely private information exists.
- `redaction_needed`: could become useful after redaction.
- `do_not_publish`: do not publish or summarize publicly beyond a generic status.
- `published_summary_only`: public summary is allowed, but raw document should stay private.

## Admin Summary Rules

Safe summaries should:

- Identify the agency/public body.
- Identify the response type.
- Say what the record appears to show.
- Say what it does not prove.
- Use cautious public-record wording.
- Link only to public source URLs when available.
- Avoid private data and unsupported conclusions.

Safe summary example:

> Nacogdoches County responded to a public records request with agenda records for the listed meeting date. RepWatchr is reviewing whether the agenda confirms the referenced vote item.

Unsafe summary example:

> This proves the official committed fraud.

## Attachment Rules

Before attaching a response to a profile, story, race, timeline, or source packet:

1. Confirm the response is a public record or can be safely summarized.
2. Confirm private information is absent or redacted.
3. Add a confidence/status label.
4. Keep raw uploads private unless a separate public source URL is available.
5. Create an event and admin audit row.

## Extraction Policy

The first implementation supports metadata and small text extraction only.

PDF/OCR extraction should be added later as a server-side worker. It must:

- Run only on protected files.
- Store extracted text privately.
- Run sensitive-pattern scanning.
- Require admin review.
- Never publish extracted text automatically.

## Correction And Safety

If a user or admin finds private information in a public summary, the item should be moved to:

- `redaction_needed`
- `do_not_publish`
- `published_summary_only`

Then create a correction event and update the public summary before any further sharing.
