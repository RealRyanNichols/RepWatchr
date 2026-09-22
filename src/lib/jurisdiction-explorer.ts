import type { Official } from "@/types";
import {
  CITY_OFFICE_SLATE,
  COUNTY_OFFICE_SLATE,
  FOOTPRINT_COUNTIES,
  FOOTPRINT_PLACES,
  matchesOffice,
  officialsForCounty,
  officialsForPlace,
  type JurisdictionKind,
} from "@/lib/district-footprint";

export type JurisdictionSummary = {
  kind: JurisdictionKind;
  slug: string;
  name: string;
  /** Primary county; counties preserves every documented cross-county part. */
  county: string;
  counties: string[];
  /** Coverage labels inherit the footprint's boundary-review status. */
  districts: string[];
  profileCount: number;
  /** Linked sources are research paths, not proof of current incumbency. */
  sourceLinkedCount: number;
  /** Sum of shortfalls against the common slate, capped per office family. */
  missingOfficeCount: number;
  missingOfficeFamilyCount: number;
  expected: number;
  href: string;
};

export type JurisdictionOfficeGroup = {
  key: string;
  label: string;
  expected: number;
  variable: boolean;
  officials: Official[];
  missing: number;
};

export type JurisdictionRecord = JurisdictionSummary & {
  officials: Official[];
  officeGroups: JurisdictionOfficeGroup[];
  unmatchedOfficials: Official[];
};

export function jurisdictionHref(kind: string, slug: string): string {
  return `/home-district/roster/${encodeURIComponent(kind)}/${encodeURIComponent(slug)}`;
}

export function rosterSourceHref(
  jurisdiction: { name: string; kind: string; slug: string },
  officeLabel?: string,
): string {
  const params = new URLSearchParams({
    target: officeLabel ? `${jurisdiction.name}: ${officeLabel}` : jurisdiction.name,
    jurisdiction: `${jurisdiction.name}, Texas`,
    type: "roster",
    from: jurisdictionHref(jurisdiction.kind, jurisdiction.slug),
  });
  return `/submit-source?${params.toString()}`;
}

function hasLinkedSource(official: Official): boolean {
  return (official.sourceLinks ?? []).some((source) => {
    try {
      const url = new URL(source.url);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  });
}

/**
 * A read-only view of loaded public profiles. Expected seats are the canonical
 * common slate; absent profiles are research gaps, never findings of vacancies.
 * No filesystem, database, credentials, or clock are needed by this model.
 */
export function getJurisdictionRecord(
  kind: string,
  slug: string,
  officials: Official[],
): JurisdictionRecord | null {
  if (kind !== "county" && kind !== "city") return null;

  const county = kind === "county" ? FOOTPRINT_COUNTIES.find((row) => row.slug === slug) : undefined;
  const place = kind === "city" ? FOOTPRINT_PLACES.find((row) => row.slug === slug) : undefined;
  if (!county && !place) return null;

  const counties = county ? [county.name] : [place!.county, ...(place!.alsoInCounties ?? [])];
  const districts = [...new Set(counties.flatMap((name) =>
    FOOTPRINT_COUNTIES.find((row) => row.name === name)?.districts ?? [],
  ))];
  const scoped = county ? officialsForCounty(county, officials) : officialsForPlace(place!, officials);
  const seenIds = new Set<string>();
  const profiles = scoped.filter((official) => {
    if (seenIds.has(official.id)) return false;
    seenIds.add(official.id);
    return true;
  });
  const slate = kind === "county" ? COUNTY_OFFICE_SLATE : CITY_OFFICE_SLATE;
  const officeGroups: JurisdictionOfficeGroup[] = slate.map((office) => ({
    key: office.key,
    label: office.label,
    expected: office.expected,
    variable: "variable" in office && office.variable,
    officials: [],
    missing: office.expected,
  }));
  const unmatchedOfficials: Official[] = [];

  for (const official of profiles) {
    const group = officeGroups.find((office) => matchesOffice(official.position ?? "", office.key, office.label));
    if (group) group.officials.push(official);
    else unmatchedOfficials.push(official);
  }
  for (const group of officeGroups) {
    group.missing = Math.max(0, group.expected - group.officials.length);
  }

  return {
    kind,
    slug,
    name: county ? `${county.name} County` : place!.name,
    county: counties[0],
    counties,
    districts,
    profileCount: profiles.length,
    sourceLinkedCount: profiles.filter(hasLinkedSource).length,
    missingOfficeCount: officeGroups.reduce((total, group) => total + group.missing, 0),
    missingOfficeFamilyCount: officeGroups.filter((group) => group.missing > 0).length,
    expected: officeGroups.reduce((total, group) => total + group.expected, 0),
    href: jurisdictionHref(kind, slug),
    officials: profiles,
    officeGroups,
    unmatchedOfficials,
  };
}

/** County summaries first, then every municipality in the current working set. */
export function getJurisdictionSummaries(officials: Official[]): JurisdictionSummary[] {
  return [
    ...FOOTPRINT_COUNTIES.map((county) => getJurisdictionRecord("county", county.slug, officials)!),
    ...FOOTPRINT_PLACES.map((place) => getJurisdictionRecord("city", place.slug, officials)!),
  ].map((record) => ({
    kind: record.kind,
    slug: record.slug,
    name: record.name,
    county: record.county,
    counties: record.counties,
    districts: record.districts,
    profileCount: record.profileCount,
    sourceLinkedCount: record.sourceLinkedCount,
    missingOfficeCount: record.missingOfficeCount,
    missingOfficeFamilyCount: record.missingOfficeFamilyCount,
    expected: record.expected,
    href: record.href,
  }));
}
