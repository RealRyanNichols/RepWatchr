"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isTexasElectionDbSubmissionsEnabled } from "@/lib/supabase";

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

type TexasElectionContribution = {
  id: string;
  race_slug: string;
  race_title: string;
  contribution_type: string;
  title: string;
  summary: string;
  source_url: string;
  source_label: string | null;
  county: string | null;
  city: string | null;
  contact_email: string | null;
  status: string;
  visibility_status: string;
  created_at: string;
};

type TexasContributionStatus = "source_check" | "accepted" | "published" | "rejected";
type TexasContributionVisibility = "private_review" | "public_summary" | "held";

const texasElectionDbSubmissionsEnabled = isTexasElectionDbSubmissionsEnabled;

function fileNameFromPath(path: string) {
  return path.split("/").pop() ?? `${Date.now()}-profile-media`;
}

export default function AdminContentReviewClient() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [status, setStatus] = useState<ReviewStatus>("checking");
  const [content, setContent] = useState<PendingContent[]>([]);
  const [media, setMedia] = useState<PendingMedia[]>([]);
  const [texasSources, setTexasSources] = useState<TexasElectionContribution[]>([]);
  const [texasSourceNotice, setTexasSourceNotice] = useState("");
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

      setStatus("allowed");
      const [contentResult, mediaResult, texasSourceResult] = await Promise.all([
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
        texasElectionDbSubmissionsEnabled
          ? supabase
              .from("texas_election_contributions")
              .select(
                "id, race_slug, race_title, contribution_type, title, summary, source_url, source_label, county, city, contact_email, status, visibility_status, created_at"
              )
              .in("status", ["needs_review", "source_check"])
              .order("created_at", { ascending: true })
          : Promise.resolve({ data: null, error: null }),
      ]);

      setContent((contentResult.data ?? []) as PendingContent[]);
      setMedia((mediaResult.data ?? []) as PendingMedia[]);
      if (!texasElectionDbSubmissionsEnabled) {
        setTexasSources([]);
        setTexasSourceNotice("Texas election source queue is in packet mode because Supabase env vars are missing or the kill switch is set to false.");
      } else if (texasSourceResult.error) {
        setTexasSources([]);
        setTexasSourceNotice("Texas election source queue is enabled, but the database query failed. Check the table, Data API grants, and RLS policies.");
      } else {
        setTexasSources((texasSourceResult.data ?? []) as TexasElectionContribution[]);
        setTexasSourceNotice("");
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

  async function reviewTexasSource(
    item: TexasElectionContribution,
    nextStatus: TexasContributionStatus,
    nextVisibility: TexasContributionVisibility,
  ) {
    if (!user) return;
    setError("");
    setMessage("");

    const { error: updateError } = await supabase
      .from("texas_election_contributions")
      .update({
        status: nextStatus,
        visibility_status: nextVisibility,
        reviewer_notes: notes[item.id]?.trim() || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setTexasSources((current) => current.filter((row) => row.id !== item.id));
    setMessage(`Texas election source marked ${nextStatus}.`);
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
            Texas election sources ({texasSources.length})
          </h2>
          {texasSourceNotice ? (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
              {texasSourceNotice}
            </div>
          ) : null}
          <div className="mt-3 grid gap-4">
            {texasSources.length === 0 ? (
              <EmptyReview label="No Texas election sources are pending review." />
            ) : (
              texasSources.map((item) => (
                <article key={item.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
                      {item.contribution_type.replaceAll("_", " ")}
                    </span>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-800">
                      {item.race_title}
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-700">
                      {item.status}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-black text-gray-950">{item.title}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-gray-700">
                    {item.summary}
                  </p>
                  <div className="mt-4 grid gap-2 text-sm font-semibold text-gray-700 md:grid-cols-2">
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-black text-blue-700 hover:text-red-700"
                    >
                      {item.source_label || item.source_url}
                    </a>
                    <p>
                      {[item.city, item.county].filter(Boolean).join(", ") || "No local place supplied."}
                    </p>
                    {item.contact_email ? <p>{item.contact_email}</p> : null}
                    <Link
                      href={`/elections/texas/${item.race_slug}`}
                      className="font-black text-blue-700 hover:text-red-700"
                    >
                      Open race page
                    </Link>
                  </div>
                  <TexasSourceControls
                    value={notes[item.id] ?? ""}
                    onChange={(value) => setNotes((current) => ({ ...current, [item.id]: value }))}
                    onPublish={() => reviewTexasSource(item, "published", "public_summary")}
                    onAcceptPrivate={() => reviewTexasSource(item, "accepted", "private_review")}
                    onSourceCheck={() => reviewTexasSource(item, "source_check", "private_review")}
                    onReject={() => reviewTexasSource(item, "rejected", "held")}
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

function TexasSourceControls({
  value,
  onChange,
  onPublish,
  onAcceptPrivate,
  onSourceCheck,
  onReject,
}: {
  value: string;
  onChange: (value: string) => void;
  onPublish: () => void;
  onAcceptPrivate: () => void;
  onSourceCheck: () => void;
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
          onClick={onPublish}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700"
        >
          Publish summary
        </button>
        <button
          type="button"
          onClick={onAcceptPrivate}
          className="rounded-xl bg-blue-900 px-4 py-2 text-sm font-black text-white hover:bg-blue-800"
        >
          Accept private
        </button>
        <button
          type="button"
          onClick={onSourceCheck}
          className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-black text-amber-950 hover:bg-amber-400"
        >
          Source check
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
