import {
  getAllBills,
  getAllNews,
  getAllOfficials,
  getFundingSummary,
  getIssueCategories,
  getRepWatchrDataStats,
} from "@/lib/data";
import { getRepWatchrServices } from "@/data/repwatchr-services";
import { getTexasCountyHubs, getTexasDistrictHubs, getTexasRaceHubRaces } from "@/lib/race-hub";
import {
  getAttorneyWatchProfiles,
  getMediaWatchProfiles,
  getPublicSafetyWatchProfiles,
} from "@/lib/power-watch";
import {
  getSchoolBoardDistricts,
  getSchoolBoardDossiers,
  getSchoolBoardStats,
} from "@/lib/school-board-research";
import {
  getCandidateUrlSlug,
  getDistrictUrlSlug,
  getSchoolBoardCandidateUrl,
  getSchoolBoardDistrictUrl,
} from "@/lib/school-board-urls";
import { hasCampaignFinanceSourcePath } from "@/lib/campaign-finance-sources";
import { absoluteRepWatchrUrl, buildOgImageUrl } from "@/lib/repwatchr-seo";

export type SeoSitemapKind =
  | "static"
  | "officials"
  | "school-boards"
  | "races"
  | "stories"
  | "red-flags-funding";

export type SeoUrlType =
  | SeoSitemapKind
  | "images"
  | "news";

export type SeoUrlRecord = {
  type: SeoUrlType;
  path: string;
  url: string;
  title: string;
  description: string;
  canonical: string;
  lastModified: Date;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
  imageUrl?: string;
  imageTitle?: string;
  newsPublicationDate?: Date;
};

type StaticSeoPage = {
  path: string;
  title: string;
  description: string;
  priority?: number;
  changeFrequency?: SeoUrlRecord["changeFrequency"];
  imageKind?: string;
};

const now = () => new Date();

const staticSeoPages: StaticSeoPage[] = [
  {
    path: "/",
    title: "RepWatchr - Public Officials on the Record",
    description: "Find officials, school boards, votes, funding, red flags, and source-backed accountability records.",
    priority: 1,
    imageKind: "home",
  },
  {
    path: "/about",
    title: "About RepWatchr",
    description: "RepWatchr is a public-record accountability system for officials, boards, votes, funding, and source links.",
  },
  {
    path: "/officials",
    title: "National Elected Officials Directory",
    description: "Choose a state to browse sourced elected-official profiles and public records.",
  },
  {
    path: "/authority-watch",
    title: "Authority Watch",
    description: "Public authority profiles and source-backed accountability lanes.",
  },
  {
    path: "/school-boards",
    title: "National School Board Watch",
    description: "Find school-board trustees, district profiles, public questions, and source records.",
    imageKind: "school-board",
  },
  {
    path: "/elections",
    title: "Election Command Center",
    description: "Find officials, inspect votes, check money, open red flags, submit sources, and share records.",
    imageKind: "race",
  },
  {
    path: "/elections/texas",
    title: "Texas Election Races 2026",
    description: "Statewide Texas races, East Texas races, officials, votes, money, source links, and citizen contributions.",
    imageKind: "race",
  },
  {
    path: "/elections/texas/contribute",
    title: "Contribute Texas Election Records",
    description: "Build source-backed Texas election record packets for RepWatchr review.",
    imageKind: "source-packet",
  },
  {
    path: "/submit-source",
    title: "Submit Source",
    description: "Send RepWatchr a public source, correction, roster, vote, filing, meeting record, or missing official.",
    imageKind: "source-packet",
  },
  {
    path: "/blog",
    title: "RepWatchr Blog",
    description: "Source-backed RepWatchr articles on elections, officials, school boards, campaign finance, and records.",
    imageKind: "news",
  },
  {
    path: "/feed",
    title: "RepWatchr Feed",
    description: "Source-backed stories, snippets, records, officials, school boards, votes, money, and red flags.",
    imageKind: "news",
  },
  {
    path: "/daily-wire",
    title: "Daily Watch Wire",
    description: "Daily public-accountability wire items organized by officials, oversight, money, courts, elections, and media.",
    imageKind: "news",
  },
  {
    path: "/services",
    title: "RepWatchr Services",
    description: "Free source-packet tools and paid public-record research services.",
    imageKind: "services",
  },
  {
    path: "/funding",
    title: "Campaign Funding",
    description: "Follow reported campaign money, donor categories, geography, source paths, and missing finance records.",
    imageKind: "funding",
  },
  {
    path: "/data-reports",
    title: "Data Reports",
    description: "RepWatchr data coverage, source inventory, and public-record buildout status.",
  },
  {
    path: "/red-flags",
    title: "Red Flags",
    description: "Public-record questions, red flags, source links, and review issues voters should inspect.",
    imageKind: "red-flag",
  },
  {
    path: "/votes",
    title: "Tracked Votes",
    description: "Bills and roll-call vote records that factor into public official scorecards.",
  },
  {
    path: "/news",
    title: "Public Accountability Stories",
    description: "Source-backed stories tied to officials, school boards, elections, courts, money, and public offices.",
    imageKind: "news",
  },
  {
    path: "/issues",
    title: "Texas Issues",
    description: "The issues RepWatchr tracks: water rights, property rights, taxes, transparency, and voting records.",
  },
  {
    path: "/scorecards",
    title: "Universal Scorecards",
    description: "Source-backed scorecards for RepWatchr public profiles and verified profile votes.",
  },
  {
    path: "/methodology",
    title: "Methodology",
    description: "How RepWatchr separates facts, records, scored votes, source gaps, and review status.",
    imageKind: "methodology",
  },
  {
    path: "/privacy",
    title: "Privacy Policy",
    description: "RepWatchr privacy policy and data-use terms.",
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    path: "/terms",
    title: "Terms of Service",
    description: "RepWatchr terms of service.",
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    path: "/attorneys",
    title: "Attorney Watch",
    description: "Source-backed attorney, law-firm, and public legal-system profile lanes.",
  },
  {
    path: "/media",
    title: "National Media Watch",
    description: "Source-backed newsroom, editor, reporter, ownership, correction, and public-coverage records.",
  },
  {
    path: "/public-safety",
    title: "Public Safety Watch",
    description: "Source-backed public safety agencies, sheriffs, police chiefs, and oversight records.",
  },
  {
    path: "/east-texas-predator-watch",
    title: "East Texas Predator Watch",
    description: "Public registry source paths and public-safety record review for East Texas.",
  },
  {
    path: "/authors",
    title: "RepWatchr Authors",
    description: "RepWatchr publishing and source review credits.",
  },
  {
    path: "/state-reps",
    title: "State Representatives",
    description: "Source-seeded state representative and state senator profiles across the United States.",
  },
];

