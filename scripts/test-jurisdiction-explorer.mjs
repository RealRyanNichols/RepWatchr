import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import Module, { createRequire } from "node:module";
import ts from "typescript";

// Load the production TypeScript and its real footprint dependencies, using the
// same alias-aware loader as test-official-coverage.mjs. No network or DB needed.
const require = createRequire(import.meta.url);
const root = process.cwd();
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  return resolve.call(this, request.startsWith("@/") ? path.join(root, "src", request.slice(2)) : request, parent, ...rest);
};
Module._extensions[".ts"] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};

const { getJurisdictionRecord, getJurisdictionSummaries, jurisdictionHref, rosterSourceHref } = require("../src/lib/jurisdiction-explorer.ts");
const { FOOTPRINT_COUNTIES, FOOTPRINT_PLACES, COUNTY_OFFICE_SLATE, CITY_OFFICE_SLATE, officialsForPlace, isInFootprint } = require("../src/lib/district-footprint.ts");

function official(id, overrides = {}) {
  return {
    id, name: id, firstName: id, lastName: "Fixture", party: "NP",
    level: "city", position: "Mayor", jurisdiction: "City of Longview",
    county: ["Gregg"], termStart: "2020-01-01", termEnd: "2024-01-01",
    contactInfo: {}, reviewStatus: "needs_source_review", ...overrides,
  };
}
function group(record, key) {
  const found = record.officeGroups.find((office) => office.key === key);
  assert(found, `Missing office family ${key}`);
  return found;
}
function freeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

for (const [kind, slug] of [["state", "gregg-county"], ["county", "longview"], ["city", "gregg-county"], ["city", "missing"], ["County", "gregg-county"], ["county", "../gregg-county"]]) {
  assert.equal(getJurisdictionRecord(kind, slug, []), null, `Must reject invalid route ${kind}/${slug}`);
}

const emptyCounty = getJurisdictionRecord("county", "gregg-county", []);
assert.equal(emptyCounty.profileCount, 0);
assert.equal(emptyCounty.missingOfficeCount, COUNTY_OFFICE_SLATE.reduce((sum, office) => sum + office.expected, 0));
assert.equal(emptyCounty.missingOfficeFamilyCount, COUNTY_OFFICE_SLATE.length);
assert.equal(emptyCounty.sourceLinkedCount, 0);
assert.equal(emptyCounty.name, "Gregg County");
assert.deepEqual(emptyCounty.counties, ["Gregg"]);
assert.deepEqual(emptyCounty.districts, ["HD-7", "TX-01"]);
const emptyCity = getJurisdictionRecord("city", "longview", []);
assert.equal(emptyCity.expected, CITY_OFFICE_SLATE.reduce((sum, office) => sum + office.expected, 0));
assert.equal(group(emptyCity, "council").variable, true);
assert.equal(group(emptyCity, "mayor").variable, false);

const local = official("local", { sourceLinks: [{ title: "Roster", url: "https://example.gov/roster" }] });
const acrossCounty = official("across-county", { county: [" Harrison County "], position: "Councilmember, District 2" });
const fixtures = freeze([
  local, { ...local }, acrossCounty,
  official("foreign-state", { state: "WA" }),
  official("foreign-county", { county: ["Upshur"] }),
  official("school", { level: "school-board" }),
  official("unrelated", { jurisdiction: "Longview Independent School District" }),
  official("new-longview", { jurisdiction: "City of New Longview" }),
  official("manager", { position: "City Manager", sourceLinks: [{ title: "Invalid", url: "javascript:alert(1)" }] }),
]);
const before = JSON.stringify(fixtures);
const longview = getJurisdictionRecord("city", "longview", fixtures);
assert.deepEqual(longview.officials.map((item) => item.id), ["local", "across-county", "manager"]);
assert.equal(longview.profileCount, 3, "Duplicate IDs and unrelated places must not inflate coverage");
assert.equal(longview.sourceLinkedCount, 1);
assert.equal(longview.missingOfficeCount, 4);
assert.equal(longview.missingOfficeFamilyCount, 1);
assert.deepEqual(longview.counties, ["Gregg", "Harrison"]);
assert.deepEqual(longview.districts, ["HD-7", "TX-01"]);
assert.deepEqual(longview.unmatchedOfficials.map((item) => item.id), ["manager"]);
assert.equal(JSON.stringify(fixtures), before, "The model must not mutate caller data");
assert.equal(longview.officials[0].termEnd, "2024-01-01", "Loaded profiles remain records, never a new incumbency assertion");

const gladewater = getJurisdictionRecord("city", "gladewater", [official("upshur-part", { jurisdiction: "City of Gladewater", county: ["Upshur"] })]);
assert.equal(gladewater.profileCount, 1, "A documented cross-county part remains in the municipality");
assert.deepEqual(gladewater.counties, ["Gregg", "Upshur"]);
assert.deepEqual(gladewater.districts, ["HD-7", "TX-01"]);
const bullard = getJurisdictionRecord("city", "bullard", [official("cherokee-part", { jurisdiction: "Bullard, Texas", county: ["Cherokee"] })]);
assert.equal(bullard.profileCount, 1);
assert.deepEqual(bullard.counties, ["Smith", "Cherokee"]);
assert.deepEqual(bullard.districts, ["TX-01"]);

