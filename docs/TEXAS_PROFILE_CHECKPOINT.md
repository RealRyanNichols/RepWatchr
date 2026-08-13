# Texas elected-official profile checkpoint

Last updated: 2026-08-13

## Completed in this batch

Twenty-five active Texas House profiles were materially deepened without recreating their already-published identity and portrait work:

- HD-40 Terry Canales; HD-41 R.D. "Bobby" Guerra; HD-43 J. M. Lozano; HD-44 Alan Schoolcraft; HD-45 Erin Zwiener.
- HD-46 Sheryl Cole; HD-47 Vikki Goodwin; HD-48 Donna Howard; HD-49 Gina Hinojosa; HD-50 James Talarico.
- HD-52 Caroline Harris Davila; HD-53 Wes Virdell; HD-54 Brad Buckley; HD-55 Hillary Hickland; HD-56 Pat Curry.
- HD-59 Shelby Slawson; HD-60 Mike Olcott; HD-61 Keresa Richardson; HD-62 Shelley Luther; HD-64 Andy Hopper.
- HD-65 Mitch Little; HD-66 Matt Shaheen; HD-67 Jeff Leach; HD-69 James Frank; HD-71 Stan Lambert.

All 25 were re-matched to the current official Texas House roster on August 13. Their previously truncated biography excerpts were replaced with concise neutral summaries derived from official House member and committee pages.

Voting-record coverage moved from `source_path_only` to `current`: every profile now discloses the exact indexed-position total, Yea/Nay/Present/Not Voting distribution, collection window, latest recorded vote date, 60 stored source-linked display rows, official Texas House vote-ledger path, field-level freshness, and a methodology warning that the totals are not attendance, ideology, constitutional, or performance scores. Supabase independently contains 50 recent source-linked vote snapshots for each of the 25 profiles.

The shared responsive RepWatchr dashboard/report-card system was reused without a design mutation. Existing compliant stored portraits were retained; all 25 pass the 500-pixel minimum-dimension gate without upscaling. No chart, grade, sentiment result, finance total, or constitutional score was added without sufficient underlying data.

## Evidence deliberately not published

- Texas Ethics Commission, local campaign-filing, and FEC filer identities/reporting periods were not individually matched. No campaign totals, donors, industries/PACs, or expenditures were inferred.
- No positive-work claim was published without a dated primary record, measurable result, and independent context.
- No criticism or controversy was published without attribution, date, substantiation, context, and an official response when available. The Marion County profile preserves its existing disputed/procedurally-unresolved label rather than converting reported allegations into a finding.
- No constituent sentiment was synthesized without a disclosed collection window, platform/source mix, jurisdiction-confidence method, duplicate/bot filtering, sample size, and uncertainty.
- No constitutional-alignment score was assigned without cited official actions, a published rubric, applicable provisions, uncertainty, and a RepWatchr-analysis/non-legal-judgment disclaimer.

## Coverage inventory

- The repository contains 336 Texas-coded official profile records. This is a repository count, not a claim that every Texas elective office is covered.
- Supabase is active and healthy. The current profile pipeline contains 80 update runs, 8,235 completion snapshots, 629 enrichment items, 27,670 vote snapshots, and 1,151 social-account records; RLS is enabled on each table.
- The statewide denominator remains open because county, municipal, school-district, special-district, and trial-court rosters have not yet been consolidated into one authoritative deduplicated registry. RepWatchr must not publish a false completion percentage until that registry exists.

## Remaining portrait/source deferrals

- Fourth Court of Appeals: Irene Rios (Place 6) and Lori I. Valenzuela (Place 7). Available portraits remain below the 500-pixel gate and were rejected rather than upscaled and mislabeled as HD.
- Fifth-through-Thirteenth Courts of Appeals: 25 current places remain portrait-gated after official court image retrieval was blocked and available alternates failed the 500-pixel minimum. The queue is Jessica Lewis, Bonnie Goldstein, Maricela Breedlove, Craig Smith, Mike Lee, Scott Stevens, Jeff Rambin, Charles van Cleef, Judy Parker, Laura Pratt, Maria Salas Mendoza, Gina Palafox, Lisa Soto, Scott Golemon, Leanne Johnson, Matt Johnson, Steven Lee Smith, John Bailey, Stacy Trotter, Bruce Williams, James Worthen, Clarissa Silva, Lionel Peña, Jon West, and Ysmael Fonseca.
- House HD-115 through HD-150: HD-119, HD-125, HD-126, HD-131, HD-133, HD-135, HD-136, HD-140, HD-142, HD-146, and HD-147.
- House HD-49 through HD-114: HD-51, HD-57, HD-58, HD-63, HD-68, HD-70, HD-74, HD-75, HD-80, HD-84, HD-90, HD-91, HD-103, HD-104, HD-112, and HD-113.
- Earlier House sequence: HD-2, HD-3, HD-17, HD-20, HD-22, HD-27, HD-29, HD-36, HD-37, HD-38, HD-39, and HD-42.
- State Board of Education: Districts 4, 11, 12, and 14 still need compliant stored portraits and the same evidence-depth conversion.
- Most remaining federal Texas profiles still use sub-500-pixel Clerk portraits and remain queued for official or properly licensed HD alternatives before depth completion.

## Next batch

Continue the House vote-depth sequence with the next 25 compliant profiles: HD-72, HD-73, HD-76 through HD-79, HD-81 through HD-83, HD-85 through HD-89, HD-92 through HD-102 (skipping the documented portrait/source deferrals). Continue the Fifth-through-Thirteenth Court places in court-and-place order as compliant portraits are found, then retry SBOE Districts 4, 11, 12, and 14. Preserve the identity, portrait, role-compatible record, source-ledger, freshness, finance, sentiment, and constitutional-analysis gates used in this release.
