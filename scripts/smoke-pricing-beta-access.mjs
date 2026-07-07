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
  "docs/PRICING_EXPERIMENTS.md",
  "docs/FEATURE_FLAGS.md",
  "docs/BETA_ACCESS_SYSTEM.md",
  "supabase-pricing-beta-access.sql",
  "src/lib/feature-flags.ts",
  "src/lib/pricing-beta.ts",
  "src/app/api/beta-access/request/route.ts",
  "src/components/services/BetaAccessRequestPanel.tsx",
  "src/app/api/admin/pricing/route.ts",
  "src/components/pricing/AdminPricingClient.tsx",
  "src/app/admin/pricing/page.tsx",
];

for (const file of requiredFiles) {
  assert(existsSync(join(root, file)), `Missing pricing/beta file: ${file}`);
}

const sql = read("supabase-pricing-beta-access.sql");
for (const table of [
  "feature_flags",
  "pricing_experiments",
  "pricing_experiment_assignments",
  "pricing_experiment_events",
  "beta_access_requests",
]) {
  assert(sql.includes(`create table if not exists public.${table}`), `Missing SQL table ${table}`);
  assert(sql.includes(`alter table public.${table} enable row level security`), `Missing RLS for ${table}`);
  assert(sql.includes(`revoke all on public.${table} from anon, authenticated`), `Missing explicit revoke for ${table}`);
}

for (const flag of [
  "ENABLE_PAYMENTS",
  "ENABLE_AI_SOURCE_REVIEW",
  "ENABLE_EMAIL_SENDING",
  "ENABLE_PUBLIC_API",
  "ENABLE_BETA_PACKAGES",
  "ENABLE_ORGANIZATION_DASHBOARD",
  "ENABLE_ADVANCED_ANALYTICS",
  "ENABLE_EXPORTS",
  "ENABLE_PWA_INSTALL_PROMPT",
]) {
  assert(sql.includes(`'${flag}'`), `SQL seeds core flag ${flag}`);
}

assert(sql.includes("Public can request beta access"), "SQL includes public beta insert policy.");
assert(sql.includes("Users can read own beta access requests"), "SQL includes own beta read policy.");
assert(sql.includes("Admins can manage feature flags"), "SQL includes admin feature flag policy.");
assert(sql.includes("Admins can manage pricing experiments"), "SQL includes admin experiment policy.");
assert(sql.includes("Admins can manage beta access requests"), "SQL includes admin beta policy.");
assert(sql.includes("private.is_repw_admin"), "SQL uses admin helper.");

const flags = read("src/lib/feature-flags.ts");
assert(flags.includes("export async function isFeatureEnabled"), "Feature flag utility exports isFeatureEnabled.");
assert(flags.includes("process.env[normalizedKey]"), "Feature flag utility checks server env first.");
assert(flags.includes("return { key: normalizedKey, enabled: false"), "Feature flags default false.");
assert(!flags.includes("NEXT_PUBLIC_ENABLE_PAYMENTS"), "Feature flags do not use public payment env.");

const products = read("src/lib/repwatchr-payment-products.ts");
assert(products.includes("process.env.ENABLE_PAYMENTS === \"true\""), "Service checkout requires ENABLE_PAYMENTS=true.");
assert(products.includes("STRIPE_SECRET_KEY"), "Service checkout still requires Stripe server key.");

const pricing = read("src/lib/pricing-beta.ts");
for (const packageKey of [
  "quick-record-check",
  "official-record-brief",
  "local-race-source-pack",
  "election-watch-desk",
  "school-board-monitor",
]) {
  assert(pricing.includes(packageKey), `Pricing candidates include ${packageKey}`);
}
for (const price of ["$49", "$79", "$99", "$199", "$299", "$499", "$500/mo", "$750/mo", "$1,500/mo", "$99/mo"]) {
  assert(pricing.includes(price), `Pricing candidates include ${price}`);
}

const betaApi = read("src/app/api/beta-access/request/route.ts");
assert(betaApi.includes(".from(\"beta_access_requests\")"), "Beta API writes beta_access_requests.");
assert(betaApi.includes("beta_access_requested"), "Beta API records beta access event.");
assert(betaApi.includes("getSupabaseAdminClient"), "Beta API uses server-side admin client.");
assert(!betaApi.includes("not configured"), "Beta API does not expose internal setup language.");