function parsedDate(value: string | undefined, fallback: Date) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function urlRecord(input: Omit<SeoUrlRecord, "url" | "canonical">): SeoUrlRecord {
  const url = absoluteRepWatchrUrl(input.path);
  return {
    ...input,
    url,
    canonical: url,
  };
}

function staticRecords(): SeoUrlRecord[] {
  const date = now();
  return staticSeoPages.map((page) =>
    urlRecord({
      type: page.path === "/funding" || page.path === "/red-flags" ? "red-flags-funding" : "static",
      path: page.path,
      title: page.title,
      description: page.description,
      lastModified: date,
      changeFrequency: page.changeFrequency ?? "weekly",
      priority: page.priority ?? 0.72,
      imageUrl: buildOgImageUrl(page.imageKind ?? "home"),
      imageTitle: `${page.title} social preview`,
    }),
  );
}

function officialRecords(): SeoUrlRecord[] {
  const date = now();
  return getAllOfficials().map((official) =>
    urlRecord({
      type: "officials",
      path: `/officials/${official.id}`,
      title: `${official.name} - ${official.position}`,
      description: `Source-backed RepWatchr profile for ${official.name}, ${official.position} serving ${official.jurisdiction}.`,
      lastModified: parsedDate(official.lastVerifiedAt, date),
      changeFrequency: "weekly",
      priority: official.level === "federal" ? 0.78 : 0.72,
      imageUrl: buildOgImageUrl("official", { id: official.id }),
      imageTitle: `${official.name} RepWatchr profile`,
    }),
  );
}

function schoolBoardRecords(): SeoUrlRecord[] {
  const date = now();
  const districtRecords = getSchoolBoardDistricts().map((district) =>
    urlRecord({
      type: "school-boards" as const,
      path: getSchoolBoardDistrictUrl(district),
      title: `${district.district} School Board`,
      description: `${district.district} board-member profiles, district facts, source records, praise reports, and public questions.`,
      lastModified: date,
      changeFrequency: "weekly",
      priority: 0.72,
      imageUrl: buildOgImageUrl("school-board", { type: "district", district: getDistrictUrlSlug(district.district_slug) }),
      imageTitle: `${district.district} school board profile`,
    }),
  );

  const memberRecords = getSchoolBoardDossiers().map((candidate) =>
    urlRecord({
      type: "school-boards" as const,
      path: getSchoolBoardCandidateUrl(candidate),
      title: `${candidate.preferred_name ?? candidate.full_name} School Board File`,
      description: `${candidate.district} school-board record for ${candidate.preferred_name ?? candidate.full_name}.`,
      lastModified: date,
      changeFrequency: "monthly",
      priority: 0.68,
      imageUrl: buildOgImageUrl("school-board", {
        type: "member",
        district: getDistrictUrlSlug(candidate.district_slug),
        candidate: getCandidateUrlSlug(candidate),
      }),
      imageTitle: `${candidate.preferred_name ?? candidate.full_name} school board profile`,
    }),
  );

  return [...districtRecords, ...memberRecords];
}

