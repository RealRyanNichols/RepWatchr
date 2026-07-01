# RepWatchr Privacy Guardrails

RepWatchr can become a serious civic data product without becoming creepy. The line is simple: aggregate product intelligence is useful; individual political-interest dossiers are not for sale.

## Allowed

- Aggregate page views
- Aggregate search trends
- Aggregate source clicks
- Aggregate profile opens
- Aggregate issue interest
- Aggregate county/race/official engagement
- Aggregate package-interest signals
- Anonymous session depth, scroll depth, and time spent
- Anonymous visitor IDs used only inside RepWatchr
- Session IDs used only to connect page flow inside one visit
- Logged-in user history used for the user's dashboard, watchlists, and digest settings
- De-identified or aggregate reports for data products

## Not Allowed

- Selling personal political-interest profiles
- Selling private watchlists
- Selling raw account-level behavior
- Storing private home addresses in analytics
- Storing exact geolocation
- Storing raw IP addresses in visitor intelligence tables
- Storing raw user-agent strings in visitor intelligence tables
- Fingerprinting users beyond normal anonymous visitor/session IDs
- Tracking users across unrelated websites
- Publicly exposing individual visitor behavior
- Publicly exposing private source submissions or correction reports
- Using analytics to target harassment

## Required Public Copy

Use this language on privacy, footer, signup, dashboard, and data-capture surfaces where relevant:

> RepWatchr uses analytics to understand which public-record tools people use, improve source review, and prioritize public accountability features. RepWatchr does not sell personal political-interest profiles or private watchlists.

## Data Minimization

Only capture data that supports one of these purposes:

- Improve RepWatchr product flow
- Prioritize source review
- Recommend useful public records
- Measure demand for package ideas
- Build aggregate civic intelligence products
- Detect broken funnels and dead-end pages

Do not capture form field values unless the user is intentionally submitting that form. Analytics metadata should store labels, route, source type, and IDs, not private narratives.

## Admin Boundary

Admin analytics may show aggregate behavior and operational queues. Raw visitor-level access should remain limited to trusted operators and only for debugging, abuse prevention, merge support, or product analysis.

## Public Boundary

Public pages may show aggregate popularity or activity only when it is true and not manipulative. Do not use fake scarcity, fake activity, fake urgency, or fake notifications.

## Monetization Boundary

In-bounds:

- Aggregate issue interest by route, county, race, or public office type
- Aggregate source-confidence reports
- Aggregate package demand
- De-identified trend reports
- Public-record source counts and data-health summaries
- Paid research and source-organization services

Out-of-bounds:

- "This named user cares about immigration"
- "This named user watched this official"
- "This named user searched this opponent"
- Any raw private account behavior sold as a lead list

## Security Notes

- Use RLS on all analytics tables.
- Public visitors may insert analytics events but not read raw rows.
- Authenticated users may read their own user-level rows only if a user-facing view exists.
- Admin/operator access should be server checked.
- Service role stays server-only.
- Metadata sanitization must redact emails and phone numbers.
