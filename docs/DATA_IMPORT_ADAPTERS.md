# RepWatchr Data Import Adapters

RepWatchr imports public data through server-side adapters. The adapter layer is intentionally conservative: it prepares public records for admin review, but it does not publish claims, infer wrongdoing, or attach imported rows to profiles without a review path.

## Current Files

- `src/lib/data-import-adapters.ts`
- `src/app/admin/data-sources/page.tsx`
- `src/app/admin/imports/page.tsx`
- `src/app/api/admin/imports/run/route.ts`
- `supabase-data-import-adapters.sql`

## Adapter Contract

Every adapter exposes:

- `sourceKey`
- `displayName`
- `requiresApiKey`
- `getStatus()`
- `healthCheck()`
- `searchPeople(query, filters)`
- `getPerson(externalId)`
- `getRolesForPerson(externalId)`
- `getVotesForPerson(externalId)`
- `getFundingForPerson(externalId)`
- `normalizePerson(person)`
- `normalizeRole(role)`
- `normalizeVote(vote)`
- `normalizeFunding(record)`
- `importBatch(params)`

Unsupported operations return structured `not_supported` responses. Missing provider keys return structured `missing_api_key` responses. They should not throw during normal admin page rendering.

## Normalized Types

The adapter layer defines:

- `ExternalPerson`
- `ExternalRole`
- `ExternalBill`
- `ExternalVote`
- `ExternalFundingRecord`
- `NormalizedOfficial`
- `NormalizedVote`
- `NormalizedFundingRecord`

Normalized records should include:

- source key
- external ID
- source URL where available
- confidence label
- review status
- import run ID where applicable
- raw payload only for admin-side review

## Registered Sources

Initial adapters:

- `fec`
- `congress_gov`
- `openstates`
- `texas_ethics_commission`
- `local_manual_sources`

The local/manual adapter is wired end-to-end for dry-run/manual import tracking. Remote providers are safe stubs until provider-specific mapping is reviewed and API keys are configured.

## Safety Rules

- Public records only.
- No private home addresses.
- No minors or family details.
- No private financial, medical, or personal data.
- No guilt-by-association language.
- No criminal accusations generated from imported records.
- No auto-publishing.
- Public copy must use source-backed, confidence-labeled language.

## Feature Gate

`ENABLE_DATA_IMPORTS=false` by default.

The admin import route checks:

1. Server-side admin access.
2. `ENABLE_DATA_IMPORTS`.
3. Adapter support.
4. Provider key presence.

If imports are disabled, the route returns a clean disabled response.

## Admin Routes

- `/admin/data-sources`
  - source registry
  - adapter health
  - masked API key status
  - normalized field map
  - latest run summary

- `/admin/imports`
  - import gate status
  - latest import runs
  - latest import errors
  - provider readiness
  - operator notes

## Analytics Events

- `data_source_registry_open`
- `import_run_started`
- `import_run_completed`
- `import_run_failed`
- `import_error_logged`
- `data_source_missing_key`

## Next Adapter Work

1. Add source-specific fetch clients.
2. Add rate-limit handling.
3. Add dry-run payload samples.
4. Add source URL construction for every imported record.
5. Add duplicate detection before row creation.
6. Add admin review workflow to promote `imported_needs_review` rows.
7. Add backfill jobs only after dry-run review.
