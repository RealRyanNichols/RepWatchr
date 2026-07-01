# RepWatchr Database Migration Order

The repo currently uses root-level Supabase SQL runbooks instead of a `supabase/migrations` folder. Apply them in dependency order. Do not apply future/revenue/payment SQL before the base role, source, admin, and dashboard tables exist.

## Phase 0: Project Setup

1. Confirm Supabase project exists.
2. Confirm Auth is enabled.
3. Confirm the SQL editor user has permission to create tables, policies, functions, views, triggers, and storage buckets.
4. Confirm environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Phase 1: Base Identity and Public Feedback

1. `supabase-schema.sql`
   - `profiles`
   - `citizen_votes`
   - aggregate approval views

2. `supabase-profile-claims.sql`
   - `user_roles`
   - profile claims
   - subscriptions placeholder
   - claimed profile content/media
   - profile storage policies

3. `supabase-owner-bootstrap.sql`
   - operator invite flow
   - Auth trigger for invited operators

## Phase 2: Admin and Review Foundation

4. `supabase-superadmin-office.sql`
   - operator tasks
   - accountability cases
   - public questions/responses

5. `supabase-admin-dashboard.sql`
   - admin audit logs
   - admin notes
   - assignments
   - import/data health tables

6. `supabase-data-import-adapters.sql`
   - public data source registry
   - normalized data source field map
   - import adapter run/error tracking extensions
   - initial source registry seeds

7. `supabase-trust-safety-corrections.sql`
   - correction requests
   - privacy requests
   - correction events

## Phase 3: Intake and Source Review

7. `supabase-universal-data-intake.sql`
   - form definitions
   - form submissions
   - form submission events

8. `supabase-source-submission-system.sql`
   - source submissions
   - source submission events
   - source review notes
   - approved source links

9. `supabase-ai-source-review.sql`
   - admin-only AI source review runs
   - AI review feedback
   - advisory safety/recommendation records

10. `supabase-source-packets-records-requests.sql`
   - source packets
   - public-record request drafts

## Phase 4: Search, Watchlists, Analytics, and Personalization

10. `supabase-search-discovery.sql`
    - search index
    - saved searches

11. `supabase-predictive-search.sql`
    - predictive search events
    - public suggestions

12. `supabase-watchlists-feedback-next-click.sql`
    - watchlists
    - watch events
    - anonymous watch intents
    - feedback votes

13. `supabase-member-watchlists.sql`
    - unlimited member watchlists
    - alert/digest records

14. `supabase-visitor-intelligence.sql`
    - anonymous visitor profiles
    - sessions/events
    - interest scores
    - analytics/attribution events

15. `supabase-behavioral-analytics.sql`
    - behavioral analytics summaries
    - heatmap/funnel/cohort tables

## Phase 5: Public Data Models

16. `supabase-public-entity-model.sql`
    - jurisdictions
    - public entities
    - agencies
    - official profiles
    - public roles

17. `supabase-official-timelines.sql`
    - official timelines
    - timeline sources

18. `supabase-school-board-model.sql`
    - school board evidence

19. `supabase-texas-election-contributions.sql`
    - Texas election contribution intake/review

20. `supabase-profile-overlays.sql`
    - profile completion/enrichment/vote snapshots

21. `supabase-profile-scorecards.sql`
    - verified profile scorecard votes

22. `supabase-citizen-grades.sql`
    - citizen grade data

## Phase 6: Contributor, Growth, and Media Systems

23. `supabase-member-dashboard.sql`
24. `supabase-gideon-member-tools.sql`
25. `supabase-faretta-analytics.sql`
26. `supabase-contributor-profiles.sql`
27. `supabase-growth-engine.sql`
28. `supabase-social-monitoring.sql`
29. `supabase-social-autopost.sql`
30. `supabase-daily-news-clips.sql`

## Phase 7: Monetization Readiness and Future Systems

31. `supabase-package-interest.sql`
32. `supabase-pricing-experiments.sql`
33. `supabase-political-data-products.sql`
34. `supabase-future-revenue.sql`

Keep payment/checkout publicly disabled unless the payment feature flag is intentionally enabled and Stripe is fully verified.

## Phase 8: Final Security Hardening

35. `supabase-security-rls-hardening.sql`

Run this last because earlier SQL files redefine role helper functions. This final pass makes `user_roles` the database source of truth and adds explicit grants for Supabase Data API compatibility.

## Verification

Run local boundary check:

```bash
node scripts/check-supabase-boundaries.mjs
```

Run Supabase SQL smoke check:

```sql
-- paste and run scripts/repwatchr-rls-smoke-check.sql
```

Then run Supabase Security Advisor and confirm:

- No public table without RLS.
- No anon access to admin-only tables.
- Anonymous inserts still work for source/form/correction/package interest intake.
- Public approved source links and search rows remain readable.
- A normal user cannot read another user’s watchlist or dashboard data.
- `admin` and `super_admin` users can access review/admin queues.
