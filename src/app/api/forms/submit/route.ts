import { NextResponse } from "next/server";
import { submitForm, type SubmitFormContext } from "@/lib/data-intake-server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const rateWindowMs = 60_000;
const rateMax = 12;
const submissionsByKey = new Map<string, { count: number; resetAt: number }>();

function rateLimitKey(request: Request, context: SubmitFormContext) {
  return context.userId || context.anonymousId || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
}

function isRateLimited(request: Request, context: SubmitFormContext) {
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
    formKey?: unknown;
    payload?: unknown;
    context?: SubmitFormContext;
  } | null;

  if (!body || typeof body.formKey !== "string") {
    return NextResponse.json({ ok: false, message: "Send a valid form key and payload." }, { status: 400 });
  }

  const userId = await getUserId();
  const context: SubmitFormContext = {
    ...(body.context ?? {}),
    userId,
    referrer: body.context?.referrer ?? request.headers.get("referer"),
  };

  if (isRateLimited(request, context)) {
    return NextResponse.json(
      { ok: false, message: "Too many submissions. Wait a minute and try again." },
      { status: 429 },
    );
  }

  const result = await submitForm({
    formKey: body.formKey,
    payload: body.payload,
    context,
    request,
  });

  return NextResponse.json(result, { status: result.status });
}
