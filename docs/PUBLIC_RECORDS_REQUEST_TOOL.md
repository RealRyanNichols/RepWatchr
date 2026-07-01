# Public Records Request Tool

RepWatchr now has a structured public-records request generator for users who need a clean request before they can build a source packet, timeline, profile update, or public question.

## Routes

| Route | Purpose | Indexing |
| --- | --- | --- |
| `/tools/public-records-request` | Public request generator for agencies, boards, courts, votes, filings, meetings, and contracts. | Index |
| `/dashboard/records-requests` | Member workspace entry point for records drafts and status tracking. | Noindex through dashboard layout |
| `/api/tools/records-requests` | Server-side validation, generation, optional Supabase persistence, and status tracking. | API, no sitemap |

## Disclaimer

Exact public disclaimer used in the tool:

> RepWatchr helps organize public-record research. This is not legal advice. Public-record laws and deadlines vary by jurisdiction.

## Record Types

- Meeting minutes
- Agenda
- Vote record
- Campaign finance
- Body cam / public safety
- Email correspondence
- Contract / vendor
- Policy manual
- Court public case
- Other

## Generated Outputs

The generator creates:

1. Formal public records request
2. Short email version
3. Follow-up version
4. Overdue follow-up version
5. Denial / clarification response starter

Users can:

- copy any version,
- open an email draft,
- download a text copy,
- generate and save,
- mark a request sent,
- create a free account,
- move from request to source packet.

## Database

Migration file:

- `supabase-source-packets-records-requests.sql`

Table:

- `records_requests`

Important fields:

- `anonymous_id`
- `user_id`
- `title`
- `state`
- `jurisdiction`
- `agency`
- `record_type`
- `date_range_start`
- `date_range_end`
- `subject`
- `generated_request`
- `short_email_version`
- `followup_version`
- `overdue_followup_version`
- `status`
- `sent_at`
- `response_received_at`
- `notes`
- `attribution`

Statuses:

- `draft`
- `sent`
- `response_received`
- `partially_fulfilled`
- `denied`
- `overdue`
- `closed`

RLS posture:

- Public users can insert drafts.
- Authenticated users can read and update their own drafts.
- Operators/admins can manage drafts.
- No public read policy exists.

## Analytics

Tracked events:

- `records_request_started`
- `records_request_generated`
- `records_request_copied`
- `records_request_saved`
- `records_request_status_changed`
- `records_request_account_prompt_clicked`

Legacy/product scoring still maps the workflow to:

- `records_request_created`

## Safety Rules

The request generator is a research drafting tool. It must not:

- publish a user draft publicly,
- treat a request as legal advice,
- expose private addresses,
- include minor-child or private family details,
- encourage harassment,
- imply a record proves wrongdoing before review.

## Production Notes

Apply the Supabase migration before expecting durable database saves:

```sql
\i supabase-source-packets-records-requests.sql
```

If Supabase service-role credentials are missing, the tool still generates copyable request drafts and stores a local browser backup. The public UI does not expose internal setup details.
