import fs from "node:fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function assert(condition, message) {
  if (!condition) {
    console.error(`Public records generator smoke failed: ${message}`);
    process.exit(1);
  }
}

const dashboardClient = read("src/components/dashboard/RepWatchrMemberDashboard.tsx");
const adminClient = read("src/components/admin/AdminDashboardClient.tsx");
const adminData = read("src/lib/admin-dashboard.ts");
const migration = read("supabase-member-dashboard.sql");
const packageJson = JSON.parse(read("package.json"));

for (const label of [
  "Public Records Request Generator",
  "RepWatchr is a public-records research tool, not legal advice",
  "Full Request",
  "Short Email",
  "Follow-Up",
  "Overdue",
  "Denial Reply",
]) {
  assert(dashboardClient.includes(label), `dashboard missing generator label: ${label}`);
}

for (const field of [
  "state",
  "agency",
  "recordType",
  "dateRange",
  "namesOffices",
  "meetingEvent",
  "deliveryMethod",
  "requesterName",
  "requesterEmail",
  "requesterPhone",
  "notes",
  "shareWithRepWatchr",
]) {
  assert(dashboardClient.includes(field), `dashboard missing request field: ${field}`);
}

for (const status of [
  "draft",
  "sent",
  "response_received",
  "partially_fulfilled",
  "denied",
  "overdue",
  "closed",
]) {
  assert(dashboardClient.includes(status), `dashboard missing status: ${status}`);
  assert(migration.includes(status), `migration missing status: ${status}`);
}

for (const column of [
  "state",
  "names_offices",
  "meeting_event",
  "preferred_delivery_method",
  "requester_name",
  "requester_email",
  "requester_phone",
  "notes",
  "email_text",
  "follow_up_text",
  "overdue_follow_up_text",
  "denial_clarification_text",
  "share_with_repwatchr",
  "shared_at",
]) {
  assert(migration.includes(column), `migration missing column: ${column}`);
}

assert(
  migration.includes("Admins can read shared public record requests") &&
    migration.includes("share_with_repwatchr = true and private.is_repw_admin()"),
  "migration missing opt-in admin read policy",
);
assert(adminClient.includes('id="records-requests"'), "admin dashboard missing shared records section");
assert(adminData.includes("publicRecordRequests"), "admin data missing publicRecordRequests");
assert(packageJson.scripts["smoke:records"] === "node scripts/smoke-public-records-generator.mjs", "package.json missing smoke:records script");

console.log("public records generator smoke checks passed");
