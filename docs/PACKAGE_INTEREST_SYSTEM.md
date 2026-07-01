# Package Interest System

RepWatchr package interest is the demand-capture layer before payment launch.

## Files

- `src/data/repwatchr-packages.ts`
- `src/lib/package-interest.ts`
- `src/app/api/package-interest/route.ts`
- `src/app/packages/page.tsx`
- `src/app/packages/[packageSlug]/page.tsx`
- `src/app/admin/monetization/page.tsx`
- `src/components/packages/*`
- `supabase-package-interest.sql`

## Database

Table: `package_interest`

Fields:

- `id`
- `anonymous_id`
- `user_id`
- `email`
- `name`
- `package_key`
- `package_name`
- `source_route`
- `entity_type`
- `entity_id`
- `jurisdiction`
- `urgency`
- `use_case`
- `budget_range`
- `organization_type`
- `message`
- `attribution`
- `status`
- `created_at`
- `updated_at`

Supported package keys:

- `quick_record_check`
- `official_record_brief`
- `local_race_source_pack`
- `election_watch_desk`
- `school_board_monitor`
- `county_monitor`
- `journalist_desk`
- `attorney_research_desk`
- `campaign_finance_tracker`
- `organization_dashboard`
- `public_data_api`
- `bulk_profile_export`
- `custom_research`
- `investor_partner`

## RLS

Public users may insert package-interest rows.

Authenticated users may read their own rows by `user_id` or matching auth email.

Admins may manage all rows through the `user_roles.role = admin` check.

The service role can insert and read for API and dashboard workflows.

## Public Flow

1. Visitor opens `/packages` or a package page.
2. `package_page_open` or `package_card_viewed` is tracked.
3. Visitor clicks an interest CTA.
4. `package_interest_clicked` is tracked.
5. Form collects:
   - email
   - optional name
   - use case
   - jurisdiction
   - target official/race/agency
   - urgency
   - organization type
   - optional budget range
   - optional message
   - anonymous ID
   - referrer/UTM
6. Server validates the payload.
7. Server writes `package_interest`.
8. Server tracks:
   - `package_interest_submitted`
   - visitor profile update
   - interest score update
9. User receives:
   - submission ID
   - copyable summary
   - free packet CTA
   - account creation CTA

## Safety Validation

The API rejects package requests containing obvious unsafe language about:

- private addresses
- minors
- threats
- harassment
- doxxing
- stalking

This is not a full moderation engine. Admin review is still required before any public use.

## Admin Flow

Route: `/admin/monetization`

Admin can review:

- demand by package
- demand by jurisdiction
- demand by source route
- demand by organization type
- demand by urgency
- conversion funnel counts
- high-intent rows
- package-level readiness recommendations

The dashboard intentionally says when data is missing. It should not mark packages ready without enough demand and fulfillment support.

## Analytics Events

- `package_card_viewed`
- `package_page_open`
- `package_interest_clicked`
- `package_interest_submitted`
- `package_interest_abandoned`
- `package_faq_open`
- `free_tool_clicked_from_package`
- `monetization_dashboard_open`
- `package_readiness_viewed`
- `readiness_recommendation_generated`

## Privacy Rule

Package interest is for aggregate demand and fulfillment planning.

Do not sell individual package-interest records, private watchlists, raw submissions, individual political-interest profiles, or private user behavior.
