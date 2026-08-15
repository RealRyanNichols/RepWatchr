# Texas elected-official profile checkpoint

Last updated: 2026-08-15

## Completed in this batch

Twenty-five active Texas House profiles were materially deepened without recreating their already-published identity and portrait work:

- HD-105 Terry Meza; HD-106 Jared Patterson; HD-107 Linda Garcia; HD-108 Morgan Meyer; HD-109 Aicha Davis.
- HD-110 Toni Rose; HD-111 Yvonne Davis; HD-114 John Bryant; HD-115 Cassandra Garcia Hernandez; HD-116 Trey Martinez Fischer.
- HD-117 Philip Cortez; HD-118 John Lujan; HD-120 Barbara Gervin-Hawkins; HD-121 Marc LaHood; HD-122 Mark Dorazio.
- HD-123 Diego M. Bernal; HD-124 Josey Garcia; HD-127 Charles Cunningham; HD-128 Briscoe Cain; HD-129 Dennis Paul.
- HD-130 Tom Oliverson; HD-132 Mike Schofield; HD-134 Ann Johnson; HD-137 Gene Wu; HD-138 Lacey Hull.

All 25 were re-matched to the current Texas House roster and their official member, contact, and committee paths on August 15. A prior address-import defect was corrected for the full batch: every Capitol address now preserves `P.O. Box 12910, Austin, Texas 78711-2910` instead of truncating the ZIP code.

Voting-record coverage moved from `source_path_only` to `current`: every profile now discloses the exact indexed-position total, Yea/Nay/Present/Not Voting distribution, collection window, latest recorded vote date, 60 stored source-linked display rows, official Texas House vote-ledger path, field-level freshness, and a methodology warning that the totals are not attendance, ideology, constitutional, or performance scores. The Supabase overlay independently contains 50 recent source-linked vote snapshots for each of these 25 profiles, with no missing source URLs.

The shared responsive RepWatchr dashboard/report-card system was reused without a design mutation. Existing compliant stored portraits were retained; all 25 pass the 500-pixel minimum-dimension gate without upscaling. No chart, grade, sentiment result, finance total, controversy, positive-work claim, or constitutional score was added without sufficient underlying evidence.

## Validation and production baseline

- The pre-change production baseline is Vercel deployment `dpl_ACmXPaTmhZD1GEUWPomZtciZQcZM`, READY on GitHub commit `3a2817b7eae30d105dba2b3ddea0c591daeec518`.
- The August 15 Supabase enrichment run completed with 31,014 inserted items and zero errors.
- Supabase contains 82 update runs, 8,235 completion snapshots, 634 enrichment items, 27,670 vote snapshots, and 1,151 social-account records; RLS remains enabled on all inspected public profile-pipeline tables.
- The batch-specific static dossier, source-row, freshness, portrait-dimension, and complete-address smoke test passed for all 25 profiles.
- The Next.js 16.2.3 production build passed TypeScript and generated 1,587 routes. All 25 profile and portrait routes passed locally; the broader route suite passed with only its previously documented gaps.
- Dossier, editorial-neutrality, static QA, public API, admin, and integrity regression checks passed.

## Evidence deliberately not published

- Texas Ethics Commission filer identities and reporting periods were not individually matched. Campaign-finance totals, donors, industries/PACs, and expenditures remain `pending_review` rather than inferred.
- No positive-work claim was published without a dated primary record, measurable result, and independent context.
- No criticism or controversy was published without attribution, date, substantiation, context, and an official response when available.
- No constituent sentiment was synthesized without a disclosed collection window, platform/source mix, jurisdiction-confidence method, duplicate/bot filtering, sample size, and uncertainty.
- No constitutional-alignment score was assigned without cited official actions, a published rubric, applicable provisions, uncertainty, and a RepWatchr-analysis/non-legal-judgment disclaimer.

## Coverage inventory

- The repository contains 336 Texas-coded official profile records. One hundred now carry the explicit `record_enriched` status; this is a depth marker, not a claim that the other records have no useful verified sourcing.
- The statewide denominator remains open because county, municipal, school-district, special-district, and trial-court rosters have not yet been consolidated into one authoritative deduplicated registry. RepWatchr must not publish a false completion percentage until that registry exists.

## Remaining portrait/source deferrals

- Fourth Court of Appeals: Irene Rios (Place 6) and Lori I. Valenzuela (Place 7). Available portraits remain below the 500-pixel gate and were rejected rather than upscaled and mislabeled as HD.
- Fifth-through-Thirteenth Courts of Appeals: 25 current places remain portrait-gated after official court image retrieval was blocked and available alternates failed the 500-pixel minimum. The queue is Jessica Lewis, Bonnie Goldstein, Maricela Breedlove, Craig Smith, Mike Lee, Scott Stevens, Jeff Rambin, Charles van Cleef, Judy Parker, Laura Pratt, Maria Salas Mendoza, Gina Palafox, Lisa Soto, Scott Golemon, Leanne Johnson, Matt Johnson, Steven Lee Smith, John Bailey, Stacy Trotter, Bruce Williams, James Worthen, Clarissa Silva, Lionel Peña, Jon West, and Ysmael Fonseca.
- House HD-115 through HD-150 portrait deferrals still apply to HD-119, HD-125, HD-126, HD-131, HD-133, HD-135, HD-136, HD-140, HD-142, HD-146, and HD-147.
- House HD-103 through HD-114 portrait deferrals still apply to HD-103, HD-104, HD-112, and HD-113.
- Earlier House portrait deferrals remain HD-2, HD-3, HD-17, HD-20, HD-22, HD-27, HD-29, HD-36, HD-37, HD-38, HD-39, HD-42, HD-51, HD-57, HD-58, HD-63, HD-68, HD-70, HD-74, HD-75, HD-80, HD-84, HD-90, and HD-91.
- State Board of Education Districts 4, 11, 12, and 14 still need compliant stored portraits and the same evidence-depth conversion.
- Most remaining federal Texas profiles still use sub-500-pixel Clerk portraits and remain queued for official or properly licensed HD alternatives before depth completion.

## Next batch

Finish the compliant House sequence with HD-139, HD-141, HD-143 through HD-145, and HD-148 through HD-150, then close the overlooked compliant House records HD-1, HD-4, and HD-5. Use the remaining capacity for the earliest deferred House districts whose official or properly licensed portraits clear the 500-pixel gate; if fewer than 25 House profiles clear that gate, continue with the next role-compatible appellate or SBOE records in the established office-and-place sequence. Preserve the identity, portrait, role-compatible record, source-ledger, freshness, finance, sentiment, controversy, and constitutional-analysis gates used in this release.
