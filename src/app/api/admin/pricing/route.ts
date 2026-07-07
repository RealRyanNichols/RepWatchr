import { NextResponse } from "next/server";
import { getAdminUserForServer } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  getPricingAdminData,
  makeInviteCode,
  normalizeBetaStatus,
  normalizeExperimentKey,
  normalizeExperimentStatus,
  normalizeExperimentVariants,
  normalizeFlagKeyForAdmin,
  normalizeFlagRollout,
  recordPricingExperimentEvent,
} from "@/lib/pricing-beta";
import { CORE_FEATURE_FLAGS } from "@/lib/feature-flags";
import { cleanLongText, cleanText } from "@/lib/source-submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminPricingBody = {
  action?: unknown;
  flagKey?: unknown;
  enabled?: unknown;
  rolloutPercentage?: unknown;
  description?: unknown;
  experimentId?: unknown;
  experimentKey?: unknown;
  packageKey?: unknown;
  name?: unknown;
  hypothesis?: unknown;
  variants?: unknown;
  status?: unknown;
  betaRequestId?: unknown;
  notes?: unknown;
  inviteCode?: unknown;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
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
    metadata: { source: "admin_pricing_beta" },
  });
}

export async function GET() {
  await getAdminUserForServer();
  return NextResponse.json({ ok: true, data: await getPricingAdminData() });
}

export async function POST(request: Request) {
  const adminUser = await getAdminUserForServer();
  const supabase = getSupabaseAdminClient();
  if (!supabase) return jsonError("Admin data connection is unavailable.", 503);

  const body = (await request.json().catch(() => null)) as AdminPricingBody | null;
  const action = cleanText(body?.action, 80);

  if (action === "upsert_feature_flag") {
    const flagKey = normalizeFlagKeyForAdmin(body?.flagKey);
    if (!CORE_FEATURE_FLAGS.includes(flagKey as (typeof CORE_FEATURE_FLAGS)[number])) {
      return jsonError("Choose a valid RepWatchr feature flag.");
    }

    const enabled = body?.enabled === true;
    const rollout = normalizeFlagRollout(body?.rolloutPercentage);
    const description = cleanText(body?.description, 500);

    const { data, error } = await supabase
      .from("feature_flags")
      .upsert(
        {
          key: flagKey,
          enabled,
          rollout_percentage: enabled ? rollout || 100 : 0,
          description: description || null,
          metadata: { updated_from: "admin_pricing" },
        },
        { onConflict: "key" },
      )
      .select("*")
      .maybeSingle();

    if (error || !data) return jsonError(error?.message || "Feature flag update failed.", 500);
    await recordPricingExperimentEvent({
      userId: adminUser.id,
      eventName: "feature_flag_changed",
      metadata: { key: flagKey, enabled, rollout_percentage: enabled ? rollout || 100 : 0 },
    });
    await audit("feature_flag_changed", "feature_flag", flagKey, data as Record<string, unknown>, adminUser);
    return NextResponse.json({ ok: true, data });
  }

  if (action === "create_experiment") {
    const packageKey = cleanText(body?.packageKey, 120).toLowerCase();
    const experimentKey = normalizeExperimentKey(body?.experimentKey) || `${packageKey}-${Date.now()}`;
    const name = cleanText(body?.name, 255);
    const hypothesis = cleanLongText(body?.hypothesis, 2000);
    const variants = normalizeExperimentVariants(body?.variants, packageKey);

    if (!packageKey || !name || !variants.length) return jsonError("Package, experiment name, and variants are required.");

    const { data, error } = await supabase
      .from("pricing_experiments")
      .insert({
        key: experimentKey,
        package_key: packageKey,
        name,
        hypothesis: hypothesis || null,
        variants,
        status: "draft",
      })
      .select("*")
      .maybeSingle();

    if (error || !data) return jsonError(error?.message || "Pricing experiment create failed.", 500);
    await recordPricingExperimentEvent({
      experimentId: data.id as string,
      userId: adminUser.id,
      eventName: "experiment_created",
      metadata: { package_key: packageKey, key: experimentKey },
    });
    await audit("pricing_experiment_created", "pricing_experiment", data.id as string, data as Record<string, unknown>, adminUser);
    return NextResponse.json({ ok: true, data });
  }

  if (action === "update_experiment_status") {
    const experimentId = cleanText(body?.experimentId, 80);
    const status = normalizeExperimentStatus(body?.status);
    if (!experimentId) return jsonError("Experiment ID is required.");

    const updatePayload: Record<string, unknown> = { status };
    if (status === "active") updatePayload.start_at = new Date().toISOString();
    if (status === "completed" || status === "archived") updatePayload.end_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("pricing_experiments")
      .update(updatePayload)
      .eq("id", experimentId)
      .select("*")
      .maybeSingle();

    if (error || !data) return jsonError(error?.message || "Experiment status update failed.", 500);
    await recordPricingExperimentEvent({
      experimentId,
      userId: adminUser.id,
      eventName: "experiment_status_changed",
      metadata: { status },
    });
    await audit("pricing_experiment_status_changed", "pricing_experiment", experimentId, data as Record<string, unknown>, adminUser);
    return NextResponse.json({ ok: true, data });
  }

  if (action === "update_beta_status") {
    const betaRequestId = cleanText(body?.betaRequestId, 80);
    const status = normalizeBetaStatus(body?.status);
    if (!betaRequestId) return jsonError("Beta request ID is required.");

    const { data, error } = await supabase
      .from("beta_access_requests")
      .update({ status })
      .eq("id", betaRequestId)
      .select("*")
      .maybeSingle();

    if (error || !data) return jsonError(error?.message || "Beta status update failed.", 500);
    await recordPricingExperimentEvent({
      userId: adminUser.id,
      eventName: "beta_status_changed",
      metadata: { beta_access_request_id: betaRequestId, status },
    });
    await audit("beta_access_status_changed", "beta_access_request", betaRequestId, data as Record<string, unknown>, adminUser);
    return NextResponse.json({ ok: true, data });
  }

  if (action === "invite_beta_user") {
    const betaRequestId = cleanText(body?.betaRequestId, 80);
    if (!betaRequestId) return jsonError("Beta request ID is required.");

    const { data: requestRow, error: lookupError } = await supabase
      .from("beta_access_requests")
      .select("*")
      .eq("id", betaRequestId)
      .maybeSingle();

    if (lookupError || !requestRow) return jsonError(lookupError?.message || "Beta request not found.", 404);
    const inviteCode = cleanText(body?.inviteCode, 80) || makeInviteCode(String(requestRow.package_key ?? "beta"));

    const { data, error } = await supabase
      .from("beta_access_requests")
      .update({
        status: "invited",
        invite_code: inviteCode,
        invited_at: new Date().toISOString(),
      })
      .eq("id", betaRequestId)
      .select("*")
      .maybeSingle();

    if (error || !data) return jsonError(error?.message || "Beta invite failed.", 500);
    await recordPricingExperimentEvent({
      userId: adminUser.id,
      eventName: "beta_invite_sent",
      metadata: { beta_access_request_id: betaRequestId, package_key: requestRow.package_key, invite_code: inviteCode },
    });
    await audit("beta_invite_sent", "beta_access_request", betaRequestId, data as Record<string, unknown>, adminUser);
    return NextResponse.json({ ok: true, data });
  }

  return jsonError("Unsupported pricing action.");
}
