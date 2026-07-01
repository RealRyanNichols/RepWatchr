"use client";

import Link from "next/link";
import { AlertTriangle, Clipboard, Download, FileText, Send, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getFormAttribution } from "@/lib/data-intake-client";
import { getOrCreateAnonymousId, trackEvent } from "@/lib/analytics-client";
import {
  buildSourcePacket,
  PACKET_TARGET_TYPE_LABELS,
  PACKET_TARGET_TYPES,
  SOURCE_PACKET_TYPE_LABELS,
  SOURCE_PACKET_TYPES,
  sourcePacketInputSchema,
  type PacketTargetType,
  type SourcePacketInput,
  type SourcePacketType,
} from "@/lib/source-packet-tools";

type PacketApiResult = ReturnType<typeof buildSourcePacket> & {
  ok?: boolean;
  packetId?: string;
  stored?: boolean;
  message?: string;
  sourceReviewSubmissionId?: string | null;
};

const initialPacket: SourcePacketInput = {
  title: "",
  packetType: "official_record",
  targetType: "official",
  targetId: "",
  targetName: "",
  jurisdiction: "",
  sourceUrl: "",
  sourceTitle: "",
  sourceDate: "",
  sourceType: "",
  summary: "",
  confirmed: "",
  claimLanguage: "",
  missingContext: "",
  publicQuestion: "",
  nextRecordRequest: "",
  consent: false,
};

function downloadTextFile(fileName: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function safeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90) || "repwatchr-source-packet";
}

function fieldId(name: string) {
  return `packet_${name}`;
}

