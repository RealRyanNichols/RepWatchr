# RepWatchr Figma Design System

System name: Civic Intelligence Terminal

Figma handoff file: https://www.figma.com/design/d6dQxrIDKWPwy7MG3uSSfY

RepWatchr should feel like a civic intelligence command center: a public-record research terminal, investigative dashboard, profile database, source-trail engine, data product, and government accountability system. It should not read as a flat blog, boring government page, generic SaaS landing page, Airtable clone, or dead static database.

## Implementation Source

The code source for the foundation is:

- CSS tokens: `src/styles/repwatchr-civic-tokens.css`
- React primitives: `src/components/design-system/RepWatchrCivic.tsx`
- Re-export: `src/components/design-system/index.ts`
- Preview route: `/dev/design-system`

This project uses Tailwind v4 through `@import "tailwindcss"` in `src/app/globals.css`. There is no `tailwind.config.*` file in the source tree, so the design tokens are CSS variables and utility classes instead of Tailwind config theme extensions.

## Figma Page Structure

The Figma file should keep this page structure:

1. `00 Cover`
2. `01 Foundations`
3. `02 Components`
4. `03 Aspect Ratios`
5. `04 Motion`
6. `05 Screen Patterns`
7. `06 Handoff Notes`

The file should mirror code names exactly. Figma component names should use this pattern:

`Civic Intelligence Terminal / Component Name / Variant`

Examples:

- `Civic Intelligence Terminal / GlassPanel / Source`
- `Civic Intelligence Terminal / SourceLabel / Needs source`
- `Civic Intelligence Terminal / ProfileCard / Default`
- `Civic Intelligence Terminal / MobileActionDock / Default`

## Color Tokens

| Token | CSS variable | Usage |
| --- | --- | --- |
| background-deep | `--rw-background-deep` | Darkest terminal shell and page depth |
| background-page | `--rw-background-page` | Civic page background |
| background-panel | `--rw-background-panel` | Standard data panel |
| background-panel-raised | `--rw-background-panel-raised` | Raised dashboard and metric surfaces |
| background-glass | `--rw-background-glass` | Translucent glass panels |
| border-glass | `--rw-border-glass` | Default glass outline |
| border-muted | `--rw-border-muted` | Low-emphasis table and divider lines |
| border-source | `--rw-border-source` | Source-backed states and primary action focus |
| border-warning | `--rw-border-warning` | Public question, needs review, missing record |
| border-danger | `--rw-border-danger` | Risk, correction, red flag, broken source |
| border-verified | `--rw-border-verified` | Confirmed record and accepted source states |
| text-primary | `--rw-text-primary` | Main dark-mode text |
| text-secondary | `--rw-text-secondary` | Body copy and supporting text |
| text-muted | `--rw-text-muted` | Metadata, timestamps, inactive labels |
| accent-civic | `--rw-accent-civic` | Civic blue action and link emphasis |
| accent-source | `--rw-accent-source` | Source trail and search glow |
| accent-trust | `--rw-accent-trust` | Verified or accepted states |
| accent-alert | `--rw-accent-alert` | Attention without false urgency |
| accent-risk | `--rw-accent-risk` | Risk and red-flag emphasis |
| accent-purple | `--rw-accent-purple` | Research and AI helper accents |
| accent-gold | `--rw-accent-gold` | Civic signal and section labels |
| source-glow | `--rw-source-glow` | Soft source-node glow |
| warning-glow | `--rw-warning-glow` | Needs-review glow |
| verified-glow | `--rw-verified-glow` | Confirmed-source glow |

## Typography Tokens

| Style | CSS variable | Usage |
| --- | --- | --- |
| Display hero | `--rw-type-display-hero` | Official hero, major dashboards, launch moments |
| Section heading | `--rw-type-section-heading` | Major page modules |
| Card title | `--rw-type-card-title` | Profile, package, story, timeline cards |
| Body | `--rw-type-body` | Main readable copy |
| Small label | `--rw-type-small-label` | Source labels and metadata chips |
| Metadata | `--rw-type-metadata` | Dates, source types, jurisdictions |
| Mono record ID | `--rw-font-mono` | IDs, source URLs, roll-call references |
| Mono timestamp | `--rw-font-mono` | Import times and audit trails |
| Button | `--rw-type-button` | Dense action controls |
| Dashboard number | `--rw-type-dashboard-number` | Metrics and counts |
| Source URL | `--rw-font-mono` | External record links |
| Legal/safety label | `--rw-type-small-label` | Trust and safety state labels |

## Spacing, Radius, And Shadow Tokens

| Token | CSS variable |
| --- | --- |
| Panel padding | `--rw-panel-padding` |
| Card padding | `--rw-card-padding` |
| Dense table spacing | `--rw-dense-table-spacing` |
| Hero spacing | `--rw-hero-spacing` |
| Dashboard grid spacing | `--rw-dashboard-grid-spacing` |
| Mobile spacing | `--rw-mobile-spacing` |
| Radius sm | `--rw-radius-sm` |
| Radius md | `--rw-radius-md` |
| Radius lg | `--rw-radius-lg` |
| Radius xl | `--rw-radius-xl` |
| Radius full | `--rw-radius-full` |
| Shadow glass | `--rw-shadow-glass` |
| Shadow source | `--rw-shadow-source` |
| Shadow danger | `--rw-shadow-danger` |
| Shadow verified | `--rw-shadow-verified` |

## Motion Tokens

| Motion | CSS variable |
| --- | --- |
| Hover lift | `--rw-motion-hover-lift` |
| Hover glow | `--rw-motion-hover-glow` |
| Focus glow | `--rw-motion-focus-glow` |
| Panel reveal | `--rw-motion-panel-reveal` |
| Metric count | `--rw-motion-metric-count` |
| Source pulse | `--rw-motion-source-pulse` |
| Timeline draw | `--rw-motion-timeline-draw` |
| Drawer slide | `--rw-motion-drawer-slide` |
| Command palette enter | `--rw-motion-command-enter` |

Motion must never be required to understand the page. `prefers-reduced-motion` fallbacks are included in the token stylesheet.

## Aspect Ratio Utilities

| Utility | Ratio | Use |
| --- | --- | --- |
| `rw-aspect-hero-desktop` | 16:9 | Desktop hero images and feature panels |
| `rw-aspect-hero-mobile` | 4:5 | Mobile hero images |
| `rw-aspect-profile-card` | 5:3 | Official and candidate cards |
| `rw-aspect-story-card` | 16:10 | Article and story cards |
| `rw-aspect-social-card` | 1200:630 | OG image frames |
| `rw-aspect-mobile-social` | 1080:1350 | Tall social graphics |
| `rw-aspect-document` | 8.5:11 | Source packet and record previews |
| `rw-aspect-dashboard` | 16:9 | Dashboard panels and chart frames |

## Figma Handoff Rules

- Use component properties for variants instead of separate disconnected artboards.
- Source states must use `SourceLabel` variants, not loose text.
- Empty states must include a next action.
- Numbers must be real, example-labeled, or omitted.
- Public claims must be source-backed or marked as a question, under review, allegation, opinion, or insufficient data.
- Never expose private addresses, minor children, private personal data, or unsourced criminal accusations in public examples.
- Design frames should show mobile first, then desktop expansion.
