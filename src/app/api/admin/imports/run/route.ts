import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAdminAuditLog } from "@/lib/admin-audit";
import { requireAdminClient } from "@/lib/admin-auth";
import { serverTrackEvent } from "@/lib/analytics-server";
import { getDataImportAdapter } from "@/lib/data-import-adapters";
import { isFeatureEnabled } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const importRunSchema = z.object({
  sourceKey: z.string().trim().min(2).max(120),
  importType: z.string().trim().min(2).max(120).default("manual_dry_run"),
  dryRun: z.boolean().default(true),
  limit: z.number().int().min(1).max(500).default(25),
});

function tableMissing(message: string | null | undefined) {
  return Boolean(message && /data_sources|import_runs|import_errors|does not exist|schema cache|42P01/i.test(message));
}

async function parseBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return request.json().catch(() => null);
  if (contentType.includes("form")) {
    const form = await request.formData().catch(() => null);
    if (!form) return null;
    const limitValue = Number(form.get("limit") ?? 25);
    return {
      sourceKey: String(form.get("sourceKey") ?? ""),
      importType: String(form.get("importType") ?? "manual_dry_run"),
      dryRun: form.get("dryRun") !== "false",
      limit: Number.isFinite(limitValue) ? limitValue : 25,
    };
  }
  return null;
}

async function trackImportEvent(eventName: string, userId: string, metadata: Record<string, unknown>) {
  await serverTrackEvent({
    eventName,
    userId,
    route: "/admin/imports",
    metadata,
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminClient();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const importsEnabled = await isFeatureEnabled("ENABLE_DATA_IMPORTS", {
    userId: auth.user.id,
    route: "/admin/imports",
  });

  if (!importsEnabled) {
    return NextResponse.json(
      {
        ok: false,
        disabled: true,
        message: "Data imports are disabled. Set ENABLE_DATA_IMPORTS=true only after source-specific mapping and dry-run review.",
      },
      { status: 409 },
    );
  }

  const parsed = importRunSchema.safeParse(await parseBody(request));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid import request." }, { status: 400 });
  }

  const input = parsed.data;
  const adapter = getDataImportAdapter(input.sourceKey);
  if (!adapter) return NextResponse.json({ error: "Unsupported data source adapter." }, { status: 404 });

  await trackImportEvent("import_run_started", auth.user.id, {
    source_key: adapter.sourceKey,
    import_type: input.importType,
    dry_run: input.dryRun,
  });

  const startedAt = new Date().toISOString();
  const { data: run, error: runError } = await auth.admin
    .from("import_runs")
    .insert({
      source_key: adapter.sourceKey,
      source_name: adapter.displayName,
      import_type: input.importType,
      status: "running",
      started_at: startedAt,
      metadata: {
        dry_run: input.dryRun,
        limit: input.limit,
        adapter_status: adapter.getStatus(),
      },
    })
    .select("id")
    .single();

  if (runError && tableMissing(runError.message)) {
    return NextResponse.json({ error: "Apply supabase-data-import-adapters.sql before running imports." }, { status: 500 });
  }
  if (runError) return NextResponse.json({ error: runError.message }, { status: 500 });

  const importRunId = typeof run?.id === "string" ? run.id : null;
  const result = await adapter.importBatch({
    importRunId,
    dryRun: input.dryRun,
    limit: input.limit,
  });
  const completedAt = new Date().toISOString();

  if (!result.ok) {
    await Promise.all([
      importRunId
        ? auth.admin
            .from("import_runs")
            .update({
              status: "failed",
              completed_at: completedAt,
              errors_count: 1,
              metadata: {
                dry_run: input.dryRun,
                limit: input.limit,
                adapter_status: adapter.getStatus(),
                failure_status: result.status,
                failure_operation: result.operation ?? null,
              },
            })
            .eq("id", importRunId)
        : Promise.resolve({ error: null }),
      auth.admin.from("import_errors").insert({
        import_run_id: importRunId,
        source_key: adapter.sourceKey,
        severity: result.status === "missing_api_key" ? "warning" : "error",
        message: result.message,
        raw_payload: { status: result.status, operation: result.operation ?? null },
        entity_type: "data_import_adapter",
        entity_id: adapter.sourceKey,
      }),
      auth.admin
        .from("data_sources")
        .update({ last_import_run_id: importRunId, last_error_at: completedAt, error_count: 1, updated_at: completedAt })
        .eq("source_key", adapter.sourceKey),
      writeAdminAuditLog({
        admin: auth.admin,
        actorUserId: auth.user.id,
        action: "data_import_failed",
        entityType: "data_source",
        entityId: adapter.sourceKey,
        beforeValue: null,
        afterValue: { import_run_id: importRunId, status: result.status, message: result.message },
        metadata: { import_type: input.importType, dry_run: input.dryRun },
      }),
      trackImportEvent("import_run_failed", auth.user.id, {
        source_key: adapter.sourceKey,
        import_run_id: importRunId,
        failure_status: result.status,
      }),
      trackImportEvent("import_error_logged", auth.user.id, {
        source_key: adapter.sourceKey,
        import_run_id: importRunId,
        severity: result.status === "missing_api_key" ? "warning" : "error",
      }),
      result.status === "missing_api_key"
        ? trackImportEvent("data_source_missing_key", auth.user.id, {
            source_key: adapter.sourceKey,
            api_key_env_var: adapter.apiKeyEnvVar ?? "unknown",
          })
        : Promise.resolve(),
    ]);

    return NextResponse.json(
      { ok: false, importRunId, status: result.status, message: result.message },
      { status: result.status === "missing_api_key" || result.status === "not_supported" ? 409 : 500 },
    );
  }

  const summary = result.data;
  const runStatus = summary.errorsCount > 0 ? "partial" : "succeeded";
  await Promise.all([
    importRunId
      ? auth.admin
          .from("import_runs")
          .update({
            status: runStatus,
            completed_at: completedAt,
            records_seen: summary.recordsSeen,
            records_created: summary.recordsCreated,
            records_updated: summary.recordsUpdated,
            records_skipped: summary.recordsSkipped,
            errors_count: summary.errorsCount,
            metadata: {
              dry_run: input.dryRun,
              limit: input.limit,
              adapter_status: adapter.getStatus(),
              notes: summary.notes,
            },
          })
          .eq("id", importRunId)
      : Promise.resolve({ error: null }),
    auth.admin
      .from("data_sources")
      .update({
        last_import_run_id: importRunId,
        last_success_at: summary.errorsCount > 0 ? null : completedAt,
        last_error_at: summary.errorsCount > 0 ? completedAt : null,
        record_count: summary.recordsSeen,
        error_count: summary.errorsCount,
        updated_at: completedAt,
      })
      .eq("source_key", adapter.sourceKey),
    writeAdminAuditLog({
      admin: auth.admin,
      actorUserId: auth.user.id,
      action: "data_import_completed",
      entityType: "data_source",
      entityId: adapter.sourceKey,
      beforeValue: null,
      afterValue: { import_run_id: importRunId, status: runStatus, summary },
      metadata: { import_type: input.importType, dry_run: input.dryRun },
    }),
    trackImportEvent("import_run_completed", auth.user.id, {
      source_key: adapter.sourceKey,
      import_run_id: importRunId,
      status: runStatus,
      records_seen: summary.recordsSeen,
      errors_count: summary.errorsCount,
    }),
  ]);

  return NextResponse.json({ ok: true, importRunId, status: runStatus, summary });
}
