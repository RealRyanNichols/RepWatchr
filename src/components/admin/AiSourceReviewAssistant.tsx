"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AI_REVIEW_HUMAN_NOTICE,
  type AiReviewOutput,
} from "@/lib/ai-source-review-types";
import { trackEvent } from "@/lib/analytics-client";

export type AiReviewDraft = {
  note?: string;
  summary?: string;
  status?: string;
  confidence?: string;
};

type AiReviewRun = Record<string, unknown>;

type AiReviewConfigPayload = {
  ok?: boolean;
  config?: {
    enabled?: boolean;
    provider?: string | null;
    model?: string | null;
    reason?: string;
  };
  schemaReady?: boolean;
  aiReviewRuns?: AiReviewRun[];
  message?: string;
  error?: string;
};

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function list(value: unknown) {
  return Array.isArray(value) ? value.map((item) => text(item)).filter(Boolean) : [];
}

function latestOutputFrom(runs: AiReviewRun[]) {
  const output = runs.find((run) => text(run.status) === "completed" && run.output_summary)?.output_summary;
  return output && typeof output === "object" ? (output as AiReviewOutput) : null;
}

function statusFromRecommendation(recommendation: string | undefined) {
  if (recommendation === "needs_more_info") return "needs_more_info";
  if (recommendation === "reject" || recommendation === "unsafe" || recommendation === "broken_link") return "rejected";
  if (recommendation === "duplicate") return "duplicate";
  if (recommendation?.startsWith("attach_to_")) return "needs_review";
  return "needs_review";
}

function confidenceFromOutput(output: AiReviewOutput) {
  if (output.safety_flags.includes("unsupported_certainty") || output.safety_flags.includes("ambiguous_source")) return "weak_match";
  if (output.safety_flags.includes("threat") || output.safety_flags.includes("doxxing")) return "rejected";
  return "needs_review";
}

