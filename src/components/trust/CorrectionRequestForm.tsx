"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  CORRECTION_TYPES,
  buildCorrectionSummary,
  validatePublicContentSafety,
  type CorrectionType,
} from "@/lib/trust-safety";
import { getAttributionContext, getOrCreateAnonymousId, trackEvent } from "@/lib/analytics-client";
import RiskyContentWarning from "@/components/trust/RiskyContentWarning";

type CorrectionResponse = {
  ok: boolean;
  correctionId?: string;
  status?: string;
  message?: string;
  summary?: string;
};

export default function CorrectionRequestForm({
  entityType,
  entityId,
  entityName,
  url,
  currentText: initialCurrentText = "",
  onSubmitted,
}: {
  entityType: string;
  entityId: string;
  entityName?: string;
  url?: string;
  currentText?: string;
  onSubmitted?: () => void;
}) {
  const router = useRouter();
  const [correctionType, setCorrectionType] = useState<CorrectionType>("wrong official");
  const [currentText, setCurrentText] = useState(initialCurrentText);
  const [requestedCorrection, setRequestedCorrection] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [explanation, setExplanation] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const safety = useMemo(
    () =>
      validatePublicContentSafety([currentText, requestedCorrection, explanation].filter(Boolean).join(" "), {
        sourceUrl,
        label: correctionType === "unsourced claim" ? "Needs source" : "Under review",
      }),
    [correctionType, currentText, explanation, requestedCorrection, sourceUrl],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const attribution = getAttributionContext();
    const payload = {
      anonymousId: getOrCreateAnonymousId(),
      submitterName,
      submitterEmail,
      entityType,
      entityId,
      entityName,
      url: url || (typeof window !== "undefined" ? window.location.href : ""),
      correctionType,
      currentText,
      requestedCorrection,
      sourceUrl,
      explanation,
      sourceRoute: attribution.route,
      referrer: attribution.referrer,
      utm: {
        utm_source: attribution.utm_source,
        utm_medium: attribution.utm_medium,
        utm_campaign: attribution.utm_campaign,
        utm_term: attribution.utm_term,
        utm_content: attribution.utm_content,
      },
      honeypot,
    };

    try {
      const response = await fetch("/api/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => ({}))) as CorrectionResponse;
      if (!response.ok || !data.ok) {
        throw new Error(data.message || "The correction request could not be submitted.");
      }

      void trackEvent("correction_completed", {
        correction_id: data.correctionId ?? null,
        entity_type: entityType,
        entity_id: entityId,
        correction_type: correctionType,
      });
      onSubmitted?.();
      const params = new URLSearchParams({
        id: data.correctionId ?? "",
        status: data.status ?? "new",
        entityType,
      });
      router.push(`/corrections/thank-you?${params.toString()}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "The correction request could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">Target</p>
        <p className="mt-1 text-base font-black text-slate-950">
          {entityName || entityId}
          <span className="ml-2 text-sm font-bold text-slate-500">({entityType})</span>
        </p>
      </div>

      <label className="grid gap-1 text-sm font-black text-blue-950">
        What is wrong?
        <select
          value={correctionType}
          onChange={(event) => setCorrectionType(event.target.value as CorrectionType)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-800"
        >
          {CORRECTION_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm font-black text-blue-950">
        Current text or record being corrected
        <textarea
          value={currentText}
          onChange={(event) => setCurrentText(event.target.value)}
          rows={3}
          maxLength={3000}
          className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-800"
          placeholder="Paste only the public-facing text that needs correction. Do not include private addresses, minor-child details, or private contact information."
        />
      </label>

      <label className="grid gap-1 text-sm font-black text-blue-950">
        Requested correction
        <textarea
          value={requestedCorrection}
          onChange={(event) => setRequestedCorrection(event.target.value)}
          rows={4}
          required
          minLength={10}
          maxLength={3000}
          className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-800"
          placeholder="Explain the correction in plain English. RepWatchr reviewers will verify it before public changes."
        />
      </label>

      <label className="grid gap-1 text-sm font-black text-blue-950">
        Public source URL
        <input
          value={sourceUrl}
          onChange={(event) => setSourceUrl(event.target.value)}
          type="url"
          maxLength={500}
          className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-800"
          placeholder="https://..."
        />
      </label>

      <label className="grid gap-1 text-sm font-black text-blue-950">
        Extra context for reviewer
        <textarea
          value={explanation}
          onChange={(event) => setExplanation(event.target.value)}
          rows={3}
          maxLength={3000}
          className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-800"
          placeholder="What should the reviewer know? Keep it source-first and public-record safe."
        />
      </label>

      <RiskyContentWarning flags={safety.flags} suggestedLanguage={safety.suggestedLanguage} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-black text-blue-950">
          Name
          <input
            value={submitterName}
            onChange={(event) => setSubmitterName(event.target.value)}
            maxLength={120}
            className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-800"
            placeholder="Optional"
          />
        </label>
        <label className="grid gap-1 text-sm font-black text-blue-950">
          Email for follow-up
          <input
            value={submitterEmail}
            onChange={(event) => setSubmitterEmail(event.target.value)}
            type="email"
            maxLength={180}
            className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-800"
            placeholder="Optional"
          />
        </label>
      </div>

      <label className="sr-only">
        Leave this field blank
        <input value={honeypot} onChange={(event) => setHoneypot(event.target.value)} tabIndex={-1} autoComplete="off" />
      </label>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">{error}</p> : null}

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-xs font-black uppercase tracking-wide text-blue-800">Review summary</p>
        <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-blue-950">
          {buildCorrectionSummary({
            anonymousId: "",
            submitterName,
            submitterEmail: submitterEmail || null,
            entityType,
            entityId,
            entityName,
            url: url || null,
            correctionType,
            currentText,
            requestedCorrection: requestedCorrection || "Requested correction will appear here.",
            sourceUrl: sourceUrl || null,
            explanation,
            sourceRoute: "",
            referrer: "",
            utm: {},
            honeypot: "",
          })}
        </p>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[0_16px_35px_rgba(185,28,28,0.2)] transition hover:-translate-y-0.5 hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Submitting..." : "Submit correction request"}
      </button>
    </form>
  );
}
