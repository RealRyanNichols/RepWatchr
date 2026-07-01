import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminOpenTracker, AdminTrackedLink } from "@/components/admin/AdminDashboardTrackers";
import { getAllOfficials, getRepWatchrDataStats } from "@/lib/data";
import { getMonetizationReadinessReport } from "@/lib/monetization-readiness";
import { getOfficialCompletionDashboard } from "@/lib/profile-completion";
import { getSchoolBoardStats } from "@/lib/school-board-research";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Command Center",
  description: "Admin-only RepWatchr source review, correction review, profile health, data health, analytics, and monetization readiness.",
  robots: { index: false, follow: false },
};

type AdminClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

type CountResult = {
  table: string;
  status: "ok" | "error";
  count: number;
  error: string | null;
};

type TopRow = {
  label: string;
  count: number;
  detail?: string;
};

const countTables = [
  "visitor_profiles",
  "visitor_sessions",
  "visitor_events",
  "analytics_events",
  "search_events",
  "saved_searches",
  "member_profiles",
  "member_watchlists",
  "member_watchlist_items",
  "source_submissions",
  "correction_requests",
  "privacy_requests",
  "form_submissions",
  "profile_claims",
  "contributor_profiles",
  "contributor_records",
  "data_product_interests",
  "feature_flags",
  "pricing_experiments",
  "pricing_experiment_assignments",
  "pricing_experiment_events",
  "beta_access_requests",
  "future_revenue_feature_flags",
  "future_revenue_packages",
  "admin_audit_logs",
  "admin_notes",
  "admin_assignments",
  "import_runs",
  "import_errors",
  "data_quality_issues",
  "broken_links",
  "duplicate_candidates",
];

const highIntentRoutes = [
  "/services",
  "/data-reports",
  "/free-packet",
  "/submit-source",
  "/sources/submit",
  "/elections/texas/contribute",
  "/profiles/claim",
];

const adminModuleLinks = [
  ["/admin/sources", "Source Review Queue", "admin_source_review_started"],
  ["/admin/corrections", "Correction Review Queue", "correction_admin_resolved"],
  ["/admin/intake", "Correction / Form Queue", "admin_form_opened"],
  ["/admin/control-center", "Profile Manager", "admin_profile_updated"],
  ["/admin/content-review", "Content Desk", "admin_module_open"],
  ["/admin/data-health", "Data Health", "admin_data_health_opened"],
  ["/admin/analytics", "Analytics", "admin_module_open"],
  ["/admin/behavioral-analytics", "Behavioral Analytics", "admin_module_open"],
  ["/admin/seo", "SEO Audit", "seo_audit_opened"],
  ["/admin/pricing", "Pricing Experiments", "admin_monetization_opened"],
  ["/admin/monetization-readiness", "Monetization Readiness", "admin_monetization_opened"],
  ["/admin/future-revenue", "Hidden Revenue Flags", "admin_monetization_opened"],
  ["/admin/audit-log", "Audit Log", "admin_audit_log_opened"],
] as const;