export function AiSourceReviewAssistant({
  submission,
  initialRuns = [],
  onUseSuggestion,
}: {
  submission: Record<string, unknown>;
  initialRuns?: AiReviewRun[];
  onUseSuggestion?: (draft: AiReviewDraft) => void;
}) {
  const submissionId = text(submission.id);
  const [configPayload, setConfigPayload] = useState<AiReviewConfigPayload | null>(null);
  const [runs, setRuns] = useState<AiReviewRun[]>(initialRuns);
  const [output, setOutput] = useState<AiReviewOutput | null>(() => latestOutputFrom(initialRuns));
  const [loading, setLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const latestRun = useMemo(() => runs.find((run) => text(run.status) === "completed" && run.output_summary), [runs]);
  const config = configPayload?.config;
  const aiEnabled = Boolean(config?.enabled);
  const schemaReady = configPayload?.schemaReady !== false;
  const disabledMessage = !aiEnabled
    ? "AI review is disabled. Enable ENABLE_AI_SOURCE_REVIEW and configure provider to use this tool."
    : !schemaReady
      ? "AI review storage is not ready. Apply supabase-ai-source-review.sql before running analysis."
      : "";

  useEffect(() => {
    setRuns(initialRuns);
    setOutput(latestOutputFrom(initialRuns));
  }, [initialRuns, submissionId]);

  useEffect(() => {
    if (!submissionId) return;
    fetch(`/api/admin/sources/${encodeURIComponent(submissionId)}/ai-review`, { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: AiReviewConfigPayload) => {
        setConfigPayload(payload);
        if (payload.aiReviewRuns?.length) {
          setRuns(payload.aiReviewRuns);
          setOutput(latestOutputFrom(payload.aiReviewRuns));
        }
      })
      .catch(() => {
        setConfigPayload({ ok: false, schemaReady: false, error: "Unable to load AI review status." });
      });
  }, [submissionId]);

  async function analyze() {
    if (!submissionId || !aiEnabled || !schemaReady) return;
    setLoading(true);
    setError("");
    setMessage("");
    void trackEvent("ai_source_review_started", { source_submission_id: submissionId });

    try {
      const response = await fetch(`/api/admin/sources/${encodeURIComponent(submissionId)}/ai-review`, {
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || payload.error || "AI review failed.");
      }

      const nextOutput = payload.output as AiReviewOutput;
      setOutput(nextOutput);
      setRuns((current) => [payload.aiReviewRun as AiReviewRun, ...current.filter((run) => text(run.id) !== text(payload.aiReviewRun?.id))]);
      setMessage("AI source review completed. Treat this as a draft only.");
      void trackEvent("ai_source_review_completed", {
        source_submission_id: submissionId,
        recommendation: nextOutput.recommended_admin_action,
      });
      if (nextOutput.safety_flags.length) {
        void trackEvent("ai_safety_flag_triggered", {
          source_submission_id: submissionId,
          safety_flags: nextOutput.safety_flags.join(","),
        });
      }
    } catch (reviewError) {
      const reviewMessage = reviewError instanceof Error ? reviewError.message : "AI review failed.";
      setError(reviewMessage);
      void trackEvent("ai_source_review_failed", { source_submission_id: submissionId, error: reviewMessage });
    } finally {
      setLoading(false);
    }
  }

  async function recordFeedback(action: "accept" | "reject" | "ignore") {
    const latestRunId = text(latestRun?.id);
    if (!submissionId || !latestRunId) return;
    setFeedbackLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/sources/${encodeURIComponent(submissionId)}/ai-review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiReviewRunId: latestRunId,
          action,
          feedback: action === "accept" ? "Reviewer used AI suggestion as a draft." : "Reviewer ignored AI suggestion.",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Could not record AI feedback.");

      if (action === "accept" && output) {
        onUseSuggestion?.({
          note: output.suggested_admin_note,
          summary: output.suggested_safe_share_line || output.summary,
          status: statusFromRecommendation(output.recommended_admin_action),
          confidence: confidenceFromOutput(output),
        });
        setMessage("Suggestion copied into draft fields. Review and save the status yourself.");
        void trackEvent("ai_suggestion_accepted", { source_submission_id: submissionId, ai_review_run_id: latestRunId });
      } else {
        setMessage("AI suggestion ignored. No source record was changed.");
        void trackEvent("ai_suggestion_rejected", { source_submission_id: submissionId, ai_review_run_id: latestRunId });
      }
    } catch (feedbackError) {
      setError(feedbackError instanceof Error ? feedbackError.message : "Could not record AI feedback.");
    } finally {
      setFeedbackLoading(false);
    }
  }

  return (
    <section className="mt-5 overflow-hidden rounded-xl border border-indigo-200 bg-indigo-50 shadow-sm">
      <div className="border-b border-indigo-100 bg-white/80 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-indigo-800">AI review assistant</p>
            <h3 className="mt-1 text-lg font-black text-blue-950">Analyze source submission</h3>
            <p className="mt-2 max-w-2xl text-xs font-bold leading-5 text-slate-600">{AI_REVIEW_HUMAN_NOTICE}</p>
          </div>
          <button
            type="button"
            onClick={analyze}
            disabled={!aiEnabled || !schemaReady || loading}
            className="rounded-xl bg-blue-950 px-4 py-3 text-xs font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {loading ? "Analyzing..." : "Analyze Source Submission"}
          </button>
        </div>
        {disabledMessage ? <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-900">{disabledMessage}</p> : null}
        {config?.reason && !aiEnabled ? <p className="mt-2 text-xs font-semibold text-slate-500">Reason: {config.reason}</p> : null}
        {configPayload?.message ? <p className="mt-2 text-xs font-semibold text-slate-500">{configPayload.message}</p> : null}
        {message ? <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">{message}</p> : null}
        {error ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">{error}</p> : null}
      </div>

      <div className="grid gap-3 p-4">
        <SourceDetails submission={submission} />
        {output ? (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <OutputBlock title="Plain English Summary" value={output.summary} />
              <OutputBlock title="Source Type Guess" value={output.source_type_guess} />
              <OutputBlock title="Target Entity Guess" value={output.target_entity_guess} />
              <OutputBlock title="Suggested Public Label" value={output.suggested_public_label} />
              <OutputBlock title="What This Source Appears to Show" value={output.appears_to_show} wide />
              <OutputBlock title="What This Source Does Not Prove" value={output.does_not_prove} wide />
              <OutputList title="Missing Context" values={output.missing_context} />
              <OutputList title="Safety Flags" values={output.safety_flags} flag />
              <OutputBlock title="Suggested Admin Action" value={output.recommended_admin_action.replace(/_/g, " ")} />
              <OutputBlock title="Suggested Public Question" value={output.suggested_public_question} />
              <OutputBlock title="Suggested Safe Share Line" value={output.suggested_safe_share_line} wide />
              <OutputBlock title="Suggested Admin Note" value={output.suggested_admin_note} wide />
            </div>
            <div className="rounded-xl border border-indigo-100 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Human action required</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                Accepting this suggestion only copies draft text into the review fields. Attach, reject, request more info, or mark duplicate using the normal admin controls.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={feedbackLoading || !text(latestRun?.id)} onClick={() => recordFeedback("accept")} className="rounded-lg bg-blue-950 px-3 py-2 text-xs font-black uppercase tracking-wide text-white hover:bg-red-700 disabled:opacity-50">
                  Accept summary as draft
                </button>
                <button type="button" disabled={feedbackLoading || !text(latestRun?.id)} onClick={() => recordFeedback("ignore")} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-700 hover:border-red-300 hover:text-red-700 disabled:opacity-50">
                  Ignore AI suggestion
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-indigo-200 bg-white p-4 text-sm font-bold text-slate-600">
            No AI output yet. The assistant will summarize the submission, flag risky wording, and suggest a cautious admin action after it is enabled.
          </div>
        )}
      </div>
    </section>
  );
}

function SourceDetails({ submission }: { submission: Record<string, unknown> }) {
  const details = [
    ["Submitted URL", text(submission.source_url)],
    ["Target", [text(submission.target_type), text(submission.target_name)].filter(Boolean).join(" / ")],
    ["Jurisdiction", text(submission.jurisdiction)],
    ["Requested action", text(submission.requested_action)],
    ["Status", text(submission.status)],
  ];

  return (
    <div className="grid gap-2 rounded-xl border border-indigo-100 bg-white p-4 sm:grid-cols-2">
      {details.map(([label, value]) => (
        <div key={label}>
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 break-words text-xs font-bold leading-5 text-slate-700">{value || "Not supplied"}</p>
        </div>
      ))}
      <div className="sm:col-span-2">
        <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">Submitter summary</p>
        <p className="mt-1 text-xs font-bold leading-5 text-slate-700">{text(submission.claim_summary) || "No summary supplied."}</p>
      </div>
    </div>
  );
}

function OutputBlock({ title, value, wide = false }: { title: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-xl border border-indigo-100 bg-white p-4 ${wide ? "md:col-span-2" : ""}`}>
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-800">{value || "No suggestion supplied."}</p>
    </div>
  );
}

function OutputList({ title, values, flag = false }: { title: string; values: string[]; flag?: boolean }) {
  return (
    <div className="rounded-xl border border-indigo-100 bg-white p-4">
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {list(values).map((value) => (
          <span key={value} className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${flag ? "bg-red-50 text-red-800 ring-1 ring-red-100" : "bg-slate-100 text-slate-700"}`}>
            {value.replace(/_/g, " ")}
          </span>
        ))}
        {!values.length ? <span className="text-xs font-bold text-slate-500">None listed.</span> : null}
      </div>
    </div>
  );
}
