import { readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

/**
 * The public site has to read as the accountability desk for HD-7 and TX-01,
 * and it has to be findable by the phrases people in those counties type.
 *
 * Two failures this guards. First, the storefront creeping back onto the
 * masthead: priced service cards on the homepage and "Services" sitting in the
 * top nav next to Officials. Second, the ranking blockers: profile titles that
 * dropped the place, county and city pages that noindexed themselves, and an
 * org schema that told search engines this was a generic company.
 */

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const assert = (condition, message) => {
  if (!condition) {
    console.error(`District positioning smoke failed: ${message}`);
    process.exit(1);
  }
};

const homepage = read("src/app/page.tsx");
const header = read("src/components/layout/Header.tsx");
const footer = read("src/components/layout/Footer.tsx");
const structuredData = read("src/lib/structured-data.ts");
const officialPage = read("src/app/officials/[id]/page.tsx");
const officialSearch = read("src/lib/official-search.ts");
const titles = read("src/lib/official-titles.ts");

// --- It reads as a newsroom, not a storefront -------------------------------

assert(
  !homepage.includes("priceLabel"),
  "Price tags are back on the homepage. This is the front page of an accountability desk, not a pricing shelf.",
);
assert(
  !homepage.includes("getRepWatchrServices"),
  "The homepage is pulling the service catalogue again.",
);
assert(
  /const EDITORIAL_STANDARDS = \[/.test(homepage) && homepage.includes("EDITORIAL_STANDARDS.map("),
  "The homepage no longer renders the editorial standards band that replaced the services funnel.",
);
assert(
  homepage.includes("How this desk works"),
  "The homepage dropped the standards heading, so nothing tells a reader what the record is held to.",
);

const primaryNav = header.slice(header.indexOf("const primaryLinks"), header.indexOf("const moreLinks"));
assert(
  !primaryNav.includes('"/services"'),
  "Services is back in the top navigation, next to Officials and Votes.",
);
assert(
  !primaryNav.includes("/elections/texas/contribute"),
  "The packet funnel is back in the top navigation.",
);
assert(
  primaryNav.includes('href: "/news"'),
  "Stories dropped out of the top navigation, so the beat is not reachable from the masthead.",
);
assert(
  header.includes('label: "Research Services"'),
  "Research services should stay reachable one level down, not disappear.",
);

assert(
  footer.includes("const coverageLinks") && footer.includes("const researchLinks"),
  "The footer merged research and data back into the coverage links.",
);
assert(
  !footer.includes("A product of RealRyanNichols"),
  'The footer calls the site "a product of" again. A desk is published, not shipped.',
);

// --- It can be found by the phrases this beat is made of --------------------

assert(
  structuredData.includes('"@type": "NewsMediaOrganization"'),
  "The site is declaring itself a generic Organization again, which is what a vendor emits, not an outlet.",
);
for (const field of ["publishingPrinciples", "areaServed", "knowsAbout"]) {
  assert(
    structuredData.includes(`${field}:`),
    `Organization schema dropped ${field}, which is what search engines read to decide who is a local authority.`,
  );
}
assert(
  structuredData.includes("HOME_DISTRICT_COUNTIES.map"),
  "areaServed is no longer derived from the home-district counties, so it will drift from the beat.",
);

assert(
  officialPage.includes("officialProfileTitle"),
  "Official profile titles no longer use the office-and-place builder, so they drop the county and city again.",
);
assert(
  !officialPage.includes('dynamic = "force-dynamic"'),
  "officials/[id] is force-dynamic again: 8,914 profiles rendering cold on every request, with none prebuilt.",
);
assert(
  officialPage.includes("isInFootprint(official)"),
  "officials/[id] stopped prebuilding the HD-7 / TX-01 footprint.",
);

const indexable = officialSearch.slice(
  officialSearch.indexOf("export function isOfficialSearchIndexable"),
  officialSearch.indexOf("export function officialSearchCanonicalPath"),
);
assert(
  !/\n\s*params\.county \|\|\n\s*params\.city \|\|/.test(indexable),
  "A lone county or city facet is noindexed again, and /coverage links straight into those pages.",
);
assert(
  indexable.includes("if (params.county && params.city) return false;"),
  "Crossed county-and-city filters are indexable, which multiplies near-duplicate URLs.",
);

assert(
  /const INSTITUTION_JURISDICTION\s*=/.test(titles) && /house of representatives/i.test(titles),
  "Title building lost the chamber rule, so legislators read 'Texas House of Representatives State Representative'.",
);
assert(
  /const DISTRICT_CODE\s*=/.test(titles),
  "Title building lost the district-code rule, so Jay Dean stops reading as HD-7.",
);

// --- Findings from the Codex review of #27, each with its own guard --------

// The homepage must not state the 13-county footprint as an established
// boundary while TX-01 is still needs_authentication.
assert(
  !/Thirteen counties and every city, school board, and county seat inside them/.test(homepage),
  "The homepage states the 13-county footprint as an established boundary, but TX-01 is still needs_authentication.",
);
assert(
  /unauthenticated|needs authentication|working footprint/i.test(homepage),
  "The homepage coverage card no longer carries the TX-01 boundary status, so it publishes an unauthenticated boundary as fact.",
);

// AGENTS.md forbids hard-coding district and county lists in ranking logic.
const layout = read("src/app/layout.tsx");
assert(
  layout.includes("HOME_DISTRICT_BEAT_TERMS"),
  "Metadata keywords hard-code the beat again instead of deriving it from the home-district module.",
);
for (const hardCoded of ['"Gregg County"', '"Harrison County"', '"Marion County"', '"TX-01"']) {
  assert(
    !layout.includes(hardCoded),
    `Metadata keywords hard-code ${hardCoded}; a beat change in home-districts.ts will not reach this ranking surface.`,
  );
}
assert(
  structuredData.includes("HOME_DISTRICT_BEAT_TERMS"),
  "Organization knowsAbout hard-codes the beat instead of deriving it.",
);

// One organization identity per URL. The homepage used to hand-write its own
// top-level Organization block alongside the NewsMediaOrganization the layout
// emits, so the site declared itself twice with conflicting types.
const homepageTopLevelOrgs = [...homepage.matchAll(/"@context": "https:\/\/schema\.org",\s*\n\s*"@type": "Organization"/g)];
assert(
  homepageTopLevelOrgs.length === 0,
  "The homepage emits its own top-level Organization block again, competing with the NewsMediaOrganization the layout already declares for the same URL.",
);

// An indexable place facet needs metadata naming the place, or it is a
// near-duplicate of the plain state page.
const officialsIndex = read("src/app/officials/page.tsx");
assert(
  officialsIndex.includes("params.county") && /const place =/.test(officialsIndex),
  "The officials directory no longer names the selected county or city in its metadata, so indexable place facets duplicate the state page.",
);

// An unknown place facet must never be indexable.
assert(
  officialSearch.includes("isKnownPlaceFacet"),
  "Unknown county and city facets are indexable again, so an arbitrary ?city= mints an indexable empty page.",
);
assert(
  indexable.includes("if (!isKnownPlaceFacet(params)) return false;"),
  "isOfficialSearchIndexable stopped checking the place facet against places actually carried.",
);

// Both lockfiles have to carry the runner. Vercel installs with pnpm and a
// frozen lockfile, so a stale pnpm-lock.yaml fails the production deploy.
const pnpmLock = read("pnpm-lock.yaml");
const rootImporter = pnpmLock.slice(
  pnpmLock.indexOf("importers:"),
  pnpmLock.indexOf("\npackages:") === -1 ? undefined : pnpmLock.indexOf("\npackages:"),
);
const declaredTsx = (JSON.parse(read("package.json")).devDependencies?.tsx ?? "").trim();
assert(
  new RegExp(`\\n\\s+tsx:\\n\\s+specifier: ${declaredTsx.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n`).test(rootImporter),
  `pnpm-lock.yaml's root importer does not declare tsx at ${declaredTsx}. Vercel installs with --frozen-lockfile and the production deploy fails with ERR_PNPM_OUTDATED_LOCKFILE. A tsx package snapshot elsewhere in the lockfile does not satisfy it.`,
);

// The homepage names its verified counties from the module, not by hand.
assert(
  homepage.includes("TX_HOUSE_DISTRICT_7.counties"),
  "The homepage no longer reads HD-7's counties from the HD-7 district entry, so it either hard-codes them or absorbs TX-01's the day that boundary is authenticated.",
);
assert(
  !homepage.includes("HOME_DISTRICT_VERIFIED_COUNTIES"),
  "The homepage HD-7 sentence is back to the union of all verified districts, which will publish TX-01's counties as HD-7's once TX-01 is authenticated.",
);
for (const hardCoded of ["Gregg, Harrison and Marion, confirmed"]) {
  assert(
    !homepage.includes(hardCoded),
    `The homepage hard-codes "${hardCoded}" instead of deriving it.`,
  );
}

// One place, one canonical URL, scoped to its state, including the places only
// the school-research index carries.
assert(
  officialSearch.includes("byStateAndPlace"),
  "Place facets are no longer scoped to their state, so ?state=CA&county=Gregg is an indexable empty page.",
);
const facetBuilder = officialSearch.slice(
  officialSearch.indexOf("const getKnownPlaceFacets = cache("),
  officialSearch.indexOf("function lookupPlaceFacet"),
);
assert(
  facetBuilder.includes("getSchoolBoardSearchIndex().rows"),
  "The place-facet builder is back to official rows alone, so counties only the school-research index carries are wrongly noindexed.",
);
assert(
  facetBuilder.includes("row.official.level"),
  "The place-facet builder stopped recording levels, so an empty place-and-level combination becomes indexable.",
);
assert(
  /place\.levels\.has\(params\.level\)/.test(officialSearch),
  "A place facet is indexable at any level again, so ?county=Dallas&level=federal is an indexable empty page.",
);
assert(
  /canonicalPlaceFacet\("county", params\.county, params\.state\)/.test(officialSearch),
  "The canonical path no longer uses the stored spelling, so ?county=gregg and ?county=Gregg become two canonical URLs for one place.",
);

// The probe runner has to be a declared dependency.
const pkg = JSON.parse(read("package.json"));
assert(
  Boolean(pkg.devDependencies?.tsx || pkg.dependencies?.tsx),
  "The smoke probe shells out to tsx, which is not declared in package.json; a clean install without registry access fails before any assertion runs.",
);

// --- The titles themselves, checked against the real records ---------------

let probeResult;
try {
  const output = execFileSync(
    "npx",
    ["tsx", "--tsconfig", "tsconfig.json", "scripts/official-title-probe.mts"],
    { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  probeResult = JSON.parse(output.trim().split("\n").pop());
} catch (error) {
  assert(false, `Could not evaluate real profile titles: ${error.message}`);
}

assert(probeResult.scanned > 8000, `Only ${probeResult.scanned} official records were checked.`);
assert(
  probeResult.awkward === 0,
  `${probeResult.awkward} profile titles read as an institution rather than a place, e.g. ${probeResult.awkwardSamples
    .map((sample) => `"${sample}"`)
    .join(", ")}`,
);
assert(
  probeResult.mismatched.length === 0,
  `Profile titles changed shape: ${probeResult.mismatched
    .map((row) => `${row.id} is "${row.actual}", should be "${row.expected}"`)
    .join("; ")}`,
);

console.log(
  `District positioning smoke passed: ${probeResult.scanned} profile titles carry their office and place, the masthead is editorial, and the site declares itself a NewsMediaOrganization covering ${
    (structuredData.match(/HOME_DISTRICT_COUNTIES/g) || []).length > 0 ? "the HD-7 / TX-01 counties" : "its beat"
  }.`,
);
