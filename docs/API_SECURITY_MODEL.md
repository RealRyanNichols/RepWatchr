# RepWatchr API Security Model

The public API is a gated public-record product, not a general database mirror.

Launch controls:

- `ENABLE_PUBLIC_API=false` by default.
- API keys are hashed with SHA-256 before storage.
- Plaintext API keys are shown once only.
- API keys have scopes.
- API keys have daily rate limits.
- API usage is logged in `api_usage_events`.
- Admin can revoke keys.

Scopes:

- `public_profiles_read`
- `public_sources_read`
- `public_jurisdictions_read`
- `public_races_read`
- `public_stories_read`
- `public_questions_read`
- `aggregate_trends_read`
- `exports_create`
- `admin_internal` server-side only

Request checks:

1. Check `ENABLE_PUBLIC_API`.
2. Extract API key from `Authorization: Bearer` or `x-repwatchr-api-key`.
3. Hash supplied key.
4. Match active key hash.
5. Check required scope.
6. Check daily rate limit.
7. Log usage event.
8. Return only approved public data through adapter code.

Supabase rules:

- RLS must be enabled on all API-product tables.
- Do not expose `api_keys` to `anon` or `authenticated` clients.
- Do not let clients select `key_hash`.
- Public access requests can be inserted.
- Logged-in users may see their own API access requests and export rows.
- Admin operations must go through server-side admin routes.

Data safety:

- No private user data.
- No private watchlists.
- No raw person-level analytics.
- No under-review submissions as verified.
- No private documents.
- No payment records.
- No admin notes.

Operational rule:

If an endpoint cannot prove that data is approved public-record data, it should return nothing and log a safe usage event.
