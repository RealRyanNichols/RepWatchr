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

const dashboardPage = read("src/app/dashboard/page.tsx");
const dashboardClient = read("src/components/dashboard/RepWatchrMemberDashboard.tsx");
const migration = read("supabase-member-dashboard.sql");
const healthRoute = read("src/app/api/health/integrations/route.ts");
const controlCenterRoute = read("src/app/api/admin/control-center/route.ts");
const signupPage = read("src/app/auth/signup/page.tsx");
const loginPage = read("src/app/auth/login/page.tsx");
const globalsCss = read("src/app/globals.css");

assert(dashboardPage.includes('redirect("/auth/login?next=/dashboard")'), "Dashboard route does not require login");
assert(dashboardPage.includes('dynamic = "force-dynamic"'), "Dashboard route must be dynamic for auth");
assert(signupPage.includes("/auth/callback?next=/dashboard"), "Signup does not return new members to dashboard");
assert(signupPage.includes('router.replace("/dashboard")'), "Signup does not redirect active sessions to dashboard");
assert(loginPage.includes("/auth/callback?next=/dashboard"), "Magic login does not return members to dashboard");
assert(loginPage.includes('router.replace("/dashboard")'), "Password login does not redirect to dashboard");

for (const label of [
  "Watchlist",
  "Source Packet Builder",
  "Public Records Request Drafts",
  "Timeline Starter",
  "Faretta AI Research Helper",
  "My Submissions",
  "Upgrade / paid services",
]) {
  assert(dashboardClient.includes(label), `Dashboard missing module: ${label}`);
}

for (const routeOrApi of [
  'fetch("/api/source-submissions"',
  'fetch("/api/faretta/chat"',
  'href="/faretta-ai"',
  'href="/services"',
]) {
  assert(dashboardClient.includes(routeOrApi), `Dashboard missing integration: ${routeOrApi}`);
}

assert(
  dashboardClient.includes('.eq("submitter_user_id", user.id)'),
  "My Submissions query must be explicitly scoped to the signed-in user"
);
assert(dashboardClient.includes("buildClientSourcePacket"), "Dashboard does not build source packets");
assert(dashboardClient.includes("downloadTextFile"), "Dashboard does not keep export backup");
assert(dashboardClient.includes("source gaps, public records to pull"), "Faretta helper missing source-gap guardrail");

for (const className of [".field", ".primary-button", ".secondary-button", ".mini-button"]) {
  assert(globalsCss.includes(className), `Missing dashboard shared style ${className}`);
}

for (const tableName of [
  "member_tracked_items",
  "member_source_packet_drafts",
  "member_public_record_requests",
  "member_timeline_starters",
  "member_faretta_notes",
]) {
  assert(migration.includes(`public.${tableName}`), `Migration missing ${tableName}`);
  assert(migration.includes(`alter table public.${tableName} enable row level security`), `Migration missing RLS for ${tableName}`);
  assert(migration.includes(`grant select, insert, update, delete on public.${tableName} to authenticated`), `Migration missing authenticated grants for ${tableName}`);
  assert(healthRoute.includes(`"${tableName}"`), `Health route missing ${tableName}`);
  assert(controlCenterRoute.includes(`"${tableName}"`), `Control center route missing ${tableName}`);
}

for (const policyText of [
  "Users can read own tracked items",
  "Users can insert own source packet drafts",
  "Users can update own public record requests",
  "Users can delete own timeline starters",
  "Users can read own Faretta notes",
]) {
  assert(migration.includes(policyText), `Migration missing policy: ${policyText}`);
}

for (const status of ["draft", "sent", "response_received", "overdue"]) {
  assert(migration.includes(`'${status}'`), `Migration missing public-record request status ${status}`);
}

console.log("member dashboard smoke checks passed");
