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
// TX-01's county list is pending authentication and expected to change, so it
// is checked for shape, not for specific names - see the derived check below.
assert(
  (districts.match(/\{\s*name:\s*"[^"]+",\s*inclusion:/g) ?? []).length >= 13,
  "TX-01's county list looks truncated.",
);

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

// Every state numbers its own districts, and this site carries a feed for all
// fifty. A bare "1st congressional district" or "HD-7" must not claim a
// reserved home-district slot without a Texas signal.
assert(
  districts.includes("HOME_DISTRICT_AMBIGUOUS_TERMS"),
  "Generic district labels must be separated from the Texas-qualified ones.",
);
for (const generic of ["house district 7", "hd-7", "congressional district 1", "1st congressional district"]) {
  const ambiguousBlock = districts.split("HOME_DISTRICT_AMBIGUOUS_TERMS")[1]?.split("];")[0] ?? "";
  assert(ambiguousBlock.includes(`"${generic}"`), `"${generic}" must require a Texas signal.`);
}
for (const qualified of ["texas house district 7", "tx-01", "jay dean", "nathaniel moran"]) {
  const unambiguousBlock = districts.split("HOME_DISTRICT_UNAMBIGUOUS_TERMS")[1]?.split("];")[0] ?? "";
  assert(unambiguousBlock.includes(`"${qualified}"`), `"${qualified}" should identify the seat on its own.`);
}

// Center is the Shelby County seat and also a word in half the buildings in
// Texas. It belongs in the index, behind a stock-phrase guard.
assert(districts.includes('"Center"'), "Center, the Shelby County seat, is missing from the place index.");
assert(districts.includes('"data center"'), "Stock-phrase list lost its entries.");
// Assert the guard is actually applied at the match site, not merely declared:
// an unused constant would satisfy a name check while the bug came back.
assert(
  districts.includes("withoutStockPhrases") &&
    /HOME_PLACE_PATTERNS\[index\]\.test\(withoutStockPhrases\)/.test(districts),
  "Place matching must test against the stock-phrase-stripped text, so 'data center' never reads as Center, Texas.",
);

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

// A fixed ticker cap below the sum of the reserved slots silently discards the
// last lane's quota, which is how Washington's second slot was being dropped.
assert(
  home.includes("HOME_WIRE_RESERVED_SLOTS"),
  "Ticker capacity must be derived from the reserved slots, not hard-coded.",
);
assert(
  !/slice\(0, 10\)/.test(home),
  "Ticker slice regressed to a hard-coded cap that can drop a reserved lane slot.",
);

// TX-01's boundary is not authenticated, so the homepage must not state its
// geography as settled fact without showing that status.
assert(
  home.includes('district.boundaryStatus !== "verified"'),
  "Homepage must flag an unauthenticated district boundary beside its summary.",
);

// Anything a home-district lane queries for must also be an ingestion term, or
// the clip is fetched and then silently dropped by findTerms.
assert(
  sources.includes("homeDistrictPlaceTerms"),
  "Home-district lanes must carry county and place names as ingestion terms.",
);
for (const signal of ["mayor", "sheriff", "open records"]) {
  const govBlock = sources.split('"home-district-government"')[2] ?? sources;
  assert(govBlock.includes(`"${signal}"`), `Local-government lane queries ${signal} but cannot ingest it.`);
}

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

// County names live only in the canonical beat. Re-listing them here would
// reinstate the second boundary list this module exists to remove: an
// authenticated correction to TX-01 would fail a test that is itself wrong, and
// a newly added county would never get its metadata checked. So derive the
// expectation from home-districts.ts instead of hard-coding it.
const canonicalCounties = [...districts.matchAll(/\{\s*name:\s*"([^"]+)",\s*inclusion:/g)].map((m) => m[1]);
assert(
  canonicalCounties.length >= 13,
  `Expected the canonical beat to list at least 13 counties, found ${canonicalCounties.length}.`,
);
for (const county of new Set(canonicalCounties)) {
  const key = county.includes(" ") ? `"${county}"` : county;
  assert(
    new RegExp(`${key}:\\s*\\{\\s*slug:`).test(footprint),
    `Footprint has no slug/seat metadata for ${county} County. Add it to COUNTY_METADATA.`,
  );
}

// HD-7's three counties come from a primary record and are stable, so asserting
// them by name is a real content check rather than a duplicated boundary.
for (const county of ["Gregg", "Harrison", "Marion"]) {
  assert(canonicalCounties.includes(county), `HD-7 county ${county} is missing from the canonical beat.`);
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

// The officials dataset is nationwide and East Texas shares town names with far
// bigger places. A bare substring match counted Atlanta's, Jacksonville's,
// Henderson's and Jefferson's out-of-state mayors as footprint coverage and
// inflated the published ledger.
assert(
  footprint.includes("officialsForPlace") && footprint.includes("officialsForCounty"),
  "Footprint must expose scoped seat matchers instead of substring search.",
);
assert(
  /\(official\.state \?\? "TX"\)\.toUpperCase\(\) !== "TX"/.test(footprint) ||
    /\(official\.state \?\? "TX"\)\.toUpperCase\(\) === "TX"/.test(footprint),
  "Seat matching must reject an explicitly non-Texas record.",
);
assert(
  footprint.includes("placeCounties.has(normalizedCounty(county))"),
  "City seat matching must require one of the place's own counties.",
);
assert(
  !/jurisdiction \?\? ""\)\.toLowerCase\(\)\.includes\(place\.name/.test(rosterPage),
  "Roster regressed to unscoped substring matching on jurisdiction.",
);

// The footprint must not keep its own copy of the county list: a second copy
// silently keeps the old boundary when TX-01's pending list is authenticated.
assert(
  footprint.includes("for (const district of HOME_DISTRICTS)"),
  "Footprint counties must be built from HOME_DISTRICTS.",
);
// The invariant that matters is the assignment: FOOTPRINT_COUNTIES has to come
// from a call, never an array literal. A literal is the regression - it keeps
// the old boundary when TX-01's pending list is authenticated or corrected.
assert(
  /export const FOOTPRINT_COUNTIES: FootprintCounty\[\] = [A-Za-z_$][\w$]*\(\);/.test(footprint),
  "FOOTPRINT_COUNTIES must be assigned from a derivation, not a hard-coded array.",
);

// District labels are only as settled as the map they come from, so TX-01's
// pending status has to travel with them onto the ledger.
assert(
  footprint.includes("FOOTPRINT_BOUNDARY_PROVENANCE"),
  "Footprint must carry TX-01's boundary provenance.",
);
assert(
  rosterPage.includes("FOOTPRINT_BOUNDARY_PROVENANCE.status !== \"verified\""),
  "Ledger must show that its TX-01 labels are not an authenticated boundary.",
);

// The slate drives every expected total and every reported gap, so it cites the
// provisions that make those offices elective.
assert(
  footprint.includes("OFFICE_SLATE_SOURCES") && footprint.includes("statutes.capitol.texas.gov"),
  "Office slate must carry primary sources.",
);
assert(
  rosterPage.includes("OFFICE_SLATE_SOURCES"),
  "Ledger must publish the sources behind its expected slate.",
);
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
