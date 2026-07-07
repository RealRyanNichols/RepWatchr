# Public Records Response Intake

RepWatchr now has a private-by-default workflow for public records responses.

Route:
- `/tools/public-records-response` for public/member intake.
- `/dashboard/records-responses` for logged-in user status.
- `/admin/records-responses` for admin review.

Primary rule: a response is not a public RepWatchr source until a human review clears the document, sensitivity status, label, and summary.

## What The Workflow Handles

- Response received from an agency or public body.
- Optional link to a dashboard public-records request by `records_request_id`.
- Response URL submission.
- Email response copy/paste.
- Protected document upload when Supabase storage is configured.
- File metadata capture.
- Text extraction for small text files.
- PDF/document extraction TODO is documented and does not block the private metadata workflow.
- Basic sensitive-pattern flags.
- Admin review and audit trail.
- Private source packet draft generation.
- Attachment event tracking for profile, story, race, timeline, or source packet.

## Database

Migration:
- `supabase-public-records-response-intake.sql`

Tables:
- `records_responses`
- `records_response_files`
- `records_response_events`

Private storage bucket:
- `records-response-private`

The bucket is not public. The app never creates a public file URL during intake.

## Statuses

Response workflow status:
- `new`
- `needs_review`
- `saved_private`
- `reviewed`
- `converted_to_packet`
- `attached_to_profile`
- `attached_to_story`
- `attached_to_timeline`
- `rejected`
- `archived`

Sensitivity status:
- `needs_review`
- `safe_public_record`
- `contains_private_info`
- `redaction_needed`
- `do_not_publish`
- `published_summary_only`

## Sensitive Flags

The intake performs a basic server-side scan for:

- `private_address`
- `minor_child`
- `medical_info`
- `social_security`
- `bank_info`
- `phone_email_private`
- `family_info`
- `irrelevant_private_info`
- `sealed_or_restricted_warning`
- `violent_threat`
- `defamation_risk`

These flags are not findings. They are review cues.

## User Flow

1. Choose a linked records request ID or start a new response intake.
2. Enter agency/public body and jurisdiction.
3. Choose response type.
4. Add a response URL, paste text, or upload a file.
5. Explain what needs to be checked or built.
6. Mark whether the user believes it is public.
7. Submit for review or save privately.
8. Receive a private source packet draft.
9. Next actions are shown: build packet, submit another source, dashboard status.

## Admin Flow

Admins use `/admin/records-responses`.

Admin can:
- View response details.
- View file metadata and protected storage path.
- Mark sensitivity status.
- Mark workflow status.
- Write a safe public summary.
- Record an attachment decision.
- Create `records_response_events`.
- Create `admin_audit_log` rows.

Admin must not:
- Publish uploaded files automatically.
- Treat user-submitted explanation as verified proof.
- Copy private addresses, minors, medical data, bank data, sealed records, or unsupported allegations into public summaries.

## File Handling

Uploads use `records-response-private` when Supabase storage and service role are configured.

Current behavior:
- Upload metadata is saved in `records_response_files`.
- Storage path is stored only when upload succeeds.
- Small text files can have extracted text stored privately for review.
- PDFs and binary documents are metadata-only until a safe extraction/OCR worker is added.

Future extraction worker:
- Run server-side only.
- Store extracted text privately.
- Run sensitivity scanning before admin review.
- Never publish extracted text automatically.

## Analytics

Events:
- `records_response_started`
- `records_response_submitted`
- `records_response_file_uploaded`
- `records_response_packet_generated`
- `records_response_admin_reviewed`
- `records_response_attached_to_profile`

## Launch Notes

Apply the SQL migration before relying on production saves.

Required environment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

If service role or tables are missing, the public form still generates a copyable packet fallback, but database save and file upload will not complete.
