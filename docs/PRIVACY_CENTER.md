# RepWatchr Privacy Center

RepWatchr uses first-party analytics and public-record workflows to improve search, watchlists, recommendations, source review, packets, and future aggregate reporting. It must not sell personal political-interest profiles or private watchlists.

## What RepWatchr Collects

- Account email and profile metadata when users sign up.
- Watchlists, saved searches, source submissions, correction requests, privacy requests, and packet activity.
- Anonymous visitor profile data: entry route, referrer, device class, public pages viewed, searches, source clicks, shares, packet builds, and actions.
- Interest signals such as Texas, school boards, campaign finance, open records, votes, and jurisdictions.

## What RepWatchr Does Not Sell

- Raw identity documents.
- Private addresses.
- Private watchlists.
- Personal political-interest profiles.
- Individual political survey answers unless a feature clearly requests public consent.

RepWatchr may later sell aggregate, de-identified, source-backed civic intelligence, but not raw personal profiles.

## User Controls

Routes:

- `/privacy`
- `/privacy/controls`
- `/dashboard/privacy`

Controls:

- Reset interest profile.
- Submit privacy request.
- Request access.
- Request correction.
- Request deletion/account deletion.
- Request opt out.
- Request contributor profile removal.

## Current Implementation Notes

- `PrivacyControlsPanel` powers the controls UI.
- `/api/privacy/interest-reset` deletes or clears visitor interest rows when Supabase admin access is configured.
- `/api/privacy-requests` writes to `privacy_requests`.
- If live data services are not configured, the UI returns a clean operational message instead of exposing secrets or setup details.
