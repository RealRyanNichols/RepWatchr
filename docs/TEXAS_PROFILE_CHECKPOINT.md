# Texas elected-official profile checkpoint

Last updated: 2026-08-16

## Completed in this batch

Twenty-five active Texas House profiles were materially deepened without duplicating the 100 House records already carrying the explicit `record_enriched` depth marker:

- HD-1 Gary VanDeaver; HD-4 Keith Bell; HD-5 Cole Hefner; HD-17 Stan Gerdes; HD-29 Jeff Barry.
- HD-37 Janie Lopez; HD-51 Lulu Flores; HD-63 Benjamin Bumgarner; HD-68 David Spiller; HD-70 Mihaela Plesa.
- HD-74 Eddie Morales; HD-75 Mary E. González; HD-80 Don McLaughlin; HD-84 Carl H. Tepper; HD-90 Ramon Romero Jr.
- HD-91 David Lowe; HD-104 Jessica González; HD-139 Charlene Ward Johnson; HD-141 Senfronia Thompson; HD-143 Ana Hernandez.
- HD-144 Mary Ann Perez; HD-145 Christina Morales; HD-148 Penny Morales Shaw; HD-149 Hubert Vo; HD-150 Valoree Swanson.

All 25 were re-matched to the current official Texas House roster and their official member, contact, biography, and committee paths on August 16. Full roster names were retained, including middle initials and suffixes where the official roster supplies them. Every Capitol address preserves `P.O. Box 12910, Austin, Texas 78711-2910`.

Fourteen earlier portrait deferrals cleared the 500-pixel minimum-dimension gate without upscaling: HD-17, HD-29, HD-37, HD-51, HD-63, HD-68, HD-70, HD-74, HD-75, HD-80, HD-84, HD-90, HD-91, and HD-104. Each stored delivery image carries source, credit, rights/provenance, source-page, source-file, dimensions, byte count, and freshness metadata. Large originals were downscaled to a maximum 1,600-pixel edge for reliable delivery; smaller sources were never enlarged.

Voting-record coverage moved to `current`: every profile discloses the exact indexed-position total, Yea/Nay/Present/Not Voting distribution, collection window, latest recorded vote date, 60 stored source-linked display rows, the official Texas House vote-ledger path, field-level freshness, and a methodology warning that the totals are not attendance, ideology, constitutional, or performance scores. The Supabase overlay independently contains 50 recent source-linked vote snapshots for every profile in this batch, all through September 3, 2025, with zero missing source URLs.

The shared responsive RepWatchr dashboard/report-card system was reused without a design mutation, so no Figma change was required. No chart, grade, sentiment result, finance total, controversy, positive-work claim, or constitutional score was added without sufficient underlying evidence.

## Validation and production baseline

- The pre-change production baseline is Vercel deployment `dpl_5GeNuYZyiLnydUmKwmjeGu8jpW7p`, READY on GitHub commit `dc52ad1d0df0ff24787cc5fcda1927f74ff475cb`.
- Supabase project `rgxboswrinsuakxqstyc` is `ACTIVE_HEALTHY` on Postgres 17.6.1. The inspected public tables retain RLS, including 83 update runs, 8,235 completion snapshots, 639 enrichment items, 27,670 vote snapshots, and 1,151 social-account records.
- The batch-specific dossier, source-ledger freshness, record-row, portrait-dimension, complete-address, and unsupported-analysis-gate smoke test passed for all 25 profiles.
- Current official roster, member-page, contact, and committee verification passed for all 25 profiles against live Texas House sources on August 16.
- The Next.js 16.2.3 production build passed TypeScript and generated 1,590 routes. All 25 profile and portrait routes passed locally; the broader route suite passed with only its documented known gaps.
- Official-dossier, editorial-neutrality, static QA, public API, admin, integrity, and officials-search regression checks passed.

## Evidence deliberately not published

- Texas Ethics Commission filer identities and reporting periods were not individually matched. Campaign-finance totals, donors, industries/PACs, expenditures, and reporting periods remain `pending_review` rather than inferred.
- No positive-work claim was published without a dated primary record, measurable result, and independent context.
- No criticism or controversy was published without attribution, date, substantiation, context, and an official response when available.
- No constituent sentiment was synthesized without a disclosed collection window, platform/source mix, jurisdiction-confidence method, duplicate/bot filtering, sample size, and uncertainty.
- No constitutional-alignment score was assigned without cited official actions, a published rubric, applicable provisions, uncertainty, and a RepWatchr-analysis/non-legal-judgment disclaimer.
- The 2026 general-election cycle is disclosed. An exact individual House term-end date remains labeled pending source review rather than guessed.

## Coverage inventory

- The repository contains 336 Texas-coded official profile records. One hundred twenty-five now carry the explicit `record_enriched` status, all of them active Texas House members. This is a depth marker, not a claim that the other records have no useful verified sourcing.
- The House sequence is now 125 of 150 at record-enriched depth. The remaining 25 House records are portrait-gated or require an equivalent source-quality conversion.
- The statewide denominator remains open because county, municipal, school-district, special-district, and trial-court rosters have not yet been consolidated into one authoritative deduplicated registry. RepWatchr must not publish a false statewide completion percentage until that registry exists.

## Remaining portrait/source deferrals

- Texas House: HD-2, HD-3, HD-20, HD-22, HD-27, HD-36, HD-38, HD-39, HD-42, HD-57, HD-58, HD-103, HD-112, HD-113, HD-119, HD-125, HD-126, HD-131, HD-133, HD-135, HD-136, HD-140, HD-142, HD-146, and HD-147.
- Fourth Court of Appeals: Irene Rios (Place 6) and Lori I. Valenzuela (Place 7). Available portraits remain below the 500-pixel gate and were rejected rather than upscaled and mislabeled as HD.
- Fifth-through-Thirteenth Courts of Appeals: 25 current places remain portrait-gated after official court image retrieval was blocked and available alternates failed the 500-pixel minimum. The queue is Jessica Lewis, Bonnie Goldstein, Maricela Breedlove, Craig Smith, Mike Lee, Scott Stevens, Jeff Rambin, Charles van Cleef, Judy Parker, Laura Pratt, Maria Salas Mendoza, Gina Palafox, Lisa Soto, Scott Golemon, Leanne Johnson, Matt Johnson, Steven Lee Smith, John Bailey, Stacy Trotter, Bruce Williams, James Worthen, Clarissa Silva, Lionel Peña, Jon West, and Ysmael Fonseca.
- State Board of Education Districts 4, 11, 12, and 14 still need compliant stored portraits and the same evidence-depth conversion.
- Most remaining federal Texas profiles still use sub-500-pixel Clerk portraits and remain queued for official or properly licensed HD alternatives before depth completion.

## Next batch

Retry the remaining House districts in district order against official, legislative-caucus, or properly attributed high-resolution portrait sources. Do not upscale a sub-500-pixel source. If fewer than 25 House records clear the portrait gate, use the remaining capacity for the next role-compatible appellate or State Board of Education records in established court/place or district order. Preserve the identity, portrait, role-compatible record, source-ledger, freshness, finance, sentiment, controversy, and constitutional-analysis gates used in this release.
