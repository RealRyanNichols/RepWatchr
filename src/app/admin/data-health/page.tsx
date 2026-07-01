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
import { getAllBills, getAllNews, getAllOfficials, getIssueCategories } from "@/lib/data";
import { getOfficialCompletionDashboard } from "@/lib/profile-completion";
import { getSchoolBoardDistricts, getSchoolBoardDossiers } from "@/lib/school-board-research";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getRepWatchrServices } from "@/data/repwatchr-services";
import { getTexasElectionRaces } from "@/data/texas-election-races";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Data Health | RepWatchr Admin",
  description: "Admin-only RepWatchr import health, broken links, data quality issues, duplicate candidates, and sitemap readiness.",
  robots: { index: false, follow: false },
};

type AdminClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

const dataHealthTables = [
  "import_runs",
  "import_errors",
  "data_quality_issues",
  "broken_links",
  "duplicate_candidates",
  "profile_completion_snapshots",
  "profile_enrichment_items",
  "source_submissions",
  "form_submissions",
];

async function countTable(admin: AdminClient, table: string) {
  const { count, error } = await admin.from(table).select("*", { count: "exact", head: true });
  return { table, count: error ? 0 : count ?? 0, error: error?.message ?? null };
}

async function selectRows(admin: AdminClient, table: string, columns: string, orderColumn: string, limit = 25) {
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

export default async function AdminDataHealthPage() {
  const admin = getSupabaseAdminClient();

  if (!admin) {
    return <AdminSetupBlocked detail="Data health needs the service-role client to read import, broken-link, duplicate, and quality issue tables." />;
  }

  const completion = getOfficialCompletionDashboard();
  const [
    counts,
    importRuns,
    importErrors,
    dataIssues,
    brokenLinks,
    duplicates,
  ] = await Promise.all([
    Promise.all(dataHealthTables.map((table) => countTable(admin, table))),
    selectRows(
      admin,
      "import_runs",
      "id,source_key,source_name,import_type,status,started_at,completed_at,records_seen,records_created,records_updated,records_skipped,errors_count,created_at",
      "started_at",
      15,
    ),
    selectRows(admin, "import_errors", "id,source_key,severity,message,entity_type,entity_id,created_at", "created_at", 12),
    selectRows(admin, "data_quality_issues", "id,issue_type,severity,status,entity_type,entity_id,title,description,created_at", "created_at", 18),
    selectRows(admin, "broken_links", "id,url,entity_type,entity_id,status_code,status,last_checked_at,created_at", "created_at", 18),
    selectRows(admin, "duplicate_candidates", "id,entity_type,entity_id_a,entity_id_b,similarity_score,reason,status,created_at", "created_at", 18),
  ]);

  const openIssueCount = dataIssues.rows.filter((row) => ["open", "needs_review", "new"].includes(safeText(row.status, ""))).length;
  const brokenOpenCount = brokenLinks.rows.filter((row) => ["open", "failed", "new"].includes(safeText(row.status, ""))).length;
  const duplicateOpenCount = duplicates.rows.filter((row) => ["open", "needs_review", "new"].includes(safeText(row.status, ""))).length;
  const importFailureCount = importRuns.rows.filter((row) => safeText(row.status, "").includes("fail") || safeNumber(row.errors_count) > 0).length;
  const sourceGapCount = completion.missingItemCounts.reduce((sum, item) => sum + item.count, 0);
  const sitemapCount =
    22 +
    getRepWatchrServices().length +
    getTexasElectionRaces().length +
    getAllOfficials().length * 2 +
    getAllBills().length +
    getAllNews().length +
    getIssueCategories().length * 2 +
    getSchoolBoardDistricts().length +
    getSchoolBoardDossiers().length;

  const tableErrors = counts.filter((entry) => entry.error);

  return (
    <AdminPageShell
      eyebrow="Data health"
      title="Find the bad rows before the public does."
      description="This admin-only desk tracks imports, broken source links, duplicate candidates, low-completeness profiles, and indexing readiness."
    >
      <AdminModuleOpenTracker moduleName="Data Health" eventName="admin_data_health_opened" route="/admin/data-health" />

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard label="Import runs" value={tableCount(counts, "import_runs")} detail={`${importFailureCount} recent run(s) with errors or failed status`} />
        <AdminMetricCard label="Broken links" value={tableCount(counts, "broken_links")} detail={`${brokenOpenCount} recent open rows`} />
        <AdminMetricCard label="Data issues" value={tableCount(counts, "data_quality_issues")} detail={`${openIssueCount} recent open rows`} />
        <AdminMetricCard label="Duplicate candidates" value={tableCount(counts, "duplicate_candidates")} detail={`${duplicateOpenCount} recent unresolved rows`} />
        <AdminMetricCard label="Source gaps" value={sourceGapCount} detail={`${completion.averageCompletionPercent}% average profile completion`} />
        <AdminMetricCard label="Sitemap surface" value={sitemapCount} detail="Estimated public URLs from current data files" />
        <AdminMetricCard label="Source submissions" value={tableCount(counts, "source_submissions")} detail="Public records awaiting review flow" />
        <AdminMetricCard label="Form submissions" value={tableCount(counts, "form_submissions")} detail="Corrections, interest, packets, and reports" />
      </section>

      {tableErrors.length ? (
        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-900">Schema warning</p>
          <p className="mt-2 text-sm font-bold leading-6 text-amber-900">
            Some admin tables were not readable. Apply `supabase-admin-dashboard.sql` and verify Supabase Data API grants/RLS before production review.
          </p>
          <div className="mt-3 grid gap-2">
            {tableErrors.map((entry) => (
              <p key={entry.table} className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
                {entry.table}: {entry.error}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6 grid gap-5 xl:grid-cols-2">
        <AdminPanel eyebrow="Imports" title="Latest import runs" description={importRuns.error ?? "Recent import activity across public-data adapters."}>
          <AdminSimpleTable
            columns={["Source", "Status", "Records", "Errors", "Started"]}
            rows={importRuns.rows.map((row) => ({
              id: safeText(row.id),
              cells: [
                <span key="source" className="font-black text-blue-950">{safeText(row.source_name ?? row.source_key)}</span>,
                <AdminStatusPill key="status" value={safeText(row.status)} />,
                `${safeNumber(row.records_seen).toLocaleString()} seen / ${safeNumber(row.records_created).toLocaleString()} new / ${safeNumber(row.records_updated).toLocaleString()} updated`,
                safeNumber(row.errors_count).toLocaleString(),
                formatAdminDate(row.started_at ?? row.created_at),
              ],
            }))}
          />
        </AdminPanel>

        <AdminPanel eyebrow="Errors" title="Recent import errors" description={importErrors.error ?? "Failed rows, source payload issues, and records needing an adapter fix."}>
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
          />
        </AdminPanel>

        <AdminPanel eyebrow="Source links" title="Broken source links" description={brokenLinks.error ?? "Open rows should be fixed, replaced with better official sources, or archived."}>
          <AdminSimpleTable
            columns={["URL", "Entity", "Status", "Checked"]}
            rows={brokenLinks.rows.map((row) => ({
              id: safeText(row.id),
              cells: [
                <span key="url" className="break-all font-mono text-xs">{safeText(row.url)}</span>,
                `${safeText(row.entity_type, "entity")} / ${safeText(row.entity_id, "-")}`,
                <AdminStatusPill key="status" value={`${safeText(row.status)} ${safeNumber(row.status_code) || ""}`.trim()} />,
                formatAdminDate(row.last_checked_at ?? row.created_at),
              ],
            }))}
          />
        </AdminPanel>

        <AdminPanel eyebrow="Quality" title="Data quality issues" description={dataIssues.error ?? "Profiles, sources, slugs, metadata, and public-safety issues that need operator review."}>
          <AdminSimpleTable
            columns={["Issue", "Severity", "Entity", "Status", "Detected"]}
            rows={dataIssues.rows.map((row) => ({
              id: safeText(row.id),
              cells: [
                <span key="issue" className="font-black text-blue-950">{safeText(row.title ?? row.issue_type)}</span>,
                <AdminStatusPill key="severity" value={safeText(row.severity)} />,
                `${safeText(row.entity_type, "entity")} / ${safeText(row.entity_id, "-")}`,
                <AdminStatusPill key="status" value={safeText(row.status)} />,
                formatAdminDate(row.created_at),
              ],
            }))}
          />
        </AdminPanel>

        <AdminPanel eyebrow="Duplicates" title="Duplicate candidates" description={duplicates.error ?? "Potential duplicate officials, agencies, donors, profiles, and public bodies."}>
          <AdminSimpleTable
            columns={["Entity type", "Candidate A", "Candidate B", "Score", "Status"]}
            rows={duplicates.rows.map((row) => ({
              id: safeText(row.id),
              cells: [
                safeText(row.entity_type),
                safeText(row.entity_id_a),
                safeText(row.entity_id_b),
                safeNumber(row.similarity_score).toLocaleString(),
                <AdminStatusPill key="status" value={safeText(row.status)} />,
              ],
            }))}
          />
        </AdminPanel>

        <AdminPanel eyebrow="Indexing" title="SEO and sitemap watchlist" description="Public indexing should grow only when the page has enough source value and safe metadata. Admin, dashboard, auth, and API routes remain excluded.">
          <AdminSimpleTable
            columns={["Check", "Status", "Detail"]}
            rows={[
              {
                id: "sitemap-count",
                cells: ["Estimated sitemap URLs", <AdminStatusPill key="status" value="tracked" />, `${sitemapCount.toLocaleString()} public URLs estimated from route data`],
              },
              {
                id: "admin-exclusion",
                cells: ["Admin exclusion", <AdminStatusPill key="status" value="protected" />, "Admin routes are guarded by layout metadata and robots disallow rules."],
              },
              {
                id: "source-gaps",
                cells: ["Profile source gaps", <AdminStatusPill key="status" value={sourceGapCount ? "needs_review" : "clear"} />, `${sourceGapCount.toLocaleString()} missing profile items across current completion model`],
              },
            ]}
          />
        </AdminPanel>
      </section>
    </AdminPageShell>
  );
}
