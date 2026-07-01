"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { trackVisitorIntelligenceEvent } from "@/lib/visitor-intelligence-client";

type ReadinessStatus = "ready" | "partial" | "blocked";

type ReadinessFileCheck = {
  label: string;
  path: string;
  exists: boolean;
};

type ReadinessCheck = {
  id: string;
  title: string;
  category: string;
  status: ReadinessStatus;
  score: number;
  requiredBeforeSelling: boolean;
  summary: string;
  evidence: string[];
  gaps: string[];
  files: ReadinessFileCheck[];
  requiredTables: string[];
};

type TableCount = {
  table: string;
  status: "ok" | "error";
  count: number | null;
  error: string | null;
};

type Payload = {
  generatedAt: string;
  summary: {
    overallStatus: ReadinessStatus;
    score: number;
    readyCount: number;
    partialCount: number;
    blockedCount: number;
    requiredBlockedCount: number;
    totalChecks: number;
    publicProfiles: number;
    publicSources: number;
    averageProfileCompletionPercent: number;
    canSellNow: boolean;
    salesBlocker: string;
  };
  checks: ReadinessCheck[];
  tableCounts: TableCount[];
  publicLabels: string[];
  safetyRules: string[];
  manualActivationRequired: boolean;
  salesEnabled: boolean;
  nextPrompt: string;
};

const categoryLabels: Record<string, string> = {
  public_surface: "Public Surface",
  data_intake: "Data Intake",
  accounts: "Accounts",
  analytics: "Analytics",
  trust_safety: "Trust & Safety",
  seo_share: "SEO & Share",
  monetization: "Future Revenue",
};

function formatNumber(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString();
}

function statusClass(status: ReadinessStatus) {
  if (status === "ready") return "border-emerald-400/40 bg-emerald-400/10 text-emerald-100";
  if (status === "partial") return "border-amber-300/40 bg-amber-300/10 text-amber-100";
  return "border-red-400/40 bg-red-500/10 text-red-100";
}

function dotClass(status: ReadinessStatus) {
  if (status === "ready") return "bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.65)]";
  if (status === "partial") return "bg-amber-300 shadow-[0_0_20px_rgba(252,211,77,0.55)]";
  return "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]";
}

