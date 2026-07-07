# RepWatchr Error Tracking Plan

RepWatchr now has a built-in error-log fallback for when no external provider is configured.

## Current Implementation

- SQL table: `app_error_logs`
- SQL file: `supabase-qa-monitoring.sql`
- Server helper: `logAppError(error, context)`
- Public-safe endpoint: `/api/quality/error`
- Admin dashboard: `/admin/quality`
- App error boundary: `src/app/error.tsx`

## Error Data Allowed

- sanitized error type
- sanitized message
- sanitized stack
- route
- anonymous session ID
- user ID when server-side and appropriate
- severity
- safe diagnostic metadata

## Do Not Store

- raw source submissions
- public-records request text
- uploaded documents
- private addresses
- minor children or family details
- phone numbers or emails beyond sanitized placeholders
- payment details
- tokens, API keys, webhook secrets, cookies, or auth headers
- admin notes
- private watchlists
- raw analytics tied to identities

## Database Access

`app_error_logs` has RLS enabled and direct access revoked from `anon` and `authenticated`.

Public clients submit errors through `/api/quality/error`; admins view errors through server-side routes using the service role.

## External Provider Future

If Sentry, Logtail, Datadog, Vercel Observability, or another provider is added later:

1. Keep `logAppError()` as the app-level abstraction.
2. Send only sanitized fields.
3. Do not send raw form payloads or private submissions.
4. Keep Supabase fallback for critical errors.
5. Document retention and access control.

## Severity Guidance

- `debug`: local-only diagnostic
- `info`: recovered issue
- `warn`: degraded behavior or missing optional capability
- `error`: user-facing error or failed request
- `critical`: outage, data-loss risk, auth/security failure

## Admin Review

Admins should review `/admin/quality` after deploy and after any large feature merge. Errors that include private data patterns should be treated as a product bug and scrubbed immediately.
