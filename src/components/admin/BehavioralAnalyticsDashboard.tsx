"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { trackVisitorIntelligenceEvent } from "@/lib/visitor-intelligence-client";

type KpiSummary = {
  period: string;
  page_views: number;
  unique_visitors: number;
  sessions: number;
  action_clicks: number;
  heatmap_clicks: number;
  shares: number;
  watchlist_creations: number;
  packet_creations: number;
  source_submissions: number;
  official_follows: number;
  race_follows: number;
  email_signups: number;
  checkout_starts: number;
  checkout_completions: number;
  admin_dashboard_opens: number;
  avg_time_on_page_seconds: number;
  avg_session_length_seconds: number;
  ctr_percent: number;
  share_rate_percent: number;
  return_rate_percent: number;
  avg_page_engagement_score: number;
  last_event_at: string | null;
};

type PageScore = {
  path: string;
  page_views: number;
  unique_visitors: number;
  action_clicks: number;
  heatmap_clicks: number;
  shares: number;
  watchlist_creations: number;
  packet_creations: number;
  source_submissions: number;
  official_follows: number;
  race_follows: number;
  email_signups: number;
  checkout_starts: number;
  checkout_completions: number;
  exits: number;
  avg_time_on_page_seconds: number;
  avg_scroll_percent: number;
  ctr_percent: number;
  share_rate_percent: number;
  exit_rate_percent: number;
  engagement_score: number;
  last_event_at: string | null;
};

type HeatmapPoint = {
  path: string;
  x_bucket: number;
  y_bucket: number;
  click_count: number;
  unique_visitors: number;
  last_click_at: string | null;
};

type FunnelStep = {
  funnel_name: string;
  step_order: number;
  step_key: string;
  step_label: string;
  event_count: number;
  unique_visitors: number;
};

type Cohort = {
  cohort_week: string;
  cohort_visitors: number;
  returned_visitors: number;
  retained_after_1d: number;
  retained_after_7d: number;
  retained_after_30d: number;
  return_rate_percent: number;
  avg_total_time_seconds: number;
};

type TopListItem = {
  list_type: string;
  item_key: string;
  item_label: string;
  metric_count: number;
  unique_visitors: number;
  engagement_score: number;
  last_event_at: string | null;
};

type Payload = {
  generatedAt: string;
  kpis: KpiSummary | null;
  pageScores: PageScore[];
  heatmap: HeatmapPoint[];
  funnels: FunnelStep[];
  cohorts: Cohort[];
  topLists: {
    pages: TopListItem[];
    officials: TopListItem[];
    stories: TopListItem[];
    contributors: TopListItem[];
    counties: TopListItem[];
    searches: TopListItem[];
    exits: TopListItem[];
  };
  migrationReady: boolean;
  errors: string[];
};

const listLabels: Record<keyof Payload["topLists"], string> = {
  pages: "Top pages",
  officials: "Top officials",
  stories: "Top stories",
  contributors: "Top contributors",
  counties: "Top counties",
  searches: "Top searches",
  exits: "Top exits",
};

function formatNumber(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString();
}

