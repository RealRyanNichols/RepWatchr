import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const migration = read("supabase-source-submissions.sql");
const apiRoute = read("src/app/api/source-submissions/route.ts");
const sourceForm = read("src/components/source-submissions/SourceSubmissionForm.tsx");
const reportButton = read("src/components/shared/ReportButton.tsx");
const texasForm = read("src/components/elections/TexasElectionContributionForm.tsx");
const texasPublicContributions = read("src/components/elections/TexasRacePublicContributions.tsx");
const adminReview = read("src/components/admin/AdminContentReviewClient.tsx");
const thanksClient = read("src/components/source-submissions/SourceSubmissionThanksClient.tsx");
const healthRoute = read("src/app/api/health/integrations/route.ts");
const controlCenterRoute = read("src/app/api/admin/control-center/route.ts");

for (const tableName of [
  "source_submissions",
  "source_submission_events",
  "source_submission_attachments",
  "source_review_notes",
  "source_status_history",
]) {
  assert(migration.includes(`public.${tableName}`), `Migration missing ${tableName}`);
  assert(healthRoute.includes(`"${tableName}"`), `Health route missing ${tableName}`);
  assert(controlCenterRoute.includes(`"${tableName}"`), `Control center route missing ${tableName}`);
}

for (const status of [
  "new",
  "needs_review",
  "verified",
  "rejected",
  "attached_to_profile",
  "needs_more_info",
]) {
  assert(migration.includes(`'${status}'`), `Migration missing status ${status}`);
}

for (const policy of [
  "Public can insert source submissions",
  "Users can read own source submissions",
  "Admins can read all source submissions",
  "Admins can update source submissions",
]) {
  assert(migration.includes(policy), `Migration missing RLS policy: ${policy}`);
}

assert(apiRoute.includes("export async function POST"), "Source API missing POST handler");
assert(apiRoute.includes("export async function GET"), "Source API missing public reviewed GET handler");
assert(apiRoute.includes(".from(\"source_submissions\")"), "Source API does not write source_submissions");
assert(apiRoute.includes(".from(\"source_submission_events\")"), "Source API does not write source_submission_events");
assert(apiRoute.includes(".from(\"source_submission_attachments\")"), "Source API does not write source_submission_attachments");
assert(apiRoute.includes(".from(\"source_status_history\")"), "Source API does not write source_status_history");
assert(apiRoute.includes("buildSourcePacket"), "Source API does not return backup packet");
assert(apiRoute.includes("{ status: 503 }"), "Source API missing clean missing-env fallback");

for (const [label, file] of [
  ["Submit Source form", sourceForm],
  ["ReportButton", reportButton],
  ["Texas contribution form", texasForm],
]) {
  assert(file.includes("fetch(\"/api/source-submissions\""), `${label} does not post to source submissions API`);
  assert(file.includes("/submit-source/thanks"), `${label} does not route to thank-you page`);
}

assert(texasForm.includes('targetType: "texas_election_race"'), "Texas form does not tag race submissions");
assert(texasPublicContributions.includes("/api/source-submissions"), "Texas public summaries do not use source submissions API");
assert(!texasPublicContributions.includes("texas_election_contributions"), "Texas public summaries still query the legacy table");

assert(adminReview.includes(".from(\"source_submissions\")"), "Admin review does not load source_submissions");
assert(adminReview.includes(".from(\"source_review_notes\")"), "Admin review does not write source_review_notes");
assert(adminReview.includes(".from(\"source_status_history\")"), "Admin review does not write source_status_history");
assert(adminReview.includes(".from(\"source_submission_events\")"), "Admin review does not write source_submission_events");
assert(adminReview.includes("attached_to_profile"), "Admin review missing attach-to-profile status");

for (const phrase of [
  "Submission ID",
  "Copyable source packet",
  "Next suggested action",
  "Share RepWatchr",
  "Create Free Account",
]) {
  assert(thanksClient.includes(phrase), `Thank-you page missing: ${phrase}`);
}

console.log("source submission smoke checks passed");
