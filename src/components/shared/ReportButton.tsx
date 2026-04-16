"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";

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
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState("");
  const [description, setDescription] = useState("");
  const [correction, setCorrection] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reportType || !description.trim()) return;

    setSubmitting(true);
    setError("");

    const { error: insertError } = await supabase.from("reports").insert({
      user_id: user?.id ?? null,
      official_id: officialId ?? null,
      page_url: pageUrl,
      report_type: reportType,
      description: description.trim(),
      suggested_correction: correction.trim() || null,
      email: email.trim() || null,
    });

    if (insertError) {
      setError(insertError.message);
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
          Thank you for reporting this.
        </p>
        <p className="text-xs text-green-600 mt-1">
          We&apos;ll review and correct it as soon as possible.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setOpen(false);
            setReportType("");
            setDescription("");
            setCorrection("");
            setEmail("");
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
          {submitting ? "Submitting..." : "Submit Report"}
        </button>

        <p className="text-xs text-gray-400 text-center">
          Reports are reviewed by the RepWatchr team and corrections are made as
          quickly as possible.
        </p>
      </form>
    </div>
  );
}