async function countTable(admin: AdminClient, table: string): Promise<CountResult> {
  const { count, error } = await admin.from(table).select("*", { count: "exact", head: true });
  return {
    table,
    status: error ? "error" : "ok",
    count: error ? 0 : count ?? 0,
    error: error?.message ?? null,
  };
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

function tableCount(counts: CountResult[], table: string) {
  return counts.find((entry) => entry.table === table)?.count ?? 0;
}

function cleanLabel(value: unknown, fallback = "Unknown") {
  if (typeof value !== "string") return fallback;
  const clean = value.trim();
  return clean || fallback;
}

function optionalLabel(value: unknown) {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  return clean || null;
}

function topValues(rows: Array<Record<string, unknown>>, reader: (row: Record<string, unknown>) => string | null, limit = 5): TopRow[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = reader(row);
    if (!label) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function countEvents(rows: Array<Record<string, unknown>>, matcher: (eventType: string) => boolean) {
  return rows.filter((row) => matcher(cleanLabel(row.event_type, ""))).length;
}

function countForms(rows: Array<Record<string, unknown>>, matcher: (formKey: string) => boolean) {
  return rows.filter((row) => matcher(cleanLabel(row.form_key, ""))).length;
}

function latestDate(rows: Array<Record<string, unknown>>, key = "created_at") {
  const value = rows.find((row) => typeof row[key] === "string")?.[key];
  return typeof value === "string" ? new Date(value).toLocaleString() : "No records yet";
}

export default async function AdminPage() {
  const admin = getSupabaseAdminClient();
  const dataStats = getRepWatchrDataStats();
  const schoolStats = getSchoolBoardStats();
  const completion = getOfficialCompletionDashboard();
  const readiness = getMonetizationReadinessReport();
  const officials = getAllOfficials();

  if (!admin) {
    return (
      <AdminShell>
        <section className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">Setup blocked</p>
          <h1 className="mt-3 text-3xl font-black text-blue-950">Admin shell is protected. Service-role data is not configured.</h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
            The admin route is server-protected, but aggregate queues and audit data require SUPABASE_SERVICE_ROLE_KEY. Add it before using review desks in production.
          </p>
        </section>
      </AdminShell>
    );
  }

  const [
    tableCounts,
    recentEvents,
    recentSourceRows,
    recentFormRows,
    recentAuditRows,
    recentBrokenLinks,
    recentDataQualityRows,
    recentDuplicateRows,
    recentImportRuns,
  ] = await Promise.all([
    Promise.all(countTables.map((table) => countTable(admin, table))),
    selectRows(admin, "visitor_events", "event_type,path,entity_type,entity_id,county,search_term,metadata,occurred_at", "occurred_at", 700),
    selectRows(admin, "source_submissions", "id,status,priority,target_type,target_name,jurisdiction,source_type,created_at", "created_at", 120),
    selectRows(admin, "form_submissions", "id,form_key,email,name,status,priority,source_route,created_at,updated_at", "created_at", 160),
    selectRows(admin, "admin_audit_logs", "id,actor_user_id,action,entity_type,entity_id,metadata,created_at", "created_at", 80),
    selectRows(admin, "broken_links", "id,url,entity_type,entity_id,status_code,status,last_checked_at,created_at", "created_at", 20),
    selectRows(admin, "data_quality_issues", "id,issue_type,severity,status,entity_type,entity_id,title,description,created_at", "created_at", 20),
    selectRows(admin, "duplicate_candidates", "id,entity_type,entity_id_a,entity_id_b,status,similarity_score,created_at", "created_at", 20),
    selectRows(admin, "import_runs", "id,source_key,source_name,import_type,status,started_at,completed_at,records_seen,records_created,records_updated,records_skipped,errors_count,created_at", "started_at", 12),
  ]);

  const eventRows = recentEvents.rows;
  const formRows = recentFormRows.rows;
  const sourceRows = recentSourceRows.rows;
  const sourceGapCount = completion.missingItemCounts.reduce((sum, item) => sum + item.count, 0);
  const highIntentViews = eventRows.filter((row) => highIntentRoutes.some((route) => cleanLabel(row.path, "").startsWith(route))).length;

  const overviewMetrics = [
    { label: "Visitors", value: tableCount(tableCounts, "visitor_profiles"), detail: "Anonymous visitor profiles" },
    { label: "Sessions", value: tableCount(tableCounts, "visitor_sessions"), detail: "Tracked sessions" },
    { label: "Page events", value: tableCount(tableCounts, "visitor_events"), detail: "First-party behavior rows" },
    { label: "Searches", value: tableCount(tableCounts, "search_events") || countEvents(eventRows, (event) => event.includes("search")), detail: "Search intent signals" },
    { label: "Profile opens", value: countEvents(eventRows, (event) => event === "profile_open"), detail: "Recent sampled events" },
    { label: "Source clicks", value: countEvents(eventRows, (event) => event.includes("source") || event === "external_source_click"), detail: "Recent sampled events" },
    { label: "Watchlist adds", value: countEvents(eventRows, (event) => event === "watchlist_add"), detail: "Recent sampled events" },
    { label: "Signups", value: tableCount(tableCounts, "member_profiles") || countEvents(eventRows, (event) => event.includes("signup")), detail: "Member profiles or signup events" },
    { label: "Source queue", value: tableCount(tableCounts, "source_submissions"), detail: "Submitted public records" },
    { label: "Corrections", value: tableCount(tableCounts, "correction_requests") || countForms(formRows, (formKey) => formKey === "correction_request"), detail: "Correction review rows" },
    { label: "Packet builds", value: countForms(formRows, (formKey) => formKey === "free_packet" || formKey === "public_records_request"), detail: "Packet/request intent" },
    { label: "Package interest", value: countForms(formRows, (formKey) => formKey === "package_interest" || formKey === "research_request"), detail: "Buyer intent forms" },
    { label: "Source gaps", value: sourceGapCount, detail: "Static profile missing items" },
  ];

  return (
    <AdminShell>
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-xl shadow-blue-950/20">
        <div className="h-1.5 bg-[linear-gradient(90deg,#b42318_0%,#b42318_33%,#ffffff_33%,#ffffff_66%,#1d4ed8_66%,#1d4ed8_100%)]" />
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_22rem] lg:p-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">Admin command center</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Run RepWatchr from one protected desk.</h1>
            <p className="mt-4 max-w-4xl text-sm font-semibold leading-6 text-slate-200 sm:text-base">
              Review sources, resolve corrections, watch data health, inspect analytics, and keep revenue work behind safety and readiness checks.
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Public surface</p>
            <p className="mt-3 text-4xl font-black">{officials.length.toLocaleString()}</p>
            <p className="text-sm font-bold text-slate-300">official records loaded</p>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-200">
              {dataStats.publicSourceUrls.toLocaleString()} public source URLs and {schoolStats.candidates.toLocaleString()} school-board candidate rows are represented in the build.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {overviewMetrics.map((metric) => (
          <AdminMetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <OverviewPanel topRoutes={topValues(eventRows, (row) => optionalLabel(row.path), 6)} topProfiles={topValues(eventRows, (row) => cleanLabel(row.entity_type, "") === "official" ? optionalLabel(row.entity_id) : null, 6)} topCounties={topValues(eventRows, (row) => optionalLabel(row.county), 6)} topSearchTerms={topValues(eventRows, (row) => optionalLabel(row.search_term), 6)} highIntentViews={highIntentViews} />
        <AdminFilters />
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-2">
        <SourceReviewPanel rows={sourceRows} total={tableCount(tableCounts, "source_submissions")} latest={latestDate(sourceRows)} />
        <CorrectionReviewPanel rows={formRows} />
        <ProfileManager completion={completion} />
        <ContentDesk eventRows={eventRows} />
        <DataHealthPanel tableCounts={tableCounts} brokenLinks={recentBrokenLinks.rows} issues={recentDataQualityRows.rows} duplicates={recentDuplicateRows.rows} importRuns={recentImportRuns.rows} />
        <AnalyticsPanel eventRows={eventRows} tableCounts={tableCounts} />
        <MonetizationReadinessPanel readiness={readiness} tableCounts={tableCounts} />
        <UsersAndContributorsPanel tableCounts={tableCounts} />
      </section>

      <section className="mt-6">
        <AuditLogTable rows={recentAuditRows.rows} error={recentAuditRows.error} />
      </section>
    </AdminShell>
  );
}

function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="rw-page-shell">
      <AdminOpenTracker moduleName="root" />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}

function AdminMetricCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-blue-950">{value.toLocaleString()}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{detail}</p>
    </div>
  );
}

function AdminTable({ title, rows, emptyLabel = "No rows yet." }: { title: string; rows: TopRow[]; emptyLabel?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-black text-blue-950">{title}</h3>
      <div className="mt-4 divide-y divide-slate-100">
        {rows.length ? rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm font-black text-slate-900">{row.label}</p>
              {row.detail ? <p className="text-xs font-semibold text-slate-500">{row.detail}</p> : null}
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-blue-950">{row.count.toLocaleString()}</span>
          </div>
        )) : <p className="py-4 text-sm font-semibold text-slate-500">{emptyLabel}</p>}
      </div>
    </div>
  );
}

