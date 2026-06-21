import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

function read(path) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) {
    failures.push(`Missing file: ${path}`);
    return "";
  }
  return readFileSync(fullPath, "utf8");
}

function assertIncludes(path, needle, label = needle) {
  const text = read(path);
  if (!text.includes(needle)) failures.push(`${path} missing ${label}`);
}

function assertRoute(path, label) {
  const text = read(path);
  if (!text.includes("export default")) failures.push(`${label} route is not exporting a page/component.`);
}

assertRoute("src/app/free-packet/page.tsx", "/free-packet");
assertRoute("src/app/investors/page.tsx", "/investors");
assertRoute("src/app/partner/page.tsx", "/partner");

[
  "quick-record-check",
  "local-race-source-pack",
  "official-record-brief",
  "election-watch-desk",
].forEach((slug) => {
  assertIncludes("src/data/repwatchr-services.ts", slug, `paid service ${slug}`);
});

[
  "email_captures",
  "partner_interest_forms",
  "site_analytics_events",
  "member_memberships",
  "grant usage on schema public to anon, authenticated",
  "Public can insert analytics events",
].forEach((needle) => {
  assertIncludes("supabase-growth-membership.sql", needle);
});

[
  "free_founder",
  "watcher_pro",
  "research_desk",
  "membershipBillingEnabled",
].forEach((needle) => {
  assertIncludes("src/lib/membership-tiers.ts", needle);
});

[
  "free_packet_started",
  "free_packet_completed",
  "email_captured",
  "account_prompt_clicked",
  "upsell_clicked",
  "profile_watch_clicked",
].forEach((needle) => {
  assertIncludes("src/app/api/analytics/event/route.ts", needle, `analytics event ${needle}`);
  assertIncludes("supabase-growth-membership.sql", needle, `SQL analytics event ${needle}`);
});

[
  "public_records_request_created",
  "watchlist_add",
  "source_submit_completed",
].forEach((needle) => {
  assertIncludes("src/components/dashboard/RepWatchrMemberDashboard.tsx", needle, `dashboard event ${needle}`);
});

assertIncludes("src/components/services/ServiceCheckoutButton.tsx", "checkout_started", "checkout start event");

if (failures.length) {
  console.error("Growth/membership smoke failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Growth/membership smoke passed.");
