# Backend staging hold

The July 2026 visual release intentionally ships the approved homepage, official-profile, race-page, East Texas desk, thumbnail, and OG systems without applying or scheduling the new backend data model.

The unreleased Supabase migration drafts are preserved on the branch:

`agent/repwatchr-backend-staging-hold`

Do not copy or apply those migrations to production. They require a fresh review and a replacement migration set because the held drafts include destructive verification resets and unresolved poll-schema assumptions.

## Production-safe state

- The held segmented-residence poll remains prohibited.
- The July 28 Marion County community pulse uses a new additive three-table schema,
  one current response per signed-in account, service-role-only storage access,
  Vercel BotID screening, and a 25-response display threshold.
- The live pulse does not claim residence, voter registration, scientific sampling,
  or official election standing. It stores no email, provider, IP, geography, or bot token.
- `ENABLE_RACE_POLLS_V1=false` is the independent server-side emergency kill switch;
  the database poll status and close time are the normal launch/close controls.
- `EDITORIAL_PIPELINE_ENABLED` defaults to off.
- `EDITORIAL_AUTOPUBLISH_ENABLED` defaults to off.
- The editorial publishing route requires both cron authorization and explicit pipeline activation.
- No editorial publishing cron is scheduled in `vercel.json`.
- `SOCIAL_PIPELINE_V2_ENABLED` defaults to off and produces a healthy cron skip.
- Facebook and X each require their own platform kill switch in addition to the global social and editorial-approval gates.

## Required before backend activation

1. Replace destructive schema changes with additive, reversible migrations.
2. Preserve existing member verification, geography, votes, and grades.
3. Any later residence-segmented poll must use a new server-owned verification source.
   The existing self-editable `profiles.verified` field is not sufficient.
4. Apply privacy thresholds to every future geographic result total.
5. Test migrations against a non-production database snapshot and document rollback.
6. Verify source-count, primary-source, reviewer, risk, and correction gates for publishing.
7. Confirm Facebook and X credentials in non-production and complete a dry run.
8. Obtain explicit production approval before enabling any poll, publishing, or social-write flag.
