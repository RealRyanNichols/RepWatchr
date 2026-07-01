# RepWatchr Public Data Source Registry

This registry defines the public-data sources RepWatchr can prepare for import. A source being registered does not mean its data is complete, verified, or public-facing. It means RepWatchr knows how the source should be reviewed and mapped.

## Registry Table

| Source key | Source | Records | Key needed | Current mode | Public use |
|---|---|---|---|---|---|
| `fec` | Federal Election Commission | federal candidates, committees, receipts, disbursements, filings | `FEC_API_KEY` | stubbed provider | Campaign finance imports after source mapping |
| `congress_gov` | Congress.gov | federal members, bills, actions, committees, roll-call metadata where available | `CONGRESS_API_KEY` | stubbed provider | Federal profile/vote/bill enrichment after mapping |
| `openstates` | Open States | state legislators, bills, votes, committees, events | `OPENSTATES_API_KEY` | stubbed provider | State profile/vote enrichment after mapping |
| `texas_ethics_commission` | Texas Ethics Commission | Texas finance/ethics exports and filings | none | manual/file-ready | Manual review first |
| `local_manual_sources` | Local manual sources | county elections, school boards, city minutes, agency pages, court/public records pages, packets | none | active manual adapter | Source submission and packet review |

## Database Tables

`supabase-data-import-adapters.sql` creates:

- `data_sources`
- `data_source_fields`
- `import_runs`
- `import_errors`

`import_runs` and `import_errors` may already exist from the admin dashboard migration. The adapter SQL keeps the same model and adds the source registry and field map.

## Data Source Fields

`data_source_fields` maps external source fields into normalized RepWatchr fields.

Examples:

- FEC `candidate_id` -> `external_id`
- Congress.gov `bioguideId` -> `external_id`
- Open States `person_id` -> `external_id`
- TEC `amount` -> `amount`
- Local manual `source_url` -> `source_url`

## API Key Rules

- Keys are server-only.
- Do not create `NEXT_PUBLIC_*` versions.
- Admin pages show only configured/missing status.
- Missing keys must not break the site.
- Missing keys must not produce noisy public copy.

## Import Statuses

Use import run statuses:

- `queued`
- `running`
- `succeeded`
- `partial`
- `failed`
- `canceled`

Imported profile, vote, and funding data should begin as:

- `imported_needs_review`

Only admin-reviewed records should become:

- `active`

## Source Confidence

Use:

- `source_backed` when the source URL and record mapping are clear.
- `imported_needs_review` when data came from a public source but has not been reviewed.

Do not use imported records to create red flags, allegations, or score changes until the source and methodology path are reviewed.

## Local Manual Sources

Manual sources include:

- county election pages
- county candidate filings
- school board agendas
- school board minutes
- city council minutes
- county commissioners minutes
- law enforcement public information pages
- court/public records portals
- uploaded public-record packets

The right first workflow is:

1. Submit source.
2. Build packet.
3. Admin review.
4. Attach to entity.
5. Publish with label and correction path.
