# Texas elected-official profile checkpoint

Last updated: 2026-08-17

## Completed in this batch

Twenty-five active Texas profiles were materially deepened without duplicating the 125 Texas House records already carrying the explicit `record_enriched` depth marker:

- Texas House: HD-20 Terry Wilson; HD-39 Armando "Mando" Martinez; HD-103 Rafael Anchía; HD-119 Liz Campos; HD-125 Ray Lopez.
- Texas House: HD-126 Sam Harless; HD-133 Mano DeAyala; HD-136 John H. Bucy; HD-146 Lauren Ashley Simmons; HD-147 Jolanda "Jo" Jones.
- U.S. House: TX-2 Dan Crenshaw; TX-3 Keith Self; TX-4 Pat Fallon; TX-5 Lance Gooden; TX-6 Jake Ellzey.
- U.S. House: TX-7 Lizzie Fletcher; TX-8 Morgan Luttrell; TX-9 Al Green; TX-10 Michael McCaul; TX-11 August Pfluger.
- U.S. House: TX-13 Ronny Jackson; TX-14 Randy Weber; TX-15 Monica De La Cruz; TX-16 Veronica Escobar; TX-17 Pete Sessions.

The ten state profiles were re-matched to the current official Texas House roster and official member, contact, biography, committee, authored-bill, sponsored-bill, and vote-ledger paths on August 17. Each has 4,507 indexed House positions and 60 stored source-linked display rows.

The fifteen federal profiles were re-matched to the current U.S. House Clerk roster by Bioguide identity. Current office, party, district, contact channels, committee assignments, term dates, official vote paths, Congress.gov legislation paths, FEC disclosure paths, and official or properly licensed Commons portrait provenance were refreshed on August 17. Each has 221 indexed roll-call positions and 24 stored source-linked display rows.

All 25 stored portraits clear the 500-pixel minimum-dimension gate without upscaling. Each delivery image carries source, source page and file, credit/artist, license or public-domain status, dimensions, byte count, and freshness metadata. Large originals were downscaled to a maximum 1,600-pixel edge for reliable delivery; smaller sources were never enlarged.

The shared responsive RepWatchr dashboard/report-card system was reused without a design mutation, so no Figma change was required. No chart, grade, sentiment result, finance total, controversy, positive-work claim, or constitutional score was added without sufficient underlying evidence.

## Validation and production baseline

- The pre-change production baseline is Vercel deployment `dpl_BmbEg3dVoPAEp1hxvS67YdMJLC4X`, READY on GitHub commit `01f27c46c7a3536d1e66d392235a41df20f88cb0`.
- The tested 25-profile source batch is published through the protected main-branch workflow; the exact deployment and live-route results are recorded in the completion report.
- Supabase project `rgxboswrinsuakxqstyc` is `ACTIVE_HEALTHY` on Postgres 17.6.1. The inspected public profile-pipeline tables retain RLS, including 84 update runs, 8,235 completion snapshots, 643 enrichment items, 27,670 vote snapshots, and 1,151 social-account records.
- The latest inspected profile update run, `0ebd63f9-4047-4f92-9ba0-868efc6087aa`, completed on August 17 with 31,013 inserts and zero errors.
- The Supabase overlay has 50 current source-linked vote snapshots for each state profile and 36 for each federal profile in this batch, with zero missing source URLs.
- The batch-specific identity, dossier, source-ledger freshness, record-row, portrait-dimension, complete-address, and unsupported-analysis-gate smoke test passed for all 25 profiles.
- Local production-build, regression, route, production-deployment, and post-deploy results are recorded in the release commit and completion report for this batch.

## Evidence deliberately not published

- Campaign-finance totals, donors, industries/PACs, expenditures, and reporting periods remain `pending_review` until the relevant Texas Ethics Commission or FEC records are individually matched and reconciled.
- No positive-work claim was published without a dated primary record, measurable result, and independent context.
- No criticism or controversy was published without attribution, date, substantiation, context, and an official response when available.
- No constituent sentiment was synthesized without a disclosed collection window, platform/source mix, jurisdiction-confidence method, duplicate/bot filtering, sample size, and uncertainty.
- No constitutional-alignment score was assigned without cited official actions, a published rubric, applicable provisions, uncertainty, and a RepWatchr-analysis/non-legal-judgment disclaimer.

## Coverage inventory

- The repository contains 336 Texas-coded official profile records. One hundred fifty now carry the explicit `record_enriched` status: 135 active Texas House members and 15 active U.S. House members. This is a depth marker, not a claim that the other records have no useful verified sourcing.
- The Texas House sequence is now 135 of 150 at record-enriched depth. The remaining 15 House records are portrait-gated or require an equivalent source-quality conversion.
- The statewide denominator remains open because county, municipal, school-district, special-district, and trial-court rosters have not yet been consolidated into one authoritative deduplicated registry. RepWatchr must not publish a false statewide completion percentage until that registry exists.

## Remaining portrait/source deferrals

- Texas House: HD-2, HD-3, HD-22, HD-27, HD-36, HD-38, HD-42, HD-57, HD-58, HD-112, HD-113, HD-131, HD-135, HD-140, and HD-142.
- Fourth Court of Appeals: Irene Rios (Place 6) and Lori I. Valenzuela (Place 7). Available portraits remain below the 500-pixel gate and were rejected rather than upscaled and mislabeled as HD.
- Fifth-through-Thirteenth Courts of Appeals: 25 current places remain portrait-gated after official court image retrieval was blocked and available alternates failed the 500-pixel minimum. The queue is Jessica Lewis, Bonnie Goldstein, Maricela Breedlove, Craig Smith, Mike Lee, Scott Stevens, Jeff Rambin, Charles van Cleef, Judy Parker, Laura Pratt, Maria Salas Mendoza, Gina Palafox, Lisa Soto, Scott Golemon, Leanne Johnson, Matt Johnson, Steven Lee Smith, John Bailey, Stacy Trotter, Bruce Williams, James Worthen, Clarissa Silva, Lionel Peña, Jon West, and Ysmael Fonseca.
- State Board of Education Districts 4, 11, 12, and 14 still need compliant stored portraits and the same evidence-depth conversion.
- The remaining federal Texas district sequence remains queued for current Clerk identity/contact/committee verification, role-compatible records, and official or properly licensed HD portraits, while preserving earlier completed work.

## Next batch

Retry the 15 remaining House districts in district order against official, legislative-caucus, or properly attributed high-resolution portrait sources. Do not upscale a sub-500-pixel source. Use remaining capacity for the next not-yet-enriched federal Texas districts in district order, then continue with the established appellate court/place and State Board of Education queues. Preserve the identity, portrait, role-compatible record, source-ledger, freshness, finance, sentiment, controversy, and constitutional-analysis gates used in this release.
