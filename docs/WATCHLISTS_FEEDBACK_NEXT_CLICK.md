# RepWatchr Watchlists, Feedback, and Next-Click System

RepWatchr needs to learn what people care about before it charges for packages. This system captures three connected signals:

1. watch intent
2. civic/product feedback
3. next useful click behavior

This is not election voting. Public copy must call it civic feedback, watch intent, source feedback, or product feedback.

## Database

Migration:

`supabase-watchlists-feedback-next-click.sql`

Tables:

- `watchlists`
- `watchlist_items`
- `watch_events`
- `anonymous_watch_intents`
- `feedback_votes`
- `feedback_rollups`

Existing dashboard compatibility:

- logged-in watch button saves are mirrored into existing `member_watchlists` / `member_watchlist_items` where possible.

## Watchlists

Watchable entity types:

- official
- candidate
- race
- office
- agency
- school board
- city
- county
- state
- federal district
- judge
- court
- sheriff
- police department
- bill
- vote
- donor
- PAC
- vendor
- story
- source
- issue
- search query

Components:

- `WatchButton`
- `WatchModal`
- `WatchReasonSelector`
- `WatchlistPicker`
- `CreateWatchlistInline`
- `AnonymousWatchPrompt`
- `AnonymousWatchIntentConverter`

API:

- `POST /api/watch`
- `PATCH /api/watch`

Anonymous flow:

1. visitor clicks Watch
2. RepWatchr records `anonymous_watch_intents`
3. visitor sees account prompt
4. after login/signup, `AnonymousWatchIntentConverter` calls `PATCH /api/watch`
5. pending intents attach to the user

Watch reasons:

- My district
- My county
- My school board
- Public safety
- Campaign finance
- Vote tracking
- Meeting monitoring
- Research
- Media
- Legal/professional
- Other

Events:

- `watch_button_clicked`
- `watch_reason_selected`
- `watchlist_created`
- `watchlist_add`
- `anonymous_watch_intent_created`
- `anonymous_watch_converted`
- `watchlist_remove`

## Civic Feedback

API:

- `POST /api/feedback`

Components:

- `FeedbackButton`
- `FeedbackCluster`
- `FeedbackMeter`
- `FeedbackRollupBadge`
- `ReportBrokenSourceButton`

Rules:

- one active vote per anonymous/user per feedback type per entity
- users can change feedback
- identity is not exposed publicly
- rollups are shown publicly only after threshold count
- feedback routes to admin/product prioritization, not official election results

Profile feedback:

- useful
- needs more sources
- request review
- compare this

Source feedback:

- useful source
- broken link
- needs context
- better source exists

Public question feedback:

- good question
- needs wording
- ask at meeting

Events:

- `feedback_vote_clicked`
- `feedback_vote_changed`
- `feedback_rollup_updated`

## Next-Click Engine

Utility:

`getNextActions(context)`

Components:

- `NextActionRail`
- `NextActionCards`
- `MobileNextActionBar`

Rules:

- no more than three primary actions
- no annoying popups
- no fake urgency
- desktop rail does not block content
- mobile bar is thumb-friendly

Tracked events:

- `next_action_impression`
- `next_action_clicked`
- `next_action_dismissed`
- `next_action_converted`

Current placement:

- global app shell uses `NextActionRail`
- profile hero uses `WatchButton`
- profile record summary uses `FeedbackCluster`
- profile source trail uses source feedback
- public question cards use question feedback

## Monetization Signals

These signals help prioritize future packages:

- high watch count on an official, county, school board, race, or issue
- source cards marked broken
- profiles marked needs more sources
- public questions copied or marked useful
- next actions that point to package interest
- anonymous watch intent conversion after account creation

Do not sell private watchlists or personal political-interest profiles. Aggregate, consent-aware demand signals are the monetization direction.

## Verification

Minimum checks:

- watch button saves anonymous intent when logged out
- watch button saves user watch when logged in
- pending anonymous watch converts after login
- feedback writes a row and refreshes rollup
- next-action rail appears on public pages
- admin/private routes stay protected
- build passes
