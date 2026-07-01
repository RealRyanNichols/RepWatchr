# RepWatchr Visual Language

RepWatchr's design language is Civic Intelligence Terminal.

The site should feel active, source-backed, and data-rich without turning into entertainment or fake urgency. The visual system should make voters, contributors, journalists, and researchers feel like they are inside a public-record command center.

## Core Personality

- Public records first.
- Source trails over outrage.
- Dense data that stays readable.
- Actionable next clicks on every major screen.
- High contrast, dark-mode-first intelligence surfaces.
- Motion and glow used to show interactivity, not to distract.

## What It Should Feel Like

- Civic intelligence command center
- Public-record research terminal
- Investigative dashboard
- Profile database
- Source-trail engine
- Political data product
- Government accountability operating system

## What It Should Not Feel Like

- Flat blog
- Boring government page
- Plain SaaS landing page
- Generic card grid
- Airtable clone
- Basic search site
- Static dead database

## Surface System

### Backgrounds

Use dark radial gradients, a subtle grid, and a light noise feel. The background should imply a terminal and map layer, but it must not reduce readability.

Use `CivicBackground` or `CivicShell` for dark-mode design-system pages and future premium dashboard surfaces.

### Glass Panels

Glass panels are the default data container for serious modules:

- Source panels
- Timeline cards
- Official dossier panels
- Admin queues
- Dashboard modules
- Service package cards

Glass should have depth, border clarity, and readable text. Do not put cards inside cards unless the nested item is an actual repeated object, table row, document preview, or modal.

### Source Glow

Source-node glow belongs on:

- Source-backed panels
- Active search
- Verified source labels
- Timeline nodes
- Watch and share CTAs

Do not use glow for fake activity or fake scarcity.

## Component Tone

### Good Or Verified

Use green only for confirmed public records, accepted sources, verified states, or source health. Do not use green to imply political approval unless it is explicitly a user score or named methodology state.

### Warning Or Needs Review

Use gold for public questions, missing source, weak source, under-review records, and records that need contributor attention.

### Risk Or Red Flag

Use red for red flags, correction requests, broken source links, risky language warnings, and negative verified findings. Red should point to a source or a clearly labeled review state.

## Cards And CTAs

Clickable objects must look clickable. Use:

- Lift on hover
- Border color shift
- Source glow
- Clear action labels
- Visible focus ring
- Minimum 44px touch targets

Avoid dead flat rectangles. Every card should answer one of these questions:

- What record opens next?
- What source can I inspect?
- What profile should I compare?
- What action can I take?
- What missing source should I submit?

## Data Modules

Metric cards should show real counts only. If the count is an example in docs or dev preview, label it as a sample.

Tables should be dense, scroll-safe, and readable. Admin tables should use clear status badges and row actions.

Charts should use the same trust vocabulary:

- Confirmed public record
- Source-backed claim
- Public question
- Needs source
- Under review
- Correction requested
- Opinion
- Allegation
- Insufficient data

## Timelines

Timelines are a core product surface. They should feel like a source trail, not a social feed.

Timeline events need:

- Date
- Title
- Source
- Trust label
- Related entity when relevant
- Short plain-English summary

## Documents And Packets

Document previews should use the `rw-aspect-document` ratio and look like real packets. The visual hierarchy should separate:

- Target
- Claim or question
- Source URL
- Date
- Missing proof
- Next action

## Mobile

Mobile should not be a squeezed desktop. Use:

- 4:5 hero visuals
- Sticky bottom action dock
- Short source labels
- Big tap targets
- One primary action per visible module
- Horizontal overflow only for dense tables that need it

## Accessibility

- Every button must be keyboard accessible.
- Focus states must be visible.
- Decorative effects should not carry meaning.
- Do not rely on color alone for status.
- Keep contrast readable on dark and light fallback surfaces.
- Respect reduced motion.
- Use semantic headings and real links for navigation.

## Public Safety

Visual intensity must not push claims beyond proof. If a module uses red, warning, or allegation language, it must show the label and source context. RepWatchr should make the receipt easier to inspect, not amplify unsourced accusations.
