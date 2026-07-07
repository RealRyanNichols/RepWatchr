import { NextResponse } from "next/server";
import { getAdminUserForServer } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getShareCampaignAdminData } from "@/lib/share-campaign-admin";
import {
  findUnsafeShareCopy,
  normalizeReferralRoute,
  normalizeShareCampaignType,
} from "@/lib/referral-share-campaigns";
import { cleanText } from "@/lib/source-submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminShareCampaignBody = {
  action?: unknown;
  campaignId?: unknown;
  key?: unknown;
  name?: unknown;
  description?: unknown;
  campaignType?: unknown;
  status?: unknown;
  defaultShareText?: unknown;
  targetRoute?: unknown;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function slugifyKey(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

async function audit(action: string, targetType: string, targetId: string, afterValues: Record<string, unknown>, adminUser: { id: string; email: string | null }) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;
  await supabase.from("admin_audit_log").insert({
    admin_user_id: adminUser.id,
    admin_email: adminUser.email,
    action,
    target_type: targetType,
    target_id: targetId,
    after_values: afterValues,
    metadata: { source: "admin_share_campaign_manager" },
  });
}

function validateSafeCopy(copy: string) {
  const findings = findUnsafeShareCopy(copy);
  if (!findings.length) return "";
  return `Unsafe share copy language: ${findings.map((finding) => finding.term).join(", ")}.`;
}

export async function GET() {
  await getAdminUserForServer();
  return NextResponse.json({ ok: true, data: await getShareCampaignAdminData() });
}

export async function POST(request: Request) {
  const adminUser = await getAdminUserForServer();
  const supabase = getSupabaseAdminClient();
  if (!supabase) return jsonError("Admin data connection is unavailable.", 503);

  const body = (await request.json().catch(() => null)) as AdminShareCampaignBody | null;
  const action = cleanText(body?.action, 80);

  if (action === "create_campaign" || action === "update_campaign_copy") {
    const name = cleanText(body?.name, 160);
    const key = slugifyKey(cleanText(body?.key, 160) || name);
    const campaignType = normalizeShareCampaignType(body?.campaignType);
    const defaultShareText = cleanText(body?.defaultShareText, 500);
    const targetRoute = normalizeReferralRoute(body?.targetRoute);
    const unsafeCopyError = validateSafeCopy(defaultShareText);

    if (!key || !name || !campaignType || !defaultShareText) {
      return jsonError("Campaign key, name, type, and default share text are required.");
    }
    if (unsafeCopyError) return jsonError(unsafeCopyError);

    if (action === "create_campaign") {
      const payload = {
        key,
        name,
        description: cleanText(body?.description, 500) || null,
        campaign_type: campaignType,
        status: "active",
        default_share_text: defaultShareText,
        target_route: targetRoute,
      };
      const { data, error } = await supabase.from("share_campaigns").upsert(payload, { onConflict: "key" }).select("*").maybeSingle();
      if (error || !data) return jsonError(error?.message || "Campaign save failed.", 500);
      await audit("share_campaign_upserted", "share_campaign", data.id, data, adminUser);
      return NextResponse.json({ ok: true, data });
    }

    const campaignId = cleanText(body?.campaignId, 80);
    if (!campaignId) return jsonError("Campaign ID is required.");
    const payload = {
      name,
      description: cleanText(body?.description, 500) || null,
      campaign_type: campaignType,
      default_share_text: defaultShareText,
      target_route: targetRoute,
    };
    const { data, error } = await supabase.from("share_campaigns").update(payload).eq("id", campaignId).select("*").maybeSingle();
    if (error || !data) return jsonError(error?.message || "Campaign update failed.", 500);
    await audit("share_campaign_updated", "share_campaign", data.id, data, adminUser);
    return NextResponse.json({ ok: true, data });
  }

  if (action === "update_campaign_status") {
    const campaignId = cleanText(body?.campaignId, 80);
    const status = cleanText(body?.status, 40);
    if (!campaignId || !["active", "paused", "archived"].includes(status)) return jsonError("Valid campaign ID and status are required.");

    const { data, error } = await supabase.from("share_campaigns").update({ status }).eq("id", campaignId).select("*").maybeSingle();
    if (error || !data) return jsonError(error?.message || "Campaign status update failed.", 500);
    await audit("share_campaign_status_updated", "share_campaign", data.id, data, adminUser);
    return NextResponse.json({ ok: true, data });
  }

  return jsonError("Unsupported share campaign admin action.");
}
