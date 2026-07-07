import { cache } from "react";
import type { GovernmentLevel, Official, Party, RedFlag } from "@/types";
import {
  getAllOfficials,
  getFundingSummary,
  getPublicVoteRecord,
  getRedFlags,
  getScoreCard,
} from "@/lib/data";
import { buildOfficialCompletionSnapshot, type ProfileCompletionKey } from "@/lib/profile-completion";
import { getMoneyTrailForOfficial } from "@/lib/money-trail";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const officialSearchSortOptions = [
  "relevance",
  "most-viewed",
  "most-watched",
  "most-sourced",
  "highest-score",
  "lowest-score",
  "most-red-flags",
  "recently-updated",
  "missing-source-priority",
] as const;

export type OfficialSearchSort = (typeof officialSearchSortOptions)[number];

export type OfficialScoreRange = "all" | "unscored" | "0-49" | "50-69" | "70-84" | "85-100";
export type OfficialCompletenessRange = "all" | "complete" | "85+" | "55-84" | "0-54";

export interface OfficialSearchParams {
  search: string;
  state: string;
  county: string;
  city: string;
  level: GovernmentLevel | "all";
  officeType: string;
  party: Party | "all";
  scoreRange: OfficialScoreRange;
  hasRedFlags: boolean;
  hasFundingData: boolean;
  hasVotingData: boolean;
  missingSources: boolean;
  recentlyUpdated: boolean;
  watchedByMembers: boolean;
  sourceCount: number;
  completeness: OfficialCompletenessRange;
  sort: OfficialSearchSort;
  page: number;
  perPage: number;
}

export interface OfficialFacetOption {
  value: string;
  label: string;
  count: number;
}

export interface OfficialSearchFacets {
  states: OfficialFacetOption[];
  counties: OfficialFacetOption[];
  cities: OfficialFacetOption[];
  officeTypes: OfficialFacetOption[];
  parties: OfficialFacetOption[];
  levels: OfficialFacetOption[];
}

export interface OfficialSearchRow {
  official: Official;
  score: number | null;
  letterGrade: string | null;
  redFlagCount: number;
  hasFundingData: boolean;
  hasVotingData: boolean;
  missingSources: boolean;
  recentlyUpdated: boolean;
  sourceCount: number;
  profileCompleteness: number;
  completionMissingItems: ProfileCompletionKey[];
  state: string;
  countyValues: string[];
  city: string;
  officeType: string;
  officeTypeLabel: string;
  lastUpdated: string | null;
  voteCount: number;
  fundingCycle: string | null;
  viewCount: number;
  watchCount: number;
  relevanceScore: number;
  missingSourcePriority: number;
  searchText: string;
}

export interface OfficialSearchResult {
  params: OfficialSearchParams;
  rows: OfficialSearchRow[];
  total: number;
  page: number;
  pageCount: number;
  perPage: number;
  activeFilterCount: number;
  facets: OfficialSearchFacets;
  stats: {
    totalProfiles: number;
    sourceLinkedProfiles: number;
    voteLoadedProfiles: number;
    fundingLoadedProfiles: number;
    redFlagProfiles: number;
    missingSourceProfiles: number;
  };
}

type SearchParamsInput = Record<string, string | string[] | undefined>;

const governmentLevels: Array<GovernmentLevel | "all"> = [
  "all",
  "federal",
  "state",
  "county",
  "city",
  "school-board",
];

const parties: Array<Party | "all"> = ["all", "R", "D", "I", "NP", "VR", "VD"];