function raceRecords(): SeoUrlRecord[] {
  const date = now();
  const races = getTexasRaceHubRaces().map((race) =>
    urlRecord({
      type: "races" as const,
      path: race.href,
      title: `${race.title} | RepWatchr`,
      description: race.summary,
      lastModified: date,
      changeFrequency: "weekly",
      priority: race.lane === "big-race" ? 0.82 : 0.76,
      imageUrl: buildOgImageUrl("race", { slug: race.slug }),
      imageTitle: `${race.title} race preview`,
    }),
  );
  const counties = getTexasCountyHubs().map((county) =>
    urlRecord({
      type: "races" as const,
      path: county.href,
      title: `${county.name} | RepWatchr`,
      description: county.summary,
      lastModified: date,
      changeFrequency: "weekly",
      priority: 0.74,
      imageUrl: buildOgImageUrl("race", { slug: county.slug }),
      imageTitle: `${county.name} preview`,
    }),
  );
  const districts = getTexasDistrictHubs().map((district) =>
    urlRecord({
      type: "races" as const,
      path: district.href,
      title: `${district.name} Election Hub | RepWatchr`,
      description: district.summary,
      lastModified: date,
      changeFrequency: "weekly",
      priority: 0.72,
      imageUrl: buildOgImageUrl("race", { slug: district.slug }),
      imageTitle: `${district.name} preview`,
    }),
  );

  return [...races, ...counties, ...districts];
}

function storyRecords(): SeoUrlRecord[] {
  return getAllNews().map((article) =>
    urlRecord({
      type: "stories",
      path: `/news/${article.id}`,
      title: article.title,
      description: article.summary,
      lastModified: parsedDate(article.publishedAt, now()),
      changeFrequency: "weekly",
      priority: article.featured ? 0.78 : 0.68,
      imageUrl: buildOgImageUrl("news", { id: article.id }),
      imageTitle: `${article.title} story preview`,
      newsPublicationDate: parsedDate(article.publishedAt, now()),
    }),
  );
}

function fundingRecords(): SeoUrlRecord[] {
  const date = now();
  return getAllOfficials()
    .filter((official) => getFundingSummary(official.id) || hasCampaignFinanceSourcePath(official))
    .map((official) =>
      urlRecord({
        type: "red-flags-funding",
        path: `/funding/${official.id}`,
        title: `Funding: ${official.name}`,
        description: `Campaign finance source path and reported funding data for ${official.name}, ${official.position}.`,
        lastModified: date,
        changeFrequency: "weekly",
        priority: 0.64,
        imageUrl: buildOgImageUrl("funding", { officialId: official.id }),
        imageTitle: `${official.name} funding preview`,
      }),
    );
}

function publicDataRecords(): SeoUrlRecord[] {
  const date = now();
  const voteRecords = getAllBills().map((bill) =>
    urlRecord({
      type: "static" as const,
      path: `/votes/${bill.id}`,
      title: `${bill.title} | RepWatchr Vote Record`,
      description: bill.summary,
      lastModified: parsedDate(bill.dateVoted, date),
      changeFrequency: "monthly",
      priority: 0.62,
      imageUrl: buildOgImageUrl("methodology"),
      imageTitle: `${bill.title} vote record preview`,
    }),
  );

  const issueRecords = getIssueCategories().flatMap((issue) => [
    urlRecord({
      type: "static" as const,
      path: `/issues/${issue.id}`,
      title: `${issue.name} - Texas Issues`,
      description: issue.description,
      lastModified: date,
      changeFrequency: "monthly",
      priority: 0.58,
      imageUrl: buildOgImageUrl("methodology"),
      imageTitle: `${issue.name} issue preview`,
    }),
    urlRecord({
      type: "static" as const,
      path: `/scorecards/${issue.id}`,
      title: `${issue.name} Scorecard`,
      description: issue.description,
      lastModified: date,
      changeFrequency: "monthly",
      priority: 0.58,
      imageUrl: buildOgImageUrl("methodology"),
      imageTitle: `${issue.name} scorecard preview`,
    }),
  ]);

  const serviceRecords = getRepWatchrServices().map((service) =>
    urlRecord({
      type: "static" as const,
      path: `/services/${service.slug}`,
      title: `${service.name} | RepWatchr Services`,
      description: service.summary,
      lastModified: date,
      changeFrequency: "monthly",
      priority: service.featured ? 0.72 : 0.66,
      imageUrl: buildOgImageUrl("services", { slug: service.slug }),
      imageTitle: `${service.name} service preview`,
    }),
  );

  const powerProfileRecords = [
    ...getAttorneyWatchProfiles().map((profile) => ({ base: "/attorneys", profile })),
    ...getMediaWatchProfiles().map((profile) => ({ base: "/media", profile })),
    ...getPublicSafetyWatchProfiles().map((profile) => ({ base: "/public-safety", profile })),
  ].map(({ base, profile }) =>
    urlRecord({
      type: "static" as const,
      path: `${base}/${profile.slug}`,
      title: `${profile.name} | RepWatchr`,
      description: profile.summary,
      lastModified: date,
      changeFrequency: "monthly",
      priority: 0.54,
      imageUrl: buildOgImageUrl("home"),
      imageTitle: `${profile.name} profile preview`,
    }),
  );

  return [...voteRecords, ...issueRecords, ...serviceRecords, ...powerProfileRecords];
}

