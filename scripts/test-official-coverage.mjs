import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import Module, { createRequire } from "node:module";
import ts from "typescript";

// Exercise the actual server data adapters without a running Next server or DB.
const require = createRequire(import.meta.url);
const root = process.cwd();
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  return resolve.call(
    this,
    request.startsWith("@/")
      ? path.join(root, "src", request.slice(2))
      : request,
    parent,
    ...rest,
  );
};
Module._extensions[".ts"] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

const {
  getSchoolBoardSearchIndex,
  isVacancyRecord,
} = require("../src/lib/school-board-search.ts");
const {
  getOfficialCoverage,
  officialState,
} = require("../src/lib/official-coverage.ts");
const {
  harletonRoster,
  schoolBoardIdentityLinks,
  harletonMemberHref,
} = require("../src/data/coverage/harleton-roster.ts");
const { getAllOfficials } = require("../src/lib/data.ts");
const {
  getSchoolBoardDistrict,
  getSchoolBoardCandidate,
} = require("../src/lib/school-board-research.ts");
const {
  documentedActiveSchoolInterventions,
} = require("../src/data/coverage/school-governance.ts");
const {
  parseOfficialSearchParams,
  officialSearchQuery,
  isOfficialSearchIndexable,
  searchOfficials,
} = require("../src/lib/official-search.ts");

