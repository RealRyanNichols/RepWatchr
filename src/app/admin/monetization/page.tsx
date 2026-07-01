import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdminClient } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  buildMonetizationCategories,
  summarizePackageDemand,
  type PackageDemandSummary,
  type PackageInterestRow,
} from "@/lib/package-interest";
import { isFeatureEnabled } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Monetization Demand | RepWatchr Admin",
  robots: { index: false, follow: false },
};

type CountResult = {
  label: string;
  count: number | null;
  error: string | null;
};

type AdminClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

async function countTable(admin: AdminClient, table: string, label: string): Promise<CountResult> {
  const { count, error } = await admin.from(table).select("*", { count: "exact", head: true });
  return { label, count: error ? null : count ?? 0, error: error?.message ?? null };
}

async function countAnalyticsEvent(admin: AdminClient, eventName: string): Promise<CountResult> {
  const { count, error } = await admin
    .from("analytics_events")
    .select("*", { count: "exact", head: true })
    .eq("event_name", eventName);
  return { label: eventName, count: error ? null : count ?? 0, error: error?.message ?? null };
}

function countBy(rows: PackageInterestRow[], key: keyof PackageInterestRow) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = String(row[key] ?? "").trim() || "unspecified";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 8);
}

function highIntent(row: PackageInterestRow) {
  return Boolean(row.email && row.use_case && (row.jurisdiction || row.entity_id));
}

