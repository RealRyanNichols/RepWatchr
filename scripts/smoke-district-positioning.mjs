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
