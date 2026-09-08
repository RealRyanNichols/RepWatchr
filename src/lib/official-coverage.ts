import { cache } from "react";
import type { Official } from "@/types";
import { getAllOfficials } from "@/lib/data";
import { getAllNationalJurisdictions } from "@/data/national-buildout";
import { EAST_TEXAS_PRIORITY_DISTRICTS } from "@/lib/school-board-research";
import {
  getSchoolBoardSearchIndex,
  isVacancyRecord,
} from "@/lib/school-board-search";

const stateCodes = new Set(
  getAllNationalJurisdictions().map((state) => state.code),
);
const jurisdictionNames = new Map(
  getAllNationalJurisdictions().map((state) => [
    state.code,
    state.name.toLowerCase(),
  ]),
);

export function officialState(official: Official) {
  const explicit = official.state?.trim().toUpperCase();
  if (explicit && stateCodes.has(explicit)) return explicit;
  // A public postal address is stronger evidence than assuming all local records are Texas.
  const postal = official.contactInfo.office?.match(
    /,\s*([A-Z]{2})\s+\d{5}(?:-\d{4})?\b/,
  );
  if (postal && stateCodes.has(postal[1])) return postal[1];
  if (
    /texas|\btx\b/i.test(
      `${official.jurisdiction} ${official.county.join(" ")}`,
    )
  )
    return "TX";
  return "";
}

export function countyName(value: string) {
  return value.replace(/\s+County$/i, "").trim();
}

export function officialCounties(official: Official) {
  // Some legislative imports put the state name in the county field.
  const stateName = jurisdictionNames.get(officialState(official));
  return official.county
    .map(countyName)
    .filter((county) => county && county.toLowerCase() !== stateName);
}

export const getOfficialCoverage = cache(() => {
  const officials = getAllOfficials();
  const school = getSchoolBoardSearchIndex();
  const now = Date.now();
  const staleOfficialRecords = officials.filter((official) => {
    const date = Date.parse(official.lastVerifiedAt ?? "");
    return !Number.isFinite(date) || now - date > 90 * 86400000;
  }).length;
  const districtIds = new Set(
    school.dossiers.map(
      (candidate) => `${candidate.state}:${candidate.district_slug}`,
    ),
  );
  const states = getAllNationalJurisdictions()
    .map((state) => {
      const profiles = officials.filter(
        (official) => officialState(official) === state.code,
      );
      const research = school.rows.filter((row) => row.state === state.code);
      return {
        code: state.code,
        name: state.name,
        officialProfiles: profiles.length,
        federal: profiles.filter((official) => official.level === "federal")
          .length,
        state: profiles.filter((official) => official.level === "state").length,
        county: profiles.filter((official) => official.level === "county")
          .length,
        city: profiles.filter((official) => official.level === "city").length,
        schoolProfiles: profiles.filter(
          (official) => official.level === "school-board",
        ).length,
        schoolResearch: research.length,
        schoolDistricts: new Set(
          school.dossiers
            .filter((candidate) => candidate.state === state.code)
            .map((candidate) => candidate.district_slug),
        ).size,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const priorityDistricts = EAST_TEXAS_PRIORITY_DISTRICTS.map((district) => {
    const dossiers = school.dossiers.filter(
      (candidate) =>
        candidate.district_slug === district.district_slug &&
        !isVacancyRecord(candidate),
    );
    return {
      ...district,
      namedRecords: dossiers.length,
      snapshots: dossiers.filter((candidate) => candidate.source_snapshot)
        .length,
    };
  });
  const localCounties = [
    "Harrison",
    "Marion",
    "Gregg",
    "Upshur",
    "Panola",
    "Rusk",
    "Cass",
    "Bowie",
    "Smith",
  ].map((county) => ({
    county,
    officialProfiles: officials.filter(
      (official) =>
        officialState(official) === "TX" &&
        official.county.some(
          (value) => countyName(value).toLowerCase() === county.toLowerCase(),
        ),
    ).length,
    schoolDistricts: new Set(
      school.dossiers
        .filter(
          (candidate) =>
            candidate.state === "TX" &&
            candidate.county
              .split(/[/,]/)
              .some(
                (value) =>
                  countyName(value).toLowerCase() === county.toLowerCase(),
              ),
        )
        .map((candidate) => candidate.district_slug),
    ).size,
  }));
  return {
    generatedAt: new Date().toISOString().slice(0, 10),
    officialProfiles: officials.length,
    sourceLinkedProfiles: officials.filter(
      (official) => official.sourceLinks?.length,
    ).length,
    staleOfficialRecords,
    stateUnknownProfiles: officials.filter(
      (official) => !officialState(official),
    ).length,
    schoolNamedRecords: school.namedRecords,
    schoolSearchRecords: school.rows.length,
    schoolSnapshotRecords: school.snapshotRecords,
    schoolDistricts: districtIds.size,
    excludedVacancies: school.excludedVacancies,
    linkedSchoolRecords: school.linkedRecords,
    searchRecords: officials.length + school.rows.length,
    states,
    priorityDistricts,
    localCounties,
  };
});
