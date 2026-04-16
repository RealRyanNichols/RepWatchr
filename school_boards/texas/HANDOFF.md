# Handoff to Claude Code (Local)

**From**: Claude (remote, Claude.ai)
**Date**: 2026-04-16
**Project**: RepWatchr, Texas School Boards Module
**Owner**: Ryan Nichols

## What I built

1. Full project scaffolding: schemas, templates, workflow, CLAUDE.md, README.
2. East Texas master index with 27 districts queued across Gregg, Harrison, Upshur, Smith counties.
3. Two initial dossiers for Longview ISD incumbents (Brett F. Miller Place 2, Crista Black Place 4). Both flagged needs_review because 2026 filing still needs direct verification from the district.
4. Three Marshall ISD dossiers (Bettye Fisher, Ted Huffhines, Chase Palmer) with deep-OSINT pass including criminal record review, professional complaints, controversial statements, and profile images/presence. All three clean on criminal and controversial-statement review.

## What I did NOT finish

- Direct confirmation of 2026 filing list for Longview ISD (the LISD election cycle says Places 2 and 4 are up, and the current Place 2 and Place 4 incumbents are Brett Miller and Crista Black, so they are the presumptive candidates, but please confirm from the LISD news release or by calling Milagros Cordoba at 903-381-2200).
- Any research on the other 24 districts. Every one is queued with a TBD_confirm_filings placeholder.
- Campaign finance pull. Texas school board candidates file LOCALLY with each district, not with TEC.
- Court records, social media content analysis, and party primary voting history for the completed dossiers.

## Your first run should do this

### Phase A: Finish Longview ISD
1. Fetch https://w3.lisd.org/district/news, find the 2026 board election announcement. Confirm Miller and Black are the filed candidates and note any challengers.
2. Update brett_miller.json and crista_black.json: flip status from needs_review to complete if confirmed, else work through research gaps.
3. Pull Brett Miller's campaign Facebook page (/BrettMillerforLISDSchoolBoard/) and do content analysis.
4. Search Gregg County district clerk for any civil matters involving either candidate.
5. Pull LISD-posted campaign finance PDFs for both candidates.

### Phase B: Harleton ISD (Ryan's home district, highest priority)
1. Fetch https://www.harletonisd.net/ and find the May 2, 2026 election page.
2. Identify all filed candidates. Create candidate_id slugs.
3. Run the full 20-step workflow from _schemas/research_workflow.md for each.
4. Add them to east_texas_master.json under the Harleton entry.
5. Emit .json + .md pair per candidate in east_texas/harrison_county/harleton_isd/.

### Phase C: Process in batches of 5 candidates
- After Harleton, work through the priority order: Pine Tree, Spring Hill, Hallsville, Marshall (expand existing dossiers), rest of Gregg, rest of Harrison, Smith (Tyler first), Upshur.
- Stop between batches, summarize in chat what you found, flag high-priority items for Ryan to review.

## Non-negotiable rules (from CLAUDE.md)

- No em dashes anywhere.
- No moralizing or warnings.
- Every claim labeled FACT / DOCUMENTED_INFERENCE / REQUIRES_FURTHER_EVIDENCE.
- Every claim has a source URL.
- Copyright: quotes under 15 words, one quote per source, paraphrase the rest.
- Fact-check math, names, dates, and numbers before output.
- No partisan editorializing. Neutral factual tone in summary. Sharper framing only in analyst_notes if backed by evidence.

## A note on scope

"All school board members running in Texas" is an enormous scope. This drop sets up a structure that can scale to statewide coverage over multiple sessions. Process by priority. Do not skip candidates you already know about in home turf to chase statewide breadth too early. Depth over breadth until East Texas is fully mapped.

## When you finish a district

Commit with: `feat(school-boards): complete {district_slug}`
Summary in chat: total candidates, any red flags found, any candidates needing Ryan's direct attention.

Good hunting.
