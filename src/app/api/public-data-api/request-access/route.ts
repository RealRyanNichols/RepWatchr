import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  normalizeApiAccessRequest,
  recordApiUsageEvent,
  validateApiAccessRequest,
  type ApiAccessRequestInput,
} from "@/lib/public-data-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getOptionalUserId() {
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
  const body = (await request.json().catch(() => null)) as ApiAccessRequestInput | null;
  const input = normalizeApiAccessRequest(body ?? {});
  const validationError = validateApiAccessRequest(input);

  if (validationError) {
    await recordApiUsageEvent({
      endpoint: "/api/public-data-api/request-access",
      method: "POST",
      statusCode: 400,
      metadata: { validation_error: validationError },
    });
    return NextResponse.json({ ok: false, error: validationError }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "API access requests are temporarily unavailable. Try again later." },
      { status: 503 },
    );
  }

  const userId = await getOptionalUserId();
  const { data, error } = await supabase
    .from("api_access_requests")
    .insert({
      anonymous_id: input.anonymousId || null,
      user_id: userId,
      email: input.email,
      name: input.name || null,
      organization: input.organization || null,
      use_case: input.useCase || null,
      requested_scope: input.requestedScope || null,
      jurisdiction_focus: input.jurisdictionFocus || null,
      status: "new",
    })
    .select("id")
    .maybeSingle();

  if (error || !data?.id) {
    await recordApiUsageEvent({
      endpoint: "/api/public-data-api/request-access",
      method: "POST",
      statusCode: 500,
      metadata: { error: error?.message ?? "missing_id" },
    });
    return NextResponse.json({ ok: false, error: error?.message ?? "API access request did not return an ID." }, { status: 500 });
  }

  await recordApiUsageEvent({
    userId,
    endpoint: "/api/public-data-api/request-access",
    method: "POST",
    statusCode: 200,
    recordsReturned: 1,
    metadata: {
      api_access_request_id: data.id,
      requested_scope: input.requestedScope || null,
      jurisdiction_focus: input.jurisdictionFocus || null,
      event: "api_access_requested",
    },
  });

  return NextResponse.json({ ok: true, id: data.id });
}
