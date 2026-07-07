import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  normalizeReferralEventType,
  normalizeReferralRoute,
  sanitizeReferralCode,
} from "@/lib/referral-share-campaigns";
import { cleanText } from "@/lib/source-submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReferralEventBody = {
  referralCode?: unknown;
  anonymousId?: unknown;
  eventType?: unknown;
  route?: unknown;
  entityType?: unknown;
  entityId?: unknown;
  metadata?: unknown;
};

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

function safeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const metadata: Record<string, string | number | boolean | null> = {};
  for (const [key, rawValue] of Object.entries(value as Record<string, unknown>).slice(0, 20)) {
    if (["email", "phone", "address", "name", "message", "summary", "notes", "token"].includes(key)) continue;
    if (typeof rawValue === "string") metadata[key] = cleanText(rawValue, 255);
    if (typeof rawValue === "number" && Number.isFinite(rawValue)) metadata[key] = rawValue;
    if (typeof rawValue === "boolean") metadata[key] = rawValue;
    if (rawValue === null) metadata[key] = null;
  }
  return metadata;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ReferralEventBody | null;
  const eventType = normalizeReferralEventType(body?.eventType);
  if (!eventType) return NextResponse.json({ ok: false, error: "Unsupported referral event." }, { status: 400 });

  const referralCode = sanitizeReferralCode(body?.referralCode) || null;
  const anonymousId = cleanText(body?.anonymousId, 120) || null;
  const route = normalizeReferralRoute(body?.route);
  const entityType = cleanText(body?.entityType, 80) || null;
  const entityId = cleanText(body?.entityId, 180) || null;
  const referredUserId = await getOptionalUserId();
  const supabase = getSupabaseAdminClient();

  if (supabase) {
    let referringUserId: string | null = null;
    if (referralCode) {
      const { data } = await supabase
        .from("referral_codes")
        .select("user_id")
        .eq("code", referralCode)
        .eq("status", "active")
        .maybeSingle();
      referringUserId = data?.user_id ?? null;
    }

    const { error } = await supabase.from("referral_events").insert({
      referral_code: referralCode,
      referring_user_id: referringUserId,
      anonymous_id: anonymousId,
      referred_user_id: referredUserId,
      event_type: eventType,
      route,
      entity_type: entityType,
      entity_id: entityId,
      metadata: safeMetadata(body?.metadata),
    });

    if (error) {
      console.warn(JSON.stringify({ level: "warn", msg: "referral_event_insert_skipped", error: error.message }));
    }
  }

  return NextResponse.json({ ok: true });
}
