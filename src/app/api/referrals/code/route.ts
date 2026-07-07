import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  buildReferralUrl,
  makeReferralCode,
  normalizeReferralRoute,
  sanitizeReferralCode,
} from "@/lib/referral-share-campaigns";
import { cleanText } from "@/lib/source-submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReferralCodeBody = {
  anonymousId?: unknown;
  path?: unknown;
  sourceContext?: unknown;
  entityType?: unknown;
  entityId?: unknown;
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

async function insertReferralEvent(payload: Record<string, unknown>) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;
  await supabase.from("referral_events").insert(payload);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ReferralCodeBody | null;
  const path = normalizeReferralRoute(body?.path);
  const code = sanitizeReferralCode(makeReferralCode());
  const userId = await getOptionalUserId();
  const anonymousId = cleanText(body?.anonymousId, 120) || null;
  const sourceContext = cleanText(body?.sourceContext, 180) || null;
  const entityType = cleanText(body?.entityType, 80) || null;
  const entityId = cleanText(body?.entityId, 180) || null;
  const referralUrl = buildReferralUrl(path, code);
  const supabase = getSupabaseAdminClient();

  let persisted = false;

  if (supabase) {
    const { error } = await supabase.from("referral_codes").insert({
      user_id: userId,
      anonymous_id: anonymousId,
      code,
      status: "active",
      source_context: sourceContext,
    });

    if (!error) {
      persisted = true;
      await insertReferralEvent({
        referral_code: code,
        referring_user_id: userId,
        anonymous_id: anonymousId,
        event_type: "referral_link_created",
        route: path,
        entity_type: entityType,
        entity_id: entityId,
        metadata: {
          source_context: sourceContext,
          persisted: true,
        },
      });
    } else {
      console.warn(JSON.stringify({ level: "warn", msg: "referral_code_insert_skipped", error: error.message }));
    }
  }

  return NextResponse.json({
    ok: true,
    code,
    referralUrl,
    persisted,
  });
}
