import { NextResponse } from "next/server";
import { serverTrackEvent, updateInterestScore, updateVisitorProfile } from "@/lib/analytics-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  buildCorrectionSummary,
  correctionRequestSchema,
  normalizeTrustEmail,
  normalizeTrustText,
  validatePublicContentSafety,
} from "@/lib/trust-safety";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const correctionRateLimit = new Map<string, { count: number; resetAt: number }>();

function rateLimitKey(request: Request, anonymousId?: string | null) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return anonymousId || forwarded || "unknown";
}

function checkRateLimit(key: string) {
  const now = Date.now();
  const existing = correctionRateLimit.get(key);
  if (!existing || existing.resetAt < now) {
    correctionRateLimit.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }
  if (existing.count >= 8) return false;
  existing.count += 1;
  return true;
}

async function getAuthenticatedUserId() {
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

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = correctionRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Check the correction form and try again.",
      },
      { status: 400 },
    );
  }

  const input = parsed.data;
  if (input.honeypot) {
    return NextResponse.json({ ok: false, message: "The request could not be accepted." }, { status: 400 });
  }

  if (!checkRateLimit(rateLimitKey(request, input.anonymousId))) {
    return NextResponse.json(
      { ok: false, message: "Too many correction requests. Wait a few minutes and try again." },
      { status: 429 },
    );
  }

  const safety = validatePublicContentSafety(
    [input.currentText, input.requestedCorrection, input.explanation].filter(Boolean).join(" "),
    { sourceUrl: input.sourceUrl, label: "Under review" },
  );
  const hardSafetyKeys = new Set([
    "threat",
    "private_address",
    "minor_family",
    "private_medical",
    "harassment_instruction",
    "violent_language",
  ]);
  if (safety.flags.some((flag) => hardSafetyKeys.has(flag.key))) {
    await serverTrackEvent({
      eventName: "safety_warning_triggered",
      anonymousId: input.anonymousId,
      route: input.sourceRoute ?? input.url ?? "/",
      metadata: {
        entity_type: input.entityType,
        entity_id: input.entityId,
        flags: safety.flags.map((flag) => flag.key).join(","),
      },
    });
    return NextResponse.json(
      {
        ok: false,
        message:
          "Remove private addresses, minor-child details, medical details, threats, harassment instructions, or violent language before submitting.",
      },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { ok: false, message: "Correction queue is temporarily unavailable. Keep your correction text and try again." },
      { status: 503 },
    );
  }

  const userId = await getAuthenticatedUserId();
  const attribution = {
    referrer: normalizeTrustText(input.referrer, 500),
    utm: input.utm,
    source_route: normalizeTrustText(input.sourceRoute, 500),
  };

  const row = {
    anonymous_id: normalizeTrustText(input.anonymousId, 120),
    user_id: userId,
    submitter_name: normalizeTrustText(input.submitterName, 120),
    submitter_email: normalizeTrustEmail(input.submitterEmail),
    entity_type: normalizeTrustText(input.entityType, 80) ?? "unknown",
    entity_id: normalizeTrustText(input.entityId, 180) ?? "unknown",
    url: normalizeTrustText(input.url, 500),
    correction_type: input.correctionType,
    current_text: normalizeTrustText(input.currentText, 3000),
    requested_correction: normalizeTrustText(input.requestedCorrection, 3000) ?? "",
    source_url: normalizeTrustText(input.sourceUrl, 500),
    explanation: normalizeTrustText(input.explanation, 3000),
    status: "new",
    priority: safety.riskLevel === "high" ? "high" : "normal",
    attribution,
  };

  const { data, error } = await admin.from("correction_requests").insert(row).select("id, status").single();
  if (error) {
    return NextResponse.json(
      { ok: false, message: "Correction queue is not ready yet. Keep your correction text and try again." },
      { status: 503 },
    );
  }

  const correctionId = data.id as string;
  const route = row.url ?? row.attribution.source_route ?? "/";
  await Promise.all([
    admin.from("correction_events").insert({
      correction_request_id: correctionId,
      event_type: "submitted",
      actor_user_id: userId,
      metadata: {
        correction_type: input.correctionType,
        safety_flags: safety.flags.map((flag) => flag.key),
        suggested_label: safety.suggestedLabel,
        human_review_required: true,
      },
    }),
    serverTrackEvent({
      eventName: "correction_completed",
      anonymousId: row.anonymous_id,
      userId,
      route,
      referrer: attribution.referrer,
      utm_source: input.utm.utm_source ?? null,
      utm_medium: input.utm.utm_medium ?? null,
      utm_campaign: input.utm.utm_campaign ?? null,
      utm_term: input.utm.utm_term ?? null,
      utm_content: input.utm.utm_content ?? null,
      metadata: {
        correction_id: correctionId,
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        correction_type: input.correctionType,
        safety_risk: safety.riskLevel,
      },
    }),
    updateVisitorProfile({
      eventName: "correction_completed",
      anonymousId: row.anonymous_id,
      userId,
      route,
      referrer: attribution.referrer,
      metadata: { entity_type: row.entity_type, entity_id: row.entity_id },
    }),
    updateInterestScore({
      eventType: "correction_completed",
      anonymousId: row.anonymous_id,
      userId,
      path: route,
      entityType: row.entity_type,
      entityId: row.entity_id,
      metadata: { correction_type: input.correctionType },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    correctionId,
    status: data.status ?? "new",
    summary: buildCorrectionSummary(input),
    message: "Correction request received. Human review required.",
  });
}
