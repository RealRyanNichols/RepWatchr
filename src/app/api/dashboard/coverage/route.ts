import { NextResponse } from "next/server";
import { getAllOfficials, getRepWatchrDataStats } from "@/lib/data";
import { getSchoolBoardStats } from "@/lib/school-board-research";
import { getAttorneyWatchProfiles, getMediaWatchProfiles, getPowerWatchStats } from "@/lib/power-watch";
import { getAllNationalJurisdictions, getNationalBuildoutSummary } from "@/data/national-buildout";
import { countByState } from "@/lib/state-scope";
import { getGeographicBuildoutDashboard } from "@/lib/geographic-buildout";
import { getOfficialProfileBuildoutStats } from "@/lib/ideology";

export const dynamic = "force-dynamic";

function nonZeroStateCount(counts: Record<string, number>) {
  return Object.values(counts).filter((value) => value > 0).length;
}

function completionPercent(loaded: number, target: number) {
  if (target <= 0) return 0;
  return Math.round((loaded / target) * 1000) / 10;
}

export async function GET() {
  const officials = getAllOfficials();
  const dataStats = getRepWatchrDataStats();
  const schoolStats = getSchoolBoardStats();
  const attorneyProfiles = getAttorneyWatchProfiles();
  const mediaProfiles = getMediaWatchProfiles();
  const attorneyStats = getPowerWatchStats(attorneyProfiles);
  const mediaStats = getPowerWatchStats(mediaProfiles);
  const nationalSummary = getNationalBuildoutSummary();
  const jurisdictions = getAllNationalJurisdictions();
  const geographic = getGeographicBuildoutDashboard();
  const officialBuildout = getOfficialProfileBuildoutStats();

  const officialCountsByState = countByState(officials, (official) => official.state, "TX");
  const schoolBoardCountsByState = { TX: schoolStats.candidates };
  const attorneyCountsByState = countByState(attorneyProfiles, (profile) => profile.state);
  const mediaCountsByState = countByState(mediaProfiles, (profile) => profile.state);

  const stateRows = jurisdictions.map((state) => {
    const officialsCount = officialCountsByState[state.code] ?? 0;
    const schoolBoardsCount = schoolBoardCountsByState[state.code as "TX"] ?? 0;
    const attorneysCount = attorneyCountsByState[state.code] ?? 0;
    const mediaCount = mediaCountsByState[state.code] ?? 0;
    const total = officialsCount + schoolBoardsCount + attorneysCount + mediaCount;

    return {
      code: state.code,
      name: state.name,
      status: state.status,
      officials: officialsCount,
      schoolBoards: schoolBoardsCount,
      attorneys: attorneysCount,
      media: mediaCount,
      total,
    };
  });

  const loadedSpotlightStates = new Set(
    stateRows.filter((state) => state.total > 0).map((state) => state.code),
  );
  const totalPublicProfiles =
    dataStats.officialFiles + schoolStats.candidates + attorneyStats.totalProfiles + mediaStats.totalProfiles;
  const electedProfilesLoaded = dataStats.nonSchoolOfficialFiles + schoolStats.candidates;
  const allElectedOfficialGaps = Math.max(
    0,
    dataStats.nationalAllElectedOfficialEstimate - electedProfilesLoaded,
  );
  const allElectedOfficialCompletionPercent = completionPercent(
    electedProfilesLoaded,
    dataStats.nationalAllElectedOfficialEstimate,
  );
  const sourceLinksSurfaced =
    dataStats.publicSourceUrls + schoolStats.sourceCount + attorneyStats.sourceLinks + mediaStats.sourceLinks;

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    national: {
      enabledJurisdictions: nationalSummary.enabledJurisdictions,
      loadedSpotlightStates: loadedSpotlightStates.size,
      queuedJurisdictions: Math.max(0, nationalSummary.enabledJurisdictions - loadedSpotlightStates.size),
      governmentScopeCount: nationalSummary.governmentScopeCount,
      federalStateOfficialProfilesLoaded: dataStats.federalAndStateOfficeProfilesLoaded,
      federalStateOfficialEstimate: dataStats.nationalFederalStateOfficialEstimate,
      federalStateOfficialCompletionPercent: dataStats.nationalFederalStateCompletionPercent,
      federalStateOfficialGaps: dataStats.nationalFederalStateOfficialGaps,
      electedProfilesLoaded,
      allElectedOfficialEstimate: dataStats.nationalAllElectedOfficialEstimate,
      allElectedOfficialCompletionPercent,
      allElectedOfficialGaps,
      localGovernmentUnits: dataStats.nationalLocalGovernmentUnits,
    },
    spotlights: [
      {
        id: "officials",
        label: "Elected officials",
        value: dataStats.officialFiles,
        loadedStates: nonZeroStateCount(officialCountsByState),
        href: "/officials",
        detail: `${dataStats.officialFiles.toLocaleString()} profiles are live on the officials page. ${dataStats.federalAndStateOfficeProfilesLoaded.toLocaleString()}/${dataStats.nationalFederalStateOfficialEstimate.toLocaleString()} estimated federal/state official profiles are loaded (${dataStats.nationalFederalStateCompletionPercent}%). ${officialBuildout.completeProfiles.toLocaleString()}/${officialBuildout.totalProfiles.toLocaleString()} official pages are full profiles.`,
        notTracked: `${officialBuildout.incompleteProfiles.toLocaleString()} official profiles still need deeper buildout. Rough federal/state gap: ${dataStats.nationalFederalStateOfficialGaps.toLocaleString()} profiles. True all-elected national gap after loaded school-board dossiers: ${allElectedOfficialGaps.toLocaleString()} profiles.`,
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
    ],
    dataQuality: [
      {
        label: "Public profiles surfaced",
        value: totalPublicProfiles,
        detail: "Officials, school-board members, attorneys/law firms, and media profiles currently loaded.",
      },
      {
        label: "Federal/state official completion",
        value: dataStats.federalAndStateOfficeProfilesLoaded,
        detail: `${dataStats.nationalFederalStateCompletionPercent}% of the broad federal/state benchmark is loaded (${dataStats.federalAndStateOfficeProfilesLoaded.toLocaleString()}/${dataStats.nationalFederalStateOfficialEstimate.toLocaleString()}).`,
      },
      {
        label: "All elected-office completion",
        value: electedProfilesLoaded,
        detail: `${allElectedOfficialCompletionPercent}% of the rough all-elected-official benchmark is loaded when officials plus school-board dossiers are counted (${electedProfilesLoaded.toLocaleString()}/${dataStats.nationalAllElectedOfficialEstimate.toLocaleString()}).`,
      },
      {
        label: "Source links surfaced",
        value: sourceLinksSurfaced,
        detail: "Official, school-board, attorney, media, vote, funding, red-flag, and news source URLs counted across loaded data.",
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
        label: "Federal public vote snapshots",
        value: dataStats.publicVoteRecords,
        detail: `${dataStats.publicVoteRecordRows.toLocaleString()} House/Senate roll-call rows loaded from official federal XML sources. These are not automatic left/right scores.`,
      },
      {
        label: "Open buildout work",
        value:
          officialBuildout.incompleteProfiles +
          dataStats.federalAndStateProfileGaps +
          schoolStats.gapCount +
          attorneyStats.needsBuildout +
          mediaStats.needsBuildout,
        detail: "Known incomplete official profiles, missing profile imports, school-board gaps, and attorney/media records needing buildout.",
      },
    ],
    geographicSummary: geographic.summary,
    stateRows: geographic.stateRows,
    countyRows: geographic.topCountyRows,
    cityRows: geographic.topCityRows,
    districtRows: geographic.lowestDistrictRows,
  });
}
