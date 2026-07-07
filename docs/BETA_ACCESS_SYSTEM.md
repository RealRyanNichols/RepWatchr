# RepWatchr Beta Access System

The beta access system lets RepWatchr collect demand before publicly charging for paid packages.

It is not checkout. It does not guarantee access. It does not promise political, legal, investigative, or media results.

## Public Flow

Paid service pages show a beta access module when checkout is disabled.

User submits:

- email
- name optional
- package key
- use case
- jurisdiction
- organization type
- urgency
- anonymous visitor ID

Route:

- `/api/beta-access/request`

Component:

- `src/components/services/BetaAccessRequestPanel.tsx`

## Database Table

Table:

- `beta_access_requests`

Fields:

- `id`
- `anonymous_id`
- `user_id`
- `email`
- `name`
- `package_key`
- `use_case`
- `jurisdiction`
- `organization_type`
- `urgency`
- `status`
- `invite_code`
- `invited_at`
- `created_at`
- `updated_at`

## Beta Statuses

- `new`
- `reviewed`
- `invited`
- `active`
- `not_fit`
- `waitlist`
- `archived`

## Admin Flow

Route:

- `/admin/pricing`

Admins can:

- view all beta access requests
- filter by package
- filter by status
- change beta status
- create invite code
- review demand by package
- audit changes

## Safe Copy

Use:

- `Request beta access`
- `Tell us what you need monitored`
- `RepWatchr is collecting demand before launching paid packages.`
- `No payment is collected here. Access is reviewed manually and is not guaranteed.`

Avoid:

- `Buy now`
- `Limited spots`
- `Guaranteed results`
- `Win your election`
- `Expose officials`

## Privacy

Beta access requests are lead/demand records. They should not be publicly exposed.

RLS rules:

- public users may insert a beta access request
- authenticated users may read their own requests
- admins may manage all requests

## Launch Notes

The public page will work only after:

1. `supabase-pricing-beta-access.sql` is applied.
2. `SUPABASE_SERVICE_ROLE_KEY` is configured server-side.
3. Admin users have the `admin` role.

If Supabase is unavailable, the public API returns clean fallback language without exposing internal setup details.
