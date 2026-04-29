import type { Metadata } from "next";
import Link from "next/link";
import {
  getSchoolBoardCompletionReport,
  getSchoolBoardStats,
} from "@/lib/school-board-research";
import { getRepWatchrDataStats } from "@/lib/data";
import { getAllOfficialIdeologyProfiles } from "@/lib/ideology";
import { getSchoolBoardCandidateUrl, getSchoolBoardDistrictUrl } from "@/lib/school-board-urls";
import { getAttorneyWatchProfiles, getMediaWatchProfiles, getPowerWatchStats } from "@/lib/power-watch";
import {
  getNationalBuildoutSummary,
  nationalGovernmentScopes,
  socialMonitoringConnections,
} from "@/data/national-buildout";
import { getGeographicBuildoutDashboard, type GeographicBuildoutRow } from "@/lib/geographic-buildout";

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

export default function BuildoutDashboardPage() {
  const report = getSchoolBoardCompletionReport();
  const stats = getSchoolBoardStats();
  const dataStats = getRepWatchrDataStats();
  const attorneyStats = getPowerWatchStats(getAttorneyWatchProfiles());
  const mediaStats = getPowerWatchStats(getMediaWatchProfiles());
  const nationalSummary = getNationalBuildoutSummary();
  const geographic = getGeographicBuildoutDashboard();
  const loadedJurisdictionRows = geographic.stateRows.filter((row) => row.status === "loaded").length;
  const partialJurisdictionRows = geographic.stateRows.filter((row) => row.status === "partial").length;
  const queuedJurisdictionRows = geographic.stateRows.filter((row) => row.status === "queued").length;
  const ideologyProfiles = getAllOfficialIdeologyProfiles();
  const voteWeightedIdeologyProfiles = ideologyProfiles.filter((profile) => profile.ideologyScore !== null);
  const pendingIdeologyProfiles = ideologyProfiles.length - voteWeightedIdeologyProfiles.length;
  const loadedOfficialProfiles = dataStats.federalAndStateSeatProfilesLoaded + dataStats.countyCityOfficialFiles;
  const sourceUrlCount = dataStats.publicSourceUrls + stats.sourceCount;
  const openWorkCount = stats.gapCount + report.totalBrokenSources;
  const federalAndStateSeatPercent = Math.round(
    (dataStats.federalAndStateSeatProfilesLoaded / dataStats.federalAndStateExpectedSeats) * 100,
  );

  // Sort districts by completion ascending - show what needs work first.
  const sortedDistricts = [...report.districtCompletions].sort((a, b) => a.percent - b.percent);
  const sortedMembers = [...report.candidateCompletions].sort((a, b) => a.percent - b.percent);

  const dataSurfaces = [
    {
      label: "Federal and state seat profiles",
      value: dataStats.federalAndStateSeatProfilesLoaded,
      status: `${dataStats.federalProfilesLoaded}/${dataStats.federalExpectedSeats} current federal seats across all 50 states and ${dataStats.stateLegislatorProfilesLoaded}/${dataStats.stateLegislatureExpectedSeats} Texas legislative seats are represented by person profile files.`,
      href: "/officials",
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
  ];
  const notTrackedSurfaces = [
    {
      label: "Expected federal/Texas state seat gaps",
      value: dataStats.federalAndStateProfileGaps,
      status: `${dataStats.federalProfileGaps} current U.S. House seat gaps and ${dataStats.stateLegislatureProfileGaps} Texas legislative expected seats do not have a person profile file in the current import.`,
      href: "/officials",
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
  ];
  const analyticsSurfaces = [
    {
      label: "Pageview analytics",
      value: "Mounted",
      status: "The Vercel Analytics component is mounted in the root layout. Google Analytics loads only when NEXT_PUBLIC_GA_MEASUREMENT_ID is configured.",
    },
    {
      label: "Custom Vercel events",
      value: "3 events",
      status: "share_click, picker_drilldown, and profile_open are emitted from visible user actions.",
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
      label: "Government lanes",
      value: nationalSummary.governmentScopeCount,
      detail: "Federal, state, local, school-board, tribal, courts, special districts, and public-power roles have source plans.",
    },
    {
      label: "Attorney/media profiles",
      value: attorneyStats.totalProfiles + mediaStats.totalProfiles,
      detail: `${attorneyStats.totalProfiles} attorney/law-firm profiles and ${mediaStats.totalProfiles} media/newsroom profiles are source-seeded.`,
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
              <p className="mt-1 text-xs font-semibold text-gray-500">{dataStats.federalAndStateSeatProfilesLoaded} federal/state seat profiles + {dataStats.countyCityOfficialFiles} county/city files</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Federal/state seats</p>
              <p className="mt-1 text-4xl font-black text-emerald-700">{dataStats.federalAndStateSeatProfilesLoaded}/{dataStats.federalAndStateExpectedSeats}</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">{dataStats.federalAndStateProfileGaps} expected seat profile gap{dataStats.federalAndStateProfileGaps === 1 ? "" : "s"} in the current import</p>
              <div className="mt-3"><ProgressBar percent={federalAndStateSeatPercent} tone="green" /></div>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-amber-700">Records scored</p>
              <p className="mt-1 text-4xl font-black text-amber-700">{dataStats.scoreCards.toLocaleString()}</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">{dataStats.bills} bill files, {dataStats.scoredVoteRows} vote rows, {dataStats.fundingSummaries} funding summaries</p>
            </div>
            <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-red-700">Open work</p>
              <p className="mt-1 text-4xl font-black text-red-700">{openWorkCount.toLocaleString()}</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">{stats.gapCount} research gaps + {report.totalBrokenSources} empty source URLs</p>
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
