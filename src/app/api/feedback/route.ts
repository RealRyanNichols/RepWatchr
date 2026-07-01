import { NextResponse } from "next/server";
import { z } from "zod";
import { civicFeedbackTypes } from "@/lib/civic-actions";
import { serverTrackEvent, updateInterestScore, updateVisitorProfile } from "@/lib/analytics-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const feedbackSchema = z.object({
  anonymousId: z.string().trim().max(120).optional().nullable(),
  entityType: z.string().trim().min(2).max(80),
  entityId: z.string().trim().min(1).max(240),
  feedbackType: z.enum(civicFeedbackTypes),
  feedbackValue: z.string().trim().min(1).max(120),
  weight: z.number().int().min(-5).max(5).optional().default(1),
  route: z.string().trim().max(500).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

function cleanTrackingId(value: string | null | undefined) {
  const cleaned = value?.replace(/\s+/g, " ").trim();
  return cleaned && /^[a-zA-Z0-9:_-]{8,120}$/.test(cleaned) ? cleaned : null;
}

async function getUserId() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

async function refreshRollup(
  admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  entityType: string,
  entityId: string,
  feedbackType: string,
) {
  const { data, error } = await admin
    .from("feedback_votes")
    .select("weight")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .eq("feedback_type", feedbackType);

  if (error) return { ok: false, error: error.message };

  const rows = data ?? [];
  const count = rows.length;
  const score = rows.reduce((sum, row) => sum + Number(row.weight ?? 0), 0);
  const upsert = await admin.from("feedback_rollups").upsert(
    {
      entity_type: entityType,
      entity_id: entityId,
      feedback_type: feedbackType,
      count,
      score,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "entity_type,entity_id,feedback_type" },
  );

  if (upsert.error) return { ok: false, error: upsert.error.message };
  return { ok: true, count, score };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid feedback." }, { status: 400 });
  }

  const input = parsed.data;
  const anonymousId = cleanTrackingId(input.anonymousId ?? null);
  const userId = await getUserId();

  if (!userId && !anonymousId) {
    return NextResponse.json({ ok: false, error: "Visitor id is required." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ ok: false, error: "Feedback queue is not configured." }, { status: 503 });

  const selector = admin
    .from("feedback_votes")
    .select("id, feedback_value, weight")
    .eq("entity_type", input.entityType)
    .eq("entity_id", input.entityId)
    .eq("feedback_type", input.feedbackType)
    .limit(1);

  const existing = userId
    ? await selector.eq("user_id", userId).maybeSingle()
    : await selector.eq("anonymous_id", anonymousId).maybeSingle();

  const row = {
    anonymous_id: anonymousId,
    user_id: userId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    feedback_type: input.feedbackType,
    feedback_value: input.feedbackValue,
    weight: input.weight,
    metadata: input.metadata,
    updated_at: new Date().toISOString(),
  };

  const changed = Boolean(existing.data && existing.data.feedback_value !== input.feedbackValue);
  const write = existing.data?.id
    ? await admin.from("feedback_votes").update(row).eq("id", existing.data.id).select("id").single()
    : await admin.from("feedback_votes").insert(row).select("id").single();

  if (write.error) return NextResponse.json({ ok: false, error: write.error.message }, { status: 500 });

  const rollup = await refreshRollup(admin, input.entityType, input.entityId, input.feedbackType);
  await Promise.all([
    serverTrackEvent({
      eventName: changed ? "feedback_vote_changed" : "feedback_vote_clicked",
      anonymousId,
      userId,
      route: input.route ?? null,
      metadata: {
        entity_type: input.entityType,
        entity_id: input.entityId,
        feedback_type: input.feedbackType,
        feedback_value: input.feedbackValue,
      },
    }),
    updateVisitorProfile({
      eventName: "feedback_vote_clicked",
      anonymousId,
      userId,
      route: input.route ?? null,
      metadata: { entity_type: input.entityType, entity_id: input.entityId, feedback_type: input.feedbackType },
    }),
    updateInterestScore({
      eventType: "feedback_vote_clicked",
      anonymousId,
      userId,
      path: input.route ?? undefined,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: { feedback_type: input.feedbackType, feedback_value: input.feedbackValue },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    voteId: write.data.id,
    changed,
    rollup: rollup.ok ? { count: rollup.count, score: rollup.score } : null,
  });
}
