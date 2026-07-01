# RepWatchr RLS Policy Map

This map classifies the current RepWatchr Supabase tables by access pattern. It is based on the root-level `supabase-*.sql` files in the source-of-truth clone.

## Public Read

These tables/views should be readable by anonymous visitors only when records are approved, active, public, or published.

| Table or view | Public condition | SQL file |
| --- | --- | --- |
| `jurisdictions` | `status = 'active'` | `supabase-public-entity-model.sql` |
| `public_entities` | active and not private | `supabase-public-entity-model.sql` |
| `agencies` | `status = 'active'` | `supabase-public-entity-model.sql` |
| `official_profiles` | active/safe public profiles only | `supabase-public-entity-model.sql` |
| `public_roles` | active/safe public roles only | `supabase-public-entity-model.sql` |
| `profile_completeness_snapshots` | latest public snapshots | `supabase-public-entity-model.sql` |
| `source_links` | `status = 'active'` | `supabase-source-submission-system.sql` |
| `search_index` | `visibility = 'public' and status = 'active'` | `supabase-search-discovery.sql` |
| `form_definitions` | `status = 'active'` | `supabase-universal-data-intake.sql` |
| `feedback_rollups` | aggregate only | `supabase-watchlists-feedback-next-click.sql` |
| `interest_taxonomy` | active taxonomy terms | `supabase-visitor-intelligence.sql` |
| `approval_ratings` | aggregate view only | `supabase-schema.sql` |
| `approval_ratings_by_county` | aggregate view only | `supabase-schema.sql` |
| `school_board_evidence_approved` | approved evidence view | `supabase-school-board-model.sql` |
| `official_timeline_public_events` | reviewed timeline records | `supabase-official-timelines.sql` |
| `official_timeline_event_counts` | aggregate counts | `supabase-official-timelines.sql` |
| `contributor_public_leaderboard` | public contributor reputation | `supabase-contributor-profiles.sql` |
| `contributor_county_rankings` | aggregate contributor rankings | `supabase-contributor-profiles.sql` |
| `contributor_state_rankings` | aggregate contributor rankings | `supabase-contributor-profiles.sql` |
| `public_statement_snapshots` | approved statement snapshots | `supabase-social-monitoring.sql` |
| `profile_social_accounts` | approved public account links | `supabase-social-monitoring.sql` |

## Anonymous Insert

Anonymous users may create intake or telemetry rows, but must not read raw queues or change status fields.

| Table | Allowed anonymous action | Required guard |
| --- | --- | --- |
| `source_submissions` | Insert only | `status = 'new'`, `confidence = 'needs_review'`, no reviewer |
| `form_submissions` | Insert only | `status = 'new'`, no admin notes, no assignment |
| `correction_requests` | Insert only | public correction intake, under review |
| `privacy_requests` | Insert only | private review, never public by default |
| `package_interest` | Insert only | demand capture only |
| `beta_access_requests` | Insert only | no payment or entitlement |
| `pricing_experiment_events` | Insert only | event telemetry |
| `analytics_events` | Insert only | product analytics, no private details |
| `attribution_touches` | Insert only | attribution metadata |
| `watch_events` | Insert only | product event |
| `anonymous_watch_intents` | Insert only | anonymous watch intent |
| `feedback_votes` | Insert only | feedback signal, not official election vote |
| `growth_question_intake` | Insert only | under review |
| `reports` | Insert only | user report intake |
| `school_board_evidence` | Auth insert in current SQL; anonymous should use source/form queue unless changed later | source review required |

## User Private

Authenticated users can manage or read only their own rows.

