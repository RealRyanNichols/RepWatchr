# RepWatchr Component Inventory

Design system source: `src/components/design-system/RepWatchrCivic.tsx`

Design system export barrel: `src/components/design-system/index.ts`

Preview route: `/dev/design-system`

Figma handoff: https://www.figma.com/design/d6dQxrIDKWPwy7MG3uSSfY

## Foundation Components

### CivicBackground

Purpose: dark radial gradient shell with subtle grid and optional source-node glow.

Props:

- `children`
- `sourceGlow?: boolean`
- `className?: string`

Use for premium dashboard, dossier, and design-system preview surfaces.

### CivicShell

Purpose: page shell that wraps `CivicBackground` with noise/grid texture.

Props:

- `children`
- `className?: string`

### GlassPanel

Purpose: core surface primitive.

Props:

- `variant?: "default" | "raised" | "source" | "warning" | "danger" | "verified"`
- `glow?: boolean`
- `interactive?: boolean`
- `density?: "normal" | "compact" | "roomy"`
- `className?: string`
- `ariaLabel?: string`

Use for panels, dashboards, source cards, admin queues, and modals.

## Data And Trust Components

### MetricCard

Purpose: real metric display. Never use with fake activity numbers.

Props:

- `title`
- `value`
- `subtitle?`
- `trend?`
- `sourceLabel?`
- `tone?: "blue" | "red" | "gold" | "green" | "violet"`

### SourceLabel

Purpose: mandatory trust vocabulary.

Variants:

- `confirmed`
- `sourceBacked`
- `publicQuestion`
- `needsSource`
- `underReview`
- `correctionRequested`
- `opinion`
- `allegation`
- `insufficientData`

### LiveCounter

Purpose: animated-feeling count panel for real counters, admin stats, and dashboards.

Props:

- `value`
- `label`
- `tone?`

### HeatmapGrid

Purpose: interest or activity heatmap. Use with real visitor or contributor data only.

Props:

- `values: Array<{ label: string; level: number; tone?: Tone }>`

## Action Components

### ElasticButton

Purpose: primary action button with hover lift and focus ring.

Props:

- `children`
- `className?`
- `type?`
- `onClick?`

### WatchButton

Purpose: watch/unwatch control with anonymous and loading states.

Props:

- `watched?`
- `loading?`
- `anonymous?`
- `onToggle?`
- `onAccountPrompt?`

### ShareButton

Purpose: opens `ShareDrawer`.

Props:

- `title`
- `path`
- `safeLine?`

### ShareDrawer

Purpose: copy link, copy safe share line, native share, and X/Facebook/LinkedIn links.

Props:

- `title`
- `path`
- `safeLine?`
- `onClose`

### FeedbackButton

Purpose: low-friction feedback signal.

Kinds:

- `useful`
- `needs-source`
- `broken-source`
- `request-review`
- `watching`

## Profile And Dossier Components

### ProfileCard

Purpose: clickable official/candidate summary.

Props:

- `name`
- `office`
- `jurisdiction`
- `sourceCount`
- `completeness`
- `trustLabel`
- `href`

### OfficialHero

Purpose: cinematic profile header with source count and completeness ring.

Props:

- `name`
- `office`
- `jurisdiction`
- `confidence`
- `sourceCount`
- `completeness`
- `children?`

### DossierCard

Purpose: compact grade-style dossier panel for profile summaries.

Props:

- `name`
- `office`
- `grade`
- `stats`
- `className?`

## Source And Timeline Components

### SourceTrail

Purpose: external record/source list with trust labels and dates.

Props:

- `sources: Array<{ title; type; date?; confidence; href }>`

### TimelineEvent

Purpose: source-backed timeline item.

Props:

- `date?`
- `title`
- `source`
- `trustLabel?`
- `relatedEntity?`
- `children`

### SourcePacketPreview

Purpose: public-record packet preview with copy action and document ratio.

Props:

- `title`
- `packet`
- `label?`

## Navigation And Utility Components

### StickyActionRail

Purpose: desktop side rail for Watch, Share, Submit Source, Build Packet, Correction.

Props:

- `actions: Array<{ label; href }>`

### MobileActionDock

Purpose: mobile bottom dock for core actions.

Props:

- `actions: Array<{ label; href }>`

### FloatingSearchShell

Purpose: premium predictive-search shell.

Props:

- `placeholder?`
- `action?`

### CommandPaletteShell

Purpose: grouped search/action palette preview.

Props:

- `rows: Array<{ label; kind; tone? }>`

`CommandPaletteList` is an alias for backwards compatibility.

### EmptyState

Purpose: no dead ends. Every empty state must include at least one next action.

Props:

- `title`
- `explanation`
- `action`
- `secondaryAction?`

### LoadingSkeleton

Purpose: profile, table, dashboard, or search loading placeholders.

Props:

- `variant?: "profile" | "table" | "dashboard" | "search"`

### DashboardPanel

Purpose: reusable dashboard module shell.

Props:

- `title`
- `metric?`
- `action?`
- `children`

### AdminTable

Purpose: dense admin queue or status table.

Props:

- `columns`
- `rows`
- `filters?`

### PackageInterestCard

Purpose: premium paid-package interest card. This is not checkout.

Props:

- `title`
- `price`
- `description`
- `href`

## Adoption Rules

- Do not redesign existing pages wholesale.
- Replace dead flat panels only when touching a route for a specific product task.
- Keep source labels visible on records, red flags, and public questions.
- Use real data or explicitly mark examples as design previews.
- Preserve RepWatchr's public-record safety rules on every public surface.
