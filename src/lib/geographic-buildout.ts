import { getAllNationalJurisdictions } from "@/data/national-buildout";
import texasVoterRegistrationSnapshot from "@/data/texas-voter-registration-march-2026.json";
import { getAllOfficials, getAllScoreCards } from "@/lib/data";
import {
  getSchoolBoardCompletionReport,
  getSchoolBoardDistricts,
  getSchoolBoardStats,
} from "@/lib/school-board-research";
import { getAttorneyWatchProfiles, getMediaWatchProfiles, getPublicSafetyWatchProfiles } from "@/lib/power-watch";
import type { GovernmentLevel, Official } from "@/types";
import type { PublicPowerProfile } from "@/types/power-watch";

type GeographyKind = "state" | "county" | "city" | "district";

export interface GeographicBuildoutRow {
  id: string;
  kind: GeographyKind;
  code?: string;
  name: string;
  state: string;
  status: "loaded" | "partial" | "queued";
  completionPercent: number;
  loadedLanes: number;
  totalLanes: number;
  officialProfiles: number;
  federalOfficials: number;
  stateOfficials: number;
  countyOfficials: number;
  cityOfficials: number;
  schoolBoardMembers: number;
  schoolDistricts: number;
  attorneyProfiles: number;
  mediaProfiles: number;
  publicSafetyProfiles: number;
  sourceLinks: number;
  topGap: string;
  href?: string;
}

export interface CountyCivicRollSignal {
  sourceTitle: string;
  sourceUrl: string;
  snapshotLabel: string;
  precincts: number;
  voterRegistration: number;
  suspenseVoters: number;
  nonSuspenseVoters: number;
  suspensePercent: number;
  nonSuspensePercent: number;
  statewideSuspensePercent: number;
  attentionLabel: string;
}

export interface CountyCompletionRaceRow extends GeographicBuildoutRow {
  rank: number;
  totalProfiles: number;
  neededToGreen: number;
  raceScore: number;
  civicRollSignal?: CountyCivicRollSignal;
}

interface OfficialRollup {
  total: number;
  byLevel: Record<GovernmentLevel, number>;
  withPhotos: number;
  withSources: number;
  withWebsites: number;
  reviewed: number;
  scored: number;
  sourceUrls: Set<string>;
}

interface PowerRollup {
  total: number;
  buildoutTotal: number;
  sourceUrls: Set<string>;
}

interface SchoolRollup {
  members: number;
  districts: number;
  completionTotal: number;
  sourceUrls: Set<string>;
}

type TexasVoterCountyRow = (typeof texasVoterRegistrationSnapshot.counties)[number];

function normalizeCountyLookupName(value: string) {
  return value
    .replace(/\s+County$/i, "")
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase();
}

const texasVoterCountyLookup = new Map(
  texasVoterRegistrationSnapshot.counties.map((county: TexasVoterCountyRow) => [
    normalizeCountyLookupName(county.countyName),
    county,
  ]),
);

const emptyLevelCounts: Record<GovernmentLevel, number> = {
  federal: 0,
  state: 0,
  county: 0,
  city: 0,
  "school-board": 0,
};

function makeOfficialRollup(): OfficialRollup {
  return {
    total: 0,
    byLevel: { ...emptyLevelCounts },
    withPhotos: 0,
    withSources: 0,
    withWebsites: 0,
    reviewed: 0,
    scored: 0,
    sourceUrls: new Set<string>(),
  };
}

function makePowerRollup(): PowerRollup {
  return { total: 0, buildoutTotal: 0, sourceUrls: new Set<string>() };
}

function makeSchoolRollup(): SchoolRollup {
  return { members: 0, districts: 0, completionTotal: 0, sourceUrls: new Set<string>() };
}

function splitCountyNames(value?: string) {
  return (value ?? "")
    .split(/[\/,]/)
    .map((county) => county.trim())
    .filter(Boolean);
}

function addSource(sourceUrls: Set<string>, url?: string) {
  if (url) sourceUrls.add(url);
}