function AdminFilters() {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Admin modules</p>
      <h2 className="mt-2 text-2xl font-black text-blue-950">Open the right desk.</h2>
      <div className="mt-4 grid gap-2">
        {adminModuleLinks.map(([href, label, eventName]) => (
          <AdminTrackedLink
            key={href}
            href={href}
            moduleName={label}
            eventName={eventName}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-blue-950 transition hover:border-blue-300 hover:bg-blue-50"
          >
            {label}
          </AdminTrackedLink>
        ))}
      </div>
    </div>
  );
}

function OverviewPanel({
  topRoutes,
  topProfiles,
  topCounties,
  topSearchTerms,
  highIntentViews,
}: {
  topRoutes: TopRow[];
  topProfiles: TopRow[];
  topCounties: TopRow[];
  topSearchTerms: TopRow[];
  highIntentViews: number;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <AdminTable title="Top Routes" rows={topRoutes} />
      <AdminTable title="Top Profiles" rows={topProfiles} />
      <AdminTable title="Top Counties" rows={topCounties} />
      <AdminTable title="Top Search Terms" rows={topSearchTerms} />
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 md:col-span-2">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-800">High intent</p>
        <p className="mt-2 text-3xl font-black text-blue-950">{highIntentViews.toLocaleString()}</p>
        <p className="mt-1 text-sm font-bold text-slate-700">recent sampled views on service, data, packet, source, contribution, and claim routes.</p>
      </div>
    </div>
  );
}

