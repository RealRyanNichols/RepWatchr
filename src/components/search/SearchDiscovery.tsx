"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookmarkCheck,
  BookmarkPlus,
  Building2,
  Filter,
  Landmark,
  Map,
  Search,
  Shield,
  SlidersHorizontal,
} from "lucide-react";
import WatchButton from "@/components/civic/WatchButton";
import { getOrCreateAnonymousId, getOrCreateSessionId, trackEvent } from "@/lib/analytics-client";
import type {
  SearchDiscoveryFilters,
  SearchDiscoveryResponse,
  SearchDiscoveryResult,
  SearchEntityType,
  SearchSort,
} from "@/lib/search-discovery";
import type { CivicWatchEntityType } from "@/lib/civic-actions";

type SearchPageProps = {
  initialQuery?: string;
  initialFilters?: SearchDiscoveryFilters;
  initialSort?: SearchSort;
  initialPage?: number;
};

const quickChips = [
  { label: "Texas", query: "Texas", filters: { state: "TX" } },
  { label: "Congress", query: "Congress", filters: { officeLevel: "Federal" } },
  { label: "Sheriffs", query: "Sheriff", filters: { officeType: "sheriff" } },
  { label: "Judges", query: "Judge", filters: { entityTypes: ["judge"] as SearchEntityType[] } },
  { label: "School Boards", query: "school board", filters: { entityTypes: ["school_board"] as SearchEntityType[] } },
  { label: "Campaign Finance", query: "campaign finance", filters: { hasFunding: true } },
  { label: "Votes", query: "votes", filters: { hasVotes: true } },
  { label: "Agencies", query: "agency", filters: { entityTypes: ["agency"] as SearchEntityType[] } },
];

const entityTypeOptions: Array<{ value: SearchEntityType; label: string }> = [
  { value: "public_official", label: "Public officials" },
  { value: "elected_official", label: "Elected officials" },
  { value: "candidate", label: "Candidates" },
  { value: "law_enforcement_official", label: "Law enforcement" },
  { value: "judge", label: "Judges" },
  { value: "prosecutor", label: "Prosecutors" },
  { value: "agency", label: "Agencies" },
  { value: "public_body", label: "Public bodies" },
  { value: "school_board", label: "School boards" },
  { value: "jurisdiction", label: "Jurisdictions" },
  { value: "race", label: "Races" },
  { value: "vote", label: "Votes" },
  { value: "funding_record", label: "Funding" },
  { value: "story", label: "Stories" },
  { value: "source_url", label: "Sources" },
  { value: "tool_page", label: "Tools" },
  { value: "package_page", label: "Packages" },
];

const sortOptions: Array<{ value: SearchSort; label: string }> = [
  { value: "relevance", label: "Relevance" },
  { value: "most_viewed", label: "Most viewed" },
  { value: "most_watched", label: "Most watched" },
  { value: "most_sourced", label: "Most sourced" },
  { value: "recently_updated", label: "Recently updated" },
  { value: "source_gaps", label: "Missing source priority" },
  { value: "completeness", label: "Completeness" },
  { value: "alphabetical", label: "Alphabetical" },
];

function labelForEntityType(type: string) {
  return entityTypeOptions.find((option) => option.value === type)?.label ?? type.replace(/_/g, " ");
}

function watchTypeForResult(result: SearchDiscoveryResult): CivicWatchEntityType {
  if (result.entityType === "race") return "race";
  if (result.entityType === "school_board" || result.entityType === "public_body") return "school_board";
  if (result.entityType === "jurisdiction") {
    if (result.county) return "county";
    if (result.city) return "city";
    return "state";
  }
  if (result.entityType === "agency") return "agency";
  if (result.entityType === "judge") return "judge";
  if (result.entityType === "vote") return "vote";
  if (result.entityType === "funding_record") return "donor";
  if (result.entityType === "story") return "story";
  if (result.entityType === "source_url") return "source";
  if (result.entityType === "public_question") return "issue";
  return "official";
}

