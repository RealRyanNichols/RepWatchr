# RepWatchr Import Runbook

Use this runbook before enabling public-data imports.

## 1. Apply SQL

Run:

```sql
-- Apply after supabase-admin-dashboard.sql.
-- Then rerun supabase-security-rls-hardening.sql as the final security pass.
\i supabase-data-import-adapters.sql
```

If using the Supabase SQL editor, paste the contents of `supabase-data-import-adapters.sql`.

## 2. Confirm Environment

Required for admin visibility:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REPWATCHR_ADMIN_EMAILS` or admin role rows

Optional provider keys:

- `FEC_API_KEY`
- `CONGRESS_API_KEY`
- `OPENSTATES_API_KEY`
- `TEC_IMPORT_MODE`

Execution gate:

- `ENABLE_DATA_IMPORTS=false`

Keep it false until dry-run review is complete.

## 3. Verify Admin Pages

Open:

- `/admin/data-sources`
- `/admin/imports`
- `/admin/data-health`

Expected:

- Source registry loads.
- Missing API keys show as warnings, not errors.
- Import history loads.
- Import errors are admin-only.
- Admin pages are noindex and protected by server-side role checks.

## 4. Dry Run

Only after setting `ENABLE_DATA_IMPORTS=true` in a controlled environment:

```bash
curl -X POST https://www.repwatchr.com/api/admin/imports/run \
  -H "Content-Type: application/json" \
  -d '{"sourceKey":"local_manual_sources","importType":"manual_dry_run","dryRun":true,"limit":25}'
```

The route requires an authenticated admin session in production. The local/manual adapter should create an import run with zero mutations and explanatory notes.

## 5. Provider Enablement Checklist

Before enabling a remote source:

- API key is configured server-side only.
- Adapter handles rate limits and provider errors.
- Every imported row gets a source key.
- Every public-facing row gets a source URL where available.
- Every normalized record has a confidence label.
- Every normalized record starts as `imported_needs_review`.
- Duplicate detection has a plan.
- Admin review path exists before public use.
- Public copy stays neutral and source-first.

## 6. Error Handling

Expected structured failures:

- `missing_api_key`
- `not_supported`
- `disabled`
- `error`

These failures should:

- update `import_runs`
- create `import_errors`
- track analytics events
- avoid public error copy
- preserve enough metadata for admin debugging without secrets

## 7. Never Do This

- Do not expose provider keys client-side.
- Do not auto-publish imported records.
- Do not import private addresses or family data.
- Do not convert donations into corruption claims.
- Do not score an official from imported data until methodology is reviewed.
- Do not run bulk jobs in production before dry-run and rollback checks.

## 8. Next Production Steps

1. Apply `supabase-data-import-adapters.sql`.
2. Rerun `supabase-security-rls-hardening.sql`.
3. Confirm Supabase Security Advisor has no public-table/RLS warnings.
4. Add provider keys in staging only.
5. Build provider-specific dry-run fetch clients.
6. Review payload samples and source URL behavior.
7. Enable `ENABLE_DATA_IMPORTS=true` in staging.
8. Run local/manual dry run.
9. Run one provider dry run.
10. Review `import_runs`, `import_errors`, and admin audit logs.
