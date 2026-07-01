"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookmarkPlus,
  Command,
  FileQuestion,
  Gauge,
  LayoutDashboard,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { getOrCreateAnonymousId, getOrCreateSessionId, trackEvent } from "@/lib/analytics-client";
import type { SearchDiscoveryResponse, SearchDiscoveryResult } from "@/lib/search-discovery";

type CommandAction = {
  id: string;
  label: string;
  detail: string;
  href: string;
  icon: typeof Search;
  adminOnly?: boolean;
};

const recentSearchStorageKey = "repwatchr:recent-searches";

const commandActions: CommandAction[] = [
  { id: "submit-source", label: "Submit Source", detail: "Send a public source into review.", href: "/submit-source", icon: Upload },
  { id: "build-packet", label: "Build Packet", detail: "Turn one source into a shareable packet.", href: "/free-packet", icon: FileQuestion },
  { id: "watch-official", label: "Watch Official", detail: "Find an official and add them to a watchlist.", href: "/search?q=official", icon: BookmarkPlus },
  { id: "watchlists", label: "Create Watchlist", detail: "Watch officials, races, boards, issues, and searches.", href: "/dashboard/watchlists", icon: BookmarkPlus },
  { id: "correction", label: "Request Correction", detail: "Flag an incorrect record with a source.", href: "/sources/submit?form=correction_request", icon: ShieldCheck },
  { id: "dashboard", label: "Open Dashboard", detail: "Return to your civic command center.", href: "/dashboard", icon: LayoutDashboard },
  { id: "admin", label: "Open Admin", detail: "Review sources, analytics, data health, and revenue signals.", href: "/admin", icon: Lock, adminOnly: true },
  { id: "services", label: "Open Services", detail: "Review packages and beta access paths.", href: "/services", icon: Gauge },
  { id: "methodology", label: "Open Methodology", detail: "See how RepWatchr labels records and scores confidence.", href: "/methodology", icon: Sparkles },
  { id: "privacy", label: "Open Privacy", detail: "Review privacy and safety boundaries.", href: "/privacy", icon: ShieldCheck },
  { id: "sources", label: "Open Sources", detail: "Submit or review source workflow pages.", href: "/sources/submit", icon: Upload },
];

function readRecentSearches() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(recentSearchStorageKey) ?? "[]");
    return Array.isArray(parsed)
      ? parsed
          .filter((item): item is { query: string; label?: string } => Boolean(item && typeof item.query === "string"))
          .slice(0, 6)
      : [];
  } catch {
    return [];
  }
}

function rememberSearch(query: string) {
  if (typeof window === "undefined" || !query.trim()) return;
  const recent = readRecentSearches();
  const next = [{ query, label: query }, ...recent.filter((item) => item.query.toLowerCase() !== query.toLowerCase())].slice(0, 8);
  window.localStorage.setItem(recentSearchStorageKey, JSON.stringify(next));
}

export function CommandResultRow({
  result,
  onSelect,
}: {
  result: SearchDiscoveryResult;
  onSelect: () => void;
}) {
  return (
    <Link
      href={result.url}
      onClick={onSelect}
      className="group flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-amber-200/60 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-300"
    >
      <span className="min-w-0">
        <span className="block text-[0.66rem] font-black uppercase tracking-[0.16em] text-amber-200">
          {result.entityType.replace(/_/g, " ")} - {result.trustLabel}
        </span>
        <span className="mt-1 block truncate text-sm font-black text-white">{result.title}</span>
        <span className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-blue-100">{result.body || result.subtitle || result.url}</span>
      </span>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-amber-200 transition group-hover:translate-x-0.5" />
    </Link>
  );
}

