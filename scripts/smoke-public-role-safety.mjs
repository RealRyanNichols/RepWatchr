import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const requiredFiles = [
  "docs/LAW_ENFORCEMENT_PROFILE_POLICY.md",
  "docs/COURT_PROSECUTOR_PROFILE_POLICY.md",
  "src/lib/public-role-safety.ts",
  "src/components/public-safety/PublicRoleSafetyModule.tsx",
  "src/components/public-safety/PublicSafetyProfileAnalytics.tsx",
  "supabase-law-enforcement-court-profiles.sql",
];

for (const file of requiredFiles) {
  assert(existsSync(join(root, file)), `Missing required public-role file: ${file}`);
}

const helper = read("src/lib/public-role-safety.ts");
const roleModule = read("src/components/public-safety/PublicRoleSafetyModule.tsx");
const analytics = read("src/components/public-safety/PublicSafetyProfileAnalytics.tsx");
const profilePage = read("src/app/public-safety/[slug]/page.tsx");
const adminClient = read("src/components/admin/AdminDashboardClient.tsx");
const adminRoute = read("src/app/api/admin/actions/route.ts");
const clientAnalytics = read("src/lib/client-analytics.ts");
const sql = read("supabase-law-enforcement-court-profiles.sql");
const lawDoc = read("docs/LAW_ENFORCEMENT_PROFILE_POLICY.md");
const courtDoc = read("docs/COURT_PROSECUTOR_PROFILE_POLICY.md");

assert(helper.includes("PUBLIC_ROLE_BOUNDARY_TEXT"), "Missing shared public role boundary constant.");
assert(helper.includes("This profile covers public-role records only"), "Boundary text is not defined in the shared helper.");
assert(roleModule.includes("PUBLIC_ROLE_BOUNDARY_TEXT"), "Boundary text constant is not rendered in the public role module.");
assert(roleModule.includes("No incident or case mention is published from this module"), "Missing safe incident/case empty state.");
assert(profilePage.includes("PublicRoleSafetyModule"), "Public role safety module is not mounted on public safety profile pages.");
assert(profilePage.includes("PublicSafetyProfileAnalytics"), "Public safety analytics shim is not mounted.");

for (const eventName of [
  "badge_profile_open",
  "court_profile_open",
  "public_role_boundary_viewed",
  "agency_policy_source_clicked",
  "public_info_source_clicked",
  "badge_profile_correction_clicked",
  "badge_profile_source_submitted",
  "safety_report_submitted",
]) {
  assert(clientAnalytics.includes(eventName), `Missing analytics event type: ${eventName}`);
  assert(analytics.includes(eventName) || roleModule.includes(eventName), `Missing analytics wiring for ${eventName}`);
}

for (const table of ["law_enforcement_profiles", "court_official_profiles"]) {
  assert(sql.includes(`public.${table}`), `Missing Supabase table definition for ${table}`);
  assert(sql.includes(`alter table public.${table} enable row level security`), `Missing RLS enable for ${table}`);
}

for (const targetType of ["constable", "agency_official", "judge", "prosecutor", "district_attorney", "court_official"]) {
  assert(sql.includes(`'${targetType}'`), `Missing SQL target type ${targetType}`);
}

assert(adminClient.includes("PUBLIC_ROLE_REVIEW_LABELS"), "Admin form does not expose public-role review labels.");
assert(adminRoute.includes("publicRoleLabels"), "Admin API does not validate public-role labels.");
assert(adminRoute.includes("public_role_label"), "Admin API does not store public-role label metadata.");
assert(lawDoc.includes("Wanted-poster") || lawDoc.includes("wanted-poster"), "Law enforcement policy does not ban wanted-style framing.");
assert(courtDoc.includes("Court and prosecutor profiles require restrained copy"), "Court/prosecutor policy lacks restrained-copy rule.");

console.log("Public-role safety smoke check passed.");
