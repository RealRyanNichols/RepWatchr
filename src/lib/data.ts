// ============================================================
// East Texas Official Tracker - Data Loading Library
// ============================================================
// Server-side data loading from JSON files in src/data/
// Uses Node.js fs for file reading, with caching at module level.

import fs from "fs";
import path from "path";
import type {
  Official,
  GovernmentLevel,
  ScoreCard,
  FundingSummary,
  RedFlag,
  Bill,
  IssueCategory,
  OfficialWithScores,
  NewsArticle,
} from "@/types";

// Base path to the data directory
const DATA_DIR = path.join(process.cwd(), "src", "data");

// ---------------------------------------------------------------------------
// Module-level caches
// ---------------------------------------------------------------------------
let officialsCache: Official[] | null = null;
let billsCache: Bill[] | null = null;
let issueCategoriesCache: IssueCategory[] | null = null;
let newsCache: NewsArticle[] | null = null;
const scoreCardCache = new Map<string, ScoreCard>();
const fundingCache = new Map<string, FundingSummary>();
const redFlagCache = new Map<string, RedFlag[]>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safely read and parse a JSON file. Returns `undefined` when the file does
 * not exist or cannot be parsed.
 */
function readJsonFile<T>(filePath: string): T | undefined {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

/**
 * Recursively collect all `.json` file paths under `dir`.
 */
function collectJsonFiles(dir: string): string[] {
  const results: string[] = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...collectJsonFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        results.push(fullPath);
      }
    }
  } catch {
    // Directory may not exist yet during development
  }

  return results;
}

const levelOrder: Record<GovernmentLevel, number> = {
  federal: 0,
  state: 1,
  county: 2,
  city: 3,
  "school-board": 4,
};

