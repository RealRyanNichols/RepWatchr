"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { PricingAdminData, BetaAccessRequestRow, PricingExperimentRow } from "@/lib/pricing-beta";
import { BETA_ACCESS_STATUSES, PACKAGE_CANDIDATES, PRICING_EXPERIMENT_STATUSES, statusLabel } from "@/lib/pricing-beta";
import { CORE_FEATURE_FLAGS } from "@/lib/feature-flags";
import { trackRepWatchrEvent } from "@/lib/client-analytics";

type AdminPricingClientProps = {
  initialData: PricingAdminData;
};

async function postPricingAction(payload: Record<string, unknown>) {
  const response = await fetch("/api/admin/pricing", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) throw new Error(data?.error || "Pricing action failed.");
  return data;
}

export default function AdminPricingClient({ initialData }: AdminPricingClientProps) {
  const [data, setData] = useState(initialData);
  const [statusFilter, setStatusFilter] = useState("all");
  const [packageFilter, setPackageFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    trackRepWatchrEvent("pricing_experiment_viewed", { source: "admin_pricing", beta_requests: data.betaRequests.length });
  }, [data.betaRequests.length]);

  const filteredBetaRequests = useMemo(
    () =>
      data.betaRequests.filter((request) => {
        const statusMatch = statusFilter === "all" || request.status === statusFilter;
        const packageMatch = packageFilter === "all" || request.package_key === packageFilter;
        return statusMatch && packageMatch;
      }),
    [data.betaRequests, packageFilter, statusFilter],
  );

  async function refresh() {
    const response = await fetch("/api/admin/pricing", { cache: "no-store" });
    const next = await response.json().catch(() => null);
    if (next?.ok) setData(next.data);
  }

  async function runAction(payload: Record<string, unknown>, success: string) {
    setNotice("");
    setError("");
    try {
      await postPricingAction(payload);
      setNotice(success);
      await refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Pricing action failed.");
    }
  }

  async function toggleFlag(flagKey: string, enabled: boolean, description: string, rolloutPercentage: number) {
    await runAction(
      {
        action: "upsert_feature_flag",
        flagKey,
        enabled,
        rolloutPercentage: enabled ? rolloutPercentage || 100 : 0,
        description,
      },
      "Feature flag updated.",
    );
  }

  async function createExperiment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const packageKey = String(form.get("packageKey") || "");
    const candidate = PACKAGE_CANDIDATES.find((item) => item.key === packageKey);
    await runAction(
      {
        action: "create_experiment",
        packageKey,
        experimentKey: form.get("experimentKey"),
        name: form.get("name"),
        hypothesis: form.get("hypothesis"),
        variants: candidate ? [...candidate.variants] : [],
      },
      "Pricing experiment created as draft.",
    );
    event.currentTarget.reset();
  }

  async function updateExperimentStatus(experiment: PricingExperimentRow, status: string) {
    await runAction(
      { action: "update_experiment_status", experimentId: experiment.id, status },
      "Experiment status updated.",
    );
  }

  async function updateBetaStatus(request: BetaAccessRequestRow, status: string) {
    await runAction(
      { action: "update_beta_status", betaRequestId: request.id, status },
      "Beta request status updated.",
    );
  }

  async function inviteBetaUser(request: BetaAccessRequestRow) {
    await runAction(
      { action: "invite_beta_user", betaRequestId: request.id },
      "Beta invite code created.",
    );
    trackRepWatchrEvent("beta_invite_sent", { package_key: request.package_key });
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Beta requests" value={data.stats.totalBeta} />
        <Metric label="New requests" value={data.stats.newBeta} />
        <Metric label="Invited" value={data.stats.invitedBeta} />
        <Metric label="Active tests" value={data.stats.activeExperiments} />
        <Metric label="Events" value={data.stats.totalEvents} />
      </section>

      {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-950">{notice}</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-950">{error}</div> : null}
      {data.errors.length ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-950">
          Pricing data warnings: {data.errors.join(" / ")}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Feature flags</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">Hidden infrastructure switches</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          Defaults stay off. Public checkout requires `ENABLE_PAYMENTS=true` and Stripe server configuration.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {CORE_FEATURE_FLAGS.map((flagKey) => {
            const flag = data.flags.find((item) => item.key === flagKey);
            const enabled = Boolean(flag?.enabled);
            const rollout = Number(flag?.rollout_percentage ?? 0);
            return (
              <div key={flagKey} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-950">{flagKey}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                  {enabled ? "enabled" : "disabled"} / rollout {rollout}% / {flag?.source ?? "default"}
                </p>
                <p className="mt-2 min-h-10 text-xs font-semibold leading-5 text-slate-600">{flag?.description || "No description yet."}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className={enabled ? "secondary-button" : "primary-button"}
                    onClick={() => toggleFlag(flagKey, !enabled, flag?.description ?? "", enabled ? 0 : 100)}
                  >
                    {enabled ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => toggleFlag(flagKey, enabled, flag?.description ?? "", rollout === 100 ? 10 : 100)}
                  >
                    {rollout === 100 ? "Set 10%" : "Set 100%"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Package demand</p>
          <div className="mt-4 grid gap-2">
            {data.demandByPackage.map((item) => (
              <div key={item.packageKey} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div>
                  <p className="text-sm font-black text-slate-950">{item.packageName}</p>
                  <p className="text-xs font-bold text-slate-500">{item.packageKey}</p>
                </div>
                <p className="text-2xl font-black text-blue-950">{item.count}</p>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={createExperiment} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Create experiment</p>
          <div className="mt-4 grid gap-3">
            <select name="packageKey" required className="field">
              <option value="">Choose package</option>
              {PACKAGE_CANDIDATES.map((candidate) => (
                <option key={candidate.key} value={candidate.key}>
                  {candidate.name} / {candidate.expectedRange}
                </option>
              ))}
            </select>
            <input name="name" required className="field" placeholder="Experiment name" />
            <input name="experimentKey" className="field" placeholder="Optional key, auto-generated if blank" />
            <textarea name="hypothesis" rows={3} className="field" placeholder="Hypothesis: what messaging or price sensitivity are we testing?" />
            <button type="submit" className="primary-button">Create draft experiment</button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Pricing experiments</p>
        <div className="mt-4 grid gap-3">
          {data.experiments.length ? data.experiments.map((experiment) => (
            <article key={experiment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    {experiment.package_key} / {statusLabel(experiment.status)}
                  </p>
                  <h3 className="mt-1 text-xl font-black text-slate-950">{experiment.name}</h3>
                  {experiment.hypothesis ? <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{experiment.hypothesis}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(experiment.variants ?? []).map((variant) => (
                      <span key={String(variant.key)} className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-black text-blue-950">
                        {String(variant.label ?? variant.key)}
                      </span>
                    ))}
                  </div>
                </div>
                <select
                  value={experiment.status}
                  onChange={(event) => updateExperimentStatus(experiment, event.target.value)}
                  className="field max-w-xs"
                >
                  {PRICING_EXPERIMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>{statusLabel(status)}</option>
                  ))}
                </select>
              </div>
            </article>
          )) : (
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600">
              No pricing experiments yet. Create a draft, then enable it only when the copy and target package are ready.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Beta access requests</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Demand before charging</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={packageFilter} onChange={(event) => setPackageFilter(event.target.value)} className="field max-w-xs">
              <option value="all">All packages</option>
              {PACKAGE_CANDIDATES.map((candidate) => (
                <option key={candidate.key} value={candidate.key}>{candidate.name}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="field max-w-xs">
              <option value="all">All statuses</option>
              {BETA_ACCESS_STATUSES.map((status) => (
                <option key={status} value={status}>{statusLabel(status)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {filteredBetaRequests.length ? filteredBetaRequests.map((request) => (
            <article key={request.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    {statusLabel(request.status)} / {request.package_key}
                  </p>
                  <h3 className="mt-1 text-xl font-black text-slate-950">{request.name || request.email}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{request.email}</p>
                  {request.jurisdiction ? <p className="mt-2 text-sm font-bold text-slate-700">Jurisdiction: {request.jurisdiction}</p> : null}
                  {request.organization_type ? <p className="mt-1 text-sm font-bold text-slate-700">Organization: {request.organization_type}</p> : null}
                  {request.urgency ? <p className="mt-1 text-sm font-bold text-slate-700">Urgency: {request.urgency}</p> : null}
                  {request.use_case ? <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{request.use_case}</p> : null}
                  {request.invite_code ? (
                    <p className="mt-3 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-black text-emerald-950">
                      Invite code: {request.invite_code}
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs font-bold text-slate-500">Created {new Date(request.created_at).toLocaleString()}</p>
                </div>
                <div className="grid content-start gap-2">
                  <select value={request.status} onChange={(event) => updateBetaStatus(request, event.target.value)} className="field">
                    {BETA_ACCESS_STATUSES.map((status) => (
                      <option key={status} value={status}>{statusLabel(status)}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => inviteBetaUser(request)} className="secondary-button">
                    Create invite code
                  </button>
                </div>
              </div>
            </article>
          )) : (
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600">
              No beta requests match the current filters.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}