export function getSeoSitemapRecords(kind: SeoSitemapKind): SeoUrlRecord[] {
  const allStatic = [...staticRecords(), ...publicDataRecords()];
  if (kind === "static") return allStatic.filter((record) => record.type === "static");
  if (kind === "officials") return officialRecords();
  if (kind === "school-boards") return schoolBoardRecords();
  if (kind === "races") return raceRecords();
  if (kind === "stories") return storyRecords();
  if (kind === "red-flags-funding") {
    return [
      ...staticRecords().filter((record) => record.type === "red-flags-funding"),
      ...fundingRecords(),
    ];
  }
  return [];
}

export function getAllIndexableSeoRecords() {
  const kinds: SeoSitemapKind[] = ["static", "officials", "school-boards", "races", "stories", "red-flags-funding"];
  return kinds.flatMap(getSeoSitemapRecords);
}

export function getRecentNewsSeoRecords(referenceDate = now()) {
  const cutoff = referenceDate.getTime() - 1000 * 60 * 60 * 48;
  return storyRecords().filter((record) => (record.newsPublicationDate?.getTime() ?? 0) >= cutoff);
}

export function getImageSeoRecords() {
  return getAllIndexableSeoRecords().filter((record) => Boolean(record.imageUrl));
}

export function getSitemapIndexRecords() {
  const date = now();
  return [
    "/sitemaps/static.xml",
    "/sitemaps/officials.xml",
    "/sitemaps/school-boards.xml",
    "/sitemaps/races.xml",
    "/sitemaps/stories.xml",
    "/sitemaps/red-flags-funding.xml",
    "/image-sitemap.xml",
    "/news-sitemap.xml",
  ].map((path) => ({
    loc: absoluteRepWatchrUrl(path),
    lastmod: date,
  }));
}

function duplicates(values: string[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value, count]) => ({ value, count }));
}

export function buildSeoReport() {
  const records = getAllIndexableSeoRecords();
  const byType = records.reduce<Record<string, number>>((acc, record) => {
    acc[record.type] = (acc[record.type] ?? 0) + 1;
    return acc;
  }, {});
  const missingMetadata = records
    .filter((record) => !record.title || !record.description)
    .map((record) => record.path);
  const missingCanonical = records
    .filter((record) => record.canonical !== record.url || !record.url.startsWith("https://www.repwatchr.com"))
    .map((record) => record.path);
  const missingOgImage = records
    .filter((record) => !record.imageUrl)
    .map((record) => record.path);
  const duplicateUrls = duplicates(records.map((record) => record.url));
  const duplicateSlugs = duplicates(records.map((record) => record.path.split("/").filter(Boolean).at(-1) ?? "/"));
  const stats = getRepWatchrDataStats();
  const schoolStats = getSchoolBoardStats();

  return {
    generatedAt: new Date().toISOString(),
    note: "This reports technical sitemap and metadata coverage only. It does not claim Google has indexed any URL.",
    indexedSitemapUrlsByType: byType,
    totalIndexedSitemapUrls: records.length,
    imageSitemapUrls: getImageSeoRecords().length,
    recentNewsSitemapUrls: getRecentNewsSeoRecords().length,
    missingMetadata,
    missingCanonical,
    missingOgImage,
    duplicateUrls,
    duplicateSlugs,
    orphanPages: {
      note: "Static route scanning is handled by scripts/seo-report.mjs; this runtime report uses the canonical inventory.",
      count: 0,
      paths: [] as string[],
    },
    sourceCounts: {
      officialFiles: stats.officialFiles,
      schoolBoardProfiles: schoolStats.candidates,
      schoolBoardDistricts: schoolStats.districts,
      newsArticles: stats.newsArticles,
      fundingSummaries: stats.fundingSummaries,
      publicVoteRows: stats.publicVoteRecordRows,
      publicSourceUrls: stats.publicSourceUrls,
    },
  };
}
