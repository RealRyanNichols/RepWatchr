# RepWatchr Analytics System

Purpose: build first-party, privacy-bounded analytics before monetization. RepWatchr needs to know which public-record tools people use, which records create action, and which package ideas show demand. It does not need creepy surveillance.

## What This System Learns

- Entry pages and conversion routes
- Referrer and UTM attribution
- Search terms typed into RepWatchr
- Officials, races, issues, counties, sources, and package ideas people engage with
- Source clicks, shares, watch actions, packet builds, source submissions, and package-interest clicks
- Session depth, time spent, scroll depth, and click-position heatmap samples
- Which behaviors predict account creation, paid package interest, or research requests

## What This System Does Not Do

- No raw IP address storage in the visitor intelligence tables
- No raw user-agent storage
- No exact geolocation
- No private addresses
- No cross-site ad tracking
- No browser fingerprinting beyond a normal anonymous visitor ID and session ID
- No public exposure of individual visitor behavior
- No sale of personal political-interest profiles or private watchlists

## Tables

### `analytics_events`

Canonical event stream. This is the source for product analytics, funnels, attribution reporting, and monetization-readiness signals.

Important fields:

- `event_name`
- `event_family`
- `anonymous_id`
- `user_id`
- `session_id`
- `route`
- `pathname`
- `referrer`
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`
- `device_type`, `browser`, `os`
- `metadata`
- `created_at`

### `visitor_profiles`

Temporary anonymous visitor profile. This stores aggregate behavior counts and interest scores for personalization and product learning.

Important fields:

- `anonymous_id`
- `first_route`, `last_route`
- `first_referrer`, `latest_referrer`
- `first_utm`, `latest_utm`
- `session_count`, `page_view_count`, `profile_view_count`, `search_count`
- `source_click_count`, `source_submission_count`, `watch_click_count`
- `share_click_count`, `packet_build_count`, `package_interest_count`
- `signup_converted_at`, `converted_user_id`
- `interest_scores`

### `visitor_sessions`

Session-level record keyed by `session_id`.

Important fields:

- `anonymous_id`
- `session_id`
- `started_at`, `ended_at`
- `entry_route`, `exit_route`
- `referrer`, `utm`
- `page_views`, `events_count`, `engaged_seconds`
- `device_type`

### `visitor_interest_events`

Atomic interest-scoring records.

Important fields:

- `interest_key`
- `interest_family`
- `weight`
- `source_event`
- `source_entity_type`
- `source_entity_id`
- `route`
- `metadata`

### `attribution_touches`

Attribution trail for routes, referrers, UTMs, package-interest events, and conversion points.

## Code Surface

- Client utilities: `src/lib/analytics-client.ts`
- Server utilities: `src/lib/analytics-server.ts`
- Event taxonomy: `src/lib/analytics-taxonomy.ts`
- Legacy bridge: `src/lib/visitor-intelligence-client.ts`
- Site tracker: `src/components/shared/VisitorIntelligenceTracker.tsx`
- Analytics API: `src/app/api/analytics/visitor/route.ts`
- Merge API: `src/app/api/analytics/visitor/merge/route.ts`
- Admin analytics page: `/admin/analytics`
- Existing behavioral dashboard: `/admin/behavioral-analytics`
- Migration: `supabase-visitor-intelligence.sql`

## Utilities

Client:

- `getOrCreateAnonymousId()`
- `getOrCreateSessionId()`
- `getAttributionContext()`
- `trackEvent(eventName, metadata, options)`
- `useTrackPageView()`
- `useTrackClick()`
- `useTrackFormStep()`
- `useTrackSectionView()`

Server:

- `serverTrackEvent(input)`
- `updateVisitorProfile(event)`
- `updateInterestScore(input)`
- `mergeAnonymousVisitorIntoUser(anonymousId, userId)`

## Flow

1. Browser creates or reads `anonymous_id` from local storage.
2. Browser creates or reads `session_id` from session storage.
3. `VisitorIntelligenceTracker` records page view, scroll, time, clicks, forms, share actions, packet actions, package interest, and exits.
4. `/api/analytics/visitor` sanitizes payloads, strips risky private text, and writes:
   - canonical `analytics_events`
   - compatibility `visitor_events`
   - `attribution_touches`
   - visitor/session rollups
   - interest-scoring rows
5. When a visitor logs in or creates an account, `/api/analytics/visitor/merge` connects anonymous history to the authenticated user.
6. Admin views read aggregate analytics. Public pages do not expose raw visitor behavior.

## Monetization Readiness Signals

High-value signals:

- `package_interest_clicked`
- `package_interest_submitted`
- `pricing_interest_clicked`
- `research_request_started`
- `research_request_completed`
- `source_submit_completed`
- `packet_builder_completed`
- `profile_watch_clicked`
- `watchlist_add`
- `global_search_submitted`

These signals help decide which products to build or sell. They are not permission to sell individual personal profiles.

## Admin Empty States

Use these empty states:

- Traffic data appears after visitors interact with RepWatchr.
- Package interest appears after package cards are shown.
- Search data appears after the search system is connected.
