# Texas elected-official profile checkpoint

Last updated: 2026-08-14

## Completed in this batch

Twenty-five active Texas House profiles were materially deepened without recreating their already-published identity and portrait work:

- HD-72 Drew Darby; HD-73 Carrie Isaac; HD-76 Suleman Lalani; HD-77 Vincent Perez; HD-78 Joe Moody.
- HD-79 Claudia Ordaz; HD-81 Brooks Landgraf; HD-82 Tom Craddick; HD-83 Dustin Burrows; HD-85 Stan Kitzman.
- HD-86 John T. Smithee; HD-87 Caroline Fairly; HD-88 Ken King; HD-89 Candy Noble; HD-92 Salman Bhojani.
- HD-93 Nate Schatzline; HD-94 Tony Tinderholt; HD-95 Nicole Collier; HD-96 David Cook; HD-97 John McQueeney.
- HD-98 Giovanni Capriglione; HD-99 Charlie Geren; HD-100 Venton Jones; HD-101 Chris Turner; HD-102 Ana-María Rodríguez Ramos.

All 25 were re-matched to the live Texas House roster, member pages, contact blocks, and committee pages on August 14. A prior address-import defect was also corrected for the full batch: every Capitol address now preserves `P.O. Box 12910, Austin, Texas 78711-2910` instead of truncating the ZIP code.

Voting-record coverage moved from `source_path_only` to `current`: every profile now discloses the exact indexed-position total, Yea/Nay/Present/Not Voting distribution, collection window, latest recorded vote date, 60 stored source-linked display rows, official Texas House vote-ledger path, field-level freshness, and a methodology warning that the totals are not attendance, ideology, constitutional, or performance scores. The current Supabase overlay independently contains 50 recent source-linked vote snapshots for each of the 25 profiles, with no missing source URLs.

The shared responsive RepWatchr dashboard/report-card system was reused without a design mutation. Existing compliant stored portraits were retained; all 25 pass the 500-pixel minimum-dimension gate without upscaling. No chart, grade, sentiment result, finance total, controversy, positive-work claim, or constitutional score was added without sufficient underlying evidence.

## Validation and production baseline

- The pre-change production baseline was Vercel deployment `dpl_6yfcLHwmWSqno4te3W5z1KQfCDXy`, READY on GitHub commit `2d701b593124a7463b1f52397b4b5963945531c8`.
- The August 14 Supabase enrichment run completed with 31,009 inserted items and zero errors.
- Supabase contains 81 update runs, 8,235 completion snapshots, 629 enrichment items, 27,670 vote snapshots, and 1,151 social-account records; RLS remains enabled on the profile-pipeline tables.
- The batch-specific static dossier, source-row, freshness, portrait-dimension, and complete-address smoke test passed for all 25 profiles.
- Live official-source verification passed for all 25 roster identities, member pages, Capitol contact blocks, and committee pages.

## Evidence deliberately not published

- Texas Ethics Commission filer identities and reporting periods were not individually matched. Campaign-finance totals, donors, industries/PACs, and expenditures remain `pending_review` rather than inferred.
- No positive-work claim was published without a dated primary record, measurable result, and independent context.
- No criticism or controversy was published without attribution, date, substantiation, context, and an official response when available.
- No constituent sentiment was synthesized without a disclosed collection window, platform/source mix, jurisdiction-confidence method, duplicate/bot filtering, sample size, and uncertainty.
- No constitutional-alignment score was assigned without cited official actions, a published rubric, applicable provisions, uncertainty, and a RepWatchr-analysis/non-legal-judgment disclaimer.

## Coverage inventory

- The repository contains 336 Texas-coded official profile records. This is a repository count, not a claim that every Texas elective office is covered.
- The statewide denominator remains open because county, municipal, school-district, special-district, and trial-court rosters have not yet been consolidated into one authoritative deduplicated registry. RepWatchr must not publish a false completion percentage until that registry exists.

## Remaining portrait/source deferrals

- Fourth Court of Appeals: Irene Rios (Place 6) and Lori I. Valenzuela (Place 7). Available portraits remain below the 500-pixel gate and were rejected rather than upscaled and mislabeled as HD.
- Fifth-through-Thirteenth Courts of Appeals: 25 current places remain portrait-gated after official court image retrieval was blocked and available alternates failed the 500-pixel minimum. The queue is Jessica Lewis, Bonnie Goldstein, Maricela Breedlove, Craig Smith, Mike Lee, Scott Stevens, Jeff Rambin, Charles van Cleef, Judy Parker, Laura Pratt, Maria Salas Mendoza, Gina Palafox, Lisa Soto, Scott Golemon, Leanne Johnson, Matt Johnson, Steven Lee Smith, John Bailey, Stacy Trotter, Bruce Williams, James Worthen, Clarissa Silva, Lionel Peña, Jon West, and Ysmael Fonseca.
- House HD-115 through HD-150: HD-119, HD-125, HD-126, HD-131, HD-133, HD-135, HD-136, HD-140, HD-142, HD-146, and HD-147.
- House HD-103 through HD-114: HD-103, HD-104, HD-112, and HD-113.
- Earlier House sequence: HD-2, HD-3, HD-17, HD-20, HD-22, HD-27, HD-29, HD-36, HD-37, HD-38, HD-39, HD-42, HD-51, HD-57, HD-58, HD-63, HD-68, HD-70, HD-74, HD-75, HD-80, HD-84, HD-90, and HD-91.
- State Board of Education: Districts 4, 11, 12, and 14 still need compliant stored portraits and the same evidence-depth conversion.
- Most remaining federal Texas profiles still use sub-500-pixel Clerk portraits and remain queued for official or properly licensed HD alternatives before depth completion.

## Next batch

Continue the House vote-depth sequence with the next 25 compliant profiles: HD-105 through HD-111, HD-114 through HD-118, HD-120 through HD-124, HD-127 through HD-130, HD-132, HD-134, HD-137, and HD-138. Continue the Fifth-through-Thirteenth Court places in court-and-place order as compliant portraits are found, then retry SBOE Districts 4, 11, 12, and 14. Preserve the identity, portrait, role-compatible record, source-ledger, freshness, finance, sentiment, controversy, and constitutional-analysis gates used in this release.
