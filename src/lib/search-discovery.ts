import Fuse from "fuse.js";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { normalizeSearchKey, normalizeSearchQuery } from "@/lib/search-utils";
import { getPredictiveSearchIndex, type PredictiveSearchKind, type PredictiveSearchResult } from "@/lib/predictive-search";

export const searchEntityTypes = [
  "public_official",
  "elected_official",
  "appointed_official",
  "candidate",
  "law_enforcement_official",
  "judge",
  "prosecutor",
  "agency",
  "public_body",
  "school_board",
  "jurisdiction",
  "race",
  "vote",
  "funding_record",
  "story",
  "public_question",
  "source_url",
  "tool_page",
  "package_page",
  "methodology_page",
  "privacy_page",
  "help_page",
] as const;

export type SearchEntityType = (typeof searchEntityTypes)[number];

export const searchSortOptions = [
  "relevance",
  "most_viewed",
  "most_watched",
  "most_sourced",
  "recently_updated",
  "source_gaps",
  "completeness",
  "alphabetical",
] as const;

export type SearchSort = (typeof searchSortOptions)[number];

export interface SearchDiscoveryFilters {
  entityTypes?: SearchEntityType[];
  state?: string;
  county?: string;
  city?: string;
  officeLevel?: string;
  officeType?: string;
  sourceCountMin?: number;
  completenessMin?: number;
  hasVotes?: boolean;
  hasFunding?: boolean;
  hasSourceGaps?: boolean;
  hasCorrectionRequested?: boolean;
  recentlyUpdated?: boolean;
  popular?: boolean;
  watched?: boolean;
  publicBodyType?: string;
}

export interface SearchDiscoveryParams {
  query?: string;
  filters?: SearchDiscoveryFilters;
  page?: number;
  limit?: number;
  sort?: SearchSort;
}

export interface SearchDiscoveryResult {
  id: string;
  entityType: SearchEntityType;
  entityId: string;
  title: string;
  subtitle?: string | null;
  body?: string | null;
  slug?: string | null;
  url: string;
  state?: string | null;
  county?: string | null;
  city?: string | null;
  officeType?: string | null;
  officeLevel?: string | null;
  tags: string[];
  sourceCount: number;
  completenessScore: number;
  popularityScore: number;
  watchCount: number;
  shareCount: number;
  updatedAt?: string | null;
  indexedAt?: string | null;
  trustLabel: string;
  completenessLabel: string;
  sourceGap: boolean;
  source: "database" | "static";
  score: number;
}

export interface SearchDiscoveryResponse {
  ok: true;
  query: string;
  normalizedQuery: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  sort: SearchSort;
  filters: SearchDiscoveryFilters;
  results: SearchDiscoveryResult[];
  facets: {
    entityTypes: Array<{ value: SearchEntityType; count: number }>;
    states: Array<{ value: string; count: number }>;
    counties: Array<{ value: string; count: number }>;
    officeTypes: Array<{ value: string; count: number }>;
  };
  highIntent: boolean;
  dataSource: "database" | "static";
}

type SearchIndexRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  title: string;
  subtitle: string | null;
  body: string | null;
  slug: string | null;
  url: string;
  state: string | null;
  county: string | null;
  city: string | null;
  office_type: string | null;
  office_level: string | null;
  tags: unknown;
  source_count: number | null;
  completeness_score: number | null;
  popularity_score: number | null;
  watch_count: number | null;
  share_count: number | null;
  updated_at: string | null;
  indexed_at: string | null;
};

const predictiveKindToEntityType: Record<PredictiveSearchKind, SearchEntityType> = {
  official: "public_official",
  board: "school_board",
  county: "jurisdiction",
  agency: "agency",
  story: "story",
  issue: "public_question",
  vote: "vote",
  funding: "funding_record",
  campaign: "race",
  news: "story",
  suggestion: "tool_page",
};

const highIntentTerms = [
  "brief",
  "packet",
  "review",
  "campaign finance",
  "funding",
  "race",
  "school board",
  "monitor",
  "record check",
  "source pack",
  "official record",
];

