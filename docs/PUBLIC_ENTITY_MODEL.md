# RepWatchr Universal Public Entity Model

RepWatchr is not only a politician database. It is a public-power profile system. The shared model must handle people, public bodies, courts, races, agencies, offices, school boards, law enforcement leadership, appointed officials, candidates, judges, prosecutors, and other public roles without mixing public accountability with private-life data.

The migration file is:

- `supabase-public-entity-model.sql`

## Purpose

The model gives RepWatchr one backbone for:

- Public official profiles.
- Candidate profiles.
- School board member profiles.
- Sheriffs, police chiefs, constables, prosecutors, judges, and court profiles.
- County, city, state, federal, school district, board, and commission profiles.
- Agencies, offices, races, public bodies, and institutions.
- Source counts, confidence labels, public/private boundaries, and profile completeness.
- Admin buildout, duplicate merge, source attachment, noindex, and review workflow later.

## Core Principle

Profile the person or entity in the public role. Do not profile private lives.

Every public profile should answer:

1. Who or what is this public-power entity?
2. What public role does it hold?
3. What jurisdiction does it affect?
4. What sources are attached?
5. What is confirmed?
6. What still needs source review?
7. What can a citizen do next?

## Tables

### `public_entities`

Universal root table for every person, public body, court, agency, office, race, or public-power entity.

Key fields:

- `slug`
- `display_name`
- `entity_type`
- `office_level`
- `jurisdiction_id`
- `parent_entity_id`
- `state_code`
- `county_name`
- `city_name`
- `profile_path`
- `primary_source_url`
- `source_count`
- `confidence_label`
- `public_boundary`
- `review_status`
- `index_status`
- `summary`
- `source_gap_summary`
- `tags`
- `metadata`

Use this table to decide whether a page is public, hidden, noindexed, source-backed, under review, or thin.

### `official_profiles`

Person-specific public-role fields for officials and candidates.

Key fields:

- `entity_id`
- `first_name`
- `middle_name`
- `last_name`
- `suffix`
- `party`
- `biography`
- `photo_url`
- `photo_source_url`
- `photo_credit`
- `official_website`
- `official_contact_url`
- `official_email`
- `official_phone`
- `public_office_address`
- `public_contact_kind`
- `vote_profile_status`
- `funding_profile_status`
- `score_profile_status`
- `correction_status`
- `source_notes`

Do not store private personal contact details here.

### `public_roles`

Connects an entity to the role it holds or seeks.

Examples:

- U.S. Senator for Texas.
- Texas House District 7.
- County Sheriff.
- District Attorney.
- School Board Trustee Place 4.
- Police Chief.
- Municipal Judge.
- Candidate for county commissioner.

Key fields:

- `entity_id`
- `jurisdiction_id`
- `agency_id`
- `role_title`
- `office_level`
- `office_type`
- `district`
- `seat`
- `selection_method`
- `term_start`
- `term_end`
- `is_current`
- `source_url`
- `confidence_label`
- `review_status`

### `jurisdictions`

Normalizes the government geography or authority layer.

Examples:

- United States
- Texas
- Nacogdoches County
- City of Longview
- Nacogdoches ISD
- 5th Court of Appeals
- Texas Ethics Commission

Key fields:

- `slug`
- `name`
- `jurisdiction_type`
- `state_code`
- `county_name`
- `city_name`
- `parent_jurisdiction_id`
- `official_url`
- `source_url`
- `source_count`
- `confidence_label`
- `status`

### `agencies`

Public body or office table.

Examples:

- Sheriff office.
- Police department.
- Election office.
- School district.
- Court.
- Board or commission.
- Public authority.

Key fields:

- `entity_id`
- `jurisdiction_id`
- `parent_agency_id`
- `slug`
- `name`
- `agency_type`
- `official_url`
- `public_contact_url`
- `official_phone`
- `official_email`
- `public_office_address`
- `source_count`
- `confidence_label`
- `status`

### `profile_completeness_snapshots`

Stores data completeness, not ideology.

Key fields:

- `entity_id`
- `profile_slug`
- `profile_name`
- `completeness_score`
- `completeness_label`
- `loaded_items`
- `missing_items`
- `source_gaps`
- `source_count`
- `confidence_label`
- `data_completeness_only`
- `notes`
- `calculated_at`

`data_completeness_only` is locked true by a database check. This prevents the completeness table from becoming a political score table.

## Entity Types

Supported `entity_type` values:

- `elected_official`
- `appointed_official`
- `candidate`
- `law_enforcement_official`
- `sheriff`
- `police_chief`
- `constable`
- `judge`
- `prosecutor`
- `district_attorney`
- `county_commissioner`
- `city_council_member`
- `mayor`
- `school_board_member`
- `state_legislator`
- `governor`
- `federal_legislator`
- `agency_head`
- `board_member`
- `commission_member`
- `public_body`
- `agency`
- `office`
- `race`
- `court`
- `other_public_role`

## Office Levels

Supported `office_level` values:

- `federal`
- `state`
- `county`
- `city`
- `school_district`
- `special_district`
- `court`
- `agency`
- `board`
- `commission`

## Confidence Labels

Use the same small vocabulary across profile, role, jurisdiction, agency, and completeness records:

- `official_record`
- `source_backed`
- `needs_source`
- `under_review`
- `disputed`

## Public Boundaries

`public_entities.public_boundary` controls whether an entity can be shown publicly:

