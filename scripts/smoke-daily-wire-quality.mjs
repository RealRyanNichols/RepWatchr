import fs from "node:fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function assert(condition, message) {
  if (!condition) {
    console.error(`Daily Wire quality smoke failed: ${message}`);
    process.exit(1);
  }
}

const quality = read("src/lib/daily-wire-quality.ts");
const wire = read("src/lib/daily-wire.ts");
const sources = read("src/data/daily-news-watch-sources.ts");
const ingestion = read("src/lib/daily-news-clips.ts");
const dailyPage = read("src/app/daily-wire/page.tsx");
const feedPage = read("src/app/feed/page.tsx");
const rssRoute = read("src/app/rss.xml/route.ts");
const social = read("src/lib/social-autopost.ts");
const adminActions = read("src/app/api/admin/actions/route.ts");
const adminClient = read("src/components/admin/AdminDashboardClient.tsx");
const adminData = read("src/lib/admin-dashboard.ts");
const migration = read("supabase-daily-wire-quality.sql");

[
  "accepted",
  "needs_review",
  "quarantined",
  "duplicate",
  "irrelevant",
  "attached_to_profile",
  "promoted_to_story",
].forEach((status) => {
  assert(quality.includes(`"${status}"`), `quality layer missing status ${status}`);
  assert(adminActions.includes(`"${status}"`), `admin action missing status ${status}`);
});

[
  "jurisdictionMatch",
  "geographicRelevance",
  "sourceDomain",
  "topicTags",
  "officialPersonMatches",
  "stateMatches",
  "countyMatches",
  "cityMatches",
  "duplicateScore",
  "qualityScore",
  "sourceTier",
  "publishDate",
  "quarantineStatus",
].forEach((field) => {
  assert(quality.includes(field), `quality layer missing field ${field}`);
  assert(wire.includes(field), `DailyWireClip missing field ${field}`);
});

[
  "Source-linked",
  "Needs review",
  "Local relevance confirmed",
  "National relevance confirmed",
  "Not yet attached to profile",
].forEach((label) => {
  assert(quality.includes(label), `quality layer missing public label ${label}`);
  assert(dailyPage.includes("publicLabels"), "Daily Wire page does not render public labels");
});

assert(sources.includes("DAILY_WIRE_DEFAULT_DENY_DOMAINS"), "source controls missing deny-domain defaults");
assert(sources.includes("DAILY_WIRE_QUERY_LANE_CONTROLS"), "query lane controls are missing");
assert(sources.includes("requiredTerms"), "source controls missing required terms");
assert(sources.includes("deniedTerms"), "source controls missing denied terms");
assert(ingestion.includes("extractSourceMeta"), "RSS parser does not capture publisher source metadata");
assert(wire.includes("getDailyWireReviewQueue"), "admin review queue accessor missing");
assert(wire.includes("isPublicWireStatus"), "public wire status filter missing");
assert(feedPage.includes('clip.publicStatus === "source_linked"'), "feed still allows non-source-linked wire items");
assert(rssRoute.includes('clip.publicStatus === "source_linked"'), "RSS still allows non-source-linked wire items");
assert(social.includes('clip.publicStatus === "source_linked"'), "social autopost still allows non-source-linked wire items");
assert(adminActions.includes('action === "wire_moderation"'), "admin wire moderation action missing");
assert(adminClient.includes('id="wire-review"'), "admin dashboard missing wire review section");
assert(adminData.includes("dailyWireRows"), "admin dashboard data missing daily wire rows");
assert(migration.includes("repwatchr_daily_wire_source_controls"), "migration missing source controls table");
assert(migration.includes("repwatchr_daily_wire_events"), "migration missing wire events table");

console.log("Daily Wire quality smoke passed.");
