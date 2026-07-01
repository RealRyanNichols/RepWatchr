"use client";

import Link from "next/link";
import { CheckCircle2, Clipboard, Download, FileText, Mail, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getFormAttribution } from "@/lib/data-intake-client";
import { trackEvent } from "@/lib/analytics-client";
import {
  buildRecordsRequest,
  RECORD_REQUEST_TYPE_LABELS,
  RECORD_REQUEST_TYPES,
  recordsRequestInputSchema,
  type RecordsRequestInput,
  type RecordRequestType,
} from "@/lib/source-packet-tools";

type RecordsApiResult = ReturnType<typeof buildRecordsRequest> & {
  ok?: boolean;
  requestId?: string;
  stored?: boolean;
  message?: string;
  status?: string;
};

const disclaimer = "RepWatchr helps organize public-record research. This is not legal advice. Public-record laws and deadlines vary by jurisdiction.";

const initialRequest: RecordsRequestInput = {
  title: "",
  state: "Texas",
  jurisdiction: "",
  agency: "",
  recordType: "meeting_minutes",
  dateRangeStart: "",
  dateRangeEnd: "",
  subject: "",
  namesOrOffices: "",
  meetingOrEvent: "",
  preferredDelivery: "electronic delivery by email or public download link",
  requesterContact: "",
  notes: "",
  status: "draft",
  consent: false,
};

function downloadTextFile(fileName: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
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
    .slice(0, 90) || "repwatchr-public-records-request";
}

function inputClass() {
  return "rounded-xl border border-white/15 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-blue-300 focus:ring-2 focus:ring-blue-500/30";
}

function fieldId(name: string) {
  return `records_request_${name}`;
}

export function JurisdictionSelector({
  state,
  jurisdiction,
  onStateChange,
  onJurisdictionChange,
}: {
  state: string;
  jurisdiction: string;
  onStateChange: (value: string) => void;
  onJurisdictionChange: (value: string) => void;
}) {
  return (
    <>
      <label htmlFor={fieldId("state")} className="grid gap-1 text-sm font-black text-white">
        State
        <input
          id={fieldId("state")}
          required
          value={state}
          onChange={(event) => onStateChange(event.target.value)}
          className={inputClass()}
          placeholder="Texas"
        />
      </label>
      <label htmlFor={fieldId("jurisdiction")} className="grid gap-1 text-sm font-black text-white">
        Jurisdiction
        <input
          id={fieldId("jurisdiction")}
          value={jurisdiction}
          onChange={(event) => onJurisdictionChange(event.target.value)}
          className={inputClass()}
          placeholder="County, city, district, school board, court..."
        />
      </label>
    </>
  );
}

export function AgencyInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label htmlFor={fieldId("agency")} className="grid gap-1 text-sm font-black text-white">
      Agency or public body
      <input
        id={fieldId("agency")}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass()}
        placeholder="City secretary, county clerk, school district, sheriff, court clerk..."
      />
    </label>
  );
}

export function RecordTypeSelector({
  value,
  onChange,
}: {
  value: RecordRequestType;
  onChange: (value: RecordRequestType) => void;
}) {
  return (
    <label htmlFor={fieldId("recordType")} className="grid gap-1 text-sm font-black text-white">
      Record type
      <select
        id={fieldId("recordType")}
        value={value}
        onChange={(event) => onChange(event.target.value as RecordRequestType)}
        className={inputClass()}
      >
        {RECORD_REQUEST_TYPES.map((type) => (
          <option key={type} value={type}>
            {RECORD_REQUEST_TYPE_LABELS[type]}
          </option>
        ))}
      </select>
    </label>
  );
}

