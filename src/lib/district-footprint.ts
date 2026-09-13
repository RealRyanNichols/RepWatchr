import type { Official } from "@/types";
import {
  HOME_DISTRICTS,
  TX_CONGRESSIONAL_DISTRICT_1,
  TX_HOUSE_DISTRICT_7,
  coverageTierForOfficial,
} from "@/lib/home-districts";

/**
 * The buildout footprint.
 *
 * HD-7 and TX-01 are the beat. This module answers the next question: inside
 * that beat, what is the complete set of jurisdictions, and what elected seats
 * should each one have? That target is what turns "we have some profiles" into
 * a ledger showing exactly what is covered and what is still missing.
 *
 * Nothing here asserts who holds a seat. It asserts which seats exist, so an
 * empty one reads as a documented gap instead of silence.
 */

export type JurisdictionKind = "county" | "city";

export type FootprintPlace = {
  /** Directory slug under src/data/officials/city. */
  slug: string;
  name: string;
  county: string;
  /** Set when the place straddles a county line. */
  alsoInCounties?: string[];
};

export type FootprintCounty = {
  /** Directory slug under src/data/officials/county. */
  slug: string;
  name: string;
  /** Which home districts this county sits in. */
  districts: ("HD-7" | "TX-01")[];
  inclusion: "whole" | "partial";
  seat: string;
};

/**
 * County metadata that belongs to the footprint rather than to the districts:
 * the data directory slug and the county seat. Everything about WHICH counties
 * are in scope, and which district each sits in, is derived from HOME_DISTRICTS
 * below - never copied. A hard-coded second copy would silently keep the old
 * boundary when TX-01's pending PlanC2333 list is authenticated or corrected.
 */
function normalizedCounty(value?: string | null) {
  return (value ?? "").trim().toLowerCase().replace(/\s+county$/, "");
}

const COUNTY_METADATA: Record<string, { slug: string; seat: string }> = {
  Bowie: { slug: "bowie-county", seat: "Boston" },
  Cass: { slug: "cass-county", seat: "Linden" },
  Cherokee: { slug: "cherokee-county", seat: "Rusk" },
  Gregg: { slug: "gregg-county", seat: "Longview" },
  Harrison: { slug: "harrison-county", seat: "Marshall" },
  Marion: { slug: "marion-county", seat: "Jefferson" },
  Nacogdoches: { slug: "nacogdoches-county", seat: "Nacogdoches" },
  Panola: { slug: "panola-county", seat: "Carthage" },
  Rusk: { slug: "rusk-county", seat: "Henderson" },
  Sabine: { slug: "sabine-county", seat: "Hemphill" },
  "San Augustine": { slug: "san-augustine-county", seat: "San Augustine" },
  Shelby: { slug: "shelby-county", seat: "Center" },
  Smith: { slug: "smith-county", seat: "Tyler" },
};

