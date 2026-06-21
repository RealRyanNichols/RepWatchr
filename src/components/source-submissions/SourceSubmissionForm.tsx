"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { trackRepWatchrEvent } from "@/lib/client-analytics";
import {
  buildClientSourcePacket,
  collectSourceAttribution,
  copyText,
  downloadTextFile,
  safeFileName,
  storeLatestSourceSubmission,
  type SourceSubmissionResponse,
} from "@/components/source-submissions/sourceSubmissionClient";

type SourceSubmissionFormProps = {
  defaultTarget?: string;
  defaultJurisdiction?: string;
  defaultSourceType?: string;
  defaultTargetType?: string;
  defaultTargetProfileId?: string;
  defaultTargetPageUrl?: string;
  compact?: boolean;
};

const sourceTypes = [
  { value: "official_record", label: "Official record" },
  { value: "agenda_minutes", label: "Agenda or minutes" },
  { value: "vote_record", label: "Vote record" },
  { value: "campaign_finance", label: "Campaign finance" },
  { value: "article", label: "Article or report" },
  { value: "video_clip", label: "Meeting or video clip" },
  { value: "roster", label: "Roster or directory" },
  { value: "correction", label: "Correction" },
  { value: "other", label: "Other public source" },
];

export default function SourceSubmissionForm({
  defaultTarget = "",
  defaultJurisdiction = "",
  defaultSourceType = "official_record",
  defaultTargetType = "public_record",
  defaultTargetProfileId = "",
  defaultTargetPageUrl = "",
  compact = false,
}: SourceSubmissionFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState(user?.email ?? "");
  const [targetName, setTargetName] = useState(defaultTarget);
  const [jurisdiction, setJurisdiction] = useState(defaultJurisdiction);
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceType, setSourceType] = useState(defaultSourceType);
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceDate, setSourceDate] = useState("");
  const [claimSummary, setClaimSummary] = useState("");
  const [checkRequest, setCheckRequest] = useState("");
  const [publicFlag, setPublicFlag] = useState(true);
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [backupPacket, setBackupPacket] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    window.setTimeout(() => {
      if (mounted) setSubmitterEmail((current) => current || user?.email || "");
    }, 0);

    return () => {
      mounted = false;
    };
  }, [user?.email]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = params.get("target");
    const jurisdictionParam = params.get("jurisdiction");
    const sourceTypeParam = params.get("type");
    let mounted = true;
    window.setTimeout(() => {
      if (!mounted) return;
      if (target) setTargetName(target);
      if (jurisdictionParam) setJurisdiction(jurisdictionParam);
      if (sourceTypeParam) setSourceType(sourceTypeParam);
    }, 0);

    return () => {
      mounted = false;
    };
  }, []);

  const canSubmit =
    targetName.trim() &&
    sourceUrl.trim().startsWith("http") &&
    claimSummary.trim() &&
    checkRequest.trim() &&
    acknowledged &&
    !submitting;

  function basePayload() {
    return {
      submitterName,
      submitterEmail,
      targetName,
      targetType: defaultTargetType,
      targetProfileId: defaultTargetProfileId,
      targetPageUrl: defaultTargetPageUrl || (typeof window !== "undefined" ? window.location.pathname : ""),
      jurisdiction,
      sourceUrl,
      sourceType,
      sourceTitle,
      sourceDate,
      claimSummary,
      checkRequest,
      publicFlag,
      ...collectSourceAttribution(),
      metadata: {
        intake: "source_submission_form",
      },
    };
  }

  async function submitSource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    const fallbackPacket = buildClientSourcePacket(basePayload());
    setSubmitting(true);
    setError("");
    setBackupPacket("");
    setCopied(false);
    trackRepWatchrEvent("source_submit_started", {
      source_type: sourceType,
      target_type: defaultTargetType,
      target_profile_id: defaultTargetProfileId || "",
    });

    try {
      const response = await fetch("/api/source-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(basePayload()),
      });
      const data = (await response.json().catch(() => null)) as SourceSubmissionResponse | null;

      if (response.ok && data?.submissionId) {
        const packet = data.packet || buildClientSourcePacket({ ...basePayload(), submissionId: data.submissionId });
        storeLatestSourceSubmission({
          submissionId: data.submissionId,
          packet,
          nextAction: data.nextAction || "Share the RepWatchr source form with another person who has a public record.",
          shareUrl: data.shareUrl || "https://www.repwatchr.com/submit-source",
          targetName: targetName.trim(),
          sourceUrl: sourceUrl.trim(),
          createdAt: new Date().toISOString(),
        });
        await copyText(packet);
        trackRepWatchrEvent("source_submit_completed", {
          source_type: sourceType,
          target_type: defaultTargetType,
          target_profile_id: defaultTargetProfileId || "",
          submission_id: data.submissionId,
        });
        router.push(`/submit-source/thanks?id=${encodeURIComponent(data.submissionId)}`);
        return;
      }

      const packet = data?.packet || fallbackPacket;
      setBackupPacket(packet);
      setError(data?.error || "The source queue is temporarily unavailable. Copy or download the packet and try again.");
      setCopied(await copyText(packet));
    } catch {
      setBackupPacket(fallbackPacket);
      setError("The source queue is temporarily unavailable. Copy or download the packet and try again.");
      setCopied(await copyText(fallbackPacket));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submitSource}
      className={`rounded-lg border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] ${compact ? "text-sm" : ""}`}
    >
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Source queue</p>
        <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">
          Submit one public record for review.
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
          Add the source, target, jurisdiction, date, and the exact question. RepWatchr reviews before anything becomes public.
        </p>
      </div>

      {error ? (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-black text-amber-950">{error}</p>
          {backupPacket ? (
            <div className="mt-3">
              <textarea
                readOnly
                value={backupPacket}
                rows={8}
                className="w-full resize-none rounded-lg border border-amber-200 bg-white px-3 py-3 text-xs font-semibold leading-5 text-slate-900"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => setCopied(await copyText(backupPacket))}
                  className="rounded-xl bg-blue-950 px-4 py-2 text-sm font-black uppercase tracking-wide text-white hover:bg-red-700"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={() => downloadTextFile(`${safeFileName(targetName)}.txt`, backupPacket)}
                  className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-black uppercase tracking-wide text-blue-950 hover:border-red-300 hover:text-red-700"
                >
                  Download
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Your name</span>
            <input
              value={submitterName}
              onChange={(event) => setSubmitterName(event.target.value)}
              maxLength={255}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Your email</span>
            <input
              type="email"
              value={submitterEmail}
              onChange={(event) => setSubmitterEmail(event.target.value)}
              maxLength={254}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Target official, agency, board, or race</span>
            <input
              value={targetName}
              onChange={(event) => setTargetName(event.target.value)}
              required
              maxLength={500}
              placeholder="Official, race, board, agency, filing, or issue"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Jurisdiction</span>
            <input
              value={jurisdiction}
              onChange={(event) => setJurisdiction(event.target.value)}
              maxLength={500}
              placeholder="Texas, Gregg County, Longview ISD, TX-1"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Source type</span>
            <select
              value={sourceType}
              onChange={(event) => setSourceType(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-bold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              {sourceTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Source title</span>
            <input
              value={sourceTitle}
              onChange={(event) => setSourceTitle(event.target.value)}
              maxLength={255}
              placeholder="Meeting agenda, vote record, article title, filing name"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Public source URL</span>
            <input
              type="url"
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              required
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Date of source</span>
            <input
              type="date"
              value={sourceDate}
              onChange={(event) => setSourceDate(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-slate-600">Claim or question summary</span>
          <textarea
            value={claimSummary}
            onChange={(event) => setClaimSummary(event.target.value)}
            required
            rows={4}
            maxLength={5000}
            placeholder="What does this source appear to show? Stick to names, dates, public roles, and what the record says."
            className="mt-1 w-full resize-none rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold leading-6 text-slate-950 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-slate-600">What needs to be checked</span>
          <textarea
            value={checkRequest}
            onChange={(event) => setCheckRequest(event.target.value)}
            required
            rows={4}
            maxLength={5000}
            placeholder="What should RepWatchr verify, attach, correct, compare, or add to a profile/race page?"
            className="mt-1 w-full resize-none rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold leading-6 text-slate-950 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </label>

        <label className="flex gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
          <input
            type="checkbox"
            checked={publicFlag}
            onChange={(event) => setPublicFlag(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-blue-500 text-blue-900 focus:ring-blue-800"
          />
          <span className="text-sm font-bold leading-6 text-blue-950">
            This is a public source that can be summarized after review. Keep my contact details private.
          </span>
        </label>

        <label className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-amber-500 text-blue-900 focus:ring-blue-800"
          />
          <span className="text-sm font-bold leading-6 text-amber-950">
            I am not submitting private addresses, minor children, threats, doxxing, sealed records, or unsourced allegations.
          </span>
        </label>

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-950 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {submitting ? "Submitting..." : "Submit Source"}
        </button>
      </div>
    </form>
  );
}