export function PacketTypeSelector({
  value,
  onChange,
}: {
  value: SourcePacketType;
  onChange: (value: SourcePacketType) => void;
}) {
  return (
    <div className="grid gap-2 sm:col-span-2">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Packet type</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {SOURCE_PACKET_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={`rounded-2xl border px-3 py-3 text-left text-xs font-black uppercase tracking-wide transition ${
              value === type
                ? "border-red-400 bg-red-600 text-white shadow-[0_14px_35px_rgba(220,38,38,0.28)]"
                : "border-white/10 bg-white/[0.07] text-slate-200 hover:border-blue-300 hover:bg-white/[0.12]"
            }`}
          >
            {SOURCE_PACKET_TYPE_LABELS[type]}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PacketTargetSelector({
  value,
  onChange,
}: {
  value: PacketTargetType;
  onChange: (value: PacketTargetType) => void;
}) {
  return (
    <label htmlFor={fieldId("targetType")} className="grid gap-1 text-sm font-black text-white">
      Target type
      <select
        id={fieldId("targetType")}
        value={value}
        onChange={(event) => onChange(event.target.value as PacketTargetType)}
        className="rounded-xl border border-white/15 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-500/30"
      >
        {PACKET_TARGET_TYPES.map((type) => (
          <option key={type} value={type}>
            {PACKET_TARGET_TYPE_LABELS[type]}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PacketSourceInput({
  value,
  onChange,
  onBlur,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}) {
  return (
    <label htmlFor={fieldId("sourceUrl")} className="grid gap-1 text-sm font-black text-white sm:col-span-2">
      Public source URL
      <input
        id={fieldId("sourceUrl")}
        type="url"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder="https://official-source-or-public-record.example"
        className="rounded-xl border border-white/15 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-blue-300 focus:ring-2 focus:ring-blue-500/30"
      />
    </label>
  );
}

export function PacketSafetyWarning({ warnings }: { warnings: string[] }) {
  if (!warnings.length) {
    return (
      <div className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-4 text-sm font-bold leading-6 text-emerald-100">
        <ShieldCheck className="mb-2 h-5 w-5" aria-hidden="true" />
        No obvious safety warnings in the draft. Human review is still required before RepWatchr labels it verified.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-300/40 bg-amber-400/10 p-4 text-sm font-bold leading-6 text-amber-100">
      <div className="flex items-center gap-2 text-amber-50">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        <span className="font-black uppercase tracking-wide">Safety warnings</span>
      </div>
      <ul className="mt-2 grid gap-1">
        {warnings.map((warning) => (
          <li key={warning}>- {warning}</li>
        ))}
      </ul>
    </div>
  );
}

export function PacketPreview({
  packet,
  generated,
}: {
  packet: ReturnType<typeof buildSourcePacket> | null;
  generated?: PacketApiResult | null;
}) {
  return (
    <aside className="lg:sticky lg:top-6">
      <div className="overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.08] shadow-[0_35px_120px_rgba(0,0,0,0.40)] backdrop-blur-xl">
        <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.38),transparent_34%),linear-gradient(135deg,rgba(239,68,68,0.24),rgba(2,6,23,0.95))] p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-100">Live packet preview</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-black text-white">Source-backed packet</h2>
            <div className="rounded-2xl border border-white/15 bg-black/25 px-3 py-2 text-right">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-300">Confidence</p>
              <p className="text-2xl font-black text-white">{packet?.confidence ?? 0}</p>
            </div>
          </div>
          {generated?.packetId ? (
            <p className="mt-2 text-xs font-bold text-slate-200">Packet ID: {generated.packetId}</p>
          ) : null}
        </div>
        <div className="grid gap-4 p-5">
          <PacketSafetyWarning warnings={packet?.safetyWarnings ?? []} />
          <textarea
            readOnly
            value={packet?.generatedMarkdown ?? "Choose a packet type, add a target, add one public URL, and summarize what the source appears to show. The clean packet will build here."}
            rows={22}
            className="min-h-[32rem] resize-none rounded-2xl border border-white/10 bg-slate-950/90 p-4 font-mono text-xs font-semibold leading-6 text-slate-100 outline-none"
            aria-label="Generated source packet preview"
          />
          {generated?.message ? (
            <p className="rounded-2xl border border-blue-300/20 bg-blue-400/10 p-3 text-sm font-bold leading-6 text-blue-100">
              {generated.message}
            </p>
          ) : null}
          {generated?.sourceReviewSubmissionId ? (
            <p className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-3 text-sm font-bold leading-6 text-emerald-100">
              Submitted for review. Submission ID: {generated.sourceReviewSubmissionId}
            </p>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

export function CopyPacketButton({
  packet,
  onCopied,
}: {
  packet: string;
  onCopied?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      disabled={!packet}
      onClick={async () => {
        await navigator.clipboard?.writeText(packet).catch(() => undefined);
        setCopied(true);
        onCopied?.();
        window.setTimeout(() => setCopied(false), 1400);
      }}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black uppercase tracking-wide text-slate-950 shadow-[0_16px_35px_rgba(255,255,255,0.15)] transition hover:-translate-y-0.5 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Clipboard className="h-4 w-4" aria-hidden="true" />
      {copied ? "Copied" : "Copy packet"}
    </button>
  );
}

export function SubmitPacketButton({
  disabled,
  submitting,
}: {
  disabled?: boolean;
  submitting?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled || submitting}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[0_18px_45px_rgba(220,38,38,0.35)] transition hover:-translate-y-0.5 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Send className="h-4 w-4" aria-hidden="true" />
      {submitting ? "Sending" : "Submit to review"}
    </button>
  );
}

export default function SourcePacketBuilder({ surface = "free_packet" }: { surface?: string }) {
  const [input, setInput] = useState<SourcePacketInput>(initialPacket);
  const [apiResult, setApiResult] = useState<PacketApiResult | null>(null);
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState<"generate" | "save" | "submit" | null>(null);

  useEffect(() => {
    void trackEvent("packet_builder_started", { surface });
  }, [surface]);

  const parsed = useMemo(() => sourcePacketInputSchema.safeParse(input), [input]);
  const preview = useMemo(() => (parsed.success ? buildSourcePacket(parsed.data) : null), [parsed]);
  const packetText = preview?.generatedMarkdown ?? apiResult?.generatedMarkdown ?? "";

  function update<K extends keyof SourcePacketInput>(key: K, value: SourcePacketInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function saveLocalPacket(result: PacketApiResult) {
    try {
      const saved = JSON.parse(window.localStorage.getItem("repwatchr.sourcePackets.v1") || "[]") as Array<Record<string, unknown>>;
      const next = [
        {
          id: result.packetId || `local_${Date.now()}`,
          title: input.title || input.targetName || "RepWatchr source packet",
          targetName: input.targetName,
          sourceUrl: input.sourceUrl,
          createdAt: new Date().toISOString(),
          packet: result.generatedMarkdown,
        },
        ...saved,
      ].slice(0, 30);
      window.localStorage.setItem("repwatchr.sourcePackets.v1", JSON.stringify(next));
    } catch {
      // Local backup is helpful but never required.
    }
  }

  async function callPacketApi(submitToReview: boolean) {
    const validated = sourcePacketInputSchema.safeParse(input);
    if (!validated.success) {
      setError(validated.error.issues[0]?.message ?? "Check the source packet fields.");
      return null;
    }

    setError("");
    setPendingAction(submitToReview ? "submit" : "save");
    try {
      const response = await fetch("/api/tools/source-packets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: validated.data,
          context: getFormAttribution(),
          submitToReview,
        }),
      });
      const data = (await response.json()) as PacketApiResult & { ok?: boolean; message?: string; errors?: string[] };
      if (!response.ok || data.ok === false) throw new Error(data.message || data.errors?.[0] || "Packet could not be generated.");
      setApiResult(data);
      saveLocalPacket(data);
      await trackEvent(submitToReview ? "packet_submitted" : "packet_saved", {
        packet_type: input.packetType,
        target_type: input.targetType,
        stored: Boolean(data.stored),
      });
      return data;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Packet could not be generated.");
      return null;
    } finally {
      setPendingAction(null);
    }
  }

  async function generatePreview() {
    const validated = sourcePacketInputSchema.safeParse(input);
    if (!validated.success) {
      setError(validated.error.issues[0]?.message ?? "Check the source packet fields.");
      return;
    }
    const generated = buildSourcePacket(validated.data);
    setApiResult({ ok: true, packetId: `preview_${getOrCreateAnonymousId().slice(-8)}`, stored: false, ...generated });
    await trackEvent("packet_generated", { packet_type: input.packetType, target_type: input.targetType, surface });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await callPacketApi(true);
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#050817] text-white shadow-[0_40px_140px_rgba(0,0,0,0.35)]">
      <div className="grid gap-8 p-4 sm:p-6 lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
        <form onSubmit={handleSubmit} className="grid content-start gap-5">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-200">Free source packet builder</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Turn one public source into a safe packet.
            </h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
              Use this when a public record, agenda, filing, article, vote, or video needs to become something voters can copy, inspect, and submit for review.
            </p>
          </div>

          <div className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 sm:grid-cols-2">
            <PacketTypeSelector
              value={input.packetType}
              onChange={(value) => {
                update("packetType", value);
                void trackEvent("packet_type_selected", { packet_type: value, surface });
              }}
            />
            <PacketTargetSelector value={input.targetType} onChange={(value) => update("targetType", value)} />
            <label htmlFor={fieldId("targetName")} className="grid gap-1 text-sm font-black text-white">
              Target name
              <input
                id={fieldId("targetName")}
                required
                value={input.targetName}
                onChange={(event) => update("targetName", event.target.value)}
                placeholder="Official, agency, race, board, court, story..."
                className="rounded-xl border border-white/15 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-blue-300 focus:ring-2 focus:ring-blue-500/30"
              />
            </label>
            <label htmlFor={fieldId("jurisdiction")} className="grid gap-1 text-sm font-black text-white">
              Jurisdiction
              <input
                id={fieldId("jurisdiction")}
                value={input.jurisdiction}
                onChange={(event) => update("jurisdiction", event.target.value)}
                placeholder="Texas, Gregg County, Longview ISD..."
                className="rounded-xl border border-white/15 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-blue-300 focus:ring-2 focus:ring-blue-500/30"
              />
            </label>
            <PacketSourceInput
              value={input.sourceUrl}
              onChange={(value) => update("sourceUrl", value)}
              onBlur={() => {
                if (input.sourceUrl.trim()) void trackEvent("packet_source_added", { packet_type: input.packetType, source_url_present: true });
              }}
            />
            <label htmlFor={fieldId("sourceTitle")} className="grid gap-1 text-sm font-black text-white">
              Source title
              <input
                id={fieldId("sourceTitle")}
                value={input.sourceTitle}
                onChange={(event) => update("sourceTitle", event.target.value)}
                placeholder="Agenda item, filing name, article headline..."
                className="rounded-xl border border-white/15 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-blue-300 focus:ring-2 focus:ring-blue-500/30"
              />
            </label>
            <label htmlFor={fieldId("sourceDate")} className="grid gap-1 text-sm font-black text-white">
              Source date
              <input
                id={fieldId("sourceDate")}
                type="date"
                value={input.sourceDate}
                onChange={(event) => update("sourceDate", event.target.value)}
                className="rounded-xl border border-white/15 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-500/30"
              />
            </label>
          </div>

          <div className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
            {[
              ["summary", "What this source appears to show", "State only what the source appears to show. Use dates and source context."],
              ["confirmed", "What is confirmed", "Name what the public source directly confirms, if anything."],
              ["claimLanguage", "What is not confirmed", "Say what still cannot be claimed from this source alone."],
              ["missingContext", "Missing context", "What additional public record would make this clearer?"],
              ["publicQuestion", "Public question", "A safe question voters, reporters, or residents can ask."],
            ].map(([key, label, placeholder]) => (
              <label key={key} htmlFor={fieldId(key)} className="grid gap-1 text-sm font-black text-white">
                {label}
                <textarea
                  id={fieldId(key)}
                  required={key === "summary"}
                  value={String(input[key as keyof SourcePacketInput] ?? "")}
                  onChange={(event) => update(key as keyof SourcePacketInput, event.target.value as never)}
                  rows={key === "summary" ? 5 : 3}
                  maxLength={key === "summary" ? 3000 : 2000}
                  placeholder={placeholder}
                  className="resize-none rounded-xl border border-white/15 bg-slate-950 px-3 py-3 text-sm font-semibold leading-6 text-white outline-none placeholder:text-slate-500 focus:border-blue-300 focus:ring-2 focus:ring-blue-500/30"
                />
              </label>
            ))}
            <label className="flex gap-3 rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm font-bold leading-6 text-amber-50">
              <input
                type="checkbox"
                checked={Boolean(input.consent)}
                onChange={(event) => update("consent", event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-amber-200 text-red-600 focus:ring-red-500"
              />
              This packet is for public-record review. I will not submit private home addresses, minor-child details, threats, doxxing, or unsupported criminal accusations.
            </label>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-300/40 bg-red-500/10 p-4 text-sm font-bold leading-6 text-red-100">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
            <button
              type="button"
              onClick={generatePreview}
              disabled={!parsed.success}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[0_18px_45px_rgba(37,99,235,0.35)] transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Generate preview
            </button>
            <button
              type="button"
              onClick={() => callPacketApi(false)}
              disabled={!parsed.success || pendingAction !== null}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.08] px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              {pendingAction === "save" ? "Saving" : "Save draft"}
            </button>
            <SubmitPacketButton disabled={!parsed.success || !input.consent || pendingAction !== null} submitting={pendingAction === "submit"} />
            <CopyPacketButton
              packet={packetText}
              onCopied={() => void trackEvent("packet_copied", { packet_type: input.packetType, surface })}
            />
            <button
              type="button"
              disabled={!packetText}
              onClick={() => downloadTextFile(`${safeFileName(input.title || input.targetName || "source-packet")}.md`, packetText)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download
            </button>
          </div>

          <div className="grid gap-3 rounded-[1.5rem] border border-blue-300/20 bg-blue-400/10 p-5 text-sm font-bold leading-6 text-blue-50 sm:grid-cols-3">
            <Link href="/auth/signup" onClick={() => void trackEvent("packet_account_prompt_clicked", { surface })} className="rounded-2xl bg-white px-4 py-3 text-center font-black uppercase tracking-wide text-slate-950 hover:bg-blue-50">
              Create free account
            </Link>
            <Link href="/dashboard/packets" className="rounded-2xl border border-blue-200/30 px-4 py-3 text-center font-black uppercase tracking-wide text-white hover:bg-white/10">
              Saved packets
            </Link>
            <Link href="/search" onClick={() => void trackEvent("packet_watch_clicked", { surface })} className="rounded-2xl border border-blue-200/30 px-4 py-3 text-center font-black uppercase tracking-wide text-white hover:bg-white/10">
              Watch related entity
            </Link>
          </div>
        </form>

        <PacketPreview packet={preview} generated={apiResult} />
      </div>
    </div>
  );
}
