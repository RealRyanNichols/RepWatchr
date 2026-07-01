# RepWatchr Source Submission System

RepWatchr source submissions are not public truth. They are review items.

Every user-submitted source starts as:

**Submitted Source - Under Review**

Only reviewed rows in `source_links` should appear as active public source links.

## Database

Migration file:

- `supabase-source-submission-system.sql`

Tables:

- `source_submissions` - public source intake queue.
- `source_submission_events` - audit trail for submission, status, duplicate, rejection, and attach actions.
- `source_review_notes` - admin/reviewer notes. Internal by default.
- `source_links` - reviewed source links that can be attached to officials, races, stories, votes, funding records, agencies, boards, judges, and public bodies.

The SQL enables RLS on all tables and includes explicit grants because Supabase changed new-table Data API exposure defaults in 2026. RLS still controls row access after a table is reachable.

## Submission Flow

The public flow lives at:

- `/submit-source`
- `/sources/submit`

Steps:

1. Source URL.
2. What the source relates to.
3. Target name and jurisdiction.
4. What the source appears to show.
5. Requested action.
6. Source packet preview.
7. Submit to review queue.

Required public wording:

- Use `appears to show` before admin review.
- Use `Submitted Source - Under Review` until a reviewer verifies or attaches it.
- Do not imply the source proves more than the source supports.

## Public Display Rules

- Active `source_links` can be shown publicly.
- Pending `source_submissions` may only be shown with a clear `Submitted source under review` label.
- Submitter names, emails, private notes, and admin notes are never public.
- Red flags, stories, scorecards, and profile claims must link to reviewed sources or clearly show `needs source`.

## Admin Review

Admin route:

- `/admin/sources`

Admin actions:

- Filter by status, source type, target type, state, county, city, priority, source URL, and submitter email.
- Open the source URL.
- Approve, reject, request more info, mark duplicate, archive.
- Change confidence.
- Add internal review notes.
- Attach a verified source to an entity through `source_links`.

Attach behavior:

- `official`, `candidate`, `judge`, `school_board`, `agency`, and similar profile entities can set status `attached_to_profile`.
- `race` sets status `attached_to_race`.
- `story` or `article` sets status `attached_to_story`.
- A `source_attached_to_entity` event is recorded.

## Components

Source system components:

- `SourceSubmissionForm`
- `SourceUrlInput`
- `SourceTypeSelector`
- `TargetEntitySelector`
- `SourcePacketPreview`
- `SourceSubmissionSuccess`
- `SourceStatusBadge`
- `AdminSourceQueue`
- `AdminSourceReviewPanel`
- `SourceTrail`
- `SourceCard`
- `ReportBrokenSourceButton`

## API Routes

Public:

- `POST /api/sources/submit`
- `GET /api/sources/status/[id]`

Admin:

- `GET /api/admin/sources`
- `GET /api/admin/sources/[id]`
- `PATCH /api/admin/sources/[id]`

## Analytics

Tracked public events:

- `source_submit_started`
- `source_url_entered`
- `source_target_type_selected`
- `source_target_entered`
- `source_packet_previewed`
- `source_submit_completed`
- `source_submit_failed`

Tracked admin events:

- `source_admin_review_started`
- `source_admin_status_changed`
- `source_attached_to_entity`
- `source_rejected`
- `source_marked_duplicate`

## Security

Submission validation rejects:

- Missing required fields.
- Invalid URL or email.
- Oversized text.
- Honeypot/spam fields.
- Threats or dangerous language.
- Private home address patterns.
- Minor-child/private family details.

RLS model:

- Public users can insert source submissions.
- Logged-in users can read their own source submissions.
- Admin/operators can manage all source submissions, events, notes, and source links.
- Only admin/operator workflows should create or update `source_links`.

## Production Setup

1. Run `supabase-superadmin-office.sql` if `public.is_repw_operator()` is not already installed.
2. Run `supabase-source-submission-system.sql`.
3. Confirm `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` exist in production.
4. Open `/sources/submit` and submit a public source.
5. Open `/admin/sources` as an admin user.
6. Attach the source to a test entity.
7. Confirm `source_links` contains the reviewed source and `source_submissions` status changed.

## Guardrail

The hook can move fast. The receipt has to stay attached.
