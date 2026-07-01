# RepWatchr Performance And Accessibility Audit

Audit date: 2026-07-01

This pass is code-inspection based. Full Lighthouse, Playwright, and screen-reader testing were not completed because local build/lint/typecheck commands hung in the Google Drive-backed clone.

## Current Strengths

- Root layout includes a consistent header, footer, command palette, visitor tracking, page tracking, and next-action rail.
- A mobile bottom action bar exists through `NextActionRail` and keeps key actions reachable.
- Package, intake, correction, privacy, and error states use visible focus styles, large tap targets, and explicit labels in the inspected code.
- Root 404 and root error boundary now exist, which prevents dead-end crashes from becoming blank or generic framework pages.
- Dynamic OG, sitemap, robots, and metadata utilities exist.
- Public forms inspected in this pass include clear safety copy, validation, honeypots, and useful error messages.

## Performance Risks

| Status | Area | Evidence | Risk | Recommendation |
|---|---|---|---|---|
| not verified | Build output | `next build` started and hung silently in synced clone. | Cannot confirm bundle size, static generation, route compile, or image optimization. | Run `pnpm run build` in Vercel CI or clean local clone. |
| not verified | Bundle size | No bundle analysis run. | Command palette, analytics trackers, charts, and visual effects may inflate initial JS. | Add bundle analyzer and lazy-load heavy dashboards/charts. |
| partial | Image handling | `next.config.ts` has image formats/quality settings; route visuals not audited. | Distorted politician/race/story thumbnails can break trust and mobile layout. | Standardize image wrappers with `aspect-ratio`, `object-fit: cover`, and explicit sizes. |
| partial | Visual effects | Gradients/shadows/glass exist. | Heavy effects may reduce mobile performance if overused. | Use CSS-only effects where possible; respect `prefers-reduced-motion`. |
| not verified | Route transitions | No browser test. | Slow transitions could hurt mobile share traffic. | Playwright smoke test core routes on mobile width. |
| partial | Tables/lists | Admin/source/finance/vote pages likely include dense tables or list components. | Tables may overflow or become unreadable on phones. | Convert public tables to cards on mobile and use horizontal scroll only for admin data grids. |

## Accessibility Risks

| Status | Area | Evidence | Risk | Recommendation |
|---|---|---|---|---|
| partial | Keyboard navigation | New components use `focus-visible`, but no keyboard pass was run. | Command palette, modal close, share drawer, and admin tables could trap focus. | Manual tab/shift-tab/escape test on forms, modals, command palette, admin. |
| partial | ARIA labels | Package modal has `role="dialog"` and `aria-labelledby`; full icon-button scan not completed. | Icon-only buttons may be silent to screen readers. | Add lint/custom scan for icon buttons without labels. |
| partial | Reduced motion | Not fully audited. | Motion/glow/parallax can be uncomfortable or distracting. | Add `motion-reduce:transition-none`/`motion-reduce:transform-none` patterns and avoid essential motion. |
| partial | Contrast | Dark panels and red/blue/gold brand colors need visual contrast check. | Some small uppercase labels may fail contrast on gradients. | Run axe/Lighthouse and adjust labels under 14px. |
| partial | Forms | Form fields have labels and errors in inspected components. | Long forms may be hard on mobile if not stepper-based. | Use stepper layouts for mobile on long intake/package/public-records forms. |
| not verified | Screen reader landmarks | Layout uses semantic `main`, `nav`, `section` in inspected areas. | Full landmark order not verified. | Test with VoiceOver/NVDA or axe. |

## Route Smoke Targets

Test these viewports:

- 390 x 844 mobile
- 768 x 1024 tablet
- 1440 x 900 desktop
- 1920 x 1080 wide desktop

Routes:

- `/`
- `/search`
- `/officials`
- `/officials/[known-id]`
- `/submit-source`
- `/sources/submit`
- `/free-packet`
- `/tools/source-packet-builder`
- `/tools/public-records-request`
- `/packages/quick-record-check`
- `/packages/official-record-brief`
- `/packages/local-race-source-pack`
- `/packages/election-watch-desk`
- `/privacy`
- `/methodology`
- `/dashboard`
- `/admin`

## Performance Acceptance Gates

- Core public routes render without console errors.
- No horizontal scroll at mobile/tablet/desktop widths.
- Images keep stable aspect ratios and do not stretch faces/logos.
- Largest visible image is optimized and has dimensions.
- Initial route is usable before analytics/admin/data-heavy widgets finish.
- Package and intake forms show loading/error/success states.
- Command palette opens with Cmd/Ctrl + K and mobile action dock.
- Reduced-motion mode removes nonessential animation.
- Root 404 and error pages are branded and actionable.

## Accessibility Acceptance Gates

- All buttons and links can be reached by keyboard.
- Modal focus stays inside the modal and Escape/close works.
- Icon-only buttons have accessible names.
- Form errors are connected to visible fields and written in plain English.
- Color is not the only way to understand a score/status.
- Tables are readable or become cards on mobile.
- Public safety labels are visible near claims and sources.
- Next-action rail does not cover submit buttons or footer content.
