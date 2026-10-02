import type { Metadata } from "next";
import Link from "next/link";
import { getAllOfficials, getRepWatchrDataStats } from "@/lib/data";
import { repwatchrFeatureFlags } from "@/lib/repwatchr-feature-flags";
import { getSchoolBoardStats } from "@/lib/school-board-research";
import OfficialsCommandSearchForm from "@/components/officials/OfficialsCommandSearchForm";
import OfficialSearchPanel from "@/components/officials/OfficialSearchPanel";
import OfficialPhotoImage, { FEATURED_OFFICIAL_PHOTO_QUALITY } from "@/components/shared/OfficialPhotoImage";
import type { GovernmentLevel, Official } from "@/types";
import { countByState, getSelectedStateCode } from "@/lib/state-scope";
import { officialState } from "@/lib/official-coverage";
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

const texasJurisdictions = [{ code: "TX", name: "Texas" }];

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
  const selectedState = params.state === "TX" ? texasJurisdictions[0] : undefined;
  const levelLabel = params.level !== "all" ? levelLabels[params.level] : "Elected";
  const scope = "Texas";
  const isIndexable = (!params.state || params.state === "TX") && isOfficialSearchIndexable(params);
  const hasSafeFilter = params.state || params.level !== "all";

  // A place facet is its own page, so it gets its own title. Without this,
  // ?county=Gregg is indexable while reading "Texas Elected Officials", a
  // near-duplicate of ?state=TX.
  const place = params.county
    ? `${params.county} County${selectedState ? `, ${selectedState.name}` : ""}`
    : params.city
      ? `${params.city}${selectedState ? `, ${selectedState.name}` : ""}`
      : "";

  const title = place
    ? `${place} ${levelLabel} Officials`
    : hasSafeFilter
      ? `${scope} ${levelLabel} Officials`
      : "Texas Elected Officials Directory";

  const description = place
    ? `Every ${levelLabel.toLowerCase()} official RepWatchr carries for ${place}, with public sources, voting records, funding data, and the records still being researched.`
    : hasSafeFilter
      ? `Browse source-backed ${levelLabel.toLowerCase()} official profiles for ${scope}. Compare voting records, public sources, funding data, and records still being researched.`
      : "Browse Texas elected officials, with HD-7 and TX-01 first. Filter by county, city and office to review public sources, votes, funding and research gaps.";

  return buildRepWatchrMetadata({
    title,
    description,
    path: officialSearchCanonicalPath(params),
    imagePath: buildOgImageUrl("home", { page: "officials" }),
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
  const jurisdictions = texasJurisdictions;
  const stateLegislatureStats = getStateLegislatureBuildoutStats();
  const profileCountsByState = countByState(officials, officialState);
  const selectedState = jurisdictions.find((state) => state.code === selectedStateCode);
  const selectedOfficials = selectedStateCode
    ? officials.filter((official) => officialState(official) === selectedStateCode)
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
      detail: `${formatNumber(stateLegislatureStats.lowerChamberProfiles)} Texas House profiles and ${formatNumber(stateLegislatureStats.upperChamberProfiles)} Texas Senate profiles.`,
    },
    {
      label: "Federal seats",
      value: `${dataStats.federalProfilesLoaded}/${dataStats.federalExpectedSeats}`,
      detail: `${formatNumber(dataStats.federalHouseProfilesLoaded)} Texas U.S. House profiles and ${formatNumber(dataStats.federalSenateProfilesLoaded)} Texas U.S. Senate profiles are loaded.`,
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
          federalExpectedSeats={dataStats.federalExpectedSeats}
          federalProfilesLoaded={dataStats.federalProfilesLoaded}
          completeProfiles={buildoutStats.completeProfiles}
          incompleteProfiles={buildoutStats.incompleteProfiles}
        />

        {repwatchrFeatureFlags.districtFocusOnly ? (
          <section className="mt-5 rounded-2xl border border-[#cabfae] bg-[#f7f2e6] p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a23a2b]">
              Texas coverage, home districts first
            </p>
            <h2 className="mt-1 font-serif text-2xl font-bold text-slate-950">
              The directory is showing HD-7 and TX-01 first.
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              RepWatchr covers elected officials across Texas, with Texas House District 7 and Texas&rsquo;s 1st
              congressional district first. Search a name or choose a county, city or office level to find other
              Texas officials. Choose All Texas to browse the full retained directory.
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm font-bold">
              <Link href="/home-district" className="text-[#163b5c] underline underline-offset-4">
                What the beat covers
              </Link>
              <Link href="/home-district/roster" className="text-[#163b5c] underline underline-offset-4">
                Every seat and every gap
              </Link>
              <Link href="/officials?state=TX" className="text-[#163b5c] underline underline-offset-4">
                All Texas officials
              </Link>
            </div>
          </section>
        ) : null}

        <div id="official-directory" className="mt-5 scroll-mt-24">
          <OfficialSearchPanel result={searchResult} />
        </div>

        {selectedStateCode && directoryOfficials.length === 0 ? (
          <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Texas directory</p>
            <h2 className="mt-1 text-2xl font-black text-amber-950">
              This directory covers Texas elected officials.
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-amber-900">
              Profiles outside Texas are outside this site&rsquo;s coverage. Choose All Texas or return to the
              HD-7 and TX-01 view.
            </p>
            <Link href="/officials?state=TX" className="mt-3 inline-flex text-sm font-bold text-[#163b5c] underline underline-offset-4">
              Browse Texas officials
            </Link>
          </section>
        ) : null}

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-300 bg-white text-slate-950 shadow-sm">
          <div className="h-1.5 w-full bg-[linear-gradient(90deg,#b42318_0%,#b42318_48%,#ffffff_48%,#ffffff_52%,#1d4ed8_52%,#1d4ed8_100%)]" />
          <div className="grid gap-6 p-5 lg:grid-cols-[1.18fr_0.82fr] lg:p-7">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                Texas public-record directory
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Elected officials, source-backed.
              </h2>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700 sm:text-base">
                Follow Texas&rsquo;s federal representatives, statewide offices, state legislature and local
                elected officials. HD-7 and TX-01 lead the coverage; source links and research gaps show what
                has been collected and what still needs review.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {Object.entries(levelLabels).map(([level, label]) => (
                  <Link
                    key={level}
                    href={`/officials?state=TX&level=${level}`}
                    className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-800 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-800"
                  >
                    {label}: {formatNumber(levelCounts[level as GovernmentLevel])}
                  </Link>
                ))}
                <Link
                  href="/home-district/roster"
                  className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-black text-red-800 transition hover:border-red-300 hover:bg-white"
                >
                  HD-7 / TX-01 seat ledger
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
  federalExpectedSeats,
  federalProfilesLoaded,
  completeProfiles,
  incompleteProfiles,
}: {
  selectedStateCode?: string;
  selectedStateName?: string;
  jurisdictions: typeof texasJurisdictions;
  profileCountsByState: Record<string, number>;
  spotlightOfficials: Official[];
  initialLevel: string;
  initialSearch: string;
  totalOfficials: number;
  federalOfficials: number;
  photoCount: number;
  sourceLinkedCount: number;
  federalExpectedSeats: number;
  federalProfilesLoaded: number;
  completeProfiles: number;
  incompleteProfiles: number;
}) {
  const activeScope = selectedStateCode === "TX" ? selectedStateName ?? "Texas" : "Texas · HD-7 / TX-01 first";
  const quickStates = jurisdictions
    .filter((state) => (profileCountsByState[state.code] ?? 0) > 0)
    .slice(0, 12);
  const featuredOfficials = spotlightOfficials.slice(0, 3);
  // Keep the same featured records, but use a sufficiently detailed original
  // for the large frame. This changes presentation, never directory ranking.
  const leadOfficial = featuredOfficials.find((official) => {
    const photo = official.featuredPhotoMetadata ?? official.photoMetadata;
    return photo && Math.min(photo.width, photo.height) >= 800;
  }) ?? featuredOfficials[0];
  const supportingOfficials = featuredOfficials.filter((official) => official.id !== leadOfficial?.id);
  const coveragePercent = totalOfficials > 0 ? Math.round((sourceLinkedCount / totalOfficials) * 100) : 0;

  return (
    <section className="relative isolate overflow-hidden border-y border-white/20 bg-[#06172f] text-white">
      <div className="relative grid gap-8 p-5 sm:p-8 lg:p-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-center xl:gap-10 xl:p-12">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-y border-white/20 py-3 text-sm text-slate-300">
            <p className="font-serif italic text-white">RepWatchr public record desk</p>
            <p>2026 midterm edition · {activeScope}</p>
          </div>
          <h1 className="mt-7 max-w-3xl text-balance font-serif text-4xl font-semibold leading-[1.06] tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
            Know who represents you—and what their record shows.
          </h1>
          <p className="mt-6 max-w-2xl border-l border-amber-300/70 pl-5 text-base leading-7 text-slate-200 sm:text-lg">
            Follow Texas officials from Congress to the statehouse and local offices. Every profile shows the public
            sources, recorded votes, funding trail, and research gaps behind the headline.
          </p>

          <div className="mt-7">
            <OfficialsCommandSearchForm
              jurisdictions={jurisdictions}
              profileCountsByState={profileCountsByState}
              selectedStateCode={selectedStateCode}
              initialLevel={initialLevel}
              initialSearch={initialSearch}
              totalOfficials={Object.values(profileCountsByState).reduce((total, count) => total + count, 0)}
            />
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto border-b border-white/10 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link
              href="/officials?state=TX&level=federal"
              className="shrink-0 rounded-sm border border-blue-300/30 bg-blue-400/10 px-3 py-2 text-xs font-semibold text-blue-100 hover:bg-blue-400/20"
            >
              Texas in Congress
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
            Coverage is transparent: {formatNumber(photoCount)} profiles have photography, {formatNumber(completeProfiles)}{" "}
            are fully built, and {formatNumber(incompleteProfiles)} remain visibly marked for research. Texas federal
            coverage: {formatNumber(federalProfilesLoaded)}/{formatNumber(federalExpectedSeats)} seats.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-5xl xl:max-w-none">
          <div className="relative grid h-[30rem] grid-cols-1 gap-3 sm:h-[34rem] sm:grid-cols-3 sm:grid-rows-2">
            {leadOfficial ? (
              <FeaturedPortrait official={leadOfficial} className="sm:col-span-2 sm:row-span-2" priority />
            ) : null}
            {supportingOfficials.slice(0, 2).map((official) => (
              <FeaturedPortrait key={official.id} official={official} className="hidden sm:flex" />
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
      className={`group relative isolate flex min-h-0 flex-col overflow-hidden rounded-md border border-white/20 bg-[#10223a] transition-colors hover:border-amber-200/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200 ${className}`}
    >
      <div className="relative min-h-0 flex-1 bg-[#e7ebee]">
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
        featuredClassName="object-contain object-center"
        portraitClassName="object-contain object-center"
        fallbackClassName="grid h-full w-full place-items-center bg-gradient-to-br from-slate-700 to-slate-950 text-5xl font-black text-white/50"
      />
      </div>
      <div className={priority ? "border-t border-white/15 p-4 sm:p-5" : "border-t border-white/15 p-3"}>
        <p className={`${priority ? "text-xl" : "text-base"} font-bold leading-tight text-white`}>{official.name}</p>
        <p className="mt-1 text-xs leading-5 text-slate-300">{official.position}</p>
        <p className="mt-2 text-xs font-semibold text-amber-200 group-hover:text-amber-100">
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
