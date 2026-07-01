import type { Metadata } from "next";
import { AdminModuleOpenTracker } from "@/components/admin/AdminDashboardTrackers";
import {
  AdminMetricCard,
  AdminPageShell,
  AdminPanel,
  AdminSetupBlocked,
  AdminSimpleTable,
  AdminStatusPill,
  formatAdminDate,
  safeNumber,
  safeText,
} from "@/components/admin/AdminPrimitives";
import { getDataSourceRegistryStatus } from "@/lib/data-import-adapters";
import { getFeatureFlagDecision } from "@/lib/feature-flags";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Import Runs | RepWatchr Admin",
  description: "Admin-only RepWatchr public-data import run history, adapter status, missing keys, and errors.",
  robots: { index: false, follow: false },
};

type AdminClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

const importTables = ["data_sources", "import_runs", "import_errors"];

async function countTable(admin: AdminClient, table: string) {
  const { count, error } = await admin.from(table).select("*", { count: "exact", head: true });
  return { table, count: error ? 0 : count ?? 0, error: error?.message ?? null };
}

async function selectRows(admin: AdminClient, table: string, columns: string, orderColumn: string, limit = 100) {
  const { data, error } = await admin
    .from(table)
    .select(columns)
    .order(orderColumn, { ascending: false })
    .limit(limit);

  return {
    rows: error ? [] : ((data ?? []) as unknown as Array<Record<string, unknown>>),
    error: error?.message ?? null,
  };
}

function tableCount(counts: Awaited<ReturnType<typeof countTable>>[], table: string) {
  return counts.find((entry) => entry.table === table)?.count ?? 0;
}

