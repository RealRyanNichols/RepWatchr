# RepWatchr Civic Intelligence Operating Brief

RepWatchr is a civic intelligence and public-record accountability platform.

Brand promise:

```text
Search. Grade. Source. Share.
```

## Current Rule

RepWatchr is not ready to sell yet.

Before sales or paid package activation, RepWatchr must prove the foundations are working:

1. Searchable public profiles.
2. Clickable profile systems.
3. Watchlists.
4. Source submissions.
5. Correction requests.
6. Public-record packet builders.
7. User accounts.
8. Anonymous visitor tracking.
9. Behavioral analytics.
10. Interest scoring.
11. Forms.
12. Data intake.
13. Admin queues.
14. Member dashboards.
15. SEO and indexing.
16. Share mechanisms.
17. Next-click mechanisms.
18. Votable feedback mechanisms.
19. Contributor reputation.
20. Package-interest capture.
21. Monetization-readiness reporting.
22. Payment infrastructure later, behind a feature flag.

The admin readiness route tracks this list:

```text
/admin/monetization-readiness
```

The API behind it is:

```text
/api/admin/monetization-readiness
```

Both routes are admin-only and noindexed.

## What Features Must Support

Every feature must support at least one of these:

- Collect lawful public-record data.
- Help visitors search public officials.
- Get visitors to click deeper.
- Capture source submissions.
- Capture corrections.
- Capture user intent.
- Understand what people care about.
- Increase return visits.
- Build trust.
- Build SEO surface area.
- Prepare future monetization.
- Make the product feel valuable enough to pay for later.

## Monetization Boundary

RepWatchr must not monetize by selling:

- Private user behavior.
- Individual political interest profiles.
- Private watchlists.
- Personal data.
- Private addresses.
- Sensitive targeting lists.

Future monetization should stay in these lanes:

- Paid research packets.
- Official record briefs.
- Local race source packs.
- Election watch desks.
- County monitoring dashboards.
- School board monitoring dashboards.
- Journalist dashboards.
- Organization dashboards.
- Public data APIs.
- Aggregate non-identifying civic attention reports.
- Public-record workflow tools.
- Source packet exports.
- Member subscriptions.
- Enterprise subscriptions.
- Investor and partner relationships.

## Hard Safety Rules

- No private home addresses.
- No minor children.
- No doxxing.
- No threats.
- No harassment instructions.
- No unsourced criminal accusations.
- No personal medical information.
- No private financial information.
- No publishing personal contact information unless it is clearly official public contact information.
- No AI-generated accusations.
- No language that implies guilt beyond what a source proves.
- No raw user-submitted allegations published as fact.
- No official score that pretends to be truth unless the scoring method is clear and source-based.
- Every serious claim needs a source URL or a clear label saying it needs a source.

## Required Public Labels

- Confirmed public record
- Source-backed claim
- Public question
- Needs source
- Under review
- Correction requested
- Opinion
- Allegation
- Insufficient data
- Archived
- Updated

## Design Direction

RepWatchr should feel like a premium civic intelligence command center:

- Dark mode first.
- Glass panels.
- Glow borders.
- Subtle gradients.
- Responsive layouts.
- Real data counters only.
- Source-node visuals.
- Timelines.
- Profile completeness rings.
- Sticky action rails.
- Mobile bottom action bars.
- Source trails.
- Clickable dashboards.
- Share drawers.
- Votable feedback buttons.
- Strong empty states.
- Loading skeletons.
- Hover motion.
- Reduced-motion accessibility support.

Avoid:

- Generic SaaS surfaces.
- Flat plain cards.
- Unstyled tables.
- Plain text walls.
- Dead-end pages.
- Public setup errors.
- "Coming soon" as a substitute for useful action.

## Operator Use

Use `/admin/monetization-readiness` before activating any paid lane.

If a check is blocked, build only the missing prerequisite. Do not open sales until the readiness report says the required systems are ready and the future-revenue feature flags have been manually approved.