export default function MonetizationReadinessDashboard() {
  const { user, roles, loading } = useAuth();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const isAdmin = roles.includes("admin");

  useEffect(() => {
    trackVisitorIntelligenceEvent({
      eventType: "admin_open",
      path: "/admin/monetization-readiness",
      metadata: { dashboard: "monetization_readiness" },
    });
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    let mounted = true;

    async function loadReadiness() {
      setError("");
      const response = await fetch("/api/admin/monetization-readiness", { cache: "no-store" });
      const data = await response.json();

      if (!mounted) return;
      if (!response.ok) {
        setError(data.error ?? "Readiness request failed.");
        return;
      }

      setPayload(data as Payload);
    }

    loadReadiness().catch((loadError: Error) => {
      if (!mounted) return;
      setError(loadError.message);
    });

    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  const groupedChecks = useMemo(() => {
    const groups = new Map<string, ReadinessCheck[]>();
    for (const check of payload?.checks ?? []) {
      const existing = groups.get(check.category) ?? [];
      existing.push(check);
      groups.set(check.category, existing);
    }
    return Array.from(groups.entries());
  }, [payload?.checks]);

  const topBlockers = useMemo(() => {
    return (payload?.checks ?? [])
      .filter((check) => check.requiredBeforeSelling && check.status !== "ready")
      .sort((a, b) => a.score - b.score)
      .slice(0, 5);
  }, [payload?.checks]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-12">
        <div className="mx-auto h-72 max-w-7xl animate-pulse rounded-3xl border border-white/10 bg-white/10" />
      </div>
    );
  }

  if (!user) {
    return <AccessMessage title="Login required" body="Monetization readiness is admin-only." href="/auth/login" linkLabel="Log in" />;
  }

  if (!isAdmin) {
    return <AccessMessage title="Admin role required" body="This dashboard is blocked unless Supabase says your account has the admin role." href="/dashboard" linkLabel="Back to dashboard" />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#1e3a8a_0%,#0f172a_38%,#020617_100%)] text-white">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-white/15 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="h-1.5 bg-[linear-gradient(90deg,#b42318_0%,#d6b35a_38%,#ffffff_50%,#1d4ed8_100%)]" />
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-red-200">Admin command center</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">
                  Monetization readiness
                </h1>
                <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-200 sm:text-base">
                  RepWatchr should not sell until the public profiles, source intake, corrections, dashboards,
                  analytics, trust labels, sharing loops, and hidden revenue rails are ready.
                </p>
              </div>
              <StatusBadge status={payload?.summary.canSellNow ? "ready" : "blocked"} label={payload?.summary.canSellNow ? "Can sell" : "Sales off"} />
            </div>
            {payload ? (
              <p className="mt-3 text-xs font-bold text-slate-400">Last refreshed {new Date(payload.generatedAt).toLocaleString()}</p>
            ) : null}
          </div>
        </section>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-300/40 bg-red-500/10 p-4 text-sm font-bold text-red-100">
            {error}
          </div>
        ) : null}

        {!payload && !error ? (
          <div className="mt-5 h-64 animate-pulse rounded-3xl border border-white/10 bg-white/10" />
        ) : null}

        {payload ? (
          <>
            <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Readiness score" value={`${payload.summary.score}%`} detail={`${payload.summary.readyCount}/${payload.summary.totalChecks} checks ready`} />
              <Metric label="Required blockers" value={payload.summary.requiredBlockedCount} detail="Must be resolved before sales activation" />
              <Metric label="Public profiles" value={formatNumber(payload.summary.publicProfiles)} detail={`${formatNumber(payload.summary.publicSources)} public source URLs`} />
              <Metric label="Avg profile complete" value={`${payload.summary.averageProfileCompletionPercent}%`} detail="Static profile-completion model" />
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
              <div className="rounded-3xl border border-red-300/30 bg-red-500/10 p-5 shadow-xl shadow-red-950/20">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-red-200">Hard gate</p>
                <h2 className="mt-2 text-2xl font-black">Do not sell yet.</h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-red-50">
                  {payload.summary.salesBlocker}
                </p>
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-300">Next operator prompt</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white">{payload.nextPrompt}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 shadow-xl shadow-blue-950/20 backdrop-blur">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Top blockers</p>
                <div className="mt-3 grid gap-3">
                  {topBlockers.map((check) => (
                    <a
                      key={check.id}
                      href={`#${check.id}`}
                      className="rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:-translate-y-0.5 hover:border-amber-200/50 hover:bg-white/10"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-black">{check.title}</p>
                        <StatusBadge status={check.status} label={`${check.score}%`} />
                      </div>
                      <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{check.gaps[0] ?? check.summary}</p>
                    </a>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-2">
              {groupedChecks.map(([category, checks]) => (
                <div key={category} className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200">
                    {categoryLabels[category] ?? category}
                  </p>
                  <div className="mt-4 grid gap-3">
                    {checks.map((check) => (
                      <article id={check.id} key={check.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`h-2.5 w-2.5 rounded-full ${dotClass(check.status)}`} />
                              <h3 className="text-base font-black">{check.title}</h3>
                            </div>
                            <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{check.summary}</p>
                          </div>
                          <StatusBadge status={check.status} label={`${check.score}%`} />
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-wide text-emerald-200">Evidence</p>
                            <ul className="mt-2 space-y-1.5">
                              {check.evidence.slice(0, 4).map((item) => (
                                <li key={item} className="text-xs font-semibold leading-5 text-slate-300">{item}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-wide text-amber-200">Gaps</p>
                            <ul className="mt-2 space-y-1.5">
                              {(check.gaps.length ? check.gaps : ["No blocking gap recorded in this static check."]).slice(0, 4).map((item) => (
                                <li key={item} className="text-xs font-semibold leading-5 text-slate-300">{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {check.files.map((file) => (
                            <span
                              key={file.path}
                              className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                                file.exists ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-100" : "border-red-300/40 bg-red-500/10 text-red-100"
                              }`}
                            >
                              {file.exists ? "Found" : "Missing"}: {file.label}
                            </span>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200">Supabase table reachability</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {payload.tableCounts.map((table) => (
                    <div key={table.table} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-black">{table.table}</p>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${table.status === "ok" ? "bg-emerald-300/15 text-emerald-100" : "bg-red-500/15 text-red-100"}`}>
                          {table.status}
                        </span>
                      </div>
                      <p className="mt-1 text-lg font-black">{table.count ?? "Missing"}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Required public labels</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {payload.publicLabels.map((label) => (
                      <span key={label} className="rounded-full border border-amber-200/30 bg-amber-200/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-50">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-red-200">Safety rules</p>
                  <ul className="mt-3 space-y-2">
                    {payload.safetyRules.slice(0, 8).map((rule) => (
                      <li key={rule} className="text-xs font-semibold leading-5 text-slate-300">{rule}</li>
                    ))}
                  </ul>
                </div>
              </div>
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

function Metric({ label, value, detail }: { label: string; value: number | string; detail: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 shadow-xl shadow-blue-950/20 backdrop-blur">
      <p className="text-3xl font-black">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-200">{label}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{detail}</p>
    </div>
  );
}

function StatusBadge({ status, label }: { status: ReadinessStatus; label: string }) {
  return (
    <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${statusClass(status)}`}>
      {label}
    </span>
  );
}
