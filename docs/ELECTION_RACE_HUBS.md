# RepWatchr Election Race Hubs

RepWatchr race hubs are source-first election pages. They are built to help voters find the official race record, candidate links, filings, finance sources, public questions, and source gaps without turning incomplete data into unsupported claims.

## Current Routes

- `/elections` - national election command center.
- `/elections/texas` - Texas election hub with statewide, East Texas, county, district, and school-board lanes.
- `/elections/texas/[raceSlug]` - canonical Texas race, county, or district hub.
- `/elections/[state]` - state alias route. Texas redirects to `/elections/texas`; unsupported states 404 until useful data exists.
- `/elections/[state]/[cycle]` - cycle alias route. Texas 2026 redirects to `/elections/texas`; unsupported cycles 404.
- `/elections/[state]/[cycle]/[raceSlug]` - cycle-scoped race route. Texas 2026 renders the canonical Texas race hub.
- `/races/[slug]` - short alias that redirects to the canonical Texas race, county, or district hub.
- `/compare/race/[raceSlug]` - candidate-comparison page for source-backed comparison fields.
- `/elections/texas/contribute` - public contribution form for race sources and election record packets.
- `/admin/races` - admin race desk for editing staged race rows.

## Public Page Sections

Each public race page should include:

- Race hero with office, jurisdiction, election date, source count, candidates, watch, share, and submit-source actions.
- Record summary that separates confirmed source links from missing records.
- Candidate cards with profile, campaign, funding, source count, and status labels.
- Candidate comparison table where available.
- Source trail grouped by official election, filing, campaign, finance, school-board/bond, story, profile, and reference links.
- Source gaps with direct submit-source actions.
- Public questions voters, reporters, or meeting speakers can copy.
- Safe share snippets that do not overstate proof.
- Package-interest links for Local Race Source Pack, Election Watch Desk, and Official Record Brief.
- Contribution history when public contributions exist.

## Data Model

Static race data currently lives in:

- `src/data/texas-election-races.ts`
- `src/lib/race-hub.ts`

The database-backed schema is defined in:

- `supabase-race-hub.sql`

Normalized tables:

- `races`
- `race_candidates`
- `race_sources`
- `race_public_questions`

Existing admin staging tables preserved for compatibility:

- `race_pages`
- `race_page_events`

## Race Types

Supported `race_type` values:

- `primary`
- `runoff`
- `general`
- `special`
- `local`
- `school_board`
- `judicial`
- `nonpartisan`
- `party_office`
- `ballot_measure`

## Safety Rules

- Do not score race pages ideologically unless the score is backed by a defined, documented methodology.
- Do not imply corruption from donations, endorsements, vendors, or associations.
- Do not publish candidate claims as verified unless the claim is tied to a public source.
- Do not publish private addresses, private family details, minor children, or harassment instructions.
- Use labels like `confirmed public record`, `source-backed`, `needs review`, `missing source`, or `public question`.
- Sparse or under-review race pages should be noindexed until useful.

## Admin Workflow

Admins should be able to:

- Create or edit a race.
- Add candidates.
- Attach official election, filing, finance, campaign, story, and public body sources.
- Mark source gaps.
- Publish, unpublish, archive, or noindex a race.
- Resolve corrections.
- Add public questions.
- Audit all changes.

## SEO

Index only useful public race pages. Include:

- Canonical race hubs.
- County and district hubs with real public value.
- Candidate-comparison pages where candidates or source links exist.

Exclude:

- Admin routes.
- Dashboard routes.
- API routes.
- Empty or under-review race pages.
- Alias routes that redirect to canonical pages.
- Duplicate filtered URLs.

Every useful race page should have:

- Dynamic metadata.
- Canonical URL.
- OG image URL.
- Breadcrumb JSON-LD.
- Dataset JSON-LD when the page is data-rich.
- Internal links to profiles, funding, school boards, services, and source submission.

## Analytics

Race hubs track:

- `race_hub_open`
- `race_candidate_clicked`
- `race_compare_open`
- `race_watch_clicked`
- `race_submit_source_clicked`
- `race_public_question_copied`
- `race_package_interest_clicked`
- `race_source_clicked`

## Next Build Moves

1. Load live race rows from Supabase when credentials are configured.
2. Add admin CRUD for the normalized `races` tables.
3. Add official election-source import adapters for Texas SOS, county election offices, and school districts.
4. Add reviewed campaign finance import links from FEC and Texas Ethics Commission sources.
5. Add noindex automation for sparse race rows.
6. Add richer OG images for each race and comparison page.
7. Add watchlist integration for race, county, and district hubs.
8. Add dashboard visibility for watched races and submitted race sources.
