import Link from "next/link";
import type { GovernmentLevel, Party } from "@/types";
import PartyBadge from "@/components/officials/PartyBadge";
import OfficialPhotoImage from "@/components/shared/OfficialPhotoImage";
import {
  officialSearchQuery,
  type OfficialCompletenessRange,
  type OfficialFacetOption,
  type OfficialScoreRange,
  type OfficialSearchParams,
  type OfficialSearchResult,
  type OfficialSearchRow,
  type OfficialSearchSort,
} from "@/lib/official-search";

const levelLabels: Record<GovernmentLevel, string> = {
  federal: "Federal",
  state: "State",
  county: "County",
  city: "City",
  "school-board": "School Board",
};

const partyLabels: Record<Party, string> = {
  R: "Republican",
  D: "Democrat",
  I: "Independent",
  NP: "Nonpartisan / Unknown",
  VR: "Votes Republican",
  VD: "Votes Democrat",
};

const sortLabels: Record<OfficialSearchSort, string> = {
  relevance: "Relevance",
  "most-viewed": "Most viewed",
  "most-watched": "Most watched",
  "most-sourced": "Most sourced",
  "highest-score": "Highest score",
  "lowest-score": "Lowest score",
  "most-red-flags": "Most red flags",
  "recently-updated": "Recently updated",
  "missing-source-priority": "Missing source priority",
};

const scoreRangeLabels: Record<OfficialScoreRange, string> = {
  all: "Any score",
  unscored: "Unscored",
  "0-49": "0-49",
  "50-69": "50-69",
  "70-84": "70-84",
  "85-100": "85-100",
};

const completenessLabels: Record<OfficialCompletenessRange, string> = {
  all: "Any completeness",
  complete: "100% complete",
  "85+": "85% or better",
  "55-84": "55-84%",
  "0-54": "0-54%",
};

