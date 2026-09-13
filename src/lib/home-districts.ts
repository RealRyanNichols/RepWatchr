import type { Official } from "@/types";
import { isInEastTexasLaunchTerritory } from "@/lib/east-texas-launch-territory";

/**
 * RepWatchr's home beat.
 *
 * Two districts decide what this desk covers first: Texas House District 7 for
 * state politics and Texas's 1st congressional district for federal politics.
 * Everything else is earned coverage - statewide and national records run only
 * when they reach these districts or when they are large enough that HD-7 and
 * TX-01 readers need them anyway.
 *
 * This module is the single source of truth for that decision. Pages, the news
 * wire, and ranking logic read the tiers here instead of hard-coding county
 * lists, so the beat can never drift between surfaces.
 */

export type HomeDistrictSource = {
  label: string;
  url: string;
  supports: string[];
};

export type HomeDistrictCounty = {
  name: string;
  /** "whole" or a sourced note when only part of the county is in the district. */
  inclusion: "whole" | "partial";
  note?: string;
};

export type HomeDistrict = {
  id: "tx-hd-7" | "tx-01";
  level: "state" | "federal";
  code: string;
  label: string;
  shortLabel: string;
  chamber: string;
  summary: string;
  counties: HomeDistrictCounty[];
  incumbentOfficialId: string;
  incumbentName: string;
  seatHref: string;
  raceHref?: string;
  /**
   * Boundary provenance. "verified" means the county list is carried by a
   * primary record already cited below. "needs_authentication" means the list
   * is usable for targeting coverage but is not published as an established
   * fact until the primary map report is pulled and cited.
   */
  boundaryStatus: "verified" | "needs_authentication";
  boundaryNote: string;
  boundaryReviewedAt: string;
  sources: HomeDistrictSource[];
};

export const HOME_DISTRICT_REVIEWED_AT = "2026-09-13";

export const TX_HOUSE_DISTRICT_7: HomeDistrict = {
  id: "tx-hd-7",
  level: "state",
  code: "HD-7",
  label: "Texas House District 7",
  shortLabel: "HD-7",
  chamber: "Texas House of Representatives",
  summary:
    "The state seat this desk covers first. HD-7 is Gregg, Harrison and Marion counties, including Longview, Marshall and Jefferson.",
  counties: [
    { name: "Gregg", inclusion: "whole" },
    { name: "Harrison", inclusion: "whole" },
    { name: "Marion", inclusion: "whole" },
  ],
  incumbentOfficialId: "jay-dean",
  incumbentName: "Jay Dean",
  seatHref: "/officials/jay-dean",
  raceHref: "/elections/texas/texas-house-district-7-2026",
  boundaryStatus: "verified",
  boundaryNote:
    "The Legislative Reference Library member record lists the current HD-7 term as serving Gregg, Harrison and Marion counties.",
  boundaryReviewedAt: HOME_DISTRICT_REVIEWED_AT,
  sources: [
    {
      label: "Legislative Reference Library: HD-7 service record",
      url: "https://lrl.texas.gov/legeLeaders/members/memberDisplay.cfm?memberID=5818",
      supports: ["district", "counties", "term"],
    },
    {
      label: "Texas Legislature: HD-7 member record",
      url: "https://capitol.texas.gov/members/MemberInfo.aspx?Chamber=H&Code=A3515&Leg=89",
      supports: ["legislation", "committees"],
    },
  ],
};

