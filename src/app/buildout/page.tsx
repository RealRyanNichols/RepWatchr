import type { Metadata } from "next";
import Link from "next/link";
import {
  getSchoolBoardCompletionReport,
  getSchoolBoardStats,
} from "@/lib/school-board-research";
import { getRepWatchrDataStats } from "@/lib/data";
import { getAllOfficialIdeologyProfiles, getOfficialProfileBuildoutStats } from "@/lib/ideology";
import { getSchoolBoardCandidateUrl, getSchoolBoardDistrictUrl } from "@/lib/school-board-urls";
import { getAttorneyWatchProfiles, getMediaWatchProfiles, getPowerWatchStats } from "@/lib/power-watch";
import { getAttorneyBuildoutDashboard } from "@/data/attorney-buildout";
import {
  getNationalBuildoutSummary,
  nationalGovernmentScopes,
  socialMonitoringConnections,
} from "@/data/national-buildout";
import {
  getGeographicBuildoutDashboard,
  type CountyCompletionRaceRow,
  type GeographicBuildoutRow,
} from "@/lib/geographic-buildout";

export const metadata: Metadata = {
  title: "RepWatchr Buildout Dashboard",
  description:
    "Computed buildout dashboard for loaded profile files, roster dossiers, source URLs, public-record gaps, and analytics events on RepWatchr.",
  robots: { index: false, follow: false },
};

