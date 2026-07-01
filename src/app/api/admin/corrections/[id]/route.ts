import { NextResponse } from "next/server";
import { writeAdminAuditLog } from "@/lib/admin-audit";
import { requireAdminClient } from "@/lib/admin-auth";
import { serverTrackEvent } from "@/lib/analytics-server";
import { CORRECTION_STATUSES } from "@/lib/trust-safety";

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
    auth.admin.from("correction_requests").select("*").eq("id", id).maybeSingle(),
    auth.admin
      .from("correction_events")
      .select("id, event_type, actor_user_id, metadata, created_at")
      .eq("correction_request_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Correction request not found." }, { status: 404 });

  return NextResponse.json({ correction: data, events: events ?? [] });
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
    adminResolution?: unknown;
    priority?: unknown;
    assignedTo?: unknown;
    eventType?: unknown;
  } | null;

  const status = typeof body?.status === "string" ? body.status : "";
  if (!(CORRECTION_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Unsupported correction status." }, { status: 400 });
  }

  const { data: before } = await auth.admin.from("correction_requests").select("*").eq("id", id).maybeSingle();
  if (!before) return NextResponse.json({ error: "Correction request not found." }, { status: 404 });

  const patch = {
    status,
    admin_resolution: typeof body?.adminResolution === "string" ? body.adminResolution.slice(0, 4000) : before.admin_resolution,
    priority: typeof body?.priority === "string" ? body.priority.slice(0, 40) : before.priority,
    assigned_to: typeof body?.assignedTo === "string" && body.assignedTo ? body.assignedTo : before.assigned_to,
    updated_at: new Date().toISOString(),
  };

  const { data: after, error } = await auth.admin
    .from("correction_requests")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const eventType = typeof body?.eventType === "string" ? body.eventType : "status_changed";
  await Promise.all([
    auth.admin.from("correction_events").insert({
      correction_request_id: id,
      event_type: eventType,
      actor_user_id: auth.user.id,
      metadata: {
        status,
        admin_resolution: patch.admin_resolution,
        priority: patch.priority,
      },
    }),
    writeAdminAuditLog({
      admin: auth.admin,
      actorUserId: auth.user.id,
      action: "correction_request_status_changed",
      entityType: "correction_request",
      entityId: id,
      beforeValue: { ...(before as Record<string, unknown>) },
      afterValue: { ...(after as Record<string, unknown>) },
      metadata: { status, event_type: eventType },
    }),
    serverTrackEvent({
      eventName: "correction_admin_resolved",
      userId: auth.user.id,
      route: "/admin/corrections",
      metadata: { correction_request_id: id, status, event_type: eventType },
    }),
  ]);

  return NextResponse.json({ ok: true, correction: after });
}
