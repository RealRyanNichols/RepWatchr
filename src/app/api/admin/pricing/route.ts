import { NextResponse } from "next/server";
import { z } from "zod";
import { getEnvironmentFeatureFlagSnapshot } from "@/lib/feature-flags";
import { requireAdminClient } from "@/lib/admin-auth";
import { writeAdminAuditLog } from "@/lib/admin-audit";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const betaStatuses = ["new", "reviewed", "invited", "active", "not_fit", "waitlist", "archived"] as const;
const experimentStatuses = ["draft", "active", "paused", "completed", "archived"] as const;
type AdminClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

const updateSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update_beta_status"),
    id: z.string().uuid(),
    status: z.enum(betaStatuses),
  }),
  z.object({
    action: z.literal("invite_beta_user"),
    id: z.string().uuid(),
    inviteCode: z.string().trim().min(4).max(80).optional(),
  }),
  z.object({
    action: z.literal("update_experiment_status"),
    id: z.string().uuid(),
    status: z.enum(experimentStatuses),
  }),
  z.object({
    action: z.literal("update_feature_flag"),
    id: z.string().uuid(),
    enabled: z.boolean().optional(),
    rolloutPercentage: z.number().int().min(0).max(100).optional(),
  }),
]);

async function loadRows<T>(
  label: string,
  query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
) {
  const { data, error } = await query;
  return { label, rows: (data ?? []) as T[], error: error?.message ?? null };
}

async function countTable(admin: AdminClient, table: string) {
  const { count, error } = await admin.from(table).select("*", { count: "exact", head: true });
  return { table, status: error ? "error" : "ok", count: error ? null : count ?? 0, error: error?.message ?? null };
}

export async function GET() {
  const auth = await requireAdminClient();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { admin } = auth;
  const [featureFlags, experiments, betaRequests, pricingEvents, tableCounts] = await Promise.all([
    loadRows(
      "feature_flags",
      admin
        .from("feature_flags")
        .select("id, key, description, enabled, rollout_percentage, metadata, updated_at")
        .order("key", { ascending: true }),
    ),
    loadRows(
      "pricing_experiments",
      admin
        .from("pricing_experiments")
        .select("id, key, package_key, name, status, hypothesis, variants, start_at, end_at, updated_at")
        .order("package_key", { ascending: true }),
    ),
    loadRows(
      "beta_access_requests",
      admin
        .from("beta_access_requests")
        .select("id, anonymous_id, user_id, email, name, package_key, use_case, jurisdiction, organization_type, urgency, status, invite_code, invited_at, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(200),
    ),
    loadRows(
      "pricing_experiment_events",
      admin
        .from("pricing_experiment_events")
        .select("id, experiment_id, anonymous_id, user_id, variant_key, event_name, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(400),
    ),
    Promise.all(
      [
        "feature_flags",
        "pricing_experiments",
        "pricing_experiment_assignments",
        "pricing_experiment_events",
        "beta_access_requests",
      ].map((table) => countTable(admin, table)),
    ),
  ]);

  const demand = new Map<string, { total: number; newCount: number; invited: number; active: number }>();
  for (const request of betaRequests.rows as Array<Record<string, unknown>>) {
    const packageKey = typeof request.package_key === "string" ? request.package_key : "unknown";
    const status = typeof request.status === "string" ? request.status : "new";
    const row = demand.get(packageKey) ?? { total: 0, newCount: 0, invited: 0, active: 0 };
    row.total += 1;
    if (status === "new") row.newCount += 1;
    if (status === "invited") row.invited += 1;
    if (status === "active") row.active += 1;
    demand.set(packageKey, row);
  }

  const errors = [
    featureFlags.error,
    experiments.error,
    betaRequests.error,
    pricingEvents.error,
    ...tableCounts.map((table) => table.error),
  ].filter(Boolean);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    environmentFlags: getEnvironmentFeatureFlagSnapshot(),
    featureFlags: featureFlags.rows,
    experiments: experiments.rows,
    betaRequests: betaRequests.rows,
    pricingEvents: pricingEvents.rows,
    demandByPackage: Object.fromEntries(demand.entries()),
    tableCounts,
    errors,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminClient();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid pricing action." }, { status: 400 });
  }

  const { admin, user } = auth;
  const input = parsed.data;

  if (input.action === "update_beta_status") {
    const { data: before } = await admin.from("beta_access_requests").select("*").eq("id", input.id).maybeSingle();
    const { data, error } = await admin
      .from("beta_access_requests")
      .update({ status: input.status, updated_at: new Date().toISOString() })
      .eq("id", input.id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAdminAuditLog({
      admin,
      actorUserId: user.id,
      action: "pricing.beta_status_changed",
      entityType: "beta_access_request",
      entityId: input.id,
      beforeValue: before as Record<string, unknown> | null,
      afterValue: data as Record<string, unknown>,
    });
    return NextResponse.json({ ok: true, row: data });
  }

  if (input.action === "invite_beta_user") {
    const inviteCode = input.inviteCode || `beta-${Math.random().toString(36).slice(2, 10)}`;
    const { data: before } = await admin.from("beta_access_requests").select("*").eq("id", input.id).maybeSingle();
    const { data, error } = await admin
      .from("beta_access_requests")
      .update({
        status: "invited",
        invite_code: inviteCode,
        invited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await Promise.all([
      admin.from("pricing_experiment_events").insert({
        user_id: data.user_id ?? null,
        event_name: "beta_invite_sent",
        metadata: { request_id: data.id, package_key: data.package_key },
      }),
      writeAdminAuditLog({
        admin,
        actorUserId: user.id,
        action: "pricing.beta_invited",
        entityType: "beta_access_request",
        entityId: input.id,
        beforeValue: before as Record<string, unknown> | null,
        afterValue: data as Record<string, unknown>,
      }),
    ]);
    return NextResponse.json({ ok: true, row: data });
  }

  if (input.action === "update_experiment_status") {
    const { data: before } = await admin.from("pricing_experiments").select("*").eq("id", input.id).maybeSingle();
    const { data, error } = await admin
      .from("pricing_experiments")
      .update({ status: input.status, updated_at: new Date().toISOString() })
      .eq("id", input.id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAdminAuditLog({
      admin,
      actorUserId: user.id,
      action: "pricing.experiment_status_changed",
      entityType: "pricing_experiment",
      entityId: input.id,
      beforeValue: before as Record<string, unknown> | null,
      afterValue: data as Record<string, unknown>,
    });
    return NextResponse.json({ ok: true, row: data });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof input.enabled === "boolean") patch.enabled = input.enabled;
  if (typeof input.rolloutPercentage === "number") patch.rollout_percentage = input.rolloutPercentage;
  const { data: before } = await admin.from("feature_flags").select("*").eq("id", input.id).maybeSingle();
  const { data, error } = await admin
    .from("feature_flags")
    .update(patch)
    .eq("id", input.id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await writeAdminAuditLog({
    admin,
    actorUserId: user.id,
    action: "pricing.feature_flag_changed",
    entityType: "feature_flag",
    entityId: input.id,
    beforeValue: before as Record<string, unknown> | null,
    afterValue: data as Record<string, unknown>,
  });
  return NextResponse.json({ ok: true, row: data });
}