function SourceReviewPanel({ rows, total, latest }: { rows: Array<Record<string, unknown>>; total: number; latest: string }) {
  const pending = rows.filter((row) => ["new", "needs_review", "needs_more_info"].includes(cleanLabel(row.status, ""))).length;
  return (
    <Panel title="Source Review Queue" eyebrow="Review desk" actionHref="/admin/sources" actionLabel="Open source queue" moduleName="Source Review Queue" eventName="admin_source_review_started">
      <div className="grid gap-3 sm:grid-cols-3">
        <AdminMetricCard label="Total" value={total} detail="All source submissions" />
        <AdminMetricCard label="Pending sample" value={pending} detail="Recent rows needing review" />
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Latest</p>
          <p className="mt-2 text-sm font-black text-blue-950">{latest}</p>
        </div>
      </div>
    </Panel>
  );
}

function CorrectionReviewPanel({ rows }: { rows: Array<Record<string, unknown>> }) {
  const correctionRows = rows.filter((row) => cleanLabel(row.form_key, "") === "correction_request" || cleanLabel(row.form_key, "") === "report_broken_link");
  const pending = correctionRows.filter((row) => ["new", "needs_review", "needs_more_info"].includes(cleanLabel(row.status, ""))).length;
  return (
    <Panel title="Correction Queue" eyebrow="Trust and safety" actionHref="/admin/intake" actionLabel="Open intake queue" moduleName="Correction Queue" eventName="admin_form_opened">
      <div className="grid gap-3 sm:grid-cols-2">
        <AdminMetricCard label="Correction rows" value={correctionRows.length} detail="Recent form sample" />
        <AdminMetricCard label="Pending" value={pending} detail="Needs admin decision" />
      </div>
      <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
        Correction records should be resolved before claims, red flags, or profile changes are treated as public truth.
      </p>
    </Panel>
  );
}

