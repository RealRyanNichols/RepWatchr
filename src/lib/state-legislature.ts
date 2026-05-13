import { getAllNationalJurisdictions } from "@/data/national-buildout";
import { getAllOfficials, getAllScoreCards, getPublicVoteRecord } from "@/lib/data";
import type { Official } from "@/types";

export const stateLegislatorPositions = new Set([
  "State Representative",
  "State Senator",
  "Assemblymember",
  "Delegate",
  "Councilmember",
  "Territorial Representative",
  "Territorial Senator",
]);

const lowerChamberPositions = new Set([
  "State Representative",
  "Assemblymember",
  "Delegate",
  "Councilmember",
  "Territorial Representative",
]);

const upperChamberPositions = new Set(["State Senator", "Territorial Senator"]);

export interface StateLegislatureBuildoutRow {
  code: string;
  name: string;
  totalProfiles: number;
  lowerChamberProfiles: number;
  upperChamberProfiles: number;
  profilesWithPhotos: number;
  profilesMissingPhotos: number;
  profilesWithSourceLinks: number;
  profilesWithWebsites: number;
  profilesWithVoteRecords: number;
  profilesWithScorecards: number;
  completionPercent: number;
  href: string;
}

export interface StateLegislatureBuildoutStats {
  totalProfiles: number;
  lowerChamberProfiles: number;
  upperChamberProfiles: number;
  otherLegislativeProfiles: number;
  jurisdictionsLoaded: number;
  profilesWithPhotos: number;
  profilesMissingPhotos: number;
  profilesWithSourceLinks: number;
  profilesWithWebsites: number;
  profilesWithVoteRecords: number;
  profilesWithScorecards: number;
  averageStateCompletionPercent: number;
  rows: StateLegislatureBuildoutRow[];
}

export function isStateLegislator(official: Official) {
  return official.level === "state" && stateLegislatorPositions.has(official.position);
}

export function getAllStateLegislators() {
  return getAllOfficials().filter(isStateLegislator);
}

function buildCompletionPercent(row: Omit<StateLegislatureBuildoutRow, "completionPercent" | "href">) {
  if (row.totalProfiles === 0) return 0;
  const photo = row.profilesWithPhotos / row.totalProfiles;
  const source = row.profilesWithSourceLinks / row.totalProfiles;
  const website = row.profilesWithWebsites / row.totalProfiles;
  const voteRecord = row.profilesWithVoteRecords / row.totalProfiles;
  const scorecard = row.profilesWithScorecards / row.totalProfiles;

  return Math.round(
    Math.min(1, source) * 28 +
      Math.min(1, website) * 22 +
      Math.min(1, photo) * 22 +
      Math.min(1, voteRecord) * 18 +
      Math.min(1, scorecard) * 10,
  );
}

export function getStateLegislatureBuildoutStats(): StateLegislatureBuildoutStats {
  const legislators = getAllStateLegislators();
  const scoreCardIds = new Set(getAllScoreCards().map((scoreCard) => scoreCard.officialId));
  const jurisdictionNames = new Map(getAllNationalJurisdictions().map((jurisdiction) => [jurisdiction.code, jurisdiction.name]));
  const rowsByCode = new Map<string, Omit<StateLegislatureBuildoutRow, "completionPercent" | "href">>();

  function rowFor(code: string) {
    const existing = rowsByCode.get(code);
    if (existing) return existing;

    const row = {
      code,
      name: jurisdictionNames.get(code) ?? code,
      totalProfiles: 0,
      lowerChamberProfiles: 0,
      upperChamberProfiles: 0,
      profilesWithPhotos: 0,
      profilesMissingPhotos: 0,
      profilesWithSourceLinks: 0,
      profilesWithWebsites: 0,
      profilesWithVoteRecords: 0,
      profilesWithScorecards: 0,
    };
    rowsByCode.set(code, row);
    return row;
  }

  for (const official of legislators) {
    const code = (official.state ?? "US").toUpperCase();
    const row = rowFor(code);
    row.totalProfiles += 1;
    if (lowerChamberPositions.has(official.position)) row.lowerChamberProfiles += 1;
    if (upperChamberPositions.has(official.position)) row.upperChamberProfiles += 1;
    if (official.photo) row.profilesWithPhotos += 1;
    if (!official.photo) row.profilesMissingPhotos += 1;
    if ((official.sourceLinks?.length ?? 0) > 0) row.profilesWithSourceLinks += 1;
    if (official.contactInfo.website) row.profilesWithWebsites += 1;
    if (getPublicVoteRecord(official.id)) row.profilesWithVoteRecords += 1;
    if (scoreCardIds.has(official.id)) row.profilesWithScorecards += 1;
  }

  const rows = Array.from(rowsByCode.values())
    .map((row) => ({
      ...row,
      completionPercent: buildCompletionPercent(row),
      href: `/officials?state=${row.code}&level=state`,
    }))
    .sort((a, b) => b.completionPercent - a.completionPercent || b.totalProfiles - a.totalProfiles || a.name.localeCompare(b.name));

  const totals = rows.reduce(
    (acc, row) => {
      acc.totalProfiles += row.totalProfiles;
      acc.lowerChamberProfiles += row.lowerChamberProfiles;
      acc.upperChamberProfiles += row.upperChamberProfiles;
      acc.profilesWithPhotos += row.profilesWithPhotos;
      acc.profilesMissingPhotos += row.profilesMissingPhotos;
      acc.profilesWithSourceLinks += row.profilesWithSourceLinks;
      acc.profilesWithWebsites += row.profilesWithWebsites;
      acc.profilesWithVoteRecords += row.profilesWithVoteRecords;
      acc.profilesWithScorecards += row.profilesWithScorecards;
      return acc;
    },
    {
      totalProfiles: 0,
      lowerChamberProfiles: 0,
      upperChamberProfiles: 0,
      profilesWithPhotos: 0,
      profilesMissingPhotos: 0,
      profilesWithSourceLinks: 0,
      profilesWithWebsites: 0,
      profilesWithVoteRecords: 0,
      profilesWithScorecards: 0,
    },
  );

  const completionTotal = rows.reduce((sum, row) => sum + row.completionPercent, 0);

  return {
    ...totals,
    otherLegislativeProfiles: Math.max(0, totals.totalProfiles - totals.lowerChamberProfiles - totals.upperChamberProfiles),
    jurisdictionsLoaded: rows.length,
    averageStateCompletionPercent: rows.length > 0 ? Math.round(completionTotal / rows.length) : 0,
    rows,
  };
}
