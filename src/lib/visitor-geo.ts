/**
 * Classifying a visitor by where the request came from.
 *
 * "Is this audience inside the district or outside it" is the question that
 * decides who the next post is for, and nothing on the site could answer it.
 * Vercel Analytics groups by country only, which cannot tell Longview from
 * London's opposite, so the classification is done here from the edge geo
 * headers Vercel attaches to every request.
 *
 * What is stored is a city name, a region code, and a tier. No IP address, and
 * nothing that identifies a person. A city is coarse enough that it says who
 * the audience is without saying who the reader is, which is the line this
 * site holds everywhere else.
 */

import { FOOTPRINT_COUNTY_NAMES, FOOTPRINT_PLACES } from "@/lib/district-footprint";
import { EAST_TEXAS_LAUNCH_JURISDICTIONS } from "@/lib/east-texas-launch-territory";

export const VISITOR_TIERS = ["home-district", "east-texas", "texas", "national", "outside"] as const;
export type VisitorTier = (typeof VISITOR_TIERS)[number];

export const VISITOR_TIER_LABELS: Record<VisitorTier, string> = {
  "home-district": "HD-7 / TX-01",
  "east-texas": "Wider East Texas",
  texas: "Rest of Texas",
  national: "Rest of the United States",
  outside: "Outside the United States",
};

export type VisitorGeo = {
  city: string | null;
  region: string | null;
  country: string | null;
  tier: VisitorTier;
};

function normalize(value: string | null | undefined) {
  if (!value) return null;
  // Vercel percent-encodes city names that contain spaces or accents.
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }
  const trimmed = decoded.trim();
  return trimmed ? trimmed : null;
}

function lower(value: string | null) {
  return value ? value.toLowerCase() : null;
}

/** Places inside the buildout footprint, plus the counties they sit in. */
const FOOTPRINT_PLACE_NAMES = new Set(FOOTPRINT_PLACES.map((place) => place.name.toLowerCase()));
const FOOTPRINT_COUNTY_SET = new Set(FOOTPRINT_COUNTY_NAMES.map((county) => county.toLowerCase()));

/**
 * The wider launch territory: its counties and its towns.
 *
 * A reader in a launch-territory town counts as East Texas even when that town
 * is not in the HD-7 / TX-01 footprint. School district names are left out
 * because the edge reports a city, and "Carthage ISD" is never a city.
 */
const EAST_TEXAS_NAMES = new Set(
  [...EAST_TEXAS_LAUNCH_JURISDICTIONS.counties, ...EAST_TEXAS_LAUNCH_JURISDICTIONS.communities].map((name) =>
    name.toLowerCase(),
  ),
);

/**
 * Classify from the city and region the edge reported.
 *
 * City names are ambiguous across states, so a match only counts as local when
 * the region is Texas. Without that, a visitor from Longview, Washington would
 * be filed as a constituent.
 */
export function classifyVisitor(input: { city?: string | null; region?: string | null; country?: string | null }): VisitorGeo {
  const city = normalize(input.city);
  const region = normalize(input.region);
  const country = normalize(input.country);

  const cityKey = lower(city);
  const regionKey = lower(region);
  const isTexas = regionKey === "tx" || regionKey === "texas";
  const isUnitedStates = !country || country.toUpperCase() === "US";

  if (!isUnitedStates) {
    return { city, region, country, tier: "outside" };
  }

  if (isTexas && cityKey) {
    if (FOOTPRINT_PLACE_NAMES.has(cityKey) || FOOTPRINT_COUNTY_SET.has(cityKey)) {
      return { city, region, country, tier: "home-district" };
    }
    if (EAST_TEXAS_NAMES.has(cityKey)) {
      return { city, region, country, tier: "east-texas" };
    }
  }

  if (isTexas) return { city, region, country, tier: "texas" };
  return { city, region, country, tier: "national" };
}

/**
 * Read the geo Vercel attaches at the edge.
 *
 * These headers are set by the platform and cannot be spoofed by the client:
 * Vercel overwrites them on every inbound request.
 */
export function visitorGeoFromHeaders(headers: Headers): Omit<VisitorGeo, "tier"> & { tier: VisitorTier | null } {
  // A self-hosted origin must not trust visitor-supplied Vercel geo headers.
  // Missing geography is unknown, not evidence of a national or local reader.
  if (!process.env.VERCEL || !headers.get("x-vercel-ip-country")) {
    return { city: null, region: null, country: null, tier: null };
  }
  return classifyVisitor({
    city: headers.get("x-vercel-ip-city"),
    region: headers.get("x-vercel-ip-country-region"),
    country: headers.get("x-vercel-ip-country"),
  });
}
