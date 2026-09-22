# Local record explorer

Built September 21, 2026. Production promotion pending Ryan's approval.

## What changes for a visitor

- `/home-district/roster` is a searchable, mobile-friendly explorer for the canonical working list: 13 counties and 22 towns, with 69 existing profile records.
- County, town, government type, research coverage, and sort controls work together. Filter URLs can be bookmarked or shared. No-match results explain the limitation and offer a reset or source submission.
- All 35 jurisdictions have an office-by-office page under `/home-district/roster/{county|city}/{slug}`. Each page links profiles, recorded review dates, attached sources, missing office records, and connected county/town pages.
- A missing-office contribution opens the existing source form with the jurisdiction, office, requested check, and originating page preserved. It also provides a direct return link. Submission and publication remain separate.
- The default officials directory no longer mistakes Justice Center buildings or Center Street addresses for Center, Texas. Source indicators show the actual linked-source count, independently of incomplete profile research.
- Mobile source links no longer carry stale filters across navigation. Versioned local race portraits are permitted by the image configuration so Marion County renders successfully.

## Meaning of the counts

Counts describe records already on file, not verified incumbents or confirmed current seats. Duplicate IDs are counted once. Missing-record counts are computed per office group so a surplus of one office cannot conceal a different missing office. Source counts mean links exist, not that every claim has been authenticated.

The municipality list, TX-01 boundary, and local office counts retain their existing review limitations. New jurisdiction pages and filtered explorer views use `noindex, follow`. No new officeholder claims, scores, allegations, roster certifications, or public source submissions were published.

## Files

- Routes: `src/app/home-district/roster/page.tsx`, `src/app/home-district/roster/[kind]/[slug]/{page,not-found}.tsx`, `src/app/feedback/page.tsx` (also serves `/submit-source`).
- UI: `JurisdictionExplorer.tsx`, `OfficialSearchPanel.tsx`, `SourceSubmissionForm.tsx`, `MobileAppShell.tsx`.
- Models: `jurisdiction-explorer.ts`, `roster-filters.ts`, `roster-source-context.ts`, `district-footprint.ts`, `home-districts.ts`.
- Build/QA: `next.config.ts`, `package.json`, updated home-district smoke, and five new behavioral/route checks in `scripts`.

## Verification

Passed:

```sh
npm run build
npm run lint
npm run smoke:local-records
npm run smoke:local-record-routes
npm run smoke:home-districts
npm run smoke:district-positioning
npm run smoke:officials
npm run smoke:integrity
npm run smoke:neutrality
npm run smoke:sources
npm run smoke:mobile-pwa
npm run qa:static
git diff --check
```

The build includes TypeScript checking. ESLint reports zero errors and nine existing warnings in unrelated import scripts and profile image components. The environment also prints a Node module-registration deprecation notice during the build. No formatter is configured; targeted ESLint fixes and whitespace checks were run.

Route checks exercise every jurisdiction, filtered results, no-match results, source-form context, `noindex` metadata, one H1/main landmark, and invalid-route HTTP 404s. Browser checks cover combined Harrison/city filtering (including cross-county Longview), office navigation, source prefill, return links, reset, and mobile/desktop layouts without horizontal overflow.

Real source submissions and admin queue writes were not sent during QA. Their existing API/storage integration was not changed. Authentication, social posting, payments, and other unrelated gated integrations were not exercised.

## Release

No new environment variables, services, migrations, dependencies, paid API calls, or feature flags are required. Use the normal existing Vercel project. Production has not been promoted and Git changes have not been pushed to trigger a production deployment.

The repository's `AGENTS.md` states: “Production deploys stay approval-gated.” After approval, deploy this reviewed change and run `REPWATCHR_SMOKE_BASE_URL=https://www.repwatchr.com npm run smoke:local-record-routes`, plus the normal release checks.

Rollback is an application rollback to the prior Vercel deployment; this change does not mutate stored records or database schema.
