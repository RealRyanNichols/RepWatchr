import { NextResponse } from "next/server";
import { submitForm, type SubmitFormContext } from "@/lib/data-intake-server";
import { serverTrackEvent, updateInterestScore, updateVisitorProfile } from "@/lib/analytics-server";
import { buildSourcePacket, sourcePacketInputSchema } from "@/lib/source-packet-tools";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const rateWindowMs = 60_000;
const rateMax = 20;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

type SourcePacketRequestBody = {
  input?: unknown;
  context?: SubmitFormContext;
  submitToReview?: boolean;
};

function cleanText(value: unknown, max = 700) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function rateLimitKey(request: Request, context?: SubmitFormContext) {
  return context?.userId || context?.anonymousId || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
}

function isRateLimited(request: Request, context?: SubmitFormContext) {
  const key = rateLimitKey(request, context);
  const now = Date.now();
  const current = requestCounts.get(key);
  if (!current || current.resetAt < now) {
    requestCounts.set(key, { count: 1, resetAt: now + rateWindowMs });
    return false;
  }
  current.count += 1;
  requestCounts.set(key, current);
  return current.count > rateMax;
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

function sourceDate(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SourcePacketRequestBody | null;
  const context = body?.context ?? {};

  if (isRateLimited(request, context)) {
    return NextResponse.json(
      { ok: false, message: "Too many packet builds. Wait a minute and try again." },
      { status: 429 },
    );
  }

  const parsed = sourcePacketInputSchema.safeParse(body?.input);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Check the packet fields and try again.",
        errors: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const userId = await getAuthenticatedUserId();
  const sourceRoute = context.pathname || context.route || "/free-packet";
  const output = buildSourcePacket(input);
  const admin = getSupabaseAdminClient();
  let packetId = `local_${crypto.randomUUID().slice(0, 12)}`;
  let stored = false;
  let storageMessage = "Packet generated. Create a free account to save it to your dashboard.";

  if (admin) {
    const { data, error } = await admin
      .from("source_packets")
      .insert({
        anonymous_id: context.anonymousId ?? null,
        user_id: userId,
        title: cleanText(input.sourceTitle || input.targetName, 220) || null,
        packet_type: input.packetType,
        target_type: input.targetType,
        target_id: cleanText(input.targetId, 120) || null,
        target_name: input.targetName,
        jurisdiction: cleanText(input.jurisdiction, 220) || null,
        source_url: input.sourceUrl,
        source_title: cleanText(input.sourceTitle, 220) || null,
        source_date: sourceDate(input.sourceDate),
        summary: input.summary,
        claim_language: cleanText(input.claimLanguage, 2000) || null,
        missing_context: cleanText(input.missingContext, 2000) || null,
        public_question: output.publicQuestion,
        generated_markdown: output.generatedMarkdown,
        generated_text: output.generatedText,
        status: "draft",
        attribution: {
          route: sourceRoute,
          referrer: context.referrer ?? request.headers.get("referer") ?? null,
          utm: context.utm ?? {},
          confidence: output.confidence,
          safety_warnings: output.safetyWarnings,
        },
      })
      .select("id")
      .single();

    if (!error && data?.id) {
      packetId = String(data.id);
      stored = true;
      storageMessage = userId
        ? "Packet saved to your RepWatchr workspace."
        : "Packet saved as an anonymous draft. Create an account to keep it tied to you.";
    }
  }

  let sourceReviewSubmissionId: string | null = null;
  if (body?.submitToReview) {
    const reviewResult = await submitForm({
      formKey: "free_packet",
      payload: {
        targetType: input.targetType,
        target: input.targetName,
        jurisdiction: input.jurisdiction,
        sourceUrl: input.sourceUrl,
        summary: input.summary,
        consent: true,
      },
      context: {
        ...context,
        userId,
        route: sourceRoute,
        pathname: sourceRoute,
        referrer: context.referrer ?? request.headers.get("referer"),
      },
      request,
    });
    if (reviewResult.ok) sourceReviewSubmissionId = reviewResult.submissionId;
  }

  await Promise.all([
    serverTrackEvent({
      eventName: body?.submitToReview ? "packet_submitted" : "packet_generated",
      anonymousId: context.anonymousId,
      userId,
      sessionId: context.sessionId,
      route: sourceRoute,
      referrer: context.referrer ?? request.headers.get("referer"),
      metadata: {
        packet_id: packetId,
        packet_type: input.packetType,
        target_type: input.targetType,
        target_name: input.targetName,
        stored,
        submitted_to_review: Boolean(sourceReviewSubmissionId),
      },
    }),
    updateVisitorProfile({
      eventName: "packet_builder_completed",
      anonymousId: context.anonymousId,
      userId,
      sessionId: context.sessionId,
      route: sourceRoute,
      referrer: context.referrer ?? request.headers.get("referer"),
      metadata: { packet_type: input.packetType, target_type: input.targetType },
    }),
    updateInterestScore({
      eventType: "packet_builder_completed",
      anonymousId: context.anonymousId,
      userId,
      path: sourceRoute,
      entityType: input.targetType,
      entityId: input.targetId || input.targetName,
      metadata: {
        packet_type: input.packetType,
        jurisdiction: input.jurisdiction ?? "",
        source_url_present: true,
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    packetId,
    stored,
    message: storageMessage,
    sourceReviewSubmissionId,
    ...output,
  });
}