function deriveFootprintCounties(): FootprintCounty[] {
  const byName = new Map<string, FootprintCounty>();

  for (const district of HOME_DISTRICTS) {
    const code = district.code as "HD-7" | "TX-01";
    for (const county of district.counties) {
      const existing = byName.get(county.name);
      if (existing) {
        if (!existing.districts.includes(code)) existing.districts.push(code);
        // Any district that only takes part of a county makes it partial here.
        if (county.inclusion === "partial") existing.inclusion = "partial";
        continue;
      }
      const meta = COUNTY_METADATA[county.name];
      byName.set(county.name, {
        slug: meta?.slug ?? `${county.name.toLowerCase().replace(/\s+/g, "-")}-county`,
        name: county.name,
        districts: [code],
        inclusion: county.inclusion,
        seat: meta?.seat ?? "",
      });
    }
  }

  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Counties in the footprint, derived from the canonical beat. */
export const FOOTPRINT_COUNTIES: FootprintCounty[] = deriveFootprintCounties();

/**
 * The footprint inherits TX-01's boundary provenance. The district labels in
 * the ledger are only as settled as the map they come from, so the pending
 * PlanC2333 status has to travel with them instead of stopping at
 * /home-district.
 */
export const FOOTPRINT_BOUNDARY_PROVENANCE = {
  status: TX_CONGRESSIONAL_DISTRICT_1.boundaryStatus,
  note: TX_CONGRESSIONAL_DISTRICT_1.boundaryNote,
  reviewedAt: TX_CONGRESSIONAL_DISTRICT_1.boundaryReviewedAt,
  sources: TX_CONGRESSIONAL_DISTRICT_1.sources.filter((source) => source.supports.includes("boundaries")),
};

/**
 * Cities and towns inside the footprint that RepWatchr already tracks or has
 * confirmed by county. This is the working list, not a certified census of
 * incorporated places - see FOOTPRINT_PLACE_PROVENANCE below.
 */
export const FOOTPRINT_PLACES: FootprintPlace[] = [
  { slug: "atlanta", name: "Atlanta", county: "Cass" },
  { slug: "bullard", name: "Bullard", county: "Smith", alsoInCounties: ["Cherokee"] },
  { slug: "carthage", name: "Carthage", county: "Panola" },
  { slug: "center", name: "Center", county: "Shelby" },
  { slug: "gladewater", name: "Gladewater", county: "Gregg", alsoInCounties: ["Upshur"] },
  { slug: "hallsville", name: "Hallsville", county: "Harrison" },
  { slug: "hemphill", name: "Hemphill", county: "Sabine" },
  { slug: "henderson", name: "Henderson", county: "Rusk" },
  { slug: "jacksonville", name: "Jacksonville", county: "Cherokee" },
  { slug: "jefferson", name: "Jefferson", county: "Marion" },
  { slug: "kilgore", name: "Kilgore", county: "Gregg", alsoInCounties: ["Rusk"] },
  { slug: "lindale", name: "Lindale", county: "Smith" },
  { slug: "linden", name: "Linden", county: "Cass" },
  { slug: "longview", name: "Longview", county: "Gregg", alsoInCounties: ["Harrison"] },
  { slug: "marshall", name: "Marshall", county: "Harrison" },
  { slug: "nacogdoches", name: "Nacogdoches", county: "Nacogdoches" },
  { slug: "rusk", name: "Rusk", county: "Cherokee" },
  { slug: "san-augustine", name: "San Augustine", county: "San Augustine" },
  { slug: "troup", name: "Troup", county: "Smith", alsoInCounties: ["Cherokee"] },
  { slug: "tyler", name: "Tyler", county: "Smith" },
  { slug: "white-oak", name: "White Oak", county: "Gregg" },
  { slug: "whitehouse", name: "Whitehouse", county: "Smith" },
];

/**
 * The place list is the working buildout target, not a finished finding. Every
 * incorporated city and town in the footprint belongs on this site; this list
 * is what RepWatchr has confirmed so far, and it is deliberately visible as
 * incomplete rather than presented as the full census.
 */
export const FOOTPRINT_PLACE_PROVENANCE = {
  status: "needs_authentication" as const,
  note: "Counties are fixed by the district boundaries. The city and town list is the working set RepWatchr has confirmed by county; it is not yet reconciled against the certified roster of incorporated places. Municipalities missing from this list are gaps to fill, not places ruled out of the footprint.",
  reconcileAgainst: [
    {
      label: "Texas Secretary of State: local government and elections",
      url: "https://www.sos.state.tx.us/elections/index.shtml",
    },
    {
      label: "U.S. Census Bureau: Texas incorporated places by county",
      url: "https://www.census.gov/programs-surveys/geography.html",
    },
  ],
  reviewedAt: "2026-09-13",
};

/**
 * Elected seats a Texas county government carries. The county judge,
 * commissioners, sheriff, clerks, tax assessor-collector, treasurer,
 * attorneys, justices of the peace, and constables are elective county offices
 * under the Texas Constitution and Local Government Code. Counties vary in how
 * many precinct seats they seat and whether they elect a county attorney, a
 * district attorney, or both, so precinct counts are expressed as a range.
 */
/**
 * Where the expected slates come from. The ledger's totals and every reported
 * gap rest on these assertions, so they carry their own citations rather than
 * asking a reader to take the counts on faith.
 */
export const OFFICE_SLATE_SOURCES = [
  {
    label: "Texas Constitution, Article V: county judge, commissioners, sheriff, clerks, justices of the peace and constables",
    url: "https://statutes.capitol.texas.gov/Docs/CN/htm/CN.5.htm",
    supports: ["county-judge", "commissioner", "sheriff", "district-clerk", "county-clerk", "justice-of-the-peace", "constable"],
  },
  {
    label: "Texas Constitution, Article XVI: county treasurer, tax assessor-collector and county attorney",
    url: "https://statutes.capitol.texas.gov/Docs/CN/htm/CN.16.htm",
    supports: ["treasurer", "tax-assessor", "prosecutor"],
  },
  {
    label: "Texas Local Government Code: municipal officers in general-law and home-rule cities",
    url: "https://statutes.capitol.texas.gov/Docs/LG/htm/LG.22.htm",
    supports: ["mayor", "council"],
  },
] as const;

/**
 * Review status for the slates themselves. The offices are established by the
 * cited constitutional and statutory provisions; the per-jurisdiction COUNT of
 * variable offices is not, because precinct counts and council sizes are set
 * locally. Those are marked variable and read as floors.
 */
export const OFFICE_SLATE_PROVENANCE = {
  status: "sourced_with_variable_counts" as const,
  note: "The offices below are elective under the cited Texas constitutional and statutory provisions. The fixed counts are the standard slate. Counts marked variable are floors, not findings: precinct courts and council sizes are set locally and have to be confirmed per jurisdiction before a number is published as that jurisdiction's requirement.",
  reviewedAt: "2026-09-13",
};

export const COUNTY_OFFICE_SLATE = [
  { key: "county-judge", label: "County Judge", expected: 1 },
  { key: "commissioner", label: "County Commissioner", expected: 4 },
  { key: "sheriff", label: "Sheriff", expected: 1 },
  { key: "district-clerk", label: "District Clerk", expected: 1 },
  { key: "county-clerk", label: "County Clerk", expected: 1 },
  { key: "tax-assessor", label: "Tax Assessor-Collector", expected: 1 },
  { key: "treasurer", label: "County Treasurer", expected: 1 },
  { key: "prosecutor", label: "County or District Attorney", expected: 1 },
  { key: "justice-of-the-peace", label: "Justice of the Peace", expected: 1, variable: true },
  { key: "constable", label: "Constable", expected: 1, variable: true },
] as const;

/**
 * Elected seats a Texas municipality carries. General-law and home-rule cities
 * differ in council size and whether places are numbered or districted, so the
 * council count is a floor, not a fixed number.
 */
export const CITY_OFFICE_SLATE = [
  { key: "mayor", label: "Mayor", expected: 1 },
  { key: "council", label: "City Council Member", expected: 5, variable: true },
] as const;

export const FOOTPRINT_COUNTY_NAMES: string[] = FOOTPRINT_COUNTIES.map((county) => county.name);

/**
 * Records that belong to one footprint municipality.
 *
 * The officials dataset is nationwide, and East Texas shares its town names
 * with much larger places: Atlanta, Henderson, Jacksonville and Jefferson all
 * exist in other states. A bare substring match on the jurisdiction counted
 * Atlanta's and Jacksonville's mayors as HD-7 / TX-01 coverage and inflated the
 * ledger, so a match now has to be in Texas AND in one of the place's own
 * counties.
 */
export function officialsForPlace(place: FootprintPlace, officials: Official[]) {
  const placeCounties = new Set(
    [place.county, ...(place.alsoInCounties ?? [])].map((county) => county.toLowerCase()),
  );
  const placeName = place.name.toLowerCase();

  return officials.filter((official) => {
    if (official.level !== "city") return false;
    // Local records carry no state field; an explicit non-Texas state is a
    // different place with the same name.
    if ((official.state ?? "TX").toUpperCase() !== "TX") return false;
    if (!official.county.some((county) => placeCounties.has(normalizedCounty(county)))) return false;
    const jurisdiction = (official.jurisdiction ?? "").toLowerCase();
    return jurisdiction.includes(placeName);
  });
}

/** Records that belong to one footprint county government. */
export function officialsForCounty(county: FootprintCounty, officials: Official[]) {
  return officials.filter(
    (official) =>
      official.level === "county" &&
      (official.state ?? "TX").toUpperCase() === "TX" &&
      official.county.some((name) => normalizedCounty(name) === county.name.toLowerCase()),
  );
}

const FOOTPRINT_COUNTY_KEYS = new Set(FOOTPRINT_COUNTY_NAMES.map((name) => name.toLowerCase()));

/**
 * True when a record belongs to the footprint: it is one of the two home
 * seats, or its county is inside the districts. Statewide and federal records
 * that are not the TX-01 seat are outside the footprint by design.
 */
export function isInFootprint(official: Official) {
  if (coverageTierForOfficial(official) === "home-district") return true;
  return official.county.some((county) => FOOTPRINT_COUNTY_KEYS.has(normalizedCounty(county)));
}

export type SeatLedgerRow = {
  kind: JurisdictionKind;
  slug: string;
  name: string;
  county: string;
  districts: string[];
  covered: number;
  expected: number;
  /** Expected counts marked variable are floors, so coverage can exceed them. */
  percent: number;
  missingLabels: string[];
};

function slateFor(kind: JurisdictionKind) {
  return kind === "county" ? COUNTY_OFFICE_SLATE : CITY_OFFICE_SLATE;
}

function expectedSeats(kind: JurisdictionKind) {
  return slateFor(kind).reduce((total, office) => total + office.expected, 0);
}

export const EXPECTED_COUNTY_SEATS = expectedSeats("county");
export const EXPECTED_CITY_SEATS = expectedSeats("city");

function matchesOffice(position: string, key: string, label: string) {
  const text = position.toLowerCase();
  if (key === "commissioner") return text.includes("commissioner");
  if (key === "county-judge") return text.includes("county judge");
  if (key === "prosecutor") return text.includes("attorney");
  if (key === "council") return text.includes("council");
  if (key === "justice-of-the-peace") return text.includes("justice of the peace");
  return text.includes(label.toLowerCase());
}

/**
 * Builds the seat ledger for one jurisdiction: how many of its expected
 * elected seats RepWatchr carries, and which office families are still empty.
 */
export function seatLedgerFor(
  kind: JurisdictionKind,
  jurisdiction: { slug: string; name: string; county: string; districts: string[] },
  officials: Official[],
): SeatLedgerRow {
  const slate = slateFor(kind);
  const positions = officials.map((official) => official.position ?? "");
  const missingLabels: string[] = [];

  for (const office of slate) {
    const found = positions.filter((position) => matchesOffice(position, office.key, office.label)).length;
    if (found < office.expected) missingLabels.push(office.label);
  }

  const expected = expectedSeats(kind);
  const covered = officials.length;
  return {
    kind,
    slug: jurisdiction.slug,
    name: jurisdiction.name,
    county: jurisdiction.county,
    districts: jurisdiction.districts,
    covered,
    expected,
    // A slate is only filled when every expected office family is covered.
    // Raw headcount can reach or exceed the expected total while a single-seat
    // office is still empty, because the variable offices are floors: a county
    // with nine commissioners and no sheriff would otherwise read 100%. Capping
    // at 99% while anything is missing keeps a documented gap from reading as
    // finished work, which is the whole point of this ledger.
    percent:
      missingLabels.length === 0 ? 100 : Math.min(99, Math.round((covered / expected) * 100)),
    missingLabels,
  };
}

/** Every jurisdiction in the footprint, county rows first, then places. */
export function footprintJurisdictions() {
  const counties = FOOTPRINT_COUNTIES.map((county) => ({
    kind: "county" as const,
    slug: county.slug,
    name: `${county.name} County`,
    county: county.name,
    districts: county.districts as unknown as string[],
  }));
  const places = FOOTPRINT_PLACES.map((place) => {
    const county = FOOTPRINT_COUNTIES.find((row) => row.name === place.county);
    return {
      kind: "city" as const,
      slug: place.slug,
      name: place.name,
      county: place.county,
      districts: (county?.districts as unknown as string[]) ?? ["TX-01"],
    };
  });
  return { counties, places };
}

export const FOOTPRINT_SUMMARY = {
  districts: HOME_DISTRICTS.map((district) => district.code),
  stateSeat: TX_HOUSE_DISTRICT_7,
  federalSeat: TX_CONGRESSIONAL_DISTRICT_1,
  countyCount: FOOTPRINT_COUNTIES.length,
  placeCount: FOOTPRINT_PLACES.length,
};