function ProfileManager({ completion }: { completion: ReturnType<typeof getOfficialCompletionDashboard> }) {
  return (
    <Panel title="Official / Profile Manager" eyebrow="Profile health" actionHref="/admin/control-center" actionLabel="Open control center" moduleName="Profile Manager">
      <div className="grid gap-3 sm:grid-cols-3">
        <AdminMetricCard label="Profiles" value={completion.totalProfiles} detail="Completion-tracked profiles" />
        <AdminMetricCard label="Complete" value={completion.completeProfiles} detail="Static profile complete" />
        <AdminMetricCard label="Incomplete" value={completion.incompleteProfiles} detail={`${completion.averageCompletionPercent}% avg complete`} />
      </div>
      <AdminTable
        title="Top Missing Items"
        rows={completion.missingItemCounts.slice(0, 5).map((item) => ({ label: item.label, count: item.count }))}
      />
    </Panel>
  );
}

function ContentDesk({ eventRows }: { eventRows: Array<Record<string, unknown>> }) {
  const storyEvents = eventRows.filter((row) => cleanLabel(row.entity_type, "") === "article" || cleanLabel(row.path, "").startsWith("/news")).length;
  return (
    <Panel title="Content Desk" eyebrow="Stories and wire" actionHref="/admin/content-review" actionLabel="Open content review" moduleName="Content Desk">
      <AdminMetricCard label="Story activity" value={storyEvents} detail="Recent sampled article/news events" />
      <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
        Daily Watch, story drafts, publish controls, source attachment, and share snippets belong here. No noisy wire item should publish as an authoritative RepWatchr item without review.
      </p>
    </Panel>
  );
}

function DataHealthPanel({
  tableCounts,
  brokenLinks,
  issues,
  duplicates,
  importRuns,
}: {
  tableCounts: CountResult[];
  brokenLinks: Array<Record<string, unknown>>;
  issues: Array<Record<string, unknown>>;
  duplicates: Array<Record<string, unknown>>;
  importRuns: Array<Record<string, unknown>>;
}) {
  return (
    <Panel title="Data Health" eyebrow="Maintenance" actionHref="/admin/data-health" actionLabel="Open data health" moduleName="Data Health" eventName="admin_data_health_opened">
      <div className="grid gap-3 sm:grid-cols-2">
        <AdminMetricCard label="Import runs" value={tableCount(tableCounts, "import_runs")} detail={`${importRuns.length} recent rows loaded`} />
        <AdminMetricCard label="Import errors" value={tableCount(tableCounts, "import_errors")} detail="Needs operator review" />
        <AdminMetricCard label="Broken links" value={tableCount(tableCounts, "broken_links")} detail={`${brokenLinks.length} recent rows loaded`} />
        <AdminMetricCard label="Duplicates" value={tableCount(tableCounts, "duplicate_candidates")} detail={`${duplicates.length} recent candidates`} />
      </div>
      <AdminTable title="Recent Data Issues" rows={issues.slice(0, 5).map((issue) => ({ label: cleanLabel(issue.title ?? issue.issue_type), count: 1, detail: cleanLabel(issue.status, "") }))} emptyLabel="No recent data quality rows loaded." />
    </Panel>
  );
}

function AnalyticsPanel({ eventRows, tableCounts }: { eventRows: Array<Record<string, unknown>>; tableCounts: CountResult[] }) {
  return (
    <Panel title="Analytics" eyebrow="Behavior signals" actionHref="/admin/behavioral-analytics" actionLabel="Open behavioral analytics" moduleName="Analytics">
      <div className="grid gap-3 sm:grid-cols-3">
        <AdminMetricCard label="Visitor events" value={tableCount(tableCounts, "visitor_events")} detail="Behavior rows" />
        <AdminMetricCard label="Shares" value={countEvents(eventRows, (event) => event.includes("share") || event.includes("copied"))} detail="Recent sampled events" />
        <AdminMetricCard label="Exits" value={countEvents(eventRows, (event) => event === "exit")} detail="Recent sampled events" />
      </div>
    </Panel>
  );
}