export const TX_CONGRESSIONAL_DISTRICT_1: HomeDistrict = {
  id: "tx-01",
  level: "federal",
  code: "TX-01",
  label: "Texas's 1st Congressional District",
  shortLabel: "TX-01",
  chamber: "U.S. House of Representatives",
  summary:
    "The federal seat this desk covers first. TX-01 wraps HD-7 and reaches across East Texas from Tyler to the Louisiana line.",
  counties: [
    { name: "Bowie", inclusion: "partial", note: "Reported as a partial county under the operative congressional plan." },
    { name: "Cass", inclusion: "whole" },
    { name: "Cherokee", inclusion: "whole" },
    { name: "Gregg", inclusion: "whole" },
    { name: "Harrison", inclusion: "whole" },
    { name: "Marion", inclusion: "whole" },
    { name: "Nacogdoches", inclusion: "whole" },
    { name: "Panola", inclusion: "whole" },
    { name: "Rusk", inclusion: "whole" },
    { name: "Sabine", inclusion: "whole" },
    { name: "San Augustine", inclusion: "whole" },
    { name: "Shelby", inclusion: "whole" },
    { name: "Smith", inclusion: "whole" },
  ],
  incumbentOfficialId: "nathaniel-moran",
  incumbentName: "Nathaniel Moran",
  seatHref: "/officials/nathaniel-moran",
  boundaryStatus: "needs_authentication",
  boundaryNote:
    "Texas redrew its congressional map in 2025 (PlanC2333), and the U.S. Supreme Court stayed the district-court order that had blocked it, so PlanC2333 governs the 2026 congressional elections. This county list follows published summaries of that plan and is used to aim coverage. It is not published as an established boundary finding until the Texas Legislative Council county-district report for PlanC2333 is pulled and cited on the record.",
  boundaryReviewedAt: HOME_DISTRICT_REVIEWED_AT,
  sources: [
    {
      label: "U.S. House Clerk: TX-01 member profile",
      url: "https://clerk.house.gov/members/M001224",
      supports: ["identity", "current_office", "district"],
    },
    {
      label: "Texas Legislative Council: PlanC2333 dataset",
      url: "https://data.capitol.texas.gov/dataset/planc2333",
      supports: ["boundaries"],
    },
    {
      label: "Texas Legislative Council: 2020s redistricting timeline",
      url: "https://redistricting.capitol.texas.gov/2020s_timeline",
      supports: ["operative_plan", "litigation_status"],
    },
  ],
};

export const HOME_DISTRICTS: HomeDistrict[] = [TX_HOUSE_DISTRICT_7, TX_CONGRESSIONAL_DISTRICT_1];

/** Every county touched by either home district, deduplicated and sorted. */
export const HOME_DISTRICT_COUNTIES: string[] = [
  ...new Set(HOME_DISTRICTS.flatMap((district) => district.counties.map((county) => county.name))),
].sort();

/**
 * Cities and towns whose names are distinctive enough that appearing in a Texas
 * story is evidence on its own. Ordinary headline wording counts here, because
 * "Longview approves new budget" is unmistakable once a Texas signal is present.
 */
export const HOME_DISTRICT_DISTINCT_PLACES: string[] = [
  "Carthage",
  "Gladewater",
  "Hallsville",
  "Harleton",
  "Kilgore",
  "Longview",
  "Nacogdoches",
  "Rusk",
  "San Augustine",
  "Waskom",
];

/**
 * Places whose names are common words or far bigger cities elsewhere: Center,
 * Atlanta, Jefferson, Marshall, Tyler, Henderson. A Texas signal is not enough
 * for these - "Texas data center" and "Tyler said" both carry one - so they
 * additionally require locality syntax naming the place as a place.
 */
export const HOME_DISTRICT_AMBIGUOUS_PLACES: string[] = [
  "Atlanta",
  "Center",
  "Henderson",
  "Jefferson",
  "Linden",
  "Marshall",
  "Tatum",
  "Tyler",
  "White Oak",
];

/** Every place in the footprint index. */
export const HOME_DISTRICT_PLACES: string[] = [
  ...HOME_DISTRICT_DISTINCT_PLACES,
  ...HOME_DISTRICT_AMBIGUOUS_PLACES,
].sort();

/**
 * Institutional compounds that contain a place name without being about the
 * place. These are stripped BEFORE locality matching, because a civic-sounding
 * word after one of them would otherwise resurrect the false positive:
 * "Texas Medical Center police" must not read as Center, Texas.
 */
const PLACE_FALSE_POSITIVE_PHRASES: string[] = [
  "data center",
  "medical center",
  "civic center",
  "shopping center",
  "convention center",
  "detention center",
  "call center",
  "community center",
  "distribution center",
  "health center",
  "visitor center",
  "recreation center",
  "research center",
  "performing arts center",
  "arts center",
  "sports center",
  "fitness center",
  "welcome center",
  "service center",
  "training center",
  "operations center",
  "command center",
  "senior center",
  "youth center",
];

/**
 * Terms that identify these seats on their own. A state prefix or an
 * officeholder's name is enough to place a story without further evidence.
 */
export const HOME_DISTRICT_UNAMBIGUOUS_TERMS: string[] = [
  "texas house district 7",
  "texas 1st congressional district",
  "tx-01",
  "tx-1",
  "jay dean",
  "nathaniel moran",
];

/**
 * District labels that are NOT unique to Texas. Every state numbers its own
 * house and congressional districts, and this site carries a news feed for all
 * fifty of them, so "1st congressional district" on its own matches Arizona as
 * readily as TX-01. These require a Texas signal before they count - otherwise
 * an out-of-state race takes a reserved HD-7 / TX-01 slot on the homepage.
 */
