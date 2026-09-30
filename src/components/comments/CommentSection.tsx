"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import { createClient } from "@/lib/supabase";
import { safeNextPath } from "@/lib/safe-next-path";
import { readCommentDraft, saveCommentDraft } from "@/lib/comment-drafts";

type CommentKind = "comment" | "question" | "official_answer" | "source_note";
type AuthorType =
  | "claimed_official"
  | "verified_parent"
  | "verified_resident"
  | "journalist"
  | "signed_in"
  | "anonymous";

interface Comment {
  id: string;
  content: string;
  display_name: string;
  county: string;
  created_at: string;
  user_id: string;
  comment_kind?: CommentKind;
  author_type?: AuthorType;
  rank_score?: number;
  contains_source?: boolean;
  source_url?: string | null;
  assurance_basis?: string | null;
}

interface CommentSectionProps {
  officialId: string;
  officialName: string;
  storyMode?: boolean;
  targetPath?: string;
}

const CORE_COMMENT_FIELDS = "id, content, display_name, county, created_at, user_id";
const ENHANCED_COMMENT_FIELDS = `${CORE_COMMENT_FIELDS}, comment_kind, author_type, rank_score, contains_source, source_url, assurance_basis`;

function cleanMetadataName(user: { user_metadata?: Record<string, unknown> } | null): string | null {
  if (!user) return null;

  for (const key of ["display_name", "full_name", "name", "user_name", "preferred_username"]) {
    const value = user.user_metadata?.[key];
    if (typeof value !== "string") continue;
    const cleaned = value.trim().replace(/\s+/g, " ").slice(0, 50);
    if (cleaned) return cleaned;
  }

  return null;
}

function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function isMissingEnhancedColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    message.includes("does not exist") ||
    message.includes("schema cache")
  );
}

function commentKindLabel(kind: CommentKind | undefined): string {
  if (kind === "question") return "Public question";
  if (kind === "official_answer") return "Official answer";
  if (kind === "source_note") return "Source note";
  return "Comment";
}

function authorTypeLabel(authorType: AuthorType | undefined, county: string): string {
  if (authorType === "claimed_official") return "Verified official";
  if (authorType === "verified_parent") return "Verified parent";
  if (authorType === "verified_resident") return "Verified resident";
  if (authorType === "journalist") return "Journalist profile";
  return county === "Anonymous" ? "Anonymous profile" : "Signed-in profile";
}

