# RepWatchr Public Profile Boundaries

RepWatchr profiles public power, not private lives. A profile exists because a person, office, agency, board, court, race, or public body exercises public authority, appears in public records, receives public money, asks for public votes, or is part of a public accountability trail.

This document is the safety boundary for every public official, public body, school board, law enforcement, court, agency, race, candidate, and public-record profile.

## Core Rule

Public profiles may show public-role information and source-backed public records. They may not become doxxing pages, rumor pages, family pages, or private-life attack pages.

## Allowed Public Data

- Public name tied to the public role.
- Office, title, district, seat, term, election cycle, or appointment record.
- Party or ballot status when publicly sourced.
- Official public biography or short source-backed summary.
- Official public website, public contact form, official phone, official email, or official office address.
- Official photo or public-domain/public-license photo with source credit.
- Public campaign finance records.
- Public votes, roll calls, meeting minutes, agendas, clips, filings, and source URLs.
- Public statements from official or campaign accounts.
- Court, ethics, discipline, audit, procurement, election, and agency records when they are public and relevant to the role.
- Source-backed red flags with status labels and correction paths.
- Public questions that ask for records or clarification without claiming more than the source supports.

## Forbidden Public Data

- Private home addresses.
- Private personal phone numbers, emails, or family contact details.
- Minor children or private family details.
- Medical information.
- Social Security numbers, bank data, tax IDs, identity-document images, or private financial records.
- Sealed, privileged, hacked, or unlawfully obtained records.
- Threats, harassment instructions, intimidation instructions, or "show up at their house" content.
- Unsourced criminal accusations.
- Claims that go beyond what the cited source proves.
- Private voter identity documents or raw verification files.

## Public Office Address Rule

RepWatchr may show an official public office address, public agency address, courthouse address, or public meeting location if it is listed by an official source for public business.

RepWatchr may not show a private home address, even if a third-party site or raw record contains it, unless legal review explicitly approves a narrow public-record use. Default handling is redact or keep admin-only.

## Source Labels

Every public claim must carry or inherit a source/confidence label:

- `official_record` - government, court, election, legislative, ethics, campaign finance, agency, or official public source.
- `source_backed` - named public source supports the claim, but it is not the primary official record.
- `needs_source` - profile field or claim still needs a stronger source before it should be treated as complete.
- `under_review` - RepWatchr has the item but it needs human review before public reliance.
- `disputed` - source conflict, correction request, or competing public record exists.

## Content Labels

Use these labels across profiles, timelines, red flags, stories, and source packets:

- Confirmed public record
- Source-backed claim
- Public question
- Needs source
- Allegation
- Opinion
- Correction requested
- Under review

## Red Flag Rules

A red flag may not publish as a naked accusation. It needs:

- Source URL.
- Source date or event date when available.
- Jurisdiction.
- Why it matters.
- Status label.
- Reviewer status.
- Correction path.

If the item is not strong enough, publish it as a public question or keep it in admin review.

## Profile Completeness Is Not Ideology

Completeness means data coverage. It answers: "How much of the profile has been source-loaded?"

It does not mean:

- Left or right.
- Good or bad.
- Constitutional or unconstitutional.
- Approved by citizens.
- Endorsed by RepWatchr.

Scores, ideology, citizen grades, public sentiment, and constitutional/civic alignment must be separate modules with their own methodology and confidence labels.

## Admin Review Defaults

Keep content admin-only when:

- A source is weak, missing, or private.
- A claim names a crime but does not cite an official record.
- A submission includes family, minors, private contact data, or home addresses.
- The page would identify a private person who is not tied to a public role.
- The public-interest value is unclear.
- The wording would not survive a hostile read.

## Correction Workflow

Every profile, story, red flag, race, funding page, school board page, and timeline event should provide:

- Submit correction.
- Submit better source.
- Request review.
- Show the source trail.

Correction requests do not automatically erase public records. They enter review, get an event trail, and should be resolved with a public update when the correction affects a public page.

## Boundary Examples

Allowed:

- "The official public Senate directory lists Ted Cruz as U.S. Senator for Texas."
- "FEC records show a campaign finance filing from the 2026 cycle."
- "This vote is loaded from a public roll-call source."
- "This item needs review because RepWatchr has not matched it to an official source yet."

Not allowed:

- "Here is the official's private home address."
- "Their child attends this school."
- "They committed a crime" without an official charge, finding, docket, or source-backed public record.
- "Go confront them at home."
- "This rumor proves corruption."

## Import Guidance

When importing data:

1. Store only public-role fields in public profile tables.
2. Store sensitive source material in review/intake tables with admin visibility.
3. Redact private addresses and family details before public display.
4. Attach source URLs, source dates, and confidence labels at import time.
5. Mark thin profiles as `needs_source` or `under_review`, not complete.
6. Set noindex or hidden status for profiles without enough public-source backing.

RepWatchr can be aggressive about public accountability without being reckless about private data.
