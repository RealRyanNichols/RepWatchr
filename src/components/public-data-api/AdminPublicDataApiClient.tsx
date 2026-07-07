"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { ApiAccessRequestRow, ApiKeyRow, PublicDataApiAdminData } from "@/lib/public-data-api";
import { API_ACCESS_STATUSES, PUBLIC_API_SCOPES, DATA_EXPORT_TYPES } from "@/lib/public-data-api-config";
import { trackRepWatchrEvent } from "@/lib/client-analytics";

type AdminPublicDataApiClientProps = {
  initialData: PublicDataApiAdminData;
};

async function postApiAdminAction(payload: Record<string, unknown>) {
  const response = await fetch("/api/admin/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) throw new Error(data?.error || "API admin action failed.");
  return data;
}

function statusLabel(value: string) {
  return value.replaceAll("_", " ");
}

export default function AdminPublicDataApiClient({ initialData }: AdminPublicDataApiClientProps) {
  const [data, setData] = useState(initialData);
  const [statusFilter, setStatusFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [plaintextKey, setPlaintextKey] = useState("");

  useEffect(() => {
    trackRepWatchrEvent("api_access_page_open", { source: "admin_api", enabled: data.enabled });
  }, [data.enabled]);

  const filteredRequests = useMemo(
    () => data.accessRequests.filter((request) => statusFilter === "all" || request.status === statusFilter),
    [data.accessRequests, statusFilter],
  );

  async function refresh() {
    const response = await fetch("/api/admin/api", { cache: "no-store" });
    const next = await response.json().catch(() => null);
    if (next?.ok) setData(next.data);
  }

  async function runAction(payload: Record<string, unknown>, success: string) {
    setNotice("");
    setError("");
    try {
      const result = await postApiAdminAction(payload);
      setNotice(success);
      if (result.plaintextKey) setPlaintextKey(result.plaintextKey);
      await refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "API admin action failed.");
    }
  }

  async function updateRequestStatus(request: ApiAccessRequestRow, status: string) {
    await runAction(
      { action: "update_access_request_status", requestId: request.id, status },
      "API access request status updated.",
    );
  }

  async function revokeKey(key: ApiKeyRow) {
    await runAction({ action: "revoke_api_key", apiKeyId: key.id }, "API key revoked.");
    trackRepWatchrEvent("api_key_revoked", { key_prefix: key.key_prefix });
  }

  async function createKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const scopes = form.getAll("scopes").map(String);
    await runAction(
      {
        action: "create_api_key",
        organizationName: form.get("organizationName"),
        label: form.get("label"),
        scopes,
        rateLimitPerDay: form.get("rateLimitPerDay"),
      },
      "API key created. Copy the one-time key now.",
    );
    trackRepWatchrEvent("api_key_created", { scopes: scopes.join(",") });
    event.currentTarget.reset();
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Access requests" value={data.stats.accessRequests} />
        <Metric label="New requests" value={data.stats.newRequests} />
        <Metric label="Active keys" value={data.stats.activeKeys} />
        <Metric label="Usage events" value={data.stats.usageEvents} />
        <Metric label="Pending exports" value={data.stats.pendingExports} />
      </section>

      {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-950">{notice}</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-950">{error}</div> : null}
      {data.errors.length ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-950">
          API data warnings: {data.errors.join(" / ")}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Launch gate</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">Public API is {data.enabled ? "enabled" : "disabled"}</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          Keep this disabled until the public data adapters, scopes, billing model, and export policy are reviewed. Key issuance is blocked while disabled.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Access requests</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Data product demand</h2>
            </div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="field max-w-xs">
              <option value="all">All statuses</option>
              {API_ACCESS_STATUSES.map((status) => (
                <option key={status} value={status}>{statusLabel(status)}</option>
              ))}
            </select>
          </div>
          <div className="mt-4 grid gap-3">
            {filteredRequests.length ? filteredRequests.map((request) => (
              <article key={request.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                      {statusLabel(request.status)} / {request.requested_scope || "scope not supplied"}
                    </p>
                    <h3 className="mt-1 text-lg font-black text-slate-950">{request.organization || request.name || request.email}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{request.email}</p>
                    {request.jurisdiction_focus ? <p className="mt-2 text-sm font-bold text-blue-950">{request.jurisdiction_focus}</p> : null}
                    {request.use_case ? <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{request.use_case}</p> : null}
                  </div>
                  <select
                    value={request.status}
                    onChange={(event) => updateRequestStatus(request, event.target.value)}
                    className="field max-w-xs"
                  >
                    {API_ACCESS_STATUSES.map((status) => (
                      <option key={status} value={status}>{statusLabel(status)}</option>
                    ))}
                  </select>
                </div>
              </article>
            )) : (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600">
                No API access requests match this filter yet.
              </p>
            )}
          </div>
        </div>

        <form onSubmit={createKey} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">API keys</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Create key</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Keys are one-time visible. Hashes only are stored. Creation is blocked until the public API feature flag is enabled.
          </p>
          {plaintextKey ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-black uppercase tracking-wide text-amber-900">Copy once</p>
              <code className="mt-2 block break-all rounded-lg bg-white p-3 text-sm font-black text-slate-950">{plaintextKey}</code>
            </div>
          ) : null}
          <div className="mt-4 grid gap-3">
            <input name="organizationName" className="field" placeholder="Organization name" disabled={!data.enabled} />
            <input name="label" className="field" placeholder="Key label" disabled={!data.enabled} />
            <input name="rateLimitPerDay" type="number" min="1" max="100000" className="field" placeholder="Daily rate limit" defaultValue="1000" disabled={!data.enabled} />
            <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              {PUBLIC_API_SCOPES.filter((scope) => scope !== "admin_internal").map((scope) => (
                <label key={scope} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <input name="scopes" type="checkbox" value={scope} disabled={!data.enabled} />
                  {statusLabel(scope)}
                </label>
              ))}
            </div>
            <button type="submit" disabled={!data.enabled} className="primary-button disabled:cursor-not-allowed disabled:opacity-50">
              Create API key
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Active and revoked keys</p>
        <div className="mt-4 grid gap-3">
          {data.apiKeys.length ? data.apiKeys.map((key) => (
            <article key={key.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    {statusLabel(key.status)} / prefix {key.key_prefix} / limit {key.rate_limit_per_day}/day
                  </p>
                  <h3 className="mt-1 text-lg font-black text-slate-950">{key.organization_name || key.label || key.id}</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(key.scopes ?? []).map((scope) => (
                      <span key={scope} className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-black text-blue-950">
                        {statusLabel(scope)}
                      </span>
                    ))}
                  </div>
                </div>
                {key.status === "active" ? (
                  <button type="button" className="secondary-button" onClick={() => revokeKey(key)}>Revoke</button>
                ) : null}
              </div>
            </article>
          )) : (
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600">
              No API keys yet.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Endpoint scopes</p>
          <div className="mt-4 grid gap-2">
            {data.endpoints.map((endpoint) => (
              <div key={endpoint.path} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-black text-slate-950">{endpoint.path}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-blue-950">{statusLabel(endpoint.scope)}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{endpoint.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Export queue</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {DATA_EXPORT_TYPES.map((type) => (
              <span key={type} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
                {statusLabel(type)}
              </span>
            ))}
          </div>
          <div className="mt-4 grid gap-2">
            {data.dataExports.length ? data.dataExports.slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-black text-slate-950">{statusLabel(item.export_type)}</p>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {statusLabel(item.status)} / rows {item.row_count ?? 0}
                </p>
              </div>
            )) : (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600">
                No export jobs yet. Export delivery stays disabled until the data policy and file expiry rules are finalized.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Recent usage</p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="border-b border-slate-200 p-2">Endpoint</th>
                <th className="border-b border-slate-200 p-2">Method</th>
                <th className="border-b border-slate-200 p-2">Status</th>
                <th className="border-b border-slate-200 p-2">Records</th>
                <th className="border-b border-slate-200 p-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {data.usageEvents.slice(0, 30).map((event) => (
                <tr key={event.id} className="font-semibold text-slate-700">
                  <td className="border-b border-slate-100 p-2">{event.endpoint}</td>
                  <td className="border-b border-slate-100 p-2">{event.method}</td>
                  <td className="border-b border-slate-100 p-2">{event.status_code ?? "-"}</td>
                  <td className="border-b border-slate-100 p-2">{event.records_returned}</td>
                  <td className="border-b border-slate-100 p-2">{new Date(event.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {!data.usageEvents.length ? (
                <tr>
                  <td colSpan={5} className="p-4 text-sm font-bold text-slate-600">No API usage events yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-blue-950">{value}</p>
    </div>
  );
}
