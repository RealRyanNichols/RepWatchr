import type { Official } from "@/types";

export const HARLETON_COVERAGE_CENTER = {
  label: "Harleton, Texas",
  latitude: 32.6751,
  longitude: -94.5746,
  roadRadiusMiles: 75,
} as const;

/**
 * Jurisdictions with a seat, office, or meaningful service area inside the
 * 75-road-mile Harleton launch territory. Boundary communities are retained
 * for address-level review rather than silently declared in or out.
 */
export const EAST_TEXAS_LAUNCH_JURISDICTIONS = {
  counties: [
    "Bowie", "Camp", "Cass", "Gregg", "Harrison", "Marion", "Morris",
    "Panola", "Rusk", "Smith", "Titus", "Upshur", "Wood",
  ],
  communities: [
    "Atlanta", "Carthage", "Daingerfield", "Gilmer", "Gladewater", "Hallsville",
    "Harleton", "Henderson", "Jefferson", "Kilgore", "Linden", "Longview",
    "Marshall", "Mount Pleasant", "Ore City", "Pittsburg", "Queen City",
    "Tatum", "Texarkana", "Waskom", "White Oak",
  ],
  schoolDistricts: [
    "Atlanta ISD", "Carthage ISD", "Daingerfield-Lone Star ISD", "Gilmer ISD",
    "Gladewater ISD", "Hallsville ISD", "Harleton ISD", "Henderson ISD",
    "Jefferson ISD", "Kilgore ISD", "Linden-Kildare CISD", "Longview ISD",
    "Marshall ISD", "Mount Pleasant ISD", "New Diana ISD", "Ore City ISD",
    "Pittsburg ISD", "Queen City ISD", "Tatum ISD", "Waskom ISD", "White Oak ISD",
  ],
} as const;

export const OFFICE_FAMILY_EXPECTATIONS = [
  { key: "federal", label: "Federal delegation", records: "Roll calls, sponsorships, attendance, district work, ethics and campaign finance" },
  { key: "state", label: "Texas officials", records: "Roll calls, authored bills, committee work, appropriations, disclosures and promises" },
  { key: "county", label: "County government", records: "Judge, commissioners, sheriff, constables, clerks, treasurer, tax office, courts and prosecutors" },
  { key: "city", label: "Cities and towns", records: "Mayor, council, budgets, contracts, appointments, taxes, utilities and public access" },
  { key: "school-board", label: "School boards", records: "Every trustee, votes, attendance, superintendent oversight, bonds, contracts and student outcomes" },
  { key: "special-district", label: "Special districts", records: "Water, hospital, appraisal, emergency-service and other elected local boards" },
] as const;

function normalized(value?: string | null) {
  return (value ?? "").trim().toLowerCase().replace(/\s+county$/, "");
}

export function isInEastTexasLaunchTerritory(official: Official) {
  const countyTargets = new Set(EAST_TEXAS_LAUNCH_JURISDICTIONS.counties.map(normalized));
  const placeTargets = new Set([
    ...EAST_TEXAS_LAUNCH_JURISDICTIONS.communities,
    ...EAST_TEXAS_LAUNCH_JURISDICTIONS.schoolDistricts,
  ].map(normalized));
  const counties = official.county.map(normalized);
  const text = [
    official.jurisdiction,
    official.district,
    official.contactInfo.office,
    official.bio,
  ].filter(Boolean).join(" ").toLowerCase();

  return (
    counties.some((county) => countyTargets.has(county)) ||
    [...placeTargets].some((place) => text.includes(place))
  );
}

export function eastTexasProfileReadiness(official: Official) {
  const sources = official.sourceLinks?.filter((source) => source.url.startsWith("http")) ?? [];
  const social = official.contactInfo.socialMedia;
  const checks = {
    portrait: Boolean(official.featuredPhoto || official.photo),
    biography: Boolean(official.bio && official.bio.length >= 120),
    officialContact: Boolean(official.contactInfo.website || official.contactInfo.phone || official.contactInfo.email),
    publicSources: sources.length >= 2,
    socialLinks: Boolean(social && Object.values(social).some(Boolean)),
    currentReview: official.reviewStatus === "verified" || official.reviewStatus === "complete",
  };
  const completed = Object.values(checks).filter(Boolean).length;
  return { checks, completed, total: Object.keys(checks).length, percent: Math.round((completed / Object.keys(checks).length) * 100) };
}
