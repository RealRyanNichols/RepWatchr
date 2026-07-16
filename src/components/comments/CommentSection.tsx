"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import { createClient } from "@/lib/supabase";

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
}

interface CommentSectionProps {
  officialId: string;
  officialName: string;
  storyMode?: boolean;
}

const CORE_COMMENT_FIELDS = "id, content, display_name, county, created_at, user_id";
const ENHANCED_COMMENT_FIELDS = `${CORE_COMMENT_FIELDS}, comment_kind, author_type, rank_score, contains_source, source_url`;

function cleanMetadataName(user: { user_metadata?: Record<string, unknown> } | null): string | null {
  if (!user) return null;

  for (const key of ["full_name", "name", "display_name", "user_name", "preferred_username"]) {
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
}: CommentSectionProps) {
  const { user, profile, roles } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [commentKind, setCommentKind] = useState<CommentKind>("comment");
  const [sourceUrl, setSourceUrl] = useState("");
  const [enhancedSchemaAvailable, setEnhancedSchemaAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const supabase = useMemo(() => createClient(), []);
  const isVerifiedProfile = Boolean(profile?.verified);
  const isClaimedOfficial = roles.includes("claimed_official");
  const isJournalist = roles.includes("journalist");
  const authorType: AuthorType = isClaimedOfficial
    ? "claimed_official"
    : isVerifiedProfile
      ? "verified_resident"
      : isJournalist
        ? "journalist"
        : "signed_in";
  const authorTier = isClaimedOfficial
    ? "Verified official / claimed profile"
    : isVerifiedProfile
      ? "Verified resident"
      : isJournalist
        ? "Journalist profile"
        : "Signed-in profile";
  const authorRank = isClaimedOfficial ? 100 : isVerifiedProfile ? 80 : isJournalist ? 70 : 30;
  const defaultDisplayName =
    cleanMetadataName(user) || (profile?.county ? `${profile.county} Resident` : "Anonymous profile");

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

      // Some existing deployments predate evidence-ranking columns. Keep the
      // core discussion usable there, and only reveal sourced modes when the
      // expanded comments schema is confirmed by Supabase.
      const fallbackResult = await supabase
        .from("comments")
        .select(CORE_COMMENT_FIELDS)
        .eq("official_id", officialId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (cancelled) return;
      setEnhancedSchemaAvailable(false);
      setComments((fallbackResult.data ?? []) as Comment[]);
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
      county: profile?.county ?? "Anonymous",
    };

    const insertCoreComment = () =>
      supabase.from("comments").insert(corePayload).select(CORE_COMMENT_FIELDS).single();

    const initialResult = enhancedSchemaAvailable
      ? await supabase
          .from("comments")
          .insert({
            ...corePayload,
            comment_kind: commentKind,
            author_type: authorType,
            rank_score: authorRank,
            contains_source: Boolean(normalizedSourceUrl),
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
    setNewComment("");
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
            body="Verified officials, verified parents/residents, named journalists, public-source links, and direct answers rank above anonymous or unsourced comments."
          />
          <PolicyCard
            title="Illegal content is different"
            body="Threats, doxxing, spam, private student data, and unlawful harassment are moderation issues, not political disagreement."
          />
        </div>
      )}

      {/* Comment Form */}
      {!user ? (
        <div className="mb-6 rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 p-6 text-center">
          <p className="mb-1 font-bold text-gray-900">
            Join the conversation about {officialName}
          </p>
          <p className="mb-4 text-sm text-gray-600">
            Sign in with a social profile or email. Verification and moderation rules still apply.
          </p>
          <div className="mx-auto max-w-md">
            <SocialAuthButtons compact nextPath={`/officials/${officialId}#participate`} />
          </div>
          <div className="my-4 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">
            <span className="h-px flex-1 bg-gray-200" />
            or use email
            <span className="h-px flex-1 bg-gray-200" />
          </div>
          <div className="flex justify-center gap-3">
            <Link
              href="/auth/login"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 grid gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs font-bold text-blue-950 sm:grid-cols-[1fr_auto] sm:items-center">
              <span>{authorTier}</span>
              <span>Ranking weight: {authorRank}/100</span>
            </div>
            <div className="mb-3">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={`Display name (default: ${defaultDisplayName})`}
                maxLength={50}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {enhancedSchemaAvailable ? (
              <div className="mb-3 grid gap-3 sm:grid-cols-[180px_1fr]">
                <label className="text-xs font-bold text-gray-700">
                  Contribution type
                  <select
                    value={commentKind}
                    onChange={(event) => setCommentKind(event.target.value as CommentKind)}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </label>
              </div>
            ) : null}
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={`Ask a public question or leave a sourced concern for ${officialName}.`}
              rows={3}
              maxLength={2000}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {newComment.length}/2000
              </span>
              <button
                type="submit"
                disabled={posting || !newComment.trim()}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
              >
                {posting
                  ? "Posting..."
                  : commentKind === "question"
                    ? "Post Question"
                    : commentKind === "source_note"
                      ? "Post Source Note"
                      : "Post Comment"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl bg-gray-100 p-5 h-24" />
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
                      <span>{comment.county}</span>
                      <span>&#183;</span>
                      <span>{formatDate(comment.created_at)}</span>
                      <span>&#183;</span>
                      <span>{authorTypeLabel(comment.author_type, comment.county)}</span>
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
                  {commentKindLabel(comment.comment_kind)}
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