export const HOME_DISTRICT_AMBIGUOUS_TERMS: string[] = [
  "house district 7",
  "hd-7",
  "hd 7",
  "congressional district 1",
  "1st congressional district",
];

/** Every district term, for search-query building where breadth is wanted. */
export const HOME_DISTRICT_TERMS: string[] = [
  ...HOME_DISTRICT_UNAMBIGUOUS_TERMS,
  ...HOME_DISTRICT_AMBIGUOUS_TERMS,
];

/**
 * Locality syntax that marks a place name as the actual place rather than a
 * word inside something else. "Center" is the Shelby County seat and also sits
 * in research center, performing arts center, distribution center and every
 * other compound nobody can finish enumerating, so a denylist of those phrases
 * is unwinnable. Require positive evidence instead: the name has to appear with
 * a state tag, a civic prefix, or a local-government noun beside it.
 */
function localityPatternsFor(place: string) {
  const p = place.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [
    // "Center, Texas" / "Center, TX"
    new RegExp(`\\b${p}\\s*,\\s*(texas|tx)\\b`, "i"),
    // "City of Center" / "Town of Center"
    new RegExp(`\\b(city|town)\\s+of\\s+${p}\\b`, "i"),
    // "Center ISD"
    new RegExp(`\\b${p}\\s+isd\\b`, "i"),
    // "Center city council", "Center mayor", "Center police", ...
    new RegExp(
      `\\b${p}\\s+(city\\s+council|council|mayor|city\\s+hall|city\\s+manager|police|fire|school|schools|trustees?|voters?|residents?)\\b`,
      "i",
    ),
    // "mayor of Center", "council of Center"
    new RegExp(`\\b(mayor|council|city\\s+council)\\s+of\\s+${p}\\b`, "i"),
  ];
}

/**
 * Coverage tiers, most local first. The homepage, the wire, and profile
 * ranking all sort on this order so HD-7 and TX-01 never lose the lead to a
 * louder story from somewhere else.
 */
export const COVERAGE_TIERS = ["home-district", "east-texas", "texas", "national", "outside"] as const;

export type CoverageTier = (typeof COVERAGE_TIERS)[number];

export const COVERAGE_TIER_LABELS: Record<CoverageTier, string> = {
  "home-district": "HD-7 / TX-01",
  "east-texas": "East Texas",
  texas: "Texas",
  national: "Washington",
  outside: "Outside the beat",
};

export function coverageTierRank(tier: CoverageTier) {
  return COVERAGE_TIERS.indexOf(tier);
}

const US_STATES_OTHER_THAN_TEXAS = [
  "alabama", "alaska", "arizona", "arkansas", "california", "colorado", "connecticut",
  "delaware", "florida", "georgia", "hawaii", "idaho", "illinois", "indiana", "iowa",
  "kansas", "kentucky", "louisiana", "maine", "maryland", "massachusetts", "michigan",
  "minnesota", "mississippi", "missouri", "montana", "nebraska", "nevada",
  "new hampshire", "new jersey", "new mexico", "new york", "north carolina",
  "north dakota", "ohio", "oklahoma", "oregon", "pennsylvania", "rhode island",
  "south carolina", "south dakota", "tennessee", "utah", "vermont", "virginia",
  "washington", "west virginia", "wisconsin", "wyoming",
];

function normalizedCounty(value?: string | null) {
  return (value ?? "").trim().toLowerCase().replace(/\s+county$/, "");
}

const HOME_COUNTY_KEYS = new Set(HOME_DISTRICT_COUNTIES.map(normalizedCounty));
const HOME_PLACE_KEYS = HOME_DISTRICT_PLACES.map((place) => place.toLowerCase());
const HOME_INCUMBENT_IDS = new Set(HOME_DISTRICTS.map((district) => district.incumbentOfficialId));

/**
 * Several home-district place names are common words elsewhere - Atlanta,
 * Marshall, Jefferson, Tyler, Center, Rusk. Whole-word matching plus a Texas
 * signal is what keeps a Georgia headline out of the East Texas lane.
 */
function wholeWordPattern(needle: string) {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
}

const HOME_PLACE_PATTERNS = HOME_PLACE_KEYS.map(wholeWordPattern);
const PLACE_FALSE_POSITIVE_PATTERNS = PLACE_FALSE_POSITIVE_PHRASES.map(wholeWordPattern);
const AMBIGUOUS_PLACE_KEYS = new Set(HOME_DISTRICT_AMBIGUOUS_PLACES.map((place) => place.toLowerCase()));
const HOME_PLACE_LOCALITY_PATTERNS = HOME_DISTRICT_PLACES.map(localityPatternsFor);
const HOME_UNAMBIGUOUS_TERM_PATTERNS = HOME_DISTRICT_UNAMBIGUOUS_TERMS.map(wholeWordPattern);
const HOME_AMBIGUOUS_TERM_PATTERNS = HOME_DISTRICT_AMBIGUOUS_TERMS.map(wholeWordPattern);

