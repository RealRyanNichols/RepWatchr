# RepWatchr Data Intake System

RepWatchr needs one intake architecture, not random disconnected forms. Every source, correction, package request, investor inquiry, missing official, broken link, and public-record draft should become structured data that can be reviewed, tracked, measured, and converted into a next action.

## Universal Intake Contract

Every form submission should produce:

- Structured `form_submissions` row
- `form_submission_events` audit row
- Canonical analytics event
- Attribution touch when analytics tables exist
- Admin-review queue item
- Thank-you page
- Next action
- Optional create-account prompt
- Safe copy/export summary
- Status tracking for logged-in users

## Tables

### `form_definitions`

Registry for supported forms.

Fields:

- `key`
- `name`
- `description`
- `status`
- `schema`

### `form_submissions`

The single queue for all public and member intake.

Fields:

- `form_key`
- `anonymous_id`
- `user_id`
- `email`
- `name`
- `payload`
- `normalized_payload`
- `status`
- `priority`
- `source_route`
- `referrer`
- `utm`
- `admin_notes`
- `assigned_to`

### `form_submission_events`

Audit/event history for each submission.

Events include:

- `submitted`
- `admin_queue_item_created`
- `status_changed`
- future attach/convert/request-more-info events

## Supported Form Keys

- `submit_source`
- `correction_request`
- `free_packet`
- `package_interest`
- `investor_interest`
- `partner_interest`
- `data_source_suggestion`
- `missing_official`
- `missing_agency`
- `report_broken_link`
- `newsletter_signup`
- `watchlist_signup`
- `feedback`
- `contact`
- `research_request`
- `public_records_request`

## Code Surface

- Shared schemas and validation: `src/lib/data-intake.ts`
- Client submit utilities: `src/lib/data-intake-client.ts`
- Server submit/status helpers: `src/lib/data-intake-server.ts`
- Public submit route: `/api/forms/submit`
- Public safe status route: `/api/forms/status/[id]`
- Admin list route: `/api/admin/forms`
- Admin detail/status route: `/api/admin/forms/[id]`
- Admin intake page: `/admin/intake`
- Thank-you page: `/intake/thank-you`
- SQL migration: `supabase-universal-data-intake.sql`

## Validation

Validation uses Zod and runs server-side. Client-side validation is helpful but not trusted.

Every form validates:

- Required fields
- Email format when email is supplied
- URL format when URL is supplied
- Reasonable text lengths
- Honeypot spam field
- Dangerous/threatening language
- Private home-address patterns where public intake should not contain them
- Minor-child/private family details where public intake should not contain them

## Spam Protection

Current baseline:

- Honeypot fields: `companyWebsite` / `website_confirm`
- In-memory per-minute rate limit on the submit API
- Server-side Zod validation
- Empty/garbage rejection through required fields and minimum lengths

Future upgrades:

- Turnstile or hCaptcha on high-abuse forms
- IP hash only, not raw IP storage
- Admin spam status
- Domain allow/deny list for source URLs

## Statuses

- `new`
- `needs_review`
- `verified`
- `rejected`
- `needs_more_info`
- `attached_to_profile`
- `converted_to_packet`
- `converted_to_order`
- `archived`

## Admin Workflow

Admins can:

- View submissions
- Filter by form key
- Filter by status
- Filter by priority
- Filter by date through future query params
- View payload and normalized payload
- Add internal notes
- Assign reviewer
- Change status
- Mark needs more info
- Archive
- Attach source submissions to profiles later
- Keep audit events for status changes

## Analytics Events

Generic:

- `form_started`
- `form_step_completed`
- `form_submitted`
- `form_submit_failed`
- `form_abandoned`
- `admin_form_opened`
- `admin_form_status_changed`

Specific:

- `source_submit_started`
- `source_submit_completed`
- `correction_submit_started`
- `correction_submit_completed`
- `package_interest_submitted`
- `investor_interest_submitted`
- `partner_interest_submitted`
- `broken_link_reported`

## Security Boundary

- Public users may insert appropriate submissions.
- Authenticated users may read their own submissions.
- Admins/operators may read and manage all submissions.
- Only admins may change `status`, `admin_notes`, or `assigned_to`.
- Sensitive payload fields should not be public.
- Public thank-you/status pages only return safe summary fields.

## Production Setup

Run:

```sql
-- after operator/admin role SQL
\i supabase-universal-data-intake.sql
```

Then verify:

1. Submit `/submit-source`.
2. Confirm `form_submissions` row exists.
3. Confirm `form_submission_events` has `submitted` and `admin_queue_item_created`.
4. Confirm `/intake/thank-you?submission=<id>` can show safe status.
5. Confirm `/admin/intake` loads as admin and blocks non-admins through the API.
