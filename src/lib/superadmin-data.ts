import { getRepWatchrDataStats } from "@/lib/data";
import { getOfficialCompletionDashboard } from "@/lib/profile-completion";
import {
  getSchoolBoardCompletionReport,
  getSchoolBoardStats,
} from "@/lib/school-board-research";
import {
  getAttorneyWatchProfiles,
  getMediaWatchProfiles,
  getPowerWatchStats,
  getPublicSafetyWatchProfiles,
} from "@/lib/power-watch";

export type SuperAdminSnapshot = {
  visibleProfiles: number;
  nonSchoolOfficials: number;
  schoolBoardProfiles: number;
  schoolBoardDistricts: number;
  schoolBoardCompletion: number;
  sourceUrls: number;
  openResearchItems: number;
  federalStateOfficialCompletion: number;
  federalStateOfficialGaps: number;
  allElectedOfficialCompletion: number | null;
  allElectedOfficialGaps: number | null;
  scorecards: number;
  redFlagItems: number;
  congressTradingProfiles: number;
  congressTradingCriticalRows: number;
  newsArticles: number;
  fundingSummaries: number;
  publicPowerProfiles: number;
  publicSafetyProfiles: number;
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
  const officialCompletion = getOfficialCompletionDashboard();
  const attorneyStats = getPowerWatchStats(getAttorneyWatchProfiles());
  const mediaStats = getPowerWatchStats(getMediaWatchProfiles());
  const publicSafetyStats = getPowerWatchStats(getPublicSafetyWatchProfiles());
  const visibleElectedProfiles = dataStats.nonSchoolOfficialFiles + schoolStats.candidates;
  const publicPowerProfiles = attorneyStats.totalProfiles + mediaStats.totalProfiles + publicSafetyStats.totalProfiles;
  const publicPowerNeedsBuildout = attorneyStats.needsBuildout + mediaStats.needsBuildout + publicSafetyStats.needsBuildout;

  return {
    visibleProfiles: visibleElectedProfiles + publicPowerProfiles,
    nonSchoolOfficials: dataStats.nonSchoolOfficialFiles,
    schoolBoardProfiles: schoolStats.candidates,
    schoolBoardDistricts: schoolStats.districts,
    schoolBoardCompletion: completion.overallPercent,
    sourceUrls: dataStats.publicSourceUrls + schoolStats.sourceCount,
    openResearchItems:
      schoolStats.gapCount +
      completion.totalBrokenSources +
      officialCompletion.incompleteProfiles +
      dataStats.texasFederalStateProfileGaps +
      publicPowerNeedsBuildout,
    federalStateOfficialCompletion: dataStats.texasFederalStateCompletionPercent,
    federalStateOfficialGaps: dataStats.texasFederalStateProfileGaps,
    // No authenticated statewide census exists for every local elected seat.
    allElectedOfficialCompletion: null,
    allElectedOfficialGaps: null,
    scorecards: dataStats.scoreCards,
    redFlagItems: dataStats.redFlagItems,
    congressTradingProfiles: dataStats.congressTradingCurrentProfilesWithRows,
    congressTradingCriticalRows: dataStats.congressTradingCriticalRows,
    newsArticles: dataStats.newsArticles,
    fundingSummaries: dataStats.fundingSummaries,
    publicPowerProfiles,
    publicSafetyProfiles: publicSafetyStats.totalProfiles,
  };
}

export function buildSuperAdminWatchItems(): SuperAdminWatchItem[] {
  const dataStats = getRepWatchrDataStats();
  const schoolStats = getSchoolBoardStats();
  const completion = getSchoolBoardCompletionReport();
  const officialCompletion = getOfficialCompletionDashboard();
  const attorneyStats = getPowerWatchStats(getAttorneyWatchProfiles());
  const mediaStats = getPowerWatchStats(getMediaWatchProfiles());
  const publicSafetyStats = getPowerWatchStats(getPublicSafetyWatchProfiles());
  const sourceUrls = dataStats.publicSourceUrls + schoolStats.sourceCount;
  const publicPowerProfiles = attorneyStats.totalProfiles + mediaStats.totalProfiles + publicSafetyStats.totalProfiles;
  const publicPowerNeedsBuildout = attorneyStats.needsBuildout + mediaStats.needsBuildout + publicSafetyStats.needsBuildout;
  const openResearchItems = schoolStats.gapCount + completion.totalBrokenSources + officialCompletion.incompleteProfiles + dataStats.texasFederalStateProfileGaps + publicPowerNeedsBuildout;
  const visibleElectedProfiles = dataStats.nonSchoolOfficialFiles + schoolStats.candidates;

  return [
    {
      id: "texas-official-review",
      label: "Texas elected-profile review",
      status: officialCompletion.incompleteProfiles > 0 ? "yellow" : "green",
      value: officialCompletion.incompleteProfiles.toLocaleString(),
      detail: `${visibleElectedProfiles.toLocaleString()} Texas elected profiles and school-board dossiers are surfaced. ${officialCompletion.incompleteProfiles.toLocaleString()} official profiles need source-backed sections. The total number of Texas local elected seats has not been authenticated. ${publicPowerProfiles.toLocaleString()} attorney, media, and public-safety profiles are tracked separately.`,
      href: "/buildout",
    },
    {
      id: "federal-state-official-completion",
      label: "Texas legislative/federal roster",
      status: dataStats.texasFederalStateProfileGaps === 0 ? "green" : "yellow",
      value: `${dataStats.texasFederalStateCompletionPercent}%`,
      detail: `${dataStats.federalAndStateSeatProfilesLoaded.toLocaleString()}/${dataStats.texasFederalStateExpectedSeats.toLocaleString()} Texas legislative and federal seats have profiles. Statewide executive and judicial profiles are additional records. This measures roster coverage, not completed source review.`,
      href: "/officials",
    },
    {
      id: "texas-school-board-completion",
      label: "Texas school-board completion",
      status: completion.overallPercent >= 75 ? "green" : completion.overallPercent >= 45 ? "yellow" : "red",
      value: `${completion.overallPercent}%`,
      detail: `${completion.completedDistricts}/${completion.totalDistricts} districts and ${completion.completedMembers}/${completion.totalMembers} member profiles are at 75% or better.`,
      href: "/buildout",
    },
    {
      id: "congress-trading-disclosures",
      label: "Congress trading disclosure flags",
      status: dataStats.congressTradingCriticalRows > 0 ? "red" : dataStats.congressTradingHighRows > 0 ? "yellow" : "green",
      value: dataStats.congressTradingCurrentProfilesWithRows.toLocaleString(),
      detail: `${dataStats.congressTradingMatchedRows.toLocaleString()} tracker rows are matched to current congressional profiles. ${dataStats.congressTradingCriticalRows} critical and ${dataStats.congressTradingHighRows} high rows are visible on public profiles.`,
      href: "/officials?level=federal",
    },
    {
      id: "open-research-items",
      label: "Open research work",
      status: openResearchItems > 500 ? "red" : openResearchItems > 100 ? "yellow" : "green",
      value: openResearchItems.toLocaleString(),
      detail: `${officialCompletion.incompleteProfiles} incomplete Texas official profiles, ${dataStats.texasFederalStateProfileGaps} missing legislative/federal seat profiles, ${schoolStats.gapCount} school-board gaps, ${completion.totalBrokenSources} empty source URLs, and ${publicPowerNeedsBuildout} public-power profiles still need buildout.`,
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
      detail: "Loaded public source URLs across official records, school boards, attorneys, media, public safety, funding, votes, red flags, and news.",
      href: "/methodology",
    },
  ];
}