function cleanNumber(value: unknown, fallback: number, min: number, max: number) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.max(min, Math.min(max, Math.round(next)));
}

export function coerceSearchSort(value: unknown): SearchSort {
  return typeof value === "string" && searchSortOptions.includes(value as SearchSort)
    ? value as SearchSort
    : "relevance";
}

export function coerceSearchEntityTypes(values: unknown): SearchEntityType[] {
  const raw = Array.isArray(values) ? values : typeof values === "string" ? values.split(",") : [];
  return Array.from(
    new Set(
      raw
        .map((value) => normalizeSearchKey(String(value)).replace(/\s+/g, "_"))
        .filter((value): value is SearchEntityType => searchEntityTypes.includes(value as SearchEntityType)),
    ),
  );
}

export function normalizeSearchFilters(input: Record<string, unknown> = {}): SearchDiscoveryFilters {
  return {
    entityTypes: coerceSearchEntityTypes(input.entityTypes ?? input.entityType ?? input.type),
    state: normalizeSearchQuery(input.state, 80) || undefined,
    county: normalizeSearchQuery(input.county, 120) || undefined,
    city: normalizeSearchQuery(input.city, 120) || undefined,
    officeLevel: normalizeSearchQuery(input.officeLevel ?? input.office_level, 100) || undefined,
    officeType: normalizeSearchQuery(input.officeType ?? input.office_type, 100) || undefined,
    sourceCountMin: input.sourceCountMin === undefined ? undefined : cleanNumber(input.sourceCountMin, 0, 0, 100000),
    completenessMin: input.completenessMin === undefined ? undefined : cleanNumber(input.completenessMin, 0, 0, 100),
    hasVotes: input.hasVotes === true || input.hasVotes === "true",
    hasFunding: input.hasFunding === true || input.hasFunding === "true",
    hasSourceGaps: input.hasSourceGaps === true || input.hasSourceGaps === "true",
    hasCorrectionRequested: input.hasCorrectionRequested === true || input.hasCorrectionRequested === "true",
    recentlyUpdated: input.recentlyUpdated === true || input.recentlyUpdated === "true",
    popular: input.popular === true || input.popular === "true",
    watched: input.watched === true || input.watched === "true",
    publicBodyType: normalizeSearchQuery(input.publicBodyType ?? input.public_body_type, 100) || undefined,
  };
}

function tagsFromUnknown(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => normalizeSearchKey(tag).replace(/\s+/g, "-"))
        .filter(Boolean),
    ),
  ).slice(0, 24);
}

function trustLabel(sourceCount: number, tags: string[]) {
  if (tags.includes("under-review")) return "Under review";
  if (tags.includes("needs-source") || sourceCount === 0) return "Needs source";
  if (sourceCount >= 3) return "Source-backed";
  return "Source-linked";
}

function completenessLabel(score: number) {
  if (score >= 90) return "Complete";
  if (score >= 70) return "Strong";
  if (score >= 40) return "Partial";
  return "Needs buildout";
}

function resultFromRow(row: SearchIndexRow, score: number): SearchDiscoveryResult | null {
  const entityType = normalizeSearchKey(row.entity_type).replace(/\s+/g, "_");
  if (!searchEntityTypes.includes(entityType as SearchEntityType)) return null;
  const sourceCount = Number(row.source_count ?? 0);
  const completenessScore = Number(row.completeness_score ?? 0);
  const tags = tagsFromUnknown(row.tags);

  return {
    id: row.id,
    entityType: entityType as SearchEntityType,
    entityId: row.entity_id,
    title: row.title,
    subtitle: row.subtitle,
    body: row.body,
    slug: row.slug,
    url: row.url,
    state: row.state,
    county: row.county,
    city: row.city,
    officeType: row.office_type,
    officeLevel: row.office_level,
    tags,
    sourceCount,
    completenessScore,
    popularityScore: Number(row.popularity_score ?? 0),
    watchCount: Number(row.watch_count ?? 0),
    shareCount: Number(row.share_count ?? 0),
    updatedAt: row.updated_at,
    indexedAt: row.indexed_at,
    trustLabel: trustLabel(sourceCount, tags),
    completenessLabel: completenessLabel(completenessScore),
    sourceGap: tags.includes("gap-source") || tags.includes("needs-source") || completenessScore < 50,
    source: "database",
    score,
  };
}

