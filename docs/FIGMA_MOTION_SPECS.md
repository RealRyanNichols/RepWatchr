# RepWatchr Figma Motion Specs

Design system: **Civic Intelligence Terminal**

Motion should make RepWatchr feel alive, clickable, and data-rich. It should not create fake urgency or make unsupported claims feel more certain than they are.

## Global Motion Principles

- Motion supports orientation and interaction.
- Motion never carries the only meaning.
- Reduced-motion users get static equivalents.
- No fake notifications.
- No fake activity pulses.
- No fake scarcity countdowns.
- No aggressive flashing.

## Motion Tokens

| Token | Duration | Easing | Use |
| --- | ---: | --- | --- |
| Page Reveal | 360ms | ease-out | Main page sections enter |
| Panel Hover Lift | 180ms | ease-out | Clickable cards/panels |
| Source Pulse | 1600ms | ease-in-out loop | Real source nodes only |
| Timeline Draw | 520ms | ease-out | Timeline line/node reveal |
| Metric Count | 700ms | ease-out | Real counters only |
| Drawer Slide | 240ms | ease-out | Share drawer/filter drawer |
| Command Palette Open | 180ms | ease-out | Cmd/Ctrl + K |
| Button Glow | 160ms | ease-out | Hover/focus on buttons |
| Loading Skeleton | 1200ms | linear loop | Loading rows/cards |

## Page Reveal

Use on:

- Homepage hero.
- Search results.
- Profile dossier sections.
- Dashboard modules.
- Admin command-center panels.

Behavior:

- Initial opacity 0 to 1.
- Translate Y 12px to 0.
- Stagger major sections by 60ms maximum.

Reduced motion:

- No translate.
- Immediate opacity.

Do not:

- Delay content enough to make the page feel slow.
- Animate every paragraph individually.

## Panel Hover Lift

Use on:

- Action cards.
- Profile cards.
- Search result cards.
- Package interest cards.
- Source gap cards.
- Dashboard panels.

Behavior:

- Translate Y -2px to -4px.
- Border brightens.
- Shadow deepens.
- Optional soft source glow.

Duration:

- 160 to 200ms.

Reduced motion:

- No translation.
- Border/focus change remains.

## Source Pulse

Use only for:

- Confirmed public source nodes.
- Active source trail.
- Watch/source CTAs.
- Timeline source node when attached to a public record.

Behavior:

- Small node glow opacity cycles from 40 percent to 90 percent and back.
- Scale max 1.08.
- Duration 1400 to 1800ms.

Do not use for:

- Fake activity.
- Fake viewer count.
- Fake urgency.
- Under-review claims unless clearly labeled.

Reduced motion:

- Static glow.

## Timeline Draw

Use on:

- Profile timeline.
- Vote timeline.
- Meeting timeline.
- Source-event timeline.

Behavior:

- Vertical line appears from top to bottom.
- Nodes fade in after the line reaches them.
- Event card hover highlights corresponding node.

Reduced motion:

- Timeline appears fully rendered.

Accessibility:

- Timeline order must be semantic in DOM; animation is decorative.

## Metric Count

Use only when:

- The number is real.
- It is loaded from current data.
- The card label is clear.

Behavior:

- Count from 0 or previous value to final value.
- Duration 500 to 800ms.

Do not:

- Animate unwired placeholders.
- Animate fake “people watching now” numbers.

Reduced motion:

- Show final value immediately.

## Drawer Slide

Use on:

- Share drawer.
- Filter drawer.
- Mobile menu.
- Package interest modal.
- Source preview drawer.

Desktop:

- Side drawer slides from right.
- Overlay fades in.

Mobile:

- Bottom sheet slides from bottom.
- Drag handle optional.

Duration:

- 220 to 260ms.

Reduced motion:

- Fade only or instant open.

## Command Palette Open

Use on:

- Global command palette.
- Predictive search overlay.

Behavior:

- Backdrop fades.
- Palette scales 0.98 to 1.
- Search field focuses.
- Results fade in.

Keyboard:

- Cmd/Ctrl + K opens.
- Escape closes.
- Arrow keys navigate.

Reduced motion:

- Instant open/close.

## Button Glow

Use on:

- Primary CTA.
- Submit source.
- Build packet.
- Watch.
- Share.
- Request correction.

Behavior:

- Border and soft outer glow increase.
- Optional icon nudge 2px.

Reduced motion:

- No nudge.
- Color/focus ring remains.

## Loading Skeleton

Use on:

- Search results.
- Admin tables.
- Dashboard modules.
- Profile evidence modules.
- Source packet preview.
- Records request preview.

Behavior:

- Shimmer left to right on loading block.
- Keep final layout dimensions stable.

Reduced motion:

- Static blocks.

## Screen Motion Patterns

### Homepage

- Hero console reveals first.
- Search input glow on focus.
- Counters count only when real.
- Action cards lift on hover.
- Source gap cards show red/amber border shift.
- Mobile dock has active icon glow.

### Search

- Results fade in after query.
- Filter drawer slides.
- No-result CTA panel reveals with source pulse.
- Saved search confirmation uses small badge state, not toast spam.

### Profile Dossier

- Profile hero reveals.
- Completeness ring may draw once.
- Source trail nodes pulse only for confirmed/source-backed items.
- Timeline line draws.
- Vote/funding tables should not animate row order after initial load.

### Source Submission

- Stepper advances with horizontal or fade transition.
- Source URL validation state changes instantly.
- Packet preview updates with subtle fade.
- Success page reveal includes submission ID.

### Source Packet Builder

- Preview updates with fade, not jump.
- Copy/export confirmation changes button label.
- Safety warning remains static and readable.

### Public Records Request Tool

- Generated preview fades in.
- Tab transitions are instant or 120ms fade.
- Copy state is label change, not distracting animation.

### Member Dashboard

- Dashboard modules reveal in priority order.
- Recent changes can highlight updated cards.
- Digest preferences toggles animate state only.

### Admin Dashboard

- Keep motion minimal.
- Queues and tables prioritize speed.
- Status changes can flash border once.
- No dramatic animation in moderation workflows.

### Package Pages

- Deliverable preview lifts on hover.
- Interest modal slides.
- FAQ opens/collapses with 160ms height/opacity.
- No checkout urgency motion unless payments are live and compliant.

### Election/Race Hub

- Candidate comparison cards lift.
- Source gaps pulse only when actionable.
- Timeline/election date line draws once.

### County/State Hub

- Local stats count if real.
- Map/graph placeholders remain static until real data exists.
- Source gap cards hover with amber glow.

### Law Enforcement Profile

- Motion is restrained.
- No sirens, flashing red lights, or wanted-style effects.
- Public role boundary box is static and prominent.

### School Board Tracker

- Meeting timeline draw.
- Agenda/minutes/video source rows highlight on hover.
- Watch district CTA uses source pulse.

### Mobile App Shell

- Bottom dock icon active state transitions 120ms.
- Share drawer bottom sheet 240ms.
- Command palette 180ms.
- No parallax on mobile if it affects performance.

## Reduced Motion CSS Guidance

Use this behavior in code and mirror in Figma prototypes:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```

Do not remove focus states in reduced motion.

## Motion QA Checklist

- [ ] Motion has a purpose.
- [ ] Reduced-motion fallback exists.
- [ ] No fake urgency.
- [ ] No fake activity.
- [ ] No flashing or seizure-risk animation.
- [ ] Motion does not hide content.
- [ ] Loading states keep dimensions stable.
- [ ] Focus states are visible without animation.
- [ ] Source pulses are only used for source-backed/actionable states.
- [ ] Admin workflows stay fast and restrained.
