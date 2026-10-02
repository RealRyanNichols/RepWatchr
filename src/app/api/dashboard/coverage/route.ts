import { NextResponse } from "next/server";
import { getAllOfficials, getRepWatchrDataStats } from "@/lib/data";
import { getSchoolBoardStats } from "@/lib/school-board-research";
import { getAttorneyWatchProfiles, getMediaWatchProfiles, getPowerWatchStats, getPublicSafetyWatchProfiles } from "@/lib/power-watch";
import { getAllNationalJurisdictions, getNationalBuildoutSummary } from "@/data/national-buildout";
import { countByState } from "@/lib/state-scope";
import { getGeographicBuildoutDashboard } from "@/lib/geographic-buildout";
import { getOfficialCompletionDashboard } from "@/lib/profile-completion";

export const dynamic = "force-dynamic";

function nonZeroStateCount(counts: Record<string, number>) {
  return Object.values(counts).filter((value) => value > 0).length;
}

export async function GET() {
  const officials = getAllOfficials();
  const dataStats = getRepWatchrDataStats();
  const schoolStats = getSchoolBoardStats();
  const attorneyProfiles = getAttorneyWatchProfiles();
  const mediaProfiles = getMediaWatchProfiles();
  const publicSafetyProfiles = getPublicSafetyWatchProfiles();
  const attorneyStats = getPowerWatchStats(attorneyProfiles);
  const mediaStats = getPowerWatchStats(mediaProfiles);
  const publicSafetyStats = getPowerWatchStats(publicSafetyProfiles);
  const nationalSummary = getNationalBuildoutSummary();
  const jurisdictions = getAllNationalJurisdictions().filter((state) => state.code === "TX");
  const geographic = getGeographicBuildoutDashboard();
  const officialBuildout = getOfficialCompletionDashboard();

  const officialCountsByState = countByState(officials, (official) => official.state, "TX");
  const schoolBoardCountsByState = { TX: schoolStats.candidates };
  const attorneyCountsByState = countByState(attorneyProfiles, (profile) => profile.state);
  const mediaCountsByState = countByState(mediaProfiles, (profile) => profile.state);
  const publicSafetyCountsByState = countByState(publicSafetyProfiles, (profile) => profile.state);

  const stateRows = jurisdictions.map((state) => {
    const officialsCount = officialCountsByState[state.code] ?? 0;
    const schoolBoardsCount = schoolBoardCountsByState[state.code as "TX"] ?? 0;
    const attorneysCount = attorneyCountsByState[state.code] ?? 0;
    const mediaCount = mediaCountsByState[state.code] ?? 0;
    const publicSafetyCount = publicSafetyCountsByState[state.code] ?? 0;
    const total = officialsCount + schoolBoardsCount + attorneysCount + mediaCount + publicSafetyCount;

    return {
      code: state.code,
      name: state.name,
      status: state.status,
      officials: officialsCount,
      schoolBoards: schoolBoardsCount,
      attorneys: attorneysCount,
      media: mediaCount,
      publicSafety: publicSafetyCount,
      total,
    };
  });

  const loadedSpotlightStates = new Set(
    stateRows.filter((state) => state.total > 0).map((state) => state.code),
  );
  const totalPublicProfiles =
    dataStats.officialFiles + schoolStats.candidates + attorneyStats.totalProfiles + mediaStats.totalProfiles + publicSafetyStats.totalProfiles;
  const electedProfilesLoaded = dataStats.nonSchoolOfficialFiles + schoolStats.candidates;
  const sourceLinksSurfaced =
    dataStats.publicSourceUrls + schoolStats.sourceCount;

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    coverageState: "TX",
    coverageLabel: "Texas elected officials, with HD7 and TX01 priority",
    // Retain the legacy response container for existing dashboard consumers.
    national: {
      enabledJurisdictions: jurisdictions.length,
      loadedSpotlightStates: loadedSpotlightStates.size,
      queuedJurisdictions: Math.max(0, jurisdictions.length - loadedSpotlightStates.size),
      governmentScopeCount: nationalSummary.governmentScopeCount,
      federalStateOfficialProfilesLoaded: dataStats.federalAndStateSeatProfilesLoaded,
      federalStateOfficialEstimate: dataStats.texasFederalStateExpectedSeats,
      federalStateOfficialCompletionPercent: dataStats.texasFederalStateCompletionPercent,
      federalStateOfficialGaps: dataStats.texasFederalStateProfileGaps,
      electedProfilesLoaded,
      allElectedOfficialEstimate: null,
      allElectedOfficialCompletionPercent: null,
      allElectedOfficialGaps: null,
      allElectedRosterStatus: "needs_authentication",
      officialProfilesNeedingReview: officialBuildout.incompleteProfiles,
      localGovernmentUnits: null,
    },
    spotlights: [
      {
        id: "officials",
        label: "Texas elected officials",
        value: dataStats.officialFiles,
        loadedStates: nonZeroStateCount(officialCountsByState),
        href: "/officials",
        detail: `${dataStats.officialFiles.toLocaleString()} Texas profiles are loaded. ${dataStats.federalAndStateSeatProfilesLoaded.toLocaleString()}/${dataStats.texasFederalStateExpectedSeats.toLocaleString()} legislative/federal seats have profiles (${dataStats.texasFederalStateCompletionPercent}%). ${officialBuildout.completeProfiles.toLocaleString()}/${officialBuildout.totalProfiles.toLocaleString()} official pages have all required source-backed sections.`,
        notTracked: `${officialBuildout.incompleteProfiles.toLocaleString()} official profiles need deeper source review; ${dataStats.texasFederalStateProfileGaps.toLocaleString()} legislative/federal seat profiles are missing. The statewide total for every local elected seat has not been authenticated.`,
      },
      {
        id: "school-boards",
        label: "School-board members",
        value: schoolStats.candidates,
        loadedStates: nonZeroStateCount(schoolBoardCountsByState),
        href: "/school-boards",
        detail: `${schoolStats.districts.toLocaleString()} Texas districts and ${schoolStats.districtsWithRosters.toLocaleString()} roster-backed district pages.`,
        notTracked: `${schoolStats.gapCount.toLocaleString()} school-board research gaps are still open.`,
      },
      {
        id: "attorneys",
        label: "Attorneys and law firms",
        value: attorneyStats.totalProfiles,
        loadedStates: nonZeroStateCount(attorneyCountsByState),
        href: "/attorneys",
        detail: `${attorneyStats.people.toLocaleString()} people and ${attorneyStats.organizations.toLocaleString()} organizations are source-seeded.`,
        notTracked: `${attorneyStats.needsBuildout.toLocaleString()} attorney records need deeper buildout.`,
      },
      {
        id: "media",
        label: "Media and newsroom people",
        value: mediaStats.totalProfiles,
        loadedStates: nonZeroStateCount(mediaCountsByState),
        href: "/media",
        detail: `${mediaStats.people.toLocaleString()} newsroom people and ${mediaStats.organizations.toLocaleString()} companies are source-seeded.`,
        notTracked: `${mediaStats.needsBuildout.toLocaleString()} media records need deeper buildout.`,
      },
      {
        id: "public-safety",
        label: "Public safety",
        value: publicSafetyStats.totalProfiles,
        loadedStates: nonZeroStateCount(publicSafetyCountsByState),
        href: "/public-safety",
        detail: `${publicSafetyStats.people.toLocaleString()} sheriffs, chiefs, or public-safety officials and ${publicSafetyStats.organizations.toLocaleString()} agencies or oversight sources are source-seeded.`,
        notTracked: `${publicSafetyStats.needsBuildout.toLocaleString()} public-safety records need policies, complaint paths, photos, TCOLE checks, and case links.`,
      },
    ],
    dataQuality: [
      {
        label: "Public profiles surfaced",
        value: totalPublicProfiles,
        detail: "Officials, school-board members, attorneys/law firms, media profiles, and public-safety profiles currently loaded.",
      },
      {
        label: "Texas legislative/federal roster",
        value: dataStats.federalAndStateSeatProfilesLoaded,
        detail: `${dataStats.texasFederalStateCompletionPercent}% of ${dataStats.texasFederalStateExpectedSeats.toLocaleString()} Texas legislative/federal seats have profiles. Statewide executive and judicial profiles are additional records. Roster coverage does not mean source review is complete.`,
      },
      {
        label: "Texas elected profiles and school dossiers",
        value: electedProfilesLoaded,
        detail: "Loaded Texas elected-official records and school-board dossiers. A complete statewide count of every local elected seat has not been authenticated; no total-completion percentage is asserted.",
      },
      {
        label: "Source links surfaced",
        value: sourceLinksSurfaced,
        detail: "Official, school-board, attorney, media, public-safety, vote, funding, red-flag, and news source URLs counted across loaded data.",
      },
      {
        label: "Full official profiles",
        value: officialBuildout.completeProfiles,
        detail: `${officialBuildout.incompleteProfiles.toLocaleString()} official profiles are still missing required source-backed sections. Average completion is ${officialBuildout.averageCompletionPercent}%.`,
      },
      {
        label: "Vote-record scorecards",
        value: dataStats.scoreCards,
        detail: `${dataStats.scoredVoteRows.toLocaleString()} scored vote rows. Universal profile votes are a separate member layer.`,
      },
      {
        label: "Public vote snapshots",
        value: dataStats.publicVoteRecords,
        detail: `${dataStats.publicVoteRecordRows.toLocaleString()} public roll-call rows loaded from official federal XML and Texas Legislature Online sources. These are evidence snapshots, not automatic left/right scores.`,
      },
      {
        label: "Open buildout work",
        value:
          officialBuildout.incompleteProfiles +
          dataStats.texasFederalStateProfileGaps +
          schoolStats.gapCount +
          attorneyStats.needsBuildout +
          mediaStats.needsBuildout +
          publicSafetyStats.needsBuildout,
        detail: "Known incomplete official profiles, missing profile imports, school-board gaps, and attorney/media/public-safety records needing buildout.",
      },
    ],
    geographicSummary: {
      ...geographic.summary,
      enabledStatesAndTerritories: jurisdictions.length,
      statesWithLoadedData: loadedSpotlightStates.size,
      queuedStatesAndTerritories: Math.max(0, jurisdictions.length - loadedSpotlightStates.size),
    },
    stateRows: geographic.stateRows.filter((state) => state.code === "TX"),
    countyRows: geographic.topCountyRows,
    cityRows: geographic.topCityRows,
    districtRows: geographic.lowestDistrictRows,
  });
}
