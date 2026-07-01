import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalizeTrackingId(value: unknown) {
  if (typeof value !== "string") return null;
  const id = value.trim().slice(0, 120);
  if (!/^[a-zA-Z0-9:_-]{16,120}$/.test(id)) return null;
  return id;
}

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return new Response(null, { status: 204 });
  }

  const body = (await request.json().catch(() => null)) as { anonymousId?: unknown } | null;
  const anonymousId = normalizeTrackingId(body?.anonymousId);
  if (!anonymousId) return new Response(null, { status: 204 });

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Response(null, { status: 204 });

  const admin = getSupabaseAdminClient();
  if (!admin) return new Response(null, { status: 204 });

  const { data: profile, error: profileError } = await admin
    .from("visitor_profiles")
    .select("id, user_id, anonymous_id")
    .eq("anonymous_id", anonymousId)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json({ ok: true, merged: false });
  }

  if (profile.user_id && profile.user_id !== user.id) {
    return NextResponse.json({ ok: false, merged: false, reason: "visitor_profile_already_merged" }, { status: 409 });
  }

  const now = new Date().toISOString();

  await admin
    .from("visitor_profiles")
    .update({ user_id: user.id, merged_at: now, updated_at: now })
    .eq("id", profile.id);

  const profileV2 = await admin
    .from("visitor_profiles")
    .update({ converted_user_id: user.id, signup_converted_at: now, updated_at: now })
    .eq("id", profile.id);

  if (profileV2.error && !/converted_user_id|signup_converted_at|schema cache/i.test(profileV2.error.message)) {
    console.warn(JSON.stringify({ level: "warn", msg: "visitor_merge_profile_v2_skipped", error: profileV2.error.message }));
  }

  await admin
    .from("visitor_sessions")
    .update({ user_id: user.id, updated_at: now })
    .eq("visitor_profile_id", profile.id);

  await admin
    .from("visitor_events")
    .update({ user_id: user.id })
    .eq("visitor_profile_id", profile.id);

  await admin
    .from("visitor_interest_scores")
    .update({ user_id: user.id, updated_at: now })
    .eq("visitor_profile_id", profile.id);

  await admin
    .from("visitor_interest_events")
    .update({ user_id: user.id })
    .eq("visitor_profile_id", profile.id);

  const analyticsMerge = await admin
    .from("analytics_events")
    .update({ user_id: user.id })
    .eq("anonymous_id", anonymousId);

  if (analyticsMerge.error && !/analytics_events|does not exist|schema cache/i.test(analyticsMerge.error.message)) {
    console.warn(JSON.stringify({ level: "warn", msg: "analytics_events_merge_skipped", error: analyticsMerge.error.message }));
  }

  const attributionMerge = await admin
    .from("attribution_touches")
    .update({ user_id: user.id })
    .eq("anonymous_id", anonymousId);

  if (attributionMerge.error && !/attribution_touches|does not exist|schema cache/i.test(attributionMerge.error.message)) {
    console.warn(JSON.stringify({ level: "warn", msg: "attribution_merge_skipped", error: attributionMerge.error.message }));
  }

  const [{ count: eventsLinked }, { count: sessionsLinked }] = await Promise.all([
    admin.from("visitor_events").select("*", { count: "exact", head: true }).eq("visitor_profile_id", profile.id),
    admin.from("visitor_sessions").select("*", { count: "exact", head: true }).eq("visitor_profile_id", profile.id),
  ]);

  await admin.from("visitor_profile_merges").insert({
    visitor_profile_id: profile.id,
    anonymous_id: anonymousId,
    user_id: user.id,
    merge_source: "auth_session",
    events_linked: eventsLinked ?? 0,
    sessions_linked: sessionsLinked ?? 0,
    merged_at: now,
  });

  return NextResponse.json({
    ok: true,
    merged: true,
    visitorProfileId: profile.id,
    eventsLinked: eventsLinked ?? 0,
    sessionsLinked: sessionsLinked ?? 0,
  });
}