function MonetizationReadinessPanel({
  readiness,
  tableCounts,
}: {
  readiness: ReturnType<typeof getMonetizationReadinessReport>;
  tableCounts: CountResult[];
}) {
  return (
    <Panel title="Monetization Readiness" eyebrow="Revenue desk" actionHref="/admin/monetization-readiness" actionLabel="Open readiness report" moduleName="Monetization Readiness" eventName="admin_monetization_opened">
      <div className="grid gap-3 sm:grid-cols-3">
        <AdminMetricCard label="Score" value={readiness.summary.score} detail={readiness.summary.overallStatus} />
        <AdminMetricCard label="Ready checks" value={readiness.summary.readyCount} detail={`${readiness.summary.totalChecks} total checks`} />
        <AdminMetricCard label="Interest rows" value={tableCount(tableCounts, "data_product_interests")} detail="Future buyer intent" />
      </div>
      <p className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-800">
        {readiness.summary.salesBlocker}
      </p>
    </Panel>
  );
}

function UsersAndContributorsPanel({ tableCounts }: { tableCounts: CountResult[] }) {
  return (
    <Panel title="Users and Contributors" eyebrow="People system" actionHref="/admin/control-center" actionLabel="Open control center" moduleName="Users and Contributors">
      <div className="grid gap-3 sm:grid-cols-3">
        <AdminMetricCard label="Watchlists" value={tableCount(tableCounts, "member_watchlists")} detail="Member saved lists" />
        <AdminMetricCard label="Watch items" value={tableCount(tableCounts, "member_watchlist_items")} detail="Saved records" />
        <AdminMetricCard label="Contributors" value={tableCount(tableCounts, "contributor_profiles")} detail="Public reputation profiles" />
      </div>
    </Panel>
  );
}

function AuditLogTable({ rows, error }: { rows: Array<Record<string, unknown>>; error: string | null }) {
  return (
    <Panel title="Audit Log" eyebrow="Before / after trail" actionHref="/admin/audit-log" actionLabel="Open audit log" moduleName="Audit Log" eventName="admin_audit_log_opened">
      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
          Audit log table is not available yet. Run the admin dashboard migration before production review work.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead>
              <tr className="text-xs font-black uppercase tracking-wide text-slate-500">
                <th className="py-3 pr-4">Action</th>
                <th className="py-3 pr-4">Entity</th>
                <th className="py-3 pr-4">Admin</th>
                <th className="py-3 pr-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length ? rows.slice(0, 12).map((row) => (
                <tr key={cleanLabel(row.id)}>
                  <td className="py-3 pr-4 font-black text-blue-950">{cleanLabel(row.action)}</td>
                  <td className="py-3 pr-4 font-semibold text-slate-700">{cleanLabel(row.entity_type)} / {cleanLabel(row.entity_id)}</td>
                  <td className="py-3 pr-4 font-semibold text-slate-700">{cleanLabel(row.actor_user_id, "system")}</td>
                  <td className="py-3 pr-4 font-semibold text-slate-500">{typeof row.created_at === "string" ? new Date(row.created_at).toLocaleString() : "Unknown"}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-6 text-sm font-semibold text-slate-500">No admin audit rows loaded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function Panel({
  eyebrow,
  title,
  actionHref,
  actionLabel,
  moduleName,
  eventName = "admin_module_open",
  children,
}: {
  eyebrow: string;
  title: string;
  actionHref: string;
  actionLabel: string;
  moduleName: string;
  eventName?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-black text-blue-950">{title}</h2>
        </div>
        <AdminTrackedLink
          href={actionHref}
          moduleName={moduleName}
          eventName={eventName}
          className="rounded-xl bg-blue-900 px-4 py-3 text-center text-xs font-black uppercase tracking-wide text-white transition hover:bg-red-700"
        >
          {actionLabel}
        </AdminTrackedLink>
      </div>
      <div className="mt-5 grid gap-4">{children}</div>
    </section>
  );
}