const atlanta = getJurisdictionRecord("city", "atlanta", [
  official("atlanta-texas", { jurisdiction: "City of Atlanta", county: ["Cass"] }),
  official("atlanta-georgia", { jurisdiction: "City of Atlanta, Georgia", county: ["Fulton"], state: "GA" }),
  official("atlanta-conflict", { jurisdiction: "City of Atlanta, Georgia", county: ["Cass"] }),
]);
assert.deepEqual(atlanta.officials.map((item) => item.id), ["atlanta-texas"]);
assert.equal(isInFootprint(official("foreign-gregg", { state: "OH" })), false, "A foreign state must not enter the footprint through a matching county name");
assert.equal(isInFootprint(local), true);
const london = { name: "London", slug: "london", county: "Rusk" };
assert.deepEqual(officialsForPlace(london, [
  official("new-london", { jurisdiction: "City of New London", county: ["Rusk"] }),
  official("london", { jurisdiction: "Town of London, TX", county: ["Rusk"] }),
]).map((item) => item.id), ["london"], "A municipality name is not a substring search");

const countyOfficials = [
  ...Array.from({ length: 20 }, (_, i) => official(`commissioner-${i}`, { level: "county", position: `Commissioner, Precinct ${i + 1}` })),
  official("judge", { level: "county", county: [" GREGG County "], position: "County Judge" }),
  official("tax", { level: "county", position: "Tax Assessor / Collector" }),
  official("deputy", { level: "county", position: "Deputy Sheriff" }),
  official("assistant", { level: "county", position: "Assistant District Attorney" }),
  official("city", { level: "city", position: "Sheriff" }),
  official("foreign", { level: "county", position: "Sheriff", state: "OH" }),
];
const county = getJurisdictionRecord("county", "gregg-county", countyOfficials);
assert.equal(county.profileCount, 24);
assert.equal(group(county, "commissioner").missing, 0);
assert.equal(group(county, "commissioner").officials.length, 20);
assert.equal(group(county, "sheriff").missing, 1, "Surplus commissioner profiles must not fill a sheriff gap");
assert.equal(group(county, "tax-assessor").officials[0].id, "tax");
assert.equal(county.missingOfficeCount, county.expected - 6);
assert.equal(county.missingOfficeFamilyCount, COUNTY_OFFICE_SLATE.length - 3);
assert.deepEqual(county.unmatchedOfficials.map((item) => item.id), ["deputy", "assistant"]);

const council = getJurisdictionRecord("city", "longview", [
  official("pro-tem", { position: "Mayor Pro Tem" }),
  official("alder", { position: "Alderwoman" }),
  official("council", { position: "Council Member" }),
  official("candidate", { position: "Candidate for Mayor" }),
]);
assert.equal(group(council, "mayor").officials.length, 0, "Mayor pro tem does not fill the mayor group");
assert.equal(group(council, "council").officials.length, 3);
assert.equal(group(council, "mayor").missing, 1);
assert.deepEqual(council.unmatchedOfficials.map((item) => item.id), ["candidate"]);

const sources = getJurisdictionRecord("city", "longview", [
  official("http", { sourceLinks: [{ title: "Source", url: "http://example.gov" }] }),
  official("broken", { sourceLinks: [{ title: "Source", url: "not a URL" }] }),
  official("relative", { sourceLinks: [{ title: "Source", url: "/about" }] }),
  official("mailto", { sourceLinks: [{ title: "Source", url: "mailto:office@example.gov" }] }),
  official("website-only", { contactInfo: { website: "https://example.gov" } }),
  official("empty", { sourceLinks: [] }),
]);
assert.equal(sources.sourceLinkedCount, 1, "Only public HTTP(S) source links count as attached research paths");

const summaries = getJurisdictionSummaries(fixtures);
assert.equal(summaries.length, FOOTPRINT_COUNTIES.length + FOOTPRINT_PLACES.length);
assert.equal(new Set(summaries.map((row) => row.href)).size, summaries.length);
assert(summaries.slice(0, FOOTPRINT_COUNTIES.length).every((row) => row.kind === "county"));
assert(summaries.slice(FOOTPRINT_COUNTIES.length).every((row) => row.kind === "city"));
for (const summary of summaries) {
  const detail = getJurisdictionRecord(summary.kind, summary.slug, fixtures);
  for (const key of Object.keys(summary)) assert.deepEqual(summary[key], detail[key], `Summary drifted at ${summary.href}: ${key}`);
  assert(!("officials" in summary), "Browser summaries must not carry all profile data");
}

assert.equal(jurisdictionHref("city", "longview"), "/home-district/roster/city/longview");
assert.equal(jurisdictionHref("city/../county", "a?b#c"), "/home-district/roster/city%2F..%2Fcounty/a%3Fb%23c");
const sourceHref = rosterSourceHref({ name: "A & B County", kind: "county", slug: "a-b-county" }, "Clerk / Recorder");
const sourceUrl = new URL(sourceHref, "https://repwatchr.com");
assert.equal(sourceUrl.pathname, "/submit-source");
assert.equal(sourceUrl.searchParams.get("target"), "A & B County: Clerk / Recorder");
assert.equal(sourceUrl.searchParams.get("jurisdiction"), "A & B County, Texas");
assert.equal(sourceUrl.searchParams.get("type"), "roster");
assert.equal(sourceUrl.searchParams.get("from"), "/home-district/roster/county/a-b-county");
assert.equal([...sourceUrl.searchParams].length, 4, "Labels must not inject extra query parameters");
assert.equal(new URL(rosterSourceHref(emptyCity), "https://repwatchr.com").searchParams.get("target"), "Longview");

console.log(`Jurisdiction explorer tests passed (${summaries.length} canonical jurisdictions; scoping, gaps, sources, and links).`);