function formatSeconds(value: number | null | undefined) {
  const seconds = Number(value ?? 0);
  if (seconds < 60) return `${Math.round(seconds)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

function pct(value: number | null | undefined) {
  return `${Number(value ?? 0).toFixed(1)}%`;
}

export default function BehavioralAnalyticsDashboard() {
  const { user, roles, loading } = useAuth();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const isAdmin = roles.includes("admin");

  useEffect(() => {
    trackVisitorIntelligenceEvent({
      eventType: "admin_open",
      path: "/admin/behavioral-analytics",
      metadata: { dashboard: "behavioral_analytics" },
    });
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    let mounted = true;

    async function loadAnalytics() {
      setError("");
      const response = await fetch("/api/admin/behavioral-analytics", { cache: "no-store" });
      const data = await response.json();

      if (!mounted) return;
      if (!response.ok) {
        setError(data.error ?? "Behavioral analytics request failed.");
        return;
      }

      setPayload(data as Payload);
    }

    loadAnalytics().catch((loadError: Error) => {
      if (!mounted) return;
      setError(loadError.message);
    });

    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  const heatmapPath = payload?.heatmap[0]?.path ?? "";
  const heatmapPoints = useMemo(() => payload?.heatmap.filter((point) => point.path === heatmapPath) ?? [], [payload, heatmapPath]);
  const maxHeatmapClicks = Math.max(1, ...heatmapPoints.map((point) => point.click_count));
  const funnelGroups = useMemo(() => {
    const groups = new Map<string, FunnelStep[]>();
    for (const step of payload?.funnels ?? []) {
      const existing = groups.get(step.funnel_name) ?? [];
      existing.push(step);
      groups.set(step.funnel_name, existing);
    }
    return Array.from(groups.entries()).map(([name, steps]) => ({
      name,
      steps: steps.sort((a, b) => a.step_order - b.step_order),
    }));
  }, [payload]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (!user) {
    return <AccessMessage title="Login required" body="Behavioral analytics are admin-only." href="/auth/login" linkLabel="Log in" />;
  }

  if (!isAdmin) {
    return <AccessMessage title="Admin role required" body="This route is blocked unless Supabase says your account has the admin role." href="/dashboard" linkLabel="Back to dashboard" />;
  }

  const kpis = payload?.kpis;
  const conversionTotal =
    Number(kpis?.watchlist_creations ?? 0) +
    Number(kpis?.packet_creations ?? 0) +
    Number(kpis?.source_submissions ?? 0) +
    Number(kpis?.official_follows ?? 0) +
    Number(kpis?.race_follows ?? 0) +
    Number(kpis?.email_signups ?? 0) +
    Number(kpis?.checkout_completions ?? 0);

  return (
    <div className="rw-page-shell">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-2xl border border-slate-300 bg-slate-950 text-white shadow-sm">
          <div className="h-1.5 bg-[linear-gradient(90deg,#b42318_0%,#b42318_33%,#ffffff_33%,#ffffff_66%,#1d4ed8_66%,#1d4ed8_100%)]" />
          <div className="p-5 sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">Admin analytics</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Behavioral analytics engine</h1>
            <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-200 sm:text-base">
              CTR, time on page, engagement scores, return rate, session length, shares, watchlists, packets,
              source submissions, follows, email signup, checkout, heatmaps, funnels, cohorts, top pages, and top exits.
            </p>
            {payload ? (
              <p className="mt-3 text-xs font-bold text-slate-400">Last refreshed {new Date(payload.generatedAt).toLocaleString()}</p>
            ) : null}
          </div>
        </section>

        {error ? <StatusBox tone="red">{error}</StatusBox> : null}
        {payload && !payload.migrationReady ? (
          <StatusBox tone="amber">
            Run <code className="font-black">supabase-behavioral-analytics.sql</code>. Missing views/tables: {payload.errors.slice(0, 4).join(" | ")}
          </StatusBox>
        ) : null}

        {!payload && !error ? <div className="mt-5 h-64 animate-pulse rounded-2xl bg-white" /> : null}

        {payload ? (
          <>
            <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="CTR" value={pct(kpis?.ctr_percent)} detail={`${formatNumber(kpis?.action_clicks)} tracked clicks`} />
              <Metric label="Time on page" value={formatSeconds(kpis?.avg_time_on_page_seconds)} detail="Average public-page attention" />
              <Metric label="Engagement score" value={Number(kpis?.avg_page_engagement_score ?? 0).toFixed(1)} detail="Average across scored pages" />
              <Metric label="Return rate" value={pct(kpis?.return_rate_percent)} detail={`${formatNumber(kpis?.sessions)} sessions`} />
              <Metric label="Session length" value={formatSeconds(kpis?.avg_session_length_seconds)} detail={`${formatNumber(kpis?.unique_visitors)} unique visitors`} />
              <Metric label="Share rate" value={pct(kpis?.share_rate_percent)} detail={`${formatNumber(kpis?.shares)} shares/copies`} />
              <Metric label="Conversions" value={formatNumber(conversionTotal)} detail="Watches, packets, sources, follows, email, checkout" />
              <Metric label="Heatmap clicks" value={formatNumber(kpis?.heatmap_clicks)} detail="Click-position samples" />
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <Panel title="Page engagement scores" eyebrow="Every page gets a score">
                <div className="space-y-3">
                  {payload.pageScores.slice(0, 12).map((page) => (
                    <div key={page.path} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="break-all text-sm font-black text-slate-950">{page.path}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-600">
                            {formatNumber(page.page_views)} views · {pct(page.ctr_percent)} CTR · {pct(page.share_rate_percent)} share · {pct(page.exit_rate_percent)} exit
                          </p>
                        </div>
                        <span className={`rounded-xl px-3 py-2 text-sm font-black ${scoreTone(page.engagement_score)}`}>
                          {page.engagement_score}
                        </span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-[linear-gradient(90deg,#dc2626,#f59e0b,#16a34a)]" style={{ width: `${page.engagement_score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Heatmap" eyebrow={heatmapPath || "No heatmap data yet"}>
                <div className="grid aspect-square grid-cols-10 grid-rows-10 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-1">
                  {Array.from({ length: 100 }).map((_, index) => {
                    const x = (index % 10) * 10;
                    const y = Math.floor(index / 10) * 10;
                    const point = heatmapPoints.find((candidate) => candidate.x_bucket === x && candidate.y_bucket === y);
                    const intensity = point ? Math.max(0.16, point.click_count / maxHeatmapClicks) : 0.03;
                    return (
                      <div
                        key={`${x}-${y}`}
                        title={point ? `${point.click_count} clicks` : "No clicks"}
                        className="border border-white/5"
                        style={{ backgroundColor: `rgba(239, 68, 68, ${intensity})` }}
                      />
                    );
                  })}
                </div>
                <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">
                  Redder cells show higher click density on the current top-clicked page. No input values or private text are stored.
                </p>
              </Panel>
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-2">
              {funnelGroups.map((group) => (
                <Panel key={group.name} title={group.name.replace(/_/g, " ")} eyebrow="Funnel">
                  <div className="space-y-3">
                    {group.steps.map((step) => {
                      const firstCount = Math.max(1, group.steps[0]?.event_count ?? 1);
                      const width = Math.max(3, Math.min(100, (step.event_count / firstCount) * 100));
                      return (
                        <div key={`${group.name}-${step.step_key}`}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-black text-slate-950">{step.step_label}</p>
                            <p className="text-sm font-black text-blue-950">{formatNumber(step.event_count)}</p>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                            <div className="h-full rounded-full bg-blue-700" style={{ width: `${width}%` }} />
                          </div>
                          <p className="mt-1 text-xs font-semibold text-slate-500">{formatNumber(step.unique_visitors)} unique visitors</p>
                        </div>
                      );
                    })}
                  </div>
                </Panel>
              ))}
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <Panel title="Retention cohorts" eyebrow="Return behavior">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-xs font-black uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="py-2 pr-3">Week</th>
                        <th className="py-2 pr-3">Visitors</th>
                        <th className="py-2 pr-3">Return</th>
                        <th className="py-2 pr-3">7d</th>
                        <th className="py-2 pr-3">30d</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payload.cohorts.map((cohort) => (
                        <tr key={cohort.cohort_week} className="border-t border-slate-200">
                          <td className="py-2 pr-3 font-bold">{cohort.cohort_week}</td>
                          <td className="py-2 pr-3">{formatNumber(cohort.cohort_visitors)}</td>
                          <td className="py-2 pr-3 font-black text-blue-950">{pct(cohort.return_rate_percent)}</td>
                          <td className="py-2 pr-3">{formatNumber(cohort.retained_after_7d)}</td>
                          <td className="py-2 pr-3">{formatNumber(cohort.retained_after_30d)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>

              <Panel title="Conversion counters" eyebrow="Actions that bring people back">
                <div className="grid gap-3 sm:grid-cols-2">
                  <MiniMetric label="Watchlists" value={kpis?.watchlist_creations} />
                  <MiniMetric label="Packets" value={kpis?.packet_creations} />
                  <MiniMetric label="Sources" value={kpis?.source_submissions} />
                  <MiniMetric label="Official follows" value={kpis?.official_follows} />
                  <MiniMetric label="Race follows" value={kpis?.race_follows} />
                  <MiniMetric label="Email signups" value={kpis?.email_signups} />
                  <MiniMetric label="Checkout starts" value={kpis?.checkout_starts} />
                  <MiniMetric label="Checkout complete" value={kpis?.checkout_completions} />
                </div>
              </Panel>
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(Object.keys(payload.topLists) as Array<keyof Payload["topLists"]>).map((key) => (
                <Panel key={key} title={listLabels[key]} eyebrow="Top list">
                  <div className="space-y-2">
                    {payload.topLists[key].slice(0, 8).map((item) => (
                      <div key={`${key}-${item.item_key}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <p className="break-words text-sm font-black text-slate-950">{item.item_label}</p>
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-[11px] font-black text-blue-900">
                            {formatNumber(item.metric_count)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-slate-600">
                          {formatNumber(item.unique_visitors)} unique · score {formatNumber(item.engagement_score)}
                        </p>
                      </div>
                    ))}
                  </div>
                </Panel>
              ))}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}

function AccessMessage({ title, body, href, linkLabel }: { title: string; body: string; href: string; linkLabel: string }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-black text-slate-950">{title}</h1>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{body}</p>
      <Link href={href} className="mt-5 inline-flex rounded-xl bg-blue-900 px-5 py-3 text-sm font-black text-white hover:bg-red-700">
        {linkLabel}
      </Link>
    </div>
  );
}

function StatusBox({ tone, children }: { tone: "red" | "amber"; children: React.ReactNode }) {
  return (
    <div
      className={`mt-5 rounded-xl border p-4 text-sm font-bold ${
        tone === "red" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-900"
      }`}
    >
      {children}
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
      <p className="text-3xl font-black text-blue-950">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{label}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{detail}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-2xl font-black text-blue-950">{formatNumber(value)}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function Panel({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-red-700">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-black capitalize text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function scoreTone(score: number) {
  if (score >= 70) return "bg-emerald-100 text-emerald-900";
  if (score >= 40) return "bg-amber-100 text-amber-900";
  return "bg-red-100 text-red-900";
}
