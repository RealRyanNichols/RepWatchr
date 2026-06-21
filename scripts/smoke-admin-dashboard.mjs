import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const adminPage = read("src/app/admin/page.tsx");
const adminAuth = read("src/lib/admin-auth.ts");
const adminData = read("src/lib/admin-dashboard.ts");
const adminClient = read("src/components/admin/AdminDashboardClient.tsx");
const adminActions = read("src/app/api/admin/actions/route.ts");
const adminMigration = read("supabase-admin-dashboard.sql");
const healthRoute = read("src/app/api/health/integrations/route.ts");
const controlCenterRoute = read("src/app/api/admin/control-center/route.ts");
const shareRoute = read("src/app/api/analytics/share/route.ts");
const shareButtons = read("src/components/shared/ShareButtons.tsx");
const docs = read("docs/REPWatchr_Build_Map.md");
const packageJson = read("package.json");

assert(adminPage.includes('dynamic = "force-dynamic"'), "/admin must be dynamic");
assert(adminPage.includes("requireAdminPageAccess"), "/admin must use server-side admin access");
assert(adminAuth.includes('redirect("/auth/login?next=/admin")'), "Unauthenticated admin users must redirect to login");
assert(adminAuth.includes('redirect("/dashboard?admin=required")'), "Non-admin users must redirect server-side");
assert(adminAuth.includes('.eq("role", "admin")'), "Admin auth must check user_roles admin role");

for (const section of [
  "Overview",
  "Source Review Queue",
  "Official/Profile Manager",
  "Revenue Desk",
  "Content Desk",
  "Data Health",
  "Audit Log",
]) {
  assert(adminClient.includes(section), `Admin dashboard missing section: ${section}`);
}

for (const action of [
  "source_review",
  "profile_edit",
  "revenue_update",
  "content_upsert",
  "broken_link_update",
]) {
  assert(adminActions.includes(action), `Admin actions route missing ${action}`);
}

assert(adminActions.includes("getAdminUserForServer"), "Admin action route must re-check admin role server-side");
assert(adminActions.includes("insertAudit"), "Admin action route must write audit records");
assert(adminActions.includes("before_values"), "Admin audit must store before values");
assert(adminActions.includes("after_values"), "Admin audit must store after values");

for (const tableName of [
  "admin_audit_log",
  "admin_profile_edits",
  "admin_content_items",
  "admin_broken_source_links",
  "admin_import_runs",
  "site_share_events",
]) {
  assert(adminMigration.includes(`public.${tableName}`), `Migration missing ${tableName}`);
  assert(adminMigration.includes(`alter table public.${tableName} enable row level security`), `Migration missing RLS for ${tableName}`);
  assert(healthRoute.includes(`"${tableName}"`), `Health route missing ${tableName}`);
  assert(controlCenterRoute.includes(`"${tableName}"`), `Control center route missing ${tableName}`);
}

for (const requiredSql of [
  "private.is_repw_admin",
  "grant select, insert, update, delete on public.admin_audit_log to authenticated",
  "Public can insert share events",
  "Admins can read share events",
]) {
  assert(adminMigration.includes(requiredSql), `Migration missing SQL: ${requiredSql}`);
}

assert(shareRoute.includes("site_share_events"), "Share analytics route must write site_share_events");
assert(shareButtons.includes("/api/analytics/share"), "Share buttons must post share events");
assert(adminData.includes("site_page_views"), "Admin data must read most-viewed profiles");
assert(adminData.includes("site_share_events"), "Admin data must read most-shared profiles");
assert(adminData.includes("admin_broken_source_links"), "Admin data must read broken source links");
assert(docs.includes("| `/admin` |"), "Build map missing /admin route");
assert(docs.includes("| `/api/admin/actions` |"), "Build map missing admin actions API");
assert(packageJson.includes('"smoke:admin"'), "package.json missing smoke:admin script");

console.log("admin dashboard smoke checks passed");
