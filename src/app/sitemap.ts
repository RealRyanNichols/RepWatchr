import type { MetadataRoute } from "next";
import { getAttorneyWatchProfiles, getMediaWatchProfiles } from "@/lib/power-watch";
import { getSchoolBoardDistricts, getSchoolBoardDossiers } from "@/lib/school-board-research";
import { getSchoolBoardCandidateUrl, getSchoolBoardDistrictUrl } from "@/lib/school-board-urls";

const siteUrl = "https://www.repwatchr.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/officials",
    "/school-boards",
    "/attorneys",
    "/media",
    "/uap",
    "/faretta-ai",
    "/feedback",
    "/funding",
    "/red-flags",
    "/methodology",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: "daily",
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

  return [...staticRoutes, ...districtRoutes, ...memberRoutes, ...attorneyRoutes, ...mediaRoutes];
}