export default async function AdminImportsPage() {
  const admin = getSupabaseAdminClient();
  const registry = getDataSourceRegistryStatus();
  const featureDecision = await getFeatureFlagDecision("ENABLE_DATA_IMPORTS", { route: "/admin/imports" });

  if (!admin) {
    return <AdminSetupBlocked detail="Import runs need the service-role client to read import history, errors, and source registry health." />;
  }

  const [counts, importRuns, importErrors, dataSources] = await Promise.all([
    Promise.all(importTables.map((table) => countTable(admin, table))),
    selectRows(
      admin,
      "import_runs",
      "id,source_key,source_name,import_type,status,started_at,completed_at,records_seen,records_created,records_updated,records_skipped,errors_count,metadata,created_at",
      "started_at",
      30,
    ),
    selectRows(admin, "import_errors", "id,import_run_id,source_key,severity,message,entity_type,entity_id,created_at", "created_at", 30),
    selectRows(admin, "data_sources", "id,source_key,display_name,status,last_success_at,last_error_at,record_count,error_count,updated_at", "updated_at", 30),
  ]);

  const failedRuns = importRuns.rows.filter((row) => safeText(row.status, "").includes("fail") || safeNumber(row.errors_count) > 0).length;
  const missingKeys = registry.filter((entry) => entry.requiresApiKey && !entry.apiKeyConfigured);
  const tableErrors = [
    ...counts.filter((entry) => entry.error).map((entry) => `${entry.table}: ${entry.error}`),
    importRuns.error ? `import_runs: ${importRuns.error}` : null,
    importErrors.error ? `import_errors: ${importErrors.error}` : null,
    dataSources.error ? `data_sources: ${dataSources.error}` : null,
  ].filter(Boolean);

  return (
    <AdminPageShell
      eyebrow="Import runs"
      title="Run public-data imports like a review queue."
      description="This desk tracks import execution, missing keys, adapter status, and row-level errors. Imports are disabled by default and do not publish public findings by themselves."
    >
      <AdminModuleOpenTracker moduleName="Import Runs" eventName="admin_data_health_opened" route="/admin/imports" />

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard label="Import execution" value={featureDecision.enabled ? "Enabled" : "Disabled"} detail={`${featureDecision.source}: ${featureDecision.reason}`} />
        <AdminMetricCard label="Import runs" value={tableCount(counts, "import_runs")} detail={`${failedRuns} recent failed/error run(s)`} />
        <AdminMetricCard label="Import errors" value={tableCount(counts, "import_errors")} detail="Row and adapter failures" />
        <AdminMetricCard label="Data sources" value={tableCount(counts, "data_sources")} detail="Registry rows available to admin" />
        <AdminMetricCard label="Missing API keys" value={missingKeys.length} detail="External imports wait on server-only keys" />
        <AdminMetricCard label="Adapters" value={registry.length} detail="Registered source adapters" />
        <AdminMetricCard label="Manual lanes" value={registry.filter((entry) => entry.adapterStatus === "manual_only").length} detail="Manual review/import lanes" />
        <AdminMetricCard label="Rollout %" value={`${featureDecision.rolloutPercentage}%`} detail="Feature flag rollout bucket" />
      </section>

      {tableErrors.length ? (
        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-900">Schema warning</p>
          <p className="mt-2 text-sm font-bold leading-6 text-amber-900">
            The import admin page loaded, but one or more tables are missing or blocked. Apply `supabase-data-import-adapters.sql`, then rerun the final RLS hardening SQL.
          </p>
          <div className="mt-3 grid gap-2">
            {tableErrors.map((error) => (
              <p key={error} className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
                {error}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <AdminPanel
          eyebrow="Feature gate"
          title={featureDecision.enabled ? "Imports can run." : "Imports are intentionally disabled."}
          description="The execution route exists, but it checks admin access and ENABLE_DATA_IMPORTS before running any adapter."
        >
          <div className="grid gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Current decision</p>
              <p className="mt-2 text-2xl font-black text-blue-950">{featureDecision.enabled ? "Enabled" : "Disabled"}</p>
              <p className="mt-2 text-sm font-bold text-slate-600">
                Source: {featureDecision.source}. Reason: {featureDecision.reason}. Rollout: {featureDecision.rolloutPercentage}%.
              </p>
            </div>
            <button
              type="button"
              disabled
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black uppercase tracking-wide text-slate-500"
            >
              Run import from selected adapter
            </button>
            <p className="text-xs font-bold leading-5 text-slate-500">
              Placeholder only. When `ENABLE_DATA_IMPORTS=true`, admins can POST to `/api/admin/imports/run` with a source key for a dry-run/manual adapter check. Remote writes still need source-specific mapping review.
            </p>
          </div>
        </AdminPanel>

        <AdminPanel eyebrow="Missing keys" title="Provider readiness" description="External providers stay unavailable until their server-only API keys are configured. Key values are never rendered.">
          <AdminSimpleTable
            columns={["Source", "Adapter", "API key", "Cadence"]}
            rows={registry.map((entry) => ({
              id: entry.sourceKey,
              cells: [
                <span key="source" className="font-black text-blue-950">{entry.displayName}</span>,
                <AdminStatusPill key="status" value={entry.adapterStatus} />,
                entry.requiresApiKey
                  ? entry.apiKeyConfigured
                    ? `${entry.apiKeyEnvVar}: configured`
                    : `${entry.apiKeyEnvVar}: missing`
                  : "Not required",
                entry.importCadence,
              ],
            }))}
          />
        </AdminPanel>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-2">
        <AdminPanel eyebrow="History" title="Latest import runs" description={importRuns.error ?? "Recent import attempts and dry-run/manual-adapter checks."}>
          <AdminSimpleTable
            columns={["Source", "Status", "Records", "Errors", "Timing"]}
            rows={importRuns.rows.map((row) => ({
              id: safeText(row.id),
              cells: [
                <span key="source" className="font-black text-blue-950">{safeText(row.source_name ?? row.source_key)}</span>,
                <AdminStatusPill key="status" value={safeText(row.status)} />,
                `${safeNumber(row.records_seen).toLocaleString()} seen / ${safeNumber(row.records_created).toLocaleString()} new / ${safeNumber(row.records_updated).toLocaleString()} updated / ${safeNumber(row.records_skipped).toLocaleString()} skipped`,
                safeNumber(row.errors_count).toLocaleString(),
                `${formatAdminDate(row.started_at)} -> ${formatAdminDate(row.completed_at)}`,
              ],
            }))}
            emptyLabel="No import runs yet. Keep imports disabled until the SQL and source-specific mapping are ready."
          />
        </AdminPanel>

        <AdminPanel eyebrow="Errors" title="Recent import errors" description={importErrors.error ?? "Errors are operator-facing; they should not appear in public copy."}>
          <AdminSimpleTable
            columns={["Source", "Severity", "Message", "Entity", "Time"]}
            rows={importErrors.rows.map((row) => ({
              id: safeText(row.id),
              cells: [
                safeText(row.source_key),
                <AdminStatusPill key="severity" value={safeText(row.severity)} />,
                safeText(row.message),
                `${safeText(row.entity_type, "entity")} / ${safeText(row.entity_id, "-")}`,
                formatAdminDate(row.created_at),
              ],
            }))}
            emptyLabel="No import errors logged yet."
          />
        </AdminPanel>

        <AdminPanel eyebrow="Sources" title="Registry row health" description={dataSources.error ?? "Source registry rows and last successful/error timestamps."}>
          <AdminSimpleTable
            columns={["Source", "Status", "Records", "Last success", "Last error"]}
            rows={dataSources.rows.map((row) => ({
              id: safeText(row.id),
              cells: [
                <span key="source" className="font-black text-blue-950">{safeText(row.display_name ?? row.source_key)}</span>,
                <AdminStatusPill key="status" value={safeText(row.status)} />,
                `${safeNumber(row.record_count).toLocaleString()} records / ${safeNumber(row.error_count).toLocaleString()} errors`,
                formatAdminDate(row.last_success_at),
                formatAdminDate(row.last_error_at),
              ],
            }))}
            emptyLabel="No data source registry rows loaded yet."
          />
        </AdminPanel>

        <AdminPanel eyebrow="Operator notes" title="What counts as ready?" description="RepWatchr should only enable a provider after these checks pass.">
          <div className="grid gap-3 text-sm font-bold leading-6 text-slate-700">
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4">API key is server-only and present in production environment variables.</p>
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4">Adapter maps external fields into normalized RepWatchr records with source URLs and confidence labels.</p>
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4">Dry run produces import_runs/import_errors without public profile changes.</p>
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4">Admin review decides whether imported records become active, attached, archived, or imported_needs_review.</p>
          </div>
        </AdminPanel>
      </section>
    </AdminPageShell>
  );
}