| Table | Owner field | Notes |
| --- | --- | --- |
| `profiles` | `user_id` | Verification profile; no anon read |
| `citizen_votes` | `user_id` | Individual votes private; aggregate views public |
| `watchlists` | `user_id` | Private user watchlists |
| `watchlist_items` | `user_id` + parent watchlist | Private user watch items |
| `member_watchlists` | `user_id` | Unlimited member watchlists |
| `member_watchlist_items` | `user_id` + parent watchlist | Private member watch items |
| `member_watchlist_alert_preferences` | `user_id` + parent watchlist | Private alert settings |
| `member_watchlist_alert_events` | `user_id` + parent watchlist | Private alert events |
| `member_watchlist_digest_runs` | `user_id` + parent watchlist | Private digest history |
| `source_packets` | `user_id` or anonymous fallback | Owner can read/update own drafts |
| `records_requests` | `user_id` or anonymous fallback | Owner can read/update own drafts |
| `saved_searches` | `user_id` | Owner can manage own saved searches |
| `notification_preferences` | `user_id` | Owner-managed settings |
| `contributor_profiles` | `user_id` | Public fields only when enabled |
| `contribution_events` | `user_id` | Owner/admin read |
| `profile_claims` | `user_id` | Owner read, admin review |
| `claimed_profile_content` | `user_id` | Public only after approved |
| `profile_media` | `user_id` | Public only after approved |
| `subscriptions` | `user_id` | Owner/admin only |
| `user_identity_verifications` | `user_id` | Owner/admin only |
| `political_feedback_responses` | `user_id` | Owner/admin only |
| `official_vote_reactions` | `user_id` | Owner/admin only |
| `visitor_profiles` | `user_id` after merge | Owner/admin only |
| `visitor_sessions` | `user_id` after merge | Owner/admin only |
| `visitor_events` | `user_id` after merge | Owner/admin only |
| `visitor_interest_scores` | `user_id` after merge | Owner/admin only |
| `visitor_interest_events` | `user_id` after merge | Owner/admin only |

## Admin Only

Only `admin` or `super_admin` should manage these. Some review/operator tables also allow `reviewer` or `researcher` through `is_repw_operator()`.

| Table | Role | Notes |
| --- | --- | --- |
| `user_roles` | `super_admin` manage; user/admin read | Hardened in `supabase-security-rls-hardening.sql` |
| `admin_audit_logs` | admin/super_admin | Every admin mutation should write here |
| `admin_notes` | admin/super_admin | Never public |
| `admin_assignments` | admin/super_admin | Never public |
| `import_runs` | admin/super_admin | Data health |
| `import_errors` | admin/super_admin | Data health |
| `data_quality_issues` | admin/super_admin | Data health |
| `broken_links` | admin/super_admin | Data health |
| `duplicate_candidates` | admin/super_admin | Data health |
| `source_review_notes` | operator/admin | Internal notes, never public unless copied into approved summary |
| `source_submission_events` | owner read/admin manage | Status history |
| `form_submission_events` | owner read/admin manage | Status history |
| `correction_events` | owner read/admin manage | Status history |
| `repwatchr_social_tokens` | service/admin only | Never client-side |
| `future_revenue_api_keys` | admin/service only | Future disabled system |
| `future_revenue_credit_ledger` | admin/service only | Future disabled system |
| `data_export_customers` | admin/service only | Future data product |
| `data_export_runs` | admin/service only | Future data product |

## Risk Items Found

- `supabase-search-discovery.sql` previously defined `public.is_repw_admin()` from JWT app metadata. `supabase-security-rls-hardening.sql` replaces it with a `user_roles` lookup.
- Some older policies omit explicit `TO` clauses. They usually still rely on `auth.uid()` or status checks, but future policy edits should always specify `TO anon` or `TO authenticated`.
- Multiple root SQL files redefine `is_repw_admin()` or `is_repw_operator()`. Run `supabase-security-rls-hardening.sql` last so the hardened helper definitions win.
- Public `SECURITY DEFINER` helpers exist for role checks. They are intentionally small and now have explicit revoke/grant statements, but they should be reviewed with Supabase Security Advisor.

## Required Production Verification

Run:

```bash
node scripts/check-supabase-boundaries.mjs
```

Then run this in Supabase SQL Editor after applying SQL:

```sql
-- scripts/repwatchr-rls-smoke-check.sql
```
