# RepWatchr Figma Design System Export

Figma file: https://www.figma.com/design/9o5pVXKVimcLMcnSjSzYX9

## Design Direction

RepWatchr is a civic operating system, not a flat directory. The design system is dark-mode first, mobile-first, glass-heavy, source-first, and built around motion that creates real utility instead of fake urgency.

Core language:
- Glass panels
- Depth and glow
- Noise/grid texture
- Floating predictive search
- 3D dossier cards
- Animated statistics
- Heatmaps
- Timeline events
- Dynamic dashboards
- Command palette
- Hover lighting and elastic buttons

## Figma Pages

- `00 Cover`
- `01 Getting Started`
- `02 Foundations`
- `03 Components`
- `04 Screens`
- `05 Motion`
- `06 Export`

## Repo Export

CSS tokens:
- `src/styles/repwatchr-civic-tokens.css`

React components:
- `src/components/design-system/RepWatchrCivic.tsx`

Current exports:
- `CivicShell`
- `GlassPanel`
- `ElasticButton`
- `FloatingSearchShell`
- `LiveCounter`
- `DossierCard`
- `CommandPaletteList`
- `HeatmapGrid`
- `TimelineEvent`

## Implementation Notes

- Use real data states. Do not fake activity, fake scarcity, or fake alerts.
- Use `prefers-reduced-motion` fallbacks.
- Keep every public claim source-backed.
- Keep private identity data out of public UI.
- Every major page should include at least one next-click mechanism: watch, compare, submit source, open related record, copy safe line, or follow race.
