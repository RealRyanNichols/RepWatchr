# RepWatchr Figma Responsive Rules

Design system: **Civic Intelligence Terminal**

Target breakpoints:

- Desktop: 1440px
- Laptop: 1280px
- Tablet: 768px
- Mobile: 390px

Every major screen must define desktop and mobile behavior. Tablet and laptop can derive from desktop/mobile where the layout naturally adapts.

## Core Responsive Rule

Mobile is not a squeezed desktop.

Mobile should keep the same civic-intelligence feel but prioritize:

1. Search.
2. Watch.
3. Submit source.
4. Build packet.
5. Share.
6. Dashboard.

## Global Layout Widths

Desktop 1440:

- Page max width: 1280 to 1440 depending on screen.
- Primary content grid: 12 columns.
- Major panels: 2 to 3 columns.
- Admin dashboards can use dense 12-column grids.

Laptop 1280:

- Keep same hierarchy, reduce gutters.
- Side panels can shrink but should not overlap.
- Sticky right rail remains if space is enough.

Tablet 768:

- Switch to 1 to 2 columns.
- Filter rails become drawers.
- Right-side profile/action panels move below primary content.
- Tables become scroll-safe or card stacks.

Mobile 390:

- Single column.
- Search and primary action above fold.
- Bottom action dock visible.
- Sticky side rail hidden.
- Long tables become cards.
- Relationship graph becomes list-first.
- Timelines become vertical.

## Spacing Rules

Desktop:

- Section vertical padding: 64 to 96px.
- Panel gap: 16 to 24px.
- Card padding: 20 to 28px.
- Hero padding: 32 to 56px.

Mobile:

- Section vertical padding: 36 to 56px.
- Panel gap: 12 to 16px.
- Card padding: 16 to 20px.
- Hero padding: 20 to 24px.

No page should create horizontal scroll at 390px.

## Aspect Ratio Rules

Use stable ratios so images and previews do not stretch.

| Surface | Desktop ratio | Mobile ratio | Notes |
| --- | --- | --- | --- |
| Hero visual | 16:9 | 4:5 | Never distort faces/photos |
| Profile photo | 1:1 | 1:1 | Object cover; initials fallback |
| Profile card media | 5:3 | 4:3 or 1:1 | Fixed container |
| Story card media | 16:10 | 4:3 | Use generated/real image |
| Race card | 16:10 | 4:3 | Candidate or jurisdiction visual |
| Source packet preview | 8.5:11 | 8.5:11 | Document surface |
| Dashboard chart | 16:9 | 4:3 | Avoid tiny labels |
| OG/social card | 1200:630 | 1200:630 | Export only |
| Tall social graphic | 1080:1350 | 1080:1350 | Optional social variant |

## Typography Scaling

Do not scale font size with viewport width.

Use fixed responsive steps:

- Hero Display desktop: 56 to 72px.
- Hero Display mobile: 38 to 46px.
- Page Title desktop: 40 to 52px.
- Page Title mobile: 30 to 36px.
- Section Header desktop: 28 to 36px.
- Section Header mobile: 24 to 30px.
- Card Title desktop: 18 to 24px.
- Card Title mobile: 18 to 22px.
- Body: 16 to 18px.
- Small Body: 14 to 15px.
- Metadata: 11 to 13px.
- Button Text: 13 to 15px.

Letter spacing should be 0 except uppercase labels/badges, where tracking can be used.

## Navigation Rules

Desktop:

- Header nav visible if there is enough width.
- StickyActionRail may appear on research surfaces.
- Command palette shortcut shown near search.

Tablet:

- Header nav collapses.
- Filters become drawer.
- Action rail hidden or moved into sticky bottom bar.

Mobile:

- Bottom action dock is primary.
- Mobile menu can contain secondary links.
- Search action opens command palette or search route.
- Share action opens native share/bottom drawer.

## Form Rules

Desktop:

- Multi-step forms can use left form and right preview.
- Progress stepper visible.
- Safety notice visible next to preview.

