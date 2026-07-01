import {
  getAllBills,
  getAllNews,
  getAllOfficials,
  getFundingSummary,
  getIssueCategories,
} from "@/lib/data";
import { getSchoolBoardCandidateUrl, getSchoolBoardDistrictUrl } from "@/lib/school-board-urls";
import { getSchoolBoardDistricts, getSchoolBoardDossiers } from "@/lib/school-board-research";
import { getTexasElectionRaces } from "@/data/texas-election-races";
import {
  getAttorneyWatchProfiles,
  getMediaWatchProfiles,
  getPublicSafetyWatchProfiles,
} from "@/lib/power-watch";

export type PredictiveSearchKind =
  | "official"
  | "board"
  | "county"
  | "agency"
  | "story"
  | "issue"
  | "vote"
  | "funding"
  | "campaign"
  | "news"
  | "suggestion";

export interface PredictiveSearchResult {
  id: string;
  kind: PredictiveSearchKind;
  title: string;
  description: string;
  href: string;
  eyebrow: string;
  badge?: string;
  jurisdiction?: string;
  state?: string;
  county?: string;
  sourceCount?: number;
  updatedAt?: string;
  keywords: string[];
  score: number;
}

export interface PredictiveSearchGroup {
  kind: PredictiveSearchKind;
  label: string;
  results: PredictiveSearchResult[];
}

export interface PredictiveSearchResponse {
  query: string;
  total: number;
  groups: PredictiveSearchGroup[];
  suggestions: PredictiveSearchResult[];
}

export const SEARCH_KIND_LABELS: Record<PredictiveSearchKind, string> = {
  official: "Officials",
  board: "Boards",
  county: "Counties",
  agency: "Agencies",
  story: "Stories",
  issue: "Issues",
  vote: "Votes",
  funding: "Funding",
  campaign: "Campaigns",
  news: "News",
  suggestion: "Suggestions",
};

const SEARCH_KIND_ORDER: PredictiveSearchKind[] = [
  "official",
  "board",
  "county",
  "agency",
  "story",
  "issue",
  "vote",
  "funding",
  "campaign",
  "news",
  "suggestion",
];

const fallbackSuggestions = [
  "Texas U.S. Senate race",
  "East Texas school boards",
  "property tax votes",
  "campaign funding",
  "water rights",
  "open records",
  "Ted Cruz voting record",
  "Nacogdoches County elections",
];

let predictiveIndexCache: PredictiveSearchResult[] | null = null;

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function words(value: string) {
  return normalize(value).split(" ").filter(Boolean);
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value?.trim())).map((value) => value.trim())));
}

function scoreResult(result: PredictiveSearchResult, query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return result.score;

  const queryWords = words(normalizedQuery);
  const title = normalize(result.title);
  const eyebrow = normalize(result.eyebrow);
  const description = normalize(result.description);
  const keywords = result.keywords.map(normalize);
  let score = result.score;

  if (title === normalizedQuery) score += 250;
  if (title.startsWith(normalizedQuery)) score += 170;
  if (title.includes(normalizedQuery)) score += 120;
  if (eyebrow.includes(normalizedQuery)) score += 65;
  if (description.includes(normalizedQuery)) score += 45;
  if (keywords.some((keyword) => keyword === normalizedQuery)) score += 100;
  if (keywords.some((keyword) => keyword.startsWith(normalizedQuery))) score += 70;
  if (keywords.some((keyword) => keyword.includes(normalizedQuery))) score += 45;

  const haystack = `${title} ${eyebrow} ${description} ${keywords.join(" ")}`;
  const matchedWords = queryWords.filter((word) => haystack.includes(word)).length;
  score += matchedWords * 26;
  if (queryWords.length > 1 && matchedWords === queryWords.length) score += 60;

  return score;
}

function searchHref(path: string, query: string) {
  const params = new URLSearchParams({ search: query });
  return `${path}?${params.toString()}`;
}

function addCountyResults(results: PredictiveSearchResult[]) {
  const countyMap = new Map<string, { officials: number; boards: number; state: string }>();

  for (const official of getAllOfficials()) {
    for (const county of official.county) {
      const current = countyMap.get(county) ?? { officials: 0, boards: 0, state: official.state ?? "TX" };
      current.officials += 1;
      countyMap.set(county, current);
    }
  }

  for (const district of getSchoolBoardDistricts()) {
    const county = district.county;
    const current = countyMap.get(county) ?? { officials: 0, boards: 0, state: "TX" };
    current.boards += 1;
    countyMap.set(county, current);
  }

  for (const [county, counts] of countyMap) {
    results.push({
      id: `county:${county}`,
      kind: "county",
      title: county,
      description: `${counts.officials.toLocaleString()} officials and ${counts.boards.toLocaleString()} school-board districts connected to this county record set.`,
      href: searchHref("/officials", county),
      eyebrow: "County record lane",
      badge: counts.state,
      state: counts.state,
      county,
      sourceCount: counts.officials + counts.boards,
      keywords: unique([county, counts.state, "county", "local", "officials", "school boards"]),
      score: 56 + counts.officials + counts.boards,
    });
  }
}

