import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(file) {
  return readFileSync(join(root, file), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const requiredFiles = [
  "docs/PUBLIC_RECORDS_RESPONSE_INTAKE.md",
  "docs/DOCUMENT_REVIEW_POLICY.md",
  "supabase-public-records-response-intake.sql",
  "src/lib/records-response-intake.ts",
  "src/app/api/records-responses/route.ts",
  "src/app/api/admin/records-responses/route.ts",
  "src/app/tools/public-records-response/page.tsx",
  "src/app/dashboard/records-responses/page.tsx",
  "src/app/admin/records-responses/page.tsx",
  "src/components/records-responses/RecordsResponseIntakeForm.tsx",
  "src/components/records-responses/RecordsResponseUpload.tsx",
  "src/components/records-responses/RecordsResponsePreview.tsx",
  "src/components/records-responses/RecordsResponseStatusBadge.tsx",
  "src/components/records-responses/SensitiveInfoWarning.tsx",
  "src/components/records-responses/AdminRecordsResponseQueue.tsx",
  "src/components/records-responses/AdminDocumentReviewPanel.tsx",
];

for (const file of requiredFiles) {
  assert(existsSync(join(root, file)), `Missing records response file: ${file}`);
}

const sql = read("supabase-public-records-response-intake.sql");
for (const table of ["records_responses", "records_response_files", "records_response_events"]) {
  assert(sql.includes(`create table if not exists public.${table}`), `Missing SQL table ${table}`);
  assert(sql.includes(`alter table public.${table} enable row level security`), `Missing RLS for ${table}`);
}

assert(sql.includes("'records-response-private', 'records-response-private', false"), "Private storage bucket is created as non-public.");
assert(sql.includes("Public may create private records responses"), "Public insert policy exists.");
assert(sql.includes("Users can read own records responses"), "Owner read policy exists.");
assert(sql.includes("Admins can manage all records responses"), "Admin manage policy exists.");
assert(!sql.includes("bucket_id = 'records-response-private';"), "Private records bucket has no public select policy.");

const lib = read("src/lib/records-response-intake.ts");
for (const flag of [
  "private_address",
  "minor_child",
  "medical_info",
  "social_security",
  "bank_info",
  "phone_email_private",
  "family_info",
  "irrelevant_private_info",
  "sealed_or_restricted_warning",
  "violent_threat",
  "defamation_risk",
]) {
  assert(lib.includes(flag), `Sensitive flag exists: ${flag}`);
}

for (const status of [
  "needs_review",
  "safe_public_record",
  "contains_private_info",
  "redaction_needed",
  "do_not_publish",
  "published_summary_only",
]) {
  assert(lib.includes(status) && sql.includes(`'${status}'`), `Sensitivity status exists: ${status}`);
}

const publicApi = read("src/app/api/records-responses/route.ts");
assert(publicApi.includes("storageBucket = \"records-response-private\""), "Public API uses private storage bucket.");
assert(publicApi.includes("public_summary: null"), "Public intake does not publish summaries.");
assert(publicApi.includes("extractionStatus = \"upload_failed\""), "Upload failure is represented without public exposure.");
assert(publicApi.includes("records_response_events"), "Public API writes response events.");

const adminApi = read("src/app/api/admin/records-responses/route.ts");
assert(adminApi.includes("getAdminUserForServer"), "Admin API checks server-side admin role.");
assert(adminApi.includes("admin_audit_log"), "Admin API writes audit logs.");
assert(adminApi.includes("records_response_admin_reviewed"), "Admin review analytics event is logged.");
assert(adminApi.includes("records_response_attached_to_profile"), "Profile attachment analytics event is logged.");

const clientAnalytics = read("src/lib/client-analytics.ts");
const serverAnalytics = read("src/app/api/analytics/event/route.ts");
for (const eventName of [
  "records_response_started",
  "records_response_submitted",
  "records_response_file_uploaded",
  "records_response_packet_generated",
  "records_response_admin_reviewed",
  "records_response_attached_to_profile",
]) {
  assert(clientAnalytics.includes(eventName), `Client analytics allows ${eventName}`);
  assert(serverAnalytics.includes(eventName), `Server analytics allows ${eventName}`);
}

const intakeForm = read("src/components/records-responses/RecordsResponseIntakeForm.tsx");
assert(intakeForm.includes("RecordsResponseUpload"), "Intake form includes upload component.");
assert(intakeForm.includes("SensitiveInfoWarning"), "Intake form shows sensitive review warning.");
assert(intakeForm.includes("Nothing becomes public"), "Intake form explains private-by-default review.");
assert(!intakeForm.includes("/tools/source-packet-builder"), "Intake form does not link missing packet route.");
assert(!read("src/app/tools/public-records-response/page.tsx").includes("/tools/public-records-request"), "Public tool page does not link missing public-records request route.");

console.log("Public records response intake smoke check passed.");
