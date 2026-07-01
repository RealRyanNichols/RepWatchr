import { NextResponse } from "next/server";
import { submitSourceSubmission, type SourceSubmissionContext } from "@/lib/source-submissions";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const rateWindowMs = 60_000;
const rateMax = 10;
const submissionsByKey = new Map<string, { count: number; resetAt: number }>();

function rateLimitKey(request: Request, context: SourceSubmissionContext) {
  return context.userId || context.anonymousId || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
}

function isRateLimited(request: Request, context: SourceSubmissionContext) {
  const key = rateLimitKey(request, context);
  const now = Date.now();
  const current = submissionsByKey.get(key);

  if (!current || current.resetAt < now) {
    submissionsByKey.set(key, { count: 1, resetAt: now + rateWindowMs });
    return false;
  }

  current.count += 1;
  submissionsByKey.set(key, current);
  return current.count > rateMax;
}

async function getUserId() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    payload?: unknown;
    context?: SourceSubmissionContext;
  } | null;

  if (!body || !body.payload) {
    return NextResponse.json({ ok: false, message: "Send a valid source payload." }, { status: 400 });
  }

  const userId = await getUserId();
  const context: SourceSubmissionContext = {
    ...(body.context ?? {}),
    userId,
    referrer: body.context?.referrer ?? request.headers.get("referer"),
  };

  if (isRateLimited(request, context)) {
    return NextResponse.json(
      { ok: false, message: "Too many source submissions. Wait a minute and try again." },
      { status: 429 },
    );
  }

  const result = await submitSourceSubmission({ payload: body.payload, context, request });
  return NextResponse.json(result, { status: result.status });
}
