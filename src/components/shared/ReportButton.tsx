"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  buildClientSourcePacket,
  collectSourceAttribution,
  copyText,
  storeLatestSourceSubmission,
  type SourceSubmissionResponse,
} from "@/components/source-submissions/sourceSubmissionClient";

interface ReportButtonProps {
  officialId?: string;
  pageUrl: string;
  targetLabel?: string;
  jurisdiction?: string;
}

const reportTypes = [
  { value: "wrong-name", label: "Wrong name" },
  { value: "wrong-position", label: "Wrong position or title" },
  { value: "wrong-contact", label: "Wrong contact info" },
  { value: "wrong-party", label: "Wrong party affiliation" },
  { value: "wrong-score", label: "Wrong score or grade" },
  { value: "wrong-funding", label: "Wrong funding data" },
  { value: "outdated", label: "Info is outdated" },
  { value: "other", label: "Other issue" },
];

export default function ReportButton({
  officialId,
  pageUrl,
  targetLabel,
  jurisdiction,
}: ReportButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceDate, setSourceDate] = useState("");
  const [description, setDescription] = useState("");
  const [correction, setCorrection] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [packet, setPacket] = useState("");
  const [copied, setCopied] = useState(false);

  function payload() {
    const reportLabel = reportTypes.find((type) => type.value === reportType)?.label ?? reportType;
    return {
      submitterEmail: email.trim() || user?.email || "",
      targetName: targetLabel || officialId || pageUrl,
      targetType: "profile_correction",
      targetProfileId: officialId ?? "",
      targetPageUrl: pageUrl,
      jurisdiction: jurisdiction ?? "",
      sourceUrl,
      sourceType: "correction",
      sourceTitle: reportLabel,
      sourceDate,
      claimSummary: description,
      checkRequest: correction.trim() || `Review this ${reportLabel.toLowerCase()} report and verify the correct profile record.`,
      publicFlag: true,
      ...collectSourceAttribution(),
      metadata: {
        intake: "report_incorrect_info",
        report_type: reportType,
      },
    };
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!reportType || !description.trim() || !sourceUrl.trim().startsWith("http")) return;

    const fallbackPacket = buildClientSourcePacket(payload());
    setSubmitting(true);
    setError("");
    setPacket("");
    setCopied(false);

    try {
      const response = await fetch("/api/source-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      });
      const data = (await response.json().catch(() => null)) as SourceSubmissionResponse | null;

      if (response.ok && data?.submissionId) {
        const nextPacket = data.packet || buildClientSourcePacket({ ...payload(), submissionId: data.submissionId });
        storeLatestSourceSubmission({
          submissionId: data.submissionId,
          packet: nextPacket,
          nextAction: data.nextAction || "Save the packet and submit any other profile source through RepWatchr.",
          shareUrl: data.shareUrl || "https://www.repwatchr.com/submit-source",
          targetName: targetLabel || officialId || pageUrl,
          sourceUrl,
          createdAt: new Date().toISOString(),
        });
        await copyText(nextPacket);
        router.push(`/submit-source/thanks?id=${encodeURIComponent(data.submissionId)}`);
        return;
      }

      const nextPacket = data?.packet || fallbackPacket;
      setPacket(nextPacket);
      setError(data?.error || "The source queue is temporarily unavailable. Copy the packet and try again.");
      setCopied(await copyText(nextPacket));
    } catch {
      setPacket(fallbackPacket);
      setError("The source queue is temporarily unavailable. Copy the packet and try again.");
      setCopied(await copyText(fallbackPacket));
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        aria-label={`Submit a public source or correction${targetLabel ? ` for ${targetLabel}` : ""}`}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
        Submit source
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Submit Source Or Correction</h3>
        <button type="button" aria-label="Cancel source or correction submission" onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">
          Cancel
        </button>
      </div>

      {packet ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-bold text-amber-950">{error}</p>
          <textarea
            readOnly
            value={packet}
            rows={8}
            className="mt-3 w-full resize-none rounded-lg border border-amber-200 bg-white px-3 py-2 text-left text-xs font-semibold leading-5 text-slate-900"
          />
          <button
            type="button"
            onClick={async () => setCopied(await copyText(packet))}
            className="mt-2 rounded-lg bg-blue-950 px-3 py-2 text-xs font-black uppercase tracking-wide text-white hover:bg-red-700"
          >
            {copied ? "Copied" : "Copy packet"}
          </button>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-700">What needs review?</span>
          <select
            value={reportType}
            onChange={(event) => setReportType(event.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select an issue...</option>
            {reportTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-700">Public source URL</span>
          <input
            type="url"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            required
            placeholder="https://..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-700">Date of source</span>
          <input
            type="date"
            value={sourceDate}
            onChange={(event) => setSourceDate(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-700">Describe what is incorrect or missing</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
            rows={3}
            maxLength={5000}
            placeholder="Tell us what the record should show and what the source proves."
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-700">What should RepWatchr check?</span>
          <input
            type="text"
            value={correction}
            onChange={(event) => setCorrection(event.target.value)}
            placeholder="What should be attached, corrected, compared, or verified?"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>

        {!user ? (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-700">Your email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
        ) : null}

        {error && !packet ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting || !reportType || !description.trim() || !sourceUrl.trim().startsWith("http")}
          className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500"
        >
          {submitting ? "Submitting..." : "Submit for Review"}
        </button>

        <p className="text-center text-xs text-gray-400">
          Public records only. No private addresses, minor children, threats, doxxing, sealed records, or unsourced allegations.
        </p>
      </form>
    </div>
  );
}
