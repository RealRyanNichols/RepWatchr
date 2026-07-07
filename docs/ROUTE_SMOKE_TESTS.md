# RepWatchr Route Smoke Tests

Route smoke checks verify that important public, private, SEO, and admin routes respond in a predictable way.

## Command

Local:

```bash
npm run qa:routes
```

Production or preview:

```bash
REPWATCHR_SMOKE_BASE_URL=https://www.repwatchr.com npm run qa:routes
```

JSON output:

```bash
npm run qa:routes -- --json
```

Allow documented gaps during an exploratory run:

```bash
npm run qa:routes -- --allow-known-gaps
```

## What It Checks

- route returns a valid status
- public HTML routes contain expected brand/context text
- SEO routes return expected content type or text
- private routes may redirect
- forbidden setup/secret text is not exposed
- known missing routes remain visible

## Public Routes

- `/`
- `/search`
- `/officials`
- `/officials/ted-cruz`
- `/submit-source`
- `/free-packet`
- `/tools/public-records-response`
- `/services`
- `/services/quick-record-check`
- `/privacy`
- `/methodology`

## SEO Routes

- `/sitemap.xml`
- `/robots.txt`

## Private/Admin Routes

- `/dashboard`
- `/admin`
- `/admin/quality`

Private routes are allowed to redirect. A public 200 response for admin/dashboard content is a failure.

## Known Route Gaps

These routes are intentionally listed as failures unless `--allow-known-gaps` is used:

- `/tools/source-packet-builder`
- `/tools/public-records-request`
- `/search` currently redirects to `/faretta-ai` and is noindex
- `/packages/quick-record-check`
- `/packages/official-record-brief`
- `/packages/local-race-source-pack`
- `/packages/election-watch-desk`
- `/jurisdictions/texas`
- `/dashboard/privacy`
- `/admin/analytics`
- `/admin/sources`
- `/admin/monetization`
- `/admin/seo`

The current canonical service route is `/services/[slug]`. If `/packages/[slug]` should become public, add redirects or real pages intentionally and update the smoke inventory.

## Failure Policy

A failed smoke test blocks deploy unless:

- the route requires credentials unavailable in the current environment
- the route gap is documented and accepted for this release
- the issue is a business decision, not an engineering failure

Do not mark a failing route as passing without either fixing it or documenting the blocker.
