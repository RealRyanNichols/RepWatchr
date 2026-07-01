"use client";

import { useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import {
  OFFICIAL_TIMELINE_EVENT_TYPES,
  officialTimelineEmbedCode,
  officialTimelineUrl,
  type OfficialTimelineEvent,
  type OfficialTimelineEventType,
} from "@/lib/official-timeline-shared";
import { trackVisitorIntelligenceEvent } from "@/lib/visitor-intelligence-client";

const typeTone: Record<OfficialTimelineEventType, string> = {
  speech: "border-indigo-200 bg-indigo-50 text-indigo-800",
  vote: "border-blue-200 bg-blue-50 text-blue-800",
  donation: "border-emerald-200 bg-emerald-50 text-emerald-800",
  campaign_filing: "border-amber-200 bg-amber-50 text-amber-800",
  meeting: "border-cyan-200 bg-cyan-50 text-cyan-800",
  board_appointment: "border-violet-200 bg-violet-50 text-violet-800",
  committee_vote: "border-sky-200 bg-sky-50 text-sky-800",
  article: "border-slate-200 bg-slate-50 text-slate-800",
  investigation: "border-rose-200 bg-rose-50 text-rose-800",
  correction: "border-orange-200 bg-orange-50 text-orange-800",
  public_statement: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800",
  funding: "border-green-200 bg-green-50 text-green-800",
  red_flag: "border-red-200 bg-red-50 text-red-800",
  disclosure: "border-yellow-200 bg-yellow-50 text-yellow-800",
  source_link: "border-gray-200 bg-gray-50 text-gray-800",
  profile_update: "border-teal-200 bg-teal-50 text-teal-800",
};

const eventTypeOrder: OfficialTimelineEventType[] = [
  "vote",
  "funding",
  "donation",
  "campaign_filing",
  "disclosure",
  "red_flag",
  "investigation",
  "article",
  "public_statement",
  "speech",
  "meeting",
  "committee_vote",
  "board_appointment",
  "correction",
  "source_link",
  "profile_update",
];

function formatDate(value: string | null) {
  if (!value) return "Date pending";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function eventText(event: OfficialTimelineEvent) {
  return [
    event.title,
    event.summary,
    event.eventType,
    event.sourceTitle,
    event.sourceDomain,
    event.jurisdiction,
    event.office,
    event.state,
    event.county,
    event.tags.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function safeTimelineSnippet(officialName: string, events: OfficialTimelineEvent[]) {
  const top = events[0];
  const sourceCount = new Set(events.map((event) => event.sourceUrl)).size;
  if (!top) {
    return `RepWatchr timeline for ${officialName}: source-backed events are being built. Submit a public source if one is missing.`;
  }
  return `RepWatchr timeline for ${officialName}: ${events.length} source-linked events from ${sourceCount} public sources. Latest: ${top.title}. Open the receipt before sharing.`;
}

type OfficialTimelineProps = {
  officialId: string;
  officialName: string;
  events: OfficialTimelineEvent[];
  compact?: boolean;
  embedded?: boolean;
};

export default function OfficialTimeline({
  officialId,
  officialName,
  events,
  compact = false,
  embedded = false,
}: OfficialTimelineProps) {
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<OfficialTimelineEventType | "all">("all");
  const [visibleLimit, setVisibleLimit] = useState(compact ? 10 : 48);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timelineUrl = officialTimelineUrl(officialId);
  const embedCode = officialTimelineEmbedCode(officialId);
  const shareSnippet = safeTimelineSnippet(officialName, events);

  const typeCounts = useMemo(() => {
    return events.reduce<Partial<Record<OfficialTimelineEventType, number>>>((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] ?? 0) + 1;
      return acc;
    }, {});
  }, [events]);

  const availableTypes = useMemo(
    () => eventTypeOrder.filter((type) => (typeCounts[type] ?? 0) > 0),
    [typeCounts],
  );

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return events.filter((event) => {
      if (activeType !== "all" && event.eventType !== activeType) return false;
      if (!normalizedQuery) return true;
      return eventText(event).includes(normalizedQuery);
    });
  }, [activeType, events, query]);

  const visibleEvents = filteredEvents.slice(0, visibleLimit);
  const sourceCount = useMemo(() => new Set(events.map((event) => event.sourceUrl)).size, [events]);

  function trackTimelineAction(action: string, metadata: Record<string, string | number | boolean | null> = {}) {
    track(`official_timeline_${action}`, {
      officialId,
      officialName,
      eventCount: events.length,
      ...metadata,
    });
    trackVisitorIntelligenceEvent({
      eventType: action.includes("share") ? "share" : "button_click",
      path: `/officials/${officialId}/timeline`,
      entityType: "official",
      entityId: officialId,
      entityLabel: officialName,
      buttonLabel: action,
      metadata,
    });
  }

  async function copyValue(key: string, value: string, action: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      trackTimelineAction(action);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      setCopiedKey(null);
    }
  }

  async function nativeShare() {
    if (!navigator.share) {
      await copyValue("timeline-link", timelineUrl, "copy_link_fallback");
      return;
    }

    try {
      await navigator.share({
        title: `${officialName} RepWatchr timeline`,
        text: shareSnippet,
        url: timelineUrl,
      });
      trackTimelineAction("native_share", { supported: true });
    } catch {
      trackTimelineAction("native_share_cancelled", { supported: true });
    }
  }

  function onSearchChange(value: string) {
    setQuery(value);
    setVisibleLimit(compact ? 10 : 48);
    if (value.trim().length >= 2) {
      trackVisitorIntelligenceEvent({
        eventType: "global_search_submitted",
        path: `/officials/${officialId}/timeline`,
        entityType: "official-timeline",
        entityId: officialId,
        entityLabel: officialName,
        searchTerm: value.trim(),
      });
    }
  }

  return (
    <section
      className={[
        "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        embedded ? "min-h-screen rounded-none border-0" : "",
      ].join(" ")}
      aria-labelledby="official-timeline-heading"
    >
      <div className="border-b border-slate-200 bg-slate-950 px-4 py-5 text-white sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
              Source timeline
            </p>
            <h2 id="official-timeline-heading" className="mt-2 text-2xl font-black sm:text-3xl">
              {officialName} public record timeline
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-300">
              Every vote, funding source, public statement, article, disclosure, and profile source becomes a dated event when a public receipt exists.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[360px]">
            <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2">
              <p className="text-2xl font-black">{events.length}</p>
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-300">Events</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2">
              <p className="text-2xl font-black">{sourceCount}</p>
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-300">Sources</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2">
              <p className="text-2xl font-black">{availableTypes.length}</p>
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-300">Filters</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <label className="block">
            <span className="sr-only">Search timeline</span>
            <input
              value={query}
              onChange={(event) => onSearchChange(event.target.value)}
              className="h-12 w-full rounded-xl border border-white/15 bg-white px-4 text-sm font-semibold text-slate-950 outline-none ring-red-500 transition placeholder:text-slate-500 focus:ring-2"
              placeholder="Search votes, donors, issues, sources, meetings, filings..."
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => copyValue("timeline-snippet", shareSnippet, "copy_safe_line")}
              className="rounded-xl border border-white/15 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-950 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              {copiedKey === "timeline-snippet" ? "Copied" : "Copy safe line"}
            </button>
            <button
              type="button"
              onClick={nativeShare}
              className="rounded-xl border border-blue-400 bg-blue-600 px-3 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Share timeline
            </button>
            {!compact && !embedded ? (
              <button
                type="button"
                onClick={() => copyValue("timeline-embed", embedCode, "copy_embed")}
                className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                {copiedKey === "timeline-embed" ? "Embed copied" : "Embed"}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => {
              setActiveType("all");
              setVisibleLimit(compact ? 10 : 48);
              trackTimelineAction("filter", { type: "all" });
            }}
            className={[
              "shrink-0 rounded-full border px-3 py-2 text-xs font-black uppercase tracking-wide transition focus:outline-none focus:ring-2 focus:ring-red-300",
              activeType === "all"
                ? "border-slate-950 bg-slate-950 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-400",
            ].join(" ")}
          >
            All {events.length}
          </button>
          {availableTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setActiveType(type);
                setVisibleLimit(compact ? 10 : 48);
                trackTimelineAction("filter", { type });
              }}
              className={[
                "shrink-0 rounded-full border px-3 py-2 text-xs font-black uppercase tracking-wide transition focus:outline-none focus:ring-2 focus:ring-red-300",
                activeType === type ? "border-slate-950 bg-slate-950 text-white" : typeTone[type],
              ].join(" ")}
            >
              {OFFICIAL_TIMELINE_EVENT_TYPES[type].shortLabel} {typeCounts[type]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 sm:px-6">
        {filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-lg font-black text-slate-950">No matching timeline events yet.</p>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              Submit a source, request a review, or clear the filter to open the rest of the record.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <a
                href={`/submit-source?targetType=official&targetId=${encodeURIComponent(officialId)}&targetName=${encodeURIComponent(officialName)}`}
                className="rounded-xl bg-red-700 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-red-600"
              >
                Submit one missing source
              </a>
              <a
                href={`/services/official-record-brief?official=${encodeURIComponent(officialId)}`}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-900 transition hover:border-blue-300 hover:bg-blue-50"
              >
                Request review
              </a>
            </div>
          </div>
        ) : (
          <ol className="relative space-y-4 before:absolute before:left-4 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-slate-200 sm:before:left-5">
            {visibleEvents.map((event) => (
              <li key={event.id} className="relative pl-11 sm:pl-14">
                <span className="absolute left-1 top-5 h-7 w-7 rounded-full border-4 border-white bg-slate-950 shadow-sm sm:left-2" />
                <article className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${typeTone[event.eventType]}`}>
                          {OFFICIAL_TIMELINE_EVENT_TYPES[event.eventType].label}
                        </span>
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-800">
                          Source-linked
                        </span>
                        {event.status === "needs_review" ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-800">
                            Needs review
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-2 text-lg font-black leading-snug text-slate-950">
                        {event.title}
                      </h3>
                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                        {event.summary}
                      </p>
                    </div>

                    <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left lg:min-w-36">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                        Event date
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-950">
                        {formatDate(event.eventDate)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 text-xs font-semibold text-slate-500">
                      <span className="font-black uppercase tracking-wide text-slate-700">
                        Source:
                      </span>{" "}
                      <a
                        href={event.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackTimelineAction("open_source", { eventType: event.eventType })}
                        className="break-words text-blue-700 hover:underline"
                      >
                        {event.sourceTitle}
                      </a>
                      {event.sourceDomain ? <span> · {event.sourceDomain}</span> : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => copyValue(event.id, event.shareSnippet, "copy_event_snippet")}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-800 transition hover:border-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                      >
                        {copiedKey === event.id ? "Copied" : "Copy event"}
                      </button>
                      <a
                        href={event.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-blue-800 transition hover:border-blue-300 hover:bg-blue-100"
                      >
                        Open source
                      </a>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        )}

        {filteredEvents.length > visibleLimit ? (
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setVisibleLimit((current) => current + (compact ? 10 : 48));
                trackTimelineAction("load_more");
              }}
              className="rounded-xl bg-slate-950 px-5 py-3 text-xs font-black uppercase tracking-wide text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              Load more timeline events
            </button>
          </div>
        ) : null}
      </div>

      {!embedded ? (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm font-semibold text-slate-600">
              Timeline is the public-record layer. A better source can change the record.
            </p>
            <div className="flex flex-wrap gap-2">
              {compact ? (
                <a
                  href={`/officials/${officialId}/timeline`}
                  className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-slate-800"
                >
                  Open full timeline
                </a>
              ) : null}
              <a
                href={`/dashboard?watch=official:${encodeURIComponent(officialId)}`}
                className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-800 transition hover:border-blue-300 hover:bg-blue-100"
              >
                Watch this official
              </a>
              <a
                href={`/submit-source?targetType=official&targetId=${encodeURIComponent(officialId)}&targetName=${encodeURIComponent(officialName)}`}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-red-800 transition hover:border-red-300 hover:bg-red-100"
              >
                Submit better source
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
