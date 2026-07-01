"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight, BookmarkCheck, BookmarkPlus, Clock, Copy, Mic, Search, Share2, Sparkles, TrendingUp } from "lucide-react";
import { track } from "@vercel/analytics";
import { trackEvent } from "@/lib/analytics-client";
import { trackVisitorIntelligenceEvent } from "@/lib/visitor-intelligence-client";
import type { PredictiveSearchGroup, PredictiveSearchKind, PredictiveSearchResult } from "@/lib/predictive-search";

type PredictiveSearchBoxProps = {
  compact?: boolean;
  defaultQuery?: string;
  placeholder?: string;
  showVoice?: boolean;
  sourceSurface?: string;
  autoFocus?: boolean;
  focusEventName?: string;
  submitEventName?: string;
  eventMetadata?: Record<string, string | number | boolean | null>;
};

type SearchChip = {
  id?: string;
  query: string;
  label?: string;
  kind?: string;
  count?: number;
  href?: string;
  title?: string;
  scope?: string;
};

type PredictiveSearchApiResponse = {
  ok: boolean;
  query: string;
  total: number;
  groups: PredictiveSearchGroup[];
  suggestions: PredictiveSearchResult[];
  popularSearches: SearchChip[];
  trendingSearches: SearchChip[];
  savedSearches: SearchChip[];
};

type SpeechRecognitionConstructor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

const recentSearchStorageKey = "repwatchr:recent-searches";
const savedSearchStorageKey = "repwatchr:saved-searches";
const anonymousIdStorageKey = "repwatchr:anonymous-search-id";

const kindLabels: Record<PredictiveSearchKind, string> = {
  official: "Officials",
  board: "Boards",
  county: "Counties",
  agency: "Agencies",
  story: "Stories",
  issue: "Issues",
  vote: "Votes",
  funding: "Funding",
  campaign: "Campaigns",
  news: "News",
  suggestion: "Suggestions",
};

const kindStyles: Record<PredictiveSearchKind, string> = {
  official: "border-red-200 bg-red-50 text-red-800",
  board: "border-blue-200 bg-blue-50 text-blue-900",
  county: "border-emerald-200 bg-emerald-50 text-emerald-800",
  agency: "border-slate-200 bg-slate-50 text-slate-800",
  story: "border-amber-200 bg-amber-50 text-amber-900",
  issue: "border-purple-200 bg-purple-50 text-purple-800",
  vote: "border-indigo-200 bg-indigo-50 text-indigo-800",
  funding: "border-green-200 bg-green-50 text-green-800",
  campaign: "border-orange-200 bg-orange-50 text-orange-800",
  news: "border-sky-200 bg-sky-50 text-sky-800",
  suggestion: "border-gray-200 bg-white text-gray-800",
};

function readStoredChips(key: string): SearchChip[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed.slice(0, 12) : [];
  } catch {
    return [];
  }
}

function writeStoredChips(key: string, chips: SearchChip[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(chips.slice(0, 12)));
}

