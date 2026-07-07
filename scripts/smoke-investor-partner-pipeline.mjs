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
  "docs/INVESTOR_PARTNER_PIPELINE.md",
  "docs/SPONSORSHIP_BOUNDARIES.md",
  "supabase-investor-partner-pipeline.sql",
  "src/app/investors/page.tsx",
  "src/app/partner/page.tsx",
  "src/components/investors/PartnerInterestForm.tsx",
  "src/app/api/investor-interest/route.ts",
  "src/lib/partner-pipeline.ts",
  "src/lib/partner-pipeline-admin.ts",
  "src/app/admin/partners/page.tsx",
  "src/app/api/admin/partners/route.ts",
  "src/components/investors/AdminPartnerPipelineClient.tsx",
];

for (const file of requiredFiles) {
  assert(existsSync(join(root, file)), `Missing investor/partner pipeline file: ${file}`);
}

const sql = read("supabase-investor-partner-pipeline.sql");
for (const table of ["partner_interest", "partner_pipeline_events", "partner_accounts"]) {
  assert(sql.includes(`create table if not exists public.${table}`), `Missing SQL table ${table}`);
  assert(sql.includes(`alter table public.${table} enable row level security`), `Missing RLS for ${table}`);
  assert(sql.includes(`revoke all on public.${table} from anon, authenticated`), `Missing explicit revoke for ${table}`);
}

for (const interestType of [
  "investor",
  "data_api_partner",
  "media_partner",
  "legal_research_customer",
  "journalist",
  "civic_group",
  "nonprofit",
  "campaign_public_affairs",
  "school_board_monitoring",
  "county_monitoring",
  "organization_dashboard",
  "sponsor_civic_education",
  "government_contractor_monitoring",
  "other",
]) {
  assert(sql.includes(`'${interestType}'`), `Missing interest type in SQL: ${interestType}`);
}

for (const status of ["new", "reviewed", "contacted", "meeting_scheduled", "qualified", "not_fit", "partner", "investor_interest", "archived"]) {
  assert(sql.includes(`'${status}'`), `Missing pipeline status in SQL: ${status}`);
}

assert(sql.includes("private.is_repw_admin"), "SQL includes admin helper.");
assert(sql.includes("Public can insert partner interest"), "SQL includes public insert policy.");
assert(sql.includes("Users can read own partner interest"), "SQL includes own-record read policy.");
assert(sql.includes("Admins can manage partner interest"), "SQL includes admin policy.");

const publicPage = read("src/app/investors/page.tsx");
assert(
  publicPage.includes("RepWatchr is building public-record infrastructure for civic accountability."),
  "Investor page includes required headline.",
);
assert(
  publicPage.includes("Search profiles, attach sources, watch officials, build packets, and turn public records into usable civic intelligence."),
  "Investor page includes required subheadline.",
);
assert(publicPage.includes("Tracking now being built."), "Investor page does not fake unknown traction.");
assert(publicPage.includes("not a public securities offering"), "Investor page includes securities disclaimer.");
assert(publicPage.includes("Sponsored civic education must be clearly labeled"), "Investor page includes sponsor boundary.");

const partnerRedirect = read("src/app/partner/page.tsx");
assert(partnerRedirect.includes("redirect(\"/investors\")"), "Partner route redirects to investors page.");

const form = read("src/components/investors/PartnerInterestForm.tsx");
for (const field of ["title", "website", "budgetOrCheckSize", "jurisdictionFocus", "message"]) {
  assert(form.includes(field), `Interest form includes ${field}`);
}
assert(form.includes("/api/investor-interest"), "Interest form posts to public API.");
assert(form.includes("partner_interest_started"), "Interest form tracks start event.");
assert(form.includes("partner_interest_submitted"), "Interest form tracks submitted event.");
assert(form.includes("not a public securities offering"), "Interest form shows securities disclaimer.");

const publicApi = read("src/app/api/investor-interest/route.ts");
assert(publicApi.includes(".from(\"partner_interest\")"), "Public API writes partner_interest.");
assert(publicApi.includes(".from(\"partner_pipeline_events\")"), "Public API writes pipeline event.");
assert(!publicApi.includes("partner_interest_forms"), "Public API no longer writes old partner_interest_forms table.");
assert(publicApi.includes("getSupabaseAdminClient"), "Public API uses server-side admin client for persistence.");
assert(!publicApi.includes("not configured"), "Public API avoids internal not-configured public language.");

const adminRoute = read("src/app/api/admin/partners/route.ts");
assert(adminRoute.includes("getAdminUserForServer"), "Admin partner API is server-side admin protected.");
for (const action of ["update_status", "add_note", "assign_owner", "create_partner_account"]) {
  assert(adminRoute.includes(action), `Admin partner API supports ${action}`);
}
assert(adminRoute.includes("admin_audit_log"), "Admin partner API writes audit log.");

const adminPage = read("src/app/admin/partners/page.tsx");
assert(adminPage.includes("robots: { index: false, follow: false }"), "Admin partner page is noindex.");
assert(adminPage.includes("requireAdminPageAccess"), "Admin partner page is server-side protected.");

const adminClient = read("src/components/investors/AdminPartnerPipelineClient.tsx");
for (const uiNeedle of ["Export filtered CSV", "Assign owner", "Create partner account", "partner_pipeline_open", "partner_status_changed"]) {
  assert(adminClient.includes(uiNeedle), `Admin client includes ${uiNeedle}`);
}

const adminDashboard = read("src/components/admin/AdminDashboardClient.tsx");
assert(adminDashboard.includes("/admin/partners"), "Main admin dashboard links to partner pipeline.");

const clientAnalytics = read("src/lib/client-analytics.ts");
const serverAnalytics = read("src/app/api/analytics/event/route.ts");
for (const eventName of [
  "investor_page_open",
  "partner_page_open",
  "partner_interest_started",
  "partner_interest_submitted",
  "partner_pipeline_open",
  "partner_status_changed",
]) {
  assert(clientAnalytics.includes(eventName), `Client analytics allows ${eventName}`);
  assert(serverAnalytics.includes(eventName), `Server analytics allows ${eventName}`);
}

const docs = `${read("docs/INVESTOR_PARTNER_PIPELINE.md")}\n${read("docs/SPONSORSHIP_BOUNDARIES.md")}`;
for (const required of [
  "not a public securities offering",
  "does not offer investment terms",
  "Sponsored content must be clearly labeled",
  "must not create hidden sponsored content",
  "must not promise political outcomes",
]) {
  assert(docs.includes(required), `Docs include boundary: ${required}`);
}

for (const forbidden of [
  "guaranteed returns are available",
  "we offer investment terms",
  "hidden sponsored content is allowed",
  "guaranteed political results are available",
]) {
  assert(!docs.toLowerCase().includes(forbidden), `Docs include forbidden phrase: ${forbidden}`);
}

console.log("Investor/partner pipeline smoke check passed.");