function addAgencyResults(results: PredictiveSearchResult[]) {
  const agencyMap = new Map<string, { count: number; state?: string; county?: string; href: string; keywords: string[] }>();

  for (const official of getAllOfficials()) {
    const label = official.jurisdiction;
    if (!label) continue;
    const current = agencyMap.get(label) ?? {
      count: 0,
      state: official.state,
      county: official.county[0],
      href: searchHref("/officials", label),
      keywords: [],
    };
    current.count += 1;
    current.keywords.push(official.position, official.level, official.state ?? "", official.county.join(" "));
    agencyMap.set(label, current);
  }

  const powerProfiles = [
    ...getAttorneyWatchProfiles(),
    ...getMediaWatchProfiles(),
    ...getPublicSafetyWatchProfiles(),
  ];

  for (const profile of powerProfiles) {
    if (!profile.kind.includes("agency") && !profile.kind.includes("law-enforcement")) continue;
    const current = agencyMap.get(profile.name) ?? {
      count: 0,
      state: profile.state,
      county: profile.county,
      href: `/public-safety/${profile.slug}`,
      keywords: [],
    };
    current.count += 1;
    current.keywords.push(profile.kind, profile.categoryLabel, profile.region, profile.city ?? "", profile.county ?? "");
    agencyMap.set(profile.name, current);
  }

  for (const [agency, data] of agencyMap) {
    results.push({
      id: `agency:${agency}`,
      kind: "agency",
      title: agency,
      description: `${data.count.toLocaleString()} connected public profiles, source links, or accountability records.`,
      href: data.href,
      eyebrow: "Agency / jurisdiction",
      badge: data.state,
      state: data.state,
      county: data.county,
      sourceCount: data.count,
      keywords: unique([agency, "agency", "jurisdiction", "public body", ...data.keywords]),
      score: 46 + data.count,
    });
  }
}

function powerProfileHref(kind: string, slug: string) {
  if (kind.includes("media") || kind.includes("journalist") || kind.includes("editor") || kind.includes("newsroom")) {
    return `/media/${slug}`;
  }
  if (kind.includes("attorney") || kind.includes("law-firm") || kind.includes("bar-source")) {
    return `/attorneys/${slug}`;
  }
  return `/public-safety/${slug}`;
}

