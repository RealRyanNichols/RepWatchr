import {
  DAILY_NEWS_WATCH_SOURCES,
  DAILY_WIRE_DEFAULT_DENY_DOMAINS,
  DAILY_WIRE_INTERNATIONAL_NOISE_TERMS,
  DAILY_WIRE_QUERY_LANE_CONTROLS,
  type DailyNewsWatchSource,
} from "@/data/daily-news-watch-sources";
import { getAllOfficials } from "@/lib/data";
import { getSchoolBoardDossiers } from "@/lib/school-board-research";
import { classifyProfileSource, type ProfileSourceTier } from "@/lib/profile-overlays";
import type { NewsPowerChannel, NewsScope } from "@/types";

export type DailyWireStatus =
  | "accepted"
  | "needs_review"
  | "quarantined"
  | "duplicate"
  | "irrelevant"
  | "attached_to_profile"
  | "promoted_to_story";

export type DailyWirePublicStatus = "source_linked" | "needs_review" | "hidden";
export type DailyWireJurisdictionMatch = "local" | "texas" | "state" | "national" | "none";
export type DailyWireGeographicRelevance = "local" | "state" | "national" | "weak" | "none";
export type DailyWireQuarantineStatus = "clear" | "needs_review" | "quarantined" | "duplicate" | "irrelevant";

export interface DailyWireQualityInput {
  id: string;
  title: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  publishedAt: string | null;
  scope: NewsScope;
  state: string | null;
  counties: string[];
  cities: string[];
  powerChannels: NewsPowerChannel[];
  matchedTerms: string[];
  storedStatus: string | null;
  raw: unknown;
}

export interface DailyWireQualityResult {
  jurisdictionMatch: DailyWireJurisdictionMatch;
  geographicRelevance: DailyWireGeographicRelevance;
  sourceDomain: string;
  topicTags: string[];
  officialPersonMatches: string[];
  stateMatches: string[];
  countyMatches: string[];
  cityMatches: string[];
  duplicateScore: number;
  qualityScore: number;
  sourceTier: ProfileSourceTier;
  publishDate: string | null;
  quarantineStatus: DailyWireQuarantineStatus;
  status: DailyWireStatus;
  publicStatus: DailyWirePublicStatus;
  publicLabels: string[];
  reviewReasons: string[];
  sourceWatchId: string | null;
  queryLane: string | null;
}

type KnownPerson = {
  id: string;
  name: string;
  state?: string | null;
  counties?: string[];
  level?: string;
};

const SOURCE_BY_ID = new Map(DAILY_NEWS_WATCH_SOURCES.map((source) => [source.id, source]));
const SOURCE_BY_LABEL = new Map(DAILY_NEWS_WATCH_SOURCES.map((source) => [source.label, source]));

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
};

const US_MARKERS = [
  "u.s.",
  "u.s",
  "us congress",
  "united states",
  "congress",
  "congressional",
  "senate",
  "senator",
  "house committee",
  "house oversight",
  "representative",
  "federal",
  "white house",
  "supreme court",
  "department of justice",
  "doj",
  "fbi",
  "fec",
  "pentagon",
];

const ELECTION_TERMS = ["election", "runoff", "candidate", "campaign", "ballot", "primary", "canvass"];

const TOPIC_RULES: Array<{ tag: string; terms: string[] }> = [
  { tag: "campaign finance", terms: ["campaign finance", "donor", "donation", "contribution", "pac", "fundraising", "funding"] },
  { tag: "vote record", terms: ["vote", "roll call", "voted", "ballot measure", "legislation", "bill"] },
  { tag: "ethics", terms: ["ethics", "censure", "conflict of interest", "complaint"] },
  { tag: "investigation", terms: ["investigation", "subpoena", "whistleblower", "indicted", "charged", "lawsuit"] },
  { tag: "public records", terms: ["public record", "open records", "foia", "records request", "transparency"] },
  { tag: "school board", terms: ["school board", "trustee", "isd", "superintendent"] },
  { tag: "courts", terms: ["court", "judge", "lawsuit", "grand jury", "district attorney"] },
  { tag: "public safety", terms: ["sheriff", "police chief", "constable", "law enforcement"] },
];

