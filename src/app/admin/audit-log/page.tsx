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
  safeText,
} from "@/components/admin/AdminPrimitives";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Audit Log | RepWatchr Admin",
  description: "Admin-only RepWatchr audit log for review actions, status changes, source attachment, and profile maintenance.",
  robots: { index: false, follow: false },
};

type SearchParams = Record<string, string | string[] | undefined>;
type AdminClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

function firstParam(params: SearchParams, key: string) {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function cleanFilter(value: string) {
  return value.trim().slice(0, 120);
}

async function countAuditRows(admin: AdminClient, column?: string, value?: string) {
  let query = admin.from("admin_audit_logs").select("*", { count: "exact", head: true });

  if (column && value) {
    query = query.eq(column, value);
  }

  const { count, error } = await query;
  return { count: error ? 0 : count ?? 0, error: error?.message ?? null };
}

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const admin = getSupabaseAdminClient();

  if (!admin) {
    return <AdminSetupBlocked detail="Audit log review needs the service-role client to read admin-only audit rows." />;
  }

  const params = searchParams ? await searchParams : {};
  const actionFilter = cleanFilter(firstParam(params, "action"));
  const entityFilter = cleanFilter(firstParam(params, "entity_type"));

  let query = admin
    .from("admin_audit_logs")
    .select("id,actor_user_id,action,entity_type,entity_id,before_value,after_value,metadata,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (actionFilter) query = query.eq("action", actionFilter);
  if (entityFilter) query = query.eq("entity_type", entityFilter);

  const [{ data, error }, totalRows, sourceRows, formRows, profileRows] = await Promise.all([
    query,
    countAuditRows(admin),
    countAuditRows(admin, "entity_type", "source_submission"),
    countAuditRows(admin, "entity_type", "form_submission"),
    countAuditRows(admin, "entity_type", "official_profile"),
  ]);

  const rows = error ? [] : ((data ?? []) as Array<Record<string, unknown>>);
  const actionCounts = new Map<string, number>();
  for (const row of rows) {
    const action = safeText(row.action);
    actionCounts.set(action, (actionCounts.get(action) ?? 0) + 1);
  }

  return (
    <AdminPageShell
      eyebrow="Audit log"
      title="Every admin decision needs a trail."
      description="Review source decisions, correction status changes, attachment actions, and future profile edits without exposing operator data publicly."
    >
      <AdminModuleOpenTracker moduleName="Audit Log" eventName="admin_audit_log_opened" route="/admin/audit-log" />

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard label="Audit rows" value={totalRows.count} detail={totalRows.error ?? "All admin audit log rows"} />
        <AdminMetricCard label="Source actions" value={sourceRows.count} detail={sourceRows.error ?? "Source submission audit rows"} />
        <AdminMetricCard label="Form actions" value={formRows.count} detail={formRows.error ?? "Form/correction audit rows"} />
        <AdminMetricCard label="Profile actions" value={profileRows.count} detail={profileRows.error ?? "Profile audit rows"} />
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[0.7fr_1.3fr]">
        <AdminPanel
          eyebrow="Filters"
          title="Current view"
          description="Use query parameters for exact admin filters until the richer filter UI is built."
        >
          <div className="grid gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Action</p>
              <p className="mt-2 text-sm font-black text-blue-950">{actionFilter || "All actions"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Entity type</p>
              <p className="mt-2 text-sm font-black text-blue-950">{entityFilter || "All entity types"}</p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-950">
              Examples: `/admin/audit-log?action=source_status_changed` or `/admin/audit-log?entity_type=form_submission`.
            </div>
          </div>
        </AdminPanel>

        <AdminPanel eyebrow="Top actions" title="Recent action mix" description="Counts are based on the currently loaded audit rows.">
          <AdminSimpleTable
            columns={["Action", "Rows"]}
            rows={[...actionCounts.entries()]
              .sort((a, b) => b[1] - a[1])
              .slice(0, 12)
              .map(([action, count]) => ({
                id: action,
                cells: [<span key="action" className="font-black text-blue-950">{action}</span>, count.toLocaleString()],
              }))}
          />
        </AdminPanel>
      </section>

      <section className="mt-6">
        <AdminPanel eyebrow="Before / after" title="Audit trail" description={error?.message ?? "Latest 100 admin actions matching the current filters."}>
          <AdminSimpleTable
            columns={["Action", "Entity", "Actor", "Metadata", "Time"]}
            rows={rows.map((row) => ({
              id: safeText(row.id),
              cells: [
                <span key="action" className="font-black text-blue-950">{safeText(row.action)}</span>,
                <span key="entity">{safeText(row.entity_type)} / {safeText(row.entity_id, "-")}</span>,
                safeText(row.actor_user_id, "system"),
                <AdminStatusPill key="metadata" value={row.metadata && Object.keys(row.metadata as Record<string, unknown>).length ? "metadata" : "none"} />,
                formatAdminDate(row.created_at),
              ],
            }))}
            emptyLabel="No admin audit rows matched this view."
          />
        </AdminPanel>
      </section>
    </AdminPageShell>
  );
}