function resultFromPredictive(result: PredictiveSearchResult): SearchDiscoveryResult {
  const entityType = predictiveKindToEntityType[result.kind];
  const sourceCount = result.sourceCount ?? 0;
  const completenessScore = Math.max(20, Math.min(95, 45 + sourceCount * 8 + Math.round(result.score / 12)));
  const tags = [
    result.kind,
    result.state ? `state:${result.state.toLowerCase()}` : "",
    result.county ? `county:${normalizeSearchKey(result.county).replace(/\s+/g, "-")}` : "",
    result.kind === "vote" ? "has-votes" : "",
    result.kind === "funding" ? "has-funding" : "",
    sourceCount === 0 ? "needs-source" : "source-linked",
  ].filter(Boolean);

  return {
    id: result.id,
    entityType,
    entityId: result.id.split(":").slice(1).join(":") || result.id,
    title: result.title,
    subtitle: result.eyebrow,
    body: result.description,
    slug: result.href.split("/").filter(Boolean).pop() ?? null,
    url: result.href,
    state: result.state ?? null,
    county: result.county ?? null,
    city: null,
    officeType: result.kind,
    officeLevel: result.jurisdiction ?? null,
    tags,
    sourceCount,
    completenessScore,
    popularityScore: result.score,
    watchCount: 0,
    shareCount: 0,
    updatedAt: result.updatedAt ?? null,
    indexedAt: null,
    trustLabel: trustLabel(sourceCount, tags),
    completenessLabel: completenessLabel(completenessScore),
    sourceGap: sourceCount === 0 || completenessScore < 50,
    source: "static",
    score: result.score,
  };
}

function fuzzyStaticSearch(query: string) {
  const rows = getPredictiveSearchIndex().map(resultFromPredictive);
  const normalizedQuery = normalizeSearchKey(query);
  if (!normalizedQuery) return rows.sort((a, b) => b.score - a.score);

  const exactWords = normalizedQuery.split(" ").filter(Boolean);
  const exactMatches = rows
    .map((row) => {
      const haystack = normalizeSearchKey([
        row.title,
        row.subtitle,
        row.body,
        row.state,
        row.county,
        row.city,
        row.officeType,
        row.officeLevel,
        row.tags.join(" "),
      ].filter(Boolean).join(" "));
      const matchCount = exactWords.filter((word) => haystack.includes(word)).length;
      return { ...row, score: row.score + matchCount * 40 + (haystack.includes(normalizedQuery) ? 90 : 0) };
    })
    .filter((row) => row.score > 0 && exactWords.some((word) => normalizeSearchKey(`${row.title} ${row.body ?? ""} ${row.tags.join(" ")}`).includes(word)));

  if (exactMatches.length) return exactMatches.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  const fuse = new Fuse(rows, {
    keys: ["title", "subtitle", "body", "state", "county", "city", "officeType", "officeLevel", "tags"],
    threshold: 0.38,
    ignoreLocation: true,
    minMatchCharLength: 2,
    includeScore: true,
  });

  return fuse.search(normalizedQuery).map((item) => ({
    ...item.item,
    score: item.item.score + Math.round((1 - (item.score ?? 1)) * 120),
  }));
}

