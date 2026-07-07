import { NextResponse } from "next/server";
import { getAdminUserForServer } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { cleanText, cleanUrl, cleanLongText } from "@/lib/source-submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function formText(formData: FormData, key: string, max = 255) {
  return cleanText(formData.get(key), max);
}

function formUrl(formData: FormData, key: string) {
  return cleanUrl(formData.get(key));
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
    metadata: { source: "admin_meeting_desk" },
  });
}

export async function POST(request: Request) {
  const adminUser = await getAdminUserForServer();
  const supabase = getSupabaseAdminClient();
  if (!supabase) return jsonError("Supabase admin client is not configured.", 503);

  const formData = await request.formData();
  const action = formText(formData, "action", 80);

  if (action === "create_public_body") {
    const payload = {
      name: formText(formData, "name", 255),
      slug: formText(formData, "slug", 180),
      body_type: formText(formData, "body_type", 80) || "other",
      state: formText(formData, "state", 20) || null,
      county: formText(formData, "county", 120) || null,
      city: formText(formData, "city", 120) || null,
      official_url: formUrl(formData, "official_url") || null,
      meetings_url: formUrl(formData, "meetings_url") || null,
      source_count: [formUrl(formData, "official_url"), formUrl(formData, "meetings_url")].filter(Boolean).length,
      status: "needs_review",
    };
    if (!payload.name || !payload.slug) return jsonError("Body name and slug are required.");
    const { data, error } = await supabase.from("public_bodies").upsert(payload, { onConflict: "slug" }).select("*").maybeSingle();
    if (error || !data) return jsonError(error?.message || "Public body save failed.", 500);
    await audit("public_body_upserted", "public_body", data.id, data, adminUser);
    return NextResponse.redirect(new URL("/admin/meetings?saved=public_body", request.url), 303);
  }

  if (action === "create_meeting") {
    const publicBodySlug = formText(formData, "public_body_slug", 180);
    const { data: body } = await supabase.from("public_bodies").select("id").eq("slug", publicBodySlug).maybeSingle();
    if (!body?.id) return jsonError("Public body slug was not found.", 404);
    const urls = [formUrl(formData, "agenda_url"), formUrl(formData, "minutes_url"), formUrl(formData, "video_url"), formUrl(formData, "transcript_url")].filter(Boolean);
    const payload = {
      public_body_id: body.id,
      title: formText(formData, "title", 255),
      slug: formText(formData, "slug", 180),
      meeting_date: formText(formData, "meeting_date", 80) || null,
      agenda_url: formUrl(formData, "agenda_url") || null,
      minutes_url: formUrl(formData, "minutes_url") || null,
      video_url: formUrl(formData, "video_url") || null,
      transcript_url: formUrl(formData, "transcript_url") || null,
      status: formText(formData, "status", 80) || "scheduled",
      source_count: urls.length,
    };
    if (!payload.title || !payload.slug) return jsonError("Meeting title and slug are required.");
    const { data, error } = await supabase.from("meetings").upsert(payload, { onConflict: "slug" }).select("*").maybeSingle();
    if (error || !data) return jsonError(error?.message || "Meeting save failed.", 500);
    await audit("meeting_upserted", "meeting", data.id, data, adminUser);
    return NextResponse.redirect(new URL("/admin/meetings?saved=meeting", request.url), 303);
  }

  if (action === "create_meeting_item") {
    const meetingSlug = formText(formData, "meeting_slug", 180);
    const { data: meeting } = await supabase.from("meetings").select("id").eq("slug", meetingSlug).maybeSingle();
    if (!meeting?.id) return jsonError("Meeting slug was not found.", 404);
    const payload = {
      meeting_id: meeting.id,
      item_number: formText(formData, "item_number", 80) || null,
      title: formText(formData, "title", 255),
      description: cleanLongText(formData.get("description"), 2500) || null,
      action_type: formText(formData, "action_type", 120) || null,
      vote_result: formText(formData, "vote_result", 120) || null,
      source_url: formUrl(formData, "source_url") || null,
      status: formText(formData, "status", 80) || "needs_review",
    };
    if (!payload.title) return jsonError("Meeting item title is required.");
    const { data, error } = await supabase.from("meeting_items").insert(payload).select("*").maybeSingle();
    if (error || !data) return jsonError(error?.message || "Meeting item save failed.", 500);
    await audit("meeting_item_created", "meeting_item", data.id, data, adminUser);
    return NextResponse.redirect(new URL("/admin/meetings?saved=meeting_item", request.url), 303);
  }

  if (action === "create_meeting_vote") {
    const payload = {
      meeting_item_id: formText(formData, "meeting_item_id", 80),
      voter_name: formText(formData, "voter_name", 180) || null,
      vote_position: formText(formData, "vote_position", 80) || null,
      source_url: formUrl(formData, "source_url") || null,
      confidence: formText(formData, "confidence", 80) || "needs_review",
    };
    if (!payload.meeting_item_id) return jsonError("Meeting item UUID is required.");
    const { data, error } = await supabase.from("meeting_votes").insert(payload).select("*").maybeSingle();
    if (error || !data) return jsonError(error?.message || "Meeting vote save failed.", 500);
    await audit("meeting_vote_created", "meeting_vote", data.id, data, adminUser);
    return NextResponse.redirect(new URL("/admin/meetings?saved=meeting_vote", request.url), 303);
  }

  return jsonError("Unsupported local meeting admin action.");
}
