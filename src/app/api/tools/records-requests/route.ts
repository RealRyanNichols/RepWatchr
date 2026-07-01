import { NextResponse } from "next/server";
import { serverTrackEvent, updateInterestScore, updateVisitorProfile } from "@/lib/analytics-server";
import { buildRecordsRequest, recordsRequestInputSchema } from "@/lib/source-packet-tools";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { SubmitFormContext } from "@/lib/data-intake-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const rateWindowMs = 60_000;
const rateMax = 20;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

type RecordsRequestBody = {
  input?: unknown;
  context?: SubmitFormContext;
  markSent?: boolean;
};

function cleanText(value: unknown, max = 700) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function dateOrNull(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
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

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RecordsRequestBody | null;
  const context = body?.context ?? {};

  if (isRateLimited(request, context)) {
    return NextResponse.json(
      { ok: false, message: "Too many records request drafts. Wait a minute and try again." },
      { status: 429 },
    );
  }

  const parsed = recordsRequestInputSchema.safeParse(body?.input);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Check the request fields and try again.",
        errors: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const userId = await getAuthenticatedUserId();
  const sourceRoute = context.pathname || context.route || "/tools/public-records-request";
  const output = buildRecordsRequest(input);
  const admin = getSupabaseAdminClient();
  let requestId = `local_${crypto.randomUUID().slice(0, 12)}`;
  let stored = false;
  let message = "Request draft generated. Create a free account to save and track it.";
  const nextStatus = body?.markSent ? "sent" : input.status;

  if (admin) {
    const { data, error } = await admin
      .from("records_requests")
      .insert({
        anonymous_id: context.anonymousId ?? null,
        user_id: userId,
        title: cleanText(input.title || input.subject, 220) || null,
        state: input.state,
        jurisdiction: cleanText(input.jurisdiction, 180) || null,
        agency: input.agency,
        record_type: input.recordType,
        date_range_start: dateOrNull(input.dateRangeStart),
        date_range_end: dateOrNull(input.dateRangeEnd),
        subject: input.subject,
        generated_request: output.generatedRequest,
        short_email_version: output.shortEmailVersion,
        followup_version: output.followupVersion,
        overdue_followup_version: output.overdueFollowupVersion,
        status: nextStatus,
        sent_at: body?.markSent ? new Date().toISOString() : null,
        notes: cleanText(input.notes, 3000) || null,
        attribution: {
          route: sourceRoute,
          referrer: context.referrer ?? request.headers.get("referer") ?? null,
          utm: context.utm ?? {},
          safety_warnings: output.safetyWarnings,
          requester_contact_supplied: Boolean(input.requesterContact),
        },
      })
      .select("id")
      .single();

    if (!error && data?.id) {
      requestId = String(data.id);
      stored = true;
      message = userId
        ? "Public records request saved to your dashboard."
        : "Public records request saved as an anonymous draft. Create an account to keep tracking it.";
    }
  }

  await Promise.all([
    serverTrackEvent({
      eventName: "records_request_generated",
      anonymousId: context.anonymousId,
      userId,
      sessionId: context.sessionId,
      route: sourceRoute,
      referrer: context.referrer ?? request.headers.get("referer"),
      metadata: {
        request_id: requestId,
        record_type: input.recordType,
        agency: input.agency,
        jurisdiction: input.jurisdiction || input.state,
        stored,
        status: nextStatus,
      },
    }),
    updateVisitorProfile({
      eventName: "records_request_created",
      anonymousId: context.anonymousId,
      userId,
      sessionId: context.sessionId,
      route: sourceRoute,
      referrer: context.referrer ?? request.headers.get("referer"),
      metadata: { record_type: input.recordType, agency: input.agency },
    }),
    updateInterestScore({
      eventType: "records_request_created",
      anonymousId: context.anonymousId,
      userId,
      path: sourceRoute,
      entityType: "agency",
      entityId: input.agency,
      metadata: {
        record_type: input.recordType,
        state: input.state,
        jurisdiction: input.jurisdiction ?? "",
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    requestId,
    stored,
    message,
    status: nextStatus,
    ...output,
  });
}
