# Safe AI Writing Assistant

RepWatchr's safe AI writing assistant helps users and admins draft cautious public-record language. It is not a publishing system, a legal conclusion system, or an allegation engine.

The assistant is feature-gated by `ENABLE_AI_WRITING_ASSISTANT=false` by default. When the flag is off, the UI returns manual templates and a clean disabled notice. No broken provider errors should appear publicly.

## What It Writes

Supported use cases:

1. `public_question`
2. `safe_share_line`
3. `source_packet_summary`
4. `missing_source_request`
5. `correction_request_wording`
6. `meeting_question`
7. `records_request_summary`
8. `profile_summary_draft`
9. `digest_summary`
10. `package_interest_message`

Allowed output styles:

- neutral
- concise
- meeting-safe
- public-record formal
- social share safe
- dashboard summary
- source packet language

## Required Output Shape

Every assistant response must resolve to structured JSON:

```json
{
  "safe_text": "",
  "label": "Public question | Source-backed claim | Needs source | Under review | Confirmed public record",
  "what_this_does_not_claim": "",
  "source_needed": true,
  "safety_flags": [],
  "suggested_next_action": ""
}
```

The route always returns:

- `humanReviewRequired: true`
- `autoPublish: false`

## Provider Behavior

Server route:

- `POST /api/ai/writing-assistant`

Provider rules:

- `ENABLE_AI_WRITING_ASSISTANT=false`: manual fallback only.
- `ENABLE_AI_WRITING_ASSISTANT=true` and `AI_PROVIDER=openai`: use the server-side `OPENAI_API_KEY` if present.
- Missing key or provider failure: manual fallback output is returned.
- API keys are never exposed client-side.

## Database

SQL file:

- `supabase-ai-writing-assistant.sql`

Tables:

- `ai_writing_runs`
- `ai_writing_feedback`

Security posture:

- RLS enabled.
- Public users do not directly read or write assistant tables.
- Server route writes runs through the service role.
- Authenticated users may only read their own writing runs.
- Authenticated users may only insert/view their own feedback.

## Public UI Rules

The assistant can be shown in:

- source packet builder
- public records response intake
- public records request tool
- profile admin edit
- public question builder
- share drawer
- correction request form
- admin story editor
- digest preview generator

Current integrations:

- Free Source Packet Builder
- Public Records Response Intake

## Safety Flow

1. Normalize input.
2. Generate manual fallback first.
3. If AI is enabled, request structured JSON from the provider.
4. Parse the structured output.
5. Run `validatePublicContentSafety()`.
6. If blocked language appears, replace provider output with the manual fallback.
7. Show safety flags before copy or insert.
8. Require user/admin action to copy or insert.
9. Never publish automatically.

## Manual Fallback Templates

Public question:

> Where can the public find the source for [topic]?

Missing source:

> RepWatchr needs a public source for [target] related to [topic]. Submit one here: [URL].

Source-backed share:

> According to this public source, [short neutral summary]. Source: [URL].

Correction:

> I believe this item may be incorrect because [reason]. A public source that may help correct it is [URL].

## Analytics

Tracked events:

- `ai_writer_opened`
- `ai_writer_generated`
- `ai_writer_failed`
- `ai_writer_safety_flagged`
- `ai_writer_text_copied`
- `ai_writer_text_inserted`
- `ai_writer_disabled_fallback_used`

Do not send generated text, private source summaries, source URLs, or user allegations into anonymous analytics metadata.
