import { NextResponse } from "next/server";
import { serverTrackEvent, updateVisitorProfile } from "@/lib/analytics-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  normalizeTrustEmail,
  normalizeTrustText,
  privacyRequestSchema,
  validatePublicContentSafety,
} from "@/lib/trust-safety";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
  const parsed = privacyRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message ?? "Check the privacy request and try again." },
      { status: 400 },
    );
  }

  const input = parsed.data;
  if (input.honeypot) {
    return NextResponse.json({ ok: false, message: "The request could not be accepted." }, { status: 400 });
  }

  const safety = validatePublicContentSafety(input.message, { label: "Under review" });
  const blocked = safety.flags.some((flag) =>
    ["threat", "private_address", "minor_family", "private_medical", "harassment_instruction", "violent_language"].includes(flag.key),
  );
  if (blocked) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Do not paste private addresses, minor-child details, medical details, threats, or harassment language into this request.",
      },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { ok: false, message: "Privacy request queue is temporarily unavailable. Keep your request text and try again." },
      { status: 503 },
    );
  }

  const userId = await getAuthenticatedUserId();
  const row = {
    user_id: userId,
    email: normalizeTrustEmail(input.email),
    request_type: input.requestType,
    status: "new",
    message: normalizeTrustText(input.message, 3000),
  };
  const { data, error } = await admin.from("privacy_requests").insert(row).select("id, status").single();
  if (error) {
    return NextResponse.json(
      { ok: false, message: "Privacy request queue is not ready yet. Keep your request text and try again." },
      { status: 503 },
    );
  }

  const route = normalizeTrustText(input.sourceRoute, 500) ?? "/privacy/controls";
  await Promise.all([
    serverTrackEvent({
      eventName: "privacy_request_submitted",
      anonymousId: input.anonymousId,
      userId,
      route,
      referrer: input.referrer,
      utm_source: input.utm.utm_source ?? null,
      utm_medium: input.utm.utm_medium ?? null,
      utm_campaign: input.utm.utm_campaign ?? null,
      utm_term: input.utm.utm_term ?? null,
      utm_content: input.utm.utm_content ?? null,
      metadata: { privacy_request_id: data.id, request_type: input.requestType },
    }),
    updateVisitorProfile({
      eventName: "privacy_request_submitted",
      anonymousId: input.anonymousId,
      userId,
      route,
      referrer: input.referrer,
      metadata: { request_type: input.requestType },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    requestId: data.id,
    status: data.status ?? "new",
    message: "Privacy request received.",
  });
}