function matchesFilters(result: SearchDiscoveryResult, filters: SearchDiscoveryFilters) {
  if (filters.entityTypes?.length && !filters.entityTypes.includes(result.entityType)) return false;
  if (filters.state && normalizeSearchKey(result.state ?? "") !== normalizeSearchKey(filters.state)) return false;
  if (filters.county && !normalizeSearchKey(result.county ?? "").includes(normalizeSearchKey(filters.county))) return false;
  if (filters.city && !normalizeSearchKey(result.city ?? "").includes(normalizeSearchKey(filters.city))) return false;
  if (filters.officeLevel && !normalizeSearchKey(result.officeLevel ?? "").includes(normalizeSearchKey(filters.officeLevel))) return false;
  if (filters.officeType && !normalizeSearchKey(result.officeType ?? "").includes(normalizeSearchKey(filters.officeType))) return false;
  if (filters.sourceCountMin !== undefined && result.sourceCount < filters.sourceCountMin) return false;
  if (filters.completenessMin !== undefined && result.completenessScore < filters.completenessMin) return false;
  if (filters.hasVotes && !result.tags.includes("has-votes") && result.entityType !== "vote") return false;
  if (filters.hasFunding && !result.tags.includes("has-funding") && result.entityType !== "funding_record") return false;
  if (filters.hasSourceGaps && !result.sourceGap) return false;
  if (filters.hasCorrectionRequested && !result.tags.includes("correction-requested")) return false;
  if (filters.recentlyUpdated && !result.updatedAt) return false;
  if (filters.popular && result.popularityScore < 50) return false;
  if (filters.watched && result.watchCount < 1) return false;
  if (filters.publicBodyType && !result.tags.includes(`body:${normalizeSearchKey(filters.publicBodyType).replace(/\s+/g, "-")}`)) return false;
  return true;
}

function sortResults(results: SearchDiscoveryResult[], sort: SearchSort) {
  const byRecent = (a: SearchDiscoveryResult, b: SearchDiscoveryResult) =>
    new Date(b.updatedAt ?? b.indexedAt ?? 0).getTime() - new Date(a.updatedAt ?? a.indexedAt ?? 0).getTime();

  return [...results].sort((a, b) => {
    switch (sort) {
      case "most_viewed":
        return b.popularityScore - a.popularityScore || b.score - a.score || a.title.localeCompare(b.title);
      case "most_watched":
        return b.watchCount - a.watchCount || b.score - a.score || a.title.localeCompare(b.title);
      case "most_sourced":
        return b.sourceCount - a.sourceCount || b.score - a.score || a.title.localeCompare(b.title);
      case "recently_updated":
        return byRecent(a, b) || b.score - a.score || a.title.localeCompare(b.title);
      case "source_gaps":
        return Number(b.sourceGap) - Number(a.sourceGap) || a.completenessScore - b.completenessScore || b.score - a.score;
      case "completeness":
        return b.completenessScore - a.completenessScore || b.sourceCount - a.sourceCount || a.title.localeCompare(b.title);
      case "alphabetical":
        return a.title.localeCompare(b.title);
      case "relevance":
      default:
        return b.score - a.score || b.popularityScore - a.popularityScore || a.title.localeCompare(b.title);
    }
  });
}

