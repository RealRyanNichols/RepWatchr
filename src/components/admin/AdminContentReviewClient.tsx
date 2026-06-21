"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";

type ReviewStatus = "checking" | "allowed" | "denied";

type PendingContent = {
  id: string;
  claim_id: string;
  user_id: string;
  profile_id: string;
  about_me: string | null;
  personal_statement: string | null;
  official_website: string | null;
  campaign_website: string | null;
  facebook_url: string | null;
  x_url: string | null;
  youtube_url: string | null;
  version: number;
  created_at: string;
};

type PendingMedia = {
  id: string;
  claim_id: string;
  user_id: string;
  profile_id: string;
  media_type: "headshot" | "photo" | "video";
  storage_bucket: string | null;
  storage_path: string | null;
  public_url: string | null;
  caption: string | null;
  credit: string | null;
  created_at: string;
};

type SourceSubmissionStatus =
  | "new"
  | "needs_review"
  | "verified"
  | "rejected"
  | "attached_to_profile"
  | "needs_more_info";

type SourceReviewAction = Exclude<SourceSubmissionStatus, "new">;

type SourceSubmission = {
  id: string;
  submitter_name: string | null;
  submitter_email: string | null;
  target_name: string;
  target_type: string | null;
  target_profile_id: string | null;
  target_page_url: string | null;
  jurisdiction: string | null;
  source_url: string;
  source_type: string;
  source_title: string | null;
  source_date: string | null;
  claim_summary: string;
  check_request: string | null;
  public_flag: boolean;
  status: SourceSubmissionStatus;
  created_at: string;
};

function fileNameFromPath(path: string) {
  return path.split("/").pop() ?? `${Date.now()}-profile-media`;
}

