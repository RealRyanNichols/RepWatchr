import { NextRequest, NextResponse } from "next/server";
import { serverTrackEvent } from "@/lib/analytics-server";
import { defaultDigestPreferences } from "@/lib/member-dashboard";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const booleanFields = [
  "weekly_digest",
  "daily_digest",
  "breaking_alerts",
  "watched_official_updates",
  "watched_race_updates",
  "source_review_updates",
  "contribution_updates",
  "package_updates",
] as const;

function envReady() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

async function getAuthedSupabase() {
  if (!envReady()) {
    return {
      supabase: null,
      userId: null,
      response: NextResponse.json({ ok: false, error: "Digest preferences need Supabase auth." }, { status: 503 }),
    };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      supabase: null,
      userId: null,
      response: NextResponse.json({ ok: false, error: "Login required." }, { status: 401 }),
    };
  }

  return { supabase, userId: user.id, response: null };
}

function cleanEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!email) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email.slice(0, 180) : null;
}

function cleanPatch(body: Record<string, unknown>) {
  const patch: Record<string, boolean | string | null> = {};
  for (const field of booleanFields) {
    if (field in body) patch[field] = body[field] === true;
  }
  if ("email" in body) patch.email = cleanEmail(body.email);
  return patch;
}

export async function GET() {
  const auth = await getAuthedSupabase();
  if (auth.response) return auth.response;
  if (!auth.supabase || !auth.userId) {
    return NextResponse.json({ ok: false, error: "Digest preferences are unavailable." }, { status: 503 });
  }

  const { data, error } = await auth.supabase
    .from("notification_preferences")
    .select("weekly_digest, daily_digest, breaking_alerts, watched_official_updates, watched_race_updates, source_review_updates, contribution_updates, package_updates, email")
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: true, preferences: defaultDigestPreferences, fallback: true });
  }

  return NextResponse.json({ ok: true, preferences: data ?? defaultDigestPreferences });
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthedSupabase();
  if (auth.response) return auth.response;
  if (!auth.supabase || !auth.userId) {
    return NextResponse.json({ ok: false, error: "Digest preferences are unavailable." }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const patch = cleanPatch(body);
  if (!Object.keys(patch).length) {
    return NextResponse.json({ ok: false, error: "No preference changes were sent." }, { status: 400 });
  }

  const row = {
    ...defaultDigestPreferences,
    ...patch,
    user_id: auth.userId,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await auth.supabase
    .from("notification_preferences")
    .upsert(row, { onConflict: "user_id" })
    .select("weekly_digest, daily_digest, breaking_alerts, watched_official_updates, watched_race_updates, source_review_updates, contribution_updates, package_updates, email")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: "Digest preferences could not be saved." }, { status: 500 });
  }

  await serverTrackEvent({
    eventName: "digest_settings_changed",
    userId: auth.userId,
    route: "/dashboard",
    metadata: { fields: Object.keys(patch).join(",") },
  });

  return NextResponse.json({ ok: true, preferences: data });
}