function searchParamsFor(query: string, filters: SearchDiscoveryFilters, sort: SearchSort, page: number) {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  filters.entityTypes?.forEach((type) => params.append("entityType", type));
  if (filters.state) params.set("state", filters.state);
  if (filters.county) params.set("county", filters.county);
  if (filters.city) params.set("city", filters.city);
  if (filters.officeLevel) params.set("officeLevel", filters.officeLevel);
  if (filters.officeType) params.set("officeType", filters.officeType);
  if (filters.sourceCountMin !== undefined) params.set("sourceCountMin", String(filters.sourceCountMin));
  if (filters.completenessMin !== undefined) params.set("completenessMin", String(filters.completenessMin));
  if (filters.hasVotes) params.set("hasVotes", "true");
  if (filters.hasFunding) params.set("hasFunding", "true");
  if (filters.hasSourceGaps) params.set("hasSourceGaps", "true");
  if (filters.hasCorrectionRequested) params.set("hasCorrectionRequested", "true");
  if (filters.recentlyUpdated) params.set("recentlyUpdated", "true");
  if (filters.popular) params.set("popular", "true");
  if (filters.watched) params.set("watched", "true");
  if (filters.publicBodyType) params.set("publicBodyType", filters.publicBodyType);
  if (sort !== "relevance") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  params.set("limit", "18");
  return params;
}

