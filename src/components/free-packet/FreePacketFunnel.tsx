"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import {
  buildClientSourcePacket,
  collectSourceAttribution,
  copyText,
  downloadTextFile,
  safeFileName,
  storeLatestSourceSubmission,
  type SourceSubmissionResponse,
} from "@/components/source-submissions/sourceSubmissionClient";
import { trackRepWatchrEvent } from "@/lib/client-analytics";
import SharePromptModal from "@/components/referrals/SharePromptModal";
import { recordReferralConversion } from "@/lib/referral-client";
import SafeAIWriterButton from "@/components/ai-writing/SafeAIWriter";

type TargetType =
  | "official"
  | "race"
  | "school_board"
  | "vote"
  | "meeting"
  | "funding"
  | "red_flag"
  | "correction";

type FreePacketResponse = SourceSubmissionResponse & {
  emailCaptured?: boolean;
};

const targetTypes: Array<{ value: TargetType; label: string; checkRequest: string; sourceType: string }> = [
  {
    value: "official",
    label: "Official",
    sourceType: "official_record",
    checkRequest: "Check whether this source should be attached to an official profile and what record gaps remain.",
  },
  {
    value: "race",
    label: "Race",
    sourceType: "official_record",
    checkRequest: "Check whether this source belongs on a race page and what election records should be pulled next.",
  },
  {
    value: "school_board",
    label: "School board",
    sourceType: "agenda_minutes",
    checkRequest: "Check whether this source should be attached to a school-board page and what meeting records are missing.",
  },
  {
    value: "vote",
    label: "Vote",
    sourceType: "vote_record",
    checkRequest: "Check the vote, bill, date, source link, and score impact before publishing a claim.",
  },
  {
    value: "meeting",
    label: "Meeting",
    sourceType: "video_clip",
    checkRequest: "Check the meeting clip, agenda, minutes, timestamp, and missing public record before sharing.",
  },
  {
    value: "funding",
    label: "Funding",
    sourceType: "campaign_finance",
    checkRequest: "Check the donor, filing, finance source, jurisdiction, and relevance before attaching the funding trail.",
  },
  {
    value: "red_flag",
    label: "Red flag",
    sourceType: "other",
    checkRequest: "Check whether this is a confirmed record, public question, correction, or missing-source item.",
  },
  {
    value: "correction",
    label: "Correction",
    sourceType: "correction",
    checkRequest: "Check the correction request, source support, target page, and safer replacement wording.",
  },
];

function targetTypeLabel(value: TargetType) {
  return targetTypes.find((item) => item.value === value)?.label ?? "Public source";
}