export function RecordsRequestStatusBadge({ status }: { status?: string }) {
  const clean = status || "draft";
  const tone =
    clean === "sent"
      ? "border-blue-300/30 bg-blue-400/10 text-blue-100"
      : clean === "response_received"
        ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
        : clean === "overdue" || clean === "denied"
          ? "border-amber-300/30 bg-amber-400/10 text-amber-100"
          : "border-white/15 bg-white/[0.07] text-slate-200";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${tone}`}>
      {clean.replace(/_/g, " ")}
    </span>
  );
}

export function RequestPreview({
  request,
  activeTab,
  onTabChange,
  apiResult,
}: {
  request: ReturnType<typeof buildRecordsRequest> | null;
  activeTab: "formal" | "email" | "followup" | "overdue" | "denial";
  onTabChange: (tab: "formal" | "email" | "followup" | "overdue" | "denial") => void;
  apiResult?: RecordsApiResult | null;
}) {
  const tabs = [
    ["formal", "Formal request"],
    ["email", "Short email"],
    ["followup", "Follow-up"],
    ["overdue", "Overdue"],
    ["denial", "Denial / clarify"],
  ] as const;
  const body =
    activeTab === "email"
      ? request?.shortEmailVersion
      : activeTab === "followup"
        ? request?.followupVersion
        : activeTab === "overdue"
          ? request?.overdueFollowupVersion
          : activeTab === "denial"
            ? request?.denialClarificationStarter
            : request?.generatedRequest;

  return (
    <aside className="lg:sticky lg:top-6">
      <div className="overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.08] shadow-[0_35px_120px_rgba(0,0,0,0.40)] backdrop-blur-xl">
        <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.28),transparent_36%),linear-gradient(135deg,rgba(37,99,235,0.30),rgba(2,6,23,0.95))] p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">Public records draft</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-2xl font-black text-white">Request package</h2>
            <RecordsRequestStatusBadge status={apiResult?.status} />
          </div>
          {apiResult?.requestId ? <p className="mt-2 text-xs font-bold text-slate-200">Request ID: {apiResult.requestId}</p> : null}
        </div>
        <div className="grid gap-4 p-5">
          <div className="flex flex-wrap gap-2">
            {tabs.map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                className={`rounded-full px-3 py-2 text-xs font-black uppercase tracking-wide transition ${
                  activeTab === tab ? "bg-white text-slate-950" : "border border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/[0.12]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {request?.safetyWarnings.length ? (
            <div className="rounded-2xl border border-amber-300/40 bg-amber-400/10 p-4 text-sm font-bold leading-6 text-amber-100">
              {request.safetyWarnings.map((warning) => (
                <p key={warning}>- {warning}</p>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-4 text-sm font-bold leading-6 text-emerald-100">
              <CheckCircle2 className="mb-2 h-5 w-5" aria-hidden="true" />
              No obvious safety warnings in the draft. Review jurisdiction rules before sending.
            </div>
          )}
          <textarea
            readOnly
            value={body ?? "Choose the agency, record type, date range, and subject. The request draft will build here."}
            rows={24}
            className="min-h-[34rem] resize-none rounded-2xl border border-white/10 bg-slate-950/90 p-4 font-mono text-xs font-semibold leading-6 text-slate-100 outline-none"
            aria-label="Generated public records request preview"
          />
          {apiResult?.message ? (
            <p className="rounded-2xl border border-blue-300/20 bg-blue-400/10 p-3 text-sm font-bold leading-6 text-blue-100">
              {apiResult.message}
            </p>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

export function CopyRequestButton({ text, eventName }: { text: string; eventName?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      disabled={!text}
      onClick={async () => {
        await navigator.clipboard?.writeText(text).catch(() => undefined);
        setCopied(true);
        void trackEvent("records_request_copied", { copy_type: eventName ?? "request" });
        window.setTimeout(() => setCopied(false), 1400);
      }}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black uppercase tracking-wide text-slate-950 shadow-[0_16px_35px_rgba(255,255,255,0.15)] transition hover:-translate-y-0.5 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Clipboard className="h-4 w-4" aria-hidden="true" />
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function SaveRequestButton({ disabled, saving }: { disabled?: boolean; saving?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled || saving}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[0_18px_45px_rgba(37,99,235,0.35)] transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <FileText className="h-4 w-4" aria-hidden="true" />
      {saving ? "Saving" : "Generate and save"}
    </button>
  );
}

export default function RecordsRequestBuilder({ surface = "public_records_request" }: { surface?: string }) {
  const [input, setInput] = useState<RecordsRequestInput>(initialRequest);
  const [apiResult, setApiResult] = useState<RecordsApiResult | null>(null);
  const [activeTab, setActiveTab] = useState<"formal" | "email" | "followup" | "overdue" | "denial">("formal");
  const [pending, setPending] = useState<"save" | "sent" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void trackEvent("records_request_started", { surface });
  }, [surface]);

  const parsed = useMemo(() => recordsRequestInputSchema.safeParse(input), [input]);
  const preview = useMemo(() => (parsed.success ? buildRecordsRequest(parsed.data) : null), [parsed]);
  const activeText =
    activeTab === "email"
      ? preview?.shortEmailVersion
      : activeTab === "followup"
        ? preview?.followupVersion
        : activeTab === "overdue"
          ? preview?.overdueFollowupVersion
          : activeTab === "denial"
            ? preview?.denialClarificationStarter
            : preview?.generatedRequest;

  function update<K extends keyof RecordsRequestInput>(key: K, value: RecordsRequestInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function saveLocalRequest(result: RecordsApiResult) {
    try {
      const saved = JSON.parse(window.localStorage.getItem("repwatchr.recordsRequests.v1") || "[]") as Array<Record<string, unknown>>;
      const next = [
        {
          id: result.requestId || `local_${Date.now()}`,
          title: input.title || input.subject || "Public records request",
          agency: input.agency,
          jurisdiction: input.jurisdiction || input.state,
          status: result.status || input.status,
          createdAt: new Date().toISOString(),
          generatedRequest: result.generatedRequest,
        },
        ...saved,
      ].slice(0, 30);
      window.localStorage.setItem("repwatchr.recordsRequests.v1", JSON.stringify(next));
    } catch {
      // Local backup is optional.
    }
  }

  async function saveRequest(markSent = false) {
    const validated = recordsRequestInputSchema.safeParse({
      ...input,
      status: markSent ? "sent" : input.status,
    });
    if (!validated.success) {
      setError(validated.error.issues[0]?.message ?? "Check the public-records request fields.");
      return null;
    }

    setError("");
    setPending(markSent ? "sent" : "save");
    try {
      const response = await fetch("/api/tools/records-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: validated.data,
          context: getFormAttribution(),
          markSent,
        }),
      });
      const data = (await response.json()) as RecordsApiResult & { message?: string; errors?: string[] };
      if (!response.ok || data.ok === false) throw new Error(data.message || data.errors?.[0] || "Request could not be saved.");
      setApiResult(data);
      saveLocalRequest(data);
      void trackEvent(markSent ? "records_request_status_changed" : "records_request_saved", {
        record_type: input.recordType,
        agency: input.agency,
        status: data.status || input.status,
        stored: Boolean(data.stored),
      });
      return data;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Request could not be saved.");
      return null;
    } finally {
      setPending(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveRequest(false);
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#050817] text-white shadow-[0_40px_140px_rgba(0,0,0,0.35)]">
      <div className="grid gap-8 p-4 sm:p-6 lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
        <form onSubmit={handleSubmit} className="grid content-start gap-5">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-200">Public records request generator</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Draft the request before the record disappears in confusion.
            </h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">{disclaimer}</p>
          </div>

          <div className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 sm:grid-cols-2">
            <JurisdictionSelector
              state={input.state}
              jurisdiction={input.jurisdiction ?? ""}
              onStateChange={(value) => update("state", value)}
              onJurisdictionChange={(value) => update("jurisdiction", value)}
            />
            <AgencyInput value={input.agency} onChange={(value) => update("agency", value)} />
            <RecordTypeSelector value={input.recordType} onChange={(value) => update("recordType", value)} />
            <label htmlFor={fieldId("dateRangeStart")} className="grid gap-1 text-sm font-black text-white">
              Date range start
              <input
                id={fieldId("dateRangeStart")}
                type="date"
                value={input.dateRangeStart}
                onChange={(event) => update("dateRangeStart", event.target.value)}
                className={inputClass()}
              />
            </label>
            <label htmlFor={fieldId("dateRangeEnd")} className="grid gap-1 text-sm font-black text-white">
              Date range end
              <input
                id={fieldId("dateRangeEnd")}
                type="date"
                value={input.dateRangeEnd}
                onChange={(event) => update("dateRangeEnd", event.target.value)}
                className={inputClass()}
              />
            </label>
          </div>

          <div className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
            <label htmlFor={fieldId("subject")} className="grid gap-1 text-sm font-black text-white">
              Subject
              <input
                id={fieldId("subject")}
                required
                value={input.subject}
                onChange={(event) => update("subject", event.target.value)}
                placeholder="Meeting vote, filing, policy, contract, public body, official, or issue"
                className={inputClass()}
              />
            </label>
            {[
              ["namesOrOffices", "Names/offices involved", "Officials, offices, staff, board members, committees, or public bodies involved."],
              ["meetingOrEvent", "Meeting/date/event", "Meeting date, agenda item, vote, event, filing, case, policy, or contract."],
              ["preferredDelivery", "Preferred delivery method", "Email, public link, portal upload, inspection appointment, or other."],
              ["requesterContact", "Requester contact info", "Name, email, or contact line you want on the outgoing request."],
              ["notes", "Notes", "Narrowing terms, known links, source context, or what you are trying to confirm."],
            ].map(([key, label, placeholder]) => (
              <label key={key} htmlFor={fieldId(key)} className="grid gap-1 text-sm font-black text-white">
                {label}
                <textarea
                  id={fieldId(key)}
                  value={String(input[key as keyof RecordsRequestInput] ?? "")}
                  onChange={(event) => update(key as keyof RecordsRequestInput, event.target.value as never)}
                  rows={key === "notes" ? 4 : 3}
                  maxLength={key === "notes" ? 3000 : 700}
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
                className="mt-1 h-4 w-4 rounded border-amber-200 text-blue-600 focus:ring-blue-500"
              />
              I understand this is a public-records research tool, not legal advice. I will review the draft before sending it.
            </label>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-300/40 bg-red-500/10 p-4 text-sm font-bold leading-6 text-red-100">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
            <SaveRequestButton disabled={!parsed.success || pending !== null} saving={pending === "save"} />
            <button
              type="button"
              disabled={!parsed.success || pending !== null}
              onClick={() => saveRequest(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[0_18px_45px_rgba(220,38,38,0.35)] transition hover:-translate-y-0.5 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {pending === "sent" ? "Marking" : "Mark sent"}
            </button>
            <CopyRequestButton text={activeText ?? ""} eventName={activeTab} />
            <button
              type="button"
              disabled={!activeText}
              onClick={() => downloadTextFile(`${safeFileName(input.title || input.subject || "public-records-request")}.txt`, activeText ?? "")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download
            </button>
            <a
              href={`mailto:?subject=${encodeURIComponent(`Public records request: ${input.subject || input.agency || "RepWatchr draft"}`)}&body=${encodeURIComponent(activeText ?? "")}`}
              onClick={() => void trackEvent("records_request_copied", { copy_type: "email_link" })}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white/[0.14]"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Open email
            </a>
          </div>

          <div className="grid gap-3 rounded-[1.5rem] border border-blue-300/20 bg-blue-400/10 p-5 text-sm font-bold leading-6 text-blue-50 sm:grid-cols-3">
            <Link href="/auth/signup" onClick={() => void trackEvent("records_request_account_prompt_clicked", { surface })} className="rounded-2xl bg-white px-4 py-3 text-center font-black uppercase tracking-wide text-slate-950 hover:bg-blue-50">
              Create free account
            </Link>
            <Link href="/dashboard/records-requests" className="rounded-2xl border border-blue-200/30 px-4 py-3 text-center font-black uppercase tracking-wide text-white hover:bg-white/10">
              Track requests
            </Link>
            <Link href="/tools/source-packet-builder" className="rounded-2xl border border-blue-200/30 px-4 py-3 text-center font-black uppercase tracking-wide text-white hover:bg-white/10">
              Build packet
            </Link>
          </div>
        </form>

        <RequestPreview request={preview} activeTab={activeTab} onTabChange={setActiveTab} apiResult={apiResult} />
      </div>
    </div>
  );
}
