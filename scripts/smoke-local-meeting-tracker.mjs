import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const files = [
  "docs/SCHOOL_BOARD_TRACKER.md",
  "docs/LOCAL_MEETING_TRACKER.md",
  "src/lib/local-meetings.ts",
  "src/components/meetings/LocalBodyTracker.tsx",
  "src/components/meetings/MeetingsAnalytics.tsx",
  "src/app/meetings/page.tsx",
  "src/app/meetings/[slug]/page.tsx",
  "src/app/jurisdictions/[slug]/meetings/page.tsx",
  "src/app/admin/meetings/page.tsx",
  "src/app/api/admin/local-meetings/route.ts",
  "supabase-local-meeting-tracker.sql",
];

for (const file of files) {
  assert(existsSync(join(root, file)), `Missing local meeting tracker file: ${file}`);
}

const sql = read("supabase-local-meeting-tracker.sql");
const localMeetings = read("src/lib/local-meetings.ts");
const tracker = read("src/components/meetings/LocalBodyTracker.tsx");
const analytics = read("src/components/meetings/MeetingsAnalytics.tsx");
const clientAnalytics = read("src/lib/client-analytics.ts");
const serverAnalytics = read("src/app/api/analytics/event/route.ts");
const districtPage = read("src/app/school-boards/[districtSlug]/page.tsx");
const candidatePage = read("src/app/school-boards/[districtSlug]/[candidateId]/page.tsx");
const adminApi = read("src/app/api/admin/local-meetings/route.ts");

for (const table of ["public_bodies", "public_body_members", "meetings", "meeting_items", "meeting_votes"]) {
  assert(sql.includes(`public.${table}`), `Missing SQL table ${table}`);
  assert(sql.includes(`alter table public.${table} enable row level security`), `Missing RLS for ${table}`);
}

for (const bodyType of ["school_board", "city_council", "county_commissioners", "commission", "agency_board"]) {
  assert(sql.includes(`'${bodyType}'`), `Missing body type ${bodyType}`);
  assert(localMeetings.includes(`"${bodyType}"`) || localMeetings.includes(`| "${bodyType}"`), `Missing local type ${bodyType}`);
}

for (const status of ["scheduled", "completed", "minutes_pending", "minutes_available", "video_available", "needs_sources"]) {
  assert(sql.includes(`'${status}'`), `Missing meeting status ${status}`);
  assert(localMeetings.includes(`"${status}"`) || localMeetings.includes(`| "${status}"`), `Missing local meeting status ${status}`);
}

for (const eventName of [
  "school_board_page_open",
  "public_body_watch_clicked",
  "meeting_open",
  "agenda_source_clicked",
  "minutes_source_clicked",
  "video_source_clicked",
  "meeting_source_gap_clicked",
  "public_question_copied",
  "school_board_package_interest_clicked",
]) {
  assert(clientAnalytics.includes(eventName), `Missing client analytics event ${eventName}`);
  assert(serverAnalytics.includes(eventName), `Missing server analytics allowlist event ${eventName}`);
  assert(analytics.includes(eventName) || tracker.includes(eventName), `Missing UI analytics wiring for ${eventName}`);
}

for (const phrase of ["Missing agenda", "Missing minutes", "Missing video", "Missing vote record", "Missing member source"]) {
  assert(localMeetings.includes(phrase) || tracker.includes(phrase), `Missing source gap phrase ${phrase}`);
}

assert(districtPage.includes("LocalBodyTracker"), "District page does not mount LocalBodyTracker.");
assert(districtPage.includes("isStateSchoolBoardRoute"), "District page does not support /school-boards/texas.");
assert(candidatePage.includes("redirect(getSchoolBoardDistrictUrl(district))"), "State-prefixed school-board district route does not redirect.");
assert(adminApi.includes("admin_audit_log"), "Admin API does not write audit log.");

console.log("Local meeting tracker smoke check passed.");
