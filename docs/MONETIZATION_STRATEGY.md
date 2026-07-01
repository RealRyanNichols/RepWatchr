# RepWatchr Monetization Strategy

RepWatchr should monetize only after it can prove demand, protect trust, and fulfill source-backed work without creating legal, privacy, or safety exposure.

The current posture is demand capture, not public checkout.

## Practical Recommendation

Keep `ENABLE_PAYMENTS=false` until RepWatchr has enough signals to decide which packages are real:

- package interest submissions
- source submissions
- source packets built
- watchlist intent
- search demand
- profile/race/jurisdiction traffic
- repeat visits
- high-intent requests with named jurisdictions and deadlines

Do not sell private user behavior. Do not sell individual political-interest profiles. Use aggregate, non-identifying demand data to decide what to build, price, and fulfill.

## Current Package Lines

Public package pages now exist for:

- Quick Record Check
- Official Record Brief
- Local Race Source Pack
- Election Watch Desk
- School Board Monitor
- County Monitor
- Journalist Desk
- Attorney Research Desk
- Public Data API
- Organization Dashboard

Additional future package keys are supported in the interest table:

- Campaign Finance Tracker
- Bulk Profile Export
- Custom Research
- Investor / Partner

## Monetization Rules

RepWatchr sells organization, source review, public-record workflows, monitoring, and aggregate civic intelligence.

RepWatchr does not sell:

- private user behavior
- individual political-interest profiles
- private watchlists
- raw user submissions
- private personal data
- private addresses
- minor/family details
- unsupported accusations
- guaranteed political outcomes

## Readiness Signals

The admin demand dashboard at `/admin/monetization` tracks:

- total package interest
- interest by package
- interest by jurisdiction
- source route
- organization type
- urgency
- high-intent rows
- anonymous intent
- conversion funnel events
- package-level readiness recommendations

Readiness categories:

- Traffic readiness
- Identity readiness
- Data readiness
- Engagement readiness
- Demand readiness
- Trust readiness
- Fulfillment readiness
- Payment readiness

## Launch Guidance

Do not launch checkout for a package until:

- package page exists
- repeated demand exists
- high-intent demand exists
- source review workflow exists
- fulfillment workflow exists
- correction/safety rules are active
- admin can review submissions
- payment webhooks are tested
- refund/support expectations are documented

If data is thin, keep collecting package interest and run manual beta review.
