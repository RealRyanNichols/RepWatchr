# RepWatchr Mobile UX Rules

RepWatchr mobile pages should feel like a civic tool, not a static website. The user should be able to search, save, submit, share, and return from any major page.

## Non-Negotiables

- No horizontal scroll.
- Tap targets should be at least 44px high.
- Keep search, source submission, packet builder, sharing, and dashboard within one tap.
- Do not place important actions only in desktop sidebars.
- Tables become mobile cards or scroll safely inside a constrained container.
- Timelines become vertical.
- Graphs become list-first on mobile.
- Forms use short sections or steppers.
- Text must not overflow buttons, cards, or nav rows.
- Respect `env(safe-area-inset-bottom)` for fixed controls.
- Respect reduced-motion preferences.

## Mobile Action Dock

The global dock owns the persistent mobile action layer. Do not add competing sticky bars to the same viewport unless the route is intentionally full-screen.

Default action jobs:

- Search: find public records fast
- Watch: save or return to watched records
- Source: submit a missing public source
- Packet: build a source packet
- Share: use native share or copy fallback
- Dashboard: return to member tools

## Page Requirements

Every major public page should expose:

- one next action
- one source action
- one share action
- one correction or better-source path
- one route back to search or dashboard

## Safe Sharing

Mobile share copy should:

- state that RepWatchr is showing a public-record page
- avoid inflammatory or unsupported claims
- prefer a public question when proof is incomplete
- route missing-source context back to `/submit-source`

## Offline

Offline UI must not pretend records are current. Use clear language:

- live records require a connection
- dashboard/admin data is not cached
- source submissions happen only when online
- private or sensitive records are never cached by the service worker

## Install Prompt

Install prompts should be:

- subtle
- dismissible
- shown only after engagement
- never fake urgent
- never framed as required

## Visual Rules

- Dark civic shell is acceptable for persistent mobile controls.
- Keep panel depth, but avoid blocking the page.
- Use safe-area spacing and bottom padding.
- Prefer icons plus short labels in dock actions.
- Avoid long button text in fixed controls.