const sourceCountOptions = [
  { value: "0", label: "Any source count" },
  { value: "1", label: "1+ sources" },
  { value: "3", label: "3+ sources" },
  { value: "5", label: "5+ sources" },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formSelectValue(value: string, fallback = "") {
  return value || fallback;
}

function resultRange(result: OfficialSearchResult) {
  if (result.total === 0) return "0 results";
  const first = (result.page - 1) * result.perPage + 1;
  const last = Math.min(result.total, result.page * result.perPage);
  return `${formatNumber(first)}-${formatNumber(last)} of ${formatNumber(result.total)}`;
}

function optionLabel(option: OfficialFacetOption) {
  return `${option.label} (${formatNumber(option.count)})`;
}

function activeFilterSummary(params: OfficialSearchParams) {
  const items: string[] = [];
  if (params.search) items.push(`search: ${params.search}`);
  if (params.state) items.push(`state: ${params.state}`);
  if (params.county) items.push(`county: ${params.county}`);
  if (params.city) items.push(`city: ${params.city}`);
  if (params.level !== "all") items.push(`level: ${levelLabels[params.level]}`);
  if (params.officeType) items.push("office type");
  if (params.party !== "all") items.push(`party: ${partyLabels[params.party]}`);
  if (params.scoreRange !== "all") items.push(`score: ${scoreRangeLabels[params.scoreRange]}`);
  if (params.hasRedFlags) items.push("has review notes");
  if (params.hasFundingData) items.push("has funding");
  if (params.hasVotingData) items.push("has votes");
  if (params.missingSources) items.push("missing sources");
  if (params.recentlyUpdated) items.push("recent");
  if (params.watchedByMembers) items.push("watched");
  if (params.sourceCount > 0) items.push(`${params.sourceCount}+ sources`);
  if (params.completeness !== "all") items.push(`complete: ${completenessLabels[params.completeness]}`);
  return items;
}

export default function OfficialSearchPanel({ result }: { result: OfficialSearchResult }) {
  const { params } = result;
  const activeFilters = activeFilterSummary(params);

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[#f8fafc] shadow-[0_20px_70px_rgba(15,23,42,0.10)]">
      <div className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(125deg,#fff7ed_0%,#ffffff_46%,#eff6ff_100%)] p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">
              Explore the public record
            </p>
            <h2 className="mt-2 max-w-3xl text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">
              Find a name. Follow the receipts.
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600 sm:text-base">
              Start broad or narrow by state and office. Each result makes loaded evidence and unfinished research easy
              to spot before you open the full profile.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 border-l-2 border-amber-400 pl-4 sm:pl-5">
            <MetricPill label="Profiles" value={result.stats.totalProfiles} />
            <MetricPill label="Source linked" value={result.stats.sourceLinkedProfiles} />
            <MetricPill label="Votes loaded" value={result.stats.voteLoadedProfiles} />
            <MetricPill label="Funding loaded" value={result.stats.fundingLoadedProfiles} />
          </div>
        </div>
      </div>

      <form action="/officials" method="get" className="border-b border-slate-200 bg-white p-4 sm:p-6">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1.35fr)_repeat(3,minmax(150px,0.55fr))]">
          <label className="block min-w-0">
            <span className="text-[11px] font-black uppercase tracking-wide text-slate-600">Search</span>
            <span className="relative mt-1 block">
              <input
                name="search"
                defaultValue={params.search}
                placeholder="Search a name, district, city, or office..."
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </span>
          </label>
          <SearchSelect
            label="State"
            name="state"
            value={params.state}
            emptyLabel="All states"
            options={result.facets.states}
          />
          <SearchSelect
            label="Office level"
            name="level"
            value={params.level === "all" ? "" : params.level}
            emptyLabel="All levels"
            options={result.facets.levels}
          />
          <SearchSelect
            label="Sort"
            name="sort"
            value={params.sort === "relevance" ? "" : params.sort}
            emptyLabel="Relevance"
            options={Object.entries(sortLabels)
              .filter(([value]) => !["relevance", "highest-score", "lowest-score"].includes(value))
              .map(([value, label]) => ({ value, label, count: 0 }))}
            showCounts={false}
          />
        </div>

        <details className="group mt-4 rounded-2xl border border-slate-200 bg-slate-50 open:bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-black text-slate-800 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              More ways to narrow the record
            </span>
            <span className="grid h-7 w-7 place-items-center rounded-full border border-slate-300 bg-white text-lg transition group-open:rotate-45">+</span>
          </summary>
          <div className="grid gap-3 border-t border-slate-200 p-4 md:grid-cols-2 xl:grid-cols-4">
          <SearchSelect
            label="County"
            name="county"
            value={params.county}
            emptyLabel="All counties"
            options={result.facets.counties.slice(0, 250)}
          />
          <SearchSelect
            label="City"
            name="city"
            value={params.city}
            emptyLabel="All cities"
            options={result.facets.cities.slice(0, 250)}
          />
          <SearchSelect
            label="Office type"
            name="officeType"
            value={params.officeType}
            emptyLabel="All office types"
            options={result.facets.officeTypes}
          />
          <SearchSelect
            label="Party"
            name="party"
            value={params.party === "all" ? "" : params.party}
            emptyLabel="All parties"
            options={result.facets.parties}
          />
          <SearchSelect
            label="Source count"
            name="sourceCount"
            value={params.sourceCount > 0 ? String(params.sourceCount) : ""}
            emptyLabel="Any source count"
            options={sourceCountOptions.filter((option) => option.value !== "0").map((option) => ({
              value: option.value,
              label: option.label,
              count: 0,
            }))}
            showCounts={false}
          />
          <SearchSelect
            label="Profile buildout"
            name="completeness"
            value={params.completeness === "all" ? "" : params.completeness}
            emptyLabel="Any buildout stage"
            options={Object.entries(completenessLabels)
              .filter(([value]) => value !== "all")
              .map(([value, label]) => ({ value, label, count: 0 }))}
            showCounts={false}
          />
          <SearchSelect
            label="Per page"
            name="perPage"
            value={params.perPage === 24 ? "" : String(params.perPage)}
            emptyLabel="24 per page"
            options={[
              { value: "12", label: "12 per page", count: 0 },
              { value: "36", label: "36 per page", count: 0 },
              { value: "48", label: "48 per page", count: 0 },
            ]}
            showCounts={false}
          />
          </div>
        </details>

        <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            <CheckboxFilter name="voting" label="Votes available" checked={params.hasVotingData} />
            <CheckboxFilter name="funding" label="Funding available" checked={params.hasFundingData} />
            <CheckboxFilter name="redFlags" label="Review notes" checked={params.hasRedFlags} />
            <CheckboxFilter name="missingSources" label="Needs sources" checked={params.missingSources} />
            <CheckboxFilter name="recent" label="Recently updated" checked={params.recentlyUpdated} />
            <CheckboxFilter name="watched" label="Watched by members" checked={params.watchedByMembers} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/officials"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-red-300 hover:text-red-800"
            >
              Clear filters
            </Link>
            <button
              type="submit"
              className="rounded-xl border border-blue-700 bg-blue-700 px-6 py-3 text-sm font-black text-white shadow-[0_8px_22px_rgba(29,78,216,0.24)] transition hover:-translate-y-0.5 hover:border-blue-800 hover:bg-blue-800 motion-reduce:transform-none motion-reduce:transition-none"
            >
              Search officials
            </button>
          </div>
        </div>
      </form>

      <div className="p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">People in this view</p>
            <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">{resultRange(result)}</p>
            {activeFilters.length > 0 ? (
              <p className="mt-1 max-w-4xl text-xs font-bold leading-5 text-slate-600">
                Active filters: {activeFilters.join(", ")}
              </p>
            ) : (
              <p className="mt-1 text-sm font-semibold text-slate-600">
                Federal, state, county, city, and school-board profiles are included.
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
            <span className={`h-2.5 w-2.5 rounded-full ${result.activeFilterCount > 0 ? "bg-blue-600" : "bg-emerald-500"}`} />
            <p className="text-xs font-black uppercase tracking-wide text-slate-600">
              {result.activeFilterCount > 0 ? `${result.activeFilterCount} active filter${result.activeFilterCount === 1 ? "" : "s"}` : "All profiles"}
            </p>
          </div>
        </div>

        {result.rows.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {result.rows.map((row) => (
                <OfficialSearchCard key={row.official.id} row={row} />
              ))}
            </div>
            <Pagination result={result} />
          </>
        ) : (
          <OfficialEmptyState params={params} />
        )}
      </div>
    </section>
  );
}

function MetricPill({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-2xl font-black tracking-tight text-slate-950">{formatNumber(value)}</p>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
    </div>
  );
}

function SearchSelect({
  label,
  name,
  value,
  emptyLabel,
  options,
  showCounts = true,
}: {
  label: string;
  name: string;
  value: string;
  emptyLabel: string;
  options: OfficialFacetOption[];
  showCounts?: boolean;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-[11px] font-black uppercase tracking-wide text-slate-600">{label}</span>
      <select
        name={name}
        defaultValue={formSelectValue(value)}
        className="mt-1 w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-3.5 text-sm font-black text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={`${name}-${option.value}`} value={option.value}>
            {showCounts ? optionLabel(option) : option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckboxFilter({ name, label, checked }: { name: string; label: string; checked: boolean }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:border-blue-300 hover:bg-blue-50">
      <input
        type="checkbox"
        name={name}
        value="1"
        defaultChecked={checked}
        className="h-4 w-4 rounded border-slate-300 text-blue-700 accent-blue-700"
      />
      {label}
    </label>
  );
}

function OfficialSearchCard({ row }: { row: OfficialSearchRow }) {
  const officialPath = `/officials/${row.official.id}`;
  const profileStatus = row.profileCompleteness >= 100 ? "Profile built" : `${row.profileCompleteness}% built`;
  const sourceStatus = row.missingSources ? "Sources needed" : `${formatNumber(row.sourceCount)} public sources`;

  return (
    <article className="group overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.09)] transition duration-500 hover:-translate-y-1.5 hover:border-blue-300 hover:shadow-[0_22px_55px_rgba(15,23,42,0.16)] motion-reduce:transform-none motion-reduce:transition-none">
      <Link href={officialPath} className="relative block aspect-[16/11] overflow-hidden bg-gradient-to-br from-slate-200 to-slate-400">
        <OfficialPhotoImage
          official={row.official}
          sizes="(min-width: 1280px) 30vw, (min-width: 768px) 48vw, 100vw"
          className="object-cover object-top transition duration-700 ease-out group-hover:scale-[1.055] motion-reduce:transition-none"
          fallbackClassName="grid h-full w-full place-items-center bg-gradient-to-br from-slate-200 via-slate-100 to-blue-100 text-6xl font-black text-slate-400"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/5 to-transparent" />
        <div className="absolute left-4 top-4">
          <PartyBadge party={row.official.party} />
        </div>
        <div className="absolute right-4 top-4">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide shadow-lg backdrop-blur-md ${
            row.missingSources
              ? "border-amber-200/70 bg-amber-50/90 text-amber-900"
              : "border-emerald-200/70 bg-emerald-50/90 text-emerald-800"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${row.missingSources ? "bg-amber-500" : "bg-emerald-500"}`} />
            {row.missingSources ? "Research open" : "Source linked"}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">
            {row.state || row.official.jurisdiction} · {levelLabels[row.official.level]}
          </p>
          <h3 className="mt-1 text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">{row.official.name}</h3>
          <p className="mt-1 line-clamp-1 text-sm font-bold text-slate-200">{row.official.position}</p>
        </div>
      </Link>

      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
          <span className="rounded-full bg-slate-100 px-2.5 py-1">{row.officeTypeLabel}</span>
          {row.official.district ? <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-800">District {row.official.district}</span> : null}
          {row.countyValues[0] ? <span className="truncate rounded-full bg-amber-50 px-2.5 py-1 text-amber-900">{row.countyValues[0]}</span> : null}
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between gap-3 text-[11px] font-black uppercase tracking-[0.12em]">
            <span className="text-slate-500">Profile buildout</span>
            <span className="text-slate-800">{profileStatus}</span>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label={`${row.official.name} profile buildout`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(100, row.profileCompleteness)}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-600 via-amber-400 to-blue-600 transition-[width] duration-700 motion-reduce:transition-none"
              style={{ width: `${Math.min(100, row.profileCompleteness)}%` }}
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 divide-x divide-slate-200 border-y border-slate-200 py-3">
          <RecordSignal icon="source" value={sourceStatus} label="Sources" />
          <RecordSignal icon="vote" value={row.hasVotingData ? formatNumber(row.voteCount) : "Open"} label="Votes" />
          <RecordSignal icon="funding" value={row.hasFundingData ? row.fundingCycle ?? "Loaded" : "Open"} label="Funding" />
        </div>

        <div className="mt-4 flex min-h-5 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-500">
          {row.redFlagCount > 0 ? (
            <span className="text-red-700">{row.redFlagCount} review note{row.redFlagCount === 1 ? "" : "s"}</span>
          ) : (
            <span>No open review note</span>
          )}
          {row.lastUpdated ? <span>Updated {row.lastUpdated}</span> : <span>Update date pending</span>}
        </div>

        <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
          <Link
            href={officialPath}
            className="inline-flex items-center justify-between rounded-xl border border-blue-700 bg-blue-700 px-4 py-3 text-sm font-black text-white transition hover:border-blue-800 hover:bg-blue-800"
          >
            Explore the record <span aria-hidden="true" className="text-lg">→</span>
          </Link>
          <Link
            href={`/dashboard?watch=${encodeURIComponent(officialPath)}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-3 text-xs font-black text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800"
            aria-label={`Watch ${row.official.name}`}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2">
              <path d="M12 21s-7-4.4-7-11a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 6.6-7 11-7 11Z" />
            </svg>
            Watch
          </Link>
        </div>

        <p className="mt-3 text-center text-[11px] font-bold text-slate-500">
          See something missing?{" "}
          <Link href={`/submit-source?target=${encodeURIComponent(row.official.id)}`} className="text-blue-700 underline decoration-blue-200 underline-offset-2 hover:text-red-700">
            Add a public source
          </Link>
        </p>
      </div>
    </article>
  );
}

function RecordSignal({ icon, value, label }: { icon: "source" | "vote" | "funding"; value: string; label: string }) {
  const paths = {
    source: <path d="M8 12h8M8 8h8M8 16h5M6 3h9l3 3v15H6z" />,
    vote: <path d="M7 3h10v5l3 3v10H4V11l3-3V3Zm-3 10h16M9 7h6" />,
    funding: <path d="M12 3v18m4-14.5c-.8-1-2.1-1.5-4-1.5-2.2 0-4 1.2-4 3s1.5 2.7 4 3c2.6.3 4 1.3 4 3s-1.8 3-4 3c-1.9 0-3.4-.6-4.3-1.8" />,
  };

  return (
    <div className="min-w-0 px-2 first:pl-0 last:pr-0 sm:px-3">
      <div className="flex items-center gap-1.5 text-slate-500">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 fill-none stroke-current" strokeWidth="1.8">
          {paths[icon]}
        </svg>
        <span className="truncate text-[9px] font-black uppercase tracking-[0.12em]">{label}</span>
      </div>
      <p className="mt-1 truncate text-xs font-black text-slate-950" title={value}>{value}</p>
    </div>
  );
}

function Pagination({ result }: { result: OfficialSearchResult }) {
  if (result.pageCount <= 1) return null;
  const pageNumbers = new Set<number>([1, result.pageCount, result.page - 1, result.page, result.page + 1]);
  const pages = Array.from(pageNumbers)
    .filter((page) => page >= 1 && page <= result.pageCount)
    .sort((a, b) => a - b);

  return (
    <nav className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between" aria-label="Officials pagination">
      <p className="text-sm font-bold text-slate-600">
        Page {formatNumber(result.page)} of {formatNumber(result.pageCount)}
      </p>
      <div className="flex flex-wrap gap-2">
        {result.page > 1 ? (
          <Link
            href={officialSearchQuery(result.params, { page: result.page - 1 })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800 hover:border-blue-300 hover:bg-blue-50"
          >
            Previous
          </Link>
        ) : (
          <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-black text-slate-400">
            Previous
          </span>
        )}
        {pages.map((page) => (
          <Link
            key={page}
            href={officialSearchQuery(result.params, { page })}
            aria-current={page === result.page ? "page" : undefined}
            className={`rounded-lg border px-3 py-2 text-xs font-black ${
              page === result.page
                ? "border-blue-700 bg-blue-700 text-white"
                : "border-slate-300 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50"
            }`}
          >
            {page}
          </Link>
        ))}
        {result.page < result.pageCount ? (
          <Link
            href={officialSearchQuery(result.params, { page: result.page + 1 })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800 hover:border-blue-300 hover:bg-blue-50"
          >
            Next
          </Link>
        ) : (
          <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-black text-slate-400">
            Next
          </span>
        )}
      </div>
    </nav>
  );
}

function OfficialEmptyState({ params }: { params: OfficialSearchParams }) {
  const packetHref = params.search
    ? `/dashboard?sourcePacket=${encodeURIComponent(params.search)}`
    : "/dashboard#source-packet";

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">No public profile match</p>
      <h3 className="mt-1 text-2xl font-black text-amber-950">
        This filter is too tight, or the official still needs a profile file.
      </h3>
      <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-amber-900">
        Clear a filter first. If the official still is not here, send RepWatchr one public source, request a brief, or
        build a packet that names the office, jurisdiction, source link, and question that needs review.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/submit-source"
          className="rounded-xl border border-amber-300 bg-white px-4 py-3 text-center text-sm font-black text-amber-900 shadow-sm hover:border-amber-400"
        >
          Submit source
        </Link>
        <Link
          href="/services/official-record-brief"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-black text-red-800 shadow-sm hover:bg-white"
        >
          Request official brief
        </Link>
        <Link
          href={packetHref}
          className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm font-black text-blue-800 shadow-sm hover:bg-white"
        >
          Build source packet
        </Link>
        <Link
          href="/dashboard?watch=official"
          className="rounded-xl border border-slate-300 bg-slate-950 px-4 py-3 text-center text-sm font-black text-white shadow-sm hover:bg-slate-800"
        >
          Watch this official
        </Link>
      </div>
    </div>
  );
}
