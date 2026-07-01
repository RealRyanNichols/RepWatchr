# RepWatchr Sharing System

RepWatchr sharing should make people share the receipt, not just the outrage.

## Goals

Every important public page should support:

- copy clean link
- native share where supported
- X share
- Facebook share
- LinkedIn share
- email share
- copy safe share line
- copy public question
- copy source packet if available
- copy meeting question if available
- submit source CTA
- request correction CTA

## Components

The foundation lives in `src/components/shared/ShareDrawer.tsx`.

Exports:

- `ShareDrawer`
- `ShareButton`
- `ShareSnippetPreview`
- `OGPreviewCard`
- `CopySafeShareLineButton`
- `CopyPublicQuestionButton`

`ShareDrawer` is now wired into:

- official profile pages
- story/news pages

Future passes should add it to:

- race pages
- school board pages
- agency/public-power pages
- funding pages
- vote pages
- source packet pages
- package pages
- methodology/tool pages

## Safe Snippet Templates

The template helpers live in `src/lib/share-snippets.ts`.

Templates:

### Confirmed public record

`RepWatchr has a source-backed public record for [Name/Entity]: [short fact]. Source: [URL].`

### Needs source

`RepWatchr is looking for a public source on [Name/Entity] about [topic]. Add a source here: [URL].`

### Public question

`Public question for [Name/Entity]: [question]. Source/context: [URL].`

### Watch profile

`I'm watching public-record updates for [Name/Entity] on RepWatchr: [URL].`

### Correction

`See something wrong on this RepWatchr profile? Request a correction here: [URL].`

### Race

`Follow public-record updates for [Race] here: [URL].`

## Safety Rules

Share copy must avoid:

- inflammatory claims
- guilt language
- harassment language
- unsourced accusations
- exaggeration beyond the source
- `exposed` unless a source-backed editorial review explicitly supports that word

The helper strips a few high-risk words from generated one-line snippets, but that is not a substitute for human review on public-facing editorial copy.

## Official Profile Sharing

Official profiles now generate a profile source packet with:

- official name
- office/jurisdiction/party
- profile URL
- source count
- profile completeness
- confidence label
- primary public question
- top source trail entries
- reminder to share the receipt, not unsupported claims

The drawer is placed near the top of the profile, after profile feedback and before the long source/vote/funding dossier sections.

## Story Sharing

Story pages now generate:

- safe story share line
- source packet based on article title, summary, receipt/source status, and story URL
- public question asking which source confirms the record behind the story
- source submission CTA
- correction CTA

## Analytics

Sharing events tracked:

- `share_menu_open`
- `share_copy_link`
- `share_copy_snippet`
- `native_share_clicked`
- `social_share_clicked`
- `public_question_copied`
- `source_snippet_copied`

## Current Gaps

- Race, school-board, funding, vote, package, and source-packet pages need the drawer wired in.
- Native share behavior depends on browser support; the drawer falls back to copying the link.
- The current share drawer uses page-level props. A future pass should create entity-specific share config builders for officials, races, school boards, funding records, votes, stories, and source packets.
- Admin preview tools should eventually show the OG image and share text before a story or profile is promoted.
