# Local Meeting Tracker

The local meeting tracker is the shared RepWatchr system for school boards, city councils, county commissioners, boards, commissions, committees, special districts, courts, and agency boards.

## Purpose

Turn scattered public meeting records into usable civic intelligence:

- meeting dates
- agendas
- minutes
- videos
- transcripts
- agenda items
- vote rows
- source gaps
- public questions
- watchlists
- package-interest signals

## Public Routes

- `/meetings`
- `/meetings/[slug]`
- `/jurisdictions/[slug]/meetings`
- `/school-boards/[districtSlug]`
- `/school-boards/texas`
- `/school-boards/texas/[districtSlug]` redirects to canonical district page

## Meeting Page Sections

Each meeting page should include:

- meeting date
- public body
- agenda source
- minutes source
- video source
- transcript source
- item list
- vote list when available
- source trail
- public questions
- submit missing source CTA
- watch meeting/body CTA

## Statuses

Meeting statuses:

- scheduled
- completed
- canceled
- minutes_pending
- minutes_available
- video_available
- needs_sources

Item statuses:

- needs_review
- source_backed
- verified
- rejected
- archived

Vote confidence:

- needs_review
- source_backed
- verified
- missing_source

## Source Gaps

The tracker generates source gaps when records are missing:

- missing agenda
- missing minutes
- missing video
- missing vote record
- missing member source
- missing policy
- missing campaign finance
- missing election filing

Each gap should give the visitor a useful next click:

- submit source
- build packet
- watch body/record

## Safety

Meeting records must stay public-record focused.

Do not publish:

- private home addresses
- minor children
- private student records
- private employee records
- medical records
- sealed or restricted records
- harassment instructions
- claims beyond what the public source supports

If a meeting includes sensitive matters, summarize the public action only and link the official public source.

## Admin Workflow

Admin actions:

- create public body
- add members
- create meeting
- attach agenda/minutes/video/transcript
- add meeting item
- add vote row
- mark source gaps
- resolve correction
- create audit log

Admin route:

- `/admin/meetings`

API route:

- `/api/admin/local-meetings`

## SEO

Index useful public body and meeting pages with enough public value.

Noindex should be used later for sparse or under-review pages if they contain no useful public source trail.

Metadata currently uses:

- dynamic title
- dynamic description
- canonical
- OG image
- BreadcrumbList JSON-LD
- Dataset JSON-LD

## Monetization Signals

Package-interest links are attached to:

- School Board Monitor
- County Monitor
- Meeting Watch Desk
- Public Records Packet

Payments remain separate from this tracker. The tracker captures demand and source gaps first.