export default async function AdminMonetizationPage() {
  const access = await requireAdminClient();

  if (!access.ok) {
    return (
      <AdminShell>
        <section className="rounded-3xl border border-red-300/30 bg-red-500/10 p-6 text-red-50">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-200">Monetization locked</p>
          <h1 className="mt-2 text-3xl font-black">Live demand data is not available.</h1>
          <p className="mt-3 text-sm font-semibold leading-6">{access.error}</p>
          <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs font-bold leading-5">
            Needed for live admin demand reporting: Supabase public auth env vars, admin role, and SUPABASE_SERVICE_ROLE_KEY.
          </p>
        </section>
      </AdminShell>
    );
  }

  const paymentsEnabled = await isFeatureEnabled("ENABLE_PAYMENTS");
  const { data, error } = await access.admin
    .from("package_interest")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(2000);

  const packageRows = (data ?? []) as PackageInterestRow[];
  const [
    sourceSubmissionCount,
    packetCount,
    watchCount,
    analyticsCount,
    pageViews,
    cardViews,
    interestClicks,
    formSubmits,
    searchCount,
  ] = await Promise.all([
    countTable(access.admin, "source_submissions", "source submissions"),
    countTable(access.admin, "source_packets", "source packets"),
    countTable(access.admin, "member_watchlist_items", "watchlists"),
    countTable(access.admin, "analytics_events", "analytics events"),
    countAnalyticsEvent(access.admin, "package_page_open"),
    countAnalyticsEvent(access.admin, "package_card_viewed"),
    countAnalyticsEvent(access.admin, "package_interest_clicked"),
    countAnalyticsEvent(access.admin, "package_interest_submitted"),
    countAnalyticsEvent(access.admin, "search_query_submitted"),
  ]);

  const highIntentRows = packageRows.filter(highIntent);
  const demand = summarizePackageDemand(packageRows, {
    paymentsEnabled,
    hasSourceReview: !sourceSubmissionCount.error,
    hasFulfillmentWorkflow: !packetCount.error,
  });
  const categories = buildMonetizationCategories({
    totalInterest: packageRows.length,
    highIntent: highIntentRows.length,
    sourceSubmissionCount: sourceSubmissionCount.count,
    packetCount: packetCount.count,
    watchCount: watchCount.count,
    analyticsCount: analyticsCount.count,
    paymentsEnabled,
  });

  return (
    <AdminShell>
      <section className="overflow-hidden rounded-3xl border border-white/15 bg-white/[0.08] shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="h-1.5 bg-[linear-gradient(90deg,#b91c1c_0%,#f5d061_38%,#ffffff_50%,#2563eb_100%)]" />
        <div className="p-6">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-red-200">Admin demand desk</p>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Monetization demand</h1>
              <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-200">
                Package pages should collect demand, not sell by default. Use this view to decide what deserves
                beta testing, manual fulfillment, or future checkout.
              </p>
            </div>
            <StatusPill label={paymentsEnabled ? "Payments flag on" : "Payments flag off"} status={paymentsEnabled ? "candidate" : "blocked"} />
          </div>
          {error ? (
            <p className="mt-4 rounded-2xl border border-red-300/30 bg-red-500/10 p-4 text-sm font-bold text-red-100">
              package_interest table is not reachable yet: {error.message}
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Total package interest" value={packageRows.length} detail="Rows in package_interest" />
        <Metric label="High-intent rows" value={highIntentRows.length} detail="Email plus target or jurisdiction" />
        <Metric label="Anonymous intent" value={packageRows.filter((row) => row.anonymous_id && !row.user_id).length} detail="Visitor-linked demand" />
        <Metric label="Named or user-linked" value={packageRows.filter((row) => row.email || row.user_id).length} detail="Reachable leads" />
        <Metric label="Search demand" value={searchCount.count ?? "n/a"} detail={searchCount.error ? "analytics unavailable" : "tracked searches"} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Conversion funnel</p>
          <div className="mt-4 grid gap-3">
            {[pageViews, cardViews, interestClicks, formSubmits].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black">{item.label.replace(/_/g, " ")}</p>
                  <p className="text-2xl font-black">{item.count ?? "n/a"}</p>
                </div>
                {item.error ? <p className="mt-2 text-xs font-bold text-red-200">{item.error}</p> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">Readiness categories</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {categories.map((category) => (
              <div key={category.label} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-black">{category.label}</p>
                  <StatusPill label={`${category.score}%`} status={category.status} />
                </div>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{category.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <Breakdown title="By package" items={countBy(packageRows, "package_name")} />
        <Breakdown title="By jurisdiction" items={countBy(packageRows, "jurisdiction")} />
        <Breakdown title="By source route" items={countBy(packageRows, "source_route")} />
        <Breakdown title="By organization type" items={countBy(packageRows, "organization_type")} />
        <Breakdown title="By urgency" items={countBy(packageRows, "urgency")} />
        <Breakdown title="By status" items={countBy(packageRows, "status")} />
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.08] p-5 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">Package recommendations</p>
            <h2 className="mt-2 text-2xl font-black">Do not fake readiness.</h2>
          </div>
          <Link
            href="/admin/monetization-readiness"
            className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-wide text-white hover:bg-white/20"
          >
            Open readiness audit
          </Link>
        </div>
        <div className="mt-5 grid gap-3">
          {demand.map((item) => (
            <PackageRow key={item.packageKey} item={item} />
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-amber-200/30 bg-amber-200/10 p-5 text-amber-50">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-100">Boundary</p>
        <p className="mt-2 text-sm font-semibold leading-6">
          Use package interest to make product and fulfillment decisions. Do not sell private user behavior,
          individual political-interest profiles, private watchlists, or raw user submissions.
        </p>
      </section>
    </AdminShell>
  );
}

function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#1e3a8a_0%,#0f172a_38%,#020617_100%)] text-white">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: number | string; detail: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 shadow-xl shadow-blue-950/20 backdrop-blur">
      <p className="text-3xl font-black">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-200">{label}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{detail}</p>
    </div>
  );
}

function Breakdown({ title, items }: { title: string; items: Array<{ label: string; count: number }> }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 backdrop-blur">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">{title}</p>
      <div className="mt-4 grid gap-2">
        {(items.length ? items : [{ label: "Not enough data yet", count: 0 }]).map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 p-3">
            <p className="truncate text-sm font-bold text-slate-200">{item.label}</p>
            <p className="text-lg font-black">{item.count.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PackageRow({ item }: { item: PackageDemandSummary }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black">{item.packageName}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-400">{item.packageKey}</p>
        </div>
        <StatusPill label={item.recommendation} status={item.readinessScore >= 70 ? "candidate" : item.readinessScore >= 40 ? "collecting" : "blocked"} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <MiniMetric label="Interest" value={item.totalInterest} />
        <MiniMetric label="High intent" value={item.highIntent} />
        <MiniMetric label="Anonymous" value={item.anonymousInterest} />
        <MiniMetric label="Named" value={item.namedInterest} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(item.blockers.length ? item.blockers : ["No static blockers recorded. Verify fulfillment manually."]).slice(0, 4).map((blocker) => (
          <span key={blocker} className="rounded-full border border-amber-200/30 bg-amber-200/10 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-amber-100">
            {blocker}
          </span>
        ))}
      </div>
    </article>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="text-xl font-black">{value.toLocaleString()}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

function StatusPill({
  label,
  status,
}: {
  label: string;
  status: "blocked" | "collecting" | "candidate" | "ready";
}) {
  const className =
    status === "ready"
      ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-100"
      : status === "candidate"
        ? "border-cyan-200/40 bg-cyan-200/10 text-cyan-100"
        : status === "collecting"
          ? "border-amber-200/40 bg-amber-200/10 text-amber-100"
          : "border-red-300/40 bg-red-500/10 text-red-100";

  return (
    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${className}`}>
      {label}
    </span>
  );
}
