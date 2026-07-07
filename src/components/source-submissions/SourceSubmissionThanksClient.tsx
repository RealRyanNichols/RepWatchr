"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  copyText,
  downloadTextFile,
  readLatestSourceSubmission,
  safeFileName,
  type StoredSourceSubmission,
} from "@/components/source-submissions/sourceSubmissionClient";
import ShareButtons from "@/components/shared/ShareButtons";
import SharePromptModal from "@/components/referrals/SharePromptModal";
import { recordReferralConversion } from "@/lib/referral-client";

export default function SourceSubmissionThanksClient({ submissionId }: { submissionId: string }) {
  const [stored, setStored] = useState<StoredSourceSubmission | null>(null);
  const [copied, setCopied] = useState(false);
  const shareUrl = stored?.shareUrl || "https://www.repwatchr.com/submit-source";
  const shareText = useMemo(
    () => `I submitted a public source to RepWatchr for review. Add your source here: ${shareUrl}`,
    [shareUrl]
  );

  useEffect(() => {
    let mounted = true;
    window.setTimeout(() => {
      if (mounted) setStored(readLatestSourceSubmission());
    }, 0);
    recordReferralConversion({
      eventType: "referral_source_submission",
      analyticsEvent: "referral_source_submission",
      route: "/submit-source/thanks",
      entityType: "source_submission",
      entityId: submissionId,
    });

    return () => {
      mounted = false;
    };
  }, [submissionId]);

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-green-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">Source received</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-blue-950">
            Your source is in the review queue.
          </h1>
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">Submission ID</p>
            <p className="mt-1 break-all font-mono text-lg font-black text-blue-950">
              {submissionId || stored?.submissionId || "Saved in this browser"}
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-blue-900">Next suggested action</p>
              <p className="mt-2 text-sm font-bold leading-6 text-blue-950">
                {stored?.nextAction || "Save the packet and send any additional public records through the same source form."}
              </p>
            </div>
            <div className="rounded-lg border border-red-100 bg-red-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-red-800">Share RepWatchr</p>
              <p className="mt-2 text-sm font-bold leading-6 text-red-950">
                Send the source form to someone else who has the receipt.
              </p>
              <button
                type="button"
                onClick={async () => setCopied(await copyText(shareText))}
                className="mt-3 rounded-xl bg-red-700 px-4 py-2 text-xs font-black uppercase tracking-wide text-white hover:bg-blue-950"
              >
                {copied ? "Share text copied" : "Copy share text"}
              </button>
            </div>
          </div>

          <div className="mt-5">
            <ShareButtons
              title={stored?.targetName ? `Source packet submitted: ${stored.targetName}` : "Submit a public source to RepWatchr"}
              description="Send RepWatchr a public source, correction, filing, vote, meeting clip, or missing record for review."
              path="/submit-source"
              template="missing_source"
              subject={stored?.targetName || "RepWatchr source submission"}
              sourceLabel={stored?.sourceUrl || "submitted public source"}
            />
          </div>

          <SharePromptModal
            moment="source_submitted"
            path="/submit-source"
            subject={stored?.targetName || "RepWatchr source submission"}
            topic="the missing public source"
            kind="source_gap"
            entityType="source_submission"
            entityId={submissionId}
            className="mt-5"
          />

          {stored?.packet ? (
            <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-blue-900">Copyable source packet</p>
                  <p className="mt-1 text-sm font-bold text-blue-950">
                    Keep this packet until review is complete.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={async () => setCopied(await copyText(stored.packet))}
                    className="rounded-xl bg-blue-950 px-4 py-2 text-xs font-black uppercase tracking-wide text-white hover:bg-red-700"
                  >
                    {copied ? "Copied" : "Copy packet"}
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadTextFile(`${safeFileName(stored.targetName)}.txt`, stored.packet)}
                    className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-950 hover:border-red-300 hover:text-red-700"
                  >
                    Download
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                value={stored.packet}
                rows={12}
                className="mt-4 w-full resize-none rounded-lg border border-blue-200 bg-white px-3 py-3 text-xs font-semibold leading-5 text-slate-900"
              />
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">
              The review ID is saved. If this page was opened in a new browser, the full packet may only be available from your previous tab.
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link
              href="/create-account"
              className="inline-flex justify-center rounded-xl bg-blue-950 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-red-700"
            >
              Create Free Account
            </Link>
            <Link
              href="/submit-source"
              className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:text-red-700"
            >
              Submit Another
            </Link>
            <Link
              href="/"
              className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:text-red-700"
            >
              Back To RepWatchr
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