export function getPredictiveSearchIndex() {
  if (predictiveIndexCache) return predictiveIndexCache;
  const results: PredictiveSearchResult[] = [];
  const officials = getAllOfficials();

  for (const official of officials) {
    const sourceCount =
      (official.sourceLinks?.length ?? 0) +
      (official.photoSourceUrl ? 1 : 0) +
      (official.contactInfo.website ? 1 : 0);
    results.push({
      id: `official:${official.id}`,
      kind: "official",
      title: official.name,
      description: `${official.position}${official.district ? `, ${official.district}` : ""} serving ${official.jurisdiction}.`,
      href: `/officials/${official.id}`,
      eyebrow: "Official profile",
      badge: official.party,
      jurisdiction: official.jurisdiction,
      state: official.state,
      county: official.county[0],
      sourceCount,
      updatedAt: official.lastVerifiedAt,
      keywords: unique([
        official.name,
        official.firstName,
        official.lastName,
        official.position,
        official.district,
        official.jurisdiction,
        official.party,
        official.level,
        official.state,
        ...official.county,
      ]),
      score: 92 + sourceCount + (official.photo ? 8 : 0),
    });
  }

  for (const district of getSchoolBoardDistricts()) {
    results.push({
      id: `board-district:${district.district_slug}`,
      kind: "board",
      title: district.district,
      description: `${district.county} school-board district with ${district.candidates.length.toLocaleString()} trustee or candidate profiles.`,
      href: getSchoolBoardDistrictUrl(district),
      eyebrow: "School board district",
      badge: district.queueStatus === "dossiers_started" ? "Dossiers" : "Queued",
      state: "TX",
      county: district.county,
      sourceCount: district.sourceLinks?.length ?? district.candidates.reduce((total, candidate) => total + (candidate.sources?.length ?? 0), 0),
      keywords: unique([
        district.district,
        district.county,
        "school board",
        "trustees",
        "isd",
        district.queueStatus,
        ...(district.investigationQueue ?? []),
      ]),
      score: 78 + district.candidates.length,
    });
  }

  for (const candidate of getSchoolBoardDossiers()) {
    results.push({
      id: `board-member:${candidate.candidate_id}`,
      kind: "board",
      title: candidate.full_name,
      description: `${candidate.role ?? candidate.seat ?? "School-board profile"} for ${candidate.district}, ${candidate.county}.`,
      href: getSchoolBoardCandidateUrl(candidate),
      eyebrow: "Board member / candidate",
      badge: candidate.status ?? (candidate.incumbent ? "Incumbent" : "Candidate"),
      state: candidate.state,
      county: candidate.county,
      sourceCount: candidate.sources?.length ?? 0,
      updatedAt: candidate.last_updated,
      keywords: unique([
        candidate.full_name,
        candidate.preferred_name,
        candidate.district,
        candidate.county,
        candidate.role,
        candidate.seat,
        candidate.occupation,
        "school board",
        "trustee",
        ...(candidate.content_themes ?? []),
        ...(candidate.research_gaps ?? []),
      ]),
      score: 72 + (candidate.sources?.length ?? 0),
    });
  }

  addCountyResults(results);
  addAgencyResults(results);

  for (const issue of getIssueCategories()) {
    results.push({
      id: `issue:${issue.id}`,
      kind: "issue",
      title: issue.name,
      description: issue.description,
      href: `/issues/${issue.id}`,
      eyebrow: "Issue lane",
      badge: `Weight ${issue.weight}`,
      keywords: unique([issue.name, issue.id, issue.description, "issue", "scorecard", "votes"]),
      score: 66 + issue.weight,
    });
  }

  for (const bill of getAllBills()) {
    results.push({
      id: `vote:${bill.id}`,
      kind: "vote",
      title: bill.title,
      description: `${bill.session} ${bill.chamber} vote. ${bill.eastTexasImpact}`,
      href: `/votes/${bill.id}`,
      eyebrow: "Vote record",
      badge: bill.status,
      updatedAt: bill.dateVoted,
      sourceCount: bill.sourceUrl ? 1 : 0,
      keywords: unique([
        bill.title,
        bill.summary,
        bill.session,
        bill.chamber,
        bill.status,
        bill.eastTexasImpact,
        ...bill.categories,
        "vote",
        "bill",
        "roll call",
      ]),
      score: 68 + bill.votes.length,
    });
  }

  for (const official of officials) {
    const funding = getFundingSummary(official.id);
    if (!funding) continue;
    results.push({
      id: `funding:${official.id}`,
      kind: "funding",
      title: `${official.name} campaign funding`,
      description: `${funding.cycle}: ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(funding.totalRaised)} raised, ${funding.topDonors.length} top donors loaded.`,
      href: `/funding/${official.id}`,
      eyebrow: "Money trail",
      badge: funding.cycle,
      jurisdiction: official.jurisdiction,
      state: official.state,
      county: official.county[0],
      sourceCount: funding.sources.length,
      updatedAt: funding.lastUpdated,
      keywords: unique([
        official.name,
        "funding",
        "campaign finance",
        "donors",
        "pac",
        funding.cycle,
        ...funding.topDonors.map((donor) => donor.name),
        ...funding.industrySectors.map((sector) => sector.sector),
      ]),
      score: 74 + funding.sources.length + funding.topDonors.length,
    });
  }

  for (const race of getTexasElectionRaces()) {
    results.push({
      id: `campaign:${race.slug}`,
      kind: "campaign",
      title: race.title,
      description: `${race.stage}. ${race.summary}`,
      href: `/elections/texas/${race.slug}`,
      eyebrow: "Campaign / race",
      badge: race.region,
      state: "TX",
      sourceCount: race.sourceLinks.length,
      updatedAt: race.electionDate,
      keywords: unique([
        race.title,
        race.shortTitle,
        race.office,
        race.lane,
        race.region,
        race.geography,
        race.stage,
        race.summary,
        ...race.recordFocus,
        ...race.watchActions,
        "campaign",
        "race",
        "election",
      ]),
      score: 80 + race.priority + race.sourceLinks.length,
    });
  }

  for (const article of getAllNews()) {
    const kind: PredictiveSearchKind = article.featured || article.tags.includes("investigation") ? "story" : "news";
    results.push({
      id: `${kind}:${article.id}`,
      kind,
      title: article.title,
      description: article.summary,
      href: `/news/${article.id}`,
      eyebrow: kind === "story" ? "RepWatchr story" : "News item",
      badge: article.scope ?? article.locationLabel,
      state: article.state,
      county: article.counties?.[0],
      sourceCount: (article.sourceUrl ? 1 : 0) + (article.sourceLinks?.length ?? 0),
      updatedAt: article.publishedAt,
      keywords: unique([
        article.title,
        article.summary,
        article.sourceName,
        article.scope,
        article.state,
        article.locationLabel,
        ...article.tags,
        ...(article.counties ?? []),
        ...(article.cities ?? []),
        ...(article.powerChannels ?? []),
        "story",
        "news",
        "article",
      ]),
      score: 64 + (article.featured ? 20 : 0) + (article.sourceUrl ? 5 : 0),
    });
  }

  const powerProfiles = [
    ...getAttorneyWatchProfiles(),
    ...getMediaWatchProfiles(),
    ...getPublicSafetyWatchProfiles(),
  ];

  for (const profile of powerProfiles) {
    results.push({
      id: `agency-profile:${profile.slug}`,
      kind: profile.kind.includes("agency") ? "agency" : "story",
      title: profile.name,
      description: profile.summary,
      href: powerProfileHref(profile.kind, profile.slug),
      eyebrow: profile.categoryLabel,
      badge: profile.profileStatus,
      state: profile.state,
      county: profile.county,
      sourceCount: profile.sourceLinks.length,
      keywords: unique([
        profile.name,
        profile.kind,
        profile.categoryLabel,
        profile.city,
        profile.county,
        profile.region,
        profile.summary,
        profile.whyTracked,
        ...profile.authorityAreas,
        ...profile.scrutinyAreas,
        ...(profile.profileTags ?? []),
      ]),
      score: 58 + profile.sourceLinks.length,
    });
  }

  predictiveIndexCache = results;
  return results;
}

