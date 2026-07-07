import { NextResponse } from "next/server";
import { getAdminUserForServer } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { cleanLongText, cleanText, cleanUrl } from "@/lib/source-submissions";
import { RECORDS_SENSITIVITY_STATUSES } from "@/lib/records-response-intake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const workflowStatuses = new Set([
  "needs_review",
  "reviewed",
  "converted_to_packet",
  "attached_to_profile",
  "attached_to_story",
  "attached_to_timeline",
  "rejected",
  "archived",
]);
const sensitivityStatuses = new Set<string>(RECORDS_SENSITIVITY_STATUSES);
const attachTargetTypes = new Set(["profile", "story", "race", "timeline", "source_packet"]);

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function formText(formData: FormData, key: string, max = 255) {
  return cleanText(formData.get(key), max);
}

async function audit(
  action: string,
  targetId: string,
  beforeValues: Record<string, unknown> | null,
  afterValues: Record<string, unknown>,
  adminUser: { id: string; email: string | null },
) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;
  await supabase.from("admin_audit_log").insert({
    admin_user_id: adminUser.id,
    admin_email: adminUser.email,
    action,
    target_type: "records_response",
    target_id: targetId,
    before_values: beforeValues ?? {},
    after_values: afterValues,
    note: typeof afterValues.note === "string" ? afterValues.note : null,
    metadata: { source: "admin_records_response_desk" },
  });
}

async function trackAdminEvent(eventName: string, adminUser: { id: string; email: string | null }, metadata: Record<string, unknown>) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;
  await supabase.from("site_analytics_events").insert({
    event_name: eventName,
    user_id: adminUser.id,
    route: "/admin/records-responses",
    metadata,
  });
}

export async function POST(request: Request) {
  const adminUser = await getAdminUserForServer();
  const supabase = getSupabaseAdminClient();
  if (!supabase) return jsonError("Supabase admin client is not configured.", 503);

  const formData = await request.formData();
  const action = formText(formData, "action", 80);
  const responseId = formText(formData, "response_id", 80);
  if (!responseId) return jsonError("Response ID is required.");

  const { data: before, error: beforeError } = await supabase
    .from("records_responses")
    .select("*")
    .eq("id", responseId)
    .maybeSingle();

  if (beforeError || !before) return jsonError(beforeError?.message || "Records response not found.", 404);

  if (action === "review_update") {
    const sensitivityStatus = formText(formData, "sensitivity_status", 80);
    const status = formText(formData, "status", 80);
    const publicSummary = cleanLongText(formData.get("public_summary"), 4000);
    const note = cleanLongText(formData.get("note"), 4000);

    if (!sensitivityStatuses.has(sensitivityStatus)) return jsonError("Unsupported sensitivity status.");
    if (!workflowStatuses.has(status)) return jsonError("Unsupported workflow status.");
    if ((sensitivityStatus === "safe_public_record" || sensitivityStatus === "published_summary_only") && !publicSummary) {
      return jsonError("A safe public summary is required before marking a response publishable.");
    }

    const updatePayload = {
      sensitivity_status: sensitivityStatus,
      status,
      public_summary: publicSummary || null,
    };
    const { data: after, error } = await supabase
      .from("records_responses")
      .update(updatePayload)
      .eq("id", responseId)
      .select("*")
      .maybeSingle();

    if (error || !after) return jsonError(error?.message || "Records response review update failed.", 500);

    await supabase.from("records_response_events").insert({
      records_response_id: responseId,
      event_type: "admin_reviewed",
      actor_user_id: adminUser.id,
      metadata: { sensitivity_status: sensitivityStatus, status, note },
    });
    await audit("records_response_reviewed", responseId, before, { ...after, note }, adminUser);
    await trackAdminEvent("records_response_admin_reviewed", adminUser, {
      response_id: responseId,
      sensitivity_status: sensitivityStatus,
      status,
    });
    return NextResponse.redirect(new URL("/admin/records-responses?saved=review", request.url), 303);
  }

  if (action === "attach_source") {
    const targetType = formText(formData, "target_type", 80);
    const targetId = formText(formData, "target_id", 180);
    const sourceUrl = cleanUrl(formData.get("source_url"));
    if (!attachTargetTypes.has(targetType)) return jsonError("Unsupported attach target type.");
    if (!targetId) return jsonError("Target ID or slug is required.");
    if (!sourceUrl) return jsonError("A public source URL is required for attachment tracking.");

    const status =
      targetType === "profile"
        ? "attached_to_profile"
        : targetType === "story"
          ? "attached_to_story"
          : targetType === "timeline"
            ? "attached_to_timeline"
            : "converted_to_packet";

    const { data: after, error } = await supabase
      .from("records_responses")
      .update({ status })
      .eq("id", responseId)
      .select("*")
      .maybeSingle();

    if (error || !after) return jsonError(error?.message || "Records response attachment update failed.", 500);

    const event = {
      records_response_id: responseId,
      event_type: "attached_to_record",
      actor_user_id: adminUser.id,
      metadata: { target_type: targetType, target_id: targetId, source_url: sourceUrl, status },
    };
    await supabase.from("records_response_events").insert(event);
    await audit("records_response_attached", responseId, before, event.metadata, adminUser);
    await trackAdminEvent(targetType === "profile" ? "records_response_attached_to_profile" : "records_response_admin_reviewed", adminUser, {
      response_id: responseId,
      target_type: targetType,
      status,
    });
    return NextResponse.redirect(new URL("/admin/records-responses?saved=attached", request.url), 303);
  }

  return jsonError("Unsupported records response admin action.");
}
