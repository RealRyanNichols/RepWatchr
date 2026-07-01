import { NextResponse } from "next/server";
import { writeAdminAuditLog } from "@/lib/admin-audit";
import { requireAdminClient } from "@/lib/admin-auth";
import { serverTrackEvent } from "@/lib/analytics-server";
import {
  SOURCE_CONFIDENCES,
  SOURCE_PRIORITIES,
  SOURCE_STATUSES,
  type SourceConfidence,
  type SourcePriority,
  type SourceStatus,
} from "@/lib/source-submission-options";
import {
  attachSourceSubmissionToEntity,
  updateSourceSubmissionStatus,
} from "@/lib/source-submissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminClient();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const [{ data, error }, { data: events }, { data: notes }, { data: links }] = await Promise.all([
    auth.admin.from("source_submissions").select("*").eq("id", id).maybeSingle(),
    auth.admin
      .from("source_submission_events")
      .select("id, event_type, actor_user_id, old_status, new_status, metadata, created_at")
      .eq("source_submission_id", id)
      .order("created_at", { ascending: false }),
    auth.admin
      .from("source_review_notes")
      .select("id, reviewer_user_id, note, visibility, created_at")
      .eq("source_submission_id", id)
      .order("created_at", { ascending: false }),
    auth.admin
      .from("source_links")
      .select("id, entity_type, entity_id, source_url, source_title, source_type, confidence, status, created_at")
      .eq("submission_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Source submission not found." }, { status: 404 });

  return NextResponse.json({
    submission: data,
    events: events ?? [],
    notes: notes ?? [],
    links: links ?? [],
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminClient();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    action?: unknown;
    status?: unknown;
    confidence?: unknown;
    priority?: unknown;
    assignedReviewer?: unknown;
    duplicateOf?: unknown;
    note?: unknown;
    entityType?: unknown;
    entityId?: unknown;
    summary?: unknown;
  } | null;

  if (!body) return NextResponse.json({ error: "Send a valid admin source action." }, { status: 400 });

  const { data: beforeSubmission } = await auth.admin
    .from("source_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const beforeValue = beforeSubmission ? { ...(beforeSubmission as Record<string, unknown>) } : null;

  if (body.action === "attach") {
    const entityType = typeof body.entityType === "string" ? body.entityType : "";
    const entityId = typeof body.entityId === "string" ? body.entityId : "";
    const confidence =
      typeof body.confidence === "string" && (SOURCE_CONFIDENCES as readonly string[]).includes(body.confidence)
        ? (body.confidence as SourceConfidence)
        : "source_backed";

    const result = await attachSourceSubmissionToEntity({
      admin: auth.admin,
      submissionId: id,
      actorUserId: auth.user.id,
      entityType,
      entityId,
      summary: typeof body.summary === "string" ? body.summary : undefined,
      confidence,
    });

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    const { data: afterSubmission } = await auth.admin
      .from("source_submissions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    await Promise.all([
      writeAdminAuditLog({
        admin: auth.admin,
        actorUserId: auth.user.id,
        action: "source_attached",
        entityType: "source_submission",
        entityId: id,
        beforeValue,
        afterValue: afterSubmission ? { ...(afterSubmission as Record<string, unknown>) } : null,
        metadata: { entity_type: entityType, entity_id: entityId, source_link_id: result.sourceLinkId },
      }),
      serverTrackEvent({
        eventName: "admin_source_review_completed",
        userId: auth.user.id,
        route: "/admin/sources",
        metadata: { source_submission_id: id, action: "attach", entity_type: entityType, entity_id: entityId },
      }),
    ]);
    return NextResponse.json({ ok: true, sourceLinkId: result.sourceLinkId, status: result.status });
  }

  const status = typeof body.status === "string" ? body.status : "";
  if (!(SOURCE_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Unsupported source status." }, { status: 400 });
  }

  const confidence =
    typeof body.confidence === "string" && (SOURCE_CONFIDENCES as readonly string[]).includes(body.confidence)
      ? (body.confidence as SourceConfidence)
      : undefined;
  const priority =
    typeof body.priority === "string" && (SOURCE_PRIORITIES as readonly string[]).includes(body.priority)
      ? (body.priority as SourcePriority)
      : undefined;

  const result = await updateSourceSubmissionStatus({
    admin: auth.admin,
    submissionId: id,
    actorUserId: auth.user.id,
    status: status as SourceStatus,
    confidence,
    priority,
    assignedReviewer: typeof body.assignedReviewer === "string" ? body.assignedReviewer : undefined,
    duplicateOf: typeof body.duplicateOf === "string" ? body.duplicateOf : undefined,
    note: typeof body.note === "string" ? body.note : undefined,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  const { data: afterSubmission } = await auth.admin
    .from("source_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  await Promise.all([
    writeAdminAuditLog({
      admin: auth.admin,
      actorUserId: auth.user.id,
      action: "source_status_changed",
      entityType: "source_submission",
      entityId: id,
      beforeValue,
      afterValue: afterSubmission ? { ...(afterSubmission as Record<string, unknown>) } : null,
      metadata: { status, confidence, priority },
    }),
    serverTrackEvent({
      eventName: "admin_source_review_completed",
      userId: auth.user.id,
      route: "/admin/sources",
      metadata: { source_submission_id: id, action: "status", status },
    }),
  ]);
  return NextResponse.json({ ok: true });
}
