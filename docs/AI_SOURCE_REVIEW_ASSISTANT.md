# RepWatchr AI Source Review Assistant

Status: built behind a disabled-by-default feature flag.

Purpose: help RepWatchr admins review public source submissions faster without turning user-submitted claims into public facts.

## What It Does

The assistant is available inside `/admin/sources` on a selected source submission. It can draft:

- plain-English source summary
- source type guess
- target entity guess
- what the source appears to show
- what the source does not prove
- missing context
- safety flags
- suggested public label
- suggested admin action
- suggested public question
- suggested safe share line
- suggested internal admin note

Every output is labeled:

> This is an assistant suggestion. Human review required.

## What It Must Not Do

The assistant must not:

- auto-publish a source
- auto-attach a source to a profile, race, story, or timeline
- mark a claim verified
- make criminal accusations
- write public copy without labels
- replace human review
- publish private addresses, minor-child details, doxxing, threats, medical data, or private family information

The normal admin controls still decide whether to approve, reject, request more info, mark duplicate, or attach a source.

## Environment Flags

Default production posture:

```env
ENABLE_AI_SOURCE_REVIEW=false
AI_PROVIDER=openai
AI_SOURCE_REVIEW_MODEL=gpt-5.5
OPENAI_API_KEY=
```

Rules:

- Keep `ENABLE_AI_SOURCE_REVIEW=false` until the SQL table, admin workflow, and model behavior are tested.
- `OPENAI_API_KEY` is server-only.
- Never create `NEXT_PUBLIC_OPENAI_API_KEY`.
- If the feature flag is disabled or the key is missing, the admin UI shows a clean disabled message.

## Database

Run:

```sql
-- supabase-ai-source-review.sql
```

Tables:

- `ai_review_runs`
- `ai_review_feedback`

Security:

- RLS is enabled.
- `anon` has no access.
- `authenticated` and `service_role` have explicit grants, but row access is admin-only through `public.is_repw_admin()`.
- The assistant stores suggestions and feedback only. It does not update public source links.

## Admin Workflow

1. Admin opens `/admin/sources`.
2. Admin selects a source submission.
3. The panel shows source details:
   - submitted URL
   - target
   - jurisdiction
   - submitter summary
   - requested action
   - status
4. If disabled, the panel says:
   - `AI review is disabled. Enable ENABLE_AI_SOURCE_REVIEW and configure provider to use this tool.`
5. If enabled, admin clicks `Analyze Source Submission`.
6. Server runs the AI helper and stores an `ai_review_runs` row.
7. Admin reviews the output.
8. Admin may click `Accept summary as draft`, which only copies draft text into local review fields and records feedback.
9. Admin must separately click the normal buttons to save status, approve, request more info, reject, mark duplicate, or attach an approved source.

## Server Helper

Files:

- `src/lib/ai-source-review-types.ts`
- `src/lib/ai-source-review.ts`
- `src/app/api/admin/sources/[id]/ai-review/route.ts`
- `src/components/admin/AiSourceReviewAssistant.tsx`

The helper uses the OpenAI Responses API with Structured Outputs when:

- `ENABLE_AI_SOURCE_REVIEW=true`
- `AI_PROVIDER=openai`
- `OPENAI_API_KEY` is configured

The helper sends only the review summary fields needed for triage:

- source URL
- source title if supplied
- source type
- submitter summary
- target type/name
- jurisdiction
- requested action
- current confidence/status labels
- basic existing entity fields

The helper also runs local safety flag checks before and after the model response.

## Structured Output

The expected output shape is:

```json
{
  "summary": "",
  "source_type_guess": "",
  "target_entity_guess": "",
  "appears_to_show": "",
  "does_not_prove": "",
  "missing_context": [],
  "safety_flags": [],
  "suggested_public_label": "",
  "recommended_admin_action": "",
  "suggested_public_question": "",
  "suggested_safe_share_line": "",
  "suggested_admin_note": "",
  "human_review_required": true
}
```

Allowed admin recommendations:

- `attach_to_profile`
- `attach_to_race`
- `attach_to_story`
- `needs_more_info`
- `reject`
- `duplicate`
- `unsafe`
- `broken_link`
- `needs_human_review`

Safety flags:

- `private_address`
- `minor_child`
- `threat`
- `doxxing`
- `unsourced_criminal_accusation`
- `private_medical`
- `private_family_info`
- `defamation_risk`
- `unsupported_certainty`
- `broken_source`
- `paywalled_source`
- `ambiguous_source`
- `duplicate_possible`

## Events And Audit Trail

Analytics events:

- `ai_source_review_started`
- `ai_source_review_completed`
- `ai_source_review_failed`
- `ai_suggestion_accepted`
- `ai_suggestion_rejected`
- `ai_safety_flag_triggered`

Admin audit/source events:

- AI review completion/failure writes a `source_submission_events` row.
- AI review completion/failure writes an `admin_audit_logs` row.
- Accept/reject/ignore feedback writes `ai_review_feedback`, `source_submission_events`, and `admin_audit_logs`.

## Production Verification

1. Apply `supabase-ai-source-review.sql`.
2. Confirm Supabase Security Advisor shows no anon access to AI review tables.
3. Confirm an admin can open `/admin/sources`.
4. With `ENABLE_AI_SOURCE_REVIEW=false`, confirm the disabled message appears.
5. Set `ENABLE_AI_SOURCE_REVIEW=true`, `AI_PROVIDER=openai`, and `OPENAI_API_KEY` in staging.
6. Run one test source review.
7. Confirm `ai_review_runs` records the structured output.
8. Click `Accept summary as draft`.
9. Confirm no public source link was created until the admin separately clicks `Attach approved source`.
10. Confirm `ai_review_feedback`, `source_submission_events`, `admin_audit_logs`, and analytics events are written.

## Risk Notes

The assistant should be treated as an admin productivity tool, not a fact engine. If a source is ambiguous, paywalled, secondhand, politically inflammatory, or contains unsafe personal details, the correct recommendation is human review, needs more info, rejection, or unsafe.
