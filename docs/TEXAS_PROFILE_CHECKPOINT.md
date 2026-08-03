# Texas elected-official profile checkpoint

Last updated: 2026-08-03

## Completed in this batch

Twenty-five active-office profiles were created or materially updated and prepared for production:

- Supreme Court of Texas: Jimmy Blacklock, Debra Lehrmann, John Phillip Devine, Brett Busby, Jane Bland, Rebeca Aizpuru Huddle, Evan A. Young, James P. Sullivan, and Kyle D. Hawkins.
- Texas Senate Districts 1–16: Bryan Hughes, Bob Hall, Robert Nichols, Brett Ligon, Charles Schwertner, Carol Alvarado, Paul Bettencourt, Angela Paxton, Taylor Rehmet, Phil King, Mayes Middleton, Tan Parker, Borris Miles, Sarah Eckhardt, Molly Cook, and Nathan Johnson.

Every profile now has an identity-checked stored portrait that passed the batch image gate, current office and district/place, party, resolved term end and next-election year, official contact path, biography, committee assignments when the official Senate page displays them, role-compatible decision-record sources, campaign-finance and election source paths, explicit finance/sentiment/constitutional-score gates, and field freshness metadata dated 2026-08-03.

The records remain `source_seeded`, not `verified`, because filing-level campaign-finance totals, opinion/roll-call-by-roll-call editorial review, balanced public-record review, and jurisdiction-verified sentiment samples are separate evidence passes.

## Corrected current-office coverage

- Added Brett Ligon as the current senator for District 4 after checking the official Texas Senate roster and member page.
- Removed Brian Birdwell from current profiles because the official roster marks District 22 vacant and routes it to Constituent Services.
- Updated the Texas Legislature importer so stale OpenStates Senate roles cannot republish a former senator when the official Senate roster disagrees.
- Confirmed the 2026-08-03 Supabase daily update completed successfully, including 1,151 official social-link rows; this verifies the previously deployed duplicate-upsert fix.

## Evidence deliberately not published

- No campaign total, donor ranking, expenditure total, or industry/PAC grouping was inferred from a search result without matching the correct filing committee and reporting period.
- No positive, mixed, or unfavorable sentiment score was synthesized without a disclosed collection window, source mix, geography-confidence method, duplicate/bot filtering, sample size, and uncertainty.
- No constitutional-alignment score was assigned without cited actions, a published rubric, applicable provisions, uncertainty, and a non-legal-judgment disclaimer.

## Next batch

Continue with Texas Senate Districts 17–31, excluding vacant District 22, then fill the four remaining State Board of Education portrait gaps if a qualifying source is available. Use the remaining slots for the weakest current Texas House profiles in district order.