let knownPeopleCache: KnownPerson[] | null = null;

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueList(values: string[], limit = 12) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const cleanValue = value.trim();
    const key = cleanValue.toLowerCase();
    if (!cleanValue || seen.has(key)) continue;
    seen.add(key);
    result.push(cleanValue);
    if (result.length >= limit) break;
  }
  return result;
}

function textIncludesTerm(normalizedText: string, term: string) {
  const normalizedTerm = normalize(term);
  if (!normalizedTerm) return false;
  if (normalizedTerm.length <= 3) {
    return new RegExp(`(^|\\s)${normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`).test(normalizedText);
  }
  return normalizedText.includes(normalizedTerm);
}

function containsAny(normalizedText: string, terms: string[]) {
  return terms.some((term) => textIncludesTerm(normalizedText, term));
}

export function getSourceDomain(sourceUrl: string) {
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function domainMatches(domain: string, candidates: string[] | undefined) {
  if (!domain || !candidates?.length) return false;
  return candidates.some((candidate) => {
    const normalizedCandidate = candidate.replace(/^www\./, "").toLowerCase();
    return domain === normalizedCandidate || domain.endsWith(`.${normalizedCandidate}`);
  });
}

function readRawRecord(raw: unknown) {
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
}

function resolveSource(input: DailyWireQualityInput): DailyNewsWatchSource | undefined {
  const raw = readRawRecord(input.raw);
  const sourceWatchId = typeof raw.sourceWatchId === "string" ? raw.sourceWatchId : typeof raw.sourceId === "string" ? raw.sourceId : "";
  const sourceWatchLabel =
    typeof raw.sourceWatchLabel === "string"
      ? raw.sourceWatchLabel
      : typeof raw.sourceLabel === "string"
        ? raw.sourceLabel
        : "";

  return (
    SOURCE_BY_ID.get(sourceWatchId) ??
    SOURCE_BY_LABEL.get(sourceWatchLabel) ??
    SOURCE_BY_LABEL.get(input.sourceName) ??
    DAILY_NEWS_WATCH_SOURCES.find(
      (source) =>
        source.scope === input.scope &&
        source.state === (input.state ?? undefined) &&
        source.powerChannels.every((channel) => input.powerChannels.includes(channel)),
    )
  );
}

function getSourceWatchId(input: DailyWireQualityInput, source?: DailyNewsWatchSource) {
  const raw = readRawRecord(input.raw);
  if (typeof raw.sourceWatchId === "string") return raw.sourceWatchId;
  if (typeof raw.sourceId === "string") return raw.sourceId;
  return source?.id ?? null;
}

function getQueryLane(input: DailyWireQualityInput, source?: DailyNewsWatchSource) {
  const raw = readRawRecord(input.raw);
  if (typeof raw.queryLane === "string") return raw.queryLane;
  return source?.queryLane ?? null;
}

function getKnownPeople(): KnownPerson[] {
  if (knownPeopleCache) return knownPeopleCache;

  const officials = getAllOfficials().map((official) => ({
    id: official.id,
    name: official.name,
    state: official.state,
    counties: official.county,
    level: official.level,
  }));

  let schoolBoardPeople: KnownPerson[] = [];
  try {
    schoolBoardPeople = getSchoolBoardDossiers().map((candidate) => {
      const record = candidate as unknown as Record<string, unknown>;
      return {
        id: String(record.candidate_id ?? record.id ?? ""),
        name: String(record.full_name ?? record.name ?? ""),
        state: "TX",
        counties: typeof record.county === "string" ? [record.county] : [],
        level: "school-board",
      };
    });
  } catch {
    schoolBoardPeople = [];
  }

  knownPeopleCache = [...officials, ...schoolBoardPeople]
    .filter((person) => person.id && person.name && normalize(person.name).length >= 7)
    .sort((a, b) => b.name.length - a.name.length);

  return knownPeopleCache;
}

function matchKnownPeople(normalizedText: string) {
  const matches: KnownPerson[] = [];
  for (const person of getKnownPeople()) {
    if (textIncludesTerm(normalizedText, person.name)) {
      matches.push(person);
      if (matches.length >= 10) break;
    }
  }
  return matches;
}

function topicTagsFor(input: DailyWireQualityInput, normalizedText: string) {
  const channelTags = input.powerChannels.map((channel) => channel.replaceAll("-", " "));
  const ruleTags = TOPIC_RULES.filter((rule) => containsAny(normalizedText, rule.terms)).map((rule) => rule.tag);
  const termTags = input.matchedTerms.filter((term) => term.length >= 4).slice(0, 4);
  return uniqueList([...channelTags, ...ruleTags, ...termTags], 10);
}

function stateMatchesFor(input: DailyWireQualityInput, normalizedText: string, people: KnownPerson[]) {
  const expectedStates = uniqueList([
    ...(input.state ? [input.state] : []),
    ...people.map((person) => person.state ?? "").filter(Boolean),
  ]);
  const matches: string[] = [];
  for (const stateCode of expectedStates) {
    const code = stateCode.toUpperCase();
    const name = STATE_NAMES[code] ?? stateCode;
    if (textIncludesTerm(normalizedText, name) || textIncludesTerm(normalizedText, code)) {
      matches.push(code);
    }
  }
  return uniqueList(matches);
}

function localMatchesFor(values: string[], normalizedText: string) {
  return uniqueList(values.filter((value) => textIncludesTerm(normalizedText, value)));
}

function normalizedTitleFingerprint(title: string) {
  return normalize(title)
    .replace(/\b(the|a|an|and|or|to|of|in|on|for|with|by|from|after|before)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

export function buildDailyWireDuplicateScores(
  rows: Array<{ id: string; title: string | null; source_url: string | null }>,
) {
  const urlCounts = new Map<string, number>();
  const titleCounts = new Map<string, number>();

  for (const row of rows) {
    const url = (row.source_url ?? "").trim().toLowerCase();
    const title = normalizedTitleFingerprint(row.title ?? "");
    if (url) urlCounts.set(url, (urlCounts.get(url) ?? 0) + 1);
    if (title) titleCounts.set(title, (titleCounts.get(title) ?? 0) + 1);
  }

  const scores = new Map<string, number>();
  for (const row of rows) {
    const url = (row.source_url ?? "").trim().toLowerCase();
    const title = normalizedTitleFingerprint(row.title ?? "");
    const urlDuplicate = url && (urlCounts.get(url) ?? 0) > 1;
    const titleDuplicate = title && (titleCounts.get(title) ?? 0) > 1;
    scores.set(row.id, urlDuplicate ? 100 : titleDuplicate ? 92 : 0);
  }

  return scores;
}

function statusFromStored(storedStatus: string | null): DailyWireStatus | null {
  if (
    storedStatus === "accepted" ||
    storedStatus === "attached_to_profile" ||
    storedStatus === "promoted_to_story" ||
    storedStatus === "quarantined" ||
    storedStatus === "duplicate" ||
    storedStatus === "irrelevant"
  ) {
    return storedStatus;
  }
  if (storedStatus === "approved") return "accepted";
  if (storedStatus === "rejected" || storedStatus === "archived") return "irrelevant";
  return null;
}

function publicStatusFor(status: DailyWireStatus): DailyWirePublicStatus {
  if (status === "accepted" || status === "attached_to_profile" || status === "promoted_to_story") return "source_linked";
  if (status === "needs_review") return "needs_review";
  return "hidden";
}

export function isPublicWireStatus(status: DailyWireStatus) {
  return publicStatusFor(status) !== "hidden";
}

function quarantineStatusFor(status: DailyWireStatus): DailyWireQuarantineStatus {
  if (status === "duplicate") return "duplicate";
  if (status === "irrelevant") return "irrelevant";
  if (status === "quarantined") return "quarantined";
  if (status === "needs_review") return "needs_review";
  return "clear";
}

function publishedDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function evaluateDailyWireQuality(input: DailyWireQualityInput, duplicateScore = 0): DailyWireQualityResult {
  const raw = readRawRecord(input.raw);
  const publisherUrl = typeof raw.publisherUrl === "string" ? raw.publisherUrl : "";
  const sourceDomain = getSourceDomain(publisherUrl || input.sourceUrl);
  const sourceTier = classifyProfileSource(input.sourceUrl, input.sourceName);
  const source = resolveSource(input);
  const sourceWatchId = getSourceWatchId(input, source);
  const queryLane = getQueryLane(input, source);
  const laneControl = queryLane ? DAILY_WIRE_QUERY_LANE_CONTROLS[queryLane] : undefined;
  const text = `${input.title} ${input.summary} ${input.sourceName} ${input.matchedTerms.join(" ")}`;
  const normalizedText = normalize(text);
  const officialPeople = matchKnownPeople(normalizedText);
  const officialPersonMatches = officialPeople.map((person) => `${person.name} (${person.id})`);
  const topicTags = topicTagsFor(input, normalizedText);
  const stateMatches = stateMatchesFor(input, normalizedText, officialPeople);
  const countyMatches = localMatchesFor(input.counties, normalizedText);
  const cityMatches = localMatchesFor(input.cities, normalizedText);
  const hasUsMarker = containsAny(normalizedText, US_MARKERS);
  const hasElectionTerm = containsAny(normalizedText, ELECTION_TERMS);
  const deniedDomains = uniqueList([...(source?.denyDomains ?? []), ...(laneControl?.denyDomains ?? []), ...DAILY_WIRE_DEFAULT_DENY_DOMAINS], 80);
  const deniedTerms = uniqueList([...(source?.deniedTerms ?? []), ...(laneControl?.deniedTerms ?? []), ...DAILY_WIRE_INTERNATIONAL_NOISE_TERMS], 80);
  const requiredTerms = source?.requiredTerms ?? laneControl?.requiredTerms ?? [];
  const sourceDenied = domainMatches(sourceDomain, deniedDomains);
  const sourceAllowed =
    domainMatches(sourceDomain, source?.allowDomains) ||
    domainMatches(sourceDomain, laneControl?.allowDomains) ||
    sourceDomain === "news.google.com";
  const matchedRequiredTerms = requiredTerms.filter((term) => textIncludesTerm(normalizedText, term));
  const missingRequiredTerms = requiredTerms.length > 0 && matchedRequiredTerms.length === 0;
  const internationalTerms = deniedTerms.filter((term) => textIncludesTerm(normalizedText, term));
  const internationalOnly = internationalTerms.length > 0 && !hasUsMarker && !officialPeople.length && !stateMatches.length && !countyMatches.length && !cityMatches.length;
  const noisyElection =
    input.powerChannels.includes("elections") &&
    hasElectionTerm &&
    !hasUsMarker &&
    !officialPeople.length &&
    !stateMatches.length &&
    !countyMatches.length &&
    !cityMatches.length;

  let geographicRelevance: DailyWireGeographicRelevance = "none";
  if (countyMatches.length || cityMatches.length) geographicRelevance = "local";
  else if (stateMatches.length || (input.scope === "texas" && !missingRequiredTerms)) geographicRelevance = "state";
  else if (hasUsMarker || officialPeople.some((person) => person.level === "federal")) geographicRelevance = "national";
  else if (input.scope === "national" && !missingRequiredTerms) geographicRelevance = "weak";

  let jurisdictionMatch: DailyWireJurisdictionMatch = "none";
  if (geographicRelevance === "local") jurisdictionMatch = "local";
  else if (stateMatches.includes("TX") || input.scope === "texas") jurisdictionMatch = "texas";
  else if (stateMatches.length) jurisdictionMatch = "state";
  else if (geographicRelevance === "national" || (input.scope === "national" && (hasUsMarker || officialPeople.length))) {
    jurisdictionMatch = "national";
  }

  const reviewReasons: string[] = [];
  if (sourceDenied) reviewReasons.push(`Denied source domain: ${sourceDomain}`);
  if (missingRequiredTerms) reviewReasons.push(`Query lane missing required jurisdiction terms: ${requiredTerms.slice(0, 4).join(", ")}`);
  if (internationalOnly) reviewReasons.push(`International-only terms without U.S., state, or official match: ${internationalTerms.slice(0, 4).join(", ")}`);
  if (noisyElection) reviewReasons.push("Election-language result has no U.S., state, local, or official match.");
  if (duplicateScore >= 90) reviewReasons.push("Likely duplicate wire item.");
  if (jurisdictionMatch === "none") reviewReasons.push("No jurisdiction match found.");
  if (geographicRelevance === "none") reviewReasons.push("No geographic relevance found.");
  if (!topicTags.length) reviewReasons.push("No RepWatchr topic tags found.");

  let score = 24;
  if (sourceTier === "official_record") score += 20;
  else if (sourceTier === "named_news") score += 14;
  else if (sourceTier === "other_public") score += 6;
  else score -= 10;

  if (sourceAllowed) score += 6;
  if (matchedRequiredTerms.length) score += 10;
  if (jurisdictionMatch === "local") score += 22;
  else if (jurisdictionMatch === "texas" || jurisdictionMatch === "state") score += 18;
  else if (jurisdictionMatch === "national") score += 14;
  else score -= 22;

  if (geographicRelevance === "local") score += 18;
  else if (geographicRelevance === "state") score += 14;
  else if (geographicRelevance === "national") score += 10;
  else if (geographicRelevance === "weak") score += 4;
  else score -= 16;

  if (officialPeople.length) score += 18;
  if (topicTags.length) score += Math.min(14, topicTags.length * 3);
  if (input.matchedTerms.length) score += Math.min(10, input.matchedTerms.length * 2);
  if (publishedDate(input.publishedAt)) score += 6;
  if (publishedDate(input.publishedAt) && Date.now() - new Date(input.publishedAt as string).getTime() <= 72 * 60 * 60 * 1000) score += 4;
  if (sourceDenied) score -= 55;
  if (missingRequiredTerms) score -= 22;
  if (internationalOnly) score -= 45;
  else if (internationalTerms.length) score -= 6;
  if (noisyElection) score -= 40;

  const qualityScore = clampScore(score);
  const storedOverride = statusFromStored(input.storedStatus);
  let status: DailyWireStatus;

  if (storedOverride) {
    status = storedOverride;
  } else if (duplicateScore >= 90) {
    status = "duplicate";
  } else if (sourceDenied || internationalOnly || noisyElection) {
    status = "irrelevant";
  } else if (jurisdictionMatch === "none" || geographicRelevance === "none") {
    status = "quarantined";
  } else if (qualityScore < (source?.quarantineQualityScore ?? laneControl?.quarantineQualityScore ?? 34)) {
    status = "quarantined";
  } else if (qualityScore >= (source?.acceptQualityScore ?? laneControl?.acceptQualityScore ?? 74)) {
    status = "accepted";
  } else {
    status = "needs_review";
  }

  const publicStatus = publicStatusFor(status);
  const publicLabels = [
    ...(publicStatus === "source_linked" ? ["Source-linked"] : []),
    ...(publicStatus === "needs_review" ? ["Needs review"] : []),
    ...(geographicRelevance === "local" || jurisdictionMatch === "texas" || jurisdictionMatch === "state"
      ? ["Local relevance confirmed"]
      : []),
    ...(geographicRelevance === "national" || jurisdictionMatch === "national" ? ["National relevance confirmed"] : []),
    ...(status !== "attached_to_profile" ? ["Not yet attached to profile"] : []),
  ];

  return {
    jurisdictionMatch,
    geographicRelevance,
    sourceDomain,
    topicTags,
    officialPersonMatches: uniqueList(officialPersonMatches, 10),
    stateMatches,
    countyMatches,
    cityMatches,
    duplicateScore,
    qualityScore,
    sourceTier,
    publishDate: publishedDate(input.publishedAt),
    quarantineStatus: quarantineStatusFor(status),
    status,
    publicStatus,
    publicLabels,
    reviewReasons: uniqueList(reviewReasons, 10),
    sourceWatchId,
    queryLane,
  };
}
