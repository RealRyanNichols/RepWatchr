"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { trackEvent } from "@/lib/analytics-client";
import { submitSource } from "@/lib/source-submissions-client";
import {
  SOURCE_CONFIDENCES,
  SOURCE_REQUESTED_ACTIONS,
  SOURCE_STATUSES,
  SOURCE_TARGET_TYPES,
  SOURCE_TYPES,
} from "@/lib/source-submission-options";

type SourceValues = Record<string, string | boolean>;

export type SourceLinkRecord = {
  id?: string;
  entity_type?: string;
  entity_id?: string;
  source_url: string;
  source_title?: string | null;
  source_publisher?: string | null;
  source_type: string;
  source_date?: string | null;
  summary?: string | null;
  confidence?: string | null;
  status?: string | null;
};

export function SourceSubmissionForm({
  initialValues = {},
  compact = false,
}: {
  initialValues?: SourceValues;
  compact?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [values, setValues] = useState<SourceValues>(() => ({
    sourceUrl: "",
    targetType: "public official",
    targetName: "",
    jurisdiction: "",
    sourceType: "official website",
    requestedAction: "request review",
    publicPrivateFlag: "public_record",
    consent: false,
    ...initialValues,
  }));

  const packet = useMemo(() => buildClientSourcePacket(values), [values]);

  useEffect(() => {
    void trackEvent("source_submit_started", { surface: compact ? "embedded" : "page" });
  }, [compact]);

  function update(name: string, value: string | boolean) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function advance(nextStep: number) {
    setStep(nextStep);
    if (nextStep === 2) void trackEvent("source_url_entered", { source_url_present: Boolean(values.sourceUrl) });
    if (nextStep === 3) void trackEvent("source_target_type_selected", { target_type: values.targetType });
    if (nextStep === 4) void trackEvent("source_target_entered", { target_type: values.targetType, target_name: values.targetName });
    if (nextStep === 5) void trackEvent("source_packet_previewed", { target_type: values.targetType, source_type: values.sourceType });
  }

  async function copyPacket() {
    await navigator.clipboard?.writeText(packet).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const result = await submitSource(values);
      try {
        window.sessionStorage.setItem(`repwatchr.sourceSummary.${result.submissionId}`, result.summary || packet);
      } catch {
        // The success page can still fetch status from the server.
      }
      router.push(result.thankYouPath || `/sources/submitted?submission=${encodeURIComponent(result.submissionId)}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "The source could not be submitted.");
      setSubmitting(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.10)]">
      <div className="h-1.5 bg-[linear-gradient(90deg,#bf0d3e_0%,#bf0d3e_33%,#ffffff_33%,#ffffff_66%,#002868_66%,#002868_100%)]" />
      <div className="p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Source review</p>
            <h1 className={compact ? "mt-2 text-2xl font-black text-blue-950" : "mt-2 text-3xl font-black tracking-tight text-blue-950 sm:text-5xl"}>
              Submit one public source.
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              RepWatchr will queue this as <strong>Submitted Source - Under Review</strong>. It will not become verified public truth until review attaches it as a source link.
            </p>
          </div>
          <SourceStatusBadge status="new" label="Under Review" />
        </div>

        <form onSubmit={onSubmit} className="mt-6 grid gap-5">
          <input
            type="text"
            name="companyWebsite"
            tabIndex={-1}
            autoComplete="off"
            value={String(values.companyWebsite ?? "")}
            onChange={(event) => update("companyWebsite", event.target.value)}
            className="hidden"
            aria-hidden="true"
          />

          <StepFrame active={step === 1} label="Step 1" title="Paste the public source URL">
            <SourceUrlInput value={String(values.sourceUrl ?? "")} onChange={(value) => update("sourceUrl", value)} required />
            <StepButton disabled={!String(values.sourceUrl ?? "").startsWith("http")} onClick={() => advance(2)}>Next: target type</StepButton>
          </StepFrame>

          <StepFrame active={step === 2} label="Step 2" title="What does this source relate to?">
            <TargetEntitySelector value={String(values.targetType ?? "")} onChange={(value) => update("targetType", value)} />
            <StepButton onClick={() => advance(3)}>Next: target details</StepButton>
          </StepFrame>

          <StepFrame active={step === 3} label="Step 3" title="Name the target and jurisdiction">
            <TextInput label="Target name" value={String(values.targetName ?? "")} onChange={(value) => update("targetName", value)} required />
            <TextInput label="Office or agency" value={String(values.officeOrAgency ?? "")} onChange={(value) => update("officeOrAgency", value)} />
            <TextInput label="Jurisdiction" value={String(values.jurisdiction ?? "")} onChange={(value) => update("jurisdiction", value)} required />
            <TextInput label="State" value={String(values.state ?? "")} onChange={(value) => update("state", value)} placeholder="TX" />
            <TextInput label="County" value={String(values.county ?? "")} onChange={(value) => update("county", value)} />
            <TextInput label="City" value={String(values.city ?? "")} onChange={(value) => update("city", value)} />
            <StepButton disabled={!values.targetName || !values.jurisdiction} onClick={() => advance(4)}>Next: what it appears to show</StepButton>
          </StepFrame>

          <StepFrame active={step === 4} label="Step 4" title="Describe what the source appears to show">
            <SourceTypeSelector value={String(values.sourceType ?? "")} onChange={(value) => update("sourceType", value)} />
            <TextInput label="Source title" value={String(values.sourceTitle ?? "")} onChange={(value) => update("sourceTitle", value)} />
            <TextInput label="Source publisher" value={String(values.sourcePublisher ?? "")} onChange={(value) => update("sourcePublisher", value)} />
            <TextInput label="Source date" value={String(values.sourceDate ?? "")} onChange={(value) => update("sourceDate", value)} placeholder="YYYY-MM-DD" />
            <SafeSourceTextArea
              label="What the source appears to show"
              value={String(values.claimSummary ?? "")}
              onChange={(value) => update("claimSummary", value)}
              required
            />
            <SafeSourceTextArea
              label="Why it matters / what RepWatchr should review"
              value={String(values.whyItMatters ?? "")}
              onChange={(value) => update("whyItMatters", value)}
            />
            <label className="grid gap-1 text-sm font-black text-blue-950">
              Requested action
              <select
                value={String(values.requestedAction ?? "request review")}
                onChange={(event) => update("requestedAction", event.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              >
                {SOURCE_REQUESTED_ACTIONS.map((action) => <option key={action} value={action}>{action}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-black text-blue-950">
              Visibility
              <select
                value={String(values.publicPrivateFlag ?? "public_record")}
                onChange={(event) => update("publicPrivateFlag", event.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              >
                <option value="public_record">Public record</option>
                <option value="private_review">Private review only</option>
              </select>
            </label>
            <StepButton disabled={String(values.claimSummary ?? "").trim().length < 10} onClick={() => advance(5)}>Preview packet</StepButton>
          </StepFrame>

          <StepFrame active={step === 5} label="Step 5" title="Review the packet before it enters the queue">
            <SourcePacketPreview packet={packet} onCopy={copyPacket} copied={copied} />
            <TextInput label="Your name" value={String(values.submitterName ?? "")} onChange={(value) => update("submitterName", value)} />
            <TextInput label="Email for follow-up" type="email" value={String(values.submitterEmail ?? "")} onChange={(value) => update("submitterEmail", value)} />
            <label className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-700 sm:col-span-2">
              <input
                type="checkbox"
                checked={Boolean(values.consent)}
                onChange={(event) => update("consent", event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300"
                required
              />
              I understand this is a public-record review submission. No threats, doxxing, private addresses, minor-child details, or unsupported accusations.
            </label>
            {error ? <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800 sm:col-span-2">{error}</p> : null}
            <button
              type="submit"
              disabled={submitting || !values.consent}
              className="rounded-xl bg-blue-950 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
            >
              {submitting ? "Submitting..." : "Submit to review queue"}
            </button>
          </StepFrame>
        </form>
      </div>
    </section>
  );
}

function StepFrame({ active, label, title, children }: { active: boolean; label: string; title: string; children: React.ReactNode }) {
  return (
    <section className={`rounded-2xl border p-4 transition ${active ? "border-blue-200 bg-blue-50/40 shadow-sm" : "border-slate-200 bg-slate-50 opacity-75"}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-700">{label}</p>
      <h2 className="mt-1 text-lg font-black text-blue-950">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function StepButton({ disabled, onClick, children }: { disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
    >
      {children}
    </button>
  );
}

function TextInput({ label, value, onChange, required, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string; placeholder?: string }) {
  return (
    <label className="grid gap-1 text-sm font-black text-blue-950">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

export function SourceUrlInput({ value, onChange, required }: { value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="grid gap-1 text-sm font-black text-blue-950 sm:col-span-2">
      Public source URL
      <input
        type="url"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder="https://..."
        className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
      />
      <span className="text-xs font-semibold text-slate-500">Use official records, filings, agendas, videos, public databases, or named publications.</span>
    </label>
  );
}

export function SourceTypeSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-sm font-black text-blue-950">
      Source type
      <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100">
        {SOURCE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
      </select>
    </label>
  );
}

export function TargetEntitySelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-sm font-black text-blue-950 sm:col-span-2">
      Related target
      <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100">
        {SOURCE_TARGET_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
      </select>
    </label>
  );
}

function SafeSourceTextArea({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="grid gap-1 text-sm font-black text-blue-950 sm:col-span-2">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        rows={5}
        maxLength={5000}
        placeholder="Use appears to show. Keep it tied to what the source supports."
        className="resize-none rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold leading-6 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
      />
      <span className="text-xs font-semibold leading-5 text-slate-500">
        Do not include threats, private addresses, minor-child details, or unsupported criminal accusations.
      </span>
    </label>
  );
}

export function SourcePacketPreview({ packet, onCopy, copied }: { packet: string; onCopy?: () => void; copied?: boolean }) {
  return (
    <div className="sm:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Source packet preview</p>
        {onCopy ? (
          <button type="button" onClick={onCopy} className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-black uppercase tracking-wide text-blue-950 hover:border-red-300 hover:text-red-700">
            {copied ? "Copied" : "Copy packet"}
          </button>
        ) : null}
      </div>
      <textarea
        readOnly
        value={packet}
        rows={14}
        className="mt-3 w-full resize-none rounded-xl border border-slate-300 bg-slate-950 px-3 py-3 font-mono text-xs leading-5 text-slate-100 outline-none"
      />
    </div>
  );
}

export function SourceSubmissionSuccess({ submissionId }: { submissionId?: string }) {
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState("new");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!submissionId) return;
    try {
      const stored = window.sessionStorage.getItem(`repwatchr.sourceSummary.${submissionId}`);
      if (stored) setSummary(stored);
    } catch {
      // Server status fetch below can still fill the page.
    }
    fetch(`/api/sources/status/${encodeURIComponent(submissionId)}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!data?.ok) return;
        setStatus(data.submission?.status || "new");
        setSummary(data.summary || "");
      })
      .catch(() => undefined);
  }, [submissionId]);

  async function copySummary() {
    await navigator.clipboard?.writeText(summary).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-800">Submitted Source - Under Review</p>
        <h1 className="mt-2 text-3xl font-black text-blue-950 sm:text-5xl">The receipt is in the queue.</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {submissionId ? <span className="rounded-xl bg-white px-3 py-2 text-sm font-black text-blue-950">ID: {submissionId}</span> : null}
          <SourceStatusBadge status={status} label="Under Review" />
        </div>
        <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
          RepWatchr will not publish this as verified truth until review attaches it to a source trail.
        </p>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <ActionLink href="/sources/submit" label="Submit another source" />
        <ActionLink href="/create-account" label="Create account" />
        <ActionLink href="/officials" label="Watch this target" />
        <ActionLink href="/free-packet" label="Build packet" />
        <ActionLink href="/" label="Share RepWatchr" />
      </section>

      {summary ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-blue-950">Copyable source packet</h2>
            <button onClick={copySummary} className="rounded-xl border border-blue-200 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-950 hover:border-red-300 hover:text-red-700">
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <textarea readOnly value={summary} rows={16} className="mt-4 w-full resize-none rounded-xl border border-slate-300 bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-100" />
        </section>
      ) : null}
    </div>
  );
}

function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="grid min-h-16 place-items-center rounded-xl border border-blue-100 bg-white px-3 py-3 text-center text-xs font-black uppercase tracking-wide text-blue-950 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:text-red-700">
      {label}
    </Link>
  );
}

export function SourceStatusBadge({ status, label }: { status: string; label?: string }) {
  const tone =
    status === "verified" || status.startsWith("attached")
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "rejected" || status === "archived"
        ? "border-slate-200 bg-slate-100 text-slate-700"
        : status === "duplicate"
          ? "border-purple-200 bg-purple-50 text-purple-800"
          : "border-amber-200 bg-amber-50 text-amber-900";
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${tone}`}>
      {label || status.replace(/_/g, " ")}
    </span>
  );
}

export function SourceCard({ source, pending = false }: { source: SourceLinkRecord; pending?: boolean }) {
  return (
    <a href={source.source_url} target="_blank" rel="noreferrer" className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <SourceStatusBadge status={pending ? "needs_review" : source.status || "active"} label={pending ? "Submitted source under review" : source.confidence || "Source-linked"} />
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">{source.source_type}</span>
      </div>
      <h3 className="mt-3 text-base font-black text-blue-950">{source.source_title || source.source_url}</h3>
      {source.summary ? <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-slate-600">{source.summary}</p> : null}
      <p className="mt-3 text-xs font-black uppercase tracking-wide text-slate-500">
        {[source.source_publisher, source.source_date].filter(Boolean).join(" / ") || "Open source"}
      </p>
    </a>
  );
}

export function SourceTrail({ sources, pendingSources = [] }: { sources: SourceLinkRecord[]; pendingSources?: SourceLinkRecord[] }) {
  return (
    <section className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Source trail</p>
          <h2 className="mt-1 text-2xl font-black text-blue-950">Receipts attached to this record</h2>
        </div>
        <Link href="/sources/submit" className="rounded-xl bg-blue-950 px-4 py-2 text-xs font-black uppercase tracking-wide text-white hover:bg-red-700">
          Submit better source
        </Link>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {sources.map((source) => <SourceCard key={source.id || source.source_url} source={source} />)}
        {pendingSources.map((source) => <SourceCard key={`pending-${source.id || source.source_url}`} source={source} pending />)}
      </div>
      {!sources.length && !pendingSources.length ? (
        <div className="mt-5 rounded-xl border border-dashed border-blue-200 bg-white p-5 text-sm font-bold text-slate-600">
          No reviewed source links are attached yet. Submit one public source to start the trail.
        </div>
      ) : null}
    </section>
  );
}

export function ReportBrokenSourceButton({ sourceUrl, targetName = "Unknown target" }: { sourceUrl: string; targetName?: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function report() {
    setSubmitting(true);
    setError("");
    try {
      await submitSource({
        sourceUrl,
        targetType: "correction",
        targetName,
        jurisdiction: "Unknown / submitted from source trail",
        sourceType: "other",
        claimSummary: "This source appears to be broken, unreachable, stale, or needs review.",
        whyItMatters: "A broken source weakens the public receipt trail and should be checked by RepWatchr.",
        requestedAction: "report broken source",
        publicPrivateFlag: "public_record",
        consent: true,
      });
      setDone(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not report broken source.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-2">
      <button type="button" onClick={report} disabled={submitting || done} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-red-800 hover:bg-red-100 disabled:opacity-60">
        {done ? "Reported" : submitting ? "Reporting..." : "Report broken source"}
      </button>
      {error ? <p className="text-xs font-bold text-red-700">{error}</p> : null}
    </div>
  );
}

function buildClientSourcePacket(values: SourceValues) {
  return [
    "RepWatchr source packet",
    "Status: Submitted Source - Under Review",
    "",
    `Source URL: ${String(values.sourceUrl ?? "")}`,
    `Source type: ${String(values.sourceType ?? "")}`,
    `Source title: ${String(values.sourceTitle ?? "") || "Not supplied"}`,
    `Publisher: ${String(values.sourcePublisher ?? "") || "Not supplied"}`,
    `Source date: ${String(values.sourceDate ?? "") || "Not supplied"}`,
    "",
    `Target type: ${String(values.targetType ?? "")}`,
    `Target name: ${String(values.targetName ?? "")}`,
    `Office/agency: ${String(values.officeOrAgency ?? "") || "Not supplied"}`,
    `Jurisdiction: ${String(values.jurisdiction ?? "")}`,
    `State/county/city: ${[values.state, values.county, values.city].map((value) => String(value ?? "").trim()).filter(Boolean).join(" / ") || "Not supplied"}`,
    "",
    "What the source appears to show:",
    String(values.claimSummary ?? ""),
    "",
    "Why it matters / what needs review:",
    String(values.whyItMatters ?? "") || "Not supplied",
    "",
    `Requested action: ${String(values.requestedAction ?? "")}`,
    "Guardrail: this is not verified public truth until RepWatchr review attaches it as a source link.",
  ].join("\n");
}

export function AdminSourceQueue() {
  const { user, roles, loading } = useAuth();
  const [payload, setPayload] = useState<AdminSourcesPayload | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [selectedDetail, setSelectedDetail] = useState<AdminSourceDetail | null>(null);
  const [filters, setFilters] = useState({ status: "", sourceType: "", targetType: "", priority: "", q: "" });
  const [error, setError] = useState("");
  const isAdmin = roles.includes("admin");

  useEffect(() => {
    void trackEvent("admin_source_review_started", { route: "/admin/sources" });
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    void loadSources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, filters.status, filters.sourceType, filters.targetType, filters.priority]);

  async function loadSources() {
    setError("");
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const response = await fetch(`/api/admin/sources?${params.toString()}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to load source queue.");
      return;
    }
    setPayload(data as AdminSourcesPayload);
    const firstId = (data as AdminSourcesPayload).submissions[0]?.id;
    if (!selectedId && firstId) void selectSource(firstId);
  }

  async function selectSource(id: string) {
    setSelectedId(id);
    setSelectedDetail(null);
    const response = await fetch(`/api/admin/sources/${encodeURIComponent(id)}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to load source submission.");
      return;
    }
    setSelectedDetail(data as AdminSourceDetail);
  }

  async function applyAction(body: Record<string, unknown>) {
    if (!selectedId) return;
    const response = await fetch(`/api/admin/sources/${encodeURIComponent(selectedId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error || "Unable to update source.");
      return;
    }
    void trackEvent("admin_source_review_completed", {
      source_submission_id: selectedId,
      action: typeof body.action === "string" ? body.action : "status",
      status: typeof body.status === "string" ? body.status : undefined,
    });
    await selectSource(selectedId);
    await loadSources();
  }

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-12"><div className="h-72 animate-pulse rounded-2xl bg-slate-100" /></div>;
  if (!user) return <AdminAccessMessage title="Login required" body="The source review queue is admin-only." href="/auth/login" linkLabel="Log in" />;
  if (!isAdmin) return <AdminAccessMessage title="Admin role required" body="This route is blocked unless Supabase says your account has the admin role." href="/dashboard" linkLabel="Back to dashboard" />;

  return (
    <div className="rw-page-shell">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-2xl border border-slate-300 bg-slate-950 text-white shadow-sm">
          <div className="h-1.5 bg-[linear-gradient(90deg,#b42318_0%,#b42318_33%,#ffffff_33%,#ffffff_66%,#1d4ed8_66%,#1d4ed8_100%)]" />
          <div className="p-5 sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">Admin source review</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Source review queue</h1>
            <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-200 sm:text-base">
              User submissions stay under review here until a reviewer verifies, rejects, marks duplicate, requests more info, or attaches the source to an entity.
            </p>
            {payload ? <p className="mt-3 text-xs font-bold text-slate-400">Last refreshed {new Date(payload.generatedAt).toLocaleString()}</p> : null}
          </div>
        </section>

        {error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div> : null}

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Total" value={payload?.counts.total ?? 0} />
          <Metric label="New" value={payload?.counts.byStatus.new ?? 0} />
          <Metric label="Needs review" value={payload?.counts.byStatus.needs_review ?? 0} />
          <Metric label="Attached" value={(payload?.counts.byStatus.attached_to_profile ?? 0) + (payload?.counts.byStatus.attached_to_story ?? 0) + (payload?.counts.byStatus.attached_to_race ?? 0)} />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-5">
            <FilterSelect label="Status" value={filters.status} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} options={[...SOURCE_STATUSES]} />
            <FilterSelect label="Source type" value={filters.sourceType} onChange={(value) => setFilters((current) => ({ ...current, sourceType: value }))} options={[...SOURCE_TYPES]} />
            <FilterSelect label="Target type" value={filters.targetType} onChange={(value) => setFilters((current) => ({ ...current, targetType: value }))} options={[...SOURCE_TARGET_TYPES]} />
            <FilterSelect label="Priority" value={filters.priority} onChange={(value) => setFilters((current) => ({ ...current, priority: value }))} options={["low", "normal", "high", "urgent"]} />
            <label className="grid gap-1 text-sm font-black text-blue-950">
              Search URL/email/target
              <input value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} onBlur={loadSources} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold" />
            </label>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <AdminSourceTable submissions={payload?.submissions ?? []} selectedId={selectedId} onSelect={selectSource} />
          <AdminSourceReviewPanel detail={selectedDetail} onAction={applyAction} />
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-blue-950">{value.toLocaleString()}</p>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="grid gap-1 text-sm font-black text-blue-950">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold">
        <option value="">All</option>
        {options.map((option) => <option key={option} value={option}>{option.replace(/_/g, " ")}</option>)}
      </select>
    </label>
  );
}

type AdminSourceSubmission = {
  id: string;
  target_type: string;
  target_name: string | null;
  jurisdiction: string | null;
  source_url: string;
  source_type: string;
  claim_summary?: string | null;
  status: string;
  confidence: string;
  priority: string;
  created_at: string;
};

type AdminSourcesPayload = {
  generatedAt: string;
  submissions: AdminSourceSubmission[];
  counts: {
    total: number;
    byStatus: Record<string, number>;
    bySourceType: Record<string, number>;
    byTargetType: Record<string, number>;
    byPriority: Record<string, number>;
  };
};

type AdminSourceDetail = {
  submission: Record<string, unknown>;
  events: Array<Record<string, unknown>>;
  notes: Array<Record<string, unknown>>;
  links: Array<Record<string, unknown>>;
};

function AdminSourceTable({ submissions, selectedId, onSelect }: { submissions: AdminSourceSubmission[]; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <p className="text-xs font-black uppercase tracking-wide text-red-700">Queue</p>
        <h2 className="text-xl font-black text-blue-950">Submitted sources</h2>
      </div>
      <div className="max-h-[720px] overflow-auto">
        {submissions.map((submission) => (
          <button
            key={submission.id}
            onClick={() => onSelect(submission.id)}
            className={`block w-full border-b border-slate-100 p-4 text-left transition hover:bg-blue-50 ${selectedId === submission.id ? "bg-blue-50" : "bg-white"}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <SourceStatusBadge status={submission.status} />
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">{submission.priority}</span>
            </div>
            <p className="mt-2 text-sm font-black text-blue-950">{submission.target_name || "Unnamed target"}</p>
            <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-600">{submission.source_type} / {submission.jurisdiction || submission.target_type}</p>
            <p className="mt-2 truncate text-xs font-bold text-blue-700">{submission.source_url}</p>
          </button>
        ))}
        {!submissions.length ? <div className="p-5 text-sm font-bold text-slate-600">No source submissions match these filters.</div> : null}
      </div>
    </div>
  );
}

export function AdminSourceReviewPanel({ detail, onAction }: { detail: AdminSourceDetail | null; onAction: (body: Record<string, unknown>) => Promise<void> }) {
  const [status, setStatus] = useState("needs_review");
  const [confidence, setConfidence] = useState("needs_review");
  const [priority, setPriority] = useState("normal");
  const [note, setNote] = useState("");
  const [duplicateOf, setDuplicateOf] = useState("");
  const [entityType, setEntityType] = useState("official");
  const [entityId, setEntityId] = useState("");
  const [summary, setSummary] = useState("");

  useEffect(() => {
    const submission = detail?.submission;
    if (!submission) return;
    setStatus(String(submission.status || "needs_review"));
    setConfidence(String(submission.confidence || "needs_review"));
    setPriority(String(submission.priority || "normal"));
    setSummary(String(submission.claim_summary || ""));
  }, [detail]);

  if (!detail?.submission) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold text-slate-600">Select a source submission to review it.</p>
      </div>
    );
  }

  const submission = detail.submission;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-red-700">Review panel</p>
          <h2 className="mt-1 text-2xl font-black text-blue-950">{String(submission.target_name || "Unnamed target")}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">{String(submission.target_type)} / {String(submission.jurisdiction || "No jurisdiction")}</p>
        </div>
        <a href={String(submission.source_url)} target="_blank" rel="noreferrer" className="rounded-xl bg-blue-950 px-4 py-2 text-xs font-black uppercase tracking-wide text-white hover:bg-red-700">
          Open source
        </a>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">Appears to show</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{String(submission.claim_summary || "No summary supplied.")}</p>
        {submission.why_it_matters ? <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{String(submission.why_it_matters)}</p> : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <FilterSelect label="Status" value={status} onChange={setStatus} options={[...SOURCE_STATUSES]} />
        <FilterSelect label="Confidence" value={confidence} onChange={setConfidence} options={[...SOURCE_CONFIDENCES]} />
        <FilterSelect label="Priority" value={priority} onChange={setPriority} options={["low", "normal", "high", "urgent"]} />
      </div>
      <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder="Internal review note" className="mt-3 w-full resize-none rounded-xl border border-slate-300 p-3 text-sm font-semibold" />
      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        <button onClick={() => onAction({ status, confidence, priority, note })} className="rounded-xl bg-blue-950 px-4 py-3 text-xs font-black uppercase tracking-wide text-white hover:bg-red-700">Save status</button>
        <button onClick={() => onAction({ status: "verified", confidence: confidence === "needs_review" ? "source_backed" : confidence, priority, note })} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-emerald-800">Approve</button>
        <button onClick={() => onAction({ status: "needs_more_info", confidence, priority, note })} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-amber-900">More info</button>
        <button onClick={() => onAction({ status: "rejected", confidence: "rejected", priority, note })} className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-red-800">Reject</button>
      </div>

      <div className="mt-6 rounded-xl border border-purple-100 bg-purple-50 p-4">
        <p className="text-xs font-black uppercase tracking-wide text-purple-800">Duplicate</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input value={duplicateOf} onChange={(event) => setDuplicateOf(event.target.value)} placeholder="Duplicate source submission UUID" className="rounded-xl border border-purple-200 px-3 py-2 text-sm font-semibold" />
          <button onClick={() => onAction({ status: "duplicate", confidence, priority, duplicateOf, note })} className="rounded-xl border border-purple-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-purple-800">Mark duplicate</button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-xs font-black uppercase tracking-wide text-blue-800">Attach to source trail</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <TextInput label="Entity type" value={entityType} onChange={setEntityType} />
          <TextInput label="Entity ID / slug" value={entityId} onChange={setEntityId} />
          <label className="grid gap-1 text-sm font-black text-blue-950 sm:col-span-2">
            Public source summary
            <textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={4} className="resize-none rounded-xl border border-blue-200 p-3 text-sm font-semibold" />
          </label>
          <button onClick={() => onAction({ action: "attach", entityType, entityId, summary, confidence })} className="rounded-xl bg-blue-950 px-4 py-3 text-xs font-black uppercase tracking-wide text-white hover:bg-red-700 sm:col-span-2">
            Attach approved source
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <AdminList title="Review notes" rows={detail.notes} primaryKey="note" />
        <AdminList title="Audit events" rows={detail.events} primaryKey="event_type" />
      </div>
      {detail.links.length ? <AdminList title="Attached source links" rows={detail.links} primaryKey="entity_type" /> : null}
    </div>
  );
}

function AdminList({ title, rows, primaryKey }: { title: string; rows: Array<Record<string, unknown>>; primaryKey: string }) {
  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{title}</p>
      <div className="mt-3 space-y-2">
        {rows.map((row, index) => (
          <div key={String(row.id ?? index)} className="rounded-lg bg-white p-3 text-xs font-semibold leading-5 text-slate-600">
            <p className="font-black text-blue-950">{String(row[primaryKey] ?? "item")}</p>
            <p>{String(row.created_at ?? "")}</p>
          </div>
        ))}
        {!rows.length ? <p className="text-xs font-bold text-slate-500">No rows yet.</p> : null}
      </div>
    </div>
  );
}

function AdminAccessMessage({ title, body, href, linkLabel }: { title: string; body: string; href: string; linkLabel: string }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-black text-blue-950">{title}</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{body}</p>
        <Link href={href} className="mt-5 inline-flex rounded-xl bg-blue-950 px-4 py-2 text-sm font-black uppercase tracking-wide text-white hover:bg-red-700">
          {linkLabel}
        </Link>
      </div>
    </div>
  );
}
