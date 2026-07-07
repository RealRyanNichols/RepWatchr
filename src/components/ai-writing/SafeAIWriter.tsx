"use client";

import { useMemo, useState, type FormEvent } from "react";
import { getAnonymousSessionId, trackRepWatchrEvent } from "@/lib/client-analytics";

type AIWritingUseCase =
  | "public_question"
  | "safe_share_line"
  | "source_packet_summary"
  | "missing_source_request"
  | "correction_request_wording"
  | "meeting_question"
  | "records_request_summary"
  | "profile_summary_draft"
  | "digest_summary"
  | "package_interest_message";

type AIWritingStyle =
  | "neutral"
  | "concise"
  | "meeting-safe"
  | "public-record formal"
  | "social share safe"
  | "dashboard summary"
  | "source packet language";

type SafetyFlag = {
  id: string;
  label: string;
  severity: "block" | "warn";
  detail: string;
  matchedText?: string;
};

type AIWritingOutput = {
  safe_text: string;
  label: string;
  what_this_does_not_claim: string;
  source_needed: boolean;
  safety_flags: SafetyFlag[];
  suggested_next_action: string;
};

type AIWritingResponse = {
  ok?: boolean;
  runId?: string | null;
  enabled?: boolean;
  provider?: string;
  model?: string;
  status?: "completed" | "fallback" | "failed";
  disabledReason?: string | null;
  output?: AIWritingOutput;
  error?: string;
};

export type SafeAIWriterButtonProps = {
  useCase: AIWritingUseCase;
  target?: string;
  topic?: string;
  sourceUrl?: string;
  existingText?: string;
  contextPayload?: Record<string, unknown>;
  actorRole?: string;
  buttonLabel?: string;
  title?: string;
  onInsert?: (text: string) => void;
  className?: string;
};

const styles: AIWritingStyle[] = [
  "neutral",
  "concise",
  "meeting-safe",
  "public-record formal",
  "social share safe",
  "dashboard summary",
  "source packet language",
];

const manualTemplates = [
  {
    label: "Public question",
    text: "Where can the public find the source for [topic]?",
  },
  {
    label: "Missing source",
    text: "RepWatchr needs a public source for [target] related to [topic]. Submit one here: [URL].",
  },
  {
    label: "Source-backed share",
    text: "According to this public source, [short neutral summary]. Source: [URL].",
  },
  {
    label: "Correction",
    text: "I believe this item may be incorrect because [reason]. A public source that may help correct it is [URL].",
  },
];

function labelForUseCase(useCase: AIWritingUseCase) {
  return useCase.replaceAll("_", " ");
}

function contextToText(contextPayload?: Record<string, unknown>) {
  if (!contextPayload) return "";
  return Object.entries(contextPayload)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim())
    .map(([key, value]) => `${key}: ${String(value).slice(0, 1200)}`)
    .join("\n");
}

function hasBlockingFlags(output?: AIWritingOutput | null) {
  return Boolean(output?.safety_flags.some((flag) => flag.severity === "block"));
}

export function AIWritingDisabledNotice({ reason }: { reason?: string | null }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-950">
      <p>AI writing is disabled or unavailable. Manual templates are still available.</p>
      {reason ? <p className="mt-1 text-xs font-semibold text-amber-900">{reason}</p> : null}
    </div>
  );
}

