import Link from "next/link";
import type { GovernmentLevel, Party } from "@/types";
import PartyBadge from "@/components/officials/PartyBadge";
import LetterGradeBadge from "@/components/scores/LetterGradeBadge";
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

function gradeLabel(row: OfficialSearchRow) {
  if (row.letterGrade && typeof row.score === "number") return `${row.letterGrade} / ${row.score}`;
  if (typeof row.score === "number") return String(row.score);
  return "Unscored";
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
  if (params.hasRedFlags) items.push("has red flags");
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
    <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-950 p-4 text-white sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">
              Official discovery
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
              Search, filter, and sort the loaded public profiles.
            </h2>
            <p className="mt-1 max-w-4xl text-sm font-semibold leading-6 text-slate-200">
              Search runs on the server and returns one page at a time. Use it to find score gaps, missing source lanes,
              funding records, voting records, watched officials, and profiles that need citizen receipts.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <MetricPill label="Profiles" value={result.stats.totalProfiles} />
            <MetricPill label="Votes loaded" value={result.stats.voteLoadedProfiles} />
            <MetricPill label="Missing source" value={result.stats.missingSourceProfiles} />
          </div>
        </div>
      </div>

      <form action="/officials" method="get" className="border-b border-slate-200 bg-slate-50 p-3 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(240px,1.2fr)_repeat(3,minmax(160px,0.6fr))]">
          <label className="block min-w-0">
            <span className="text-[11px] font-black uppercase tracking-wide text-slate-600">Search</span>
            <input
              name="search"
              defaultValue={params.search}
              placeholder="Name, office, district, county, source lane..."
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
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
              .filter(([value]) => value !== "relevance")
              .map(([value, label]) => ({ value, label, count: 0 }))}
            showCounts={false}
          />
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
            label="Score range"
            name="scoreRange"
            value={params.scoreRange === "all" ? "" : params.scoreRange}
            emptyLabel="Any score"
            options={Object.entries(scoreRangeLabels)
              .filter(([value]) => value !== "all")
              .map(([value, label]) => ({ value, label, count: 0 }))}
            showCounts={false}
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
            label="Completeness"
            name="completeness"
            value={params.completeness === "all" ? "" : params.completeness}
            emptyLabel="Any completeness"
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

        <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            <CheckboxFilter name="redFlags" label="Has red flags" checked={params.hasRedFlags} />
            <CheckboxFilter name="funding" label="Has funding data" checked={params.hasFundingData} />
            <CheckboxFilter name="voting" label="Has voting data" checked={params.hasVotingData} />
            <CheckboxFilter name="missingSources" label="Missing sources" checked={params.missingSources} />
            <CheckboxFilter name="recent" label="Recently updated" checked={params.recentlyUpdated} />
            <CheckboxFilter name="watched" label="Watched by members" checked={params.watchedByMembers} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/officials"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-800 shadow-sm transition hover:border-red-300 hover:bg-white"
            >
              Clear filters
            </Link>
            <button
              type="submit"
              className="rounded-xl border border-blue-700 bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:border-blue-800 hover:bg-blue-800"
            >
              Search officials
            </button>
          </div>
        </div>
      </form>

      <div className="p-3 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-red-700">Results</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{resultRange(result)}</p>
            {activeFilters.length > 0 ? (
              <p className="mt-1 max-w-4xl text-xs font-bold leading-5 text-slate-600">
                Active filters: {activeFilters.join(", ")}
              </p>
            ) : (
              <p className="mt-1 text-xs font-bold text-slate-600">
                No filters active. Federal, state, county, city, and school-board profiles are all included.
              </p>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">Filter count</p>
            <p className="text-xl font-black text-slate-950">{result.activeFilterCount}</p>
          </div>
        </div>

        {result.rows.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
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
    <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-2">
      <p className="text-xl font-black">{formatNumber(value)}</p>
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-300">{label}</p>
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
        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-black text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
    <label className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800 shadow-sm">
      <input
        type="checkbox"
        name={name}
        value="1"
        defaultChecked={checked}
        className="h-4 w-4 rounded border-slate-300 text-blue-700"
      />
      {label}
    </label>
  );
}

function OfficialSearchCard({ row }: { row: OfficialSearchRow }) {
  const officialPath = `/officials/${row.official.id}`;
  const profileStatus = row.profileCompleteness >= 100 ? "Complete" : `${row.profileCompleteness}% complete`;
  const needsSourceTone = row.missingSources ? "border-amber-300 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-800";

  return (
    <article className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
      <div className="h-1 bg-[linear-gradient(90deg,#c1121f_0%,#c1121f_34%,#f8fafc_34%,#f8fafc_66%,#1d4ed8_66%,#1d4ed8_100%)]" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <Link href={officialPath} className="flex min-w-0 items-center gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-300 bg-slate-100">
              <OfficialPhotoImage official={row.official} sizes="128px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-black text-slate-950 hover:text-blue-800">{row.official.name}</h3>
              <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-600">{row.official.position}</p>
            </div>
          </Link>
          {row.letterGrade ? (
            <LetterGradeBadge grade={row.letterGrade} score={row.score ?? undefined} size="md" />
          ) : (
            <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
              No grade
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <PartyBadge party={row.official.party} />
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">
            {row.state || "State needed"}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">
            {levelLabels[row.official.level]}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">
            {row.officeTypeLabel}
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-2">
          <DataCell label="Score" value={gradeLabel(row)} />
          <DataCell label="Sources" value={formatNumber(row.sourceCount)} />
          <DataCell label="Votes" value={row.hasVotingData ? formatNumber(row.voteCount) : "Needed"} />
          <DataCell label="Funding" value={row.hasFundingData ? row.fundingCycle ?? "Loaded" : "Needed"} />
          <DataCell label="Views" value={formatNumber(row.viewCount)} />
          <DataCell label="Watches" value={formatNumber(row.watchCount)} />
        </dl>

        <div className="mt-3 grid gap-2">
          <div className={`rounded-lg border px-3 py-2 text-xs font-black ${needsSourceTone}`}>
            {row.missingSources ? "Missing source work" : "Source-linked"}
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">
            {profileStatus}
            {row.redFlagCount > 0 ? ` | ${row.redFlagCount} red flag${row.redFlagCount === 1 ? "" : "s"}` : ""}
            {row.lastUpdated ? ` | updated ${row.lastUpdated}` : ""}
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Link
            href={officialPath}
            className="rounded-lg border border-blue-700 bg-blue-700 px-3 py-2 text-center text-xs font-black text-white transition hover:bg-blue-800"
          >
            View profile
          </Link>
          <Link
            href={`/dashboard?watch=${encodeURIComponent(officialPath)}`}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-xs font-black text-slate-800 transition hover:border-blue-300 hover:bg-blue-50"
          >
            Watch this official
          </Link>
          <Link
            href={`/submit-source?target=${encodeURIComponent(row.official.id)}`}
            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-center text-xs font-black text-amber-900 transition hover:bg-white"
          >
            Submit source
          </Link>
          <Link
            href={`/services/official-record-brief?official=${encodeURIComponent(row.official.id)}`}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-black text-red-800 transition hover:bg-white"
          >
            Request brief
          </Link>
        </div>
      </div>
    </article>
  );
}

function DataCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <dt className="text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 truncate text-sm font-black text-slate-950">{value}</dd>
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
