# RepWatchr SEO and Indexing System

RepWatchr should index useful public-record pages and keep private, sparse, temporary, or under-review pages out of search engines.

## Public Indexing Rule

Index pages that have public value:

- Homepage, search, officials, services, methodology, privacy, terms, elections, school boards, sources submit, news, votes, funding, red flags, issues, and scorecards.
- Official profiles with enough public value: profile completion at least 35%, at least one public source link, and not marked `needs_source_review`.
- Official data pages such as timeline, funding, vote, issue, and scorecard pages where the underlying page exists.
- Race pages from the Texas election data set.
- School board district pages and candidate pages with sources or useful dossier status.
- Public stories from the reviewed news data set.
- Agency and public-power pages when they are not under source review or still in buildout.

Do not index:

- `/admin`, `/dashboard`, `/auth`, `/api`, `/login`, `/buildout`, `/uap`
- Temporary packets, private watchlists, private user data, API endpoints, and admin-only reports.
- Under-review pages.
- Duplicate filter URLs.
- Low-quality sparse profiles.
- Public source pages until dedicated source pages exist and have enough public value.
- Jurisdiction hubs until those pages are built and useful.

## Sitemap Routes

The sitemap index is a route handler at:

- `/sitemap.xml`

Child sitemaps:

- `/sitemaps/static.xml`
- `/sitemaps/profiles.xml`
- `/sitemaps/officials.xml`
- `/sitemaps/agencies.xml`
- `/sitemaps/jurisdictions.xml`
- `/sitemaps/races.xml`
- `/sitemaps/school-boards.xml`
- `/sitemaps/stories.xml`
- `/sitemaps/sources.xml`
- `/sitemaps/news.xml`

`/sitemaps/jurisdictions.xml` and `/sitemaps/sources.xml` currently return empty URL sets by design. They should fill only after jurisdiction hub pages and public source pages are valuable enough to index.

## Robots

`/robots.txt` references every sitemap in the index and disallows private/admin paths. The implementation is in `src/app/robots.ts`.

## Metadata Utility

`src/lib/seo.ts` contains:

- `absoluteUrl(path)`
- `getOgImageUrl(path)`
- `getPageMetadata(context)`
- `organizationJsonLd()`
- `websiteJsonLd()`
- `breadcrumbJsonLd(items)`
- `datasetJsonLd(input)`
- `profilePageJsonLd(input)`

Every public page should eventually use `getPageMetadata` or equivalent route-specific metadata that includes:

- title
- description
- canonical URL
- Open Graph title, description, image, URL
- Twitter card, title, description, image
- robots directive

## Structured Data

Current foundation:

- Organization JSON-LD in the root layout.
- WebSite and SearchAction JSON-LD in the root layout.
- Article JSON-LD on story pages.
- Profile-oriented JSON-LD on official profile pages.
- Helper functions for BreadcrumbList, Dataset, ProfilePage, and Organization objects.

Next build passes should add route-specific BreadcrumbList and Dataset JSON-LD to jurisdiction, school board, race, funding, vote, and public source pages after those pages stabilize.

## Dynamic Open Graph

Generic dynamic OG route:

- `/api/og?type=home`
- `/api/og?type=profile&id=...`
- `/api/og?type=official&id=...`
- `/api/og?type=agency&title=...`
- `/api/og?type=jurisdiction&title=...`
- `/api/og?type=race&id=...`
- `/api/og?type=school-board&title=...`
- `/api/og?type=story&id=...`
- `/api/og?type=source-packet&title=...`
- `/api/og?type=public-question&title=...`
- `/api/og?type=package-interest&title=...`
- `/api/og?type=methodology`

Existing specialized OG routes remain in place:

- `/api/og/official`
- `/api/og/news`
- `/api/og/race`
- `/api/og/school-board`

OG images use a 1200x630 dark civic-intelligence frame with RepWatchr branding, page-type label, entity title, jurisdiction/context, source count/status when available, source-node visual accents, and the line `Search. Grade. Source. Share.`

## Admin SEO Audit

Admin route:

- `/admin/seo`

The page shows:

- total sitemap URLs by type
- missing title count
- missing description count
- missing canonical count
- missing OG image count
- duplicate slug count
- noindex route families
- orphan/source-gap candidates
- source count by indexable profile
- low-completeness indexable pages
- sitemap generation status

This report is source/data-file driven and does not require Supabase credentials.

## Analytics Events

SEO and sharing-related events added to the analytics taxonomy:

- `seo_audit_opened`
- `sitemap_generated`
- `share_menu_open`
- `share_copy_link`
- `share_copy_snippet`
- `native_share_clicked`
- `social_share_clicked`
- `public_question_copied`

## Current Gaps

- The metadata utility is available, but some existing pages still use route-local metadata objects.
- Jurisdiction hub pages are intentionally excluded until they are built.
- Public source pages are intentionally excluded until dedicated public source pages exist.
- The SEO audit currently reports static lists and generated sitemap counts; it does not crawl rendered pages for runtime metadata.
- JSON-LD should be deepened on races, school boards, jurisdictions, datasets, funding, votes, and package FAQ pages in a future pass.
