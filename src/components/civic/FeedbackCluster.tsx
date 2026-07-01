"use client";

import { useState } from "react";
import {
  getOrCreateAnonymousId,
  trackEvent,
} from "@/lib/analytics-client";
import type { CivicFeedbackOption } from "@/lib/civic-actions";

export function FeedbackButton({
  option,
  active,
  disabled,
  onClick,
}: {
  option: CivicFeedbackOption;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={option.detail}
      className={`rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-wide transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60 ${
        active
          ? "border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-600/20"
          : "border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:text-red-700"
      }`}
    >
      {option.label}
    </button>
  );
}

export function FeedbackRollupBadge({
  count,
  label = "signals",
}: {
  count?: number | null;
  label?: string;
}) {
  if (!count || count < 3) {
    return (
      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-500">
        building signal
      </span>
    );
  }

  return (
    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-emerald-800">
      {count} {label}
    </span>
  );
}

export function FeedbackMeter({ score, count }: { score?: number | null; count?: number | null }) {
  const safeCount = Math.max(0, Number(count ?? 0));
  const safeScore = Math.max(0, Number(score ?? 0));
  const width = safeCount ? Math.min(100, Math.round((safeScore / Math.max(safeCount, 1)) * 100)) : 0;

  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${width}%` }} />
    </div>
  );
}

export function ReportBrokenSourceButton({
  entityId,
  route,
}: {
  entityId: string;
  route?: string;
}) {
  return (
    <FeedbackButton
      option={{ feedbackType: "source_broken", value: "yes", label: "Broken source" }}
      onClick={() => {
        void trackEvent("feedback_vote_clicked", { entity_type: "source", entity_id: entityId, feedback_type: "source_broken" }, { route });
      }}
    />
  );
}

export default function FeedbackCluster({
  entityType,
  entityId,
  route,
  title = "Civic feedback",
  description = "Tell RepWatchr what is useful, missing, broken, or worth reviewing.",
  options,
  compact = false,
}: {
  entityType: string;
  entityId: string;
  route?: string;
  title?: string;
  description?: string;
  options: CivicFeedbackOption[];
  compact?: boolean;
}) {
  const [activeByType, setActiveByType] = useState<Record<string, string>>({});
  const [savingType, setSavingType] = useState("");
  const [rollups, setRollups] = useState<Record<string, { count: number; score: number }>>({});
  const [error, setError] = useState("");

  async function sendFeedback(option: CivicFeedbackOption) {
    setSavingType(option.feedbackType);
    setError("");
    const anonymousId = getOrCreateAnonymousId();

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymousId,
          entityType,
          entityId,
          feedbackType: option.feedbackType,
          feedbackValue: option.value,
          weight: 1,
          route: route ?? window.location.pathname,
          metadata: {
            label: option.label,
            detail: option.detail ?? null,
          },
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        changed?: boolean;
        rollup?: { count: number; score: number } | null;
      };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Feedback could not be saved.");

      setActiveByType((current) => ({ ...current, [option.feedbackType]: option.value }));
      if (data.rollup) {
        setRollups((current) => ({ ...current, [option.feedbackType]: data.rollup! }));
      }
      void trackEvent(data.changed ? "feedback_vote_changed" : "feedback_vote_clicked", {
        entity_type: entityType,
        entity_id: entityId,
        feedback_type: option.feedbackType,
        feedback_value: option.value,
      }, { route });
    } catch (feedbackError) {
      setError(feedbackError instanceof Error ? feedbackError.message : "Feedback could not be saved.");
    } finally {
      setSavingType("");
    }
  }

  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${compact ? "p-3" : "p-4"}`}
      data-civic-feedback
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-700">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{description}</p>
        </div>
        <FeedbackRollupBadge count={Object.values(rollups).reduce((sum, item) => sum + item.count, 0)} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <FeedbackButton
            key={`${option.feedbackType}-${option.value}`}
            option={option}
            active={activeByType[option.feedbackType] === option.value}
            disabled={savingType === option.feedbackType}
            onClick={() => sendFeedback(option)}
          />
        ))}
      </div>
      {Object.entries(rollups).length ? (
        <div className="mt-3 grid gap-2">
          {Object.entries(rollups).map(([feedbackType, rollup]) => (
            <div key={feedbackType} className="grid grid-cols-[8rem_1fr] items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">{feedbackType.replace(/_/g, " ")}</span>
              <FeedbackMeter count={rollup.count} score={rollup.score} />
            </div>
          ))}
        </div>
      ) : null}
      {error ? <p className="mt-2 text-xs font-bold text-red-700">{error}</p> : null}
    </section>
  );
}
