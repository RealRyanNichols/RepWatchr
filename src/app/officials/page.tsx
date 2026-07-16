import type { Metadata } from "next";
import Link from "next/link";
import { getAllOfficials, getRepWatchrDataStats } from "@/lib/data";
import { getSchoolBoardStats } from "@/lib/school-board-research";
import OfficialsCommandSearchForm from "@/components/officials/OfficialsCommandSearchForm";
import OfficialSearchPanel from "@/components/officials/OfficialSearchPanel";
import NationalSpotlightSelector from "@/components/shared/NationalSpotlightSelector";
import OfficialPhotoImage, { FEATURED_OFFICIAL_PHOTO_QUALITY } from "@/components/shared/OfficialPhotoImage";
import type { GovernmentLevel, Official } from "@/types";
import { getAllNationalJurisdictions, getNationalBuildoutSummary, nationalGovernmentScopes } from "@/data/national-buildout";
import { countByState, getSelectedStateCode } from "@/lib/state-scope";
import { getOfficialCompletionDashboard } from "@/lib/profile-completion";
import { getStateLegislatureBuildoutStats } from "@/lib/state-legislature";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";
import {
  isOfficialSearchIndexable,
  officialSearchCanonicalPath,
  parseOfficialSearchParams,
  searchOfficials,
} from "@/lib/official-search";

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
  return Object.keys(levelLabels).includes(value) || value === "all" ? value : "all";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const rawParams = searchParams ? await searchParams : {};
  const params = parseOfficialSearchParams(rawParams);
  const jurisdictions = getAllNationalJurisdictions();
  const selectedState = params.state ? jurisdictions.find((state) => state.code === params.state) : undefined;
  const levelLabel = params.level !== "all" ? levelLabels[params.level] : "Elected";
  const scope = selectedState?.name ?? (params.state || "National");
  const isIndexable = isOfficialSearchIndexable(params);
  const hasSafeFilter = params.state || params.level !== "all";

  return buildRepWatchrMetadata({
    title: hasSafeFilter ? `${scope} ${levelLabel} Officials` : "National Elected Officials Directory",
    description: hasSafeFilter
      ? `Browse source-backed ${levelLabel.toLowerCase()} official profiles for ${scope}. Compare voting records, public sources, funding data, and records still being researched.`
      : "Search and filter RepWatchr elected-official profiles by state, county, city, office level, party, public sources, funding data, and voting records.",
    path: officialSearchCanonicalPath(params),
    imagePath: buildOgImageUrl("home"),
    imageAlt: "RepWatchr officials directory preview",
    robots: isIndexable ? undefined : { index: false, follow: true },
  });
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
  const searchResult = await searchOfficials(params);
  const selectedStateCode = getSelectedStateCode({ state: searchResult.params.state });
  const initialSearch = searchResult.params.search || getParamValue(params.search);
  const initialLevel = getInitialLevel(searchResult.params.level);
  const officials = getAllOfficials();
  const schoolBoardStats = getSchoolBoardStats();
  const dataStats = getRepWatchrDataStats();
  const buildoutStats = getOfficialCompletionDashboard();
  const jurisdictions = getAllNationalJurisdictions();
  const nationalSummary = getNationalBuildoutSummary();
  const stateLegislatureStats = getStateLegislatureBuildoutStats();
  const profileCountsByState = countByState(officials, (official) => official.state, "TX");
  const selectedState = jurisdictions.find((state) => state.code === selectedStateCode);
  const selectedOfficials = selectedStateCode
    ? officials.filter((official) => (official.state ?? "TX").toUpperCase() === selectedStateCode)
    : [];
  const directoryOfficials = selectedStateCode ? selectedOfficials : officials;
  const dashboardOfficials = getOfficialsWithPhotosByState(directoryOfficials);
  const resultSpotlightOfficials = searchResult.rows
    .map((row) => row.official)
    .filter((official) => Boolean(official.photo))
    .slice(0, 5);
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
      label: "Statehouse profiles",
      value: formatNumber(stateLegislatureStats.totalProfiles),
      detail: `${formatNumber(stateLegislatureStats.lowerChamberProfiles)} state reps/delegates and ${formatNumber(stateLegislatureStats.upperChamberProfiles)} state senators across ${formatNumber(stateLegislatureStats.jurisdictionsLoaded)} jurisdictions.`,
    },
    {
      label: "Federal seats",
      value: `${dataStats.federalProfilesLoaded}/${dataStats.federalExpectedSeats}`,
      detail: `${formatNumber(dataStats.federalHouseProfilesLoaded)} U.S. House profiles and ${formatNumber(dataStats.federalSenateProfilesLoaded)} U.S. Senate profiles are live before the deeper local buildout.`,
    },
    {
      label: "Source-seeded profiles",
      value: formatNumber(dataStats.sourceSeededOfficialProfiles),
      detail: `${formatNumber(dataStats.officialsWithSourceLinks)} source-linked profiles and ${formatNumber(dataStats.officialsWithPhotos)} local photos; ${formatNumber(stateLegislatureStats.profilesMissingPhotos)} state-legislative profiles still need photos.`,
    },
    {
      label: "Vote records loaded",
      value: formatNumber(dataStats.publicVoteRecords),
      detail: `${formatNumber(dataStats.publicVoteRecordRows)} public roll-call rows, ${formatNumber(dataStats.scoreCards)} scorecards, ${formatNumber(dataStats.fundingSummaries)} funding summaries, and ${formatNumber(dataStats.redFlagItems)} red-flag items are loaded.`,
    },
    {
      label: "Congress trading flags",
      value: formatNumber(dataStats.congressTradingCurrentProfilesWithRows),
      detail: `${formatNumber(dataStats.congressTradingMatchedRows)} matched tracker rows from ${formatNumber(dataStats.congressTradingTrackerTransactions)} public disclosure transactions; ${formatNumber(dataStats.congressTradingCriticalRows)} critical and ${formatNumber(dataStats.congressTradingHighRows)} high review rows.`,
    },
    {
      label: "School-board dossiers",
      value: formatNumber(schoolBoardStats.candidates),
      detail: `${formatNumber(schoolBoardStats.districts)} Texas districts, ${formatNumber(schoolBoardStats.stubProfiles)} queued or in-progress profiles, ${formatNumber(schoolBoardStats.gapCount)} research gaps.`,
    },
  ];
  return (
    <div className="rw-page-shell">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <OfficialsCommandDeck
          selectedStateCode={selectedStateCode}
          selectedStateName={selectedState?.name}
          jurisdictions={jurisdictions}
          profileCountsByState={profileCountsByState}
          spotlightOfficials={resultSpotlightOfficials.length >= 3 ? resultSpotlightOfficials : dashboardOfficials}
          initialLevel={initialLevel}
          initialSearch={initialSearch}
          totalOfficials={directoryOfficials.length}
          federalOfficials={directoryFederalCount}
          photoCount={directoryPhotoCount}
          sourceLinkedCount={directorySourceCount}
          loadedFederalStates={loadedFederalStates}
          federalExpectedSeats={dataStats.federalExpectedSeats}
          federalProfilesLoaded={dataStats.federalProfilesLoaded}
          completeProfiles={buildoutStats.completeProfiles}
          incompleteProfiles={buildoutStats.incompleteProfiles}
        />

        <div id="official-directory" className="mt-5 scroll-mt-24">
          <h1 className="sr-only">
            {selectedStateCode ? `${selectedState?.name ?? selectedStateCode} elected officials directory` : "National elected officials directory"}
          </h1>
          <OfficialSearchPanel result={searchResult} />
        </div>

        {selectedStateCode && directoryOfficials.length === 0 ? (
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
  completeProfiles,
  incompleteProfiles,
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
  completeProfiles: number;
  incompleteProfiles: number;
}) {
  const activeScope = selectedStateCode ? selectedStateName ?? selectedStateCode : "United States";
  const quickStates = jurisdictions
    .filter((state) => (profileCountsByState[state.code] ?? 0) > 0)
    .slice(0, 12);
  const featuredOfficials = spotlightOfficials.slice(0, 5);
  const leadOfficial = featuredOfficials[0];
  const supportingOfficials = featuredOfficials.slice(1);
  const coveragePercent = totalOfficials > 0 ? Math.round((sourceLinkedCount / totalOfficials) * 100) : 0;

  return (
    <section className="relative isolate overflow-hidden border-y border-white/20 bg-[#06172f] text-white">
      <div className="relative grid gap-10 p-5 sm:p-8 lg:p-10 xl:min-h-[680px] xl:grid-cols-[minmax(0,1.05fr)_minmax(34rem,0.95fr)] xl:items-center xl:p-12">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-y border-white/20 py-3 text-sm text-slate-300">
            <p className="font-serif italic text-white">RepWatchr public record desk</p>
            <p>2026 midterm edition · {activeScope}</p>
          </div>
          <h1 className="mt-8 max-w-3xl font-serif text-4xl font-semibold leading-[0.98] tracking-[-0.035em] text-white sm:text-6xl lg:text-7xl">
            Know who represents you—and what their record shows.
          </h1>
          <p className="mt-6 max-w-2xl border-l border-amber-300/70 pl-5 text-base leading-7 text-slate-200 sm:text-lg">
            Move from Congress to your statehouse and local offices. Every profile is designed to show the public
            sources, recorded votes, funding trail, and research gaps behind the headline.
          </p>

          <div className="mt-7">
            <OfficialsCommandSearchForm
              jurisdictions={jurisdictions}
              profileCountsByState={profileCountsByState}
              selectedStateCode={selectedStateCode}
              initialLevel={initialLevel}
              initialSearch={initialSearch}
              totalOfficials={totalOfficials}
            />
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto border-b border-white/10 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link
              href="/officials?level=federal"
              className="shrink-0 rounded-sm border border-blue-300/30 bg-blue-400/10 px-3 py-2 text-xs font-semibold text-blue-100 hover:bg-blue-400/20"
            >
              Federal races
            </Link>
            <Link
              href="/state-reps"
              className="shrink-0 rounded-sm border border-amber-300 bg-amber-300 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-200"
            >
              Statehouse desk
            </Link>
            {quickStates.map((state) => (
              <Link
                key={state.code}
                href={`/officials?state=${state.code}`}
                className={`shrink-0 rounded-sm border px-3 py-2 text-xs font-semibold ${
                  selectedStateCode === state.code
                    ? "border-amber-300 bg-amber-300 text-slate-950"
                    : "border-white/15 bg-white/[0.07] text-slate-100 hover:bg-white/[0.14]"
                }`}
              >
                {state.code} · {formatNumber(profileCountsByState[state.code] ?? 0)}
              </Link>
            ))}
          </div>

          <div className="mt-6 grid max-w-2xl grid-cols-3 border-y border-white/10 py-4">
            <HeroMetric value={formatNumber(totalOfficials)} label={`${activeScope} profiles`} />
            <HeroMetric value={`${coveragePercent}%`} label="source linked" />
            <HeroMetric value={formatNumber(federalOfficials)} label="federal profiles" />
          </div>
          <p className="mt-3 max-w-2xl text-xs font-semibold leading-5 text-slate-400">
            Coverage is transparent: {formatNumber(photoCount)} profiles have photography, {formatNumber(completeProfiles)}
            are fully built, and {formatNumber(incompleteProfiles)} remain visibly marked for research. National federal
            coverage: {formatNumber(federalProfilesLoaded)}/{formatNumber(federalExpectedSeats)} seats across {loadedFederalStates} states.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-5xl xl:max-w-none">
          <div className="relative grid min-h-[28rem] grid-cols-1 gap-3 sm:aspect-[16/8] sm:min-h-0 sm:grid-cols-3 sm:grid-rows-2 xl:aspect-auto xl:h-[590px]">
            {leadOfficial ? (
              <FeaturedPortrait official={leadOfficial} className="sm:col-span-2 sm:row-span-2" priority />
            ) : null}
            {supportingOfficials.slice(0, 2).map((official) => (
              <FeaturedPortrait key={official.id} official={official} className="hidden sm:block" />
            ))}
          </div>
          <div className="relative mt-4 flex flex-col gap-3 border-y border-white/15 bg-slate-950/45 px-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div>
              <p className="text-xs font-semibold text-amber-200">Profiles in this view</p>
              <p className="mt-1 text-sm font-semibold text-slate-200">Open a portrait, then follow every claim to its source.</p>
            </div>
            <Link
              href="#official-directory"
              className="shrink-0 self-start rounded-sm bg-white px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-200 sm:self-auto"
            >
              Explore all ↓
            </Link>
          </div>
        </div>
      </div>

      <div className="relative grid border-t border-white/10 bg-white/[0.045] sm:grid-cols-3">
        <TrustPoint number="01" title="Receipts first" detail="Public records sit beside the claim." />
        <TrustPoint number="02" title="Gaps stay visible" detail="Missing data is labeled, never guessed." />
        <TrustPoint number="03" title="Corrections stay open" detail="Every profile has a source path." />
      </div>
    </section>
  );
}

function HeroMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-r border-white/10 px-3 first:pl-0 last:border-r-0 sm:px-5">
      <p className="text-2xl font-black tracking-tight text-white sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-400">{label}</p>
    </div>
  );
}

