import { NextRequest, NextResponse } from "next/server";
import {
  isContributionKind,
  normalizeContributorHandle,
  xpForContribution,
  type ContributionKind,
} from "@/lib/contributors";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ContributionBody = {
  kind?: unknown;
  targetType?: unknown;
  targetId?: unknown;
  targetLabel?: unknown;
  title?: unknown;
  summary?: unknown;
  sourceUrl?: unknown;
  sourceDate?: unknown;
  jurisdiction?: unknown;
  county?: unknown;
  state?: unknown;
};

const targetTypes = new Set([
  "official",
  "school_board",
  "race",
  "vote",
  "funding",
  "meeting",
  "issue",
  "agency",
  "court",
  "judge",
  "record",
]);

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, maxLength) : null;
}

function cleanKind(value: unknown): ContributionKind {
  return isContributionKind(value) ? value : "source_submission";
}

function cleanTargetType(value: unknown) {
  const cleaned = cleanText(value, 80) ?? "record";
  return targetTypes.has(cleaned) ? cleaned : "record";
}

function cleanUrl(value: unknown) {
  const cleaned = cleanText(value, 1200);
  if (!cleaned) return null;
  try {
    const url = new URL(cleaned);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function cleanDate(value: unknown) {
  const cleaned = cleanText(value, 40);
  if (!cleaned) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(cleaned) ? cleaned : null;
}

async function getUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { userId: null, error: "Contributor reputation is temporarily unavailable." };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { userId: user?.id ?? null, email: user?.email ?? null, error: user ? null : "Login required." };
}

async function ensureContributorProfile(userId: string, email: string | null) {
  const admin = getSupabaseAdminClient();
  if (!admin) return { admin: null, profile: null, error: "Contribution logging is temporarily unavailable." };

  const existing = await admin
    .from("contributor_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing.error) return { admin, profile: null, error: existing.error.message };
  if (existing.data) return { admin, profile: existing.data, error: null };

  const localPart = email?.split("@")[0] ?? "source-runner";
  const safeHandle = normalizeContributorHandle(localPart) ?? `source-runner-${userId.slice(0, 8)}`;
  const created = await admin
    .from("contributor_profiles")
    .insert({
      user_id: userId,
      handle: safeHandle,
      display_name: "RepWatchr Contributor",
      state: "TX",
      primary_level: "source_runner",
      public_profile_enabled: false,
      metadata: {
        reputationOnly: true,
        noPaidContributions: true,
        createdFrom: "member_contribution",
      },
    })
    .select("*")
    .single();

  if (created.error) return { admin, profile: null, error: created.error.message };
  return { admin, profile: created.data, error: null };
}

async function awardStarterBadges(admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>, profile: { id: string; user_id: string }, contributionId: string) {
  const rows = [
    {
      profile_id: profile.id,
      user_id: profile.user_id,
      badge_key: "first_receipt",
      awarded_for_contribution_id: contributionId,
      reason: "First contribution submitted to RepWatchr.",
    },
    {
      profile_id: profile.id,
      user_id: profile.user_id,
      badge_key: "no_paid_rewards",
      awarded_for_contribution_id: contributionId,
      reason: "RepWatchr contributor reputation is not paid compensation.",
    },
  ];

  await admin.from("contributor_badge_awards").upsert(rows, { onConflict: "profile_id,badge_key" });
}

export async function POST(request: NextRequest) {
  const { userId, email, error } = await getUser();
  if (!userId) {
    return NextResponse.json({ ok: false, error }, { status: error === "Login required." ? 401 : 503 });
  }

  const { admin, profile, error: profileError } = await ensureContributorProfile(userId, email);
  if (!admin || !profile) {
    return NextResponse.json({ ok: false, error: profileError }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as ContributionBody | null;
  const kind = cleanKind(body?.kind);
  const targetLabel = cleanText(body?.targetLabel, 240);
  const title = cleanText(body?.title, 240);
  const summary = cleanText(body?.summary, 2500);
  const sourceUrl = cleanUrl(body?.sourceUrl);

  if (!targetLabel || !title || !summary || summary.length < 10) {
    return NextResponse.json(
      { ok: false, error: "Target, title, and a real summary are required." },
      { status: 400 },
    );
  }

  if (["source_submission", "vote_hunt", "funding_record", "fact_check"].includes(kind) && !sourceUrl) {
    return NextResponse.json(
      { ok: false, error: "This contribution type needs a public source URL." },
      { status: 400 },
    );
  }

  const xp = xpForContribution(kind);
  const inserted = await admin
    .from("contributor_records")
    .insert({
      profile_id: profile.id,
      user_id: userId,
      kind,
      target_type: cleanTargetType(body?.targetType),
      target_id: cleanText(body?.targetId, 240),
      target_label: targetLabel,
      title,
      summary,
      source_url: sourceUrl,
      source_date: cleanDate(body?.sourceDate),
      jurisdiction: cleanText(body?.jurisdiction, 180),
      county: cleanText(body?.county, 120) ?? profile.county,
      state: cleanText(body?.state, 40)?.toUpperCase() ?? profile.state ?? "TX",
      status: "submitted",
      xp_awarded: xp,
      accuracy_status: "unreviewed",
      metadata: {
        reputationOnly: true,
        noPaidContributions: true,
        xpMeaning: "Submission XP; accepted and verified counts are added after review.",
      },
    })
    .select("id, profile_id, user_id, kind, target_type, target_id, target_label, title, summary, source_url, source_date, jurisdiction, county, state, status, xp_awarded, usefulness_score, accuracy_status, attached_href, created_at")
    .single();

  if (inserted.error) return NextResponse.json({ ok: false, error: inserted.error.message }, { status: 500 });

  await admin.from("contributor_xp_events").insert({
    profile_id: profile.id,
    user_id: userId,
    contribution_id: inserted.data.id,
    event_type: "contribution_submitted",
    xp_delta: xp,
    reason: `${xp} XP for submitting a ${kind.replace(/_/g, " ")} for review.`,
    metadata: {
      contributionKind: kind,
      reputationOnly: true,
    },
  });

  await awardStarterBadges(admin, profile, inserted.data.id);

  const nextContributionCount = Number(profile.contribution_count ?? 0) + 1;
  const nextRejectedCount = Number(profile.rejected_count ?? 0);
  const nextVerifiedCount = Number(profile.verified_contributions_count ?? 0);
  const nextAccuracy =
    nextVerifiedCount + nextRejectedCount > 0
      ? Math.round((nextVerifiedCount / (nextVerifiedCount + nextRejectedCount)) * 10000) / 100
      : Number(profile.accuracy_score ?? 100);

  await admin
    .from("contributor_profiles")
    .update({
      total_xp: Number(profile.total_xp ?? 0) + xp,
      contribution_count: nextContributionCount,
      accuracy_score: nextAccuracy,
      last_contributed_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  const updatedProfile = await admin.from("contributor_profiles").select("*").eq("id", profile.id).single();

  return NextResponse.json({
    ok: true,
    profile: updatedProfile.data ?? profile,
    record: inserted.data,
    xpAwarded: xp,
    message: "Contribution logged for review. Reputation XP was awarded; verified counts update after review.",
  });
}
