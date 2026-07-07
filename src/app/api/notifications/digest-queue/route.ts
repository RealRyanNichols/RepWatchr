import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  flattenDigestPreviewItems,
  generateDigestPreview,
  getNotificationPreferences,
  isEmailSendingEnabled,
} from "@/lib/digest-notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Supabase auth is not configured." }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Supabase admin client is not configured." }, { status: 503 });

  const [preferences, preview] = await Promise.all([
    getNotificationPreferences(user.id, user.email),
    generateDigestPreview(user.id),
  ]);
  const canSend = isEmailSendingEnabled() && Boolean(preferences.email) && Boolean(preferences.email_consent_at) && !preferences.unsubscribed_at;
  const status = canSend ? "pending" : "sending_disabled";

  const { data: queue, error: queueError } = await admin
    .from("digest_queue")
    .insert({
      user_id: user.id,
      digest_type: preview.digestType,
      subject: preview.subject,
      payload: preview,
      status,
      scheduled_for: null,
      error_message: canSend ? null : "Email sending disabled or consent missing. Preview saved only.",
    })
    .select("id, status")
    .maybeSingle();

  if (queueError || !queue?.id) {
    return NextResponse.json({ error: queueError?.message || "Digest queue insert failed." }, { status: 500 });
  }

  const digestItems = flattenDigestPreviewItems(preview).map((digestItem) => ({
    digest_queue_id: queue.id,
    entity_type: digestItem.entityType,
    entity_id: digestItem.entityId,
    title: digestItem.title,
    summary: digestItem.summary,
    url: digestItem.url,
    priority: digestItem.priority,
    metadata: digestItem.metadata ?? {},
  }));

  if (digestItems.length) {
    const { error: itemsError } = await admin.from("digest_items").insert(digestItems);
    if (itemsError) {
      await admin.from("digest_queue").update({ status: "failed", error_message: itemsError.message }).eq("id", queue.id);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }
  }

  await admin.from("notification_events").insert({
    user_id: user.id,
    digest_queue_id: queue.id,
    event_type: "digest_queue_created",
    metadata: { digest_type: preview.digestType, status },
  });

  return NextResponse.json({ ok: true, digestQueueId: queue.id, status, preview });
}