function officialCompletion(rollup: OfficialRollup) {
  if (rollup.total === 0) return 0;
  const photo = rollup.withPhotos / rollup.total;
  const sources = rollup.withSources / rollup.total;
  const contact = rollup.withWebsites / rollup.total;
  const review = rollup.reviewed / rollup.total;
  const scoringBase = Math.max(1, rollup.total - rollup.byLevel["school-board"]);
  const scoring = rollup.scored / scoringBase;

  return Math.round(
    Math.min(1, photo) * 20 +
      Math.min(1, sources) * 30 +
      Math.min(1, contact) * 15 +
      Math.min(1, review) * 20 +
      Math.min(1, scoring) * 15,
  );
}

function powerCompletion(rollup: PowerRollup) {
  if (rollup.total === 0) return 0;
  return Math.round(rollup.buildoutTotal / rollup.total);
}

function schoolCompletion(rollup: SchoolRollup) {
  if (rollup.districts === 0) return 0;
  return Math.round(rollup.completionTotal / rollup.districts);
}

function statusFrom(completionPercent: number, totalProfiles: number): GeographicBuildoutRow["status"] {
  if (completionPercent >= 75) return "loaded";
  if (totalProfiles > 0 || completionPercent > 0) return "partial";
  return "queued";
}

function loadedLaneCount(
  officials: OfficialRollup,
  schools: SchoolRollup,
  attorneys: PowerRollup,
  media: PowerRollup,
  publicSafety: PowerRollup,
) {
  return [officials.total, schools.members + schools.districts, attorneys.total, media.total, publicSafety.total].filter((value) => value > 0).length;
}

function topGap(
  kind: GeographyKind,
  officials: OfficialRollup,
  schools: SchoolRollup,
  attorneys: PowerRollup,
  media: PowerRollup,
  publicSafety: PowerRollup,
) {
  if (officials.total + schools.members + attorneys.total + media.total + publicSafety.total === 0) {
    return kind === "state" ? "Source import queued for this state." : "No source-backed profiles loaded yet.";
  }
  if (officialCompletion(officials) < 50 && officials.total > 0) return "Officials need photos, sources, scorecards, or review status.";
  if (schools.districts > 0 && schoolCompletion(schools) < 60) return "School districts need more roster, source, and member profile work.";
  if (attorneys.total > 0 && powerCompletion(attorneys) < 60) return "Attorney records need deeper profile buildout and review.";
  if (media.total > 0 && powerCompletion(media) < 60) return "Media records need deeper profile buildout and review.";
  if (publicSafety.total > 0 && powerCompletion(publicSafety) < 60) return "Public-safety records need policies, complaint paths, photos, TCOLE checks, and case links.";
  return "Keep adding current source links, public statements, and profile photos.";
}

function combinePercent(values: number[]) {
  const loaded = values.filter((value) => value > 0);
  if (loaded.length === 0) return 0;
  return Math.round(loaded.reduce((sum, value) => sum + value, 0) / loaded.length);
}

function rollupOfficial(rollup: OfficialRollup, official: Official, scoredOfficialIds: Set<string>) {
  rollup.total += 1;
  rollup.byLevel[official.level] = (rollup.byLevel[official.level] ?? 0) + 1;
  if (official.photo) rollup.withPhotos += 1;
  if ((official.sourceLinks?.length ?? 0) > 0 || official.photoSourceUrl || official.contactInfo.website) {
    rollup.withSources += 1;
  }
  if (official.contactInfo.website) rollup.withWebsites += 1;
  if (official.reviewStatus && official.reviewStatus !== "needs_source_review") rollup.reviewed += 1;
  if (scoredOfficialIds.has(official.id)) rollup.scored += 1;
  official.sourceLinks?.forEach((source) => addSource(rollup.sourceUrls, source.url));
  addSource(rollup.sourceUrls, official.photoSourceUrl);
  addSource(rollup.sourceUrls, official.contactInfo.website);
}

function rollupPower(rollup: PowerRollup, profile: PublicPowerProfile) {
  rollup.total += 1;
  rollup.buildoutTotal += profile.buildoutPercent;
  profile.sourceLinks.forEach((source) => addSource(rollup.sourceUrls, source.url));
}

