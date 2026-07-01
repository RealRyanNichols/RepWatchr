# RepWatchr Admin Dashboard

## Purpose

`/admin` is the protected operator desk for RepWatchr. It is not a public marketing page and must never be indexed.

The dashboard is built around review and maintenance work:

- Source submission review.
- Correction and form intake review.
- Official/profile health.
- Story and Daily Watch review.
- Data import and link health.
- Product analytics.
- Monetization readiness.
- Users, contributors, watchlists, and saved items.
- Audit logs for admin actions.

## Access Control

Admin access is checked server-side by `src/app/admin/layout.tsx` before any admin page renders.

Current access sources:

1. `public.user_roles` with `role = 'admin'`.
2. `user.app_metadata.role = 'admin'` or `user.app_metadata.roles` containing `admin`.
3. Optional bootstrap allowlist: `REPWATCHR_ADMIN_EMAILS`.

API routes that need service-role data still use `requireAdminClient()`, which requires:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

No admin data is exposed to anonymous users. `/admin` and child admin routes use `robots: { index: false, follow: false }`.

## Routes

| Route | Purpose | Status |
| --- | --- | --- |
| `/admin` | Root admin command center and module launcher | Built |
| `/admin/sources` | Source submission review queue | Existing, now server-protected by layout |
| `/admin/intake` | Universal form and correction queue | Existing, now server-protected by layout |
| `/admin/forms` | Alias to intake queue | Existing |
| `/admin/control-center` | Data/profile control center | Existing |
| `/admin/content-review` | Content/story review desk | Existing |
| `/admin/analytics` | Admin analytics surface | Existing |
| `/admin/behavioral-analytics` | Behavioral analytics surface | Existing |
| `/admin/monetization-readiness` | Revenue readiness dashboard | Existing |
| `/admin/future-revenue` | Hidden future revenue flag desk | Existing |
| `/admin/claims` | Profile claim review | Existing |
| `/admin/superadmin` | Super admin office | Existing |

## Database

Run `supabase-admin-dashboard.sql` after the base `user_roles` schema is in place.

New admin tables:

- `admin_audit_logs`
- `admin_notes`
- `admin_assignments`
- `import_runs`
- `import_errors`
- `data_quality_issues`
- `broken_links`
- `duplicate_candidates`

All tables have RLS enabled. Authenticated admins can manage them through `public.is_repw_admin()`. There are no anon read policies.

## Audit Logging

The source review API now writes `admin_audit_logs` for:

- Source status changes.
- Source attachment actions.

The form intake API now writes `admin_audit_logs` for:

- Form submission status changes.
- Correction request resolution events.

Audit writes are best-effort. If the migration is not applied yet, review actions do not fail, but production review should not begin until the table exists.

## Analytics Events

Admin events added to the taxonomy:

- `admin_open`
- `admin_module_open`
- `admin_source_review_started`
- `admin_source_review_completed`
- `admin_form_opened`
- `admin_form_status_changed`
- `admin_correction_resolved`
- `admin_profile_updated`
- `admin_data_health_opened`
- `admin_monetization_opened`
- `admin_audit_log_opened`

## Production Checklist

- Apply `supabase-admin-dashboard.sql`.
- Confirm the owner/admin account has `user_roles.role = 'admin'`.
- Configure `SUPABASE_SERVICE_ROLE_KEY` in Vercel.
- Remove or keep `REPWATCHR_ADMIN_EMAILS` only as a bootstrap fallback.
- Confirm `/admin` redirects non-admins server-side.
- Confirm `/admin` and child routes are not present in sitemap output.
- Confirm source and form review actions create `admin_audit_logs`.
- Confirm no user-submitted claim is published directly without review.

## Current Gaps

- Profile Manager currently links into the control center and profile completion data; inline edit flows still need a dedicated CRUD panel.
- Data Health displays tables and recent rows; rerun/resolve/merge/quarantine actions still need dedicated mutation APIs.
- Content Desk links to the existing content review page; full Daily Watch promote/quarantine workflow still needs a deeper operator UI.
- Users and Contributors is a summary panel; dedicated user and contributor management pages still need to be built.
- Revenue remains readiness-only. Payments and paid packages must stay hidden until legal/privacy/fulfillment decisions are complete.
