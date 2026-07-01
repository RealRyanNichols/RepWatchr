"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { submitForm } from "@/lib/data-intake-client";

interface ReportButtonProps {
  officialId?: string;
  pageUrl: string;
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

export default function ReportButton({ officialId, pageUrl }: ReportButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState("");
  const [description, setDescription] = useState("");
  const [correction, setCorrection] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [packet, setPacket] = useState("");
  const [copied, setCopied] = useState(false);

  async function copyPacket(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function buildReportPacket() {
    const reportLabel = reportTypes.find((type) => type.value === reportType)?.label ?? reportType;
    return [
      "RepWatchr Source / Correction Packet",
      "",
      `Page: ${pageUrl}`,
      `Official ID: ${officialId ?? "Not supplied"}`,
      `Type: ${reportLabel}`,
      `Email: ${email.trim() || user?.email || "Not supplied"}`,
      "",
      "Description:",
      description.trim(),
      "",
      "Suggested correction:",
      correction.trim() || "Not supplied",
    ].join("\n");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reportType || !description.trim()) return;

    setSubmitting(true);
    setError("");
    setPacket("");
    setCopied(false);

    const nextPacket = buildReportPacket();
    setPacket(nextPacket);

    try {
      const result = await submitForm("correction_request", {
        pageUrl,
        officialId: officialId ?? "",
        issueType: reportType,
        description: description.trim(),
        suggestedCorrection: correction.trim(),
        email: email.trim() || user?.email || "",
        consent: true,
      });
      await copyPacket(result.summary || nextPacket);
      try {
        window.sessionStorage.setItem(`repwatchr.intakeSummary.${result.submissionId}`, result.summary || nextPacket);
        window.sessionStorage.setItem(`repwatchr.intakeNextAction.${result.submissionId}`, result.nextAction || "");
      } catch {
        // The thank-you page can still fetch status when storage is blocked.
      }
      router.push(result.thankYouPath || "/intake/thank-you?form=correction_request");
    } catch (submitError) {
      await copyPacket(nextPacket);
      setError(submitError instanceof Error ? submitError.message : "The correction packet could not be submitted.");
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
        <p className="text-sm font-semibold text-green-800">
          Correction packet ready.
        </p>
        <p className="text-xs text-green-600 mt-1">
          {copied ? "It was copied and saved in this browser." : "Copy the packet below and keep it for review."}
        </p>
        {packet ? (
          <textarea
            readOnly
            value={packet}
            rows={8}
            className="mt-3 w-full resize-none rounded-lg border border-green-200 bg-white px-3 py-2 text-left text-xs font-semibold leading-5 text-slate-900"
          />
        ) : null}
        {packet ? (
          <button
            type="button"
            onClick={() => copyPacket(packet)}
            className="mt-2 rounded-lg bg-green-700 px-3 py-2 text-xs font-black uppercase tracking-wide text-white hover:bg-green-800"
          >
            {copied ? "Copied" : "Copy packet"}
          </button>
        ) : null}
        <button
          onClick={() => {
            setSubmitted(false);
            setOpen(false);
            setReportType("");
            setDescription("");
            setCorrection("");
            setEmail("");
            setPacket("");
            setCopied(false);
          }}
          className="mt-2 text-xs text-green-700 underline"
        >
          Submit another report
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-red-50 hover:border-red-200 hover:text-red-600"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
        Report incorrect info
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-900">
          Report Incorrect Information
        </h3>
        <button
          onClick={() => setOpen(false)}
          className="text-gray-400 hover:text-gray-600 text-xs"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            What&apos;s wrong?
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select an issue...</option>
            {reportTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Describe what&apos;s incorrect
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            maxLength={5000}
            placeholder="Tell us what's wrong and what the correct info should be..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Suggested correction (optional)
          </label>
          <input
            type="text"
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
            placeholder="What should it say instead?"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {!user && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Your email (optional, for follow-up)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !reportType || !description.trim()}
          className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500"
        >
          {submitting ? "Working..." : "Submit correction"}
        </button>

        <p className="text-xs text-gray-400 text-center">
          Reports are stored as intake records and reviewed by the RepWatchr team.
        </p>
      </form>
    </div>
  );
}
