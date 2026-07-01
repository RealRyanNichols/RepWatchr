# RepWatchr Correction Workflow

RepWatchr must be easy to correct. Public-record accountability only works if wrong, stale, incomplete, or unsafe information can be challenged.

## Public Flow

Every major public record page should provide a correction path:

- Official profiles.
- Stories/articles.
- Red flags.
- Funding pages.
- Vote pages.
- Source pages when public.

The correction form asks for:

- Target entity.
- Correction type.
- Current text or record.
- Requested correction.
- Public source URL.
- Reviewer explanation.
- Optional submitter name/email.

Submissions redirect to `/corrections/thank-you` with the correction ID and status.

## Admin Flow

Admins review corrections at `/admin/corrections`.

Allowed admin actions:

- Mark needs review.
- Approve.
- Reject.
- Request more information.
- Attach source.
- Mark entity updated.
- Resolve.
- Archive.

Every admin status change should write:

- `correction_events`
- `admin_audit_logs` when available
- analytics event `correction_admin_resolved`

## Statuses

- new
- needs_review
- approved
- rejected
- needs_more_info
- attached_source
- entity_updated
- resolved
- archived

## Safety Rule

Correction requests are not public facts. They are review items. If a correction includes risky wording, admins should use `suggestSafeLanguage()` before publishing any summary.
