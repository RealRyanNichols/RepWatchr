# RepWatchr: School Boards Research Module

## Mission
Track every school board member running for election in Texas. Start East Texas (Gregg, Harrison, Upshur, Smith). Expand outward. These people decide what gets taught to our kids. Voters deserve a transparent, aggregated public record.

Every candidate gets the "About (Expanded Public Record)" section, which aggregates everything a candidate typically hopes voters never bother to look up. All public. All cited. Not hit-piece material, not speculation, not private information. Just what is already in the record, compiled in one place for the first time.

## Project Owner
Ryan Nichols. Based in Longview / Harleton, TX. Priority: East Texas home turf first, statewide next.

## Output Format (ALWAYS DUAL)
Every candidate gets TWO files with the same stem:
- `{candidate_slug}.json` conforms to `_schemas/candidate.schema.json`
- `{candidate_slug}.md` uses `_schemas/candidate_template.md`

Path pattern:
```
school_boards/texas/east_texas/{county}/{district_slug}/{candidate_slug}.{json|md}
```

## Research Depth Standard
Follow `_schemas/research_workflow.md` (20 steps in three parts). Every claim gets a source URL and one of: FACT, DOCUMENTED_INFERENCE, REQUIRES_FURTHER_EVIDENCE.

## The "About (Expanded Public Record)" Section

This is the section most voter guides skip. It aggregates:

