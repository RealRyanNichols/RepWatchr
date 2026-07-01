# RepWatchr Member Dashboard

## Purpose

The member dashboard turns RepWatchr from a browse-only site into a private civic operating screen. Members should return to:

- watch officials, agencies, races, issues, boards, courts, donors, PACs, cities, and counties;
- check source submission and correction status;
- build and submit source packets;
- track public-record request drafts;
- manage contributor reputation;
- control digest preferences;
- reset personalization interests;
- express package or beta interest without enabling checkout.

The dashboard must never expose another user's private activity, email, watchlists, submissions, or interest profile.

## Routes

| Route | Purpose | Status |
| --- | --- | --- |
| `/dashboard` | Member command center | Server-protected shell implemented |
| `/api/member/dashboard` | User-scoped dashboard snapshot | Implemented |
| `/api/member/notification-preferences` | Read/update digest preferences | Implemented |
| `/api/member/interest-profile/reset` | Delete current user's interest scores | Implemented, needs service role in production |
| `/dashboard/watchlists` | Full watchlist office | Existing route |
| `/dashboard/claims` | Claimed profile and submissions office | Existing route |
| `/dashboard/settings` | Member settings | Existing route |

## Authentication

The `/dashboard` layout performs a server-side Supabase user check before rendering the client dashboard.

Behavior:

- If Supabase auth env vars are missing, the route shows a protected setup placeholder.
- If auth is configured but no user is present, the route redirects to `/auth/login?next=/dashboard`.
- Private dashboard APIs call `supabase.auth.getUser()` server-side and filter by the current `user.id`.
- The dashboard does not rely on client-only role checks.

Required production env:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_ENABLE_SUPABASE_AUTH`
- `SUPABASE_SERVICE_ROLE_KEY` for interest reset and admin-backed analytics/data work

## Database

Added migration:

- `supabase-member-dashboard.sql`

Tables:

- `notification_preferences`
- `contribution_events`
- `contributor_profiles` compatibility columns when the existing richer contributor schema is already installed

Existing systems reused:

- `member_watchlists`
- `member_watchlist_items`
- `member_watchlist_alert_preferences`
- `member_watchlist_alert_events`
- `form_submissions`
- `saved_searches`
- `contributor_profiles`

RLS posture:

- Authenticated users may read/manage their own notification preferences.
- Authenticated users may read their own contribution events and insert their own submitted contribution events.
- Admin/reviewer/researcher roles may manage dashboard records through the operator policy.
- Public users do not read private dashboard records.

Supabase note:

- New public tables include explicit `GRANT` statements because Supabase's Data API no longer exposes new public tables automatically in new projects.

## Dashboard Modules

1. Intelligence Summary
   - watched items
   - submissions
   - accepted sources
   - packets built
   - saved searches
   - profile updates
   - correction requests
   - verification status

2. Watchlists
   - shows private watchlists and watched records
   - links to the full watchlist office
   - empty state pushes users to search and watch

3. Recent Changes
   - uses watchlist alert events
   - empty state explains updates appear after records are attached or changed

4. My Submissions
   - uses universal intake `form_submissions`
   - shows source submissions, correction requests, broken link reports, missing official/agency reports, and package interest

5. Source Packet Builder
   - shows packet-related submissions where available
   - links to the existing Texas contribution/source packet lane and source queue
   - export remains disabled until persistent packet drafts are installed

6. Public Records Request Drafts
   - shows `public_records_request` intake rows
   - uses safe status labels
   - warns that uploaded responses should stay private until reviewed

7. Contributor Reputation
   - shows contribution score, accepted source count, corrections, packets, watchlists, rejected count
   - public profile stays optional
   - no harassment-oriented badges

8. Interest Profile Controls
   - explains personalization boundary
   - provides reset action
   - states that RepWatchr does not sell personal political-interest profiles

9. Digest Preferences
   - weekly digest
   - daily digest
   - breaking alerts
   - watched official/race updates
   - source review updates
   - contribution updates
   - package updates
   - no email is sent unless delivery and consent are configured

10. Future Upgrades / Package Interest
   - Quick Record Check
   - Official Record Brief
   - Local Race Source Pack
   - Election Watch Desk
   - School Board Monitor
   - County Monitor
   - Journalist Desk
   - Organization Dashboard

## Analytics

Dashboard events added or wired:

- `dashboard_open`
- `dashboard_module_open`
- `dashboard_next_action_clicked`
- `watchlist_open`
- `dashboard_packet_started`
- `dashboard_submission_opened`
- `digest_settings_changed`
- `interest_profile_reset`
- `package_interest_clicked_from_dashboard`

Private route tracking rule:

- The global visitor tracker still does not auto-track `/dashboard` clicks or page views.
- Explicit dashboard events are allowed so product usage can be measured without broad private-route tracking.

## Known Follow-Ups

- Build persistent source packet draft storage and export history.
- Build a dedicated public-records request generator route if it does not exist in the active app.
- Add hide-topic and manual-topic controls to the interest profile.
- Add server-side digest preview generation.
- Connect notification preferences to an email provider only after consent and `ENABLE_EMAIL_SENDING=true`.
- Add admin views for dashboard module activity and package interest.
- Backfill contributor profile compatibility columns from the richer contributor tables where needed.
