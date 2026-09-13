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
// Two tiers. A distinctive name is evidence on its own once a Texas signal is
// established, so ordinary wording like "Longview approves new budget" keeps its
// home-district slot. A common word or a bigger city elsewhere additionally has
// to be used as a place.
assert(
  districts.includes("HOME_DISTRICT_DISTINCT_PLACES") && districts.includes("HOME_DISTRICT_AMBIGUOUS_PLACES"),
  "Places must be split into distinctive and ambiguous tiers; one strict rule for all downgrades real coverage.",
);
for (const ambiguous of ["Center", "Atlanta", "Jefferson", "Marshall", "Tyler", "Henderson"]) {
  const block = districts.split("HOME_DISTRICT_AMBIGUOUS_PLACES")[1]?.split("];")[0] ?? "";
  assert(block.includes(`"${ambiguous}"`), `"${ambiguous}" is a common word or a bigger city elsewhere and must sit in the ambiguous tier.`);
}
for (const distinct of ["Longview", "Nacogdoches", "Kilgore", "Gladewater"]) {
  const block = districts.split("HOME_DISTRICT_DISTINCT_PLACES")[1]?.split("];")[0] ?? "";
  assert(block.includes(`"${distinct}"`), `"${distinct}" is distinctive and must not require locality syntax.`);
}
assert(
  districts.includes("localityPatternsFor") && districts.includes("HOME_PLACE_LOCALITY_PATTERNS"),
  "Ambiguous places must require positive locality syntax.",
);
assert(
  /AMBIGUOUS_PLACE_KEYS\.has\(place\)[\s\S]{0,200}HOME_PLACE_LOCALITY_PATTERNS\[index\]/.test(districts),
  "Locality patterns are declared but not applied to the ambiguous tier at the match site.",
);
assert(
  !districts.includes("structuredCities.has(place)"),
  "A structured city hint must not waive the locality test: those hints are substring matches.",
);

// Positive syntax alone is not enough: a civic word after an institutional
// compound would resurrect the false positive, so compounds are stripped first.
assert(
  districts.includes("PLACE_FALSE_POSITIVE_PHRASES") && districts.includes('"medical center"'),
  "Institutional compounds must still be stripped: 'Texas Medical Center police' reads as Center otherwise.",
);
assert(
  /const stripped = PLACE_FALSE_POSITIVE_PATTERNS\.reduce/.test(districts) &&
    /pattern\.test\(stripped\)/.test(districts),
  "Compound stripping is declared but the place match still runs against the raw text.",
);

// A search source stamps its own state on every clip it returns, so source
// metadata can never authenticate an out-of-state article as Texas. The hint is
// named for article evidence so that value has no natural way in.
assert(
  !/hints\.state/.test(districts),
  "The hints type must not carry a `state` field: it invites the source-stamped value.",
);
// Assert it is CONSUMED, not merely declared on the type: dropping the clause
// from structuredTexas would leave the field defined and this check passing.
assert(
  /const structuredTexas =[\s\S]{0,300}hints\.texasEvidenceFromArticle/.test(districts),
  "structuredTexas must consume texasEvidenceFromArticle, or a named Texas official stops counting.",
);
assert(
  !/input\.state/.test(quality.split("coverageTierForText(articleText")[1]?.slice(0, 600) ?? ""),
  "Quality engine must not pass source-level state into the home-district classifier.",
);
assert(
  /texasEvidenceFromArticle:[\s\S]{0,200}officialPeople\.some/.test(quality),
  "Texas established by an officeholder named in the article must reach the classifier.",
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
// The warning has to point AT the evidence. Inside the card's Link it opened the
// officeholder profile, where the boundary sources are not rendered at all.
assert(
  home.includes('district.boundaryStatus !== "verified"'),
  "Homepage must flag an unauthenticated district boundary.",
);
// Check the warning's OWN element, not "somewhere within 400 characters": the
// loose version passed because an unrelated nav link to /home-district sits
// nearby, so pointing the warning at /officials went undetected.
const warningAt = home.toLowerCase().indexOf("boundary needs authentication");
assert(warningAt !== -1, "Homepage lost its boundary-authentication warning text.");
const warningElementStart = home.lastIndexOf("<Link", warningAt);
assert(warningElementStart !== -1, "The boundary warning is not inside a link to its sources.");
const warningElement = home.slice(warningElementStart, warningAt);
assert(
  warningElement.includes('href="/home-district"'),
  "The boundary warning must link to /home-district, the page that renders its sources.",
);

// Anything a home-district lane queries for must also be an ingestion term, or
// the clip is fetched and then silently dropped by findTerms.
// Isolate the actual source object, not "everything after this lane's name":
// the loose version passed while the signal lived in some unrelated later lane.
function laneTermsArray(laneId) {
  const marker = `queryLane: "${laneId}"`;
  const at = sources.indexOf(marker);
  if (at === -1) return null;
  const termsAt = sources.indexOf("terms: [", at);
  if (termsAt === -1) return null;
  const close = sources.indexOf("]", termsAt);
  return close === -1 ? null : sources.slice(termsAt, close);
}

const govTerms = laneTermsArray("home-district-government");
assert(govTerms, "Could not locate the home-district-government terms array.");
for (const signal of ["mayor", "sheriff", "open records"]) {
  assert(
    govTerms.includes(`"${signal}"`),
    `Local-government lane queries ${signal} but cannot ingest it: findTerms will drop the clip.`,
  );
}

// findTerms accepts a clip when ANY term matches, so geography in `terms` lets a
// bare county name clear the topic gate with no government signal in the story.
// Geography belongs in the counties/cities fields, which feed jurisdiction
// matching instead.
assert(
  !sources.includes("homeDistrictPlaceTerms"),
  "Geography must not sit in a lane's `terms`: a county name alone would satisfy the topic gate.",
);
for (const laneId of ["hd7-state-seat", "tx01-federal-seat", "home-district-government"]) {
  const terms = laneTermsArray(laneId);
  assert(terms, `Could not locate the ${laneId} terms array.`);
  for (const geography of ["harrison county", "shelby county", "longview", "nacogdoches"]) {
    assert(
      !terms.toLowerCase().includes(`"${geography}"`),
      `Lane ${laneId} lists ${geography} as a topic term, which lets locality alone pass the topic gate.`,
    );
  }
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