Mobile:

- One step per viewport section.
- Sticky Continue/Back controls.
- Preview follows generation, not before required inputs.
- Errors appear inline under fields.

Field behavior:

- Inputs fill width.
- Textareas have minimum 120px height.
- URL inputs show source validation status.
- Honeypot fields stay hidden from humans.

## Table Rules

Desktop:

- Use semantic tables for admin/data-heavy views.
- Sticky headers for long queues.
- Row actions aligned right.

Tablet:

- Table can horizontally scroll if there are many columns.
- Show scroll hint.

Mobile:

- Prefer card rows.
- If horizontal table is required, keep first column sticky where feasible.
- Do not shrink text below readable size.

## Screen-Specific Responsive Guidance

### Homepage

Desktop:

- Two-column hero: search console plus command stack.
- Counters in four columns.
- Action cards in four columns.
- Profile cards in three columns.

Mobile:

- Hero single column.
- Search in first screen.
- Counters in one/two columns.
- Profile cards stacked.
- Fixed bottom dock.

### Search

Desktop:

- Filter rail left.
- Results main.
- Saved/trending right side optional.

Mobile:

- Filter drawer.
- Results cards.
- Saved search CTA below search field.

### Profile Dossier

Desktop:

- Hero split: identity and score/status.
- Evidence modules full width.
- Tables and charts can span.

Mobile:

- Identity first.
- Score summary compact.
- Actions docked.
- Vote/funding tables become cards.

### Source Submission

Desktop:

- Form and preview split.

Mobile:

- Stepper.
- Preview after fields.

### Source Packet Builder

Desktop:

- Split editor/preview.

Mobile:

- Editor first, generated preview second, sticky copy/export.

### Records Request Tool

Desktop:

- Builder left, preview right, tabs top of preview.

Mobile:

- Step-by-step; preview card after generation.

### Member Dashboard

Desktop:

- Dense dashboard grid.
- Watchlist and recent changes above fold.

Mobile:

- Summary first, then watchlists, packets, submissions, settings.

### Admin Dashboard

Desktop:

- Dense command center with queues and metrics.

Mobile:

- Priority queues first.
- Admin tables cardify or scroll.
- Bulk actions behind menu.

### Package Pages

Desktop:

- Hero + deliverable preview side-by-side.
- FAQ and related tools below.

Mobile:

- Hero, CTA, deliverable preview, bullets, form, FAQ.

### Election/Race Hub

Desktop:

- Candidate comparison table/cards.
- Finance/filings/source gaps in grid.

Mobile:

- Candidate cards stacked.
- Comparison becomes row-by-row.

### County/State Hub

Desktop:

- Jurisdiction dashboard with grouped official grids.

Mobile:

- Search within jurisdiction first.
- Groups collapse.

### Law Enforcement Profile

Desktop:

- Public-role boundary prominent in hero or first panel.

Mobile:

- Boundary box appears before any incident/case sections.

### School Board Tracker

Desktop:

- District overview, member grid, meeting timeline.

Mobile:

- Member cards and meeting timeline stacked.

## Accessibility Rules

- All tap targets 44px minimum.
- Focus rings visible on dark and light surfaces.
- Text contrast must meet WCAG AA where practical.
- Icon-only actions require labels/tooltips/aria-labels.
- Do not rely on hover for critical actions.
- Do not rely on color alone for status.
- Respect reduced motion.

## Figma Responsive QA

For every screen, create or document:

- [ ] Desktop 1440.
- [ ] Laptop 1280.
- [ ] Tablet 768.
- [ ] Mobile 390.
- [ ] No horizontal scroll at 390.
- [ ] Primary action visible above fold.
- [ ] Bottom dock/safe-area behavior where needed.
- [ ] Tables convert or scroll safely.
- [ ] Graphs and timelines have mobile fallbacks.
- [ ] Images keep ratio and do not stretch faces.
- [ ] Text fits inside buttons/cards.