- `public_role_only` - public person in public role; only role and public-source material belongs on page.
- `public_body` - agency, court, board, race, office, or public institution.
- `private_review` - not public yet; admin/research only.
- `redacted` - public page may exist, but sensitive fields must stay suppressed.

See `docs/PUBLIC_PROFILE_BOUNDARIES.md` for the full rulebook.

## Current Data Adaptation

Existing static data should be adapted, not thrown away.

### `src/data/officials/**/*.json`

Map to:

- `public_entities.slug` = `official.id`
- `public_entities.display_name` = `official.name`
- `public_entities.entity_type` = by role:
  - federal/state legislators -> `federal_legislator` or `state_legislator`
  - school-board level -> `school_board_member`
  - mayor -> `mayor`
  - otherwise `elected_official` or `other_public_role`
- `public_entities.office_level` = current `official.level` mapped from `school-board` to `school_district`
- `public_entities.state_code` = `official.state`
- `public_entities.profile_path` = `/officials/{official.id}` unless a more specific route exists
- `public_entities.primary_source_url` = first official source link or official website
- `public_entities.source_count` = `official.sourceLinks.length` plus attached source links
- `official_profiles` = name, party, biography, photo, official public contact fields
- `public_roles` = position, district, term, jurisdiction, source URL

### `src/data/texas-school-board-rosters.ts`

Map districts and board members into:

- `jurisdictions` with `jurisdiction_type = school_district`
- `agencies` with `agency_type = school_district`
- `public_entities` for board members
- `public_roles` for trustee seats, places, and terms

### `src/data/texas-election-races.ts`

Map races into:

- `public_entities.entity_type = race`
- `public_roles` for candidates where candidate entities exist
- source links for election filing, campaign, finance, and county election office records

### Existing Supabase Tables

Keep these tables and link them later:

- `source_submissions`
- `source_links`
- `official_timeline_events`
- `profile_completion_snapshots`
- `profile_enrichment_items`
- `profile_vote_snapshots`
- `profile_scorecard_votes`
- `member_watchlist_items`

The new model does not replace them. It gives them a shared entity target.

## Public Profile Requirements

Every universal profile page should be able to show:

- Name.
- Entity type.
- Office or role.
- Jurisdiction.
- Source count.
- Completeness score.
- Confidence label.
- Source gaps.
- Watch CTA.
- Share CTA.
- Submit source CTA.
- Submit correction CTA.
- Request review or official brief CTA when appropriate.

If the profile lacks enough source backing, show that plainly:

"This profile is source-seeded but not complete. Submit an official source, vote record, filing, meeting record, or correction."

## Completeness Rules

Completeness is data coverage only.

Suggested universal weighted checks:

| Key | Weight | Applies To |
| --- | ---: | --- |
| identity | 10 | all |
| public_role | 10 | people, offices, agencies |
| jurisdiction | 10 | all |
| primary_source | 15 | all |
| official_contact | 8 | officials, agencies |
| photo_or_logo | 7 | people, agencies, races where available |
| source_trail | 12 | all |
| timeline | 8 | all |
| votes_or_actions | 8 | officials, boards, courts, agencies where available |
| funding_or_financials | 6 | candidates, races, agencies where available |
| correction_path | 6 | all |

For non-applicable items, use an alternate key or mark the item not applicable. Do not reward or punish an agency for lacking candidate funding when funding is not relevant.

## Source Gap Examples

Source gaps should be specific:

- Missing official roster source.
- Missing term dates.
- Missing public office contact source.
- Missing official photo source.
- Missing current vote source.
- Missing campaign finance source.
- Missing public meeting record source.
- Missing court/agency source.
- Missing correction history.
- Missing timeline events.

## Admin Requirements

Admin screens should eventually support:

- Create/edit public entity.
- Create/edit official profile.
- Attach public role.
- Attach jurisdiction.
- Attach agency.
- Attach source link.
- Mark source gap.
- Mark noindex.
- Mark under review.
- Merge duplicate entities.
- Add internal admin note.
- Attach source submission to entity.
- Create completeness snapshot.
- Audit before/after values.

## Utilities

The server utility file is:

- `src/lib/public-entity-model.ts`

Required functions:

- `getPublicEntityBySlug(slug)`
- `getOfficialProfile(entityId)`
- `calculateProfileCompleteness(entityId)`
- `getProfileSourceGaps(entityId)`
- `incrementSourceCount(entityId)`
- `updateEntityLastUpdated(entityId)`

The utility also exposes pure helpers that can calculate completeness from static data during migration.

## Indexing Rules

Index a profile only when:

- `status = active`
- `index_status = indexable`
- `public_boundary` is `public_role_only` or `public_body`
- It has at least one source or a clear official public source path
- It does not expose private data

Noindex or hide:

- thin profiles with no source
- disputed profiles under active correction review
- private-review entities
- profiles with unresolved private data concerns

## Next Migration Steps

1. Apply `supabase-public-entity-model.sql` in Supabase.
2. Build an import script that reads `src/data/officials/**/*.json` and upserts `public_entities`, `official_profiles`, and `public_roles`.
3. Link `source_links.entity_type/entity_id` to `public_entities.id` over time.
4. Add `public_entity_id` columns to timeline/source/vote/funding tables in a later migration if direct UUID joins are needed.
5. Add admin profile editor screens on top of the new model.
6. Gradually move `/officials/[id]`, school board profiles, public-safety profiles, race pages, and agency pages to read from the universal model with static fallback.

This is the foundation. It makes RepWatchr expandable without letting public accountability drift into private-data exposure.