function makeFacets(results: SearchDiscoveryResult[]) {
  function countValues<T extends string>(values: T[]) {
    const counts = new Map<T, number>();
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
    return Array.from(counts, ([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value)).slice(0, 20);
  }

  return {
    entityTypes: countValues(results.map((result) => result.entityType)),
    states: countValues(results.map((result) => result.state ?? "").filter(Boolean)),
    counties: countValues(results.map((result) => result.county ?? "").filter(Boolean)),
    officeTypes: countValues(results.map((result) => result.officeType ?? "").filter(Boolean)),
  };
}

async function databaseSearch(params: SearchDiscoveryParams): Promise<{ results: SearchDiscoveryResult[]; total: number } | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;

  const query = normalizeSearchQuery(params.query);
  const filters = params.filters ?? {};
  const sort = params.sort ?? "relevance";
  const page = cleanNumber(params.page, 1, 1, 1000);
  const limit = cleanNumber(params.limit, 20, 1, 50);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let builder = admin
    .from("search_index")
    .select("id, entity_type, entity_id, title, subtitle, body, slug, url, state, county, city, office_type, office_level, tags, source_count, completeness_score, popularity_score, watch_count, share_count, updated_at, indexed_at", { count: "exact" })
    .eq("visibility", "public")
    .eq("status", "active");

  if (query) builder = builder.textSearch("search_vector", query, { type: "websearch", config: "english" });
  if (filters.entityTypes?.length) builder = builder.in("entity_type", filters.entityTypes);
  if (filters.state) builder = builder.eq("state", filters.state.toUpperCase());
  if (filters.county) builder = builder.ilike("county", `%${filters.county}%`);
  if (filters.city) builder = builder.ilike("city", `%${filters.city}%`);
  if (filters.officeLevel) builder = builder.ilike("office_level", `%${filters.officeLevel}%`);
  if (filters.officeType) builder = builder.ilike("office_type", `%${filters.officeType}%`);
  if (filters.sourceCountMin !== undefined) builder = builder.gte("source_count", filters.sourceCountMin);
  if (filters.completenessMin !== undefined) builder = builder.gte("completeness_score", filters.completenessMin);
  if (filters.hasVotes) builder = builder.contains("tags", ["has-votes"]);
  if (filters.hasFunding) builder = builder.contains("tags", ["has-funding"]);
  if (filters.hasSourceGaps) builder = builder.contains("tags", ["needs-source"]);
  if (filters.hasCorrectionRequested) builder = builder.contains("tags", ["correction-requested"]);
  if (filters.popular) builder = builder.gte("popularity_score", 50);
  if (filters.watched) builder = builder.gte("watch_count", 1);
  if (filters.publicBodyType) builder = builder.contains("tags", [`body:${normalizeSearchKey(filters.publicBodyType).replace(/\s+/g, "-")}`]);

  switch (sort) {
    case "most_viewed":
      builder = builder.order("popularity_score", { ascending: false });
      break;
    case "most_watched":
      builder = builder.order("watch_count", { ascending: false });
      break;
    case "most_sourced":
      builder = builder.order("source_count", { ascending: false });
      break;
    case "recently_updated":
      builder = builder.order("updated_at", { ascending: false });
      break;
    case "source_gaps":
      builder = builder.order("completeness_score", { ascending: true });
      break;
    case "completeness":
      builder = builder.order("completeness_score", { ascending: false });
      break;
    case "alphabetical":
      builder = builder.order("title", { ascending: true });
      break;
    case "relevance":
    default:
      builder = builder.order("popularity_score", { ascending: false });
      break;
  }

  const { data, error, count } = await builder.range(from, to);
  if (error) return null;

  return {
    results: (data as SearchIndexRow[] | null ?? [])
      .map((row, index) => resultFromRow(row, 1000 - index))
      .filter((row): row is SearchDiscoveryResult => Boolean(row)),
    total: count ?? 0,
  };
}

export function isHighIntentSearch(query: string, filters: SearchDiscoveryFilters) {
  const text = normalizeSearchKey([
    query,
    filters.officeType,
    filters.publicBodyType,
    filters.hasFunding ? "funding" : "",
    filters.hasSourceGaps ? "source gap" : "",
  ].filter(Boolean).join(" "));
  return highIntentTerms.some((term) => text.includes(term));
}

export async function searchDiscovery(params: SearchDiscoveryParams = {}): Promise<SearchDiscoveryResponse> {
  const query = normalizeSearchQuery(params.query);
  const normalizedQuery = normalizeSearchKey(query);
  const filters = params.filters ?? {};
  const page = cleanNumber(params.page, 1, 1, 1000);
  const limit = cleanNumber(params.limit, 20, 1, 50);
  const sort = params.sort ?? "relevance";

  const db = await databaseSearch({ query, filters, page, limit, sort });
  if (db) {
    return {
      ok: true,
      query,
      normalizedQuery,
      page,
      limit,
      total: db.total,
      totalPages: Math.max(1, Math.ceil(db.total / limit)),
      sort,
      filters,
      results: db.results,
      facets: makeFacets(db.results),
      highIntent: isHighIntentSearch(query, filters),
      dataSource: "database",
    };
  }

  const allResults = sortResults(fuzzyStaticSearch(query).filter((result) => matchesFilters(result, filters)), sort);
  const start = (page - 1) * limit;
  const results = allResults.slice(start, start + limit);

  return {
    ok: true,
    query,
    normalizedQuery,
    page,
    limit,
    total: allResults.length,
    totalPages: Math.max(1, Math.ceil(allResults.length / limit)),
    sort,
    filters,
    results,
    facets: makeFacets(allResults),
    highIntent: isHighIntentSearch(query, filters),
    dataSource: "static",
  };
}
