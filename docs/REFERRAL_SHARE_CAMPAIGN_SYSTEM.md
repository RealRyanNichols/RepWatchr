# RepWatchr Referral and Share Campaign System

RepWatchr growth should come from useful public-record sharing: official profiles, race pages, source packets, public questions, source gaps, county hubs, school-board pages, records-request tools, correction pages, and package-interest pages.

This system does not auto-contact anyone, send mass invites, fake social proof, or create harassment campaigns. It gives visitors and members a clean way to copy a safe share line or referral link.

## What Was Added

- `supabase-referral-share-campaigns.sql`
- `src/lib/referral-share-campaigns.ts`
- `src/lib/referral-client.ts`
- `src/app/api/referrals/code/route.ts`
- `src/app/api/referrals/event/route.ts`
- `src/app/api/admin/share-campaigns/route.ts`
- `src/app/admin/share-campaigns/page.tsx`
- `src/components/referrals/*`

## Database Tables

### `referral_codes`

Stores opt-in referral codes for logged-in users or anonymous visitors.

Important fields:

- `user_id`
- `anonymous_id`
- `code`
- `status`
- `source_context`
- `created_at`

### `referral_events`

Tracks referral visits and conversions.

Supported conversion events:

- `referral_visit`
- `referral_signup`
- `referral_source_submission`
- `referral_packet_created`
- `watchlist_add`
- `package_interest`

Also tracks:

- `referral_link_created`
- `referral_link_copied`
- `share_campaign_viewed`
- `share_campaign_clicked`
- `safe_share_text_copied`

### `share_campaigns`

Admin-managed campaigns for share prompts.

Campaign types:

- `source_gap`
- `profile_watch`
- `race_watch`
- `county_hub`
- `school_board`
- `public_question`
- `free_packet`
- `records_request`
- `package_interest`
- `contributor_badge`

### `share_assets`

Optional reusable assets for campaigns and entities.

Asset types:

- `safe_text`
- `public_question`
- `source_gap`
- `packet`
- `link_card`
- `og_image`
- `talking_point`

## Public Behavior

Logged-in users can generate referral links tied to their account. Anonymous users can generate copyable referral links tied only to an anonymous session ID.

Referral links use:

```text
?rw_ref=CODE
```

The client tracker stores the referral code locally and records one visit event per route/time bucket.

## Share Moments

The first implementation wires prompts into:

- shared `ShareButtons` across profiles, races, stories, funding, votes, school-board pages, and feed cards
- source submission thank-you page
- free source packet completion state
- global referral attribution tracker

Future share moments should be added after:

- profile watched
- public question copied
- race page opened
- county hub opened
- correction submitted
- source accepted
- contributor badge earned

## Admin

Route:

```text
/admin/share-campaigns
```

Admin can:

- view referral stats
- view top shared routes
- create campaigns
- edit campaign copy
- pause campaigns
- activate campaigns
- archive campaigns
- see unsafe copy warnings

Admin actions are server-side protected with `requireAdminPageAccess()`.

## Safety Rules

Share copy must stay public-record first.

Do not use:

- destroy
- expose them
- take them down
- go after
- target
- harass
- guilty
- criminal

Use:

- public record
- source trail
- missing source
- correction
- public question
- watch this record
- add a source

## No Spam Boundary

This system only creates links and copyable share text.

It does not:

- import contacts
- send emails
- send SMS
- send DMs
- post to social accounts
- batch invite users
- claim fake activity
- show fake scarcity
- create fake social proof

## Environment

No new required environment variables.

To persist data, Supabase must already be configured:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

If persistence is unavailable, public UI still creates copyable referral links gracefully.

## Verification

Run:

```bash
node scripts/smoke-referral-share-campaigns.mjs
```

Then run the normal app checks:

```bash
npx tsc --noEmit
npx eslint
npx next build
```