function getOrCreate<K, V>(map: Map<K, V>, key: K, makeValue: () => V) {
  const existing = map.get(key);
  if (existing) return existing;
  const value = makeValue();
  map.set(key, value);
  return value;
}

function stateLabel(code: string) {
  return getAllNationalJurisdictions().find((state) => state.code === code)?.name ?? code;
}

function makeRow(
  kind: GeographyKind,
  id: string,
  name: string,
  state: string,
  officials: OfficialRollup,
  schools: SchoolRollup,
  attorneys: PowerRollup,
  media: PowerRollup,
  publicSafety: PowerRollup,
  href?: string,
  code?: string,
): GeographicBuildoutRow {
  const completionPercent = combinePercent([
    officialCompletion(officials),
    schoolCompletion(schools),
    powerCompletion(attorneys),
    powerCompletion(media),
    powerCompletion(publicSafety),
  ]);
  const totalProfiles = officials.total + schools.members + attorneys.total + media.total + publicSafety.total;
  const sourceLinks = new Set<string>([
    ...officials.sourceUrls,
    ...schools.sourceUrls,
    ...attorneys.sourceUrls,
    ...media.sourceUrls,
    ...publicSafety.sourceUrls,
  ]).size;

  return {
    id,
    kind,
    code,
    name,
    state,
    status: statusFrom(completionPercent, totalProfiles),
    completionPercent,
    loadedLanes: loadedLaneCount(officials, schools, attorneys, media, publicSafety),
    totalLanes: 5,
    officialProfiles: officials.total,
    federalOfficials: officials.byLevel.federal,
    stateOfficials: officials.byLevel.state,
    countyOfficials: officials.byLevel.county,
    cityOfficials: officials.byLevel.city,
    schoolBoardMembers: schools.members,
    schoolDistricts: schools.districts,
    attorneyProfiles: attorneys.total,
    mediaProfiles: media.total,
    publicSafetyProfiles: publicSafety.total,
    sourceLinks,
    topGap: topGap(kind, officials, schools, attorneys, media, publicSafety),
    href,
  };
}

function roundTenth(value: number) {
  return Math.round(value * 10) / 10;
}

function getTotalProfiles(row: GeographicBuildoutRow) {
  return row.officialProfiles + row.schoolBoardMembers + row.attorneyProfiles + row.mediaProfiles + row.publicSafetyProfiles;
}

function civicAttentionLabel(signal: Pick<CountyCivicRollSignal, "suspensePercent" | "voterRegistration">) {
  if (signal.suspensePercent >= 10) return "High suspense share";
  if (signal.suspensePercent >= 6.5) return "Above-state suspense share";
  if (signal.voterRegistration >= 500000) return "Large county voter pool";
  return "County voter-roll signal loaded";
}

function getCivicRollSignal(row: GeographicBuildoutRow): CountyCivicRollSignal | undefined {
  if (row.kind !== "county" || row.state !== "TX") return undefined;
  const county = texasVoterCountyLookup.get(normalizeCountyLookupName(row.name));
  if (!county) return undefined;

  const statewide = texasVoterRegistrationSnapshot.statewideTotal;
  const suspensePercent = roundTenth((county.suspenseVoters / Math.max(1, county.voterRegistration)) * 100);
  const nonSuspensePercent = roundTenth((county.nonSuspenseVoters / Math.max(1, county.voterRegistration)) * 100);
  const statewideSuspensePercent = roundTenth((statewide.suspenseVoters / Math.max(1, statewide.voterRegistration)) * 100);

  return {
    sourceTitle: texasVoterRegistrationSnapshot.meta.sourceTitle,
    sourceUrl: texasVoterRegistrationSnapshot.meta.sourceUrl,
    snapshotLabel: texasVoterRegistrationSnapshot.meta.snapshotLabel,
    precincts: county.precincts,
    voterRegistration: county.voterRegistration,
    suspenseVoters: county.suspenseVoters,
    nonSuspenseVoters: county.nonSuspenseVoters,
    suspensePercent,
    nonSuspensePercent,
    statewideSuspensePercent,
    attentionLabel: civicAttentionLabel({ suspensePercent, voterRegistration: county.voterRegistration }),
  };
}

