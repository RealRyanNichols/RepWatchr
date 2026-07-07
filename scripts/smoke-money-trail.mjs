import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function exists(file) {
  return fs.existsSync(path.join(root, file));
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

const requiredFiles = [
  "docs/CAMPAIGN_FINANCE_SYSTEM.md",
  "docs/MONEY_TRAIL_LANGUAGE_RULES.md",
  "supabase-campaign-finance-money-trail.sql",
  "src/lib/money-trail.ts",
  "src/components/money/MoneyTrailAnalytics.tsx",
  "src/components/money/MoneyTrailSection.tsx",
  "src/components/money/RaceMoneyTrailSection.tsx",
  "src/app/money/page.tsx",
  "src/app/money/committees/[slug]/page.tsx",
  "src/app/money/donors/[slug]/page.tsx",
  "src/app/admin/money/page.tsx",
  "src/app/api/admin/money/route.ts",
];

for (const file of requiredFiles) {
  assert(exists(file), `${file} exists`);
}

const sql = read("supabase-campaign-finance-money-trail.sql");
for (const table of ["finance_records", "committees", "donor_entities", "vendor_records"]) {
  assert(sql.includes(`create table if not exists public.${table}`), `${table} table is created`);
  assert(sql.includes(`alter table public.${table} enable row level security`), `${table} has RLS enabled`);
  assert(sql.includes(`grant select on public.${table}`), `${table} has explicit select grant`);
}

assert(sql.includes("public.is_repw_admin()"), "admin RLS policies use server-side admin role check");
assert(sql.includes("source_url text not null"), "money records require source URLs");
assert(sql.includes("amount is null or amount >= 0"), "money record amounts cannot be negative");

const disclaimer =
  "Campaign finance records show public filings. RepWatchr does not imply wrongdoing from a contribution or expenditure by itself.";
const docs = `${read("docs/CAMPAIGN_FINANCE_SYSTEM.md")}\n${read("docs/MONEY_TRAIL_LANGUAGE_RULES.md")}`;
const section = read("src/components/money/MoneyTrailSection.tsx");
assert(docs.includes(disclaimer), "money docs include the required neutral disclaimer");
assert(section.includes(disclaimer), "profile money section renders the neutral disclaimer");

const clientAnalytics = read("src/lib/client-analytics.ts");
const serverAnalytics = read("src/app/api/analytics/event/route.ts");
for (const eventName of [
  "finance_section_open",
  "finance_record_clicked",
  "finance_source_clicked",
  "finance_filter_used",
  "finance_gap_submit_clicked",
  "money_package_interest_clicked",
]) {
  assert(clientAnalytics.includes(eventName), `client analytics allows ${eventName}`);
  assert(serverAnalytics.includes(eventName), `server analytics allows ${eventName}`);
}

const officialProfile = read("src/app/officials/[id]/page.tsx");
assert(officialProfile.includes("MoneyTrailSection"), "official profile renders MoneyTrailSection");
assert(officialProfile.includes("getMoneyTrailForOfficial"), "official profile loads normalized money trail data");

const fundingProfile = read("src/app/funding/[officialId]/page.tsx");
assert(fundingProfile.includes("MoneyTrailSection"), "funding detail renders normalized money trail rows");

const racePage = read("src/app/elections/texas/[raceSlug]/page.tsx");
assert(racePage.includes("RaceMoneyTrailSection"), "race page renders race money trail section");

const moneyIndex = read("src/app/money/page.tsx");
assert(moneyIndex.includes("MoneyTrailAnalytics"), "money index tracks finance analytics");
assert(moneyIndex.includes("data-finance-filter"), "money index exposes finance filter analytics");

const donorPage = read("src/app/money/donors/[slug]/page.tsx");
const committeePage = read("src/app/money/committees/[slug]/page.tsx");
assert(donorPage.includes("robots: { index: false"), "donor/source aggregate pages are noindex");
assert(committeePage.includes("robots: { index: false"), "committee/source pages are noindex");

const adminApi = read("src/app/api/admin/money/route.ts");
assert(adminApi.includes("getAdminUserForServer"), "money admin API checks admin user server-side");
assert(adminApi.includes("admin_audit_log"), "money admin API writes audit logs");

const adminDashboard = read("src/components/admin/AdminDashboardClient.tsx");
assert(adminDashboard.includes("/admin/money"), "admin dashboard links to Money Desk");

const seoInventory = read("src/lib/seo-inventory.ts");
assert(seoInventory.includes('path: "/money"'), "SEO inventory includes money index");

if (process.exitCode) {
  console.error("Money trail smoke check failed.");
  process.exit(process.exitCode);
}

console.log("Money trail smoke check passed.");