const officeTypeRules: Array<{
  value: string;
  label: string;
  test: (official: Official) => boolean;
}> = [
  {
    value: "u-s-senator",
    label: "U.S. Senator",
    test: (official) => /u\.?s\.?\s+senator|united states senator/i.test(official.position),
  },
  {
    value: "u-s-representative",
    label: "U.S. Representative",
    test: (official) => /u\.?s\.?\s+representative|congress|house/i.test(official.position),
  },
  {
    value: "state-senator",
    label: "State Senator",
    test: (official) => /state senator|texas senator/i.test(official.position),
  },
  {
    value: "state-representative",
    label: "State Representative",
    test: (official) => /state representative|delegate|assembly/i.test(official.position),
  },
  {
    value: "county-judge",
    label: "County Judge",
    test: (official) => /county judge/i.test(official.position),
  },
  {
    value: "commissioner",
    label: "Commissioner",
    test: (official) => /commissioner/i.test(official.position),
  },
  {
    value: "mayor",
    label: "Mayor",
    test: (official) => /mayor/i.test(official.position),
  },
  {
    value: "council",
    label: "City Council",
    test: (official) => /council/i.test(official.position),
  },
  {
    value: "school-board",
    label: "School Board",
    test: (official) => official.level === "school-board" || /school board|trustee|isd/i.test(official.position),
  },
  {
    value: "court",
    label: "Court / Justice",
    test: (official) => /judge|justice|court/i.test(official.position),
  },
  {
    value: "sheriff",
    label: "Sheriff",
    test: (official) => /sheriff/i.test(official.position),
  },
  {
    value: "district-attorney",
    label: "District Attorney",
    test: (official) => /district attorney|prosecutor/i.test(official.position),
  },
];

const sortOptionSet = new Set<string>(officialSearchSortOptions);
const scoreRanges = new Set<string>(["all", "unscored", "0-49", "50-69", "70-84", "85-100"]);
const completenessRanges = new Set<string>(["all", "complete", "85+", "55-84", "0-54"]);
const recentCutoffMs = 90 * 24 * 60 * 60 * 1000;

function stringParam(params: SearchParamsInput, ...names: string[]) {
  for (const name of names) {
    const value = params[name];
    const first = Array.isArray(value) ? value[0] : value;
    if (typeof first === "string" && first.trim()) return first.trim();
  }
  return "";
}

function numberParam(params: SearchParamsInput, name: string, fallback: number) {
  const value = Number.parseInt(stringParam(params, name), 10);
  return Number.isFinite(value) ? value : fallback;
}

