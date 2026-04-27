import { getRepWatchrDataStats } from "@/lib/data";
import {
  getSchoolBoardCompletionReport,
  getSchoolBoardStats,
} from "@/lib/school-board-research";

export type SuperAdminSnapshot = {
  visibleProfiles: number;
  nonSchoolOfficials: number;
  schoolBoardProfiles: number;
  schoolBoardDistricts: number;
  schoolBoardCompletion: number;
  sourceUrls: number;
  openResearchItems: number;
  scorecards: number;
  redFlagItems: number;
  newsArticles: number;
  fundingSummaries: number;
};

export type SuperAdminWatchItem = {
  id: string;
  label: string;
  status: "red" | "yellow" | "green";
  value: string;
  detail: string;
  href?: string;
};

export function buildSuperAdminSnapshot(): SuperAdminSnapshot {
  const dataStats = getRepWatchrDataStats();
  const schoolStats = getSchoolBoardStats();
  const completion = getSchoolBoardCompletionReport();

  return {
    visibleProfiles: dataStats.nonSchoolOfficialFiles + schoolStats.candidates,
    nonSchoolOfficials: dataStats.nonSchoolOfficialFiles,
    schoolBoardProfiles: schoolStats.candidates,
    schoolBoardDistricts: schoolStats.districts,
    schoolBoardCompletion: completion.overallPercent,
    sourceUrls: dataStats.publicSourceUrls + schoolStats.sourceCount,
    openResearchItems: schoolStats.gapCount + completion.totalBrokenSources,
    scorecards: dataStats.scoreCards,
    redFlagItems: dataStats.redFlagItems,
    newsArticles: dataStats.newsArticles,
    fundingSummaries: dataStats.fundingSummaries,
  };
}

export function buildSuperAdminWatchItems(): SuperAdminWatchItem[] {
  const dataStats = getRepWatchrDataStats();
  const schoolStats = getSchoolBoardStats();
  const completion = getSchoolBoardCompletionReport();
  const sourceUrls = dataStats.publicSourceUrls + schoolStats.sourceCount;
  const openResearchItems = schoolStats.gapCount + completion.totalBrokenSources;

  return [
    {
      id: "texas-school-board-completion",
      label: "Texas school-board completion",
      status: completion.overallPercent >= 75 ? "green" : completion.overallPercent >= 45 ? "yellow" : "red",
      value: `${completion.overallPercent}%`,
      detail: `${completion.completedDistricts}/${completion.totalDistricts} districts and ${completion.completedMembers}/${completion.totalMembers} member profiles are at 75% or better.`,
      href: "/buildout",
    },
    {
      id: "open-research-items",
      label: "Open research work",
      status: openResearchItems > 500 ? "red" : openResearchItems > 100 ? "yellow" : "green",
      value: openResearchItems.toLocaleString(),
      detail: `${schoolStats.gapCount} profile gaps plus ${completion.totalBrokenSources} empty source URLs are still tracked.`,
      href: "/buildout",
    },
    {
      id: "profile-activation-queue",
      label: "Profile activation queue",
      status: "yellow",
      value: "Live Supabase count",
      detail: "Counts profile_claims where elected officials, candidates, or journalists request profile control.",
      href: "/admin/claims",
    },
    {
      id: "case-review-queue",
      label: "Case review queue",
      status: "yellow",
      value: "Live Supabase count",
      detail: "Tracks Faretta.Legal or RepWatchr submissions before anything is sent, published, revised, or escalated.",
      href: "/admin/superadmin",
    },
    {
      id: "page-view-analytics",
      label: "Page views and unique views",
      status: "yellow",
      value: "Vercel source",
      detail: "Vercel Analytics collects these, but RepWatchr needs an export or API token before the numbers can be displayed inside this office.",
      href: "https://vercel.com/analytics",
    },
    {
      id: "public-source-depth",
      label: "Public source depth",
      status: sourceUrls >= 100 ? "green" : "yellow",
      value: sourceUrls.toLocaleString(),
      detail: "Loaded public source URLs across official records, school boards, funding, votes, red flags, and news.",
      href: "/methodology",
    },
  ];
}