function FeaturedPortrait({
  official,
  className = "",
  priority = false,
}: {
  official: Official;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/officials/${official.id}`}
      className={`group relative isolate min-h-0 overflow-hidden rounded-md border border-white/20 bg-slate-800 hover:border-amber-200/60 ${className}`}
    >
      <OfficialPhotoImage
        official={official}
        sizes={
          priority
            ? "(min-width: 1280px) 360px, (min-width: 640px) 66vw, calc(100vw - 40px)"
            : "(min-width: 1280px) 180px, (min-width: 640px) 33vw, 0px"
        }
        quality={FEATURED_OFFICIAL_PHOTO_QUALITY}
        preload={priority}
        adaptivePortrait
        featuredClassName="object-cover object-top transition duration-500 ease-out group-hover:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none"
        portraitClassName="object-contain object-center transition duration-500 ease-out group-hover:scale-[1.015] motion-reduce:transform-none motion-reduce:transition-none"
        fallbackClassName="grid h-full w-full place-items-center bg-gradient-to-br from-slate-700 to-slate-950 text-5xl font-black text-white/50"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        <p className="text-lg font-black leading-tight text-white sm:text-xl">{official.name}</p>
        <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-200 sm:text-sm">{official.position}</p>
        <p className="mt-2 text-xs font-semibold text-amber-200">
          {official.state ?? official.jurisdiction} · Open record ↗
        </p>
      </div>
    </Link>
  );
}

function TrustPoint({ number, title, detail }: { number: string; title: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-white/10 px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 lg:px-8">
      <span className="font-mono text-xs font-black text-amber-300">{number}</span>
      <div>
        <p className="text-sm font-black text-white">{title}</p>
        <p className="mt-0.5 text-xs font-semibold text-slate-400">{detail}</p>
      </div>
    </div>
  );
}
