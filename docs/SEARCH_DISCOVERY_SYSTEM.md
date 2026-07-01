# RepWatchr Search Discovery System

RepWatchr search is now treated as a product surface, not a simple text box. The goal is fast discovery, clean next clicks, and structured demand signals without exposing private/admin data.

## Public Surfaces

- `/search` is the public discovery page.
- `Cmd/Ctrl + K` opens the global command palette.
- Mobile next-action search opens the command palette through `repwatchr:open-command-palette`.
- Existing predictive search remains available through `/api/search/predictive` and the shared `PredictiveSearchBox`.

## Searchable Entities

The discovery layer supports:

- public officials
- elected officials
- appointed officials
- candidates
- law enforcement officials
- judges
- prosecutors
- agencies
- public bodies
- school boards
- jurisdictions
- races
- votes
- funding records
- stories
- public questions
- source URLs
- tools/pages
- package pages
- methodology/privacy/help pages

## Database

SQL file:

- `supabase-search-discovery.sql`

Tables:

- `search_index`
- `saved_searches`

`search_index` follows the requested fields:

- `id`
- `entity_type`
- `entity_id`
- `title`
- `subtitle`
- `body`
- `slug`
- `url`
- `state`
- `county`
- `city`
- `office_type`
- `office_level`
- `tags`
- `source_count`
- `completeness_score`
- `popularity_score`
- `watch_count`
- `share_count`
- `updated_at`
- `indexed_at`

Additional safety fields:

- `visibility`
- `status`
- `metadata`
- generated `search_vector`

Public search only reads rows where:

- `visibility = public`
- `status = active`

`saved_searches` supports the requested fields:

- `id`
- `user_id`
- `name`
- `query`
- `filters`
- `alert_enabled`
- `created_at`
- `updated_at`

It also preserves existing legacy fields used by the earlier predictive search system:

- `normalized_query`
- `title`
- `scope`
- `alert_frequency`
- `public_share_enabled`
- `share_id`
- `last_opened_at`

## RLS And Grants

RLS is enabled on both tables.

Public users can:

- select public active `search_index` rows

Authenticated users can:

- select public active `search_index` rows
- create, read, update, and delete their own saved searches

Admins can:

- manage the full search index
- manage saved searches for support/debugging

The SQL includes explicit grants for Supabase Data API access. This is required for current Supabase projects where new public-schema tables may not be exposed by default.

## Server API

Routes:

- `GET /api/search`
- `GET /api/search/predictive`
- `POST /api/search/save`
- `GET /api/search/save`
- `DELETE /api/search/save?id=...`
- `POST /api/search/track`

`GET /api/search` supports:

- query text
- entity type filters
- state
- county
- city
- office level
- office type
- source count minimum
- completeness minimum
- has votes
- has funding
- has source gaps
- correction requested
- recently updated
- popular
- watched
- public body type
- pagination
- sorting

Sort modes:

- relevance
- most viewed
- most watched
- most sourced
- recently updated
- source gaps
- completeness
- alphabetical

Fallback behavior:

- If Supabase admin env vars are missing, or `search_index` has not been migrated yet, `/api/search` falls back to the existing static predictive index.
- Static fallback uses `fuse.js` for typo-tolerant local matching.

## Components

Core files:

- `src/lib/search-discovery.ts`
- `src/app/api/search/route.ts`
- `src/components/search/SearchDiscovery.tsx`
- `src/components/search/CommandPalette.tsx`
- `src/app/search/page.tsx`

Exported UI concepts:

- `SearchPage`
- `SearchInput`
- `SearchFilters`
- `SearchResultCard`
- `SaveSearchButton`
- `NoSearchResultsCTA`
- `CommandPalette`
- `CommandResultRow`
- `SearchChip`

## Public Search Page

Sections:

- cinematic search hero
- large search input
- quick chips for Texas, Congress, Sheriffs, Judges, School Boards, Campaign Finance, Votes, Agencies, and Submit Missing Official
- filters panel
- list/map toggle
- useful map placeholder until enough geography exists
- result cards
- save search CTA
- no-result source submission CTA
- high-intent package interest CTA

Result cards show:

- title
- entity type
- office/jurisdiction context
- source count
- completeness label
- trust label
- watch button
- submit source button
- open profile/link button

## Command Palette

Shortcut:

- `Cmd/Ctrl + K`

Mobile:

- The mobile next-action Search button dispatches `repwatchr:open-command-palette`.

The command palette searches:

- officials
- agencies
- races
- stories
- sources
- pages/tools

Actions:

- Submit Source
- Build Packet
- Create Watchlist
- Request Correction
- Open Dashboard
- Open Admin when already in admin context
- Open Services
- Open Methodology
- Open Privacy
- Open Sources

Recent searches are stored locally. Saved account searches are handled through `/api/search/save`.

## Analytics

Added or wired events:

- `search_page_open`
- `search_query_started`
- `search_query_submitted`
- `search_filter_used`
- `search_sort_changed`
- `search_result_clicked`
- `search_no_results`
- `saved_search_created`
- `command_palette_open`
- `command_search_input`
- `command_result_clicked`
- `command_action_clicked`
- `command_no_result`

Search events update:

- analytics events
- visitor profiles
- interest graph scoring
- saved-search demand signals

Interest scoring examples:

- Texas search increases Texas interest.
- Sheriff search increases sheriff/public safety interest.
- Campaign finance search increases campaign-finance interest.
- Saved search creates a stronger signal than a passive search.

## Safety

Search does not expose:

- admin-only rows
- private dashboard data
- user watchlists
- private submissions
- raw visitor identities

Public results should not imply proof beyond the source label:

- `Source-backed`
- `Source-linked`
- `Needs source`
- `Under review`

No-result states tell users exactly what to do next instead of pretending RepWatchr already has the record.

## Remaining Build Work

1. Apply `supabase-search-discovery.sql` in Supabase.
2. Add an admin indexer that upserts officials, races, stories, sources, votes, funding records, and public bodies into `search_index`.
3. Add aggregate popular/trending search panels from `search_events`.
4. Add dashboard saved-search management.
5. Add command palette saved searches for authenticated users.
6. Add map data only after jurisdiction geocoding is reliable.
7. Add `/admin/search` index health reporting.
8. Add duplicate slug/entity detection for search index rows.
9. Add search result impression tracking if needed.
10. Add end-to-end browser smoke checks after dependencies run cleanly outside the Drive-backed checkout.