function boolParam(params: SearchParamsInput, ...names: string[]) {
  const value = stringParam(params, ...names).toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function slugify(value: string) {
  return normalize(value).replace(/\s+/g, "-");
}

function titleCase(value: string) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

function parseLevel(value: string): GovernmentLevel | "all" {
  return governmentLevels.includes(value as GovernmentLevel | "all") ? (value as GovernmentLevel | "all") : "all";
}

function parseParty(value: string): Party | "all" {
  return parties.includes(value as Party | "all") ? (value as Party | "all") : "all";
}

function parseSort(value: string): OfficialSearchSort {
  return sortOptionSet.has(value) ? (value as OfficialSearchSort) : "relevance";
}

function parseScoreRange(value: string): OfficialScoreRange {
  return scoreRanges.has(value) ? (value as OfficialScoreRange) : "all";
}

function parseCompleteness(value: string): OfficialCompletenessRange {
  return completenessRanges.has(value) ? (value as OfficialCompletenessRange) : "all";
}

export function parseOfficialSearchParams(params: SearchParamsInput): OfficialSearchParams {
  return {
    search: stringParam(params, "search", "q"),
    state: stringParam(params, "state").toUpperCase(),
    county: stringParam(params, "county"),
    city: stringParam(params, "city"),
    level: parseLevel(stringParam(params, "level")),
    officeType: stringParam(params, "officeType", "office_type"),
    party: parseParty(stringParam(params, "party")),
    scoreRange: parseScoreRange(stringParam(params, "scoreRange", "score_range")),
    hasRedFlags: boolParam(params, "redFlags", "hasRedFlags"),
    hasFundingData: boolParam(params, "funding", "hasFundingData"),
    hasVotingData: boolParam(params, "voting", "hasVotingData"),
    missingSources: boolParam(params, "missingSources", "missing_sources"),
    recentlyUpdated: boolParam(params, "recent", "recentlyUpdated"),
    watchedByMembers: boolParam(params, "watched", "watchedByMembers"),
    sourceCount: Math.max(0, numberParam(params, "sourceCount", 0)),
    completeness: parseCompleteness(stringParam(params, "completeness")),
    sort: parseSort(stringParam(params, "sort")),
    page: Math.max(1, numberParam(params, "page", 1)),
    perPage: Math.min(48, Math.max(12, numberParam(params, "perPage", 24))),
  };
}

function deriveState(official: Official) {
  const explicit = official.state?.trim().toUpperCase();
  if (explicit) return explicit;
  if (/texas|\btx\b/i.test(`${official.jurisdiction} ${official.county.join(" ")}`)) return "TX";
  return "";
}

function deriveCity(official: Official) {
  if (official.level === "city") return official.jurisdiction.replace(/\s+City Council$/i, "").trim();
  const office = official.contactInfo.office ?? "";
  const match = office.match(/,\s*([^,\d]+),\s*[A-Z]{2}\b/);
  return match?.[1]?.trim() ?? "";
}

function deriveOfficeType(official: Official) {
  const matched = officeTypeRules.find((rule) => rule.test(official));
  if (matched) return { value: matched.value, label: matched.label };
  const fallback = official.position || official.level;
  return { value: slugify(fallback), label: fallback };
}

function addSourceUrl(urls: Set<string>, value?: string) {
  if (!value) return;
  const trimmed = value.trim();
  if (!trimmed) return;
  urls.add(trimmed);
}

function sourceCountForOfficial(official: Official, redFlags: RedFlag[]) {
  const funding = getFundingSummary(official.id);
  const voteRecord = getPublicVoteRecord(official.id);
  const urls = new Set<string>();
  official.sourceLinks?.forEach((source) => addSourceUrl(urls, source.url));
  addSourceUrl(urls, official.photoSourceUrl);
  addSourceUrl(urls, official.contactInfo.website);
  funding?.sources.forEach((source) => addSourceUrl(urls, source.url));
  voteRecord?.sourceLinks.forEach((source) => addSourceUrl(urls, source.url));
  voteRecord?.votes.forEach((vote) => {
    addSourceUrl(urls, vote.sourceUrl);
    addSourceUrl(urls, vote.sourceXmlUrl);
    addSourceUrl(urls, vote.sourceLookupUrl);
  });
  redFlags.forEach((flag) => addSourceUrl(urls, flag.sourceUrl));
  return urls.size;
}

function parseDateMs(value?: string | null) {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

function latestDate(...values: Array<string | null | undefined>) {
  const latest = values.reduce((best, value) => Math.max(best, parseDateMs(value)), 0);
  return latest > 0 ? new Date(latest).toISOString().slice(0, 10) : null;
}

function redFlagLatestDate(redFlags: RedFlag[]) {
  return latestDate(...redFlags.map((flag) => flag.date));
}

function scoreInRange(score: number | null, range: OfficialScoreRange) {
  if (range === "all") return true;
  if (range === "unscored") return score === null;
  if (score === null) return false;
  if (range === "0-49") return score >= 0 && score <= 49;
  if (range === "50-69") return score >= 50 && score <= 69;
  if (range === "70-84") return score >= 70 && score <= 84;
  return score >= 85;
}

function completenessInRange(value: number, range: OfficialCompletenessRange) {
  if (range === "all") return true;
  if (range === "complete") return value >= 100;
  if (range === "85+") return value >= 85;
  if (range === "55-84") return value >= 55 && value <= 84;
  return value <= 54;
}

function relevanceFor(row: Pick<OfficialSearchRow, "official" | "searchText" | "sourceCount" | "profileCompleteness" | "redFlagCount" | "viewCount" | "watchCount">, query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return row.sourceCount * 3 + row.profileCompleteness + row.viewCount * 0.75 + row.watchCount * 2;
  }

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  let score = 0;
  const officialName = normalize(row.official.name);
  const position = normalize(row.official.position);
  const jurisdiction = normalize(row.official.jurisdiction);
  const id = normalize(row.official.id);

  if (officialName === normalizedQuery) score += 220;
  if (officialName.startsWith(normalizedQuery)) score += 160;
  if (officialName.includes(normalizedQuery)) score += 110;
  if (id.includes(normalizedQuery)) score += 90;
  if (position.includes(normalizedQuery)) score += 45;
  if (jurisdiction.includes(normalizedQuery)) score += 35;
  score += terms.filter((term) => row.searchText.includes(term)).length * 18;
  score += Math.min(row.sourceCount, 20) * 2;
  score += row.profileCompleteness / 5;
  score += row.redFlagCount * 3;
  score += Math.min(row.viewCount, 200) * 0.1;
  score += Math.min(row.watchCount, 100) * 0.5;
  return score;
}

function missingSourcePriority(row: {
  completionMissingItems: ProfileCompletionKey[];
  sourceCount: number;
  hasVotingData: boolean;
  hasFundingData: boolean;
  redFlagCount: number;
  profileCompleteness: number;
}) {
  let score = Math.max(0, 100 - row.profileCompleteness);
  if (row.completionMissingItems.includes("public_sources")) score += 45;
  if (row.completionMissingItems.includes("vote_record") || !row.hasVotingData) score += 30;
  if (row.completionMissingItems.includes("funding") || !row.hasFundingData) score += 20;
  if (row.completionMissingItems.includes("photo")) score += 8;
  if (row.redFlagCount > 0 && row.sourceCount < 3) score += 20;
  if (row.sourceCount === 0) score += 35;
  return score;
}

function pathToOfficialId(path: string) {
  const match = path.match(/^\/officials\/([^/?#]+)$/);
  return match?.[1] ?? null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function objectString(value: unknown, key: string) {
  if (!isObject(value)) return "";
  const field = value[key];
  return typeof field === "string" ? field : "";
}

function watchedOfficialId(row: unknown) {
  const href = objectString(row, "href");
  const idFromHref = pathToOfficialId(href);
  if (idFromHref) return idFromHref;
  if (!isObject(row)) return null;
  const metadata = row.metadata;
  if (!isObject(metadata)) return null;
  const profileId = metadata.profileId ?? metadata.officialId ?? metadata.id;
  return typeof profileId === "string" && profileId.trim() ? profileId.trim() : null;
}

async function loadOfficialEngagementStats() {
  const admin = getSupabaseAdminClient();
  const viewCounts = new Map<string, number>();
  const watchCounts = new Map<string, number>();
  if (!admin) return { viewCounts, watchCounts };

  const [viewResult, watchResult] = await Promise.all([
    admin.from("site_page_views").select("path").like("path", "/officials/%").limit(5000),
    admin.from("member_tracked_items").select("href,metadata").eq("item_type", "official").limit(5000),
  ]);

  if (!viewResult.error && Array.isArray(viewResult.data)) {
    for (const row of viewResult.data) {
      const id = pathToOfficialId(objectString(row, "path"));
      if (id) viewCounts.set(id, (viewCounts.get(id) ?? 0) + 1);
    }
  }

  if (!watchResult.error && Array.isArray(watchResult.data)) {
    for (const row of watchResult.data) {
      const id = watchedOfficialId(row);
      if (id) watchCounts.set(id, (watchCounts.get(id) ?? 0) + 1);
    }
  }

  return { viewCounts, watchCounts };
}

const getStaticOfficialRows = cache(() => {
  return getAllOfficials().map((official) => {
    const scoreCard = getScoreCard(official.id);
    const funding = getFundingSummary(official.id);
    const moneyTrail = getMoneyTrailForOfficial(official.id);
    const voteRecord = getPublicVoteRecord(official.id);
    const redFlags = getRedFlags(official.id);
    const completion = buildOfficialCompletionSnapshot(official);
    const state = deriveState(official);
    const city = deriveCity(official);
    const officeType = deriveOfficeType(official);
    const lastUpdated = latestDate(
      official.lastVerifiedAt,
      scoreCard?.lastUpdated,
      funding?.lastUpdated,
      voteRecord?.lastUpdated,
      redFlagLatestDate(redFlags),
    );
    const sourceCount = Math.max(sourceCountForOfficial(official, redFlags), moneyTrail?.sourceCount ?? 0);
    const rowBase = {
      official,
      score: scoreCard?.overall ?? null,
      letterGrade: scoreCard?.letterGrade ?? null,
      redFlagCount: redFlags.length,
      hasFundingData: Boolean(funding),
      hasVotingData: Boolean(voteRecord?.votes.length || scoreCard),
      sourceCount,
      profileCompleteness: completion.completionPercent,
      completionMissingItems: completion.missingItems,
      state,
      countyValues: official.county,
      city,
      officeType: officeType.value,
      officeTypeLabel: officeType.label,
      lastUpdated,
      voteCount: voteRecord?.votes.length ?? 0,
      fundingCycle: funding?.cycle ?? null,
      searchText: normalize(
        [
          official.id,
          official.name,
          official.position,
          official.district ?? "",
          official.jurisdiction,
          state,
          city,
          officeType.label,
          official.county.join(" "),
          moneyTrail?.cycles.join(" ") ?? "",
          moneyTrail?.committees.map((committee) => committee.name).join(" ") ?? "",
          moneyTrail?.donorEntities.map((donor) => `${donor.name} ${donor.donorType}`).join(" ") ?? "",
          moneyTrail?.records.map((record) => `${record.recordType} ${record.counterpartyName ?? ""}`).join(" ") ?? "",
        ].join(" "),
      ),
    };
    const missingSources =
      sourceCount === 0 || completion.missingItems.includes("public_sources") || completion.missingItems.length > 0;
    return {
      ...rowBase,
      missingSources,
      recentlyUpdated: lastUpdated ? Date.now() - parseDateMs(lastUpdated) <= recentCutoffMs : false,
      viewCount: 0,
      watchCount: 0,
      relevanceScore: 0,
      missingSourcePriority: missingSourcePriority({
        completionMissingItems: rowBase.completionMissingItems,
        sourceCount: rowBase.sourceCount,
        hasVotingData: rowBase.hasVotingData,
        hasFundingData: rowBase.hasFundingData,
        redFlagCount: redFlags.length,
        profileCompleteness: rowBase.profileCompleteness,
      }),
    } satisfies OfficialSearchRow;
  });
});

function hasSearchMatch(row: OfficialSearchRow, query: string) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return terms.length === 0 || terms.every((term) => row.searchText.includes(term));
}

function matchesFilters(row: OfficialSearchRow, params: OfficialSearchParams) {
  if (params.search && !hasSearchMatch(row, params.search)) return false;
  if (params.state && row.state !== params.state) return false;
  if (params.county && !row.countyValues.some((county) => county.toLowerCase() === params.county.toLowerCase())) return false;
  if (params.city && row.city.toLowerCase() !== params.city.toLowerCase()) return false;
  if (params.level !== "all" && row.official.level !== params.level) return false;
  if (params.officeType && row.officeType !== params.officeType) return false;
  if (params.party !== "all" && row.official.party !== params.party) return false;
  if (!scoreInRange(row.score, params.scoreRange)) return false;
  if (params.hasRedFlags && row.redFlagCount === 0) return false;
  if (params.hasFundingData && !row.hasFundingData) return false;
  if (params.hasVotingData && !row.hasVotingData) return false;
  if (params.missingSources && !row.missingSources) return false;
  if (params.recentlyUpdated && !row.recentlyUpdated) return false;
  if (params.watchedByMembers && row.watchCount === 0) return false;
  if (params.sourceCount > 0 && row.sourceCount < params.sourceCount) return false;
  if (!completenessInRange(row.profileCompleteness, params.completeness)) return false;
  return true;
}

function sortRows(rows: OfficialSearchRow[], sort: OfficialSearchSort) {
  const sorted = [...rows];
  sorted.sort((a, b) => {
    if (sort === "most-viewed") return b.viewCount - a.viewCount || b.relevanceScore - a.relevanceScore;
    if (sort === "most-watched") return b.watchCount - a.watchCount || b.relevanceScore - a.relevanceScore;
    if (sort === "most-sourced") return b.sourceCount - a.sourceCount || b.profileCompleteness - a.profileCompleteness;
    if (sort === "highest-score") return (b.score ?? -1) - (a.score ?? -1) || b.sourceCount - a.sourceCount;
    if (sort === "lowest-score") return (a.score ?? 101) - (b.score ?? 101) || b.sourceCount - a.sourceCount;
    if (sort === "most-red-flags") return b.redFlagCount - a.redFlagCount || b.sourceCount - a.sourceCount;
    if (sort === "recently-updated") return parseDateMs(b.lastUpdated) - parseDateMs(a.lastUpdated) || b.sourceCount - a.sourceCount;
    if (sort === "missing-source-priority") {
      return b.missingSourcePriority - a.missingSourcePriority || a.profileCompleteness - b.profileCompleteness;
    }
    return b.relevanceScore - a.relevanceScore || b.sourceCount - a.sourceCount || a.official.name.localeCompare(b.official.name);
  });
  return sorted;
}

function countFacet(rows: OfficialSearchRow[], getValues: (row: OfficialSearchRow) => string[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const value of getValues(row)) {
      const trimmed = value.trim();
      if (!trimmed) continue;
      counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
    }
  }
  return Array.from(counts, ([value, count]) => ({ value, label: value, count })).sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label),
  );
}

function countOfficeTypes(rows: OfficialSearchRow[]) {
  const labels = new Map<string, string>();
  const counts = new Map<string, number>();
  for (const row of rows) {
    labels.set(row.officeType, row.officeTypeLabel);
    counts.set(row.officeType, (counts.get(row.officeType) ?? 0) + 1);
  }
  return Array.from(counts, ([value, count]) => ({
    value,
    label: labels.get(value) ?? titleCase(value),
    count,
  })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function countParties(rows: OfficialSearchRow[]) {
  const labels: Record<Party, string> = {
    R: "Republican",
    D: "Democrat",
    I: "Independent",
    NP: "Nonpartisan / Unknown",
    VR: "Votes Republican",
    VD: "Votes Democrat",
  };
  return parties
    .filter((party): party is Party => party !== "all")
    .map((party) => ({
      value: party,
      label: labels[party],
      count: rows.filter((row) => row.official.party === party).length,
    }))
    .filter((option) => option.count > 0);
}

function countLevels(rows: OfficialSearchRow[]) {
  const labels: Record<GovernmentLevel, string> = {
    federal: "Federal",
    state: "State",
    county: "County",
    city: "City",
    "school-board": "School Board",
  };
  return governmentLevels
    .filter((level): level is GovernmentLevel => level !== "all")
    .map((level) => ({
      value: level,
      label: labels[level],
      count: rows.filter((row) => row.official.level === level).length,
    }))
    .filter((option) => option.count > 0);
}

function buildFacets(rows: OfficialSearchRow[]): OfficialSearchFacets {
  return {
    states: countFacet(rows, (row) => (row.state ? [row.state] : [])),
    counties: countFacet(rows, (row) => row.countyValues),
    cities: countFacet(rows, (row) => (row.city ? [row.city] : [])),
    officeTypes: countOfficeTypes(rows),
    parties: countParties(rows),
    levels: countLevels(rows),
  };
}

function activeFilterCount(params: OfficialSearchParams) {
  return [
    params.search,
    params.state,
    params.county,
    params.city,
    params.level !== "all" ? params.level : "",
    params.officeType,
    params.party !== "all" ? params.party : "",
    params.scoreRange !== "all" ? params.scoreRange : "",
    params.hasRedFlags,
    params.hasFundingData,
    params.hasVotingData,
    params.missingSources,
    params.recentlyUpdated,
    params.watchedByMembers,
    params.sourceCount > 0,
    params.completeness !== "all" ? params.completeness : "",
  ].filter(Boolean).length;
}

function statsForRows(rows: OfficialSearchRow[]) {
  return {
    totalProfiles: rows.length,
    sourceLinkedProfiles: rows.filter((row) => row.sourceCount > 0).length,
    voteLoadedProfiles: rows.filter((row) => row.hasVotingData).length,
    fundingLoadedProfiles: rows.filter((row) => row.hasFundingData).length,
    redFlagProfiles: rows.filter((row) => row.redFlagCount > 0).length,
    missingSourceProfiles: rows.filter((row) => row.missingSources).length,
  };
}

export async function searchOfficials(input: SearchParamsInput): Promise<OfficialSearchResult> {
  const params = parseOfficialSearchParams(input);
  const engagement = await loadOfficialEngagementStats();
  const allRows = getStaticOfficialRows().map((row) => {
    const withEngagement = {
      ...row,
      viewCount: engagement.viewCounts.get(row.official.id) ?? 0,
      watchCount: engagement.watchCounts.get(row.official.id) ?? 0,
    };
    return {
      ...withEngagement,
      relevanceScore: relevanceFor(withEngagement, params.search),
    };
  });

  const filteredRows = allRows.filter((row) => matchesFilters(row, params));
  const sortedRows = sortRows(filteredRows, params.sort);
  const total = sortedRows.length;
  const pageCount = Math.max(1, Math.ceil(total / params.perPage));
  const page = Math.min(params.page, pageCount);
  const start = (page - 1) * params.perPage;

  return {
    params: {
      ...params,
      page,
    },
    rows: sortedRows.slice(start, start + params.perPage),
    total,
    page,
    pageCount,
    perPage: params.perPage,
    activeFilterCount: activeFilterCount(params),
    facets: buildFacets(allRows),
    stats: statsForRows(allRows),
  };
}

export function officialSearchQuery(params: OfficialSearchParams, overrides: Partial<OfficialSearchParams> = {}) {
  const next = { ...params, ...overrides };
  const query = new URLSearchParams();
  if (next.search) query.set("search", next.search);
  if (next.state) query.set("state", next.state);
  if (next.county) query.set("county", next.county);
  if (next.city) query.set("city", next.city);
  if (next.level !== "all") query.set("level", next.level);
  if (next.officeType) query.set("officeType", next.officeType);
  if (next.party !== "all") query.set("party", next.party);
  if (next.scoreRange !== "all") query.set("scoreRange", next.scoreRange);
  if (next.hasRedFlags) query.set("redFlags", "1");
  if (next.hasFundingData) query.set("funding", "1");
  if (next.hasVotingData) query.set("voting", "1");
  if (next.missingSources) query.set("missingSources", "1");
  if (next.recentlyUpdated) query.set("recent", "1");
  if (next.watchedByMembers) query.set("watched", "1");
  if (next.sourceCount > 0) query.set("sourceCount", String(next.sourceCount));
  if (next.completeness !== "all") query.set("completeness", next.completeness);
  if (next.sort !== "relevance") query.set("sort", next.sort);
  if (next.perPage !== 24) query.set("perPage", String(next.perPage));
  if (next.page > 1) query.set("page", String(next.page));
  const value = query.toString();
  return value ? `/officials?${value}` : "/officials";
}

export function isOfficialSearchIndexable(params: OfficialSearchParams) {
  if (params.search || params.page > 1 || params.sort !== "relevance" || params.perPage !== 24) return false;
  if (
    params.county ||
    params.city ||
    params.officeType ||
    params.party !== "all" ||
    params.scoreRange !== "all" ||
    params.hasRedFlags ||
    params.hasFundingData ||
    params.hasVotingData ||
    params.missingSources ||
    params.recentlyUpdated ||
    params.watchedByMembers ||
    params.sourceCount > 0 ||
    params.completeness !== "all"
  ) {
    return false;
  }
  return true;
}

export function officialSearchCanonicalPath(params: OfficialSearchParams) {
  if (!isOfficialSearchIndexable(params)) return "/officials";
  return officialSearchQuery(params, { page: 1, sort: "relevance", perPage: 24 });
}