export default function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [data, setData] = useState<SearchDiscoveryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<Array<{ query: string; label?: string }>>([]);

  const visibleActions = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return commandActions.filter((action) => {
      if (action.adminOnly && !pathname?.startsWith("/admin")) return false;
      if (!normalized) return true;
      return `${action.label} ${action.detail}`.toLowerCase().includes(normalized);
    }).slice(0, 8);
  }, [pathname, query]);

  useEffect(() => {
    function openPalette() {
      setOpen(true);
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }

    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openPalette();
      }
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("repwatchr:open-command-palette", openPalette);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("repwatchr:open-command-palette", openPalette);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setRecent(readRecentSearches());
    void trackEvent("command_palette_open", { route: pathname ?? "/" }, { route: pathname ?? "/" });
  }, [open, pathname]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams({
        q: query,
        limit: "8",
        sourceSurface: "command_palette",
        route: pathname ?? "/",
        anonymousId: getOrCreateAnonymousId(),
        sessionId: getOrCreateSessionId(),
      });
      setLoading(true);
      fetch(`/api/search?${params.toString()}`, { signal: controller.signal })
        .then((response) => response.ok ? response.json() : null)
        .then((payload: SearchDiscoveryResponse | null) => {
          setData(payload);
          if (query.trim()) {
            void trackEvent("command_search_input", { query, result_count: payload?.total ?? 0 }, { route: pathname ?? "/" });
          }
          if (query.trim() && payload && payload.total === 0 && !visibleActions.length) {
            void trackEvent("command_no_result", { query }, { route: pathname ?? "/" });
          }
        })
        .catch(() => undefined)
        .finally(() => setLoading(false));
    }, query ? 140 : 30);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [open, pathname, query, visibleActions.length]);

  function submitSearch(nextQuery = query) {
    const clean = nextQuery.trim();
    if (!clean) return;
    rememberSearch(clean);
    setOpen(false);
    void trackEvent("command_action_clicked", { action: "submit_search", query: clean }, { route: pathname ?? "/" });
    router.push(`/search?q=${encodeURIComponent(clean)}`);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/72 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label="RepWatchr command palette">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close command palette" onClick={() => setOpen(false)} />
      <div className="relative mx-auto mt-12 max-w-3xl overflow-hidden rounded-[2rem] border border-white/15 bg-[#071a34] shadow-2xl shadow-black/50">
        <div className="border-b border-white/10 bg-white/5 p-3">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch();
            }}
            className="relative"
          >
            <Command className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-200" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search or run a RepWatchr action..."
              className="min-h-14 w-full rounded-2xl border border-white/10 bg-white/10 py-4 pl-12 pr-24 text-base font-black text-white placeholder:text-blue-100/70 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-amber-300 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-950">
              Search
            </button>
          </form>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">
              Cmd/Ctrl + K
            </p>
            <p className="text-xs font-bold text-blue-100">
              {loading ? "Searching..." : `${data?.total ?? 0} matching public lanes`}
            </p>
          </div>

          {query.trim() ? (
            <div className="space-y-2">
              {data?.results.slice(0, 7).map((result) => (
                <CommandResultRow
                  key={result.id}
                  result={result}
                  onSelect={() => {
                    rememberSearch(query);
                    setOpen(false);
                    void trackEvent("command_result_clicked", {
                      query,
                      entity_type: result.entityType,
                      entity_id: result.entityId,
                      url: result.url,
                    }, { route: pathname ?? "/" });
                  }}
                />
              ))}
              {!data?.results.length && !visibleActions.length ? (
                <div className="rounded-2xl border border-amber-200/40 bg-amber-200/10 p-4">
                  <p className="text-lg font-black text-white">No command or record match yet.</p>
                  <p className="mt-1 text-sm font-semibold text-blue-100">Submit the missing official, source, agency, or record so RepWatchr can build it.</p>
                  <Link
                    href={`/sources/submit?targetName=${encodeURIComponent(query)}`}
                    onClick={() => setOpen(false)}
                    className="mt-3 inline-flex rounded-xl bg-amber-300 px-4 py-2 text-sm font-black text-blue-950"
                  >
                    Submit missing source
                  </Link>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <section>
                <h3 className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-blue-100">Recent searches</h3>
                <div className="grid gap-2">
                  {recent.length ? recent.map((item) => (
                    <button
                      key={item.query}
                      type="button"
                      onClick={() => submitSearch(item.query)}
                      className="rounded-2xl border border-white/10 bg-white/5 p-3 text-left text-sm font-black text-white transition hover:bg-white/10"
                    >
                      {item.label ?? item.query}
                    </button>
                  )) : (
                    <p className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm font-semibold text-blue-100">Recent searches will show here.</p>
                  )}
                </div>
              </section>
              <section>
                <h3 className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-blue-100">Trending records</h3>
                <div className="grid gap-2">
                  {data?.results.slice(0, 5).map((result) => (
                    <CommandResultRow
                      key={result.id}
                      result={result}
                      onSelect={() => {
                        setOpen(false);
                        void trackEvent("command_result_clicked", { entity_type: result.entityType, entity_id: result.entityId }, { route: pathname ?? "/" });
                      }}
                    />
                  ))}
                </div>
              </section>
            </div>
          )}

          {visibleActions.length ? (
            <section className="mt-5">
              <h3 className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-blue-100">Actions</h3>
              <div className="grid gap-2 md:grid-cols-2">
                {visibleActions.map((action) => (
                  <Link
                    key={action.id}
                    href={action.href}
                    onClick={() => {
                      setOpen(false);
                      void trackEvent("command_action_clicked", { action: action.id, href: action.href }, { route: pathname ?? "/" });
                    }}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:border-amber-200/60 hover:bg-white/10"
                  >
                    <action.icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                    <span>
                      <span className="block text-sm font-black text-white">{action.label}</span>
                      <span className="mt-1 block text-xs font-semibold leading-5 text-blue-100">{action.detail}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
