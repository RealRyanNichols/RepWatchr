# RepWatchr Supabase Schema Security

This audit covers current database usage, schema assumptions, RLS posture, server/client boundaries, and required production verification.

## Current Supabase Usage

Client/server split:

- Browser client: `src/lib/supabase.ts`
  - Uses `NEXT_PUBLIC_SUPABASE_URL`.
  - Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - No service-role key.
- Server session client: `src/lib/supabase-server.ts`
  - Uses Supabase SSR cookies/session.
  - Uses public URL and anon key.
- Server admin client: `src/lib/supabase-admin.ts`
  - Uses `SUPABASE_SERVICE_ROLE_KEY`.
  - Must only be imported by route handlers/server-only modules.
- Admin route gate: `src/lib/admin-auth.ts`
  - Server-side check.
  - Reads `user_roles`.
  - Updated to recognize `super_admin`.

## SQL Files Inspected

Root-level SQL files are used as migration/runbook files:

- `supabase-schema.sql`
- `supabase-profile-claims.sql`
- `supabase-owner-bootstrap.sql`
- `supabase-superadmin-office.sql`
- `supabase-admin-dashboard.sql`
- `supabase-universal-data-intake.sql`
- `supabase-source-submission-system.sql`
- `supabase-source-packets-records-requests.sql`
- `supabase-member-watchlists.sql`
- `supabase-watchlists-feedback-next-click.sql`
- `supabase-visitor-intelligence.sql`
- `supabase-search-discovery.sql`
- `supabase-public-entity-model.sql`
- `supabase-political-data-products.sql`
- `supabase-future-revenue.sql`
- `supabase-pricing-experiments.sql`
- `supabase-package-interest.sql`
- `supabase-trust-safety-corrections.sql`
- `supabase-contributor-profiles.sql`
- `supabase-official-timelines.sql`
- `supabase-school-board-model.sql`
- `supabase-social-monitoring.sql`
- Other feature-specific SQL runbooks.

## Security Fix Added

New file:

- `supabase-security-rls-hardening.sql`

It does four things:

1. Expands and hardens `user_roles`.
2. Replaces central role helpers with database-backed `user_roles` checks.
3. Tightens base `profiles` and `citizen_votes` policies with explicit `TO authenticated`, `USING`, and `WITH CHECK`.
4. Adds explicit Supabase Data API grants and admin-only security inventory views.
5. Adds automatic audit triggers for core admin-only desk tables.

New local verification script:

- `scripts/check-supabase-boundaries.mjs`

New SQL verification script:

- `scripts/repwatchr-rls-smoke-check.sql`

## Supabase Platform Note

Supabase’s 2026 default-grants change means table access should be explicit. A table being protected by RLS is not enough if the needed role has no grant, and a grant is not enough without RLS. RepWatchr should treat grants and RLS policies as one unit.

## Public Data Rules

Public pages may read only:

- Approved profiles.
- Approved public source links.
- Approved public stories/questions.
- Published public entities.
- Public search index rows.
- Aggregates that do not expose individual private user behavior.

Public pages may not read:

- Raw source submissions.
- Correction queues.
- Admin notes.
- Raw analytics events.
- Private watchlists.
- Private dashboard records.
- Service requests or package interest rows except through admin tools.

## Anonymous Insert Rules

Anonymous inserts remain allowed for product growth, but only into intake-style tables:

- `source_submissions`
- `form_submissions`
- `correction_requests`
- `privacy_requests`
- `package_interest`
- `beta_access_requests`
- `analytics_events`
- `attribution_touches`
- `watch_events`
- `anonymous_watch_intents`
- `feedback_votes`

Anonymous inserts must default to `new`, `needs_review`, or equivalent. Anonymous inserts must not set `reviewer`, `admin_notes`, `verified`, `approved`, or public visibility.

## User Private Rules

Authenticated users can read/manage their own rows in:

- Watchlists.
- Saved searches.
- Source packets.
- Public-record request drafts.
- Dashboard preferences.
- Contributor profile.
- Source/correction submissions.
- Claim submissions.
- Private analytics history after anonymous merge.

Ownership must use `auth.uid()` against `user_id` or an owner-checked parent table. `TO authenticated` alone is not enough.

## Admin Rules

Admin systems must be server-side gated and RLS-gated:

- `/admin` layout uses `requireAdminPageAccess()`.
- Admin API routes use server checks before service-role work.
- Admin mutations should insert `admin_audit_logs`.
- Admin notes should never be publicly queryable.
- Review queues must not auto-publish user claims.

Database admin authority:

- `super_admin`: manage roles and settings.
- `admin`: manage operational/admin systems.
- `reviewer` / `researcher`: review/operator workflows only.

## Current Gaps

1. Some older policies omit explicit `TO` clauses.
2. Several feature SQL files redefine role helper functions; hardening SQL must run last.
3. Full RLS verification requires production Supabase credentials and real table state.
4. Admin audit logging now has automatic triggers for core admin desk tables, but every review-queue mutation path still needs production verification against `source_submission_events`, `form_submission_events`, `correction_events`, and `admin_audit_logs`.
5. Raw analytics and visitor intelligence tables need periodic review to ensure no sensitive private details are stored.
6. Storage policies exist for profile submissions/media, but public-record response uploads need the same private-by-default posture when that table/storage workflow is added.

## Deployment Checklist

1. Confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set.
2. Confirm `SUPABASE_SERVICE_ROLE_KEY` is server-only in Vercel.
3. Apply the SQL files in `docs/DATABASE_MIGRATION_ORDER.md`.
4. Apply `supabase-security-rls-hardening.sql` last.
5. Add the first `super_admin` manually from the SQL editor.
6. Run `scripts/repwatchr-rls-smoke-check.sql`.
7. Run Supabase Security Advisor.
8. Run `node scripts/check-supabase-boundaries.mjs`.
9. Run app build/type checks.
10. Verify admin dashboard and source submission flows in production.
