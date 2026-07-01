"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

type FeatureFlagRow = {
  id: string;
  key: string;
  description: string | null;
  enabled: boolean;
  rollout_percentage: number;
  updated_at: string;
};

type ExperimentRow = {
  id: string;
  key: string;
  package_key: string;
  name: string;
  status: string;
  hypothesis: string | null;
  variants: Array<{ key: string; label: string; price_cents?: number }>;
  start_at: string | null;
  end_at: string | null;
  updated_at: string;
};

type BetaRequestRow = {
  id: string;
  email: string;
  name: string | null;
  package_key: string;
  use_case: string | null;
  jurisdiction: string | null;
  organization_type: string | null;
  urgency: string | null;
  status: string;
  invite_code: string | null;
  invited_at: string | null;
  created_at: string;
};

type PricingEventRow = {
  id: string;
  event_name: string;
  variant_key: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type Payload = {
  generatedAt: string;
  environmentFlags: Record<string, { enabled: boolean; envConfigured: boolean }>;
  featureFlags: FeatureFlagRow[];
  experiments: ExperimentRow[];
  betaRequests: BetaRequestRow[];
  pricingEvents: PricingEventRow[];
  demandByPackage: Record<string, { total: number; newCount: number; invited: number; active: number }>;
  tableCounts: Array<{ table: string; status: "ok" | "error"; count: number | null; error: string | null }>;
  errors: string[];
};

function formatDate(value: string | null | undefined) {
  if (!value) return "Not set";
  return new Date(value).toLocaleString();
}

function statusTone(status: string) {
  if (["active", "enabled", "invited"].includes(status)) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (["new", "reviewed", "draft", "waitlist"].includes(status)) return "border-blue-200 bg-blue-50 text-blue-900";
  if (["paused", "not_fit"].includes(status)) return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function StatusPill({ children }: { children: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${statusTone(children)}`}>
      {children.replace(/_/g, " ")}
    </span>
  );
}

function Metric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-3xl font-black text-blue-950">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{detail}</p>
    </div>
  );
}

export default function PricingExperimentsDashboard() {
  const { user, roles, loading } = useAuth();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState("");
  const isAdmin = roles.includes("admin");

  async function loadPricing() {
    setError("");
    const response = await fetch("/api/admin/pricing", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Pricing dashboard request failed.");
      return;
    }
    setPayload(data as Payload);
  }

  useEffect(() => {
    if (!isAdmin) return;
    loadPricing().catch((loadError: Error) => setError(loadError.message));
  }, [isAdmin]);

  async function runAction(body: Record<string, unknown>) {
    setUpdating(JSON.stringify(body));
    setError("");
    try {
      const response = await fetch("/api/admin/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Pricing action failed.");
      await loadPricing();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Pricing action failed.");
    } finally {
      setUpdating("");
    }
  }

  const summary = useMemo(() => {
    const requests = payload?.betaRequests ?? [];
    const events = payload?.pricingEvents ?? [];
    return {
      totalRequests: requests.length,
      newRequests: requests.filter((request) => request.status === "new").length,
      invited: requests.filter((request) => request.status === "invited").length,
      activeExperiments: (payload?.experiments ?? []).filter((experiment) => experiment.status === "active").length,
      ctaClicks: events.filter((event) => event.event_name === "pricing_cta_clicked").length,
      betaEvents: events.filter((event) => event.event_name === "beta_access_requested").length,
    };
  }, [payload]);

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-10"><div className="h-72 animate-pulse rounded-3xl bg-slate-100" /></div>;
  }

  if (!user) {
    return <AccessCard title="Login required" body="Pricing experiments are admin-only." href="/auth/login" label="Log in" />;
  }

  if (!isAdmin) {
    return <AccessCard title="Admin role required" body="This desk is blocked unless Supabase says your account has the admin role." href="/dashboard" label="Back to dashboard" />;
  }

  return (
    <div className="rw-page-shell">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-xl shadow-blue-950/20">
          <div className="h-1.5 bg-[linear-gradient(90deg,#b42318_0%,#b42318_33%,#ffffff_33%,#ffffff_66%,#1d4ed8_66%,#1d4ed8_100%)]" />
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_22rem] lg:p-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">Admin pricing desk</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Test demand before checkout opens.</h1>
              <p className="mt-4 max-w-4xl text-sm font-semibold leading-6 text-slate-200 sm:text-base">
                Pricing experiments, feature flags, and beta access requests. Public checkout remains off unless
                `ENABLE_PAYMENTS=true` and payment links are explicitly configured.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Payments flag</p>
              <p className="mt-3 text-4xl font-black">
                {payload?.environmentFlags.ENABLE_PAYMENTS?.enabled ? "ON" : "OFF"}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-300">
                Env configured: {payload?.environmentFlags.ENABLE_PAYMENTS?.envConfigured ? "yes" : "no"}
              </p>
            </div>
          </div>
        </section>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
            {error}
          </div>
        ) : null}

        {!payload && !error ? (
          <div className="mt-6 h-64 animate-pulse rounded-3xl bg-white" />
        ) : null}

        {payload ? (
          <>
            {payload.errors.length ? (
              <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
                <p className="text-xs font-black uppercase tracking-wide">Schema notes</p>
                <div className="mt-2 grid gap-1">
                  {payload.errors.slice(0, 8).map((item) => (
                    <p key={item} className="text-sm font-semibold leading-6">{item}</p>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <Metric label="Beta requests" value={summary.totalRequests} detail="Last 200 loaded" />
              <Metric label="New requests" value={summary.newRequests} detail="Need review" />
              <Metric label="Invited" value={summary.invited} detail="Manual invite status" />
              <Metric label="Active experiments" value={summary.activeExperiments} detail="DB status only" />
              <Metric label="Pricing CTA clicks" value={summary.ctaClicks} detail="Pricing event rows" />
              <Metric label="Beta events" value={summary.betaEvents} detail="Request event rows" />
            </section>

            <section className="mt-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-red-700">Feature flags</p>
                    <h2 className="mt-1 text-xl font-black text-slate-950">Default off unless explicitly enabled.</h2>
                  </div>
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Env wins over DB
                  </span>
                </div>
                <div className="mt-4 grid gap-3">
                  {payload.featureFlags.map((flag) => (
                    <div key={flag.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-950">{flag.key}</p>
                          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{flag.description}</p>
                          <p className="mt-1 text-xs font-bold text-slate-500">Rollout {flag.rollout_percentage}%</p>
                        </div>
                        <StatusPill>{flag.enabled ? "enabled" : "disabled"}</StatusPill>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={Boolean(updating)}
                          onClick={() => runAction({ action: "update_feature_flag", id: flag.id, enabled: !flag.enabled })}
                          className="rounded-xl bg-blue-950 px-3 py-2 text-xs font-black uppercase tracking-wide text-white hover:bg-red-700 disabled:bg-slate-300"
                        >
                          {flag.enabled ? "Disable" : "Enable"}
                        </button>
                        {[0, 10, 25, 50, 100].map((rollout) => (
                          <button
                            key={rollout}
                            type="button"
                            disabled={Boolean(updating)}
                            onClick={() => runAction({ action: "update_feature_flag", id: flag.id, rolloutPercentage: rollout })}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:border-red-300 hover:text-red-700 disabled:text-slate-300"
                          >
                            {rollout}%
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-wide text-red-700">Pricing experiments</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">Draft, activate, pause, or archive package tests.</h2>
                <div className="mt-4 grid gap-3">
                  {payload.experiments.map((experiment) => (
                    <div key={experiment.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-950">{experiment.name}</p>
                          <p className="mt-1 text-xs font-black uppercase tracking-wide text-blue-900">{experiment.package_key}</p>
                          <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{experiment.hypothesis}</p>
                        </div>
                        <StatusPill>{experiment.status}</StatusPill>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(experiment.variants ?? []).map((variant) => (
                          <span key={variant.key} className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-900">
                            {variant.label || variant.key}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {["draft", "active", "paused", "completed", "archived"].map((status) => (
                          <button
                            key={status}
                            type="button"
                            disabled={Boolean(updating) || experiment.status === status}
                            onClick={() => runAction({ action: "update_experiment_status", id: experiment.id, status })}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-700 hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:text-slate-300"
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-red-700">Beta access requests</p>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs font-black uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-3">Requester</th>
                      <th className="px-3 py-3">Package</th>
                      <th className="px-3 py-3">Jurisdiction</th>
                      <th className="px-3 py-3">Use case</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {payload.betaRequests.map((request) => (
                      <tr key={request.id} className="align-top">
                        <td className="px-3 py-4">
                          <p className="font-black text-slate-950">{request.name || "Unnamed"}</p>
                          <p className="text-xs font-semibold text-slate-500">{request.email}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">{formatDate(request.created_at)}</p>
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-black text-blue-950">{request.package_key}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">{request.organization_type} / {request.urgency}</p>
                        </td>
                        <td className="px-3 py-4 font-semibold text-slate-700">{request.jurisdiction || "Not supplied"}</td>
                        <td className="max-w-md px-3 py-4 text-xs font-semibold leading-5 text-slate-700">{request.use_case}</td>
                        <td className="px-3 py-4"><StatusPill>{request.status}</StatusPill></td>
                        <td className="px-3 py-4">
                          <div className="flex min-w-48 flex-wrap gap-2">
                            {["reviewed", "waitlist", "not_fit", "archived"].map((status) => (
                              <button
                                key={status}
                                type="button"
                                disabled={Boolean(updating) || request.status === status}
                                onClick={() => runAction({ action: "update_beta_status", id: request.id, status })}
                                className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-[11px] font-black uppercase text-slate-700 hover:border-red-300 hover:text-red-700 disabled:text-slate-300"
                              >
                                {status.replace(/_/g, " ")}
                              </button>
                            ))}
                            <button
                              type="button"
                              disabled={Boolean(updating)}
                              onClick={() => runAction({ action: "invite_beta_user", id: request.id })}
                              className="rounded-lg bg-blue-950 px-2.5 py-2 text-[11px] font-black uppercase text-white hover:bg-red-700 disabled:bg-slate-300"
                            >
                              Invite
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!payload.betaRequests.length ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-10 text-center text-sm font-bold text-slate-500">
                          No beta access requests yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}

function AccessCard({ title, body, href, label }: { title: string; body: string; href: string; label: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-blue-950">{title}</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{body}</p>
        <Link href={href} className="mt-5 inline-flex rounded-xl bg-blue-950 px-4 py-2 text-sm font-black text-white hover:bg-red-700">
          {label}
        </Link>
      </div>
    </div>
  );
}