export function SafetyFlagsList({ flags }: { flags: SafetyFlag[] }) {
  if (!flags.length) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-950">
        No safety flags detected in this draft.
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {flags.map((flag) => (
        <div
          key={`${flag.id}-${flag.matchedText || ""}`}
          className={`rounded-xl border p-3 text-sm font-bold leading-6 ${
            flag.severity === "block"
              ? "border-red-200 bg-red-50 text-red-950"
              : "border-amber-200 bg-amber-50 text-amber-950"
          }`}
        >
          <p className="font-black">{flag.severity === "block" ? "Blocked" : "Warning"}: {flag.label}</p>
          <p className="mt-1 text-xs font-semibold">{flag.detail}</p>
          {flag.matchedText ? <p className="mt-1 text-xs font-black uppercase tracking-wide">Matched: {flag.matchedText}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function AIOutputPreview({ output }: { output: AIWritingOutput }) {
  return (
    <div className="grid gap-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-950">
            {output.label}
          </span>
          {output.source_needed ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-950">
              Source needed
            </span>
          ) : null}
        </div>
        <textarea
          readOnly
          value={output.safe_text}
          rows={5}
          className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-950"
        />
        <div className="mt-3 grid gap-2 text-sm font-semibold leading-6 text-slate-700">
          <p><span className="font-black text-slate-950">Does not claim:</span> {output.what_this_does_not_claim}</p>
          <p><span className="font-black text-slate-950">Next action:</span> {output.suggested_next_action}</p>
        </div>
      </div>
      <SafetyFlagsList flags={output.safety_flags} />
    </div>
  );
}

export function CopyAITextButton({ output, useCase }: { output: AIWritingOutput; useCase: AIWritingUseCase }) {
  const [copied, setCopied] = useState(false);
  const blocked = hasBlockingFlags(output);

  async function copy() {
    if (blocked) return;
    await navigator.clipboard.writeText(output.safe_text);
    setCopied(true);
    trackRepWatchrEvent("ai_writer_text_copied", {
      use_case: useCase,
      label: output.label,
      source_needed: output.source_needed,
    });
  }

  return (
    <button type="button" disabled={blocked} onClick={copy} className="secondary-button disabled:cursor-not-allowed disabled:opacity-50">
      {copied ? "Copied" : "Copy AI Text"}
    </button>
  );
}

export function InsertAITextButton({
  output,
  useCase,
  onInsert,
}: {
  output: AIWritingOutput;
  useCase: AIWritingUseCase;
  onInsert?: (text: string) => void;
}) {
  const blocked = hasBlockingFlags(output);
  if (!onInsert) return null;

  return (
    <button
      type="button"
      disabled={blocked}
      onClick={() => {
        onInsert(output.safe_text);
        trackRepWatchrEvent("ai_writer_text_inserted", {
          use_case: useCase,
          label: output.label,
          source_needed: output.source_needed,
        });
      }}
      className="primary-button disabled:cursor-not-allowed disabled:opacity-50"
    >
      Insert Draft
    </button>
  );
}

export default function SafeAIWriterButton({
  useCase,
  target = "",
  topic = "",
  sourceUrl = "",
  existingText = "",
  contextPayload,
  actorRole = "public_user",
  buttonLabel = "Safe AI draft",
  title,
  onInsert,
  className = "",
}: SafeAIWriterButtonProps) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<AIWritingStyle>("neutral");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState<AIWritingResponse | null>(null);

  const contextText = useMemo(() => contextToText(contextPayload), [contextPayload]);
  const fallbackTitle = title || `Draft ${labelForUseCase(useCase)}`;

  function openModal() {
    setOpen(true);
    trackRepWatchrEvent("ai_writer_opened", {
      use_case: useCase,
      actor_role: actorRole,
    });
  }

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResponse(null);

    try {
      const result = await fetch("/api/ai/writing-assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          anonymousId: getAnonymousSessionId(),
          actorRole,
          useCase,
          style,
          prompt,
          target,
          topic,
          sourceUrl,
          existingText,
          contextText,
          sourceStatus: sourceUrl ? "source_present" : "needs_source",
          metadata: {
            route: typeof window !== "undefined" ? window.location.pathname : "",
          },
        }),
      });
      const data = (await result.json().catch(() => null)) as AIWritingResponse | null;
      if (!result.ok || !data?.ok || !data.output) {
        setError(data?.error || "The writing assistant could not generate a draft.");
        trackRepWatchrEvent("ai_writer_failed", { use_case: useCase, status: result.status });
        return;
      }

      setResponse(data);
      if (!data.enabled || data.status === "fallback") {
        trackRepWatchrEvent("ai_writer_disabled_fallback_used", { use_case: useCase, status: data.status || "fallback" });
      } else if (data.status === "failed") {
        trackRepWatchrEvent("ai_writer_failed", { use_case: useCase, status: "failed" });
      } else {
        trackRepWatchrEvent("ai_writer_generated", { use_case: useCase, label: data.output.label });
      }
      if (data.output.safety_flags.length) {
        trackRepWatchrEvent("ai_writer_safety_flagged", {
          use_case: useCase,
          blocked: hasBlockingFlags(data.output),
          flag_count: data.output.safety_flags.length,
        });
      }
    } catch {
      setError("The writing assistant could not generate a draft.");
      trackRepWatchrEvent("ai_writer_failed", { use_case: useCase, status: "network_error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={openModal} className={className || "secondary-button"}>
        {buttonLabel}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4">
          <div className="mx-auto my-8 max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Safe AI writer</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">{fallbackTitle}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Generates cautious draft language only. It cannot publish, approve, attach, or verify a claim.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm font-black text-slate-600 hover:border-red-300 hover:text-red-700"
                aria-label="Close safe AI writer"
              >
                Close
              </button>
            </div>

            <form onSubmit={generate} className="mt-5 grid gap-4">
              <label className="grid gap-1 text-sm font-bold text-slate-700">
                Output style
                <select value={style} onChange={(event) => setStyle(event.target.value as AIWritingStyle)} className="field">
                  {styles.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm font-bold text-slate-700">
                What should this draft help with?
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={4}
                  className="field min-h-28"
                  placeholder="Example: turn this into a meeting-safe public question, summarize the source without overclaiming, or rewrite this correction request safely."
                />
              </label>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Manual fallback templates</p>
                <div className="mt-3 grid gap-2">
                  {manualTemplates.map((template) => (
                    <button
                      key={template.label}
                      type="button"
                      onClick={() => setPrompt(template.text)}
                      className="rounded-xl border border-slate-200 bg-white p-3 text-left text-sm font-semibold leading-6 text-slate-700 hover:border-blue-300"
                    >
                      <span className="block text-xs font-black uppercase tracking-wide text-blue-950">{template.label}</span>
                      {template.text}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={busy} className="primary-button disabled:cursor-not-allowed disabled:opacity-50">
                {busy ? "Drafting..." : "Generate Safe Draft"}
              </button>
            </form>

            {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-950">{error}</div> : null}
            {response && (!response.enabled || response.status === "fallback" || response.status === "failed") ? (
              <div className="mt-4">
                <AIWritingDisabledNotice reason={response.disabledReason} />
              </div>
            ) : null}
            {response?.output ? (
              <div className="mt-4 grid gap-4">
                <AIOutputPreview output={response.output} />
                <div className="flex flex-wrap gap-3">
                  <InsertAITextButton output={response.output} useCase={useCase} onInsert={onInsert} />
                  <CopyAITextButton output={response.output} useCase={useCase} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
