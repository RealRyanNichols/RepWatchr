import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

/**
 * Casting and clearing a community scorecard vote.
 *
 * The browser used to write `profile_scorecard_votes` directly. The trust
 * hardening migration revoked that for a reason it states plainly: "Client
 * feature flags alone cannot protect direct Data API writes." Anyone holding
 * the public anon key could POST to the REST endpoint regardless of what the
 * interface showed, so hiding the button protected nothing.
 *
 * Every write now goes through here, where the user is resolved server-side
 * from their session and the row is written with the service role. A caller
 * cannot vote as someone else, cannot vote twice for one target, and cannot
 * reach the table at all without a session.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GRADE_SCORES: Record<string, number> = { A: 100, B: 80, C: 60, D: 40, F: 0 };
const TARGET_TYPES = new Set(["official", "attorney", "law-firm", "media", "journalist", "public-safety", "school-board"]);

/** One vote per person per target, and a ceiling on how fast one account can move. */
const MAX_VOTES_PER_HOUR = 20;

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) || null : null;
}

async function requireVoter() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { error: "Sign in to put your grade on the record." as const };
  if (!user.email_confirmed_at) {
    return { error: "Confirm your email address before voting." as const };
  }
  return { user };
}

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_ENABLE_COMMUNITY_VOTING_V2 !== "true") {
    return NextResponse.json({ ok: false, error: "Community scorecards are paused." }, { status: 503 });
  }

  const voter = await requireVoter();
  if ("error" in voter) return NextResponse.json({ ok: false, error: voter.error }, { status: 401 });

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Voting storage is not configured." }, { status: 503 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body must be JSON." }, { status: 400 });
  }

  const targetType = clean(payload.targetType, 40);
  const targetId = clean(payload.targetId, 120);
  const grade = clean(payload.grade, 1)?.toUpperCase() ?? null;

  if (!targetType || !TARGET_TYPES.has(targetType)) {
    return NextResponse.json({ ok: false, error: "Unknown target type." }, { status: 400 });
  }
  if (!targetId) return NextResponse.json({ ok: false, error: "targetId is required." }, { status: 400 });
  if (!grade || !(grade in GRADE_SCORES)) {
    return NextResponse.json({ ok: false, error: "Grade must be A, B, C, D or F." }, { status: 400 });
  }

  // A single account moving through dozens of profiles in minutes is not a
  // constituent forming a view. Cheap to check, and it bounds the damage a
  // scripted account can do before anyone notices.
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: rateError } = await admin
    .from("profile_scorecard_votes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", voter.user.id)
    .gte("updated_at", hourAgo);

  if (!rateError && typeof count === "number" && count >= MAX_VOTES_PER_HOUR) {
    return NextResponse.json(
      { ok: false, error: "That is a lot of grades in one hour. Try again shortly." },
      { status: 429 },
    );
  }

  const row = {
    user_id: voter.user.id,
    target_type: targetType,
    target_id: targetId,
    target_name: clean(payload.targetName, 200),
    target_path: clean(payload.targetPath, 300),
    grade,
    score: GRADE_SCORES[grade],
    rationale: clean(payload.rationale, 2000),
    would_vote_again: typeof payload.wouldVoteAgain === "boolean" ? payload.wouldVoteAgain : null,
    voted_for_last_time: typeof payload.votedForLastTime === "boolean" ? payload.votedForLastTime : null,
    approval_after_vote: clean(payload.approvalAfterVote, 40),
    top_issue: clean(payload.topIssue, 120),
    updated_at: new Date().toISOString(),
  };

  let { error } = await admin.from("profile_scorecard_votes").upsert(row, {
    onConflict: "user_id,target_type,target_id",
  });

  // Older deployments may not carry the questionnaire columns yet.
  if (error && /column|schema|cache|would_vote_again|voted_for_last_time|approval_after_vote|top_issue/i.test(error.message)) {
    const { would_vote_again, voted_for_last_time, approval_after_vote, top_issue, ...base } = row;
    void would_vote_again;
    void voted_for_last_time;
    void approval_after_vote;
    void top_issue;
    const fallback = await admin
      .from("profile_scorecard_votes")
      .upsert(base, { onConflict: "user_id,target_type,target_id" });
    error = fallback.error;
  }

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, grade });
}

export async function DELETE(request: Request) {
  if (process.env.NEXT_PUBLIC_ENABLE_COMMUNITY_VOTING_V2 !== "true") {
    return NextResponse.json({ ok: false, error: "Community scorecards are paused." }, { status: 503 });
  }

  const voter = await requireVoter();
  if ("error" in voter) return NextResponse.json({ ok: false, error: voter.error }, { status: 401 });

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Voting storage is not configured." }, { status: 503 });
  }

  const url = new URL(request.url);
  const targetType = clean(url.searchParams.get("targetType"), 40);
  const targetId = clean(url.searchParams.get("targetId"), 120);
  if (!targetType || !targetId) {
    return NextResponse.json({ ok: false, error: "targetType and targetId are required." }, { status: 400 });
  }

  // Scoped to the caller's own row. There is no path here to delete anyone
  // else's vote, whatever the request says.
  const { error } = await admin
    .from("profile_scorecard_votes")
    .delete()
    .eq("user_id", voter.user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