const school = getSchoolBoardSearchIndex();
const coverage = getOfficialCoverage();
assert(
  school.rows.length > 8000,
  "The directory must include the separate statewide school dataset",
);
assert(
  school.excludedVacancies >= 5,
  "Vacancy placeholders must not appear as people",
);
assert(
  isVacancyRecord({
    candidate_id: "place_6_vacant_round_rock_isd",
    full_name: "Place 6 Vacant",
  }),
);
assert.equal(
  new Set(school.rows.map((row) => row.profileHref)).size,
  school.rows.length,
  "Canonical research URLs must be unique",
);
for (const row of school.rows) {
  assert(
    !row.profileHref.includes("_"),
    `Use canonical hyphenated URLs: ${row.profileHref}`,
  );
  assert.equal(row.score, null);
  assert.equal(row.hasVotingData, false);
  assert.equal(row.hasFundingData, false);
  if (row.sourceSnapshotDate) {
    assert(
      row.recordStatus.includes("unconfirmed") ||
        row.recordStatus.includes("needs refresh") ||
        row.recordStatus.includes("Earlier record"),
    );
    if (row.recordStatus.includes("roster snapshot"))
      assert(
        row.recordStatus.includes("2025"),
        "Month-text snapshot dates must retain the year in their label",
      );
  }
}
const officialIds = new Set(getAllOfficials().map((official) => official.id));
for (const link of schoolBoardIdentityLinks) {
  assert(officialIds.has(link.officialId));
  assert(
    school.dossiers.some(
      (candidate) => candidate.candidate_id === link.candidateId,
    ),
  );
  assert(
    !school.rows.some(
      (row) => row.official.id === `school-research:${link.candidateId}`,
    ),
    "An explicitly linked identity must be represented once in search",
  );
}
assert.equal(harletonRoster.members.length, 7);
assert.equal(
  getSchoolBoardDistrict("harleton_isd").officialRoster.length,
  7,
  "District roster must use the current dated observation",
);
assert.equal(
  getSchoolBoardCandidate("pat_mcgill_harleton_isd").candidate_id,
  "patrick_mcgill_harleton_isd",
  "Known AskTED alias must resolve to one canonical profile",
);
const earlierHarleton = getSchoolBoardCandidate("kevin_evers_harleton_isd");
assert.equal(earlierHarleton.incumbent, false);
assert.equal(earlierHarleton.roster_observation.listed, false);
assert(earlierHarleton.summary.includes("departure date"));
assert(
  earlierHarleton.about_public_record.board_performance_incumbents_only
    .notable_votes.length > 0,
  "Historical meeting evidence must be retained",
);
assert.equal(
  earlierHarleton.election_date,
  undefined,
  "Old term text must not turn into an asserted current ballot filing",
);
assert.equal(
  harletonRoster.members.filter((member) => member.selection === "elected")
    .length,
  6,
);
const appointed = harletonRoster.members.find(
  (member) => member.selection === "appointed",
);
assert.equal(appointed.name, "Chance Ebarb");
assert.equal(
  appointed.termEndMonth,
  null,
  "Do not invent a missing term expiration",
);
assert.equal(
  harletonMemberHref(appointed),
  "/school-boards/harleton-isd/chance-ebarb-harleton-isd",
);
assert.equal(
  coverage.officialProfiles,
  coverage.states.reduce((sum, state) => sum + state.officialProfiles, 0) +
    coverage.stateUnknownProfiles,
);
assert.equal(
  coverage.searchRecords,
  coverage.officialProfiles + school.rows.length,
);
assert.equal(
  coverage.schoolNamedRecords,
  school.dossiers.length - school.excludedVacancies,
);
assert.equal(
  coverage.schoolDistricts,
  new Set(
    school.dossiers.map(
      (candidate) => `${candidate.state}:${candidate.district_slug}`,
    ),
  ).size,
);
assert(
  coverage.states.filter((state) => state.officialProfiles > 0).length >= 50,
);
assert.equal(
  coverage.states.find((state) => state.code === "CA").schoolDistricts,
  0,
  "Do not convert national district goals into loaded data",
);
assert.equal(
  officialState({
    state: undefined,
    jurisdiction: "Unassigned",
    county: ["Harrison"],
    contactInfo: {},
  }),
  "",
  "County names alone must not assign a state",
);
assert.equal(
  officialState({
    state: undefined,
    jurisdiction: "Harleton ISD",
    county: ["Harrison"],
    contactInfo: { office: "17000 State Hwy 154, Harleton, TX 75651" },
  }),
  "TX",
);
const params = parseOfficialSearchParams({
  recordType: "school-research",
  state: "TX",
  county: "Harrison County",
  search: "Chance Ebarb",
});
assert(
  officialSearchQuery(params, { page: 2 }).includes(
    "recordType=school-research",
  ),
);
assert.equal(isOfficialSearchIndexable(params), false);
assert.equal(
  parseOfficialSearchParams({ recordType: "unknown" }).recordType,
  "all",
);
assert.equal(
  documentedActiveSchoolInterventions(["harleton_isd"]),
  0,
  "Generic TEA research checks do not imply an investigation",
);
assert.equal(
  documentedActiveSchoolInterventions(["houston_isd", "fort_worth_isd"]),
  2,
);
assert.equal(
  documentedActiveSchoolInterventions(
    ["closed_isd"],
    [
      {
        districtSlug: "closed_isd",
        status: "closed",
        sourceUrl: "https://tea.texas.gov",
        observedAt: "2026-09-08",
        summary: "Closed",
      },
    ],
  ),
  0,
);
const result = await searchOfficials({
  recordType: "school-research",
  state: "TX",
  county: "Harrison County",
  search: "Chance Ebarb",
});
assert.equal(
  result.total,
  1,
  "Unified state/county/name search should find the current Harleton appointment",
);
assert.equal(result.rows[0].profileHref, harletonMemberHref(appointed));
assert(result.rows[0].recordStatus.startsWith("Appointed"));
assert.equal(result.stats.totalProfiles, coverage.searchRecords);
console.log(
  JSON.stringify(
    {
      result: "passed",
      officialProfiles: coverage.officialProfiles,
      schoolResearchRows: school.rows.length,
      namedSchoolRecords: school.namedRecords,
      schoolDistricts: coverage.schoolDistricts,
      joinedIdentityLinks: school.linkedRecords,
      excludedVacancies: school.excludedVacancies,
      sourceSnapshotRecords: school.snapshotRecords,
      unknownState: coverage.stateUnknownProfiles,
    },
    null,
    2,
  ),
);
