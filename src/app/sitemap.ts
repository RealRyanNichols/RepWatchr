import type { MetadataRoute } from "next";
import {
  getAllBills,
  getAllNews,
  getAllOfficials,
  getFundingSummary,
  getIssueCategories,
} from "@/lib/data";
import {
  getAttorneyWatchProfiles,
  getMediaWatchProfiles,
  getPublicSafetyWatchProfiles,
} from "@/lib/power-watch";
import { getPredatorWatchProfiles } from "@/lib/predator-watch";
import { getSchoolBoardDistricts, getSchoolBoardDossiers } from "@/lib/school-board-research";
import { getSchoolBoardCandidateUrl, getSchoolBoardDistrictUrl } from "@/lib/school-board-urls";

const siteUrl = "https://www.repwatchr.com";

function lastModifiedFrom(value: string | undefined, fallback: Date) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/feed",
    "/daily-wire",
    "/officials",
    "/state-reps",
    "/school-boards",
    "/attorneys",
    "/media",
    "/public-safety",
    "/east-texas-predator-watch",
    "/uap",
    "/faretta-ai",
    "/gideon",
    "/feedback",
    "/create-account",
    "/profiles/claim",
    "/funding",
    "/red-flags",
    "/votes",
    "/news",
    "/issues",
    "/scorecards",
    "/data-reports",
    "/buildout",
    "/methodology",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const districtRoutes = getSchoolBoardDistricts().map((district) => ({
    url: `${siteUrl}${getSchoolBoardDistrictUrl(district)}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.75,
  }));

  const memberRoutes = getSchoolBoardDossiers().map((candidate) => ({
    url: `${siteUrl}${getSchoolBoardCandidateUrl(candidate)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const attorneyRoutes = getAttorneyWatchProfiles().map((profile) => ({
    url: `${siteUrl}/attorneys/${profile.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const mediaRoutes = getMediaWatchProfiles().map((profile) => ({
    url: `${siteUrl}/media/${profile.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const publicSafetyRoutes = getPublicSafetyWatchProfiles().map((profile) => ({
    url: `${siteUrl}/public-safety/${profile.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const predatorWatchRoutes = (await getPredatorWatchProfiles()).map((profile) => ({
    url: `${siteUrl}/east-texas-predator-watch/${profile.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const officialRoutes = getAllOfficials().map((official) => ({
    url: `${siteUrl}/officials/${official.id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.72,
  }));

  const fundingRoutes = getAllOfficials()
    .filter((official) => getFundingSummary(official.id))
    .map((official) => ({
      url: `${siteUrl}/funding/${official.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.64,
    }));

  const voteRoutes = getAllBills().map((bill) => ({
    url: `${siteUrl}/votes/${bill.id}`,
    lastModified: lastModifiedFrom(bill.dateVoted, now),
    changeFrequency: "monthly" as const,
    priority: 0.68,
  }));

  const newsRoutes = getAllNews().map((article) => ({
    url: `${siteUrl}/news/${article.id}`,
    lastModified: lastModifiedFrom(article.publishedAt, now),
    changeFrequency: "weekly" as const,
    priority: article.featured ? 0.76 : 0.66,
  }));

  const issueRoutes = getIssueCategories().map((issue) => ({
    url: `${siteUrl}/issues/${issue.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.62,
  }));

  const scorecardRoutes = getIssueCategories().map((issue) => ({
    url: `${siteUrl}/scorecards/${issue.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.62,
  }));

  return [
    ...staticRoutes,
    ...officialRoutes,
    ...fundingRoutes,
    ...voteRoutes,
    ...newsRoutes,
    ...issueRoutes,
    ...scorecardRoutes,
    ...districtRoutes,
    ...memberRoutes,
    ...attorneyRoutes,
    ...mediaRoutes,
    ...publicSafetyRoutes,
    ...predatorWatchRoutes,
  ];
}
