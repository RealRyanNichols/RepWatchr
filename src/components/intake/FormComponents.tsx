"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics-client";
import { submitForm } from "@/lib/data-intake-client";
import type { FormKey, FormStatus } from "@/lib/data-intake";

export type IntakeField = {
  name: string;
  label: string;
  type?: "text" | "email" | "url" | "textarea" | "select" | "checkbox";
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: Array<{ label: string; value: string }>;
  rows?: number;
};

export function FormShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.10)]">
      <div className="h-1.5 bg-[linear-gradient(90deg,#bf0d3e_0%,#bf0d3e_33%,#ffffff_33%,#ffffff_66%,#002868_66%,#002868_100%)]" />
      <div className="p-5 sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-blue-950 sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700 sm:text-base">{description}</p>
        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}

export function FormStep({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-700">{label}</p>
      <h2 className="mt-1 text-lg font-black text-blue-950">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function SafeTextArea({
  label,
  value,
  onChange,
  required,
  placeholder,
  rows = 5,
  help,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  help?: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-black text-blue-950 sm:col-span-2">
      {label}
      <textarea
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        maxLength={5000}
        placeholder={placeholder}
        className="resize-none rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold leading-6 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
      />
      <span className="text-xs font-semibold leading-5 text-slate-500">
        {help || "Keep it source-safe. No threats, private addresses, minor-child details, or unsupported accusations."}
      </span>
    </label>
  );
}

export function SourceUrlInput({
  value,
  onChange,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm font-black text-blue-950">
      Public source URL
      <input
        type="url"
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://..."
        className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
      />
      <span className="text-xs font-semibold text-slate-500">Use official records, filings, agendas, videos, articles, or public pages.</span>
    </label>
  );
}

export function JurisdictionInput({
  value,
  onChange,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm font-black text-blue-950">
      Jurisdiction
      <input
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Texas, county, city, district, agency, board..."
        className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

export function EntityTargetInput({
  value,
  onChange,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm font-black text-blue-950">
      Target official, race, board, agency, or issue
      <input
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ted Cruz, TX Senate, Nacogdoches ISD, water vote..."
        className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

export function SubmissionStatusBadge({ status }: { status: string }) {
  const tone =
    status === "verified" || status === "attached_to_profile"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "rejected" || status === "archived"
        ? "border-slate-200 bg-slate-100 text-slate-700"
        : status === "needs_more_info" || status === "needs_review"
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-blue-200 bg-blue-50 text-blue-900";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${tone}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function UniversalIntakeForm({
  formKey,
  eyebrow,
  title,
  description,
  fields,
  submitLabel = "Submit",
  initialValues = {},
}: {
  formKey: FormKey;
  eyebrow: string;
  title: string;
  description: string;
  fields: IntakeField[];
  submitLabel?: string;
  initialValues?: Record<string, string | boolean>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string | boolean>>(() => ({
    consent: false,
    ...initialValues,
  }));
  const [state, setState] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");

  const packet = useMemo(() => buildPacketPreview(formKey, values), [formKey, values]);

  useEffect(() => {
    void trackEvent("form_started", { form_key: formKey });
    if (formKey === "submit_source") void trackEvent("source_submit_started", { form_key: formKey });
    if (formKey === "correction_request") void trackEvent("correction_submit_started", { form_key: formKey });
  }, [formKey]);

  function update(name: string, value: string | boolean) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function copyPacket() {
    await navigator.clipboard?.writeText(packet).catch(() => undefined);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setError("");

    try {
      const result = await submitForm(formKey, values);
      const key = result.submissionId || `${formKey}-${Date.now()}`;
      try {
        window.sessionStorage.setItem(`repwatchr.intakeSummary.${key}`, result.summary || packet);
        window.sessionStorage.setItem(`repwatchr.intakeNextAction.${key}`, result.nextAction || "");
      } catch {
        // The thank-you page can still load status from the server when storage is blocked.
      }
      router.push(result.thankYouPath || `/intake/thank-you?submission=${encodeURIComponent(key)}&form=${formKey}`);
    } catch (submitError) {
      setState("error");
      setError(submitError instanceof Error ? submitError.message : "The submission could not be sent.");
    }
  }

  return (
    <FormShell eyebrow={eyebrow} title={title} description={description}>
      <form onSubmit={onSubmit} className="grid gap-4">
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
        <FormStep label="Intake" title="Send the record in a format RepWatchr can review.">
          {fields.map((field) => (
            <FieldInput key={field.name} field={field} value={values[field.name]} onChange={(value) => update(field.name, value)} />
          ))}
        </FormStep>

        <label className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">
          <input
            required
            type="checkbox"
            checked={values.consent === true}
            onChange={(event) => update("consent", event.target.checked)}
            className="mt-1 h-4 w-4 shrink-0"
          />
          I understand this is public-record research and organization, not legal advice, private investigation, guaranteed publication, harassment, doxxing, or a place for unsupported accusations.
        </label>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800" role="alert">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={state === "submitting"}
            className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state === "submitting" ? "Submitting..." : submitLabel}
          </button>
          <button
            type="button"
            onClick={copyPacket}
            className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white"
          >
            Copy safe packet
          </button>
        </div>
      </form>
    </FormShell>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: IntakeField;
  value: string | boolean | undefined;
  onChange: (value: string | boolean) => void;
}) {
  if (field.name === "sourceUrl") return <SourceUrlInput required={field.required} value={String(value ?? "")} onChange={onChange} />;
  if (field.name === "jurisdiction") return <JurisdictionInput required={field.required} value={String(value ?? "")} onChange={onChange} />;
  if (field.name === "target") return <EntityTargetInput required={field.required} value={String(value ?? "")} onChange={onChange} />;
  if (field.type === "textarea") {
    return (
      <SafeTextArea
        label={field.label}
        required={field.required}
        value={String(value ?? "")}
        onChange={onChange}
        placeholder={field.placeholder}
        rows={field.rows}
        help={field.help}
      />
    );
  }
  if (field.type === "select") {
    return (
      <label className="grid gap-1 text-sm font-black text-blue-950">
        {field.label}
        <select
          required={field.required}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Select...</option>
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }
  return (
    <label className="grid gap-1 text-sm font-black text-blue-950">
      {field.label}
      <input
        type={field.type ?? "text"}
        required={field.required}
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
      />
      {field.help ? <span className="text-xs font-semibold text-slate-500">{field.help}</span> : null}
    </label>
  );
}

function buildPacketPreview(formKey: FormKey, values: Record<string, string | boolean>) {
  return [
    "RepWatchr intake packet",
    `Form: ${formKey}`,
    ...Object.entries(values)
      .filter(([key, value]) => key !== "companyWebsite" && value !== "" && value !== false)
      .map(([key, value]) => `${key}: ${String(value)}`),
    "",
    "Guardrail: public-record research only. No threats, doxxing, private home addresses, minor-child details, or unsupported accusations.",
  ].join("\n");
}

export function IntakeSuccessPage({ submissionId, formKey }: { submissionId?: string; formKey?: string }) {
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<FormStatus | string>("new");
  const [nextAction, setNextAction] = useState("Submit one more source or create a free account.");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!submissionId) return;
    try {
      const stored = window.sessionStorage.getItem(`repwatchr.intakeSummary.${submissionId}`);
      const storedNextAction = window.sessionStorage.getItem(`repwatchr.intakeNextAction.${submissionId}`);
      if (stored) setSummary(stored);
      if (storedNextAction) setNextAction(storedNextAction);
    } catch {
      // Server status fetch below can still fill the page.
    }

    fetch(`/api/forms/status/${encodeURIComponent(submissionId)}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!data?.ok) return;
        setSummary(data.summary || "");
        setStatus(data.submission?.status || "new");
        setNextAction((current) => data.nextAction || current);
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
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">Submission received</p>
        <h1 className="mt-2 text-3xl font-black text-blue-950 sm:text-5xl">The packet is in the queue.</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {submissionId ? (
            <span className="rounded-xl bg-white px-3 py-2 text-sm font-black text-blue-950">ID: {submissionId}</span>
          ) : null}
          <SubmissionStatusBadge status={status} />
          {formKey ? <span className="rounded-xl bg-white px-3 py-2 text-sm font-black text-slate-700">{formKey}</span> : null}
        </div>
        <p className="mt-4 text-sm font-bold leading-6 text-emerald-950">{nextAction}</p>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Safe copy/export summary</p>
            <h2 className="mt-1 text-xl font-black text-blue-950">Keep the receipt.</h2>
          </div>
          <button
            type="button"
            onClick={copySummary}
            className="rounded-xl bg-blue-950 px-4 py-2 text-sm font-black uppercase tracking-wide text-white hover:bg-red-700"
          >
            {copied ? "Copied" : "Copy summary"}
          </button>
        </div>
        <textarea
          readOnly
          rows={12}
          value={summary || "Submission accepted. The full safe packet will appear here when status data is available."}
          className="mt-4 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold leading-6 text-slate-900"
        />
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <NextActionCard href="/create-account" label="Create free account" detail="Save submissions and track statuses later." />
        <NextActionCard href="/submit-source" label="Submit another source" detail="Add the next missing public receipt." />
        <NextActionCard href="/officials" label="Watch an official" detail="Open a profile and track the record." />
      </section>
    </div>
  );
}

function NextActionCard({ href, label, detail }: { href: string; label: string; detail: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300">
      <p className="text-sm font-black text-blue-950">{label}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{detail}</p>
    </Link>
  );
}

export type AdminSubmission = {
  id: string;
  form_key: string;
  email: string | null;
  name: string | null;
  normalized_payload: Record<string, unknown> | null;
  status: string;
  priority: string;
  source_route: string | null;
  referrer: string | null;
  created_at: string;
  updated_at: string;
};

export function AdminSubmissionTable({
  submissions,
  selectedId,
  onSelect,
}: {
  submissions: AdminSubmission[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  if (!submissions.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-bold text-slate-600">
        Traffic data appears after visitors submit forms. Intake rows appear here after source, correction, package, contact, or research forms are connected.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-slate-200 bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wide text-white">
        <span>Submission</span>
        <span>Status</span>
        <span>Priority</span>
      </div>
      {submissions.map((submission) => (
        <button
          key={submission.id}
          type="button"
          onClick={() => onSelect(submission.id)}
          className={`grid w-full grid-cols-[1fr_auto_auto] gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-blue-50 ${
            selectedId === submission.id ? "bg-blue-50" : "bg-white"
          }`}
        >
          <span>
            <span className="block text-sm font-black text-blue-950">{submission.form_key.replace(/_/g, " ")}</span>
            <span className="mt-1 block text-xs font-semibold text-slate-600">
              {String(submission.normalized_payload?.target ?? submission.name ?? submission.email ?? submission.id)}
            </span>
            <span className="mt-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
              {new Date(submission.created_at).toLocaleString()}
            </span>
          </span>
          <SubmissionStatusBadge status={submission.status} />
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black uppercase tracking-wide text-slate-700">
            {submission.priority}
          </span>
        </button>
      ))}
    </div>
  );
}

export function AdminSubmissionDetail({
  submission,
  onStatusChange,
}: {
  submission: Record<string, unknown> | null;
  onStatusChange: (status: string, notes: string) => Promise<void>;
}) {
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStatus(String(submission?.status ?? "new"));
    setNotes(String(submission?.admin_notes ?? ""));
  }, [submission]);

  if (!submission) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-bold text-slate-600">
        Select a submission to review the payload, status history, source route, attribution, and internal notes.
      </div>
    );
  }

  async function save() {
    setSaving(true);
    await onStatusChange(status, notes);
    setSaving(false);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Admin review</p>
          <h2 className="mt-1 break-all text-xl font-black text-blue-950">{String(submission.id)}</h2>
        </div>
        <SubmissionStatusBadge status={String(submission.status)} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-black text-blue-950">
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold">
            {["new", "needs_review", "verified", "rejected", "needs_more_info", "attached_to_profile", "converted_to_packet", "converted_to_order", "archived"].map((item) => (
              <option key={item} value={item}>{item.replace(/_/g, " ")}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-black text-blue-950 sm:col-span-2">
          Internal notes
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold" />
        </label>
      </div>
      <button type="button" onClick={save} disabled={saving} className="mt-3 rounded-xl bg-blue-950 px-4 py-2 text-sm font-black uppercase tracking-wide text-white hover:bg-red-700 disabled:opacity-60">
        {saving ? "Saving..." : "Save status"}
      </button>

      <pre className="mt-5 max-h-[520px] overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-xs font-semibold leading-5 text-slate-100">
        {JSON.stringify(submission, null, 2)}
      </pre>
    </div>
  );
}