export default function FreePacketFunnel() {
  const [email, setEmail] = useState("");
  const [targetType, setTargetType] = useState<TargetType>("official");
  const [targetName, setTargetName] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [consent, setConsent] = useState(true);
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submissionId, setSubmissionId] = useState("");
  const [packet, setPacket] = useState("");
  const [copied, setCopied] = useState(false);

  const selectedTargetType = targetTypes.find((item) => item.value === targetType) ?? targetTypes[0];

  const packetPreview = useMemo(
    () =>
      buildClientSourcePacket({
        submitterEmail: email,
        targetName: targetName || `${targetTypeLabel(targetType)} source packet`,
        targetType: `free_packet_${targetType}`,
        jurisdiction,
        sourceUrl,
        sourceType: selectedTargetType.sourceType,
        claimSummary: summary,
        checkRequest: selectedTargetType.checkRequest,
        publicFlag: true,
        metadata: {
          intake: "free_packet_funnel_preview",
        },
      }),
    [email, jurisdiction, selectedTargetType.checkRequest, selectedTargetType.sourceType, sourceUrl, summary, targetName, targetType],
  );

  function markStarted(nextTargetType = targetType) {
    if (started) return;
    setStarted(true);
    trackRepWatchrEvent("free_packet_started", { target_type: nextTargetType });
  }

  async function submitPacket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    markStarted();
    setSubmitting(true);
    setError("");
    setCopied(false);

    const payload = {
      email,
      targetType,
      targetName: targetName || `${targetTypeLabel(targetType)} source packet`,
      jurisdiction,
      sourceUrl,
      summary,
      consent,
      sourceType: selectedTargetType.sourceType,
      checkRequest: selectedTargetType.checkRequest,
      ...collectSourceAttribution(),
    };

    try {
      const response = await fetch("/api/free-packet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => null)) as FreePacketResponse | null;
      const nextPacket = data?.packet || packetPreview;

      if (!response.ok || !data?.submissionId) {
        setPacket(nextPacket);
        setError(data?.error || "The source queue is temporarily unavailable. Copy or download the packet and try again.");
        setCopied(await copyText(nextPacket));
        return;
      }

      setSubmissionId(data.submissionId);
      setPacket(nextPacket);
      setCopied(await copyText(nextPacket));
      storeLatestSourceSubmission({
        submissionId: data.submissionId,
        packet: nextPacket,
        nextAction: data.nextAction || "Create a free account so this packet can stay connected to your dashboard.",
        shareUrl: data.shareUrl || "https://www.repwatchr.com/free-packet",
        targetName: payload.targetName,
        sourceUrl,
        createdAt: new Date().toISOString(),
      });
      trackRepWatchrEvent("free_packet_completed", {
        target_type: targetType,
        submission_id: data.submissionId,
        email_captured: Boolean(data.emailCaptured),
      });
      if (data.emailCaptured) {
        trackRepWatchrEvent("email_captured", { source: "free_packet", target_type: targetType });
      }
      recordReferralConversion({
        eventType: "referral_packet_created",
        analyticsEvent: "referral_packet_created",
        route: "/free-packet",
        entityType: `free_packet_${targetType}`,
        entityId: data.submissionId,
        metadata: {
          target_type: targetType,
          email_captured: Boolean(data.emailCaptured),
        },
      });
    } catch {
      setPacket(packetPreview);
      setError("The source queue is temporarily unavailable. Copy or download the packet and try again.");
      setCopied(await copyText(packetPreview));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={submitPacket} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Free Source Packet Builder</p>
        <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">
          Send one public source into the record.
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
          Add a public URL and a plain-English summary. RepWatchr turns it into a clean packet and saves it to the review queue.
        </p>

        {error ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-950">
            {error}
          </div>
        ) : null}

        <div className="mt-5 grid gap-4">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Email</span>
            <input
              type="email"
              value={email}
              onFocus={() => markStarted()}
              onChange={(event) => setEmail(event.target.value)}
              required
              maxLength={254}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              placeholder="you@example.com"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-600">Target type</span>
              <select
                value={targetType}
                onFocus={() => markStarted()}
                onChange={(event) => {
                  const next = event.target.value as TargetType;
                  setTargetType(next);
                  markStarted(next);
                }}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-black text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                {targetTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-600">Target name</span>
              <input
                value={targetName}
                onFocus={() => markStarted()}
                onChange={(event) => setTargetName(event.target.value)}
                maxLength={500}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                placeholder="Official, race, board, agency, vote, or issue"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Jurisdiction</span>
            <input
              value={jurisdiction}
              onFocus={() => markStarted()}
              onChange={(event) => setJurisdiction(event.target.value)}
              maxLength={500}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              placeholder="Texas, Gregg County, Longview ISD, TX-1"
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Public source URL</span>
            <input
              type="url"
              value={sourceUrl}
              onFocus={() => markStarted()}
              onChange={(event) => setSourceUrl(event.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              placeholder="https://..."
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Summary</span>
            <textarea
              value={summary}
              onFocus={() => markStarted()}
              onChange={(event) => setSummary(event.target.value)}
              required
              rows={5}
              maxLength={5000}
              className="mt-1 w-full resize-none rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold leading-6 text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              placeholder="What does the public source appear to show? Stick to names, dates, offices, and what the record says."
            />
          </label>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
            <p className="text-xs font-black uppercase tracking-wide text-blue-900">Safe writing helper</p>
            <p className="mt-1 text-sm font-bold leading-6 text-blue-950">
              Draft a cautious packet summary. It will not publish or verify the source.
            </p>
            <div className="mt-3">
              <SafeAIWriterButton
                useCase="source_packet_summary"
                target={targetName || `${targetTypeLabel(targetType)} source packet`}
                topic={summary || selectedTargetType.checkRequest}
                sourceUrl={sourceUrl}
                existingText={summary}
                contextPayload={{
                  target_type: targetType,
                  target_name: targetName,
                  jurisdiction,
                  source_url_present: Boolean(sourceUrl),
                  check_request: selectedTargetType.checkRequest,
                }}
                buttonLabel="Draft safe summary"
                title="Draft a safe source packet summary"
                onInsert={setSummary}
                className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-black uppercase tracking-wide text-blue-950 hover:border-red-300 hover:text-red-700"
              />
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-blue-500 text-blue-900 focus:ring-blue-800"
            />
            <span className="text-sm font-bold leading-6 text-blue-950">
              Email me about this packet and RepWatchr source-review tools. Keep my contact details private.
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting || !email.trim() || !sourceUrl.trim().startsWith("http") || !summary.trim()}
            className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-950 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
          >
            {submitting ? "Building Packet..." : "Build Free Packet"}
          </button>
        </div>
      </form>

      <div className="grid content-start gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Packet output</p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">
                {submissionId ? `Submission ${submissionId}` : "Preview updates as you type."}
              </h2>
            </div>
            {submissionId ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-900">
                Saved to queue
              </span>
            ) : null}
          </div>
          <textarea
            readOnly
            value={packet || packetPreview}
            rows={17}
            className="mt-4 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 font-mono text-xs font-semibold leading-5 text-slate-900"
          />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={async () => setCopied(await copyText(packet || packetPreview))}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black uppercase tracking-wide text-blue-950 hover:border-red-300 hover:text-red-700"
            >
              {copied ? "Copied" : "Copy Packet"}
            </button>
            <button
              type="button"
              onClick={() => downloadTextFile(`${safeFileName(targetName || targetType)}-repwatchr-source-packet.txt`, packet || packetPreview)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black uppercase tracking-wide text-blue-950 hover:border-red-300 hover:text-red-700"
            >
              Download
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/auth/signup?next=/dashboard"
            onClick={() => trackRepWatchrEvent("account_prompt_clicked", { source: "free_packet" })}
            className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white"
          >
            <span className="block text-xs font-black uppercase tracking-wide text-blue-900">Next action</span>
            Create a free account and keep this packet in your dashboard.
          </Link>
          <Link
            href="/services/quick-record-check"
            onClick={() => trackRepWatchrEvent("upsell_clicked", { source: "free_packet", service_slug: "quick-record-check" })}
            className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-bold leading-6 text-red-950 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white"
          >
            <span className="block text-xs font-black uppercase tracking-wide text-red-800">Want RepWatchr to review it?</span>
            Upgrade to Quick Record Check for one focused source review.
          </Link>
        </div>

        {submissionId ? (
          <SharePromptModal
            moment="source_packet_created"
            path="/free-packet"
            subject={targetName || `${targetTypeLabel(targetType)} source packet`}
            topic="the public source packet"
            kind="packet"
            entityType={`free_packet_${targetType}`}
            entityId={submissionId}
          />
        ) : null}
      </div>
    </section>
  );
}
