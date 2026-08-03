# Evidence quarantine — vote records and scorecards

**Date:** 2026-08-03
**Status:** Blocking. Do not publish the affected files.

## What was found

The six bill records in `src/data/votes/` describe legislation that does not match the
bill their own `sourceUrl` points to. Two were checked directly against the public record:

| File | Claimed title | What the cited source actually is |
|---|---|---|
| `hb-1750-property-tax.json` | "Texas Property Tax Relief and Reform Act" | TX HB 1750 (89R) is a hemp product regulation bill, sponsored by Rep. Jon Rosenthal, left in House Agriculture & Livestock committee |
| `sb-312-groundwater.json` | "Groundwater Conservation District Reform Act" | TX SB 312 (89R) concerns fiduciary responsibility of public retirement system governing bodies, investment managers and proxy advisors. Died in committee 2025-04-24 |

The remaining four (`hr-1192`, `hr-2847`, `s-890`, `sb-1045`) follow the same pattern: a
generic policy-sounding title, an `eastTexasImpact` narrative, and a real, well-formed
source URL that lends the record credibility without supporting it.

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
