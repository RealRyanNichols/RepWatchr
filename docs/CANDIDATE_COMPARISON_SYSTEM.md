# Candidate Comparison System

Candidate comparison pages show what public records are loaded for each candidate in a race. They are not endorsement pages, ideological scorecards, or accusation pages.

## Route

- `/compare/race/[raceSlug]`

The route currently supports source-backed Texas race slugs through `resolveTexasElectionSlug`.

## Public Components

The comparison page includes:

- Race comparison hero.
- Candidate record cards.
- Comparison table.
- Source-gap list.
- Submit-source CTA.
- Watch-race CTA.
- Share controls.
- Package-interest cards.

## Comparison Fields

The current static comparison table is built by `src/lib/race-hub.ts` from each race's candidate record lanes.

Allowed comparison fields should stay factual:

- Profile loaded.
- Candidate status.
- Party where publicly available.
- Incumbent/current officeholder status.
- Source count.
- Funding source availability.
- Campaign website availability.
- Filing source availability.
- Missing source status.

Do not add subjective fields unless a documented methodology exists.

## Candidate Records

Candidate cards may link to:

- Official profile.
- Campaign site.
- Funding page.
- Filing source.

Each candidate lane should distinguish:

- `incumbent_record_loaded`
- `candidate_record_loaded`
- `candidate_roster_needed`
- `source_review_needed`

## Neutral Language Rules

Use:

- "Source-backed comparison"
- "Needs source"
- "Candidate-controlled campaign link"
- "Official/source-linked record"
- "Public question"
- "Missing record"

Avoid:

- "Exposed"
- "Corrupt"
- "Bought"
- "Criminal"
- "Traitor"
- "Proven" unless the source and legal posture support it.

## Data Storage

The normalized schema is in `supabase-race-hub.sql`:

- `races`
- `race_candidates`
- `race_sources`
- `race_public_questions`

RLS rules allow public reads of active/published rows and admin-only management.

## Analytics

The comparison page tracks:

- `race_compare_open`
- `race_candidate_clicked`
- `race_watch_clicked`
- `race_submit_source_clicked`
- `race_package_interest_clicked`

Public questions copied from race hubs track:

- `race_public_question_copied`

## SEO

Comparison pages can be indexed when they contain real candidates or source links. They should noindex when:

- No candidate roster exists.
- No source links exist.
- The race is under review.
- The page exists only as a placeholder.

## Admin Requirements

Admin should eventually be able to:

- Add a candidate.
- Attach source links to a candidate.
- Mark a candidate as withdrawn, qualified, incumbent, or needs source.
- Add a source-backed comparison field.
- Add public questions.
- Mark incomplete rows as under review.
- Audit every change.

## Definition Of Ready

A comparison page is ready for public sharing when:

- Candidate roster source is present.
- Candidate links are labeled.
- Source gaps are visible.
- Public questions are safe and copyable.
- No unsupported claim is displayed as fact.
- There is a correction/source submission path.
