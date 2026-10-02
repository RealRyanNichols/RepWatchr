import type { Official } from "@/types";
import { getAllNationalJurisdictions } from "@/data/national-buildout";

// Ryan's October 2, 2026 coverage scope: all Texas officials, HD7/TX01 first.
export const OFFICIAL_COVERAGE_STATE = "TX";
const stateCodes = new Set(getAllNationalJurisdictions().map((state) => state.code));

export function officialState(official: Official): string {
  const explicit = official.state?.trim().toUpperCase();
  if (explicit && stateCodes.has(explicit)) return explicit;
  const postal = official.contactInfo.office?.match(/,\s*([A-Z]{2})\s+\d{5}(?:-\d{4})?\b/);
  if (postal && stateCodes.has(postal[1])) return postal[1];
  if (/texas|\btx\b/i.test(`${official.jurisdiction} ${official.county.join(" ")}`)) return "TX";
  return "";
}

export function isTexasOfficial(official: Official): boolean {
  return officialState(official) === OFFICIAL_COVERAGE_STATE;
}
