import { NextResponse } from "next/server";
import { writeAdminAuditLog } from "@/lib/admin-audit";
import { requireAdminClient } from "@/lib/admin-auth";
import { serverTrackEvent } from "@/lib/analytics-server";
import { FORM_STATUSES, type FormStatus } from "@/lib/data-intake";
import { updateSubmissionStatus } from "@/lib/data-intake-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminClient();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const [{ data, error }, { data: events }] = await Promise.all([
    auth.admin
      .from("form_submissions")
      .select("*")
      .eq("id", id)
      .maybeSingle(),
    auth.admin
      .from("form_submission_events")
      .select("id, event_type, actor_user_id, metadata, created_at")
      .eq("submission_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Submission not found." }, { status: 404 });

  return NextResponse.json({ submission: data, events: events ?? [] });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminClient();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    status?: unknown;
    admin_notes?: unknown;
    assigned_to?: unknown;
  } | null;

  const status = typeof body?.status === "string" ? body.status : "";
  if (!(FORM_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Unsupported status." }, { status: 400 });
  }

  const { data: beforeSubmission } = await auth.admin
    .from("form_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const beforeValue = beforeSubmission ? { ...(beforeSubmission as Record<string, unknown>) } : null;

  const result = await updateSubmissionStatus(auth.admin, id, status as FormStatus, auth.user.id, {
    admin_notes: typeof body?.admin_notes === "string" ? body.admin_notes : undefined,
    assigned_to: typeof body?.assigned_to === "string" ? body.assigned_to : undefined,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });

  const { data: afterSubmission } = await auth.admin
    .from("form_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const formKey = typeof beforeSubmission?.form_key === "string" ? beforeSubmission.form_key : null;

  await Promise.all([
    writeAdminAuditLog({
      admin: auth.admin,
      actorUserId: auth.user.id,
      action: "form_submission_status_changed",
      entityType: "form_submission",
      entityId: id,
      beforeValue,
      afterValue: afterSubmission ? { ...(afterSubmission as Record<string, unknown>) } : null,
      metadata: { form_key: formKey, status },
    }),
    serverTrackEvent({
      eventName: formKey === "correction_request" ? "admin_correction_resolved" : "admin_form_status_changed",
      userId: auth.user.id,
      route: "/admin/intake",
      metadata: { form_submission_id: id, form_key: formKey, status },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
