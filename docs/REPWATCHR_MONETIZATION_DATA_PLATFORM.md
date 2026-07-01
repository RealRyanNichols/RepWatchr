# RepWatchr Monetization and Political Data Platform

RepWatchr should monetize as a political data and public-record intelligence company, not as a noisy ad site.

The core product promise stays the same: Search. Grade. Source. Share. Public records first.

## Practical Recommendation

Build three revenue lanes at the same time:

1. **Paid research services**
   - Quick Record Check
   - Local Race Source Pack
   - Official Record Brief
   - Election Watch Desk

2. **Claimed profile and official-response revenue**
   - Officials, campaigns, school-board candidates, and authorized staff can claim profiles.
   - Claiming a profile may let them submit approved media, verified links, public answers, campaign links, and corrections.
   - Claiming a profile must never let a buyer delete public records, score methodology, red flags, funding trails, or correction history.

3. **Political data products**
   - Aggregate verified citizen sentiment.
   - Vote-again intent.
   - Issue priority.
   - Vote reactions.
   - Funding and source trails.
   - Profile completeness and source-count reports.
   - Custom race, district, official, and issue reports.

## Data RepWatchr Can Sell

Sell aggregate, de-identified, source-backed intelligence:

- District-level issue sentiment.
- Verified constituent approval/disapproval.
- Vote-again intent.
- Supporter regret or supporter satisfaction.
- Opponent approval or opponent intensity.
- Vote-level reaction summaries.
- Issue priority by geography.
- Funding-trail summaries.
- Profile source counts and source gaps.
- Race/source maps.
- Watchlist and source-submission volume by public topic.
- Custom public-record research reports.

## Data RepWatchr Should Not Sell

Do not sell:

- Raw ID images.
- Private addresses.
- Minor-child data.
- Doxxing material.
- Unsourced criminal accusations.
- Raw private evidence.
- Private phone numbers or private emails.
- Individual political responses tied to a named person unless the user explicitly consented to public display.
- Anything that implies official ballot history from self-reported answers.

## Verified Account Model

RepWatchr needs several levels of trust:

- **Anonymous reader:** can search, read, share, and submit public-source links.
- **Logged-in account:** can watch profiles and save packets.
- **Email-verified account:** can submit basic sentiment that is labeled as account-verified.
- **Identity-verified account:** can participate in stronger civic panels.
- **Voter-file matched or manually reviewed account:** can influence constituent-only summaries where lawful and available.
- **Claimed official/profile account:** can submit profile content through review, not change the public record.

The app should use duplicate-risk controls:

- Unique user account.
- Email verification.
- Device/browser fingerprint hash where legally acceptable.
- Optional identity provider result.
- Optional voter-file match status.
- Duplicate risk score.
- Admin review for high-risk accounts.

Do not store public ID images in public buckets or expose them in analytics.

## Constituency Buckets

Every political feedback response should be categorized:

- Constituent.
- In district.
- In county.
- In state.
- Out of district.
- Out of state.
- Unknown.

This matters because out-of-state opponents should not be able to distort a local official's constituent-grade summary.

## Question Mechanisms

Start with these:

1. **Vote Again**
   - Question: Would you vote for this official again today?
   - Output: vote_for, vote_against, undecided, would_not_vote, not_eligible.

2. **Past Vote Satisfaction**
   - Question: Did you vote for this official, and do you like the job they are doing now?
   - Output: supporter satisfaction, supporter regret, opponent approval, opponent opposition, non-voter.
   - Guardrail: self-reported only, not official ballot history.

3. **Trust Score**
   - Question: How much do you trust this official to represent your area?
   - Output: 1-5 trust signal by constituency bucket.

4. **Issue Priority**
   - Question: Which issue should RepWatchr watch most closely on this profile?
   - Output: issue intensity by target, district, county, state, and source gap.

5. **Vote Reaction**
   - Question: Do you approve of this specific vote?
   - Output: approve, disapprove, mixed, need_more_context.
   - Guardrail: keep the vote source URL attached.

6. **Action Intent**
   - Question: Would you donate, volunteer, share, attend a meeting, or ask a public question?
   - Output: political action intent.
   - Guardrail: commercial-use consent tracked separately.

## Database Implementation

Migration file:

- `supabase-political-data-products.sql`

Core tables:

- `user_identity_verifications`
- `political_feedback_questions`
- `political_feedback_responses`
- `official_vote_reactions`
- `data_product_interests`
- `data_export_customers`
- `data_export_runs`

Public aggregate views:

- `political_feedback_public_summary`
- `official_vote_reaction_summary`

## Product Surfaces

Implemented first:

- `/data-reports`
  - Explains data products.
  - Shows current public data counts.
  - Lists feedback mechanisms.
  - Shows privacy/data guardrails.
  - Captures buyer interest through `/api/data-product-interest`.

Next build surfaces:

- Profile-level verified feedback panel.
- Vote-level reaction panel.
- Dashboard identity verification status.
- Admin data desk.
- Data export admin workflow.
- Paid data product checkout path.

## Figma System

Figma file:

- `https://www.figma.com/design/xL2WzDenkYXuigwnft6wLM`

Figma project:

- `https://www.figma.com/files/team/1651991097313284183/project/620301951`

Created frames:

- `Homepage / Desktop / monetized civic data`
- `Homepage / Mobile / synced hierarchy`
- `Page / Data Reports and Licensing`
- `Module / Official Profile Verified Feedback`
- `Admin / Data Desk`

Created local Figma styles:

- `RepWatchr/Brand Navy`
- `RepWatchr/Record Red`
- `RepWatchr/Source Gold`
- `RepWatchr/App Background`
- `RepWatchr/Action Blue`
- `RepWatchr/Border`
- `RepWatchr/Display Black`
- `RepWatchr/H1`
- `RepWatchr/H2`
- `RepWatchr/Body Strong`
- `RepWatchr/Label Caps`

The design direction is utility-first:

- Data engine in the hero.
- Verified feedback and licensing are visible.
- No fake urgency.
- No ad clutter.
- Strong guardrail language.
- Mobile frame has the same content hierarchy as desktop.

## Compliance Notes

This needs legal/privacy review before selling data products at scale.

Important review areas:

- Political data licensing.
- State privacy laws.
- Consent language.
- Voter-file usage rules.
- Data broker registration triggers.
- Campaign-finance implications.
- Identity verification vendor terms.
- Data retention and deletion policy.
- Whether any paid report could be interpreted as consulting, polling, or regulated campaign activity.

RepWatchr can move fast, but it should stay source-backed and consent-aware.
