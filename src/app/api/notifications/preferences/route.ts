import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { cleanText } from "@/lib/source-submissions";
import { getNotificationPreferences } from "@/lib/digest-notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const booleanFields = [
  "weekly_digest",
  "daily_digest",
  "breaking_alerts",
  "watched_official_updates",
  "watched_race_updates",
  "watched_jurisdiction_updates",
  "source_review_updates",
  "contribution_updates",
  "package_updates",
  "records_request_updates",
] as const;

type PreferencesBody = Record<string, unknown>;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function normalizeBoolean(value: unknown) {
  return value === true || value === "true" || value === "on" || value === "yes";
}

async function getUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { user: null, error: "Supabase auth is not configured." };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, error: user ? "" : "Login required." };
}

export async function GET() {
  const { user, error } = await getUser();
  if (!user) return jsonError(error, error === "Login required." ? 401 : 503);
  const preferences = await getNotificationPreferences(user.id, user.email);
  return NextResponse.json({ ok: true, preferences });
}

export async function POST(request: Request) {
  const { user, error } = await getUser();
  if (!user) return jsonError(error, error === "Login required." ? 401 : 503);

  const admin = getSupabaseAdminClient();
  if (!admin) return jsonError("Supabase admin client is not configured.", 503);

  const body = (await request.json().catch(() => null)) as PreferencesBody | null;
  if (!body) return jsonError("Invalid preferences payload.");

  const current = await getNotificationPreferences(user.id, user.email);
  const patch: Record<string, unknown> = {
    user_id: user.id,
    email: cleanText(body.email, 255) || user.email || current.email || null,
  };
  const changedKeys: string[] = [];

  for (const field of booleanFields) {
    if (field in body) {
      patch[field] = normalizeBoolean(body[field]);
      changedKeys.push(field);
    }
  }

  if (normalizeBoolean(body.email_consent)) {
    patch.email_consent_at = current.email_consent_at ?? new Date().toISOString();
    patch.unsubscribed_at = null;
    changedKeys.push("email_consent_at");
  }

  if (body.email_consent === false) {
    patch.email_consent_at = null;
    changedKeys.push("email_consent_at");
  }

  if (normalizeBoolean(body.unsubscribe)) {
    patch.unsubscribed_at = new Date().toISOString();
    patch.breaking_alerts = false;
    patch.daily_digest = false;
    patch.weekly_digest = false;
    changedKeys.push("unsubscribed_at");
  }

  const { data, error: saveError } = await admin
    .from("notification_preferences")
    .upsert(patch, { onConflict: "user_id" })
    .select("*")
    .maybeSingle();

  if (saveError || !data) return jsonError(saveError?.message || "Notification preferences save failed.", 500);

  await admin.from("notification_events").insert({
    user_id: user.id,
    event_type: normalizeBoolean(body.unsubscribe) ? "digest_unsubscribe_clicked" : "digest_preference_changed",
    metadata: { changed_keys: changedKeys.slice(0, 20) },
  });

  return NextResponse.json({ ok: true, preferences: data });
}
