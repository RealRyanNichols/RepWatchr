import type { Metadata } from "next";
import Link from "next/link";
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
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Data Sources | RepWatchr Admin",
  description: "Admin-only RepWatchr public data source registry, adapter health, API key status, and normalized field map.",
  robots: { index: false, follow: false },
};

type AdminClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

const registryTables = ["data_sources", "data_source_fields", "import_runs", "import_errors"];

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

function listLabel(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => safeText(item, "")).filter(Boolean).join(", ");
  if (typeof value === "string") return value;
  return "No records listed";
}

export default async function AdminDataSourcesPage() {
  const admin = getSupabaseAdminClient();
  const registry = getDataSourceRegistryStatus();

  if (!admin) {
    return <AdminSetupBlocked detail="Data source registry needs the service-role client to read source definitions, field maps, and import run history." />;
  }

  const [counts, dataSources, dataSourceFields, latestRuns] = await Promise.all([
    Promise.all(registryTables.map((table) => countTable(admin, table))),
    selectRows(
      admin,
      "data_sources",
      "id,source_key,display_name,description,official_url,api_docs_url,requires_api_key,api_key_env_var,status,supported_records,import_cadence,last_import_run_id,last_success_at,last_error_at,record_count,error_count,updated_at",
      "updated_at",
      50,
    ),
    selectRows(
      admin,
      "data_source_fields",
      "id,data_source_id,field_name,field_label,field_type,normalized_field,required,public_safe,notes,updated_at",
      "updated_at",
      200,
    ),
    selectRows(
      admin,
      "import_runs",
      "id,source_key,source_name,import_type,status,started_at,completed_at,records_seen,records_created,records_updated,records_skipped,errors_count,created_at",
      "started_at",
      8,
    ),
  ]);

  const tableErrors = [
    ...counts.filter((entry) => entry.error).map((entry) => `${entry.table}: ${entry.error}`),
    dataSources.error ? `data_sources: ${dataSources.error}` : null,
    dataSourceFields.error ? `data_source_fields: ${dataSourceFields.error}` : null,
  ].filter(Boolean);
  const missingKeyCount = registry.filter((entry) => entry.requiresApiKey && !entry.apiKeyConfigured).length;
  const manualOnlyCount = registry.filter((entry) => entry.adapterStatus === "manual_only").length;

  return (
    <AdminPageShell
      eyebrow="Data source registry"
      title="Know which public records can be imported."
      description="This desk shows the source registry, adapter health, masked key status, normalized fields, and the latest import activity. Imported data stays source-backed and review-labeled."
    >
      <AdminModuleOpenTracker moduleName="Data Source Registry" eventName="data_source_registry_open" route="/admin/data-sources" />

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard label="Registry sources" value={registry.length} detail="FEC, Congress.gov, Open States, TEC, and local manual sources" />
        <AdminMetricCard label="DB source rows" value={tableCount(counts, "data_sources")} detail="Apply supabase-data-import-adapters.sql if this is zero" />
        <AdminMetricCard label="Field map rows" value={tableCount(counts, "data_source_fields")} detail="Normalized source-to-RepWatchr fields" />
        <AdminMetricCard label="Missing API keys" value={missingKeyCount} detail="Missing keys do not break the site" />
        <AdminMetricCard label="Manual-only adapters" value={manualOnlyCount} detail="Designed for reviewed uploads and packets" />
        <AdminMetricCard label="Import runs" value={tableCount(counts, "import_runs")} detail="Tracked execution history" />
        <AdminMetricCard label="Import errors" value={tableCount(counts, "import_errors")} detail="Adapter and source payload issues" />
        <AdminMetricCard label="Current fields loaded" value={dataSourceFields.rows.length} detail="Loaded from the database field registry" />
      </section>

      {tableErrors.length ? (
        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-900">Schema warning</p>
          <p className="mt-2 text-sm font-bold leading-6 text-amber-900">
            The adapter library is available, but one or more database tables are missing or blocked. Apply `supabase-data-import-adapters.sql`, then rerun the final security hardening SQL.
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

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminPanel
          eyebrow="Adapters"
          title="Server-side adapter health"
          description="This shows key presence only. No API key value is rendered, logged, or sent to the client."
          actionHref="/admin/imports"
          actionLabel="View imports"
        >
          <AdminSimpleTable
            columns={["Source", "Status", "API key", "Supported records", "Docs"]}
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
                entry.supportedRecords.join(", "),
                <a key="docs" href={entry.apiDocsUrl ?? entry.officialUrl} className="font-black text-blue-700 underline" rel="noreferrer" target="_blank">
                  Source
                </a>,
              ],
            }))}
          />
        </AdminPanel>

        <AdminPanel
          eyebrow="Safety"
          title="Import rules"
          description="Adapters collect public records only. They do not publish findings, infer wrongdoing, or attach private data."
        >
          <div className="grid gap-3 text-sm font-bold leading-6 text-slate-700">
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              Imported records must carry a source key, source URL when available, confidence label, import run ID, and review status before public use.
            </p>
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              External API gaps return structured `not_supported` or `missing_api_key` states. Admin pages should keep working even when no provider key is configured.
            </p>
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              For local sources, the import path is source submission, records-response intake, packet review, then admin attachment.
            </p>
          </div>
        </AdminPanel>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-2">
        <AdminPanel eyebrow="Database registry" title="Configured source rows" description={dataSources.error ?? "Rows seeded by supabase-data-import-adapters.sql."}>
          <AdminSimpleTable
            columns={["Source", "Status", "Records", "Last success", "Official URL"]}
            rows={dataSources.rows.map((row) => ({
              id: safeText(row.id),
              cells: [
                <span key="source" className="font-black text-blue-950">{safeText(row.display_name ?? row.source_key)}</span>,
                <AdminStatusPill key="status" value={safeText(row.status)} />,
                listLabel(row.supported_records),
                formatAdminDate(row.last_success_at),
                typeof row.official_url === "string" ? (
                  <a key="url" href={row.official_url} className="break-all font-mono text-xs text-blue-700 underline" rel="noreferrer" target="_blank">
                    {row.official_url}
                  </a>
                ) : "Missing",
              ],
            }))}
          />
        </AdminPanel>

        <AdminPanel eyebrow="Fields" title="Normalized field map" description={dataSourceFields.error ?? "Fields that map external source payloads into RepWatchr normalized records."}>
          <AdminSimpleTable
            columns={["Field", "Type", "Normalized", "Required", "Public safe"]}
            rows={dataSourceFields.rows.slice(0, 60).map((row) => ({
              id: safeText(row.id),
              cells: [
                <span key="field" className="font-black text-blue-950">{safeText(row.field_label ?? row.field_name)}</span>,
                safeText(row.field_type),
                safeText(row.normalized_field, "-"),
                Boolean(row.required) ? "Yes" : "No",
                Boolean(row.public_safe) ? "Yes" : "No",
              ],
            }))}
            emptyLabel="No field rows loaded. Apply the data import adapter SQL."
          />
        </AdminPanel>

        <AdminPanel eyebrow="Latest runs" title="Recent import activity" description={latestRuns.error ?? "Recent execution history across every adapter."}>
          <AdminSimpleTable
            columns={["Source", "Status", "Records", "Errors", "Started"]}
            rows={latestRuns.rows.map((row) => ({
              id: safeText(row.id),
              cells: [
                safeText(row.source_name ?? row.source_key),
                <AdminStatusPill key="status" value={safeText(row.status)} />,
                `${safeNumber(row.records_seen).toLocaleString()} seen / ${safeNumber(row.records_created).toLocaleString()} new`,
                safeNumber(row.errors_count).toLocaleString(),
                formatAdminDate(row.started_at ?? row.created_at),
              ],
            }))}
          />
        </AdminPanel>

        <AdminPanel eyebrow="Runbook" title="Manual operator path" description="Do this before enabling a remote import provider.">
          <ol className="grid list-decimal gap-3 pl-5 text-sm font-bold leading-6 text-slate-700">
            <li>Apply `supabase-data-import-adapters.sql` in Supabase.</li>
            <li>Add provider keys server-side only in Vercel/Supabase env.</li>
            <li>Open <Link href="/admin/imports" className="text-blue-700 underline">Import Runs</Link> and confirm health.</li>
            <li>Run dry batches first and review import errors before attaching records publicly.</li>
            <li>Keep public pages neutral: public record, source link, confidence, and correction path.</li>
          </ol>
        </AdminPanel>
      </section>
    </AdminPageShell>
  );
}