function makeSuggestion(label: string, href: string, keywords: string[], score: number): PredictiveSearchResult {
  return {
    id: `suggestion:${normalize(label)}`,
    kind: "suggestion",
    title: label,
    description: "Search this lane, then open the strongest source-backed result.",
    href,
    eyebrow: "Suggested search",
    keywords,
    score,
  };
}

function generatedSuggestions(query: string): PredictiveSearchResult[] {
  const cleanQuery = query.trim();
  const base = cleanQuery || "public records";
  const encoded = encodeURIComponent(base);
  return [
    makeSuggestion(`Find ${base} in official profiles`, `/officials?search=${encoded}`, [base, "officials"], 52),
    makeSuggestion(`Check ${base} in school boards`, `/school-boards?search=${encoded}`, [base, "school boards"], 48),
    makeSuggestion(`Open ${base} funding records`, `/funding?search=${encoded}`, [base, "funding", "donors"], 46),
    makeSuggestion(`Search ${base} votes`, `/votes?search=${encoded}`, [base, "votes", "bills"], 44),
    makeSuggestion(`Build a source packet for ${base}`, `/submit-source?summary=${encoded}`, [base, "source packet"], 42),
  ];
}

export function getFallbackSearchSuggestions(kind: "popular" | "trending" | "recent" = "popular") {
  return fallbackSuggestions.map((query, index) => ({
    query,
    label: query,
    kind,
    count: fallbackSuggestions.length - index,
    href: `/search?q=${encodeURIComponent(query)}`,
  }));
}

export function predictiveSearch(query: string, limitPerKind = 6): PredictiveSearchResponse {
  const cleanQuery = query.trim();
  const index = getPredictiveSearchIndex();
  const queryWords = words(cleanQuery);
  const filtered = cleanQuery
    ? index
        .map((result) => ({ ...result, score: scoreResult(result, cleanQuery) }))
        .filter((result) => {
          const haystack = normalize(`${result.title} ${result.description} ${result.eyebrow} ${result.keywords.join(" ")}`);
          return queryWords.length === 0 || queryWords.some((word) => haystack.includes(word));
        })
        .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    : [...index].sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  const groups = SEARCH_KIND_ORDER.map((kind) => ({
    kind,
    label: SEARCH_KIND_LABELS[kind],
    results: filtered.filter((result) => result.kind === kind).slice(0, limitPerKind),
  })).filter((group) => group.results.length > 0);

  return {
    query: cleanQuery,
    total: filtered.length,
    groups,
    suggestions: generatedSuggestions(cleanQuery).slice(0, limitPerKind),
  };
}
