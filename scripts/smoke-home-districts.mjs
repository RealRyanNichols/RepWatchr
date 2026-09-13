import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const assert = (condition, message) => {
  if (!condition) {
    console.error(`Home district smoke failed: ${message}`);
    process.exit(1);
  }
};

const districts = read("src/lib/home-districts.ts");
const sources = read("src/data/daily-news-watch-sources.ts");
const quality = read("src/lib/daily-wire-quality.ts");
const home = read("src/app/page.tsx");
const beatPage = read("src/app/home-district/page.tsx");
const header = read("src/components/layout/Header.tsx");
const seoInventory = read("src/lib/seo-inventory.ts");
const agents = read("AGENTS.md");

// The beat itself: two districts, two officeholders, one source of truth.
assert(districts.includes('code: "HD-7"'), "HD-7 is not defined in the home-district module.");
assert(districts.includes('code: "TX-01"'), "TX-01 is not defined in the home-district module.");
assert(districts.includes('incumbentOfficialId: "jay-dean"'), "HD-7 is not bound to its officeholder profile.");
assert(districts.includes('incumbentOfficialId: "nathaniel-moran"'), "TX-01 is not bound to its officeholder profile.");

for (const county of ["Gregg", "Harrison", "Marion"]) {
  assert(districts.includes(`name: "${county}"`), `HD-7 county ${county} is missing.`);
}
for (const county of ["Smith", "Rusk", "Panola", "Cass", "Cherokee", "Nacogdoches", "Shelby", "Sabine", "San Augustine", "Bowie"]) {
  assert(districts.includes(`name: "${county}"`), `TX-01 county ${county} is missing.`);
}

// Boundary provenance has to stay honest: TX-01 rides a 2025 map still in
// litigation, so its county list must not be published as a settled finding.
assert(
  districts.includes('boundaryStatus: "needs_authentication"'),
  "TX-01 boundaries must stay flagged for authentication until the primary map report is cited.",
);
assert(districts.includes("PlanC2333"), "The operative congressional plan is not named in the boundary note.");

// Coverage order: home district, then East Texas, then Texas, then Washington.
assert(
  districts.includes('["home-district", "east-texas", "texas", "national", "outside"]'),
  "Coverage tier order changed; HD-7 and TX-01 must rank first.",
);

// A county or town name alone is not a Texas match. Harrison County exists in
// six other states, and Jefferson County, Texas is not in either district.
assert(districts.includes("hasTexasSignal"), "Text classification lost its Texas-signal guard.");
assert(districts.includes("namesForeignCounty"), "Text classification lost its foreign-county guard.");

// The wire has to actively watch the beat, not hope a statewide lane catches it.
for (const lane of ["hd7-state-seat", "tx01-federal-seat", "home-district-government"]) {
  assert(sources.includes(`"${lane}"`), `Daily wire is missing the ${lane} query lane.`);
}
assert(
  sources.includes("HOME_DISTRICT_DAILY_NEWS_WATCH_SOURCES"),
  "Home-district wire sources are not registered.",
);
assert(
  sources.includes("...HOME_DISTRICT_DAILY_NEWS_WATCH_SOURCES"),
  "Home-district wire sources are defined but never added to DAILY_NEWS_WATCH_SOURCES.",
);

// The quality engine has to rank the beat above a generic local match.
assert(quality.includes('"home-district"'), "Quality engine has no home-district jurisdiction tier.");
assert(
  quality.includes('if (jurisdictionMatch === "home-district") score += 26;'),
  "Home-district items no longer outscore generic local items.",
);
assert(quality.includes("coverageTierForText"), "Quality engine does not classify against the home districts.");

// The homepage has to reserve slots, not sort by recency.
assert(home.includes("HOME_WIRE_HOME_DISTRICT_SLOTS"), "Homepage reserves no wire slots for the home districts.");
assert(
  home.includes('wireByJurisdiction("home-district")'),
  "Homepage wire does not pull the home-district lane first.",
);
assert(home.includes("isHomeDistrictSeat"), "Homepage featured officials do not lead with the home seats.");

// The policy has to be stated in public, linked, and indexed.
assert(beatPage.includes("HD-7 for the state. TX-01 for the federal."), "Beat page lost its coverage statement.");
assert(header.includes('href: "/home-district"'), "The beat page is not linked from the primary nav.");
assert(seoInventory.includes('path: "/home-district"'), "The beat page is not in the SEO inventory.");
assert(agents.includes("## Coverage Beat"), "AGENTS.md does not record the coverage beat.");

// The buildout footprint: which jurisdictions are in scope and what seats they carry.
const footprint = read("src/lib/district-footprint.ts");
const rosterPage = read("src/app/home-district/roster/page.tsx");
const search = read("src/lib/official-search.ts");
const flags = read("src/lib/repwatchr-feature-flags.ts");

for (const county of [
  "Bowie", "Cass", "Cherokee", "Gregg", "Harrison", "Marion", "Nacogdoches",
  "Panola", "Rusk", "Sabine", "San Augustine", "Shelby", "Smith",
]) {
  assert(footprint.includes(`name: "${county}"`), `Footprint is missing ${county} County.`);
}

// The office slate is what turns an empty jurisdiction into a documented gap
// instead of silence. Losing it would make thin coverage look complete.
for (const office of [
  "County Judge", "County Commissioner", "Sheriff", "District Clerk", "County Clerk",
  "Tax Assessor-Collector", "County Treasurer", "Justice of the Peace", "Constable",
]) {
  assert(footprint.includes(`"${office}"`), `County office slate is missing ${office}.`);
}
assert(footprint.includes('"Mayor"') && footprint.includes('"City Council Member"'), "City office slate is incomplete.");

// The place list is a working set, not a certified census of incorporated places.
assert(
  footprint.includes('status: "needs_authentication"'),
  "The footprint place list must stay flagged as an incomplete working set.",
);

assert(rosterPage.includes("seatLedgerFor"), "Roster page does not compute the seat ledger.");
assert(rosterPage.includes("NOT STARTED"), "Roster page no longer flags jurisdictions with zero seats on file.");

// A documented gap must never read as finished work. Percent is gated on office
// families, not raw headcount: the variable offices are floors, so a county with
// nine commissioners and no sheriff can reach the expected total while most of
// its slate is empty. Without this gate the badge reads SLATE FILLED on a row
// that names nine missing offices right beside it.
assert(
  footprint.includes("missingLabels.length === 0 ? 100 : Math.min(99"),
  "Seat percent must cap below 100 whenever an office family is still missing.",
);
assert(
  !/percent:\s*Math\.min\(100, Math\.round\(\(covered \/ expected\)/.test(footprint),
  "Seat percent regressed to raw headcount, which lets an incomplete slate read as filled.",
);

// District focus: default the directory to the footprint, reversibly, and never
// make an out-of-district record unreachable.
assert(flags.includes("districtFocusOnly"), "The district-focus flag is missing.");
assert(
  flags.includes('process.env.NEXT_PUBLIC_DISTRICT_FOCUS_ONLY !== "false"'),
  "District focus must default on and stay switchable off.",
);
assert(search.includes("passesDistrictFocus"), "Officials search does not apply district focus.");
assert(
  search.includes("userNarrowedTheQuery"),
  "District focus must let a name search or an explicit filter reach out-of-district records.",
);

console.log("Home district (HD-7 / TX-01) smoke check passed.");
