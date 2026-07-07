# RepWatchr Public Data API Plan

RepWatchr will eventually offer public-record data products, but the API is disabled by default.

Public launch gate:

- `ENABLE_PUBLIC_API=false` by default.
- Public route stubs return a clean disabled response until the flag is enabled.
- API keys are not issued from admin unless `ENABLE_PUBLIC_API=true`.
- Checkout is not part of this system yet.

Current foundation:

- `/packages/public-data-api` collects access demand.
- `/api/public` and `/api/public/*` provide disabled-safe endpoint responses.
- `/api/public-data-api/request-access` stores API access requests.
- `/admin/api` lets admins review demand, usage events, export jobs, scopes, and keys.
- `supabase-public-data-api.sql` defines key, usage, export, and access request tables.

Future endpoint surface:

- `GET /api/public/profiles`
- `GET /api/public/profiles/[id]`
- `GET /api/public/jurisdictions`
- `GET /api/public/races`
- `GET /api/public/sources`
- `GET /api/public/stories`
- `GET /api/public/search`
- `GET /api/public/aggregate-trends`

Allowed data categories:

- Approved public profiles.
- Approved public source links.
- Public jurisdictions.
- Public races.
- Published public stories.
- Approved public questions.
- Aggregate non-identifying trends.

Never expose:

- Private user data.
- Private watchlists.
- Private submissions.
- Raw analytics tied to people.
- Admin notes.
- Under-review claims as verified.
- Private uploaded documents.
- Payment events.
- Secret keys.

Initial release order:

1. Keep disabled stubs live.
2. Collect access requests and use cases.
3. Apply SQL tables and RLS.
4. Build read-only public profile adapter.
5. Add source/jurisdiction/race adapters.
6. Add aggregate trend adapter with non-identifying thresholds.
7. Add export jobs with expiry.
8. Enable key issuance for approved users only.
9. Enable `ENABLE_PUBLIC_API=true` after safety review.