function hasTexasSignal(haystack: string) {
  return /\btexas\b/i.test(haystack) || /(^|[^a-z])tx([^a-z]|$)/i.test(haystack);
}

/** True when the official holds one of the two home-district seats. */
export function isHomeDistrictSeat(official: Official) {
  return HOME_INCUMBENT_IDS.has(official.id);
}

/**
 * True when the official's office sits inside HD-7 or TX-01. County records
 * decide it when they exist; otherwise the district string is checked so the
 * two seats themselves always match even with an empty county array.
 */
export function isInHomeDistricts(official: Official) {
  if (isHomeDistrictSeat(official)) return true;
  if (official.county.some((county) => HOME_COUNTY_KEYS.has(normalizedCounty(county)))) return true;

  const isTexasRecord = official.state?.toUpperCase() === "TX";
  if (!isTexasRecord) return false;

  const districtText = (official.district ?? "").toLowerCase();
  if (official.level === "state" && /\bhd[-\s]?0*7\b/.test(districtText)) return true;
  if (official.level === "federal" && /\btx[-\s]?0*1\b/.test(districtText)) return true;

  const placeText = [official.jurisdiction, official.district, official.contactInfo.office]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return HOME_PLACE_PATTERNS.some((pattern) => pattern.test(placeText));
}

/** The tier an official's record belongs to. */
export function coverageTierForOfficial(official: Official): CoverageTier {
  if (isInHomeDistricts(official)) return "home-district";
  if (isInEastTexasLaunchTerritory(official)) return "east-texas";
  if (official.state?.toUpperCase() === "TX") return "texas";
  if (official.level === "federal") return "national";
  return "outside";
}

/**
 * Jurisdiction evidence a caller already resolved FROM THE ARTICLE, used to
 * confirm a county or place name is the Texas one.
 */
export type CoverageTierHints = {
  counties?: string[];
  cities?: string[];
  /**
   * Texas established by the ARTICLE - a Texas state name in the text, or a
   * known Texas officeholder named in it. Deliberately not a `state` field: a
   * search source stamps its own state on every clip it returns, and a field
   * called `state` invites exactly that value being passed in. Only pass true
   * for evidence found in the article itself.
   */
  texasEvidenceFromArticle?: boolean;
};

/**
 * The tier a piece of text belongs to, for headlines and wire items that carry
 * no structured jurisdiction. Falls back to null so callers can keep whatever
 * classification their own pipeline already produced.
 *
 * Pass `hints` when the caller has already matched counties, cities, or a state
 * against the item. A county name on its own is not enough - Harrison County
 * exists in six other states - so without a Texas signal in the text, a
 * structured Texas match is what lets a county headline count.
 */