function getAnonymousId() {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(anonymousIdStorageKey);
  if (existing) return existing;
  const next =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `anon-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(anonymousIdStorageKey, next);
  return next;
}

function chipLabel(chip: SearchChip) {
  return chip.title || chip.label || chip.query;
}

function chipHref(chip: SearchChip) {
  return chip.href || `/search?q=${encodeURIComponent(chip.query)}`;
}

function uniqueChips(chips: SearchChip[]) {
  const seen = new Set<string>();
  return chips.filter((chip) => {
    const key = chip.query.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function PredictiveSearchBox({
  compact = false,
  defaultQuery = "",
  placeholder = "Search an official, board, county, agency, story, issue, vote, funder, campaign, or record...",
  showVoice = true,
  sourceSurface = "predictive_search",
  autoFocus = false,
  focusEventName,
  submitEventName,
  eventMetadata = {},
}: PredictiveSearchBoxProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PredictiveSearchApiResponse | null>(null);
  const [recentSearches, setRecentSearches] = useState<SearchChip[]>([]);
  const [localSavedSearches, setLocalSavedSearches] = useState<SearchChip[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "local">("idle");
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared">("idle");
  const router = useRouter();
  const pathname = usePathname();
  const searchId = useId();
  const inputId = `${searchId}-input`;
  const panelId = `${searchId}-panel`;

  const trimmedQuery = query.trim();
  const resultKinds = useMemo(
    () => data?.groups.flatMap((group) => group.results.length > 0 ? [group.kind] : []) ?? [],
    [data],
  );
  const savedSearches = uniqueChips([...(data?.savedSearches ?? []), ...localSavedSearches]);

  useEffect(() => {
    setRecentSearches(readStoredChips(recentSearchStorageKey));
    setLocalSavedSearches(readStoredChips(savedSearchStorageKey));
  }, []);

  useEffect(() => {
    setQuery(defaultQuery);
  }, [defaultQuery]);

  useEffect(() => {
    const controller = new AbortController();
    const delay = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search/predictive?q=${encodeURIComponent(trimmedQuery)}&limit=${compact ? 4 : 6}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const payload = await response.json() as PredictiveSearchApiResponse;
        setData(payload);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setData(null);
      } finally {
        setLoading(false);
      }
    }, trimmedQuery ? 180 : 40);

    return () => {
      controller.abort();
      window.clearTimeout(delay);
    };
  }, [compact, trimmedQuery]);

  function rememberSearch(nextQuery: string) {
    const clean = nextQuery.trim();
    if (!clean) return;
    const next = uniqueChips([{ query: clean, label: clean, kind: "recent" }, ...recentSearches]).slice(0, 8);
    setRecentSearches(next);
    writeStoredChips(recentSearchStorageKey, next);
  }

  function recordSearch(metadata: Record<string, string | number | boolean | null> = {}, selected?: PredictiveSearchResult | SearchChip) {
    const selectedQuery = selected && "query" in selected ? selected.query : trimmedQuery;
    const selectedKind = selected && "kind" in selected ? selected.kind : undefined;
    const selectedHref = selected ? ("href" in selected ? selected.href : undefined) : undefined;
    const activeQuery = selectedQuery || trimmedQuery;
    if (!activeQuery) return;

    track("predictive_search_used", {
      query: activeQuery,
      source_surface: sourceSurface,
      result_count: data?.total ?? 0,
      selected_kind: selectedKind ?? null,
    });
    trackVisitorIntelligenceEvent({
      eventType: selected ? "global_search_result_clicked" : "global_search_submitted",
      path: pathname,
      searchTerm: activeQuery,
      metadata: {
        source_surface: sourceSurface,
        result_count: data?.total ?? 0,
        selected_kind: selectedKind ?? null,
        ...metadata,
      },
    });

    void fetch("/api/search/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: activeQuery,
        anonymousId: getAnonymousId(),
        sessionId: window.sessionStorage.getItem("repwatchr:session-id") ?? undefined,
        sourceSurface,
        route: pathname,
        referrer: document.referrer,
        resultCount: data?.total ?? 0,
        resultTypes: resultKinds,
        selectedResultKind: selectedKind,
        selectedResultId: selected && "id" in selected ? selected.id : undefined,
        selectedResultHref: selectedHref,
        metadata,
      }),
    }).catch(() => undefined);
  }

  function submitSearch(nextQuery = trimmedQuery) {
    const clean = nextQuery.trim();
    if (!clean) return;
    rememberSearch(clean);
    if (submitEventName) {
      void trackEvent(submitEventName, {
        query: clean,
        source_surface: sourceSurface,
        ...eventMetadata,
      });
    }
    recordSearch({ action: "submit" });
    router.push(`/search?q=${encodeURIComponent(clean)}`);
  }

  async function saveSearch() {
    if (!trimmedQuery) return;
    const localSaved = uniqueChips([{ query: trimmedQuery, label: trimmedQuery, kind: "saved" }, ...localSavedSearches]).slice(0, 12);
    setLocalSavedSearches(localSaved);
    writeStoredChips(savedSearchStorageKey, localSaved);

    try {
      const response = await fetch("/api/search/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmedQuery, title: trimmedQuery, scope: "all" }),
      });
      setSaveStatus(response.ok ? "saved" : "local");
    } catch {
      setSaveStatus("local");
    }
    track("search_saved", { query: trimmedQuery, source_surface: sourceSurface });
    trackVisitorIntelligenceEvent({
      eventType: "saved_search_created",
      path: pathname,
      buttonLabel: "Save search",
      metadata: { query: trimmedQuery },
    });
    window.setTimeout(() => setSaveStatus("idle"), 2200);
  }

  async function shareSearch() {
    const clean = trimmedQuery || data?.popularSearches?.[0]?.query || "RepWatchr";
    const url = `${window.location.origin}/search?q=${encodeURIComponent(clean)}`;
    const text = `Search RepWatchr for public records on ${clean}. Search. Grade. Source. Share.`;

    const canNativeShare = typeof navigator.share === "function";

    if (canNativeShare) {
      await navigator.share({ title: `RepWatchr search: ${clean}`, text, url }).catch(() => undefined);
      setShareStatus("shared");
    } else {
      await navigator.clipboard?.writeText(url).catch(() => undefined);
      setShareStatus("copied");
    }

    track("search_shared", { query: clean, source_surface: sourceSurface });
    trackVisitorIntelligenceEvent({
      eventType: canNativeShare ? "native_share_clicked" : "share_snippet_copied",
      path: pathname,
      shareChannel: canNativeShare ? "native" : "copy_link",
      metadata: { query: clean },
    });
    window.setTimeout(() => setShareStatus("idle"), 2200);
  }

  function startVoice() {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ??
      (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setOpen(true);
      setQuery((current) => current || "Find my official");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setQuery(transcript);
      setOpen(true);
      submitSearch(transcript);
    };
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  }

  function handleChip(chip: SearchChip) {
    const nextQuery = chip.query;
    setQuery(nextQuery);
    rememberSearch(nextQuery);
    recordSearch({ action: "chip", chip_kind: chip.kind ?? null }, chip);
    router.push(chipHref(chip));
  }

  const emptyPanel = !trimmedQuery;
  const hasResults = Boolean(data?.groups?.length);

  return (
    <div className="relative w-full">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch();
        }}
        className={`rounded-2xl border border-blue-100 bg-white shadow-lg shadow-blue-950/10 ${compact ? "p-2" : "p-3"}`}
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor={inputId} className="sr-only">
            Search RepWatchr records
          </label>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-950/50" aria-hidden="true" />
            <input
              id={inputId}
              type="search"
              value={query}
              autoFocus={autoFocus}
              onFocus={() => {
                setOpen(true);
                if (focusEventName) {
                  void trackEvent(focusEventName, {
                    query: trimmedQuery || null,
                    source_surface: sourceSurface,
                    ...eventMetadata,
                  });
                }
              }}
              onBlur={() => window.setTimeout(() => setOpen(false), 180)}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
                setSaveStatus("idle");
                setShareStatus("idle");
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") setOpen(false);
              }}
              placeholder={placeholder}
              className="min-h-12 w-full rounded-xl border border-gray-200 bg-blue-50/70 py-3 pl-10 pr-4 text-sm font-semibold text-gray-950 placeholder:text-gray-500 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
              aria-expanded={open}
              aria-controls={panelId}
            />
          </div>
          <div className={`grid gap-2 sm:flex ${showVoice ? "grid-cols-4" : "grid-cols-3"}`}>
            {showVoice ? (
              <button
                type="button"
                onClick={startVoice}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 text-sm font-black text-amber-900 transition hover:-translate-y-0.5 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300 sm:min-w-16"
                aria-label="Start voice search"
              >
                <Mic className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{listening ? "Listening" : "Talk"}</span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={saveSearch}
              disabled={!trimmedQuery}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-3 text-sm font-black text-blue-950 transition hover:-translate-y-0.5 hover:border-blue-300 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
              aria-label="Save this search"
            >
              {saveStatus === "saved" || saveStatus === "local" ? <BookmarkCheck className="h-4 w-4" aria-hidden="true" /> : <BookmarkPlus className="h-4 w-4" aria-hidden="true" />}
              <span className="hidden lg:inline">{saveStatus === "saved" ? "Saved" : saveStatus === "local" ? "Saved local" : "Save"}</span>
            </button>
            <button
              type="button"
              onClick={shareSearch}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-3 text-sm font-black text-blue-950 transition hover:-translate-y-0.5 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              aria-label="Share this search"
            >
              {shareStatus === "copied" ? <Copy className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
              <span className="hidden lg:inline">{shareStatus === "copied" ? "Copied" : shareStatus === "shared" ? "Shared" : "Share"}</span>
            </button>
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 text-sm font-black text-white shadow-md shadow-blue-950/15 transition hover:-translate-y-0.5 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Ask
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </form>

      {open ? (
        <div
          id={panelId}
          className="absolute left-0 right-0 top-full z-50 mt-3 max-h-[min(78vh,740px)] overflow-y-auto rounded-3xl border border-blue-100 bg-white p-4 shadow-2xl shadow-blue-950/20"
          role="region"
          aria-label="Predictive search results"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div>
              <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-red-700">
                Predictive Search
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-600">
                {emptyPanel
                  ? "Start with a name, county, issue, vote, donor, race, or source."
                  : loading
                    ? "Checking the public record lanes..."
                    : `${data?.total ?? 0} source lanes matched.`}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-900">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Search. Grade. Source. Share.
            </span>
          </div>

          {emptyPanel ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <ChipSection icon={<Clock className="h-4 w-4" aria-hidden="true" />} title="Recent searches" chips={recentSearches} onPick={handleChip} emptyText="Your recent searches will show here." />
              <ChipSection icon={<BookmarkCheck className="h-4 w-4" aria-hidden="true" />} title="Saved searches" chips={savedSearches} onPick={handleChip} emptyText="Save a search to build your own watch lane." />
              <ChipSection icon={<Search className="h-4 w-4" aria-hidden="true" />} title="Popular searches" chips={data?.popularSearches ?? []} onPick={handleChip} />
              <ChipSection icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />} title="Trending searches" chips={data?.trendingSearches ?? []} onPick={handleChip} />
            </div>
          ) : loading && !data ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-lg font-black text-blue-950">Checking the public record lanes...</p>
              <p className="mt-1 text-sm font-semibold text-gray-600">
                Officials, boards, counties, agencies, votes, funding, campaigns, stories, and suggestions are loading.
              </p>
            </div>
          ) : hasResults ? (
            <div className="space-y-5">
              {data?.groups.map((group) => (
                <section key={group.kind}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">
                      {kindLabels[group.kind] ?? group.label}
                    </h3>
                    <span className={`rounded-full border px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-[0.12em] ${kindStyles[group.kind]}`}>
                      {group.results.length} shown
                    </span>
                  </div>
                  <div className="grid gap-2 lg:grid-cols-2">
                    {group.results.map((result) => (
                      <Link
                        key={result.id}
                        href={result.href}
                        onClick={() => {
                          rememberSearch(trimmedQuery);
                          recordSearch({ action: "open_result" }, result);
                        }}
                        className="group rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-slate-50 p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-950/10 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className={`rounded-full border px-2.5 py-1 text-[0.67rem] font-black uppercase tracking-[0.12em] ${kindStyles[result.kind]}`}>
                                {result.eyebrow}
                              </span>
                              {result.badge ? <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[0.67rem] font-black text-gray-600">{result.badge}</span> : null}
                            </div>
                            <p className="truncate text-base font-black text-blue-950">{result.title}</p>
                            <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-gray-600">{result.description}</p>
                            <div className="mt-2 flex flex-wrap gap-2 text-[0.72rem] font-black uppercase tracking-[0.12em] text-gray-500">
                              {result.jurisdiction ? <span>{result.jurisdiction}</span> : null}
                              {result.county ? <span>{result.county}</span> : null}
                              {typeof result.sourceCount === "number" ? <span>{result.sourceCount} sources</span> : null}
                            </div>
                          </div>
                          <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-blue-900 transition group-hover:translate-x-0.5 group-hover:text-red-700" aria-hidden="true" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
              {data?.suggestions?.length ? (
                <section>
                  <h3 className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-gray-500">Next searches</h3>
                  <div className="flex flex-wrap gap-2">
                    {data.suggestions.map((suggestion) => (
                      <Link
                        key={suggestion.id}
                        href={suggestion.href}
                        onClick={() => {
                          rememberSearch(trimmedQuery);
                          recordSearch({ action: "open_suggestion" }, suggestion);
                        }}
                        className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black text-blue-950 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        {suggestion.title}
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-lg font-black text-blue-950">No direct match yet.</p>
              <p className="mt-1 text-sm font-semibold text-gray-700">
                Try a county, office, source URL, issue, or official name. If the record is missing, submit the source and make the lane stronger.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/submit-source?summary=${encodeURIComponent(trimmedQuery)}`} className="rounded-xl bg-blue-900 px-4 py-2 text-sm font-black text-white hover:bg-red-700">
                  Submit one source
                </Link>
                <Link href="/services/quick-record-check" className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-black text-blue-950 hover:border-red-200 hover:text-red-700">
                  Request review
                </Link>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ChipSection({
  icon,
  title,
  chips,
  onPick,
  emptyText = "No searches yet.",
}: {
  icon: ReactNode;
  title: string;
  chips: SearchChip[];
  onPick: (chip: SearchChip) => void;
  emptyText?: string;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-slate-50 p-3">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-gray-500">
        {icon}
        {title}
      </h3>
      {chips.length ? (
        <div className="flex flex-wrap gap-2">
          {chips.slice(0, 8).map((chip) => (
            <button
              key={`${title}-${chip.id ?? chip.query}`}
              type="button"
              onClick={() => onPick(chip)}
              className="rounded-full border border-white bg-white px-3 py-2 text-left text-xs font-black text-blue-950 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-red-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {chipLabel(chip)}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm font-semibold text-gray-500">{emptyText}</p>
      )}
    </section>
  );
}