function districtSortValue(district?: string): number {
  const match = district?.match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

const FEDERAL_EXPECTED_SEATS = {
  house: 435,
  senate: 100,
} as const;

const TEXAS_EXPECTED_SEATS = {
  stateHouse: 150,
  stateSenate: 31,
} as const;

// ---------------------------------------------------------------------------
// Officials
// ---------------------------------------------------------------------------

/**
 * Load every official JSON file from all subdirectories of src/data/officials/.
 * Results are cached after the first call.
 */
export function getAllOfficials(): Official[] {
  if (officialsCache) return officialsCache;

  const officialsDir = path.join(DATA_DIR, "officials");
  const files = collectJsonFiles(officialsDir);
  const officials: Official[] = [];

  for (const file of files) {
    const official = readJsonFile<Official>(file);
    if (official) {
      officials.push(official);
    }
  }

  officials.sort(
    (a, b) =>
      levelOrder[a.level] - levelOrder[b.level] ||
      districtSortValue(a.district) - districtSortValue(b.district) ||
      a.name.localeCompare(b.name),
  );
  officialsCache = officials;
  return officials;
}

/**
 * Find a single official by their unique id.
 */
export function getOfficialById(id: string): Official | undefined {
  return getAllOfficials().find((o) => o.id === id);
}

/**
 * Return all officials at a given government level (federal, state, etc.).
 */
export function getOfficialsByLevel(level: GovernmentLevel): Official[] {
  return getAllOfficials().filter((o) => o.level === level);
}

/**
 * Return all officials associated with a given county name.
 * The match is case-insensitive.
 */
export function getOfficialsByCounty(county: string): Official[] {
  const target = county.toLowerCase();
  return getAllOfficials().filter((o) =>
    o.county.some((c) => c.toLowerCase() === target)
  );
}

// ---------------------------------------------------------------------------
// Score Cards
// ---------------------------------------------------------------------------

/**
 * Load the ScoreCard for a given official. Cached per official id.
 */
export function getScoreCard(officialId: string): ScoreCard | undefined {
  if (scoreCardCache.has(officialId)) return scoreCardCache.get(officialId);

  const filePath = path.join(DATA_DIR, "scores", `${officialId}.json`);
  const scoreCard = readJsonFile<ScoreCard>(filePath);

  if (scoreCard) {
    scoreCardCache.set(officialId, scoreCard);
  }

  return scoreCard;
}

/**
 * Load all ScoreCards for all officials that have them.
 */
export function getAllScoreCards(): ScoreCard[] {
  const officials = getAllOfficials();
  const scoreCards: ScoreCard[] = [];
  for (const official of officials) {
    const sc = getScoreCard(official.id);
    if (sc) scoreCards.push(sc);
  }
  return scoreCards;
}

// ---------------------------------------------------------------------------
// Funding
// ---------------------------------------------------------------------------

/**
 * Load the FundingSummary for a given official. Cached per official id.
 */
export function getFundingSummary(
  officialId: string
): FundingSummary | undefined {
  if (fundingCache.has(officialId)) return fundingCache.get(officialId);

  const filePath = path.join(DATA_DIR, "funding", `${officialId}.json`);
  const funding = readJsonFile<FundingSummary>(filePath);

  if (funding) {
    fundingCache.set(officialId, funding);
  }

  return funding;
}

// ---------------------------------------------------------------------------
// Red Flags
// ---------------------------------------------------------------------------

/**
 * Load the RedFlag array for a given official. Cached per official id.
 */
export function getRedFlags(officialId: string): RedFlag[] {
  if (redFlagCache.has(officialId)) return redFlagCache.get(officialId)!;

  const filePath = path.join(DATA_DIR, "red-flags", `${officialId}.json`);
  const flags = readJsonFile<RedFlag[]>(filePath) ?? [];

  redFlagCache.set(officialId, flags);
  return flags;
}

// ---------------------------------------------------------------------------
// Bills / Votes
// ---------------------------------------------------------------------------

/**
 * Load all Bill JSON files from src/data/votes/. Cached after first call.
 */
export function getAllBills(): Bill[] {
  if (billsCache) return billsCache;

  const votesDir = path.join(DATA_DIR, "votes");
  const files = collectJsonFiles(votesDir);
  const bills: Bill[] = [];

  for (const file of files) {
    const bill = readJsonFile<Bill>(file);
    if (bill) {
      bills.push(bill);
    }
  }

  billsCache = bills;
  return bills;
}

/**
 * Find a single bill by its unique id.
 */
export function getBillById(id: string): Bill | undefined {
  return getAllBills().find((b) => b.id === id);
}

// ---------------------------------------------------------------------------
// Issue Categories
// ---------------------------------------------------------------------------

/**
 * Load the issue categories list from src/data/issues/categories.json.
 * Cached after first call.
 */
export function getIssueCategories(): IssueCategory[] {
  if (issueCategoriesCache) return issueCategoriesCache;

  const filePath = path.join(DATA_DIR, "issues", "categories.json");
  const categories = readJsonFile<IssueCategory[]>(filePath) ?? [];

  issueCategoriesCache = categories;
  return categories;
}

// ---------------------------------------------------------------------------
// Combined / Computed
// ---------------------------------------------------------------------------

/**
 * Build an OfficialWithScores object that combines the official record with
 * their score card, funding summary, and red flags.
 */
export function getOfficialWithScores(
  id: string
): OfficialWithScores | undefined {
  const official = getOfficialById(id);
  if (!official) return undefined;

  return {
    ...official,
    scoreCard: getScoreCard(id),
    fundingSummary: getFundingSummary(id),
    redFlags: getRedFlags(id),
  };
}

export function getRepWatchrDataStats() {
  const officials = getAllOfficials();
  const scoreCards = getAllScoreCards();
  const bills = getAllBills();
  const issueCategories = getIssueCategories();
  const newsArticles = getAllNews();
  const fundingSummaries = officials
    .map((official) => getFundingSummary(official.id))
    .filter((funding): funding is FundingSummary => Boolean(funding));
  const redFlagRows = officials.flatMap((official) => getRedFlags(official.id));
  const levelCounts = officials.reduce<Record<GovernmentLevel, number>>(
    (acc, official) => {
      acc[official.level] = (acc[official.level] ?? 0) + 1;
      return acc;
    },
    {
      federal: 0,
      state: 0,
      county: 0,
      city: 0,
      "school-board": 0,
    },
  );
  const counties = new Set(officials.flatMap((official) => official.county));
  const publicSourceUrls = new Set<string>();
  const officialSourceUrls = new Set<string>();
  const fundingSourceUrls = new Set<string>();
  const redFlagSourceUrls = new Set<string>();
  const voteSourceUrls = new Set<string>();
  const newsSourceUrls = new Set<string>();
  const reviewStatusCounts = officials.reduce<Record<string, number>>((acc, official) => {
    const status = official.reviewStatus ?? "missing";
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});
  const federalHouseProfilesLoaded = officials.filter(
    (official) => official.level === "federal" && official.position === "U.S. Representative",
  ).length;
  const federalSenateProfilesLoaded = officials.filter(
    (official) => official.level === "federal" && official.position === "U.S. Senator",
  ).length;
  const texasHouseProfilesLoaded = officials.filter(
    (official) => official.level === "state" && official.position === "State Representative",
  ).length;
  const texasSenateProfilesLoaded = officials.filter(
    (official) => official.level === "state" && official.position === "State Senator",
  ).length;
  const federalExpectedSeats = FEDERAL_EXPECTED_SEATS.house + FEDERAL_EXPECTED_SEATS.senate;
  const stateLegislatureExpectedSeats = TEXAS_EXPECTED_SEATS.stateHouse + TEXAS_EXPECTED_SEATS.stateSenate;
  const federalProfilesLoaded = federalHouseProfilesLoaded + federalSenateProfilesLoaded;
  const stateLegislatorProfilesLoaded = texasHouseProfilesLoaded + texasSenateProfilesLoaded;
  const federalAndStateSeatProfilesLoaded = federalProfilesLoaded + stateLegislatorProfilesLoaded;
  const federalAndStateExpectedSeats = federalExpectedSeats + stateLegislatureExpectedSeats;

  fundingSummaries.forEach((funding) => {
    funding.sources.forEach((source) => {
      if (source.url) {
        fundingSourceUrls.add(source.url);
        publicSourceUrls.add(source.url);
      }
    });
  });
  redFlagRows.forEach((flag) => {
    if (flag.sourceUrl) {
      redFlagSourceUrls.add(flag.sourceUrl);
      publicSourceUrls.add(flag.sourceUrl);
    }
  });
  bills.forEach((bill) => {
    if (bill.sourceUrl) {
      voteSourceUrls.add(bill.sourceUrl);
      publicSourceUrls.add(bill.sourceUrl);
    }
  });
  newsArticles.forEach((article) => {
    if (article.sourceUrl) {
      newsSourceUrls.add(article.sourceUrl);
      publicSourceUrls.add(article.sourceUrl);
    }
  });
  officials.forEach((official) => {
    official.sourceLinks?.forEach((source) => {
      if (source.url) {
        officialSourceUrls.add(source.url);
        publicSourceUrls.add(source.url);
      }
    });
    if (official.photoSourceUrl) {
      officialSourceUrls.add(official.photoSourceUrl);
      publicSourceUrls.add(official.photoSourceUrl);
    }
    if (official.contactInfo.website) {
      officialSourceUrls.add(official.contactInfo.website);
      publicSourceUrls.add(official.contactInfo.website);
    }
  });

  return {
    officialFiles: officials.length,
    nonSchoolOfficialFiles: officials.filter((official) => official.level !== "school-board").length,
    legacySchoolBoardOfficialFiles: levelCounts["school-board"],
    levelCounts,
    counties: counties.size,
    federalProfilesLoaded,
    federalExpectedSeats,
    federalHouseProfilesLoaded,
    federalHouseExpectedSeats: FEDERAL_EXPECTED_SEATS.house,
    federalSenateProfilesLoaded,
    federalSenateExpectedSeats: FEDERAL_EXPECTED_SEATS.senate,
    federalProfileGaps: Math.max(0, federalExpectedSeats - federalProfilesLoaded),
    stateLegislatorProfilesLoaded,
    stateLegislatureExpectedSeats,
    texasHouseProfilesLoaded,
    texasHouseExpectedSeats: TEXAS_EXPECTED_SEATS.stateHouse,
    texasSenateProfilesLoaded,
    texasSenateExpectedSeats: TEXAS_EXPECTED_SEATS.stateSenate,
    stateLegislatureProfileGaps: Math.max(0, stateLegislatureExpectedSeats - stateLegislatorProfilesLoaded),
    federalAndStateSeatProfilesLoaded,
    federalAndStateExpectedSeats,
    federalAndStateProfileGaps: Math.max(0, federalAndStateExpectedSeats - federalAndStateSeatProfilesLoaded),
    countyCityOfficialFiles: levelCounts.county + levelCounts.city,
    sourceSeededOfficialProfiles: reviewStatusCounts.source_seeded ?? 0,
    verifiedOfficialProfiles: reviewStatusCounts.verified ?? 0,
    completeOfficialProfiles: reviewStatusCounts.complete ?? 0,
    needsSourceReviewOfficialProfiles: reviewStatusCounts.needs_source_review ?? 0,
    missingReviewStatusOfficialProfiles: reviewStatusCounts.missing ?? 0,
    reviewStatusCounts,
    officialsWithPhotos: officials.filter((official) => Boolean(official.photo)).length,
    officialsWithSourceLinks: officials.filter((official) => (official.sourceLinks?.length ?? 0) > 0).length,
    officialsWithWebsites: officials.filter((official) => Boolean(official.contactInfo.website)).length,
    scoreCards: scoreCards.length,
    officialsWithScoreCards: new Set(scoreCards.map((scoreCard) => scoreCard.officialId)).size,
    fundingSummaries: fundingSummaries.length,
    officialsWithFundingSummaries: new Set(fundingSummaries.map((funding) => funding.officialId)).size,
    redFlagItems: redFlagRows.length,
    officialsWithRedFlags: new Set(redFlagRows.map((flag) => flag.officialId)).size,
    bills: bills.length,
    scoredVoteRows: bills.reduce((total, bill) => total + bill.votes.length, 0),
    issueCategories: issueCategories.length,
    newsArticles: newsArticles.length,
    featuredNewsArticles: newsArticles.filter((article) => article.featured).length,
    officialSourceUrls: officialSourceUrls.size,
    fundingSourceUrls: fundingSourceUrls.size,
    redFlagSourceUrls: redFlagSourceUrls.size,
    voteSourceUrls: voteSourceUrls.size,
    newsSourceUrls: newsSourceUrls.size,
    publicSourceUrls: publicSourceUrls.size,
  };
}

// ---------------------------------------------------------------------------
// News / Articles
// ---------------------------------------------------------------------------

/**
 * Load all news articles from src/data/news/. Cached after first call.
 * Sorted by publishedAt descending (newest first).
 */
export function getAllNews(): NewsArticle[] {
  if (newsCache) return newsCache;

  const newsDir = path.join(DATA_DIR, "news");
  const files = collectJsonFiles(newsDir);
  const articles: NewsArticle[] = [];

  for (const file of files) {
    const article = readJsonFile<NewsArticle>(file);
    if (article) {
      articles.push(article);
    }
  }

  articles.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  newsCache = articles;
  return articles;
}

/**
 * Find a single news article by its id.
 */
export function getNewsById(id: string): NewsArticle | undefined {
  return getAllNews().find((n) => n.id === id);
}

/**
 * Get all news articles linked to a specific official.
 */
export function getNewsByOfficialId(officialId: string): NewsArticle[] {
  return getAllNews().filter((n) => n.officialIds.includes(officialId));
}

/**
 * Get featured/breaking news articles.
 */
export function getFeaturedNews(): NewsArticle[] {
  return getAllNews().filter((n) => n.featured);
}
