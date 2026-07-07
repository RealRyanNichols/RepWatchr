"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { QualityAdminData, QualityCheck, QualityStatus } from "@/lib/qa-monitoring";
import { trackRepWatchrEvent } from "@/lib/client-analytics";

function statusClasses(status: QualityStatus) {
  if (status === "pass") return "border-emerald-200 bg-emerald-50 text-emerald-950";
  if (status === "warn") return "border-amber-200 bg-amber-50 text-amber-950";
  if (status === "fail") return "border-red-200 bg-red-50 text-red-950";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function StatusPill({ status }: { status: QualityStatus | string }) {
  const normalized = ["pass", "warn", "fail", "not_verified"].includes(status)
    ? (status as QualityStatus)
    : "not_verified";
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${statusClasses(normalized)}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number | string; tone?: QualityStatus }) {
  return (
    <div className={`rounded-lg border p-4 shadow-sm ${statusClasses(tone ?? "not_verified")}`}>
      <p className="text-xs font-black uppercase tracking-[0.16em] opacity-75">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function CheckList({ checks }: { checks: QualityCheck[] }) {
  return (
    <div className="grid gap-3">
      {checks.map((check) => (
        <div key={check.key} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-black text-slate-950">{check.label}</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{check.detail}</p>
              {check.recommendation ? (
                <p className="mt-2 text-xs font-bold uppercase tracking-wide text-blue-800">{check.recommendation}</p>
              ) : null}
            </div>
            <StatusPill status={check.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminQualityDashboardClient({ initialData }: { initialData: QualityAdminData }) {
  const [data, setData] = useState(initialData);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const routeGaps = useMemo(() => data.routeTargets.filter((route) => route.expected === "gap"), [data.routeTargets]);
  const failingEnv = useMemo(() => data.envChecks.filter((check) => check.status === "fail"), [data.envChecks]);

  useEffect(() => {
    trackRepWatchrEvent("quality_dashboard_open", {
      route_gaps: routeGaps.length,
      env_failures: failingEnv.length,
    });
    if (failingEnv.length) {
      trackRepWatchrEvent("env_validation_failed", {
        failure_count: failingEnv.length,
      });
    }
  }, [failingEnv.length, routeGaps.length]);

  async function refresh() {
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const response = await fetch("/api/admin/quality", { headers: { accept: "application/json" } });
      const body = (await response.json().catch(() => null)) as { ok?: boolean; data?: QualityAdminData; error?: string } | null;
      if (!response.ok || !body?.ok || !body.data) throw new Error(body?.error || "Quality dashboard refresh failed.");
      setData(body.data);
      setNotice("Quality dashboard refreshed.");
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Quality dashboard refresh failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-slate-200 bg-slate-950 text-white shadow-sm">
        <div className="h-1.5 bg-[linear-gradient(90deg,#b42318_0%,#b42318_34%,#d6b35a_34%,#d6b35a_58%,#1d4ed8_58%,#1d4ed8_100%)]" />
        <div className="p-5 sm:p-7">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">Continuous quality</p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black leading-tight sm:text-5xl">QA, Monitoring, and Route Smoke</h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
                Generated {new Date(data.generatedAt).toLocaleString()}. Use this desk before launch, before deploy, and after any major buildout pass.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="secondary-button" onClick={refresh} disabled={busy}>
                {busy ? "Refreshing..." : "Refresh"}
              </button>
              <Link href="/admin" className="secondary-button">Main Admin</Link>
              <Link href="/admin/control-center" className="secondary-button">Control Center</Link>
            </div>
          </div>
        </div>
      </section>

      {notice ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-950">{notice}</div> : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-950">{error}</div> : null}
      {data.errors.length ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">
          Data warnings: {data.errors.slice(0, 5).join(" / ")}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard label="Env pass" value={data.summary.envPass} tone="pass" />
        <SummaryCard label="Env warn" value={data.summary.envWarn} tone={data.summary.envWarn ? "warn" : "pass"} />
        <SummaryCard label="Env fail" value={data.summary.envFail} tone={data.summary.envFail ? "fail" : "pass"} />
        <SummaryCard label="Routes checked" value={data.summary.routeTargets} />
        <SummaryCard label="Route gaps" value={data.summary.routeGaps} tone={data.summary.routeGaps ? "warn" : "pass"} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-red-700">Environment</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Credential and feature readiness</h2>
            </div>
            <Link href="/admin/pricing" className="text-sm font-black text-blue-700 hover:text-red-700">Feature flags</Link>
          </div>
          <div className="mt-4">
            <CheckList checks={data.envChecks} />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-red-700">Deploy commands</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Preflight stack</h2>
          <div className="mt-4 grid gap-3 text-sm font-semibold leading-6 text-slate-700">
            <code className="rounded-lg border border-slate-200 bg-slate-50 p-3">npm run qa:static</code>
            <code className="rounded-lg border border-slate-200 bg-slate-50 p-3">npm run qa:routes</code>
            <code className="rounded-lg border border-slate-200 bg-slate-50 p-3">npm run lint</code>
            <code className="rounded-lg border border-slate-200 bg-slate-50 p-3">npm run build</code>
          </div>
          <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
            Run the route smoke test against a running local or deployed URL with `REPWATCHR_SMOKE_BASE_URL`.
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-red-700">Routes</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Smoke inventory and known gaps</h2>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              trackRepWatchrEvent("smoke_tests_run", { source: "admin_quality_dashboard", mode: "manual_command_prompt" });
              setNotice("Run npm run qa:routes from the terminal against a running server.");
            }}
          >
            Log Smoke Intent
          </button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Route</th>
                <th className="p-3">Type</th>
                <th className="p-3">Expected</th>
                <th className="p-3">Index</th>
                <th className="p-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.routeTargets.map((route) => (
                <tr key={`${route.type}:${route.path}`}>
                  <td className="p-3 font-black text-slate-950">{route.path}</td>
                  <td className="p-3 font-semibold text-slate-600">{route.type}</td>
                  <td className="p-3"><StatusPill status={route.expected === "gap" ? "warn" : "pass"} /></td>
                  <td className="p-3 font-semibold text-slate-600">{route.shouldIndex ? "index" : "noindex / utility"}</td>
                  <td className="max-w-xl p-3 font-semibold leading-6 text-slate-600">{route.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-red-700">Feature flags</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Disabled-by-default systems</h2>
          <div className="mt-4 grid gap-3">
            {data.featureFlags.map((flag) => (
              <div key={flag.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-950">{flag.key}</p>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${flag.enabled ? "bg-emerald-100 text-emerald-950" : "bg-slate-200 text-slate-700"}`}>
                    {flag.enabled ? "enabled" : "off"}
                  </span>
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-500">source: {flag.source} / rollout {flag.rollout_percentage}%</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-red-700">Errors</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Recent sanitized app errors</h2>
          <div className="mt-4 grid gap-3">
            {data.recentErrors.length ? (
              data.recentErrors.slice(0, 12).map((row) => (
                <div key={row.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-950">{row.error_type || "Error"}</p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{row.message}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                        {row.route || "no route"} / {new Date(row.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-red-950">
                      {row.severity}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600">
                No stored app errors loaded. If Supabase service-role access is missing or the SQL has not been applied, the dashboard will show that as a data warning.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
