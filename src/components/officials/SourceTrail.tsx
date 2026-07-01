"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import FeedbackCluster from "@/components/civic/FeedbackCluster";
import { trackEvent } from "@/lib/analytics-client";
import { sourceFeedbackOptions } from "@/lib/civic-actions";

export type ProfileSourceCategory =
  | "official_source"
  | "vote"
  | "funding"
  | "meeting"
  | "court_agency_record"
  | "public_statement"
  | "article"
  | "user_submitted"
  | "under_review";

export type ProfileSourceTrailEntry = {
  id: string;
  title: string;
  url: string;
  category: ProfileSourceCategory;
  date?: string | null;
  sourceName?: string | null;
  domain?: string | null;
  confidenceLabel: string;
  statusLabel: string;
  summary?: string | null;
};

type SourceTrailProps = {
  officialId: string;
  officialName: string;
  profilePath: string;
  sources: ProfileSourceTrailEntry[];
};

const FILTERS: Array<{ label: string; value: ProfileSourceCategory | "all" }> = [
  { label: "All", value: "all" },
  { label: "Official", value: "official_source" },
  { label: "Votes", value: "vote" },
  { label: "Funding", value: "funding" },
  { label: "Meetings", value: "meeting" },
  { label: "Records", value: "court_agency_record" },
  { label: "Statements", value: "public_statement" },
  { label: "Articles", value: "article" },
  { label: "User submitted", value: "user_submitted" },
  { label: "Review", value: "under_review" },
];

function labelForCategory(category: ProfileSourceCategory) {
  return category.replace(/_/g, " ");
}

function displayDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildSubmitHref(form: string, entry: ProfileSourceTrailEntry, officialId: string, officialName: string) {
  const params = new URLSearchParams({
    form,
    targetType: "official",
    targetId: officialId,
    targetName: officialName,
    sourceUrl: entry.url,
    sourceTitle: entry.title,
  });
  return `/sources/submit?${params.toString()}`;
}

export default function SourceTrail({
  officialId,
  officialName,
  profilePath,
  sources,
}: SourceTrailProps) {
  const [activeFilter, setActiveFilter] = useState<ProfileSourceCategory | "all">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    void trackEvent("source_trail_opened", {
      official_id: officialId,
      official_name: officialName,
      source_count: sources.length,
    }, { route: profilePath });
    void trackEvent("profile_section_viewed", {
      official_id: officialId,
      official_name: officialName,
      section: "source_trail",
    }, { route: profilePath });
  }, [officialId, officialName, profilePath, sources.length]);

  const filteredSources = useMemo(() => {
    if (activeFilter === "all") return sources;
    return sources.filter((source) => source.category === activeFilter);
  }, [activeFilter, sources]);

  async function copySource(entry: ProfileSourceTrailEntry) {
    await navigator.clipboard.writeText(`${entry.title}\n${entry.url}`);
    setCopiedId(entry.id);
    void trackEvent("source_snippet_copied", {
      official_id: officialId,
      official_name: officialName,
      source_id: entry.id,
      source_category: entry.category,
    }, { route: profilePath });
    setTimeout(() => setCopiedId(null), 1600);
  }

  function trackSourceClick(entry: ProfileSourceTrailEntry, action: string) {
    void trackEvent("source_clicked_from_profile", {
      official_id: officialId,
      official_name: officialName,
      source_id: entry.id,
      source_title: entry.title,
      source_category: entry.category,
      action,
      href: entry.url,
    }, { route: profilePath });
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_34%),linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">
              Source trail
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Receipts attached to this profile
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
              Every link below is treated as a record path, not a finished accusation. Open the source, report a broken link, or turn it into a packet for review.
            </p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-blue-950">
            <p className="text-3xl font-black">{sources.length}</p>
            <p className="text-xs font-black uppercase tracking-wide">Sources loaded</p>
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-black uppercase tracking-wide transition ${
                activeFilter === filter.value
                  ? "bg-slate-950 text-white shadow-lg shadow-slate-950/20"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-800"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {filteredSources.length > 0 ? (
        <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-2">
          {filteredSources.map((entry) => {
            const dateLabel = displayDate(entry.date);
            const packetHref = buildSubmitHref("free_packet", entry, officialId, officialName);
            const reportHref = buildSubmitHref("report_broken_link", entry, officialId, officialName);

            return (
              <article
                key={entry.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-xl hover:shadow-blue-950/10"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#bf0d3e,#f59e0b,#2563eb)] opacity-70" />
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-blue-900">
                    {labelForCategory(entry.category)}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-800">
                    {entry.confidenceLabel}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600 ring-1 ring-slate-200">
                    {entry.statusLabel}
                  </span>
                </div>
                <h3 className="mt-3 line-clamp-2 text-lg font-black leading-tight text-slate-950">
                  {entry.title}
                </h3>
                {entry.summary ? (
                  <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-slate-600">
                    {entry.summary}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                  <span>{entry.sourceName ?? entry.domain ?? "Public source"}</span>
                  {dateLabel ? <span>| {dateLabel}</span> : null}
                  {entry.domain ? <span>| {entry.domain}</span> : null}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackSourceClick(entry, "open_source")}
                    className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-blue-700"
                  >
                    Open source
                  </a>
                  <button
                    type="button"
                    onClick={() => copySource(entry)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-700 transition hover:border-blue-200 hover:text-blue-800"
                  >
                    {copiedId === entry.id ? "Copied" : "Copy"}
                  </button>
                  <Link
                    href={packetHref}
                    onClick={() => trackSourceClick(entry, "build_packet")}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-amber-950 transition hover:bg-amber-100"
                  >
                    Build packet
                  </Link>
                  <Link
                    href={reportHref}
                    onClick={() => trackSourceClick(entry, "report_broken")}
                    className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-red-800 transition hover:bg-red-100"
                  >
                    Report broken
                  </Link>
                </div>
                <div className="mt-4">
                  <FeedbackCluster
                    entityType="source"
                    entityId={entry.id}
                    route={profilePath}
                    title="Source feedback"
                    description="Flag useful, broken, missing-context, or better-source signals."
                    options={sourceFeedbackOptions}
                    compact
                  />
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="p-6">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <h3 className="text-xl font-black text-slate-950">No sources in this filter yet.</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
              Add an official link, vote source, funding filing, article, meeting record, or correction source so this profile can keep moving.
            </p>
            <Link
              href={`/sources/submit?targetType=official&targetId=${encodeURIComponent(officialId)}&targetName=${encodeURIComponent(officialName)}`}
              className="mt-4 inline-flex rounded-xl bg-blue-700 px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-slate-950"
            >
              Submit one source
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
