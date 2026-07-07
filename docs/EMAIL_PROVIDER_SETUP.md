# Email Provider Setup

Email sending is disabled by default. RepWatchr can generate digest previews and queue rows without a provider.

## Environment Variables

Required to send email:

```bash
ENABLE_EMAIL_SENDING=true
EMAIL_PROVIDER=resend
FROM_EMAIL="RepWatchr <updates@repwatchr.com>"
RESEND_API_KEY="..."
```

Supported providers:

- `resend` with `RESEND_API_KEY`
- `sendgrid` with `SENDGRID_API_KEY`
- `postmark` with `POSTMARK_API_KEY`

Optional/default state:

```bash
ENABLE_EMAIL_SENDING=false
EMAIL_PROVIDER=
RESEND_API_KEY=
SENDGRID_API_KEY=
POSTMARK_API_KEY=
FROM_EMAIL=
```

Do not expose provider keys with `NEXT_PUBLIC_` variables.

## Consent Gates

RepWatchr sends only when all are true:

1. `ENABLE_EMAIL_SENDING=true`
2. A supported `EMAIL_PROVIDER` is configured.
3. The matching provider API key exists server-side.
4. `FROM_EMAIL` exists.
5. The user has a valid email.
6. `notification_preferences.email_consent_at` is set.
7. `notification_preferences.unsubscribed_at` is empty.

If any gate fails, `sendEmail` returns a disabled or failed result and no email is sent.

## Provider Notes

### Resend

- Set `EMAIL_PROVIDER=resend`.
- Set `RESEND_API_KEY`.
- Verify the sending domain in Resend before production use.

### SendGrid

- Set `EMAIL_PROVIDER=sendgrid`.
- Set `SENDGRID_API_KEY`.
- Verify sender authentication before production use.

### Postmark

- Set `EMAIL_PROVIDER=postmark`.
- Set `POSTMARK_API_KEY`.
- Verify sender signatures before production use.

## Local Development

Use the default disabled state locally:

```bash
ENABLE_EMAIL_SENDING=false
```

You can still:

- open `/dashboard/notifications`
- save preferences
- generate previews
- save queue rows
- inspect `digest_queue` and `digest_items`

Queue rows created while disabled should have `status='sending_disabled'`.

## Future Unsubscribe Tokens

The current `/unsubscribe` page documents the dashboard unsubscribe path. Before sending production email, add signed unsubscribe tokens:

- generate a random token per user
- store only a hash server-side
- include `/unsubscribe?token=...` in outbound email
- expire or rotate tokens after use
- log `digest_unsubscribe_clicked`

Until that exists, digest settings and unsubscribe remain inside authenticated dashboard preferences.
