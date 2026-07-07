# RepWatchr Mobile PWA System

RepWatchr is designed for mobile return paths from texts, social links, public meetings, local conversations, and source packets. The mobile PWA layer is intentionally conservative: it improves app-shell usability without caching private civic data.

## Implemented Pieces

- Web manifest at `/manifest.webmanifest`
- App metadata and mobile viewport in `src/app/layout.tsx`
- Global mobile action dock in `src/components/mobile/MobileAppShell.tsx`
- Subtle install prompt after engagement threshold
- Native share with clipboard fallback
- Offline fallback page at `/offline`
- Service worker at `/sw.js`
- Safe-area support for modern phones
- Mobile analytics events

## Manifest

The manifest uses:

- `name`: RepWatchr
- `short_name`: RepWatchr
- `description`: Public-record accountability profiles for officials, agencies, boards, and public power.
- `start_url`: `/`
- `scope`: `/`
- `display`: `standalone`
- `background_color`: `#06172f`
- `theme_color`: `#06172f`
- Icons from existing RepWatchr image assets
- Shortcuts for search, submit source, source packet, and dashboard
- Share target that routes shared URLs into `/submit-source`

## Mobile Action Dock

The dock is route-aware and appears only on mobile widths.

Variants:

- Homepage: Search, Source, Packet, Dashboard
- Profile: Watch, Source, Share, Packet, More
- Story: Share, Source, Watch, Question, More
- Race: Watch, Compare, Source, Share, More
- Dashboard: Search, Watchlists, Packet, Submit, Settings
- Admin: Review, Search, Sources, Alerts, More

The dock never writes private data by itself. Actions link to existing routes, copy safe public questions, or call Web Share where supported.

## Offline Behavior

The service worker caches only:

- `/offline`
- `/manifest.webmanifest`
- public logo/icon assets
- Next static assets
- public image assets

It does not cache:

- `/api`
- `/admin`
- `/dashboard`
- `/auth`
- `/login`
- `/submit-source`
- `/tools/public-records-response`
- `/services/checkout`
- `/unsubscribe`

Navigation requests fall back to `/offline` only when the network fails.

## Install Prompt

The install prompt is intentionally subtle:

- waits for `beforeinstallprompt`
- waits until at least three local sessions
- is dismissible
- does not claim urgency or scarcity
- tracks prompt shown, clicked, dismissed, and installed events

## Analytics

Tracked events:

- `mobile_action_dock_clicked`
- `pwa_install_prompt_shown`
- `pwa_install_prompt_clicked`
- `pwa_install_prompt_dismissed`
- `pwa_installed`
- `native_share_clicked`
- `offline_page_viewed`

## Production Notes

- The service worker is safe to run without credentials.
- Offline source packet drafts are not implemented yet.
- No private watchlist, dashboard, admin, submission, checkout, or auth response is cached.
- If future offline drafts are added, keep them local-only until explicit user submission.