1. **Full identity**: legal name, prior names, YOB, family connections in district
2. **Residency & property**: county appraisal records, homestead status, tax delinquencies
3. **Full education history**: every institution, dates, degrees, gaps
4. **Complete employment timeline**: with dates, overlaps, vendor connections
5. **Business & financial record**: SOS filings, DBAs, UCC liens, bankruptcies, tax liens, civil judgments
6. **Voting & political history**: voter registration, primary voting history (PUBLIC in TX), previous candidacies, donations given, PACs, party roles
7. **Court records**: civil, criminal, family, federal, probate, appeals (in all relevant counties)
8. **Campaign finance deep dive**: every periodic report, donors tied to district vendors, in-kinds, amendments
9. **Affiliations full inventory**: 990 filings, board seats, fraternal, alumni, church leadership (if public)
10. **Conflicts of interest inventory**: vendor ties, family employment, property adjacency, business partnerships
11. **Digital footprint archive**: Wayback snapshots, deleted posts, historical bios, old press quotes
12. **Board performance (incumbents)**: attendance, notable votes, recusals, committee assignments
13. **Profile images and presence**: URLs where voters can see the candidate (campaign headshots, LinkedIn, news photos, firm bio). List personal social accounts (Facebook, X, Instagram, TikTok, LinkedIn, Rumble, Truth Social, Nextdoor) AND associated business/org accounts (firm pages, nonprofit pages, church pages). Link to the page, do not embed images. Mark public_or_private and note content review status.
14. **Criminal and law enforcement record**: convictions, arrests without conviction, police reports where candidate is subject, protective/restraining orders. ALWAYS record open_source_review_conclusion even when clean ("No records found in open-source review" is a legitimate finding that distinguishes a clean record from incomplete research). Arrests without conviction must be labeled factually with outcome (dismissed, no-bill, deferred, pending). Never include sealed/juvenile records.
15. **Professional complaints and client reviews**: licensing board discipline, bar grievances, malpractice, public client reviews (Avvo, Lawyer.com, Martindale, Google, Yelp, BBB), peer ratings and awards. Report positive peer ratings alongside negative reviews as counterweight. One negative review is a data point, not a pattern. Always note whether candidate has a published response.
16. **Controversial or notable public statements**: publicly posted statements (candidate's own posts, comments, speeches, news quotes) that are noteworthy or potentially controversial. Use severity scale: informational / notable / potentially_controversial / controversial. Paraphrase with short quotes under 15 words. Do NOT include second-hand accusations, private communications, or content from hacked sources. Political disagreement with the candidate's platform is not "controversial"; a controversial statement is one most voters across viewpoints would find troubling (e.g., bigotry, dishonesty, incitement, public professional misconduct).

## Hard Ethics Guardrails

These are non-negotiable:

- **No minor children named or described**, ever. Reference to "children in the district" is fine; naming any minor is not.
- **No full home street addresses published** in any file, even though they are public record on ballot filings and voter rolls. City or neighborhood only. This protects candidates from harassment and keeps the project defensible.
- **No medical information** beyond what the candidate has publicly disclosed themselves.
- **No unverified allegations.** Court findings are fair; accusations without adjudication are not, unless explicitly labeled as such and sourced to a primary document.
- **Family court matters**: note existence only. Do not include salacious detail unless directly policy-relevant (e.g., a candidate running on "family values" with documented court findings on point).
- **No private data obtained through non-public means.** Hacked, leaked, or stolen material is off-limits. Public record only.
- **No doxxing of spouses, adult children, or other relatives** who are not themselves public figures. Mention adult family members only when their public record is directly relevant (e.g., they work for the district).

## Fact-Labeling Framework

- `FACT`: directly sourced, publicly verifiable
- `DOCUMENTED_INFERENCE`: reasonable conclusion from multiple sourced FACTs; reasoning shown in analyst_notes
- `REQUIRES_FURTHER_EVIDENCE`: flagged in research_gaps with specific next action

## Tone Rules

- No em dashes anywhere. Use commas, colons, parentheses, periods.
- No moralizing. Report the record.
- No partisan editorializing. Let the facts speak.
- Neutral factual summary in summary and about_summary_narrative. Sharper framing only in analyst_notes, and only if cited evidence supports it.

## Priority Queue
See `school_boards/texas/_indexes/east_texas_master.json`.

## Processing Workflow
1. Read east_texas_master.json
2. Pick next queued candidate
3. Flip to in_progress
4. Run the 20-step workflow
5. Emit matched .json + .md
6. Flip to complete with timestamp
7. Append any new candidates discovered (e.g., additional filings, write-ins)
8. Commit: `feat(school-boards): add {candidate_name} [{district}]`

## Batch Mode
When Ryan says "run a batch," process 5 candidates at a time. Summarize findings in chat before the next batch. Never auto-commit without summarizing.

## Expansion Phases
- Phase 1 (active): Gregg, Harrison, Upshur, Smith
- Phase 2: Panola, Rusk, Cherokee, Wood, Camp, Marion, Cass, Morris, Titus, Franklin
- Phase 3: DFW + Houston + Austin + SA metros
- Phase 4: Remaining 200 largest Texas districts
- Phase 5: Statewide coverage

## Data Sources (priority order)

**Election filings**:
1. County election department pages
2. Individual school district press releases

**Identity, residency, family**:
3. Ballotpedia, candidate sites, LinkedIn
4. Texas Secretary of State business entity search
5. County appraisal district sites (gregg-cad, harrisoncad, upshurcad, smithcad)
6. County clerk marriage / assumed name records

**Court records**:
7. Gregg / Harrison / Upshur / Smith County district clerk sites
8. Federal PACER
9. Texas appellate courts

**Finance**:
10. Texas Ethics Commission (TEC)
11. FEC individual contribution search
12. District-posted local school board campaign finance filings
13. ProPublica Nonprofit Explorer + GuideStar for 990s

**Voter records**:
14. County voter registrar (voter roll, primary history)
15. County party officer rosters (GOP / Dem)

**Archive**:
16. Wayback Machine
17. archive.today
18. Newspaper archives (Longview News-Journal, Tyler Morning Telegraph, Marshall News Messenger, Gilmer Mirror)

**Board performance**:
19. BoardBook Premier archive for LISD and other districts
20. District-posted agendas, minutes, video recordings

## DO NOT
- Do not scrape private content. Public posts only.
- Do not contact candidates directly on Ryan's behalf.
- Do not publish opinion as fact.
- Do not skip the fact labels.
- Do not use em dashes.
- Do not include minors, medical info, full home addresses, or unverified allegations.
