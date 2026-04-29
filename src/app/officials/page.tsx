import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getAllOfficials, getAllScoreCards, getRepWatchrDataStats } from "@/lib/data";
import { getSchoolBoardStats } from "@/lib/school-board-research";
import OfficialGrid from "@/components/officials/OfficialGrid";
import NationalSpotlightSelector from "@/components/shared/NationalSpotlightSelector";
import type { GovernmentLevel, Official } from "@/types";
import { getAllNationalJurisdictions, getNationalBuildoutSummary, nationalGovernmentScopes } from "@/data/national-buildout";
import { countByState, getSelectedStateCode } from "@/lib/state-scope";

export const metadata: Metadata = {
  title: "National Elected Officials Directory",
  description:
    "Choose a state to browse sourced elected-official profiles. RepWatchr starts national and opens loaded federal, state, county, city, and school-board records by state.",
};

const levelLabels: Record<GovernmentLevel, string> = {
  federal: "Federal",
  state: "State",
  county: "County",
  city: "City",
  "school-board": "School Board",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function getInitialLevel(value: string) {
  return Object.keys(levelLabels).includes(value) || value === "all" ? value : "federal";
}

function getOfficialsWithPhotosByState(officials: Official[], limit = 14) {
  const federalWithPhotos = officials.filter((official) => official.level === "federal" && official.photo);
  const fallbackWithPhotos = officials.filter((official) => official.photo);
  const picked = new Set<string>();
  const states = new Set<string>();
  const result: Official[] = [];

  for (const official of [...federalWithPhotos, ...fallbackWithPhotos]) {
    const state = official.state ?? official.county[0] ?? official.jurisdiction;
    if (states.has(state)) continue;
    states.add(state);
    picked.add(official.id);
    result.push(official);
    if (result.length >= limit) return result;
  }

  for (const official of [...federalWithPhotos, ...fallbackWithPhotos]) {
    if (picked.has(official.id)) continue;
    result.push(official);
    if (result.length >= limit) return result;
  }

  return result;
}

export default async function OfficialsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const selectedStateCode = getSelectedStateCode(params);
  const initialSearch = getParamValue(params.search);
  const initialLevel = getInitialLevel(getParamValue(params.level));
  const officials = getAllOfficials();
  const scoreCards = getAllScoreCards();
  const schoolBoardStats = getSchoolBoardStats();
  const dataStats = getRepWatchrDataStats();
  const jurisdictions = getAllNationalJurisdictions();
  const nationalSummary = getNationalBuildoutSummary();
  const profileCountsByState = countByState(officials, (official) => official.state, "TX");
  const selectedState = jurisdictions.find((state) => state.code === selectedStateCode);
  const selectedOfficials = selectedStateCode
    ? officials.filter((official) => (official.state ?? "TX").toUpperCase() === selectedStateCode)
    : [];
  const directoryOfficials = selectedStateCode ? selectedOfficials : officials;
  const dashboardOfficials = getOfficialsWithPhotosByState(directoryOfficials);
  const directoryFederalCount = directoryOfficials.filter((official) => official.level === "federal").length;
  const directoryPhotoCount = directoryOfficials.filter((official) => Boolean(official.photo)).length;
  const directorySourceCount = directoryOfficials.filter((official) => (official.sourceLinks?.length ?? 0) > 0).length;
  const loadedFederalStates = new Set(
    officials
      .filter((official) => official.level === "federal" && official.state)
      .map((official) => official.state?.toUpperCase()),
  ).size;
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
  const statCards = [
    {
      label: "Federal/state seats",
      value: formatNumber(dataStats.federalAndStateSeatProfilesLoaded),
      detail: `${dataStats.federalProfilesLoaded}/${dataStats.federalExpectedSeats} current federal seats across all 50 states and ${dataStats.stateLegislatorProfilesLoaded}/${dataStats.stateLegislatureExpectedSeats} Texas legislative seats have person profile files.`,
    },
    {
      label: "Source-seeded profiles",
      value: formatNumber(dataStats.sourceSeededOfficialProfiles),
      detail: `${formatNumber(dataStats.officialsWithSourceLinks)} source-linked profiles and ${formatNumber(dataStats.officialsWithPhotos)} local photos; ${formatNumber(dataStats.missingReviewStatusOfficialProfiles)} legacy files still need review status.`,
    },
    {
      label: "Tracked record sets",
      value: formatNumber(dataStats.scoreCards),
      detail: `${formatNumber(dataStats.fundingSummaries)} funding summaries, ${formatNumber(dataStats.redFlagItems)} red-flag items, and ${formatNumber(dataStats.bills)} vote files are loaded.`,
    },
    {
      label: "School-board dossiers",
      value: formatNumber(schoolBoardStats.candidates),
      detail: `${formatNumber(schoolBoardStats.districts)} Texas districts, ${formatNumber(schoolBoardStats.stubProfiles)} queued or in-progress profiles, ${formatNumber(schoolBoardStats.gapCount)} research gaps.`,
    },
  ];
  return (
    <div className="bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <OfficialsCommandDeck
          selectedStateCode={selectedStateCode}
          selectedStateName={selectedState?.name}
          jurisdictions={jurisdictions}
          profileCountsByState={profileCountsByState}
          spotlightOfficials={dashboardOfficials}
          initialLevel={initialLevel}
          initialSearch={initialSearch}
          totalOfficials={directoryOfficials.length}
          federalOfficials={directoryFederalCount}
          photoCount={directoryPhotoCount}
          sourceLinkedCount={directorySourceCount}
          loadedFederalStates={loadedFederalStates}
          federalExpectedSeats={dataStats.federalExpectedSeats}
          federalProfilesLoaded={dataStats.federalProfilesLoaded}
        />

        {directoryOfficials.length > 0 ? (
          <div id="official-directory" className="mt-5 scroll-mt-24">
            <h1 className="sr-only">
              {selectedStateCode ? `${selectedState?.name ?? selectedStateCode} elected officials directory` : "National elected officials directory"}
            </h1>
            <Suspense
              fallback={
                <div className="animate-pulse space-y-4 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
                  <div className="h-12 rounded-xl bg-gray-200" />
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-8 w-24 rounded-full bg-gray-100" />
                    ))}
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-32 rounded-2xl bg-gray-100" />
                    ))}
                  </div>
                </div>
              }
            >
              <OfficialGrid officials={directoryOfficials} scoreCards={scoreCards} />
            </Suspense>
          </div>
        ) : selectedStateCode ? (
          <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Source import queued</p>
            <h2 className="mt-1 text-2xl font-black text-amber-950">
              {selectedState?.name ?? selectedStateCode} elected-official profiles are not loaded yet.
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-amber-900">
              The state is turned on in the national model. RepWatchr still needs official rosters, public photos,
              vote records, source links, funding records, and correction paths before public profile cards appear here.
            </p>
          </section>
        ) : null}

        <div className="mt-8">
          <NationalSpotlightSelector
            basePath="/officials"
            selectedStateCode={selectedStateCode}
            jurisdictions={jurisdictions}
            pageLabel="Coverage board"
            title="Choose a state when you want the local view."
            description="The people directory is above. This board shows which states are green, partial, or queued as the national official model fills in."
            profileNoun="official profiles"
            profileCountsByState={profileCountsByState}
          />
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-300 bg-white text-slate-950 shadow-sm">
          <div className="h-1.5 w-full bg-[linear-gradient(90deg,#b42318_0%,#b42318_48%,#ffffff_48%,#ffffff_52%,#1d4ed8_52%,#1d4ed8_100%)]" />
          <div className="grid gap-6 p-5 lg:grid-cols-[1.18fr_0.82fr] lg:p-7">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                United States public-record map
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Elected officials, source-backed.
              </h2>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700 sm:text-base">
                RepWatchr is built for nationwide coverage. Federal senators and representatives are loaded for every state. Texas remains the first deeper state/local buildout while D.C., territories, tribal governments, school boards, special districts, courts, and other public offices stay marked queued or partial until public sources are attached.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {Object.entries(levelLabels).map(([level, label]) => (
                  <Link
                    key={level}
                    href={`/officials?level=${level}`}
                    className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-800 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-800"
                  >
                    {label}: {formatNumber(levelCounts[level as GovernmentLevel])}
                  </Link>
                ))}
                <Link
                  href="/buildout"
                  className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-black text-red-800 transition hover:border-red-300 hover:bg-white"
                >
                  National model: {formatNumber(nationalSummary.enabledJurisdictions)} jurisdictions
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {statCards.map((card) => (
                <div key={card.label} className="rounded-xl border border-slate-300 bg-slate-50 p-4 shadow-sm">
                  <p className="text-2xl font-black text-slate-950">{card.value}</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{card.label}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-700">{card.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
            Nationwide source lanes
          </p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">
            Federal, state, local, tribal, and public-organization profiles use the same model.
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {nationalGovernmentScopes.slice(0, 6).map((scope) => (
              <div key={scope.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-950">{scope.label}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{scope.buildoutNeed}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function OfficialsCommandDeck({
  selectedStateCode,
  selectedStateName,
  jurisdictions,
  profileCountsByState,
  spotlightOfficials,
  initialLevel,
  initialSearch,
  totalOfficials,
  federalOfficials,
  photoCount,
  sourceLinkedCount,
  loadedFederalStates,
  federalExpectedSeats,
  federalProfilesLoaded,
}: {
  selectedStateCode?: string;
  selectedStateName?: string;
  jurisdictions: ReturnType<typeof getAllNationalJurisdictions>;
  profileCountsByState: Record<string, number>;
  spotlightOfficials: Official[];
  initialLevel: string;
  initialSearch: string;
  totalOfficials: number;
  federalOfficials: number;
  photoCount: number;
  sourceLinkedCount: number;
  loadedFederalStates: number;
  federalExpectedSeats: number;
  federalProfilesLoaded: number;
}) {
  const activeScope = selectedStateCode ? selectedStateName ?? selectedStateCode : "United States";
  const quickStates = jurisdictions
    .filter((state) => (profileCountsByState[state.code] ?? 0) > 0)
    .slice(0, 18);

  const metrics = [
    {
      label: selectedStateCode ? "Loaded here" : "Officials live",
      value: formatNumber(totalOfficials),
      detail: selectedStateCode ? `${activeScope} profile files` : "People visible before choosing a state",
    },
    {
      label: "Federal selected",
      value: formatNumber(federalOfficials),
      detail: selectedStateCode ? "Federal profiles in this state" : `${federalProfilesLoaded}/${federalExpectedSeats} national seats loaded`,
    },
    {
      label: "Faces attached",
      value: formatNumber(photoCount),
      detail: "Local profile photos available now",
    },
    {
      label: "Source linked",
      value: formatNumber(sourceLinkedCount),
      detail: selectedStateCode ? "Profiles with public source links" : `${loadedFederalStates} states green for federal`,
    },
  ];

  return (
    <section className="overflow-hidden rounded-lg border border-slate-300 bg-slate-950 text-white shadow-sm">
      <div className="h-1.5 bg-[linear-gradient(90deg,#c1121f_0%,#c1121f_33%,#f5f5f4_33%,#f5f5f4_66%,#1d4ed8_66%,#1d4ed8_100%)]" />
      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.04fr)_minmax(320px,0.96fr)] lg:p-6">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">Elected officials command deck</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            Find the people in office.
          </h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-200 sm:text-base">
            Federal is open by default. Search a name, pick a state, or change levels to move from Congress down into state, county, city, district, and school-board records.
          </p>

          <form action="/officials" className="mt-5 grid gap-2 rounded-lg border border-white/10 bg-white/10 p-3 md:grid-cols-[minmax(0,1fr)_150px_170px_auto]">
            <label className="min-w-0">
              <span className="text-[11px] font-black uppercase tracking-wide text-slate-300">Search name or office</span>
              <input
                name="search"
                defaultValue={initialSearch}
                placeholder="Search by name, office, district, state, or county"
                className="mt-1 w-full rounded-lg border border-white/15 bg-white px-3 py-3 text-sm font-black text-slate-950 placeholder:text-slate-500 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label>
              <span className="text-[11px] font-black uppercase tracking-wide text-slate-300">Level</span>
              <select
                name="level"
                defaultValue={initialLevel}
                className="mt-1 w-full rounded-lg border border-white/15 bg-white px-3 py-3 text-sm font-black text-slate-950 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-200"
              >
                <option value="federal">Federal</option>
                <option value="state">State</option>
                <option value="county">County</option>
                <option value="city">City</option>
                <option value="school-board">School Board</option>
                <option value="all">All loaded</option>
              </select>
            </label>
            <label>
              <span className="text-[11px] font-black uppercase tracking-wide text-slate-300">State</span>
              <select
                name="state"
                defaultValue={selectedStateCode ?? ""}
                className="mt-1 w-full rounded-lg border border-white/15 bg-white px-3 py-3 text-sm font-black text-slate-950 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">National</option>
                {jurisdictions.map((state) => {
                  const count = profileCountsByState[state.code] ?? 0;
                  return (
                    <option key={state.code} value={state.code}>
                      {state.name}{count > 0 ? ` - ${count.toLocaleString()}` : " - queued"}
                    </option>
                  );
                })}
              </select>
            </label>
            <button
              type="submit"
              className="rounded-lg bg-[#d5aa3f] px-5 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:bg-[#f0c75f] md:self-end"
            >
              Open
            </button>
          </form>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <Link
              href="/officials?level=federal"
              className="shrink-0 rounded-full border border-blue-300/40 bg-blue-500/15 px-3 py-1.5 text-xs font-black text-blue-100 transition hover:bg-blue-500/25"
            >
              National federal feed
            </Link>
            {quickStates.map((state) => (
              <Link
                key={state.code}
                href={`/officials?state=${state.code}&level=federal`}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-black transition ${
                  selectedStateCode === state.code
                    ? "border-[#d5aa3f] bg-[#d5aa3f] text-slate-950"
                    : "border-white/15 bg-white/10 text-slate-100 hover:bg-white/20"
                }`}
              >
                {state.code}: {(profileCountsByState[state.code] ?? 0).toLocaleString()}
              </Link>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <div className="grid grid-cols-2 gap-2">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-lg border border-white/10 bg-white p-3 text-slate-950">
                <p className="text-2xl font-black">{metric.value}</p>
                <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-red-700">{metric.label}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{metric.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-lg border border-white/10 bg-white/10 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-300">
                {selectedStateCode ? `${activeScope} faces` : "National face strip"}
              </p>
              <Link href="#official-directory" className="text-xs font-black text-[#f5d77b] hover:text-white">
                View roster
              </Link>
            </div>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {spotlightOfficials.map((official) => {
                const initials = `${official.firstName[0] ?? ""}${official.lastName[0] ?? ""}`;
                return (
                  <Link
                    key={official.id}
                    href={`/officials/${official.id}`}
                    className="group w-36 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white text-slate-950 transition hover:-translate-y-0.5 hover:border-[#d5aa3f]"
                  >
                    <div className="relative h-32 bg-slate-200">
                      {official.photo ? (
                        <Image
                          src={official.photo}
                          alt={`${official.name} profile photo`}
                          fill
                          sizes="144px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl font-black text-slate-500">{initials}</div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="truncate text-sm font-black group-hover:text-blue-800">{official.name}</p>
                      <p className="mt-0.5 truncate text-[11px] font-bold text-slate-600">{official.position}</p>
                      <p className="mt-1 truncate text-[11px] font-black uppercase tracking-wide text-red-700">
                        {official.state ?? official.jurisdiction}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
