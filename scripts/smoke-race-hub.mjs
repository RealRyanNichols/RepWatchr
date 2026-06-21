import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    console.error(`Race hub smoke failed: ${message}`);
    process.exit(1);
  }
}

const raceHub = read("src/lib/race-hub.ts");
const texasIndex = read("src/app/elections/texas/page.tsx");
const raceRoute = read("src/app/elections/texas/[raceSlug]/page.tsx");
const adminPage = read("src/app/admin/races/page.tsx");
const adminClient = read("src/components/admin/AdminRaceDeskClient.tsx");
const adminAction = read("src/app/api/admin/actions/route.ts");
const seoInventory = read("src/lib/seo-inventory.ts");
const sql = read("supabase-race-hub.sql");

[
  "getTexasCountyHubs",
  "getTexasDistrictHubs",
  "resolveTexasElectionSlug",
  "EAST_TEXAS_COUNTY_HUBS",
  "candidateComparisonRows",
].forEach((token) => assert(raceHub.includes(token), `missing race-hub token ${token}`));

[
  "Candidate comparison",
  "SourceGroups",
  "MissingRecords",
  "VoterQuestions",
  "ShareSnippets",
  "Request Race Source Pack",
].forEach((token) => assert(raceRoute.includes(token), `race route missing ${token}`));

[
  "CountyCard",
  "DistrictCard",
  "East Texas county race hubs",
].forEach((token) => assert(texasIndex.includes(token), `Texas index missing ${token}`));

[
  "requireAdminPageAccess",
  "AdminRaceDeskClient",
].forEach((token) => assert(adminPage.includes(token), `admin race page missing ${token}`));

[
  "race_edit",
  "candidatesText",
  "sourceLinksText",
  "redFlagsText",
  "missingRecordsText",
].forEach((token) => assert(adminClient.includes(token), `admin race client missing ${token}`));

[
  "handleRaceEdit",
  "race_pages",
  "parseRaceCandidates",
  "published race page needs at least one public source link",
].forEach((token) => assert(adminAction.includes(token), `admin action route missing ${token}`));

[
  "getTexasCountyHubs",
  "getTexasDistrictHubs",
  "getTexasRaceHubRaces",
].forEach((token) => assert(seoInventory.includes(token), `SEO inventory missing ${token}`));

[
  "alter table public.race_pages enable row level security",
  "Public can read published race pages",
  "Admins can update race pages",
  "race_page_events",
].forEach((token) => assert(sql.includes(token), `race SQL missing ${token}`));

console.log("Race hub smoke checks passed.");
