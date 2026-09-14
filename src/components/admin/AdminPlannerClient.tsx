"use client";

import { useCallback, useEffect, useState } from "react";
import type { SocialDraftRow } from "@/lib/social-planner";

/**
 * The review desk.
 *
 * Nothing here posts. Approving a draft marks it ready, and the existing
 * social cron picks approved drafts up on its next run. The separation is
 * deliberate: the act of approving and the act of publishing stay apart, so a
 * misclick is a queued post rather than a live one.
 */

const PLATFORM_LABEL: Record<string, string> = { x: "X", facebook: "Facebook" };

const SOURCE_LABEL: Record<string, string> = {
  daily_wire: "Daily wire",
  notion: "Notion",
  google_drive: "Google Drive",
  fieldy_lead: "Fieldy lead",
  x_trending: "X trending",
  manual: "Written by hand",
};

export default function AdminPlannerClient({ reviewerLabel }: { reviewerLabel: string }) {
  const [drafts, setDrafts] = useState<SocialDraftRow[]>([]);
  const [status, setStatus] = useState<"in_review" | "approved" | "rejected">("in_review");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [problems, setProblems] = useState<Record<string, string[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/planner?status=${status}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setError(payload.problems?.join(" ") || payload.error || "Could not load the planner.");
        setDrafts([]);
      } else {
        setDrafts(payload.drafts ?? []);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load the planner.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(draft: SocialDraftRow, decision: "approved" | "rejected") {
    setBusyId(draft.id);
    setProblems((current) => ({ ...current, [draft.id]: [] }));
    try {
      const response = await fetch("/api/admin/planner", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: draft.id,
          decision,
          body: edits[draft.id] ?? draft.body,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setProblems((current) => ({
          ...current,
          [draft.id]: payload.problems ?? [payload.error ?? "The review did not save."],
        }));
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {(["in_review", "approved", "rejected"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatus(value)}
            className={`rounded-full px-4 py-2 text-sm font-black transition ${
              status === value
                ? "bg-blue-950 text-white"
                : "border border-slate-300 bg-white text-slate-700 hover:border-blue-300"
            }`}
          >
            {value === "in_review" ? "Waiting on you" : value === "approved" ? "Approved" : "Killed"}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:border-blue-300"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-900">{error}</div>
      ) : null}

      {loading ? <p className="text-sm font-semibold text-slate-500">Loading the queue…</p> : null}

      {!loading && !error && drafts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-lg font-black text-slate-900">Nothing here.</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            {status === "in_review"
              ? "The scheduled run has not left anything for you, or you have cleared it."
              : "No drafts in this state."}
          </p>
        </div>
      ) : null}

      <div className="space-y-5">
        {drafts.map((draft) => {
          const body = edits[draft.id] ?? draft.body;
          const overLimit = draft.platform === "x" && body.length > 280;
          const draftProblems = problems[draft.id] ?? [];
          return (
            <article key={draft.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3">
                <span className="rounded-full bg-blue-950 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white">
                  {PLATFORM_LABEL[draft.platform] ?? draft.platform}
                </span>
                <span className="rounded-full border border-slate-300 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-600">
                  {SOURCE_LABEL[draft.source_kind] ?? draft.source_kind}
                </span>
                <span className="rounded-full border border-slate-300 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-600">
                  {draft.scope}
                </span>
                <span className="rounded-full border border-slate-300 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-600">
                  {draft.flavor}
                </span>
                {draft.requires_confirmation ? (
                  <span className="rounded-full bg-amber-200 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-amber-950">
                    Confirm before posting
                  </span>
                ) : null}
              </div>

              {draft.requires_confirmation ? (
                <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold leading-6 text-amber-950">
                  This came from a recorded conversation
                  {draft.conversation_participants.length
                    ? ` with ${draft.conversation_participants.join(", ")}`
                    : ""}
                  . The conversation is not the source and is not quoted. Read the public record below before you
                  approve, and consider whether anyone in that room would be surprised to see this posted.
                </div>
              ) : null}

              <div className="p-5">
                <textarea
                  value={body}
                  onChange={(event) => setEdits((current) => ({ ...current, [draft.id]: event.target.value }))}
                  rows={Math.max(5, body.split("\n").length + 1)}
                  className="w-full rounded-xl border border-slate-300 p-4 font-semibold leading-6 text-slate-900 focus:border-blue-500 focus:outline-none"
                  readOnly={draft.editorial_status !== "in_review"}
                />

                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <p className={`text-xs font-black ${overLimit ? "text-red-700" : "text-slate-500"}`}>
                    {body.length}
                    {draft.platform === "x" ? " / 280" : " characters"}
                  </p>
                  {draft.link_url ? (
                    <a
                      href={draft.link_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-black text-blue-700 underline"
                    >
                      Link in the post
                    </a>
                  ) : null}
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 p-4">
                  <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">The record behind it</p>
                  <ul className="mt-2 space-y-1">
                    {draft.source_links.map((link) => (
                      <li key={link.url}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-bold text-blue-700 underline underline-offset-2"
                        >
                          {link.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                  {draft.source_note ? (
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{draft.source_note}</p>
                  ) : null}
                </div>

                {draftProblems.length ? (
                  <ul className="mt-4 space-y-1 rounded-xl border border-red-200 bg-red-50 p-4">
                    {draftProblems.map((problem) => (
                      <li key={problem} className="text-sm font-semibold text-red-900">
                        {problem}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {draft.editorial_status === "in_review" ? (
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={busyId === draft.id || overLimit}
                      onClick={() => void review(draft, "approved")}
                      className="rounded-xl bg-blue-800 px-5 py-3 text-sm font-black text-white hover:bg-blue-900 disabled:opacity-50"
                    >
                      {busyId === draft.id ? "Saving…" : "Approve for posting"}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === draft.id}
                      onClick={() => void review(draft, "rejected")}
                      className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 hover:border-red-300 hover:text-red-700 disabled:opacity-50"
                    >
                      Kill it
                    </button>
                  </div>
                ) : (
                  <p className="mt-5 text-sm font-semibold text-slate-500">
                    {draft.editorial_status === "approved" ? "Approved" : "Killed"}
                    {draft.reviewed_by ? ` by ${draft.reviewed_by}` : ""}
                    {draft.publish_status === "posted" ? " · posted" : ""}
                    {draft.publish_status === "failed" ? ` · post failed: ${draft.post_error ?? "unknown"}` : ""}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <p className="mt-8 text-xs font-semibold text-slate-500">
        Reviewing as {reviewerLabel}. Approving queues a post for the next scheduled run. It does not post right now.
      </p>
    </div>
  );
}