function makeCountyRaceRows(countyRows: GeographicBuildoutRow[]): CountyCompletionRaceRow[] {
  return countyRows
    .map((row) => {
      const civicRollSignal = getCivicRollSignal(row);
      const totalProfiles = getTotalProfiles(row);
      const civicBoost = civicRollSignal
        ? Math.min(50, civicRollSignal.voterRegistration / 25000) + civicRollSignal.suspensePercent * 2
        : 0;
      const raceScore =
        row.completionPercent * 4 +
        row.loadedLanes * 20 +
        row.sourceLinks * 0.15 +
        totalProfiles * 0.03 +
        civicBoost;

      return {
        ...row,
        rank: 0,
        totalProfiles,
        neededToGreen: Math.max(0, 75 - row.completionPercent),
        raceScore: Math.round(raceScore),
        civicRollSignal,
      };
    })
    .sort(
      (a, b) =>
        b.completionPercent - a.completionPercent ||
        b.loadedLanes - a.loadedLanes ||
        b.sourceLinks - a.sourceLinks ||
        b.totalProfiles - a.totalProfiles ||
        (b.civicRollSignal?.voterRegistration ?? 0) - (a.civicRollSignal?.voterRegistration ?? 0) ||
        a.name.localeCompare(b.name),
    )
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export function getGeographicBuildoutDashboard() {
  const jurisdictions = getAllNationalJurisdictions();
  const officials = getAllOfficials();
  const scoredOfficialIds = new Set(getAllScoreCards().map((scoreCard) => scoreCard.officialId));
  const schoolDistricts = getSchoolBoardDistricts();
  const schoolReport = getSchoolBoardCompletionReport();
  const schoolStats = getSchoolBoardStats();
  const attorneyProfiles = getAttorneyWatchProfiles();
  const mediaProfiles = getMediaWatchProfiles();
  const publicSafetyProfiles = getPublicSafetyWatchProfiles();

  const stateOfficials = new Map<string, OfficialRollup>();
  const stateSchools = new Map<string, SchoolRollup>();
  const stateAttorneys = new Map<string, PowerRollup>();
  const stateMedia = new Map<string, PowerRollup>();
  const statePublicSafety = new Map<string, PowerRollup>();
  const countyOfficials = new Map<string, OfficialRollup>();
  const countySchools = new Map<string, SchoolRollup>();
  const countyAttorneys = new Map<string, PowerRollup>();
  const countyMedia = new Map<string, PowerRollup>();
  const countyPublicSafety = new Map<string, PowerRollup>();
  const cityOfficials = new Map<string, OfficialRollup>();
  const cityAttorneys = new Map<string, PowerRollup>();
  const cityMedia = new Map<string, PowerRollup>();
  const cityPublicSafety = new Map<string, PowerRollup>();

  officials.forEach((official) => {
    const state = (official.state ?? "TX").toUpperCase();
    rollupOfficial(getOrCreate(stateOfficials, state, makeOfficialRollup), official, scoredOfficialIds);
    official.county.forEach((county) => {
      rollupOfficial(getOrCreate(countyOfficials, `${state}:${county}`, makeOfficialRollup), official, scoredOfficialIds);
    });
    if (official.level === "city") {
      rollupOfficial(getOrCreate(cityOfficials, `${state}:${official.jurisdiction}`, makeOfficialRollup), official, scoredOfficialIds);
    }
  });

  const districtCompletionBySlug = new Map(schoolReport.districtCompletions.map((district) => [district.district_slug, district]));
  schoolDistricts.forEach((district) => {
    const state = "TX";
    const completion = districtCompletionBySlug.get(district.district_slug)?.percent ?? 0;
    const sourceUrls = new Set<string>();
    district.sourceLinks?.forEach((source) => addSource(sourceUrls, source.url));
    district.candidates.forEach((candidate) => {
      candidate.sources?.forEach((source) => addSource(sourceUrls, source.url));
    });

    const stateRollup = getOrCreate(stateSchools, state, makeSchoolRollup);
    stateRollup.members += district.candidates.length;
    stateRollup.districts += 1;
    stateRollup.completionTotal += completion;
    sourceUrls.forEach((url) => stateRollup.sourceUrls.add(url));

    splitCountyNames(district.county).forEach((county) => {
      const countyRollup = getOrCreate(countySchools, `${state}:${county}`, makeSchoolRollup);
      countyRollup.members += district.candidates.length;
      countyRollup.districts += 1;
      countyRollup.completionTotal += completion;
      sourceUrls.forEach((url) => countyRollup.sourceUrls.add(url));
    });
  });

  attorneyProfiles.forEach((profile) => {
    const state = profile.state.toUpperCase();
    rollupPower(getOrCreate(stateAttorneys, state, makePowerRollup), profile);
    splitCountyNames(profile.county).forEach((county) => {
      rollupPower(getOrCreate(countyAttorneys, `${state}:${county}`, makePowerRollup), profile);
    });
    if (profile.city) rollupPower(getOrCreate(cityAttorneys, `${state}:${profile.city}`, makePowerRollup), profile);
  });

  mediaProfiles.forEach((profile) => {
    const state = profile.state.toUpperCase();
    rollupPower(getOrCreate(stateMedia, state, makePowerRollup), profile);
    splitCountyNames(profile.county).forEach((county) => {
      rollupPower(getOrCreate(countyMedia, `${state}:${county}`, makePowerRollup), profile);
    });
    if (profile.city) rollupPower(getOrCreate(cityMedia, `${state}:${profile.city}`, makePowerRollup), profile);
  });

  publicSafetyProfiles.forEach((profile) => {
    const state = profile.state.toUpperCase();
    rollupPower(getOrCreate(statePublicSafety, state, makePowerRollup), profile);
    splitCountyNames(profile.county).forEach((county) => {
      rollupPower(getOrCreate(countyPublicSafety, `${state}:${county}`, makePowerRollup), profile);
    });
    if (profile.city) rollupPower(getOrCreate(cityPublicSafety, `${state}:${profile.city}`, makePowerRollup), profile);
  });

  const stateRows = jurisdictions.map((jurisdiction) =>
    makeRow(
      "state",
      jurisdiction.code,
      jurisdiction.name,
      jurisdiction.code,
      stateOfficials.get(jurisdiction.code) ?? makeOfficialRollup(),
      stateSchools.get(jurisdiction.code) ?? makeSchoolRollup(),
      stateAttorneys.get(jurisdiction.code) ?? makePowerRollup(),
      stateMedia.get(jurisdiction.code) ?? makePowerRollup(),
      statePublicSafety.get(jurisdiction.code) ?? makePowerRollup(),
      `/officials?state=${jurisdiction.code}`,
      jurisdiction.code,
    ),
  );

  const countyKeys = new Set([
    ...countyOfficials.keys(),
    ...countySchools.keys(),
    ...countyAttorneys.keys(),
    ...countyMedia.keys(),
    ...countyPublicSafety.keys(),
  ]);
  const countyRows = Array.from(countyKeys)
    .map((key) => {
      const [state, county] = key.split(":");
      return makeRow(
        "county",
        key,
        `${county} County`,
        state,
        countyOfficials.get(key) ?? makeOfficialRollup(),
        countySchools.get(key) ?? makeSchoolRollup(),
        countyAttorneys.get(key) ?? makePowerRollup(),
        countyMedia.get(key) ?? makePowerRollup(),
        countyPublicSafety.get(key) ?? makePowerRollup(),
        `/officials?state=${state}`,
      );
    })
    .sort((a, b) => b.completionPercent - a.completionPercent || a.name.localeCompare(b.name));

  const cityKeys = new Set([...cityOfficials.keys(), ...cityAttorneys.keys(), ...cityMedia.keys(), ...cityPublicSafety.keys()]);
  const cityRows = Array.from(cityKeys)
    .map((key) => {
      const [state, city] = key.split(":");
      return makeRow(
        "city",
        key,
        city,
        state,
        cityOfficials.get(key) ?? makeOfficialRollup(),
        makeSchoolRollup(),
        cityAttorneys.get(key) ?? makePowerRollup(),
        cityMedia.get(key) ?? makePowerRollup(),
        cityPublicSafety.get(key) ?? makePowerRollup(),
        `/officials?state=${state}`,
      );
    })
    .sort((a, b) => b.completionPercent - a.completionPercent || a.name.localeCompare(b.name));

  const districtRows = schoolReport.districtCompletions
    .map((district) => ({
      id: district.district_slug,
      kind: "district" as const,
      name: district.district,
      state: "TX",
      status: statusFrom(district.percent, district.totalMembers),
      completionPercent: district.percent,
      loadedLanes: district.totalMembers > 0 ? 1 : 0,
      totalLanes: 1,
      officialProfiles: 0,
      federalOfficials: 0,
      stateOfficials: 0,
      countyOfficials: 0,
      cityOfficials: 0,
      schoolBoardMembers: district.totalMembers,
      schoolDistricts: 1,
      attorneyProfiles: 0,
      mediaProfiles: 0,
      publicSafetyProfiles: 0,
      sourceLinks: district.sourceCount,
      topGap: district.missing[0] ?? "Keep adding current source links and public records.",
      href: `/school-boards/${district.district_slug.replaceAll("_", "-")}`,
    }))
    .sort((a, b) => a.completionPercent - b.completionPercent || a.name.localeCompare(b.name));

  const stateRowsWithLoadedData = stateRows.filter(
    (row) =>
      row.officialProfiles +
        row.schoolBoardMembers +
        row.attorneyProfiles +
        row.mediaProfiles +
        row.publicSafetyProfiles >
      0,
  ).length;
  const countyRaceRows = makeCountyRaceRows(countyRows);
  const nextGreenCountyRows = [...countyRaceRows]
    .filter((row) => row.completionPercent < 75)
    .sort(
      (a, b) =>
        a.neededToGreen - b.neededToGreen ||
        b.loadedLanes - a.loadedLanes ||
        b.sourceLinks - a.sourceLinks ||
        b.totalProfiles - a.totalProfiles ||
        a.name.localeCompare(b.name),
    )
    .slice(0, 12);
  const statewideVoterRegistration = texasVoterRegistrationSnapshot.statewideTotal.voterRegistration;
  const statewideSuspenseVoters = texasVoterRegistrationSnapshot.statewideTotal.suspenseVoters;

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      enabledStatesAndTerritories: jurisdictions.length,
      statesWithLoadedData: stateRowsWithLoadedData,
      queuedStatesAndTerritories: jurisdictions.length - stateRowsWithLoadedData,
      countyRows: countyRows.length,
      cityRows: cityRows.length,
      districtRows: districtRows.length,
      loadedOfficialProfiles: officials.length,
      loadedSchoolBoardMembers: schoolStats.candidates,
      loadedAttorneyProfiles: attorneyProfiles.length,
      loadedMediaProfiles: mediaProfiles.length,
      loadedPublicSafetyProfiles: publicSafetyProfiles.length,
      civicRollCountyRows: texasVoterRegistrationSnapshot.counties.length,
      civicRollRegisteredVoters: statewideVoterRegistration,
      civicRollSuspenseVoters: statewideSuspenseVoters,
      civicRollStatewideSuspensePercent: roundTenth((statewideSuspenseVoters / Math.max(1, statewideVoterRegistration)) * 100),
    },
    stateRows,
    countyRows,
    cityRows,
    districtRows,
    countyRaceRows,
    countyRaceLeaders: countyRaceRows.slice(0, 12),
    nextGreenCountyRows,
    topCountyRows: countyRows.slice(0, 20),
    topCityRows: cityRows.slice(0, 20),
    lowestDistrictRows: districtRows.slice(0, 30),
    civicRollSource: texasVoterRegistrationSnapshot.meta,
    stateLabel,
  };
}