export default function CommentSection({
  officialId,
  officialName,
  storyMode = false,
  targetPath,
}: CommentSectionProps) {
  const { user, profile, loading: authLoading } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [commentKind, setCommentKind] = useState<CommentKind>("comment");
  const [sourceUrl, setSourceUrl] = useState("");
  const [enhancedSchemaAvailable, setEnhancedSchemaAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [draftStored, setDraftStored] = useState(false);
  const userId = user?.id ?? null;
  const returnPath = safeNextPath(targetPath ?? `/officials/${officialId}#participate`);
  const authQuery = `?next=${encodeURIComponent(returnPath)}`;
  const supabase = useMemo(() => createClient(), []);
  const authorTier = profile?.residenceVerified
    ? "Verified resident"
    : profile?.personVerified
      ? "Verified person · residence not verified"
      : profile?.paidAccount
        ? "Paid account · identity and residence not verified"
        : "Signed-in account · identity and residence not verified";
  const defaultDisplayName =
    cleanMetadataName(user) || (profile?.county ? `${profile.county} Resident` : "Anonymous profile");

  useEffect(() => {
    if (authLoading) return;
    const timer = window.setTimeout(() => {
      try {
        const draft = readCommentDraft(window.sessionStorage, officialId, userId);
        setNewComment(draft);
        setDraftStored(Boolean(draft));
      } catch { setDraftStored(false); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [authLoading, officialId, userId]);

  function updateComment(value: string) {
    setNewComment(value);
    try {
      saveCommentDraft(window.sessionStorage, officialId, userId, value);
      setDraftStored(Boolean(value.trim()));
    } catch { setDraftStored(false); }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadComments() {
      setLoading(true);

      const enhancedResult = await supabase
        .from("comments")
        .select(ENHANCED_COMMENT_FIELDS)
        .eq("official_id", officialId)
        .neq("visibility_status", "removed_illegal")
        .order("rank_score", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);

      if (cancelled) return;

      if (!enhancedResult.error) {
        setEnhancedSchemaAvailable(true);
        setComments((enhancedResult.data ?? []) as Comment[]);
        setLoading(false);
        return;
      }

      if (!isMissingEnhancedColumn(enhancedResult.error)) {
        setError("Discussion could not be loaded. Please try again.");
        setLoading(false);
        return;
      }
      // Some existing deployments predate evidence-ranking columns. Keep the
      // core discussion usable there, and only reveal sourced modes when the
      // expanded comments schema is confirmed by Supabase.
      const fallbackResult = await supabase
        .from("comments")
        .select(CORE_COMMENT_FIELDS)
        .eq("official_id", officialId)
        .neq("visibility_status", "removed_illegal")
        .order("created_at", { ascending: false })
        .limit(50);

      if (cancelled) return;
      setEnhancedSchemaAvailable(false);
      setComments((fallbackResult.data ?? []) as Comment[]);
      if (fallbackResult.error) setError("Discussion could not be loaded. Please try again.");
      setLoading(false);
    }

    void loadComments();
    return () => {
      cancelled = true;
    };
  }, [officialId, supabase]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    const trimmed = newComment.trim();
    if (!trimmed) return;
    if (trimmed.length > 2000) {
      setError("Comment must be under 2000 characters.");
      return;
    }

    const name = displayName.trim() || defaultDisplayName;
    const normalizedSourceUrl = sourceUrl.trim() ? safeHttpUrl(sourceUrl.trim()) : null;
    if (sourceUrl.trim() && !normalizedSourceUrl) {
      setError("Source links must be valid http:// or https:// URLs.");
      return;
    }

    setPosting(true);
    setError("");

    const corePayload = {
      user_id: user.id,
      official_id: officialId,
      content: trimmed,
      display_name: name,
      county: "Not verified",
    };

    const insertCoreComment = () =>
      supabase.from("comments").insert(corePayload).select(CORE_COMMENT_FIELDS).single();

    const initialResult = enhancedSchemaAvailable
      ? await supabase
          .from("comments")
          .insert({
            ...corePayload,
            comment_kind: commentKind,
            source_url: normalizedSourceUrl,
          })
          .select(ENHANCED_COMMENT_FIELDS)
          .single()
      : await insertCoreComment();

    let data = initialResult.data as Comment | null;
    let insertError = initialResult.error;

    if (enhancedSchemaAvailable && isMissingEnhancedColumn(insertError)) {
      setEnhancedSchemaAvailable(false);
      if (commentKind !== "comment" || normalizedSourceUrl) {
        setError("Sourced discussion is not enabled on this database yet. Your draft is still here.");
        setPosting(false);
        return;
      }

      const fallbackResult = await insertCoreComment();
      data = fallbackResult.data as Comment | null;
      insertError = fallbackResult.error;
    }

    if (insertError) {
      setError(insertError.message);
      setPosting(false);
      return;
    }

    if (data) {
      setComments((currentComments) => [data, ...currentComments]);
    }
    updateComment("");
    setSourceUrl("");
    setCommentKind("comment");
    setPosting(false);
  }

  async function handleDelete(commentId: string) {
    const { error: deleteError } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (!deleteError) {
      setComments((currentComments) => currentComments.filter((comment) => comment.id !== commentId));
    }
  }

  // Format dates as readable strings
  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Public Discussion
        </h2>
        <span className="text-sm text-gray-500">
          {comments.length} comment{comments.length !== 1 ? "s" : ""}
        </span>
      </div>

      {storyMode ? (
        <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-semibold leading-5 text-blue-950">
          <span className="font-black">Community rules:</span> lawful disagreement stays visible, sourced comments rank higher, and threats, doxxing, spam, or unlawful harassment are removed.
        </div>
      ) : (
        <div className="mb-6 grid gap-3 md:grid-cols-3">
          <PolicyCard
            title="Constitutional speech stays visible"
            body="RepWatchr does not hide lawful viewpoint disagreement. Ranking can change, but lawful comments are not shadow banned because they are unpopular."
          />
          <PolicyCard
            title="Evidence gets preference"
            body="Public-source links and current, server-confirmed resident checks receive ranking credit. Payment and a self-selected display name do not verify a person."
          />
          <PolicyCard
            title="Illegal content is different"
            body="Threats, doxxing, spam, private student data, and unlawful harassment are moderation issues, not political disagreement."
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <label className="mb-2 block text-base font-bold text-gray-900">
          Add your voice
          <textarea
            aria-label="Your public comment"
            value={newComment}
            onChange={(event) => updateComment(event.target.value)}
            placeholder={`What should people know about ${officialName}? Ask a question or share a source.`}
            rows={4}
            maxLength={2000}
            disabled={posting || authLoading}
            className="mt-2 w-full resize-y rounded-lg border border-gray-300 bg-gray-50 px-3 py-3 text-base font-normal leading-6 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>
        <div className="mb-3 flex items-center justify-between gap-3 text-xs text-gray-500">
          <span>{newComment.length}/2000</span>
          {newComment ? <button type="button" onClick={() => updateComment("")} disabled={posting} className="min-h-11 px-2 font-semibold underline">Discard draft</button> : null}
        </div>
        {draftStored ? <p className="mb-3 text-xs leading-5 text-gray-600">Draft kept in this tab for up to two hours. Return to this tab after email sign-in. Nothing is posted until you choose Post Comment, Post Question or Post Source Note.</p> : null}
        {user ? <>
          <p className="mb-3 text-sm text-gray-700">Posting as <strong>{displayName.trim() || defaultDisplayName}</strong></p>
          <details className="mb-4 rounded-lg border border-gray-200 px-3">
            <summary className="flex min-h-12 cursor-pointer items-center text-sm font-semibold text-gray-700">Edit name or add a source (optional)</summary>
            <div className="mb-3">
              <input
                type="text"
                aria-label="Public display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={`Display name (default: ${defaultDisplayName})`}
                maxLength={50}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {enhancedSchemaAvailable ? (
              <div className="mb-3 grid gap-3 sm:grid-cols-[180px_1fr]">
                <label className="text-xs font-bold text-gray-700">
                  Contribution type
                  <select
                    value={commentKind}
                    onChange={(event) => setCommentKind(event.target.value as CommentKind)}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="comment">Comment</option>
                    <option value="question">Public question</option>
                    <option value="source_note">Source note</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-gray-700">
                  Source link <span className="font-medium text-gray-400">(optional)</span>
                  <input
                    type="url"
                    inputMode="url"
                    value={sourceUrl}
                    onChange={(event) => setSourceUrl(event.target.value)}
                    placeholder="https://official-record-or-report.example"
                    maxLength={1000}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-base font-medium text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </label>
              </div>
            ) : null}

          </details>
          <p className="mb-3 text-xs leading-5 text-gray-500">{authorTier}. Sources are checked separately.</p>
          <button type="submit" disabled={posting || !newComment.trim()} className="min-h-12 w-full rounded-lg bg-blue-600 px-5 py-3 text-base font-semibold text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-500 sm:w-auto">
            {posting ? "Posting..." : commentKind === "question" ? "Post Question" : commentKind === "source_note" ? "Post Source Note" : "Post Comment"}
          </button>
        </> : <div className="rounded-lg bg-blue-50 p-4">
          <p className="mb-1 font-bold text-gray-900">Write first. Sign in to post.</p>
          <p className="mb-3 text-sm leading-6 text-gray-600">Free to join. Your comment stays here while you sign in in this tab.</p>
          <SocialAuthButtons compact nextPath={returnPath} />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Link href={`/auth/login${authQuery}`} className="flex min-h-12 items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">Sign in with email</Link>
            <Link href={`/auth/signup${authQuery}`} className="flex min-h-12 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50">Create a free account</Link>
          </div>
        </div>}
        {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100 p-5 motion-reduce:animate-none" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-gray-500">
            No comments yet. Be the first to share your thoughts.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {(comment.display_name[0] || "?").toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {comment.display_name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{comment.assurance_basis === "member_assurance_v1" && comment.author_type === "verified_resident" ? comment.county : "Location not verified"}</span>
                      <span>&#183;</span>
                      <span>{formatDate(comment.created_at)}</span>
                      <span>&#183;</span>
                      <span>{authorTypeLabel(comment.assurance_basis === "member_assurance_v1" ? comment.author_type : "signed_in", comment.county)}</span>
                    </div>
                  </div>
                </div>
                {user?.id === comment.user_id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete comment"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                {comment.content}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-gray-600">
                  {commentKindLabel(comment.comment_kind === "official_answer" && (comment.assurance_basis !== "member_assurance_v1" || comment.author_type !== "claimed_official") ? "comment" : comment.comment_kind)}
                </span>
                {safeHttpUrl(comment.source_url) ? (
                  <a
                    href={safeHttpUrl(comment.source_url) ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-800 hover:bg-emerald-100"
                  >
                    Open cited source ↗
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function PolicyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-black text-gray-950">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-gray-600">{body}</p>
    </div>
  );
}
