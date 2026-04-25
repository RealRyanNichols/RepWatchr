// Client-safe list of school-board district slugs. Mirrors
// EAST_TEXAS_PRIORITY_DISTRICTS in src/lib/school-board-research.ts so
// components that cannot import the server-side research helper can still
// detect school-board candidate IDs and build canonical URLs for them.

export const SCHOOL_BOARD_DISTRICT_SLUGS = [
  "harleton_isd",
  "marshall_isd",
  "jefferson_isd",
  "longview_isd",
  "waskom_isd",
  "hallsville_isd",
  "ore_city_isd",
  "new_diana_isd",
  "pine_tree_isd",
  "kilgore_isd",
  "carthage_isd",
  "lufkin_isd",
  "mount_pleasant_isd",
  "whitehouse_isd",
  "lindale_isd",
  "tyler_isd",
  "athens_isd",
  "sulphur_springs_isd",
  "texarkana_isd",
  "henderson_isd",
  "tatum_isd",
  "plano_isd",
  "frisco_isd",
  "houston_isd",
  "dallas_isd",
  "austin_isd",
  "san_antonio_isd",
  "fort_worth_isd",
  "katy_isd",
  "cypress_fairbanks_isd",
  "round_rock_isd",
  "killeen_isd",
  "conroe_isd",
  "northside_isd",
  "allen_isd",
  "mckinney_isd",
  "prosper_isd",
  "garland_isd",
  "mesquite_isd",
  "richardson_isd",
  "spring_branch_isd",
  "fort_bend_isd",
  "pasadena_isd",
  "aldine_isd",
  "leander_isd",
  "hays_cisd",
] as const;

export type SchoolBoardDistrictSlug = (typeof SCHOOL_BOARD_DISTRICT_SLUGS)[number];

export function detectSchoolBoardCandidate(
  officialId: string
): { districtSlug: SchoolBoardDistrictSlug; candidateId: string } | null {
  for (const slug of SCHOOL_BOARD_DISTRICT_SLUGS) {
    const suffix = `_${slug}`;
    if (officialId.endsWith(suffix)) {
      return { districtSlug: slug, candidateId: officialId };
    }
  }
  return null;
}

export function urlForOfficialOrCandidate(officialId: string): string {
  const match = detectSchoolBoardCandidate(officialId);
  if (match) {
    return `/school-boards/${match.districtSlug.replaceAll("_", "-")}/${match.candidateId.replaceAll("_", "-")}`;
  }
  return `/officials/${officialId}`;
}

export function displayNameFromId(officialId: string): string {
  const match = detectSchoolBoardCandidate(officialId);
  if (match) {
    const namePart = officialId.slice(0, officialId.length - match.districtSlug.length - 1);
    return namePart.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return officialId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
