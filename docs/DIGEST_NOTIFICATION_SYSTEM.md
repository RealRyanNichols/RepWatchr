# RepWatchr Digest and Notification System

RepWatchr digest notifications are built as consent-first infrastructure. The system can generate previews and queue digest rows today, but it does not send email unless all required server-side gates are enabled.

## Goals

- Give members useful return reasons from their watchlists, source submissions, public-records requests, and records responses.
- Keep digest content tied to the member's own activity and saved records.
- Avoid spam, fake urgency, and political targeting without opt-in.
- Keep email sending disabled by default.
- Store queue rows and notification events for admin visibility and future delivery jobs.

## Public Rules

- No emails are sent unless `ENABLE_EMAIL_SENDING=true`.
- No emails are sent unless the member has active consent in `notification_preferences.email_consent_at`.
- No emails are sent to unsubscribed members.
- No private watchlists are exposed publicly.
- Breaking alerts must represent real watched-record updates, not fake activity.
- Package mentions are contextual only and should not become a spam channel.

## Database Tables

The migration is in `supabase-digest-notification-system.sql`.

### `notification_preferences`

Stores one row per user:

- email
- weekly digest toggle
- daily digest toggle
- breaking alerts toggle
- watched official/race/jurisdiction toggles
- source review, contribution, package, and records request update toggles
- email consent timestamp
- unsubscribe timestamp

### `digest_queue`

Stores generated digest payloads. A queue row may be:

- `pending` when sending is enabled and consent exists
- `sending_disabled` when preview is saved but cannot be emailed
- `sent`
- `failed`
- `canceled`

### `digest_items`

Stores normalized digest items by queue row for future analytics, admin review, and click reporting.

### `notification_events`

Stores events such as:

- `digest_preferences_open`
- `digest_preference_changed`
- `digest_preview_generated`
- `digest_queue_created`
- `digest_email_sent`
- `digest_email_failed`
- `digest_unsubscribe_clicked`
- `digest_item_clicked`

## Application Files

- `src/lib/digest-notifications.ts`
  - `generateDigestPreview(userId)`
  - `renderDigestEmail(payload)`
  - `sendEmail(to, subject, html/text)`
  - `sendDigest(digestQueueId)`
- `src/app/dashboard/notifications/page.tsx`
  - Protected dashboard page for digest preferences and preview.
- `src/components/notifications/DigestPreferencesPanel.tsx`
  - Client UI for toggles, consent, unsubscribe, preview, and queue save.
- `src/app/api/notifications/preferences/route.ts`
  - Reads and updates member preferences.
- `src/app/api/notifications/digest-preview/route.ts`
  - Generates a preview and logs a notification event.
- `src/app/api/notifications/digest-queue/route.ts`
  - Saves a queue row. It does not send email.
- `src/app/unsubscribe/page.tsx`
  - Placeholder route for future token-based unsubscribe links.

## Digest Preview Sections

`generateDigestPreview(userId)` returns these sections:

1. Watchlist changes
2. Source review updates
3. Suggested source gaps
4. Public questions to ask
5. Records request updates
6. Recommended next action
7. Package interest if relevant

The preview uses available member tables where present and falls back to useful empty states.

## Sending Flow

1. Member opts in at `/dashboard/notifications`.
2. A preview is generated.
3. A queue row is created.
4. A future scheduled job or admin action calls `sendDigest(digestQueueId)`.
5. `sendDigest` re-checks consent and unsubscribe state before rendering or sending.
6. `sendEmail` checks the feature flag and provider configuration before contacting a provider.

## Disabled State

When email sending is disabled:

- Dashboard previews still work.
- Queue rows save with `sending_disabled`.
- No provider call is made.
- The UI displays a clean disabled status instead of exposing broken provider details.

## RLS and Security

The migration enables RLS on all four tables.

- Members can read and update their own preferences.
- Members can read their own digest queue/items/events.
- Admins can manage all rows through the private admin helper.
- Anonymous users have no grants on digest tables.

## Current Limitation

This prompt builds infrastructure and preview. It does not add a cron sender. A future task should create an admin-safe scheduled sender that:

- selects due `pending` rows
- calls `sendDigest`
- rate-limits sending
- records success/failure events
- respects unsubscribe and consent every time