export default function AdminContentReviewClient() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [status, setStatus] = useState<ReviewStatus>("checking");
  const [content, setContent] = useState<PendingContent[]>([]);
  const [media, setMedia] = useState<PendingMedia[]>([]);
  const [sourceSubmissions, setSourceSubmissions] = useState<SourceSubmission[]>([]);
  const [sourceNotice, setSourceNotice] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    if (authLoading) return;

    if (!user) {
      window.setTimeout(() => {
        if (mounted) setStatus("denied");
      }, 0);
      return () => {
        mounted = false;
      };
    }

    async function loadReviewQueues() {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .in("role", ["admin", "reviewer"]);

      if (!mounted) return;

      if (!roles?.length) {
        setStatus("denied");
        return;
      }

      const isAdmin = roles.some((role) => role.role === "admin");
      setStatus("allowed");
      const [contentResult, mediaResult, sourceSubmissionResult] = await Promise.all([
        supabase
          .from("claimed_profile_content")
          .select(
            "id, claim_id, user_id, profile_id, about_me, personal_statement, official_website, campaign_website, facebook_url, x_url, youtube_url, version, created_at"
          )
          .eq("status", "pending_review")
          .order("created_at", { ascending: true }),
        supabase
          .from("profile_media")
          .select(
            "id, claim_id, user_id, profile_id, media_type, storage_bucket, storage_path, public_url, caption, credit, created_at"
          )
          .eq("status", "pending_review")
          .order("created_at", { ascending: true }),
        isAdmin
          ? supabase
              .from("source_submissions")
              .select(
                "id, submitter_name, submitter_email, target_name, target_type, target_profile_id, target_page_url, jurisdiction, source_url, source_type, source_title, source_date, claim_summary, check_request, public_flag, status, created_at"
              )
              .in("status", ["new", "needs_review", "needs_more_info"])
              .order("created_at", { ascending: true })
          : Promise.resolve({ data: null, error: null }),
      ]);

      setContent((contentResult.data ?? []) as PendingContent[]);
      setMedia((mediaResult.data ?? []) as PendingMedia[]);
      if (!isAdmin) {
        setSourceSubmissions([]);
        setSourceNotice("Source submissions are visible to admins only. Reviewer accounts can still handle claimed profile text and media.");
      } else if (sourceSubmissionResult.error) {
        setSourceSubmissions([]);
        setSourceNotice("Source submission queue query failed. Check the source_submissions table, Data API grants, and RLS policies.");
      } else {
        setSourceSubmissions((sourceSubmissionResult.data ?? []) as SourceSubmission[]);
        setSourceNotice("");
      }
    }

    loadReviewQueues();

    return () => {
      mounted = false;
    };
  }, [authLoading, supabase, user]);

  async function reviewContent(item: PendingContent, nextStatus: "approved" | "rejected") {
    if (!user) return;
    setError("");
    setMessage("");

    const { error: updateError } = await supabase
      .from("claimed_profile_content")
      .update({
        status: nextStatus,
        reviewer_notes: notes[item.id]?.trim() || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await supabase.from("profile_claim_audit").insert({
      claim_id: item.claim_id,
      actor_id: user.id,
      action: `content_${nextStatus}`,
      details: { content_id: item.id, reviewer_notes: notes[item.id]?.trim() || null },
    });

    setContent((current) => current.filter((row) => row.id !== item.id));
    setMessage(`Content ${nextStatus}.`);
  }

  async function reviewMedia(item: PendingMedia, nextStatus: "approved" | "rejected") {
    if (!user) return;
    setError("");
    setMessage("");

    let updatePayload: Record<string, string | null> = {
      status: nextStatus,
      reviewer_notes: notes[item.id]?.trim() || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    };

    if (
      nextStatus === "approved" &&
      item.storage_bucket === "profile-submissions" &&
      item.storage_path
    ) {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("profile-submissions")
        .download(item.storage_path);

      if (downloadError || !fileData) {
        setError(downloadError?.message ?? "Could not read pending media.");
        return;
      }

      const approvedPath = `${item.user_id}/${item.profile_id}/${item.id}-${fileNameFromPath(item.storage_path)}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-media-approved")
        .upload(approvedPath, fileData, { upsert: true });

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      updatePayload = {
        ...updatePayload,
        storage_bucket: "profile-media-approved",
        storage_path: approvedPath,
      };
    }

    const { error: updateError } = await supabase
      .from("profile_media")
      .update(updatePayload)
      .eq("id", item.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await supabase.from("profile_claim_audit").insert({
      claim_id: item.claim_id,
      actor_id: user.id,
      action: `media_${nextStatus}`,
      details: { media_id: item.id, reviewer_notes: notes[item.id]?.trim() || null },
    });

    setMedia((current) => current.filter((row) => row.id !== item.id));
    setMessage(`Media ${nextStatus}.`);
  }

  async function reviewSourceSubmission(item: SourceSubmission, nextStatus: SourceReviewAction) {
    if (!user) return;
    setError("");
    setMessage("");

    const note = notes[item.id]?.trim() || null;
    const reviewedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("source_submissions")
      .update({
        status: nextStatus,
        reviewer_id: user.id,
        reviewed_at: reviewedAt,
      })
      .eq("id", item.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    const { error: historyError } = await supabase.from("source_status_history").insert({
      submission_id: item.id,
      old_status: item.status,
      new_status: nextStatus,
      changed_by: user.id,
      note,
    });

    if (historyError) {
      setError(historyError.message);
      return;
    }

    if (note) {
      const { error: noteError } = await supabase.from("source_review_notes").insert({
        submission_id: item.id,
        reviewer_id: user.id,
        note,
        visibility: "internal",
      });

      if (noteError) {
        setError(noteError.message);
        return;
      }
    }

    const { error: eventError } = await supabase.from("source_submission_events").insert({
      submission_id: item.id,
      event_type: "status_changed",
      actor_user_id: user.id,
      actor_role: "admin",
      message: `Source submission marked ${nextStatus}.`,
      metadata: {
        old_status: item.status,
        new_status: nextStatus,
        reviewed_at: reviewedAt,
      },
    });

    if (eventError) {
      setError(eventError.message);
      return;
    }

    setSourceSubmissions((current) => current.filter((row) => row.id !== item.id));
    setMessage(`Source submission marked ${nextStatus.replaceAll("_", " ")}.`);
  }

  if (authLoading || status === "checking") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-black text-gray-950">Admin access required</h1>
        <p className="mt-2 text-sm font-semibold text-gray-600">
          Content review requires an admin or reviewer role in Supabase.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-red-700">
            Admin review
          </p>
          <h1 className="text-3xl font-black text-gray-950">Claimed content review</h1>
        </div>
        <Link
          href="/admin/claims"
          className="rounded-xl bg-blue-900 px-4 py-3 text-sm font-black text-white hover:bg-red-700"
        >
          Claim queue
        </Link>
      </div>

      {message ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
          {error}
        </div>
      ) : null}

      <section className="grid gap-5">
        <div>
          <h2 className="text-xl font-black text-gray-950">
            Source submissions ({sourceSubmissions.length})
          </h2>
          {sourceNotice ? (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
              {sourceNotice}
            </div>
          ) : null}
          <div className="mt-3 grid gap-4">
            {sourceSubmissions.length === 0 ? (
              <EmptyReview label="No source submissions are pending review." />
            ) : (
              sourceSubmissions.map((item) => (
                <article key={item.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
                      {item.source_type.replaceAll("_", " ")}
                    </span>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-800">
                      {item.target_name}
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-700">
                      {item.status}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-black text-gray-950">
                    {item.source_title || item.target_type || "Source submission"}
                  </h3>
                  <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-gray-700">
                    {item.claim_summary}
                  </p>
                  {item.check_request ? (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-amber-900">
                        What needs to be checked
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-amber-950">
                        {item.check_request}
                      </p>
                    </div>
                  ) : null}
                  <div className="mt-4 grid gap-2 text-sm font-semibold text-gray-700 md:grid-cols-2">
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-black text-blue-700 hover:text-red-700"
                    >
                      {item.source_title || item.source_url}
                    </a>
                    <p>
                      {item.jurisdiction || "No jurisdiction supplied."}
                    </p>
                    {item.source_date ? <p>Source date: {item.source_date}</p> : null}
                    {item.submitter_email ? <p>{item.submitter_email}</p> : null}
                    {item.target_page_url ? (
                      item.target_page_url.startsWith("/") ? (
                        <Link href={item.target_page_url} className="font-black text-blue-700 hover:text-red-700">
                          Open target page
                        </Link>
                      ) : (
                        <a
                          href={item.target_page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-black text-blue-700 hover:text-red-700"
                        >
                          Open target page
                        </a>
                      )
                    ) : null}
                  </div>
                  <SourceSubmissionControls
                    value={notes[item.id] ?? ""}
                    onChange={(value) => setNotes((current) => ({ ...current, [item.id]: value }))}
                    onVerify={() => reviewSourceSubmission(item, "verified")}
                    onAttach={() => reviewSourceSubmission(item, "attached_to_profile")}
                    onNeedsMoreInfo={() => reviewSourceSubmission(item, "needs_more_info")}
                    onNeedsReview={() => reviewSourceSubmission(item, "needs_review")}
                    onReject={() => reviewSourceSubmission(item, "rejected")}
                  />
                </article>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-black text-gray-950">
            Profile text ({content.length})
          </h2>
          <div className="mt-3 grid gap-4">
            {content.length === 0 ? (
              <EmptyReview label="No profile text is pending review." />
            ) : (
              content.map((item) => (
                <article key={item.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-800">
                      {item.profile_id}
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-700">
                      Revision {item.version}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <ReviewText title="About me" body={item.about_me} />
                    <ReviewText title="Personal statement" body={item.personal_statement} />
                  </div>
                  <div className="mt-4 grid gap-2 text-sm font-semibold text-gray-700 md:grid-cols-2">
                    {[item.official_website, item.campaign_website, item.facebook_url, item.x_url, item.youtube_url]
                      .filter(Boolean)
                      .map((url) => (
                        <a key={url} href={url!} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-red-700">
                          {url}
                        </a>
                      ))}
                  </div>
                  <ReviewControls
                    value={notes[item.id] ?? ""}
                    onChange={(value) => setNotes((current) => ({ ...current, [item.id]: value }))}
                    onApprove={() => reviewContent(item, "approved")}
                    onReject={() => reviewContent(item, "rejected")}
                  />
                </article>
              ))
            )}
          </div>
        </div>

        <div className="pt-5">
          <h2 className="text-xl font-black text-gray-950">
            Media ({media.length})
          </h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {media.length === 0 ? (
              <EmptyReview label="No media is pending review." />
            ) : (
              media.map((item) => (
                <article key={item.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-800">
                      {item.profile_id}
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-700">
                      {item.media_type}
                    </span>
                  </div>
                  <p className="mt-4 text-sm font-semibold leading-6 text-gray-700">
                    {item.caption ?? "No caption submitted."}
                  </p>
                  {item.credit ? (
                    <p className="mt-1 text-xs font-bold text-gray-500">
                      Credit: {item.credit}
                    </p>
                  ) : null}
                  {item.public_url ? (
                    <a
                      href={item.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex text-sm font-black text-blue-700 hover:text-red-700"
                    >
                      Open submitted URL
                    </a>
                  ) : item.storage_path ? (
                    <p className="mt-3 rounded-xl bg-gray-50 p-3 text-xs font-bold text-gray-600">
                      Pending storage: {item.storage_bucket}/{item.storage_path}
                    </p>
                  ) : null}
                  <ReviewControls
                    value={notes[item.id] ?? ""}
                    onChange={(value) => setNotes((current) => ({ ...current, [item.id]: value }))}
                    onApprove={() => reviewMedia(item, "approved")}
                    onReject={() => reviewMedia(item, "rejected")}
                  />
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function EmptyReview({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm font-semibold text-gray-600">
      {label}
    </div>
  );
}

function ReviewText({ title, body }: { title: string; body: string | null }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-gray-500">
        {title}
      </p>
      <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-gray-700">
        {body || "No text submitted."}
      </p>
    </div>
  );
}

function ReviewControls({
  value,
  onChange,
  onApprove,
  onReject,
}: {
  value: string;
  onChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="mt-5">
      <label className="block">
        <span className="text-sm font-black text-gray-700">Reviewer notes</span>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 text-sm font-semibold leading-6 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onApprove}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={onReject}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

function SourceSubmissionControls({
  value,
  onChange,
  onVerify,
  onAttach,
  onNeedsMoreInfo,
  onNeedsReview,
  onReject,
}: {
  value: string;
  onChange: (value: string) => void;
  onVerify: () => void;
  onAttach: () => void;
  onNeedsMoreInfo: () => void;
  onNeedsReview: () => void;
  onReject: () => void;
}) {
  return (
    <div className="mt-5">
      <label className="block">
        <span className="text-sm font-black text-gray-700">Reviewer notes</span>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 text-sm font-semibold leading-6 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onVerify}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700"
        >
          Verify
        </button>
        <button
          type="button"
          onClick={onAttach}
          className="rounded-xl bg-blue-900 px-4 py-2 text-sm font-black text-white hover:bg-blue-800"
        >
          Attach to profile
        </button>
        <button
          type="button"
          onClick={onNeedsMoreInfo}
          className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-black text-amber-950 hover:bg-amber-400"
        >
          Needs more info
        </button>
        <button
          type="button"
          onClick={onNeedsReview}
          className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-black text-gray-800 hover:border-blue-300 hover:text-blue-900"
        >
          Needs review
        </button>
        <button
          type="button"
          onClick={onReject}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
