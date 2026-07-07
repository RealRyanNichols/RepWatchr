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
const cycleRaceRoute = read("src/app/elections/[state]/[cycle]/[raceSlug]/page.tsx");
const raceAliasRoute = read("src/app/races/[slug]/page.tsx");
const raceCompareRoute = read("src/app/compare/race/[raceSlug]/page.tsx");
const raceAnalytics = read("src/components/elections/RaceHubAnalytics.tsx");
const adminPage = read("src/app/admin/races/page.tsx");
const adminClient = read("src/components/admin/AdminRaceDeskClient.tsx");
const adminAction = read("src/app/api/admin/actions/route.ts");
const seoInventory = read("src/lib/seo-inventory.ts");
const sql = read("supabase-race-hub.sql");
const raceHubDocs = read("docs/ELECTION_RACE_HUBS.md");
const comparisonDocs = read("docs/CANDIDATE_COMPARISON_SYSTEM.md");

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
  "RacePackageInterestGrid",
  "RaceHubAnalytics",
  "data-race-watch",
  "race_public_question_copied",
].forEach((token) => assert(raceRoute.includes(token), `race route missing ${token}`));

[
  "generateTexasRaceMetadata",
  "TexasElectionRacePage",
  "supportedCycles",
].forEach((token) => assert(cycleRaceRoute.includes(token), `cycle race route missing ${token}`));

[
  "resolveTexasElectionSlug",
  "redirect(resolution.race.href)",
].forEach((token) => assert(raceAliasRoute.includes(token), `race alias route missing ${token}`));

[
  "Candidate comparison",
  "ComparisonTable",
  "SourceGapList",
  "routeKind=\"compare\"",
  "data-race-package",
].forEach((token) => assert(raceCompareRoute.includes(token), `race compare route missing ${token}`));

[
  "race_hub_open",
  "race_candidate_clicked",
  "race_source_clicked",
  "race_package_interest_clicked",
].forEach((token) => assert(raceAnalytics.includes(token), `race analytics missing ${token}`));

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
  "/compare/race/${race.slug}",
].forEach((token) => assert(seoInventory.includes(token), `SEO inventory missing ${token}`));

[
  "alter table public.race_pages enable row level security",
  "Public can read published race pages",
  "Admins can update race pages",
  "race_page_events",
  "create table if not exists public.races",
  "create table if not exists public.race_candidates",
  "create table if not exists public.race_sources",
  "create table if not exists public.race_public_questions",
  "Public can read active races",
].forEach((token) => assert(sql.includes(token), `race SQL missing ${token}`));

[
  "/elections/[state]/[cycle]/[raceSlug]",
  "/compare/race/[raceSlug]",
  "race_hub_open",
].forEach((token) => assert(raceHubDocs.includes(token), `race docs missing ${token}`));

[
  "Candidate comparison pages",
  "Neutral Language Rules",
  "Definition Of Ready",
].forEach((token) => assert(comparisonDocs.includes(token), `comparison docs missing ${token}`));

console.log("Race hub smoke checks passed.");
