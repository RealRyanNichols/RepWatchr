# Texas elected-official profile checkpoint

Last updated: 2026-08-18

## Completed in this batch

Twenty-five active Texas profiles were materially deepened without duplicating the 150 Texas records already carrying the explicit `record_enriched` depth marker:

- Texas House: HD-2 Brent Money; HD-3 Cecil Bell Jr.; HD-27 Ron Reynolds; HD-57 Richard Hayes; HD-58 Helen Kerwin; HD-112 Angie Chen Button.
- U.S. House: TX-19 Jodey C. Arrington; TX-20 Joaquin Castro; TX-21 Chip Roy; TX-22 Troy E. Nehls; TX-24 Beth Van Duyne.
- U.S. House: TX-25 Roger Williams; TX-26 Brandon Gill; TX-27 Michael Cloud; TX-28 Henry Cuellar; TX-29 Sylvia R. Garcia.
- U.S. House: TX-30 Jasmine Crockett; TX-31 John R. Carter; TX-32 Julie Johnson; TX-33 Marc A. Veasey; TX-34 Vicente Gonzalez.
- U.S. House: TX-35 Greg Casar; TX-36 Brian Babin; TX-37 Lloyd Doggett; TX-38 Wesley Hunt.

The six state profiles were re-matched to the current official Texas House roster and official member, contact, biography, committee, authored-bill, sponsored-bill, and vote-ledger paths on August 18. Each has 4,507 indexed House positions and 60 stored source-linked display rows.

The nineteen federal profiles were re-matched to the current U.S. House Clerk roster by Bioguide identity. Current office, party, district, contact channels, committee assignments, term dates, official vote paths, Congress.gov legislation paths, FEC disclosure paths, and official or properly licensed Commons portrait provenance were refreshed on August 18. Each has 221 indexed roll-call positions and 24 stored source-linked display rows. TX-23 was not added because the official Clerk vacancy record confirms that the seat has been vacant since Tony Gonzales resigned on April 14, 2026.

All 25 stored portraits clear the 500-pixel minimum-dimension gate without upscaling. Each delivery image carries source, source page and file, credit/artist, license or public-domain status, dimensions, byte count, and freshness metadata. Large originals were downscaled to a maximum 1,600-pixel edge for reliable delivery; smaller sources were never enlarged.

The shared responsive RepWatchr dashboard/report-card system was reused without a design mutation, so no Figma change was required. No chart, grade, sentiment result, finance total, controversy, positive-work claim, or constitutional score was added without sufficient underlying evidence.

## Validation and production baseline

- The pre-change production baseline is Vercel deployment `dpl_6UG9hYCySczpomFwjfTESXdXFGZc`, READY on GitHub commit `d69681415bb754852801a3aef11a12c8a516b25a`.
- The tested 25-profile source batch is published through the protected main-branch workflow; the exact deployment and live-route results are recorded in the completion report.
- Supabase project `rgxboswrinsuakxqstyc` is `ACTIVE_HEALTHY` on Postgres 17.6.1. The inspected public profile-pipeline tables retain RLS, including 85 update runs, 8,235 completion snapshots, 649 enrichment items, 27,670 vote snapshots, and 1,151 social-account records.
- The latest inspected profile update run, `f65dba16-4e38-40ea-9cd0-c90af15f14da`, completed on August 18 with 31,015 inserts and zero errors.
- The Supabase overlay has 50 current source-linked vote snapshots for each state profile and 36 for each federal profile in this batch, with zero missing source URLs.
- The batch-specific identity, dossier, source-ledger freshness, record-row, portrait-dimension, complete-address, and unsupported-analysis-gate smoke test passed for all 25 profiles. The production build and TypeScript check passed with 1,596 generated routes; all 25 local profile routes and all 25 local portrait routes returned HTTP 200.
- Local production-build, regression, route, production-deployment, and post-deploy results are recorded in the release commit and completion report for this batch.

## Evidence deliberately not published

- Campaign-finance totals, donors, industries/PACs, expenditures, and reporting periods remain `pending_review` until the relevant Texas Ethics Commission or FEC records are individually matched and reconciled.
- No positive-work claim was published without a dated primary record, measurable result, and independent context.
- No criticism or controversy was published without attribution, date, substantiation, context, and an official response when available.
- No constituent sentiment was synthesized without a disclosed collection window, platform/source mix, jurisdiction-confidence method, duplicate/bot filtering, sample size, and uncertainty.
- No constitutional-alignment score was assigned without cited official actions, a published rubric, applicable provisions, uncertainty, and a RepWatchr-analysis/non-legal-judgment disclaimer.

## Coverage inventory

- The repository contains 336 Texas-coded official profile records. One hundred seventy-five now carry the explicit `record_enriched` status: 141 active Texas House members and 34 active U.S. House members. This is a depth marker, not a claim that the other records have no useful verified sourcing.
- The Texas House sequence is now 141 of 150 at record-enriched depth. The remaining nine House records are portrait-gated or require an equivalent source-quality conversion.
- Thirty-four of the 37 currently occupied Texas U.S. House seats now carry the explicit depth marker. TX-1, TX-12, and TX-18 retain useful August 13 sourcing but still need the same record-depth conversion. TX-23 remains correctly excluded from active-officeholder coverage while vacant.
- The statewide denominator remains open because county, municipal, school-district, special-district, and trial-court rosters have not yet been consolidated into one authoritative deduplicated registry. RepWatchr must not publish a false statewide completion percentage until that registry exists.

## Remaining portrait/source deferrals

- Texas House: HD-22, HD-36, HD-38, HD-42, HD-113, HD-131, HD-135, HD-140, and HD-142.
- Fourth Court of Appeals: Irene Rios (Place 6) and Lori I. Valenzuela (Place 7). Available portraits remain below the 500-pixel gate and were rejected rather than upscaled and mislabeled as HD.
- Fifth-through-Thirteenth Courts of Appeals: 25 current places remain portrait-gated after official court image retrieval was blocked and available alternates failed the 500-pixel minimum. The queue is Jessica Lewis, Bonnie Goldstein, Maricela Breedlove, Craig Smith, Mike Lee, Scott Stevens, Jeff Rambin, Charles van Cleef, Judy Parker, Laura Pratt, Maria Salas Mendoza, Gina Palafox, Lisa Soto, Scott Golemon, Leanne Johnson, Matt Johnson, Steven Lee Smith, John Bailey, Stacy Trotter, Bruce Williams, James Worthen, Clarissa Silva, Lionel Peña, Jon West, and Ysmael Fonseca.
- State Board of Education Districts 4, 11, 12, and 14 still need compliant stored portraits and the same evidence-depth conversion.
- The remaining federal Texas district sequence remains queued for current Clerk identity/contact/committee verification, role-compatible records, and official or properly licensed HD portraits, while preserving earlier completed work.

## Next batch

Retry the nine remaining House districts in district order against official, legislative-caucus, or properly attributed high-resolution portrait sources. Do not upscale a sub-500-pixel source. Convert TX-1, TX-12, and TX-18 to the same record-enriched federal depth, then continue with the established appellate court/place and State Board of Education queues. Preserve the identity, portrait, role-compatible record, source-ledger, freshness, finance, sentiment, controversy, and constitutional-analysis gates used in this release.
