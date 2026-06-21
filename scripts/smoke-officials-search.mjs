import fs from "node:fs";

const requiredFiles = [
  "src/lib/official-search.ts",
  "src/components/officials/OfficialSearchPanel.tsx",
  "src/app/officials/page.tsx",
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing required file: ${file}`);
  }
}

const searchLib = fs.readFileSync("src/lib/official-search.ts", "utf8");
const searchPanel = fs.readFileSync("src/components/officials/OfficialSearchPanel.tsx", "utf8");
const officialsPage = fs.readFileSync("src/app/officials/page.tsx", "utf8");

const requiredFilters = [
  "state",
  "county",
  "city",
  "level",
  "officeType",
  "party",
  "scoreRange",
  "hasRedFlags",
  "hasFundingData",
  "hasVotingData",
  "missingSources",
  "recentlyUpdated",
  "watchedByMembers",
  "sourceCount",
  "completeness",
];

const requiredSorts = [
  "relevance",
  "most-viewed",
  "most-watched",
  "most-sourced",
  "highest-score",
  "lowest-score",
  "most-red-flags",
  "recently-updated",
  "missing-source-priority",
];

const requiredEmptyActions = [
  "Submit source",
  "Request official brief",
  "Build source packet",
  "Watch this official",
];

for (const token of requiredFilters) {
  if (!searchLib.includes(token)) {
    throw new Error(`Official search library is missing filter token: ${token}`);
  }
}

for (const token of requiredSorts) {
  if (!searchLib.includes(token) || !searchPanel.includes(token)) {
    throw new Error(`Official search is missing sort option: ${token}`);
  }
}

for (const token of requiredEmptyActions) {
  if (!searchPanel.includes(token)) {
    throw new Error(`Official empty state is missing action: ${token}`);
  }
}

if (!officialsPage.includes("generateMetadata")) {
  throw new Error("/officials must generate filter-aware metadata");
}

if (!officialsPage.includes("OfficialSearchPanel") || officialsPage.includes("<OfficialGrid")) {
  throw new Error("/officials must render the server-backed OfficialSearchPanel instead of OfficialGrid");
}

if (!searchLib.includes("isOfficialSearchIndexable") || !searchLib.includes("officialSearchCanonicalPath")) {
  throw new Error("Official search must expose index-safety and canonical helpers");
}

if (!searchPanel.includes("Pagination") || !searchPanel.includes("perPage")) {
  throw new Error("Official search panel must include pagination controls");
}

console.log("officials search smoke check passed");
