import { NextResponse } from "next/server";
import { getAdminUserForServer } from "@/lib/admin-auth";
import { isFeatureEnabled } from "@/lib/feature-flags";
import {
  createPlaintextApiKey,
  getApiKeyPrefix,
  getPublicDataApiAdminData,
  hashApiKey,
  normalizeApiAccessStatus,
  normalizeApiScopes,
} from "@/lib/public-data-api";
import { cleanText } from "@/lib/source-submissions";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminApiBody = {
  action?: unknown;
  requestId?: unknown;
  status?: unknown;
  apiKeyId?: unknown;
  organizationName?: unknown;
  label?: unknown;
  scopes?: unknown;
  rateLimitPerDay?: unknown;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function withoutKeyHash<T extends Record<string, unknown>>(row: T) {
  const safeRow = { ...row };
  delete safeRow.key_hash;
  return safeRow;
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
    metadata: { source: "admin_public_data_api" },
  });
}

export async function GET() {
  await getAdminUserForServer();
  return NextResponse.json({ ok: true, data: await getPublicDataApiAdminData() });
}

export async function POST(request: Request) {
  const adminUser = await getAdminUserForServer();
  const supabase = getSupabaseAdminClient();
  if (!supabase) return jsonError("Admin data connection is unavailable.", 503);

  const body = (await request.json().catch(() => null)) as AdminApiBody | null;
  const action = cleanText(body?.action, 80);

  if (action === "update_access_request_status") {
    const requestId = cleanText(body?.requestId, 80);
    const status = normalizeApiAccessStatus(body?.status);
    if (!requestId) return jsonError("API access request ID is required.");

    const { data, error } = await supabase
      .from("api_access_requests")
      .update({ status })
      .eq("id", requestId)
      .select("*")
      .maybeSingle();

    if (error || !data) return jsonError(error?.message || "API access request status update failed.", 500);
    await audit("api_access_request_status_changed", "api_access_request", requestId, data as Record<string, unknown>, adminUser);
    return NextResponse.json({ ok: true, data });
  }

  if (action === "create_api_key") {
    const enabled = await isFeatureEnabled("ENABLE_PUBLIC_API");
    if (!enabled) return jsonError("ENABLE_PUBLIC_API must be true before issuing API keys.", 403);

    const scopes = normalizeApiScopes(body?.scopes);
    if (!scopes.length) return jsonError("Choose at least one public API scope.");

    const plaintextKey = createPlaintextApiKey();
    const rateLimit = Math.max(1, Math.min(100000, Number.parseInt(String(body?.rateLimitPerDay ?? "1000"), 10) || 1000));
    const insertPayload = {
      organization_name: cleanText(body?.organizationName, 255) || null,
      key_hash: hashApiKey(plaintextKey),
      key_prefix: getApiKeyPrefix(plaintextKey),
      label: cleanText(body?.label, 255) || null,
      status: "active",
      scopes,
      rate_limit_per_day: rateLimit,
    };

    const { data, error } = await supabase.from("api_keys").insert(insertPayload).select("*").maybeSingle();
    if (error || !data) return jsonError(error?.message || "API key create failed.", 500);

    await audit("api_key_created", "api_key", data.id as string, { ...insertPayload, key_hash: "[redacted]" }, adminUser);
    return NextResponse.json({ ok: true, data: withoutKeyHash(data as Record<string, unknown>), plaintextKey });
  }

  if (action === "revoke_api_key") {
    const apiKeyId = cleanText(body?.apiKeyId, 80);
    if (!apiKeyId) return jsonError("API key ID is required.");

    const { data, error } = await supabase
      .from("api_keys")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("id", apiKeyId)
      .select("*")
      .maybeSingle();

    if (error || !data) return jsonError(error?.message || "API key revoke failed.", 500);
    await audit("api_key_revoked", "api_key", apiKeyId, { id: apiKeyId, status: "revoked" }, adminUser);
    return NextResponse.json({ ok: true, data: withoutKeyHash(data as Record<string, unknown>) });
  }

  return jsonError("Unsupported API admin action.");
}