const betaPanel = read("src/components/services/BetaAccessRequestPanel.tsx");
for (const phrase of [
  "Request beta access",
  "Tell us what you need monitored",
  "RepWatchr is collecting demand before launching paid packages.",
  "No payment is collected here. Access is reviewed manually and is not guaranteed.",
]) {
  assert(betaPanel.includes(phrase), `Beta panel includes safe phrase: ${phrase}`);
}
assert(betaPanel.includes("/api/beta-access/request"), "Beta panel posts to beta API.");
assert(betaPanel.includes("pricing_cta_clicked"), "Beta panel tracks pricing CTA.");
assert(betaPanel.includes("beta_access_requested"), "Beta panel tracks beta request.");

const servicePage = read("src/app/services/[slug]/page.tsx");
assert(servicePage.includes("BetaAccessRequestPanel"), "Service page renders beta access panel.");
assert(servicePage.includes("isFeatureEnabled(\"ENABLE_BETA_PACKAGES\")"), "Service page gates expected pricing range.");
assert(servicePage.includes("serviceStructuredData(service, paymentsEnabled)"), "Service structured data depends on payment state.");

const checkoutButton = read("src/components/services/ServiceCheckoutButton.tsx");
assert(checkoutButton.includes("Request beta access"), "Disabled checkout CTA says Request beta access.");
assert(checkoutButton.includes("#beta-access"), "Disabled checkout points to beta access module.");
assert(checkoutButton.includes("checkout_started"), "Enabled checkout still tracks checkout start.");

const adminApi = read("src/app/api/admin/pricing/route.ts");
assert(adminApi.includes("getAdminUserForServer"), "Admin pricing API is server-side admin protected.");
for (const action of ["upsert_feature_flag", "create_experiment", "update_experiment_status", "update_beta_status", "invite_beta_user"]) {
  assert(adminApi.includes(action), `Admin pricing API supports ${action}`);
}
assert(adminApi.includes("admin_audit_log"), "Admin pricing API writes audit log.");

const adminPage = read("src/app/admin/pricing/page.tsx");
assert(adminPage.includes("robots: { index: false, follow: false }"), "Admin pricing page is noindex.");
assert(adminPage.includes("requireAdminPageAccess"), "Admin pricing page is server-side protected.");
assert(adminPage.includes("ENABLE_PAYMENTS=true"), "Admin page states payment flag boundary.");

const adminClient = read("src/components/pricing/AdminPricingClient.tsx");
for (const uiNeedle of ["Feature flags", "Package demand", "Create experiment", "Beta access requests", "Create invite code"]) {
  assert(adminClient.includes(uiNeedle), `Admin pricing UI includes ${uiNeedle}`);
}

const adminDashboard = read("src/components/admin/AdminDashboardClient.tsx");
assert(adminDashboard.includes("/admin/pricing"), "Main admin dashboard links to pricing desk.");

const clientAnalytics = read("src/lib/client-analytics.ts");
const serverAnalytics = read("src/app/api/analytics/event/route.ts");
for (const eventName of [
  "feature_flag_evaluated",
  "pricing_experiment_viewed",
  "pricing_variant_assigned",
  "pricing_cta_clicked",
  "beta_access_requested",
  "package_interest_submitted",
  "beta_invite_sent",
]) {
  assert(clientAnalytics.includes(eventName), `Client analytics allows ${eventName}`);
  assert(serverAnalytics.includes(eventName), `Server analytics allows ${eventName}`);
}

const docs = `${read("docs/PRICING_EXPERIMENTS.md")}\n${read("docs/FEATURE_FLAGS.md")}\n${read("docs/BETA_ACCESS_SYSTEM.md")}`;
for (const phrase of [
  "Payments are not publicly launched unless `ENABLE_PAYMENTS=true`.",
  "Default is off.",
  "No payment is collected here. Access is reviewed manually and is not guaranteed.",
]) {
  assert(docs.includes(phrase), `Docs include boundary: ${phrase}`);
}
for (const unsafe of ["Win your election", "Expose officials", "Guaranteed results"]) {
  assert(docs.includes(unsafe), `Docs explicitly warn against ${unsafe}`);
  assert(!betaPanel.includes(unsafe), `Public beta panel must not include unsafe phrase ${unsafe}`);
}

console.log("Pricing experiments and beta access smoke check passed.");
