# Source Packet Builder

RepWatchr now has a real public source-packet workflow instead of a copy-only idea.

## Routes

| Route | Purpose | Indexing |
| --- | --- | --- |
| `/free-packet` | Main low-friction funnel for one public URL into one safe packet. | Index |
| `/tools/source-packet-builder` | Direct tool route for repeat builders and command palette links. | Index |
| `/dashboard/packets` | Member workspace entry point for packet drafts. | Noindex through dashboard layout |
| `/api/tools/source-packets` | Server-side validation, generation, optional Supabase persistence, optional source-review submission. | API, no sitemap |

## What It Builds

The generated packet includes:

- Target
- Jurisdiction
- Source URL
- Source date
- Source type
- What the source appears to show
- What is confirmed
- What is not confirmed
- Missing context
- Public question
- Suggested next public record to request
- Safe share line
- RepWatchr link
- Safety warnings

## Supported Packet Types

- Official record
- Vote record
- Funding record
- Meeting record
- School board record
- Race / candidate record
- Agency record
- Correction packet
- Public question packet
- Media tip packet
- Open records packet

## Safety Rules

The builder uses cautious language by default:

- Use “appears to show” instead of “proves.”
- Treat user-submitted claims as unverified until review.
- Warn on private home addresses.
- Warn on minor-child or private family details.
- Warn on threats or harassment language.
- Warn on criminal, bribery, corruption, fraud, or guilt language unless an official source clearly supports the statement.
- Never auto-publish packet submissions as verified RepWatchr facts.

## Database

Migration file:

- `supabase-source-packets-records-requests.sql`

Table:

- `source_packets`

Important fields:

- `anonymous_id`
- `user_id`
- `packet_type`
- `target_type`
- `target_id`
- `target_name`
- `jurisdiction`
- `source_url`
- `source_title`
- `source_date`
- `summary`
- `claim_language`
- `missing_context`
- `public_question`
- `generated_markdown`
- `generated_text`
- `status`
- `submitted_source_id`
- `attribution`

RLS posture:

- Public users can insert drafts.
- Authenticated users can read and update their own drafts.
- Operators/admins can manage drafts.
- No public read policy exists.

## Analytics

Tracked events:

- `packet_builder_started`
- `packet_type_selected`
- `packet_source_added`
- `packet_generated`
- `packet_copied`
- `packet_saved`
- `packet_submitted`
- `packet_account_prompt_clicked`
- `packet_watch_clicked`

## Review Queue Connection

When a visitor clicks “Submit to review,” the API also routes a `free_packet` submission through the existing universal intake queue.

That gives admins:

- a `form_submissions` row,
- a source-review candidate,
- attribution,
- event history,
- and a safe copy/export packet as backup.

## Production Notes

Apply the Supabase migration before expecting durable database saves:

```sql
\i supabase-source-packets-records-requests.sql
```

If Supabase service-role credentials are missing, the tool still generates a packet, supports copy/download, and stores a local browser backup. The public UI does not expose internal configuration errors.
