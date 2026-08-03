# Evidence quarantine — vote records and scorecards

**Date:** 2026-08-03
**Status:** Blocking. Do not publish the affected files.

## What was found

The six bill records in `src/data/votes/` describe legislation that does not match the
bill their own `sourceUrl` points to. Two were checked directly against the public record:

| File | Claimed title | What the cited source actually is |
|---|---|---|
| `hb-1750-property-tax.json` | "Texas Property Tax Relief and Reform Act" | TX HB 1750 (89R) regulates the processing, manufacture and sale of hemp products for smoking. Sponsored by Rep. Jon Rosenthal (D). Referred to House Agriculture & Livestock |
| `sb-312-groundwater.json` | "Groundwater Conservation District Reform Act" | TX SB 312 (89R) concerns fiduciary responsibility of public retirement system governing bodies, investment managers and proxy advisors. Died in committee 2025-04-24 |
| `sb-1045-transparency.json` | "Government Transparency and Open Meetings Reform Act" | TX SB 1045 (89R) requires a state agency to grant an opportunity for a public hearing before adopting certain rules. **Died in committee 2025-03-11** — there was no floor roll call, so the recorded member votes cannot exist |
| `hr-2847-water-resources.json` | "Water Resources Development Act of 2025" | H.R. 2847 (119th) is the **Vote at Home Act of 2025** |
| `s-890-tax-reform.json` | "State and Local Tax Fairness Act of 2025" | S. 890 (119th) is the **Choice in Affordable Housing Act of 2025** |
| `hr-1192-property-rights.json` | "Private Property Rights Protection Act of 2025" | H.R. 1192 (119th) ensures Big Cypress National Preserve may not be designated as wilderness |

All six were checked. Not one matches its cited source.

Every record follows the same pattern: a generic policy-sounding title, an
`eastTexasImpact` narrative, and a real, well-formed source URL that lends the record
credibility without supporting it. `sb-1045` is the closest to plausible — its subject is
at least transparency-adjacent — and it is still disqualifying, because the bill died in
committee and never received the floor vote its `votes` array records.

## Why this is the highest-severity issue in the repo

Each of these files carries a `votes` array attributing specific yea/nay positions to
**named, living public officials** — Jay Dean, Bryan Hughes, Robert Nichols, Ted Cruz,
John Cornyn, Nathaniel Moran. The six scorecards in `src/data/scores/` then convert those
attributed votes into letter grades on those same officials.

A fabricated roll-call vote attributed to a named official, published under a source link
that appears to corroborate it, is the single worst failure mode this platform has. It is
the exact opposite of what RepWatchr exists to do, and it is defamation exposure.

## What was done

All 12 files (6 bills, 6 scorecards) set to `reviewStatus: "needs_source_review"` with a
`reviewNote` recording the finding. The publish gate in `src/lib/data.ts` keeps them out of
`getAllBills()` and `getAllScoreCards()`, so `/scorecards`, `/scorecards/[category]`, and
`/votes` render their empty states rather than this content.

An earlier pass in this same session had set these to `verified` on the assumption that a
well-formed source URL implied a checked record. That was wrong and is reverted here. A
source URL being reachable is not evidence that it says what the record claims it says.

## What has to happen before any of this can publish

1. Do not repair these files in place. Re-derive each record from the primary source.
2. For Texas: pull from Texas Legislature Online roll-call records
   (`scripts/import-texas-legislature-vote-records.py` already exists for this).
3. For federal: pull from House Clerk and Senate LIS roll-call XML
   (`scripts/import-federal-vote-records.py` already exists for this).
4. Verify that every `officialId` in a `votes` array actually appears in that roll call, and
   that the recorded position matches.
5. Only then set a published review status, and record who checked it.

## Standing rule this establishes

A record is not source-backed because it carries a URL. It is source-backed when someone
opened the source and confirmed it says what the record claims. Automated imports that
write source URLs must mark records `source_seeded`, never `verified`.