export function SearchChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
        active
          ? "border-red-300 bg-red-700 text-white shadow-lg shadow-red-950/20"
          : "border-white/20 bg-white/10 text-white hover:border-amber-200 hover:bg-white/20"
      }`}
    >
      {label}
    </button>
  );
}

export function SearchInput({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="relative rounded-[1.6rem] border border-white/15 bg-white/10 p-2 shadow-2xl shadow-black/25 backdrop-blur"
    >
      <label htmlFor="repwatchr-discovery-search" className="sr-only">
        Search RepWatchr
      </label>
      <Search className="pointer-events-none absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-950/60 sm:left-7" />
      <input
        id="repwatchr-discovery-search"
        type="search"
        value={value}
        onFocus={() => void trackEvent("search_query_started", { surface: "search_page" }, { route: "/search" })}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search officials, counties, agencies, races, votes, funding, school boards, stories, or source URLs..."
        className="min-h-16 w-full rounded-[1.2rem] border border-white/70 bg-white py-4 pl-12 pr-32 text-base font-black text-slate-950 shadow-inner shadow-blue-950/10 placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-amber-300/40 sm:pl-14"
      />
      <button
        type="submit"
        className="absolute right-4 top-1/2 inline-flex -translate-y-1/2 items-center gap-2 rounded-2xl bg-blue-900 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/20 transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
      >
        Search
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}

export function SearchFilters({
  filters,
  setFilters,
  sort,
  setSort,
}: {
  filters: SearchDiscoveryFilters;
  setFilters: (filters: SearchDiscoveryFilters) => void;
  sort: SearchSort;
  setSort: (sort: SearchSort) => void;
}) {
  function toggleEntityType(type: SearchEntityType) {
    const current = new Set(filters.entityTypes ?? []);
    if (current.has(type)) current.delete(type);
    else current.add(type);
    const next = { ...filters, entityTypes: Array.from(current) };
    setFilters(next);
    void trackEvent("search_filter_used", { filter: "entity_type", value: type }, { route: "/search" });
  }

  function toggleFlag(key: keyof SearchDiscoveryFilters, label: string) {
    const next = { ...filters, [key]: !filters[key] };
    setFilters(next);
    void trackEvent("search_filter_used", { filter: key, value: Boolean(next[key]), label }, { route: "/search" });
  }

  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-blue-950/10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Filters</p>
          <h2 className="mt-1 text-xl font-black text-blue-950">Narrow the record</h2>
        </div>
        <SlidersHorizontal className="h-5 w-5 text-blue-900" />
      </div>

      <div className="mt-4 grid gap-3">
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Sort
          <select
            value={sort}
            onChange={(event) => {
              const next = event.target.value as SearchSort;
              setSort(next);
              void trackEvent("search_sort_changed", { sort: next }, { route: "/search" });
            }}
            className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 font-bold text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <input
            value={filters.state ?? ""}
            onChange={(event) => setFilters({ ...filters, state: event.target.value })}
            placeholder="State"
            className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-950 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <input
            value={filters.county ?? ""}
            onChange={(event) => setFilters({ ...filters, county: event.target.value })}
            placeholder="County"
            className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-950 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <input
            value={filters.city ?? ""}
            onChange={(event) => setFilters({ ...filters, city: event.target.value })}
            placeholder="City"
            className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-950 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <input
            value={filters.officeType ?? ""}
            onChange={(event) => setFilters({ ...filters, officeType: event.target.value })}
            placeholder="Office type"
            className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-950 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Entity types</p>
          <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto pr-1">
            {entityTypeOptions.map((option) => {
              const active = filters.entityTypes?.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleEntityType(option.value)}
                  className={`rounded-full border px-3 py-2 text-xs font-black transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                    active
                      ? "border-blue-300 bg-blue-900 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200 hover:bg-blue-50"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-2">
          {[
            ["hasVotes", "Has votes"],
            ["hasFunding", "Has funding"],
            ["hasSourceGaps", "Missing sources"],
            ["hasCorrectionRequested", "Correction requested"],
            ["recentlyUpdated", "Recently updated"],
            ["popular", "Popular"],
            ["watched", "Watched"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700">
              {label}
              <input
                type="checkbox"
                checked={Boolean(filters[key as keyof SearchDiscoveryFilters])}
                onChange={() => toggleFlag(key as keyof SearchDiscoveryFilters, label)}
                className="h-4 w-4 accent-blue-900"
              />
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}

export function SaveSearchButton({
  query,
  filters,
  disabled,
}: {
  query: string;
  filters: SearchDiscoveryFilters;
  disabled?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "login" | "error">("idle");

  async function save() {
    if (!query.trim()) return;
    setStatus("saving");
    try {
      const response = await fetch("/api/search/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, name: query, filters, alertEnabled: false }),
      });
      if (response.status === 401) {
        setStatus("login");
      } else if (response.ok) {
        setStatus("saved");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
    window.setTimeout(() => setStatus("idle"), 3200);
  }

  return (
    <div>
      <button
        type="button"
        onClick={save}
        disabled={disabled || !query.trim() || status === "saving"}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-sm font-black text-blue-950 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        {status === "saved" ? <BookmarkCheck className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
        {status === "saving" ? "Saving" : status === "saved" ? "Saved" : "Save search"}
      </button>
      {status === "login" ? (
        <p className="mt-2 text-xs font-bold text-slate-600">
          Create a free account or log in to save this search to your dashboard.
        </p>
      ) : null}
      {status === "error" ? (
        <p className="mt-2 text-xs font-bold text-red-700">
          Search was not saved. You can still copy the URL or try again.
        </p>
      ) : null}
    </div>
  );
}

export function SearchResultCard({ result }: { result: SearchDiscoveryResult }) {
  const sourceHref = `/submit-source?targetType=${encodeURIComponent(result.entityType)}&targetName=${encodeURIComponent(result.title)}`;
  return (
    <article className="group rounded-3xl border border-slate-200 bg-white p-4 shadow-lg shadow-blue-950/10 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-950/15">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.12em] text-blue-900">
              {labelForEntityType(result.entityType)}
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.12em] text-emerald-800">
              {result.trustLabel}
            </span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.12em] text-amber-900">
              {result.completenessLabel}
            </span>
          </div>
          <h3 className="mt-3 text-2xl font-black tracking-tight text-blue-950">
            <Link
              href={result.url}
              onClick={() => void trackEvent("search_result_clicked", {
                entity_type: result.entityType,
                entity_id: result.entityId,
                title: result.title,
                url: result.url,
              }, { route: "/search" })}
              className="focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {result.title}
            </Link>
          </h3>
          {result.subtitle ? <p className="mt-1 text-sm font-black uppercase tracking-[0.14em] text-red-700">{result.subtitle}</p> : null}
          {result.body ? <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-slate-600">{result.body}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2 text-[0.72rem] font-black uppercase tracking-[0.12em] text-slate-500">
            {result.officeLevel ? <span>{result.officeLevel}</span> : null}
            {result.officeType ? <span>{result.officeType}</span> : null}
            {result.state ? <span>{result.state}</span> : null}
            {result.county ? <span>{result.county}</span> : null}
            {result.city ? <span>{result.city}</span> : null}
            <span>{result.sourceCount} sources</span>
            <span>{result.watchCount} watched</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:max-w-48 sm:flex-col">
          <WatchButton
            entityType={watchTypeForResult(result)}
            entityId={result.entityId}
            entityName={result.title}
            entitySlug={result.slug ?? result.url}
            sourceRoute="/search"
            compact
          />
          <Link
            href={sourceHref}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-black uppercase tracking-wide text-amber-950 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-amber-200"
          >
            Submit source
          </Link>
          <Link
            href={result.url}
            onClick={() => void trackEvent("search_result_clicked", { entity_type: result.entityType, entity_id: result.entityId, action: "open_profile" }, { route: "/search" })}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-900 px-3 text-xs font-black uppercase tracking-wide text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            Open
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function NoSearchResultsCTA({ query, highIntent }: { query: string; highIntent?: boolean }) {
  return (
    <section className="rounded-3xl border border-amber-200 bg-[linear-gradient(135deg,#fff7ed,#eff6ff)] p-6 shadow-xl shadow-amber-950/10">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">No result yet</p>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-blue-950">Turn this gap into a record.</h2>
      <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-600">
        RepWatchr does not fake results. If this official, agency, race, vote, or source is missing, submit the public link and the review queue can build the lane.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={`/submit-source?summary=${encodeURIComponent(query)}`}
          className="rounded-xl bg-blue-900 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/20 transition hover:bg-red-700"
        >
          Submit missing source
        </Link>
        <Link
          href={`/sources/submit?targetName=${encodeURIComponent(query)}&sourceType=missing_official`}
          className="rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-950 transition hover:border-red-200 hover:text-red-700"
        >
          Report missing official
        </Link>
        {highIntent ? (
          <Link
            href={`/beta-access?package=quick-record-check&useCase=${encodeURIComponent(query)}`}
            className="rounded-xl border border-amber-300 bg-amber-300 px-5 py-3 text-sm font-black text-blue-950 transition hover:bg-amber-200"
          >
            Request record check
          </Link>
        ) : null}
      </div>
    </section>
  );
}

export default function SearchPage({
  initialQuery = "",
  initialFilters = {},
  initialSort = "relevance",
  initialPage = 1,
}: SearchPageProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchDiscoveryFilters>(initialFilters);
  const [sort, setSort] = useState<SearchSort>(initialSort);
  const [page, setPage] = useState(initialPage);
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [data, setData] = useState<SearchDiscoveryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const params = useMemo(() => searchParamsFor(activeQuery, filters, sort, page), [activeQuery, filters, page, sort]);

  useEffect(() => {
    void trackEvent("search_page_open", { initial_query: initialQuery }, { route: "/search" });
  }, [initialQuery]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    params.set("anonymousId", getOrCreateAnonymousId());
    params.set("sessionId", getOrCreateSessionId());
    params.set("sourceSurface", "search_page");
    params.set("route", "/search");

    fetch(`/api/search?${params.toString()}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((payload: SearchDiscoveryResponse | null) => {
        setData(payload);
        if (payload && payload.total === 0 && activeQuery.trim()) {
          void trackEvent("search_no_results", { query: activeQuery, filters: JSON.stringify(filters).slice(0, 500) }, { route: "/search" });
        }
      })
      .catch((error) => {
        if ((error as Error).name !== "AbortError") setData(null);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [activeQuery, filters, params, sort]);

  function submit(nextQuery = query, filterOverride = filters) {
    const clean = nextQuery.trim();
    setActiveQuery(clean);
    setQuery(clean);
    setPage(1);
    const nextParams = searchParamsFor(clean, filterOverride, sort, 1);
    router.replace(`/search?${nextParams.toString()}`, { scroll: false });
    void trackEvent("search_query_submitted", { query: clean, filters: JSON.stringify(filterOverride).slice(0, 500) }, { route: "/search" });
  }

  function applyChip(chip: (typeof quickChips)[number]) {
    const nextFilters = { ...filters, ...chip.filters };
    setFilters(nextFilters);
    submit(chip.query, nextFilters);
  }

  const activeFiltersCount =
    (filters.entityTypes?.length ?? 0) +
    [filters.state, filters.county, filters.city, filters.officeLevel, filters.officeType, filters.publicBodyType].filter(Boolean).length +
    [filters.hasVotes, filters.hasFunding, filters.hasSourceGaps, filters.hasCorrectionRequested, filters.recentlyUpdated, filters.popular, filters.watched].filter(Boolean).length;

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-[#06172f] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(220,38,38,0.35),transparent_32%),radial-gradient(circle_at_78%_10%,rgba(37,99,235,0.38),transparent_35%),linear-gradient(135deg,#06172f,#0f2f5f_52%,#050b18)]" />
        <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.26em] text-amber-300">RepWatchr Discovery</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
                Find the public record lane fast.
              </h1>
              <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-blue-100">
                Search officials, offices, agencies, school boards, races, votes, funding, stories, sources, and public questions from one command surface.
              </p>
            </div>
            <div className="rounded-3xl border border-white/15 bg-white/10 p-4 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="grid grid-cols-3 gap-3">
                {[
                  ["Indexed lanes", data?.total ?? 0],
                  ["Source gaps", data?.results.filter((result) => result.sourceGap).length ?? 0],
                  ["Data source", data?.dataSource ?? "loading"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-3">
                    <p className="text-[0.66rem] font-black uppercase tracking-[0.16em] text-blue-100">{label}</p>
                    <p className="mt-2 text-2xl font-black text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <SearchInput value={query} onChange={setQuery} onSubmit={() => submit()} />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {quickChips.map((chip) => (
              <SearchChip key={chip.label} label={chip.label} onClick={() => applyChip(chip)} />
            ))}
            <Link
              href="/sources/submit?sourceType=missing_official"
              className="rounded-full border border-amber-300 bg-amber-300 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-blue-950 transition hover:bg-amber-200"
            >
              Submit Missing Official
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:px-8">
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setFilterOpen((current) => !current)}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-sm font-black text-blue-950 shadow-sm"
          >
            <Filter className="h-4 w-4" />
            Filters {activeFiltersCount ? `(${activeFiltersCount})` : ""}
          </button>
        </div>

        <div className={`${filterOpen ? "block" : "hidden"} lg:block`}>
          <SearchFilters filters={filters} setFilters={(next) => { setFilters(next); setPage(1); }} sort={sort} setSort={(next) => { setSort(next); setPage(1); }} />
        </div>

        <div className="min-w-0 space-y-5">
          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-blue-950/10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Results</p>
              <p className="mt-1 text-sm font-bold text-slate-600">
                {loading ? "Searching records..." : `${data?.total ?? 0} public lanes matched`}
                {activeQuery ? ` for "${activeQuery}"` : ""}.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SaveSearchButton query={activeQuery} filters={filters} disabled={!activeQuery.trim()} />
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`rounded-lg px-3 py-2 text-xs font-black ${viewMode === "list" ? "bg-blue-900 text-white" : "text-slate-700"}`}
                >
                  List
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("map")}
                  className={`rounded-lg px-3 py-2 text-xs font-black ${viewMode === "map" ? "bg-blue-900 text-white" : "text-slate-700"}`}
                >
                  Map
                </button>
              </div>
            </div>
          </div>

          {viewMode === "map" ? (
            <div className="rounded-3xl border border-blue-200 bg-[linear-gradient(135deg,#eff6ff,#fff7ed)] p-8 shadow-xl shadow-blue-950/10">
              <Map className="h-10 w-10 text-blue-900" />
              <h2 className="mt-4 text-3xl font-black text-blue-950">Map mode is staged.</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
                This placeholder is intentional. RepWatchr will turn jurisdiction results into a map after the location data is complete enough to avoid misleading users.
              </p>
            </div>
          ) : loading && !data ? (
            <div className="rounded-3xl border border-blue-100 bg-white p-8 shadow-xl shadow-blue-950/10">
              <p className="text-2xl font-black text-blue-950">Searching the public record lanes...</p>
            </div>
          ) : data?.results.length ? (
            <div className="grid gap-4">
              {data.results.map((result) => (
                <SearchResultCard key={result.id} result={result} />
              ))}
            </div>
          ) : (
            <NoSearchResultsCTA query={activeQuery || query} highIntent={data?.highIntent} />
          )}

          {data && data.totalPages > 1 ? (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm font-black text-slate-600">
                Page {page} of {data.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(data.totalPages, current + 1))}
                disabled={page >= data.totalPages}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Landmark, title: "Public bodies", text: "Officials, agencies, boards, courts, and jurisdictions stay connected." },
              { icon: Shield, title: "Source-first", text: "Result labels show whether the lane is source-backed or still missing proof." },
              { icon: Building2, title: "Package signal", text: "High-intent searches can become review requests without turning search into ads." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <item.icon className="h-5 w-5 text-blue-900" />
                <h3 className="mt-3 text-lg font-black text-blue-950">{item.title}</h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