function ProgressBar({ percent, tone = "blue" }: { percent: number; tone?: "blue" | "green" | "amber" | "red" }) {
  const color = {
    blue: "bg-blue-600",
    green: "bg-emerald-600",
    amber: "bg-amber-500",
    red: "bg-red-600",
  }[tone];
  const safe = Math.max(0, Math.min(100, percent));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${safe}%` }} />
    </div>
  );
}

function toneFor(percent: number): "red" | "amber" | "blue" | "green" {
  if (percent >= 75) return "green";
  if (percent >= 50) return "blue";
  if (percent >= 25) return "amber";
  return "red";
}

function statusBadgeClasses(status: GeographicBuildoutRow["status"]) {
  if (status === "loaded") return "bg-emerald-100 text-emerald-800";
  if (status === "partial") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

function CompactGeoTable({
  rows,
  showState = false,
}: {
  rows: GeographicBuildoutRow[];
  showState?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-[760px] w-full divide-y divide-slate-100 text-left text-sm">
        <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2">Area</th>
            {showState ? <th className="px-3 py-2">State</th> : null}
            <th className="px-3 py-2">People</th>
            <th className="px-3 py-2">Schools</th>
            <th className="px-3 py-2">Power</th>
            <th className="px-3 py-2">Sources</th>
            <th className="px-3 py-2">Done</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => {
            const profileCount = row.officialProfiles + row.schoolBoardMembers + row.attorneyProfiles + row.mediaProfiles;
            const powerCount = row.attorneyProfiles + row.mediaProfiles;
            const content = (
              <>
                <td className="px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-black text-slate-950">{row.name}</p>
                      <p className="text-xs font-semibold text-slate-500">{row.topGap}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${statusBadgeClasses(row.status)}`}>
                      {row.status}
                    </span>
                  </div>
                </td>
                {showState ? <td className="px-3 py-2 text-xs font-black text-slate-600">{row.state}</td> : null}
                <td className="px-3 py-2 font-black text-blue-950">{profileCount.toLocaleString()}</td>
                <td className="px-3 py-2 font-semibold text-slate-700">{row.schoolDistricts.toLocaleString()}</td>
                <td className="px-3 py-2 font-semibold text-slate-700">{powerCount.toLocaleString()}</td>
                <td className="px-3 py-2 font-semibold text-slate-700">{row.sourceLinks.toLocaleString()}</td>
                <td className="px-3 py-2">
                  <div className="min-w-28">
                    <p className={`mb-1 text-xs font-black ${row.completionPercent >= 75 ? "text-emerald-700" : row.completionPercent >= 50 ? "text-blue-700" : row.completionPercent >= 25 ? "text-amber-700" : "text-red-700"}`}>
                      {row.completionPercent}%
                    </p>
                    <ProgressBar percent={row.completionPercent} tone={toneFor(row.completionPercent)} />
                  </div>
                </td>
              </>
            );

            return row.href ? (
              <tr key={row.id} className="align-top transition hover:bg-blue-50/40">
                {content}
              </tr>
            ) : (
              <tr key={row.id} className="align-top">
                {content}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CountyCompletionRace({
  leaders,
  nextGreenRows,
  sourceTitle,
  sourceUrl,
  snapshotLabel,
  countyCount,
  registeredVoters,
  suspenseVoters,
  statewideSuspensePercent,
}: {
  leaders: CountyCompletionRaceRow[];
  nextGreenRows: CountyCompletionRaceRow[];
  sourceTitle: string;
  sourceUrl: string;
  snapshotLabel: string;
  countyCount: number;
  registeredVoters: number;
  suspenseVoters: number;
  statewideSuspensePercent: number;
}) {
  const spotlightRows = leaders.slice(0, 4);
  const signalRows = leaders.filter((row) => row.civicRollSignal).slice(0, 8);

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
      <div className="bg-slate-950 px-5 py-5 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">County completion race</p>
            <h3 className="mt-1 text-2xl font-black">First county to green gets the board.</h3>
            <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-200">
              County rank is computed from profile completion, loaded lanes, source links, and public aggregate voter-roll signal. The voter data here is county-level Texas SOS data only.
            </p>
          </div>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black text-white transition hover:bg-white hover:text-slate-950"
          >
            {snapshotLabel} SOS source
          </a>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/10 p-4">
            <p className="text-3xl font-black">{countyCount.toLocaleString()}</p>
            <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-slate-300">Texas counties loaded</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 p-4">
            <p className="text-3xl font-black">{registeredVoters.toLocaleString()}</p>
            <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-slate-300">Registered voters</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 p-4">
            <p className="text-3xl font-black">{suspenseVoters.toLocaleString()}</p>
            <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-slate-300">Suspense voters</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 p-4">
            <p className="text-3xl font-black">{statewideSuspensePercent}%</p>
            <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-slate-300">Statewide suspense share</p>
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-blue-100 lg:grid-cols-4">
        {spotlightRows.map((row) => (
          <Link key={row.id} href={row.href ?? "/buildout"} className="block bg-white p-4 transition hover:bg-blue-50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-red-700">Rank #{row.rank}</p>
                <h4 className="mt-1 text-lg font-black text-slate-950">{row.name}</h4>
                <p className="text-xs font-semibold text-slate-500">{row.state} · race score {row.raceScore}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${statusBadgeClasses(row.status)}`}>
                {row.status}
              </span>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs font-black">
                <span className="text-slate-500">Completion</span>
                <span className={row.completionPercent >= 75 ? "text-emerald-700" : "text-blue-700"}>{row.completionPercent}%</span>
              </div>
              <ProgressBar percent={row.completionPercent} tone={toneFor(row.completionPercent)} />
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">
              {row.totalProfiles.toLocaleString()} profiles · {row.loadedLanes}/{row.totalLanes} lanes · {row.sourceLinks.toLocaleString()} sources
            </p>
            {row.civicRollSignal ? (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-800">
                {row.civicRollSignal.attentionLabel}: {row.civicRollSignal.voterRegistration.toLocaleString()} registered, {row.civicRollSignal.suspensePercent}% suspense.
              </p>
            ) : null}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[1fr_1fr]">
        <div>
          <div className="mb-3">
            <p className="text-xs font-black uppercase tracking-wide text-red-700">Closest to green</p>
            <h4 className="text-lg font-black text-slate-950">Counties that can flip next</h4>
          </div>
          <div className="space-y-2">
            {nextGreenRows.slice(0, 6).map((row) => (
              <Link key={row.id} href={row.href ?? "/buildout"} className="block rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-blue-300 hover:bg-white">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">{row.name}</p>
                    <p className="text-xs font-semibold text-slate-500">{row.neededToGreen} points to green · {row.topGap}</p>
                  </div>
                  <span className="text-sm font-black text-blue-800">{row.completionPercent}%</span>
                </div>
                <div className="mt-2">
                  <ProgressBar percent={row.completionPercent} tone={toneFor(row.completionPercent)} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3">
            <p className="text-xs font-black uppercase tracking-wide text-red-700">Civic roll signals</p>
            <h4 className="text-lg font-black text-slate-950">Public aggregate voter data that can draw attention</h4>
          </div>
          <div className="space-y-2">
            {signalRows.map((row) => (
              <div key={row.id} className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-950">{row.name}</p>
                    <p className="text-xs font-semibold text-amber-800">{row.civicRollSignal?.attentionLabel}</p>
                  </div>
                  <p className="text-sm font-black text-amber-900">{row.civicRollSignal?.suspensePercent}%</p>
                </div>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">
                  {row.civicRollSignal?.voterRegistration.toLocaleString()} registered voters, {row.civicRollSignal?.suspenseVoters.toLocaleString()} suspense, {row.civicRollSignal?.precincts.toLocaleString()} precincts.
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] font-semibold leading-5 text-slate-500">
            Source: {sourceTitle}. Individual voter records are not imported, displayed, or targeted by this dashboard.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function BuildoutDashboardPage() {
  const report = getSchoolBoardCompletionReport();
  const stats = getSchoolBoardStats();
  const dataStats = getRepWatchrDataStats();
  const attorneyProfiles = getAttorneyWatchProfiles();
  const attorneyStats = getPowerWatchStats(attorneyProfiles);
  const attorneyBuildout = getAttorneyBuildoutDashboard(attorneyProfiles);
  const mediaStats = getPowerWatchStats(getMediaWatchProfiles());
  const nationalSummary = getNationalBuildoutSummary();
  const geographic = getGeographicBuildoutDashboard();
  const officialBuildoutStats = getOfficialProfileBuildoutStats();
  const loadedJurisdictionRows = geographic.stateRows.filter((row) => row.status === "loaded").length;
  const partialJurisdictionRows = geographic.stateRows.filter((row) => row.status === "partial").length;
  const queuedJurisdictionRows = geographic.stateRows.filter((row) => row.status === "queued").length;
  const ideologyProfiles = getAllOfficialIdeologyProfiles();
  const voteWeightedIdeologyProfiles = ideologyProfiles.filter((profile) => profile.ideologyScore !== null);
  const pendingIdeologyProfiles = ideologyProfiles.length - voteWeightedIdeologyProfiles.length;
  const loadedOfficialProfiles = dataStats.nonSchoolOfficialFiles;
  const electedProfilesLoaded = dataStats.nonSchoolOfficialFiles + stats.candidates;
  const allElectedOfficialGaps = Math.max(
    0,
    dataStats.nationalAllElectedOfficialEstimate - electedProfilesLoaded,
  );
  const allElectedCompletionPercent = Math.round(
    (electedProfilesLoaded / dataStats.nationalAllElectedOfficialEstimate) * 1000,
  ) / 10;
  const sourceUrlCount = dataStats.publicSourceUrls + stats.sourceCount;
  const openWorkCount =
    officialBuildoutStats.incompleteProfiles +
    dataStats.nationalFederalStateOfficialGaps +
    allElectedOfficialGaps +
    stats.gapCount +
    report.totalBrokenSources;
  const federalAndStateSeatPercent = dataStats.nationalFederalStateCompletionPercent;

  // Sort districts by completion ascending - show what needs work first.
  const sortedDistricts = [...report.districtCompletions].sort((a, b) => a.percent - b.percent);
  const sortedMembers = [...report.candidateCompletions].sort((a, b) => a.percent - b.percent);

  const dataSurfaces = [
    {
      label: "Full official profiles",
      value: officialBuildoutStats.completeProfiles,
      status: `${officialBuildoutStats.completeProfiles}/${officialBuildoutStats.totalProfiles} official profile pages meet the full checklist. ${officialBuildoutStats.incompleteProfiles} still need source-backed buildout work.`,
      href: "/officials",
    },
    {
      label: "Federal and state seat profiles",
      value: dataStats.federalAndStateOfficeProfilesLoaded,
      status: `${dataStats.federalProfilesLoaded}/${dataStats.federalExpectedSeats} current federal seats are loaded. ${dataStats.stateLegislatorProfilesLoaded.toLocaleString()} state-legislative profiles and ${dataStats.stateExecutiveProfilesLoaded.toLocaleString()} state executive/public-office profiles are loaded. That is ${dataStats.nationalFederalStateCompletionPercent}% of the broad ${dataStats.nationalFederalStateOfficialEstimate.toLocaleString()} federal/state benchmark.`,
      href: "/officials",
    },
    {
      label: "All elected-office profile surface",
      value: electedProfilesLoaded,
      status: `${allElectedCompletionPercent}% of the rough ${dataStats.nationalAllElectedOfficialEstimate.toLocaleString()} all-elected-official benchmark is loaded when officials plus school-board dossiers are counted. ${allElectedOfficialGaps.toLocaleString()} elected profiles remain for true national completion.`,
      href: "/buildout",
    },
    {
      label: "County and city official files",
      value: dataStats.countyCityOfficialFiles,
      status: `${dataStats.levelCounts.county} county and ${dataStats.levelCounts.city} city profile files are loaded. These are legacy local records until source review is finished.`,
      href: "/officials",
    },
    {
      label: "School-board source-seeded trustees",
      value: stats.candidates,
      status: `${stats.districts} Texas districts, ${stats.districtsWithRosters} official rosters, ${stats.completedDossiers} non-stub dossiers, and ${stats.stubProfiles} queued or in-progress trustee profiles.`,
      href: "/school-boards",
    },
    {
      label: "Legacy school-board official files",
      value: dataStats.legacySchoolBoardOfficialFiles,
      status: "Older JSON profile files still exist under the officials data tree. The School Board page uses the roster dossier pipeline.",
      href: "/officials?level=school-board",
    },
    {
      label: "Source-seeded official profiles",
      value: dataStats.sourceSeededOfficialProfiles,
      status: `${dataStats.officialsWithSourceLinks} profiles have explicit source links and ${dataStats.officialsWithPhotos} have local profile photos. ${dataStats.missingReviewStatusOfficialProfiles} legacy official files still lack a review status.`,
      href: "/officials",
    },
    {
      label: "Official source URLs",
      value: dataStats.officialSourceUrls,
      status: "Unique official-site, public profile, photo-source, and office website URLs attached directly to official profile files.",
      href: "/methodology",
    },
    {
      label: "Attorney license-source map",
      value: attorneyBuildout.sourceMapped,
      status: `${attorneyBuildout.sourceMapped}/${attorneyBuildout.sources.length} states have a mapped licensing authority. Texas has ${attorneyBuildout.texasProfiles} attorney-watch records loaded.`,
      href: "/attorneys",
    },
    {
      label: "Public defender source map",
      value: attorneyBuildout.publicDefenderSourcesMapped,
      status: `${attorneyBuildout.publicDefenderSourcesMapped}/${attorneyBuildout.publicDefenderSourceTarget} official public-defense source paths mapped; ${attorneyBuildout.publicDefenderProfiles} public-defense records seeded.`,
      href: "/attorneys",
    },
    {
      label: "Ideology master rows",
      value: ideologyProfiles.length,
      status: `${voteWeightedIdeologyProfiles.length} rows have a vote-weighted left/right score. ${pendingIdeologyProfiles} rows have centered charts pending mapped vote records.`,
      href: "/officials",
    },
  ];
  const trackingSurfaces = [
    {
      label: "Scored official profiles",
      value: dataStats.scoreCards,
      status: `${dataStats.officialsWithScoreCards} officials have scorecards. ${dataStats.issueCategories} issue categories, ${dataStats.bills} vote files, and ${dataStats.scoredVoteRows} scored vote rows are loaded.`,
      href: "/scorecards",
    },
    {
      label: "Campaign funding summaries",
      value: dataStats.fundingSummaries,
      status: `${dataStats.officialsWithFundingSummaries} officials have funding JSON. ${dataStats.fundingSourceUrls} unique funding source URLs are cited.`,
      href: "/funding",
    },
    {
      label: "Red-flag records",
      value: dataStats.redFlagItems,
      status: `${dataStats.officialsWithRedFlags} officials have one or more sourced red-flag records.`,
      href: "/red-flags",
    },
    {
      label: "Vote and bill records",
      value: dataStats.bills,
      status: `${dataStats.scoredVoteRows} official vote rows across ${dataStats.voteSourceUrls} unique public vote source URLs.`,
      href: "/votes",
    },
    {
      label: "Public vote snapshots",
      value: dataStats.publicVoteRecords,
      status: `${dataStats.publicVoteRecordRows.toLocaleString()} public roll-call rows are loaded from official federal XML and Texas Legislature Online sources. These are evidence snapshots, not automatic left/right scores.`,
      href: "/officials",
    },
    {
      label: "News articles",
      value: dataStats.newsArticles,
      status: `${dataStats.featuredNewsArticles} featured articles are currently marked for homepage or news emphasis.`,
      href: "/news",
    },
    {
      label: "Public source URLs",
      value: sourceUrlCount,
      status: `${stats.sourceCount} school-board URLs and ${dataStats.publicSourceUrls} official, funding, vote, red-flag, or news URLs. This is evidence coverage, not pageview analytics.`,
      href: "/methodology",
    },
    {
      label: "Attorney cross-links",
      value: attorneyBuildout.crossLinkedProfiles,
      status: `${attorneyBuildout.crossLinkedProfiles}/${attorneyBuildout.texasProfiles} Texas attorney-watch records have firm, person, case-file, public-record, or official relationship links.`,
      href: "/attorneys?state=TX",
    },
    {
      label: "Public defender records",
      value: attorneyBuildout.publicDefenderProfiles,
      status: `${attorneyBuildout.publicDefenderSeededStates} states have at least one public-defense source record. Person profiles stay blocked until roster and bar-license sources are attached.`,
      href: "/attorneys",
    },
  ];
  const notTrackedSurfaces = [
    {
      label: "Estimated federal/state officials left",
      value: dataStats.nationalFederalStateOfficialGaps,
      status: `${dataStats.federalAndStateOfficeProfilesLoaded.toLocaleString()}/${dataStats.nationalFederalStateOfficialEstimate.toLocaleString()} estimated federal/state official profiles are loaded. This is a benchmark gap, not a negative finding.`,
      href: "/officials",
    },
    {
      label: "Estimated all elected officials left",
      value: allElectedOfficialGaps,
      status: `${electedProfilesLoaded.toLocaleString()} elected profiles are surfaced across officials and school-board dossiers. The rough all-elected-official benchmark is ${dataStats.nationalAllElectedOfficialEstimate.toLocaleString()}, so this is the long national buildout queue.`,
      href: "/buildout",
    },
    {
      label: "Non-school officials without scorecards",
      value: dataStats.nonSchoolOfficialFiles - dataStats.officialsWithScoreCards,
      status: "No scorecard file exists for these profiles yet. Do not read that as neutral, clean, or reviewed.",
      href: "/scorecards",
    },
    {
      label: "Official charts pending vote mapping",
      value: pendingIdeologyProfiles,
      status: "These officials have a chart row in the master file, but the marker stays centered until vote-direction evidence is loaded.",
      href: "/officials",
    },
    {
      label: "Official profiles missing full buildout",
      value: officialBuildoutStats.incompleteProfiles,
      status: "A loaded profile is not counted complete until photo, bio, source links, website, scorecard, vote record, funding, red-flag review, news links, and ideology chart are present.",
      href: "/officials",
    },
    {
      label: "Non-school officials without funding summaries",
      value: dataStats.nonSchoolOfficialFiles - dataStats.officialsWithFundingSummaries,
      status: "Campaign finance is not shown unless a funding JSON file exists for the official.",
      href: "/funding",
    },
    {
      label: "Non-school officials without red-flag files",
      value: dataStats.nonSchoolOfficialFiles - dataStats.officialsWithRedFlags,
      status: "No red-flag file means no sourced red-flag record is loaded here. It does not mean the official was fully cleared.",
      href: "/red-flags",
    },
    {
      label: "School-board open research gaps",
      value: stats.gapCount,
      status: `${stats.candidateGapCount} candidate gaps and ${stats.investigationQueueCount} district investigation queue items remain in the dossier pipeline.`,
      href: "/school-boards",
    },
    {
      label: "Broken or empty school-board source slots",
      value: report.totalBrokenSources,
      status: "Completion scoring still sees these as source gaps. They need working public URLs before being counted as supported records.",
      href: "/buildout",
    },
    {
      label: "Texas attorney license-link gaps",
      value: Math.max(0, attorneyBuildout.texasAttorneyPeople - attorneyBuildout.licenseLinkedPeople),
      status: "Individual attorney pages need official bar profile links before license-status claims should be treated as complete.",
      href: "/attorneys?state=TX",
    },
    {
      label: "Public defender person profiles blocked",
      value: attorneyBuildout.publicDefenderSourcesMapped,
      status: "Mapped public defender offices are not treated as named-attorney profiles until an official roster and state/federal licensing source are both attached.",
      href: "/attorneys",
    },
  ];
  const analyticsSurfaces = [
    {
      label: "Pageview analytics",
      value: "Mounted + API",
      status: "Vercel Analytics is mounted, Google Analytics loads when NEXT_PUBLIC_GA_MEASUREMENT_ID is configured, and /api/analytics/page-view can store owned page-view rows when Supabase is configured.",
    },
    {
      label: "Custom Vercel events",
      value: "9 events",
      status: "Official search/filter/profile clicks, national state choices, share clicks, picker drilldowns, profile opens, and attorney feedback are emitted from visible user actions.",
    },
    {
      label: "Faretta AI interaction collection",
      value: "4 kinds",
      status: "search, chat, research_note, and prompt_button are collected through /api/faretta/collect when the Supabase table is present.",
    },
    {
      label: "Live engagement aggregates",
      value: "4 tables",
      status: "approval_ratings, citizen_grade_summary, comments, and citizen_votes power the live School Board counter when Supabase is configured.",
    },
    {
      label: "Member workspace storage",
      value: "3 tables",
      status: "member_tracked_items, member_profiles, and profile_claims feed the logged-in dashboard and claim flow.",
    },
  ];
  const nationalCards = [
    {
      label: "Jurisdictions enabled",
      value: nationalSummary.enabledJurisdictions,
      detail: `${nationalSummary.stateCount} states plus ${nationalSummary.territoryAndDistrictCount} district/territory rows are in the national buildout model. ${loadedJurisdictionRows} are green from loaded records.`,
    },
    {
      label: "Federal/state loaded",
      value: dataStats.federalAndStateOfficeProfilesLoaded,
      detail: `${dataStats.nationalFederalStateCompletionPercent}% of the ${dataStats.nationalFederalStateOfficialEstimate.toLocaleString()} broad federal/state official benchmark is surfaced.`,
    },
    {
      label: "All elected loaded",
      value: electedProfilesLoaded,
      detail: `${allElectedCompletionPercent}% of the rough ${dataStats.nationalAllElectedOfficialEstimate.toLocaleString()} all-elected-official benchmark is surfaced across officials and school-board dossiers.`,
    },
    {
      label: "Government lanes",
      value: nationalSummary.governmentScopeCount,
      detail: "Federal, state, local, school-board, tribal, courts, special districts, and public-power roles have source plans.",
    },
    {
      label: "Attorney/media profiles",
      value: attorneyStats.totalProfiles + mediaStats.totalProfiles,
      detail: `${attorneyStats.totalProfiles} attorney/law-firm/public-defense profiles and ${mediaStats.totalProfiles} media/newsroom profiles are source-seeded.`,
    },
    {
      label: "Attorney bar sources",
      value: attorneyBuildout.sourceMapped,
      detail: `${attorneyBuildout.sourceMapped}/${attorneyBuildout.sources.length} state license-source paths are mapped. Texas is the active attorney pass.`,
    },
    {
      label: "Social connections",
      value: nationalSummary.socialConnectionCount,
      detail: "Profile links are live-ready; real-time X scanning remains credential-gated and admin-reviewed.",
    },
  ];

  return (
    <div className="bg-slate-50 pb-16">
      <section className="border-b border-blue-100 bg-[linear-gradient(135deg,#ffffff_0%,#eff6ff_50%,#fff7ed_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-wide text-red-700">Operator dashboard</p>
          <h1 className="mt-1 text-3xl font-black text-blue-950 sm:text-5xl">RepWatchr buildout completion</h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-blue-950/75">
            These numbers are computed from the records currently loaded or queried by RepWatchr. Loaded people, scored records, source URLs, live tables, and missing coverage are separated so the dashboard does not imply tracking that is not wired yet.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-blue-700">Loaded officials</p>
              <p className="mt-1 text-4xl font-black text-blue-950">{loadedOfficialProfiles.toLocaleString()}</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">{dataStats.federalAndStateOfficeProfilesLoaded.toLocaleString()} federal/state official profiles + {dataStats.countyCityOfficialFiles} county/city files. School-board dossiers are tracked separately.</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Full official profiles</p>
              <p className="mt-1 text-4xl font-black text-emerald-700">{officialBuildoutStats.completeProfiles}/{officialBuildoutStats.totalProfiles}</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">{officialBuildoutStats.incompleteProfiles} official profiles still need source-backed buildout</p>
              <div className="mt-3"><ProgressBar percent={officialBuildoutStats.averageCompletionPercent} tone={toneFor(officialBuildoutStats.averageCompletionPercent)} /></div>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Federal/state benchmark</p>
              <p className="mt-1 text-4xl font-black text-emerald-700">{dataStats.nationalFederalStateCompletionPercent}%</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">{dataStats.federalAndStateOfficeProfilesLoaded.toLocaleString()}/{dataStats.nationalFederalStateOfficialEstimate.toLocaleString()} estimated federal/state officials loaded</p>
              <div className="mt-3"><ProgressBar percent={federalAndStateSeatPercent} tone="green" /></div>
            </div>
            <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-red-700">Open work</p>
              <p className="mt-1 text-4xl font-black text-red-700">{openWorkCount.toLocaleString()}</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">{officialBuildoutStats.incompleteProfiles} incomplete official profiles + {dataStats.nationalFederalStateOfficialGaps.toLocaleString()} federal/state benchmark gaps + {allElectedOfficialGaps.toLocaleString()} all-elected benchmark gaps</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-red-100 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-red-700">Official profile completion</p>
              <h2 className="text-2xl font-black text-gray-950">Loaded does not mean complete</h2>
              <p className="mt-1 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
                This is the working queue for the elected-official profile buildout. It shows what is missing before a profile should be treated as fully built.
              </p>
            </div>
            <Link href="/officials" className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black text-blue-950 transition hover:bg-white">
              Open officials
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-wide text-red-700">Missing checklist items</p>
              <div className="mt-4 space-y-3">
                {officialBuildoutStats.missingItemCounts.slice(0, 10).map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className="text-sm font-black capitalize text-slate-950">{item.label}</p>
                      <p className="text-sm font-black text-red-700">{item.count.toLocaleString()}</p>
                    </div>
                    <ProgressBar percent={(item.count / Math.max(1, officialBuildoutStats.totalProfiles)) * 100} tone="red" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-wide text-red-700">Lowest-completion officials</p>
              <div className="mt-4 grid gap-2">
                {officialBuildoutStats.lowestCompletionProfiles.map((profile) => (
                  <Link
                    key={profile.officialId}
                    href={`/officials/${profile.officialId}`}
                    className="rounded-xl border border-white bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950">{profile.name}</p>
                        <p className="truncate text-xs font-semibold text-slate-500">{profile.position} · {profile.jurisdiction}</p>
                        <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-600">
                          Missing: {profile.missingItems.slice(0, 4).join(", ")}
                          {profile.missingItems.length > 4 ? "..." : ""}
                        </p>
                      </div>
                      <div className="w-24 shrink-0">
                        <p className="mb-1 text-right text-xs font-black text-red-700">{profile.completionPercent}%</p>
                        <ProgressBar percent={profile.completionPercent} tone={toneFor(profile.completionPercent)} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-wide text-red-700">Nationwide model</p>
            <h2 className="text-2xl font-black text-gray-950">All-state civic-accountability buildout is turned on</h2>
            <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
              The public buildout page now separates the model from the loaded data. Every state has an enabled
              federal/state source plan, while incomplete states stay clearly marked queued until source-backed profiles,
              photos, statements, votes, and public links are loaded.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {nationalCards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <p className="text-3xl font-black text-blue-950">{card.value.toLocaleString()}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{card.label}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{card.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-wide text-red-700">Public-power lanes</p>
              <div className="mt-3 grid gap-2">
                {nationalGovernmentScopes.map((scope) => (
                  <div key={scope.id} className="rounded-xl border border-white bg-white p-3 shadow-sm">
                    <p className="text-sm font-black text-slate-950">{scope.label}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{scope.publicDescription}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-wide text-red-700">Social statement connections</p>
              <div className="mt-3 grid gap-2">
                {socialMonitoringConnections.map((connection) => (
                  <div key={connection.label} className="rounded-xl border border-white bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-black text-slate-950">{connection.label}</p>
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-blue-800">
                        {connection.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{connection.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                State model status · {loadedJurisdictionRows} loaded · {partialJurisdictionRows} partial · {queuedJurisdictionRows} queued
              </p>
            </div>
            <div className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
              {geographic.stateRows.map((state) => (
                <div key={state.code} className="bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">{state.name}</p>
                      <p className="text-xs font-semibold text-slate-500">{state.code}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${
                        state.status === "loaded"
                          ? "bg-emerald-100 text-emerald-800"
                          : state.status === "partial"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {state.status}
                    </span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar percent={state.completionPercent} tone={toneFor(state.completionPercent)} />
                  </div>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                    {state.officialProfiles.toLocaleString()} profiles loaded, including {state.federalOfficials.toLocaleString()} federal records. {state.topGap}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-red-700">Geographic completion control center</p>
              <h2 className="text-2xl font-black text-gray-950">Every state, then counties, cities, and districts.</h2>
              <p className="mt-1 max-w-4xl text-xs font-semibold leading-5 text-gray-600">
                State rows include every enabled jurisdiction. County, city, and district rows show source-known areas already loaded into RepWatchr. Empty states stay queued until a source import creates real records.
              </p>
            </div>
            <p className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-black text-blue-950">
              Generated from loaded data, not guesses
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-3xl font-black text-blue-950">{geographic.summary.enabledStatesAndTerritories.toLocaleString()}</p>
              <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">States/territories enabled</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{geographic.summary.statesWithLoadedData} have at least one loaded spotlight record.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-3xl font-black text-blue-950">{geographic.summary.countyRows.toLocaleString()}</p>
              <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">County rows</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">Counties with officials, school boards, attorneys, or media records loaded.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-3xl font-black text-blue-950">{geographic.summary.cityRows.toLocaleString()}</p>
              <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">City rows</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">Cities with local officials, legal-power, or media-power profiles loaded.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-3xl font-black text-blue-950">{geographic.summary.districtRows.toLocaleString()}</p>
              <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">District rows</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">School-board district completion rows already computed from roster dossiers.</p>
            </div>
          </div>

          <CountyCompletionRace
            leaders={geographic.countyRaceLeaders}
            nextGreenRows={geographic.nextGreenCountyRows}
            sourceTitle={geographic.civicRollSource.sourceTitle}
            sourceUrl={geographic.civicRollSource.sourceUrl}
            snapshotLabel={geographic.civicRollSource.snapshotLabel}
            countyCount={geographic.summary.civicRollCountyRows}
            registeredVoters={geographic.summary.civicRollRegisteredVoters}
            suspenseVoters={geographic.summary.civicRollSuspenseVoters}
            statewideSuspensePercent={geographic.summary.civicRollStatewideSuspensePercent}
          />

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-red-700">State dashboard</p>
                <h3 className="text-xl font-black text-slate-950">National queue and loaded profile count</h3>
              </div>
              <p className="text-xs font-semibold text-slate-500">Officials + school boards + attorneys + media</p>
            </div>
            <CompactGeoTable rows={geographic.stateRows} />
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3">
                <p className="text-xs font-black uppercase tracking-wide text-red-700">County dashboard</p>
                <h3 className="text-xl font-black text-slate-950">Top loaded counties</h3>
              </div>
              <CompactGeoTable rows={geographic.topCountyRows} showState />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3">
                <p className="text-xs font-black uppercase tracking-wide text-red-700">City dashboard</p>
                <h3 className="text-xl font-black text-slate-950">Top loaded cities</h3>
              </div>
              <CompactGeoTable rows={geographic.topCityRows} showState />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-red-700">District dashboard</p>
                <h3 className="text-xl font-black text-slate-950">Lowest-completion districts first</h3>
              </div>
              <p className="text-xs font-semibold text-slate-500">Full district table remains below for every loaded district.</p>
            </div>
            <CompactGeoTable rows={geographic.lowestDistrictRows} showState />
          </div>
        </div>
      </section>

      {/* Site surfaces */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-red-700">Who is there</p>
            <h2 className="text-2xl font-black text-gray-950">Loaded people and profile files</h2>
          </div>
          <p className="text-xs font-semibold text-gray-500">Click a row to open it.</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {dataSurfaces.map((area) => (
            <Link
              key={area.label}
              href={area.href}
              className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-black text-gray-950">{area.label}</p>
                <p className="text-2xl font-black text-blue-950">{area.value.toLocaleString()}</p>
              </div>
              <p className="mt-1 text-xs font-semibold text-gray-500">{area.status}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-amber-100 bg-amber-50 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-wide text-red-700">What is really tracked</p>
            <h2 className="text-2xl font-black text-gray-950">Scoring, funding, flags, votes, news, and source coverage</h2>
            <p className="mt-1 text-xs font-semibold text-gray-600">These counts come from dedicated JSON records or live dossier source links. A loaded profile is not the same as a scored profile.</p>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {trackingSurfaces.map((area) => (
              <Link
                key={area.label}
                href={area.href}
                className="block rounded-xl border border-amber-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-black text-gray-950">{area.label}</p>
                  <p className="text-2xl font-black text-amber-700">{area.value.toLocaleString()}</p>
                </div>
                <p className="mt-1 text-xs font-semibold text-gray-600">{area.status}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-wide text-red-700">What is not tracked yet</p>
            <h2 className="text-2xl font-black text-gray-950">Gaps that should not be hidden by big totals</h2>
            <p className="mt-1 text-xs font-semibold text-gray-500">These are missing files, missing source slots, or missing analytics surfaces. They are not negative findings by themselves.</p>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {notTrackedSurfaces.map((area) => (
              <Link
                key={area.label}
                href={area.href}
                className="block rounded-xl border border-red-100 bg-red-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-black text-gray-950">{area.label}</p>
                  <p className="text-2xl font-black text-red-700">{area.value.toLocaleString()}</p>
                </div>
                <p className="mt-1 text-xs font-semibold text-gray-600">{area.status}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-blue-100 bg-blue-50 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-wide text-red-700">Analytics map</p>
            <h2 className="text-2xl font-black text-gray-950">What user actions are actually tracked</h2>
            <p className="mt-1 text-xs font-semibold text-gray-500">These are event and table sources wired into the app today.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {analyticsSurfaces.map((item) => (
              <div key={item.label} className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
                <p className="text-2xl font-black text-blue-950">{item.value}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{item.label}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{item.status}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* District-level completion */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-red-700">District completion · {report.totalDistricts} districts</p>
              <h2 className="text-2xl font-black text-gray-950">What every district needs next</h2>
              <p className="mt-1 text-xs font-semibold text-gray-500">Sorted by completion ascending. Click a row to open the district.</p>
            </div>
            <div className="flex gap-3 text-xs font-bold text-gray-500">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">{report.districtCompletions.filter((d) => d.percent >= 75).length} ≥75%</span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">{report.districtCompletions.filter((d) => d.percent >= 25 && d.percent < 75).length} 25-74%</span>
              <span className="rounded-full bg-red-100 px-3 py-1 text-red-800">{report.districtCompletions.filter((d) => d.percent < 25).length} &lt;25%</span>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-black uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">District</th>
                  <th className="px-4 py-3">Members</th>
                  <th className="px-4 py-3">Avg member %</th>
                  <th className="px-4 py-3">Sources</th>
                  <th className="px-4 py-3">2026 ballot</th>
                  <th className="px-4 py-3">Completion</th>
                  <th className="px-4 py-3">Top gap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white text-gray-700">
                {sortedDistricts.map((d) => (
                  <tr key={d.district_slug} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={getSchoolBoardDistrictUrl({ district_slug: d.district_slug })} className="font-bold text-blue-700 hover:text-blue-900">
                        {d.district}
                      </Link>
                      <p className="text-xs text-gray-400">{d.county} County</p>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {d.totalMembers}
                      {d.stubMembers > 0 ? <span className="ml-1 text-xs text-amber-600">({d.stubMembers} stub)</span> : null}
                    </td>
                    <td className="px-4 py-3 font-semibold">{d.averageMemberPercent}%</td>
                    <td className="px-4 py-3 font-semibold">{d.sourceCount}</td>
                    <td className="px-4 py-3 font-semibold">{d.on2026BallotCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-black ${d.percent >= 75 ? "text-emerald-700" : d.percent >= 50 ? "text-blue-700" : d.percent >= 25 ? "text-amber-700" : "text-red-700"}`}>{d.percent}%</span>
                        <div className="w-24"><ProgressBar percent={d.percent} tone={toneFor(d.percent)} /></div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{d.missing[0] ?? "All checks passing"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Member-level completion */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-red-700">Member profiles · {report.totalMembers} loaded</p>
            <h2 className="text-2xl font-black text-gray-950">Stub profiles flagged for follow-up</h2>
            <p className="mt-1 text-xs font-semibold text-gray-500">Lowest-completion members first. Click any name to open the profile.</p>
          </div>
          <div className="flex gap-3 text-xs font-bold text-gray-500">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">{report.candidateCompletions.filter((c) => c.percent >= 75).length} ≥75%</span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">{report.candidateCompletions.filter((c) => c.percent >= 25 && c.percent < 75).length} 25-74%</span>
            <span className="rounded-full bg-red-100 px-3 py-1 text-red-800">{report.candidateCompletions.filter((c) => c.percent < 25).length} &lt;25%</span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {sortedMembers.slice(0, 30).map((c) => (
            <Link
              key={c.candidate_id}
              href={getSchoolBoardCandidateUrl({ candidate_id: c.candidate_id, district_slug: c.district_slug })}
              className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-black text-gray-950">{c.full_name}</p>
                <p className={`text-lg font-black ${c.percent >= 75 ? "text-emerald-700" : c.percent >= 50 ? "text-blue-700" : c.percent >= 25 ? "text-amber-700" : "text-red-700"}`}>
                  {c.percent}%
                </p>
              </div>
              <p className="text-xs font-semibold text-gray-500">{c.district}</p>
              <div className="mt-2"><ProgressBar percent={c.percent} tone={toneFor(c.percent)} /></div>
              {c.missing.length > 0 ? (
                <p className="mt-2 text-xs leading-5 text-gray-500">
                  Needs: <span className="font-semibold text-gray-700">{c.missing.slice(0, 3).join(", ")}</span>
                  {c.missing.length > 3 ? ` +${c.missing.length - 3} more` : null}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-wide">
                {c.brokenSources > 0 ? <span className="rounded bg-red-100 px-2 py-0.5 text-red-700">{c.brokenSources} broken src</span> : null}
                {c.hasGoodRecord ? <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-700">good record</span> : null}
                {c.hasFlag ? <span className="rounded bg-red-100 px-2 py-0.5 text-red-700">flag</span> : null}
                {c.hasSilentSignals ? <span className="rounded bg-blue-100 px-2 py-0.5 text-blue-700">silent signal</span> : null}
                {c.hasSocial ? <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">social</span> : null}
              </div>
            </Link>
          ))}
        </div>
        {sortedMembers.length > 30 ? (
          <p className="mt-6 text-center text-xs font-semibold text-gray-500">
            Showing the 30 lowest-completion members. {sortedMembers.length - 30} more loaded.
          </p>
        ) : null}
      </section>

      {/* Investigation queue rollup */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-wide text-red-700">Investigation queue · {stats.gapCount} open items</p>
            <h2 className="text-2xl font-black text-gray-950">Research gaps to close</h2>
            <p className="mt-1 text-xs font-semibold text-gray-500">Top items per district - what to pull next.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {sortedDistricts
              .filter((d) => d.missing.length > 0)
              .slice(0, 12)
              .map((d) => (
                <div key={d.district_slug} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-black text-amber-950">{d.district}</p>
                  <p className="mt-1 text-xs font-semibold text-amber-900/80">{d.county} County · {d.percent}% complete</p>
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-900">
                    {d.missing.slice(0, 3).map((item) => (
                      <li key={item}>· {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
