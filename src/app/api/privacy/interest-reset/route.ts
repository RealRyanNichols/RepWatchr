import { NextResponse } from "next/server";
import { serverTrackEvent } from "@/lib/analytics-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { normalizeTrustText } from "@/lib/trust-safety";

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
  const body = (await request.json().catch(() => ({}))) as {
    anonymousId?: string | null;
    sourceRoute?: string | null;
    referrer?: string | null;
  };

  const admin = getSupabaseAdminClient();
  const userId = await getAuthenticatedUserId();
  const anonymousId = normalizeTrustText(body.anonymousId, 120);
  const route = normalizeTrustText(body.sourceRoute, 500) ?? "/privacy/controls";

  if (!anonymousId && !userId) {
    return NextResponse.json(
      { ok: false, message: "No visitor or user profile was available to reset." },
      { status: 400 },
    );
  }

  if (!admin) {
    return NextResponse.json({
      ok: true,
      resetApplied: false,
      message: "Interest reset request accepted. Live data services are required to apply it immediately.",
    });
  }

  const tasks = [];
  if (anonymousId) {
    tasks.push(admin.from("visitor_interest_events").delete().eq("anonymous_id", anonymousId));
    tasks.push(admin.from("visitor_profiles").update({ interest_scores: {}, updated_at: new Date().toISOString() }).eq("anonymous_id", anonymousId));
  }
  if (userId) {
    tasks.push(admin.from("visitor_interest_events").delete().eq("user_id", userId));
    tasks.push(admin.from("visitor_profiles").update({ interest_scores: {}, updated_at: new Date().toISOString() }).eq("converted_user_id", userId));
  }

  const results = await Promise.allSettled(tasks);
  const applied = results.some((result) => result.status === "fulfilled" && !result.value.error);

  await serverTrackEvent({
    eventName: "interest_profile_reset",
    anonymousId,
    userId,
    route,
    referrer: body.referrer,
    metadata: { reset_applied: applied },
  });

  return NextResponse.json({
    ok: true,
    resetApplied: applied,
    message: applied
      ? "Interest profile reset applied for this visitor or account."
      : "Interest profile reset was processed, but no matching profile rows were found.",
  });
}
