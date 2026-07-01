import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type AdminClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

export async function writeAdminAuditLog({
  admin,
  actorUserId,
  action,
  entityType,
  entityId,
  beforeValue,
  afterValue,
  metadata = {},
}: {
  admin: AdminClient;
  actorUserId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  beforeValue?: Record<string, unknown> | null;
  afterValue?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await admin.from("admin_audit_logs").insert({
    actor_user_id: actorUserId ?? null,
    action: action.trim().slice(0, 120),
    entity_type: entityType?.trim().slice(0, 120) || null,
    entity_id: entityId?.trim().slice(0, 240) || null,
    before_value: beforeValue ?? null,
    after_value: afterValue ?? null,
    metadata,
  });

  if (error && !/admin_audit_logs|does not exist|schema cache/i.test(error.message)) {
    console.warn(JSON.stringify({ level: "warn", msg: "admin_audit_log_failed", action, error: error.message }));
  }

  return { ok: !error, error: error?.message ?? null };
}