export function coverageTierForText(text: string, hints: CoverageTierHints = {}): CoverageTier | null {
  const haystack = text.toLowerCase();

  // Texas-qualified district labels and officeholder names stand alone.
  if (HOME_UNAMBIGUOUS_TERM_PATTERNS.some((pattern) => pattern.test(haystack))) return "home-district";

  // Only article-derived evidence counts. A search source stamps its own state
  // on every clip it returns, so a caller must never hand that value down here.
  // A county hint is a substring match against the article, so an Ohio story in
  // a home-district lane still reports "Harrison". It only counts as Texas
  // evidence when the article does not qualify that county as another state's.
  const countyQualifiedElsewhere = (county: string) =>
    US_STATES_OTHER_THAN_TEXAS.some((state) =>
      new RegExp(`\\b${county} county,\\s*${state}\\b(?!\\s+city\\b)`, "i").test(haystack),
    ) && !new RegExp(`\\b${county} county,\\s*(texas|tx)\\b`, "i").test(haystack);

  const structuredTexas =
    hints.texasEvidenceFromArticle === true ||
    (hints.counties ?? []).some(
      (county) =>
        HOME_COUNTY_KEYS.has(normalizedCounty(county)) && !countyQualifiedElsewhere(normalizedCounty(county)),
    ) ||
    (hints.cities ?? []).some((city) => HOME_PLACE_KEYS.includes(city.trim().toLowerCase()));

  // County and place names need a Texas signal before they count. "Marshall",
  // "Jefferson" and "Atlanta" exist in a lot of states.
  if (!structuredTexas && !hasTexasSignal(haystack)) return null;

  // With a Texas signal established, a bare district number is ours.
  if (HOME_AMBIGUOUS_TERM_PATTERNS.some((pattern) => pattern.test(haystack))) return "home-district";

  // Our county names are shared: Harrison County exists in Ohio, Marion in
  // Indiana, Smith in Kansas. An explicit "<county> County, <other state>" is
  // that state's, and the wire's countyMatches cannot settle it - those are
  // substring matches against the article, so an Ohio story still reports
  // "Harrison". Reject the foreign-qualified form before claiming the county.
  const countyNamesForeignState = (county: string) =>
    !new RegExp(`\\b${county} county,\\s*(texas|tx)\\b`, "i").test(haystack) &&
    US_STATES_OTHER_THAN_TEXAS.some((state) =>
      new RegExp(`\\b${county} county,\\s*${state}\\b(?!\\s+city\\b)`, "i").test(haystack),
    );

  if (
    [...HOME_COUNTY_KEYS].some(
      (county) => haystack.includes(`${county} county`) && !countyNamesForeignState(county),
    )
  ) {
    return "home-district";
  }

  // A town name that the same text uses as a county name belongs to that county,
  // not to this beat. Jefferson is a town in Marion County and also a Texas
  // county down on the Gulf; "Jefferson County" is not ours.
  // An article can name both variants - "Longview, Texas coordinates with
  // Longview, Washington" - and a text-wide veto would throw out the valid
  // Texas occurrence along with the foreign one. An explicit Texas
  // qualification of the same place wins over either veto below.
  const explicitlyTexas = (place: string) =>
    new RegExp(`\\b${place},\\s*(texas|tx)\\b`, "i").test(haystack);

  const namesForeignCounty = (place: string) =>
    !explicitlyTexas(place) && haystack.includes(`${place} county`) && !HOME_COUNTY_KEYS.has(place);

  // "Carthage, Missouri" and "Longview, Washington" are that state's town, even
  // when Texas appears elsewhere in the same story.
  //
  // The state name needs a word boundary and must not be the start of a
  // "<State> City" place: Missouri City, Kansas City and Texas City are all real
  // municipalities, so a bare substring test rejects "Carthage, Missouri City"
  // - a Texas dateline - as if it were Missouri's Carthage.
  const namesForeignState = (place: string) =>
    !explicitlyTexas(place) &&
    US_STATES_OTHER_THAN_TEXAS.some((state) =>
      new RegExp(`\\b${place},\\s*${state}\\b(?!\\s+city\\b)`, "i").test(haystack),
    );

  // Strip institutional compounds before any place matching. A civic-sounding
  // word after one of them would otherwise resurrect the false positive, so
  // "Texas Medical Center police" must not survive as Center, Texas.
  const stripped = PLACE_FALSE_POSITIVE_PATTERNS.reduce(
    (text, pattern) => text.replace(new RegExp(pattern.source, "gi"), " "),
    haystack,
  );

  // Two tiers. A distinctive name - Longview, Nacogdoches, Kilgore - is evidence
  // on its own once the Texas signal above is established, so ordinary headline
  // wording keeps its home-district slot. A name that is a common word or a
  // bigger city elsewhere - Center, Atlanta, Tyler, Marshall - additionally has
  // to be used as a place, because the Texas signal alone does not separate
  // "Center, Texas" from "Texas data center".
  //
  // A structured city hint never waives the ambiguous tier's test: those hints
  // are substring matches upstream, so "Texas research center" hands one back.
  if (
    HOME_PLACE_KEYS.some((place, index) => {
      if (namesForeignCounty(place) || namesForeignState(place)) return false;
      if (AMBIGUOUS_PLACE_KEYS.has(place)) {
        return HOME_PLACE_LOCALITY_PATTERNS[index].some((pattern) => pattern.test(stripped));
      }
      return HOME_PLACE_PATTERNS[index].test(stripped);
    })
  ) {
    return "home-district";
  }
  return null;
}

/** Sort comparator that puts the home district first and Washington last. */
export function compareByCoverageTier(a: Official, b: Official) {
  return coverageTierRank(coverageTierForOfficial(a)) - coverageTierRank(coverageTierForOfficial(b));
}

/**
 * Orders any list of officials into beat order without dropping anyone:
 * HD-7 and TX-01, then the wider East Texas territory, then Texas, then
 * federal records that reach the district anyway.
 */
export function sortByCoverageTier<T extends Official>(officials: T[]): T[] {
  return [...officials].sort(compareByCoverageTier);
}
