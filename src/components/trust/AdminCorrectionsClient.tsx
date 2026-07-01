"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import CorrectionStatusBadge from "@/components/trust/CorrectionStatusBadge";
import { CORRECTION_STATUSES } from "@/lib/trust-safety";
import { trackVisitorIntelligenceEvent } from "@/lib/visitor-intelligence-client";

type CorrectionRow = {
  id: string;
  submitter_email: string | null;
  entity_type: string;
  entity_id: string;
  url: string | null;
  correction_type: string;
  requested_correction: string;
  source_url: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

type CorrectionDetail = CorrectionRow & {
  anonymous_id?: string | null;
  user_id?: string | null;
  submitter_name?: string | null;
  current_text?: string | null;
  explanation?: string | null;
  admin_resolution?: string | null;
  attribution?: Record<string, unknown>;
  events?: Array<{ id: string; event_type: string; actor_user_id: string | null; metadata: Record<string, unknown>; created_at: string }>;
};

type Payload = {
  generatedAt: string;
  corrections: CorrectionRow[];
  counts: {
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  };
};

export default function AdminCorrectionsClient() {
  const { user, roles, loading } = useAuth();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<CorrectionDetail | null>(null);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [type, setType] = useState("");
  const [resolution, setResolution] = useState("");
  const [nextStatus, setNextStatus] = useState("needs_review");
  const [error, setError] = useState("");
  const isAdmin = roles.includes("admin");

  useEffect(() => {
    trackVisitorIntelligenceEvent({
      eventType: "admin_module_open",
      path: "/admin/corrections",
      metadata: { dashboard: "corrections" },
    });
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    void loadCorrections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, status, priority, type]);

  async function loadCorrections() {
    setError("");
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (type) params.set("type", type);
    const response = await fetch(`/api/admin/corrections?${params.toString()}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to load corrections.");
      return;
    }
    setPayload(data as Payload);
    const firstId = (data as Payload).corrections[0]?.id;
    if (!selectedId && firstId) void selectCorrection(firstId);
  }

  async function selectCorrection(id: string) {
    setSelectedId(id);
    setDetail(null);
    const response = await fetch(`/api/admin/corrections/${encodeURIComponent(id)}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to load correction.");
      return;
    }
    setDetail({ ...data.correction, events: data.events });
    setResolution(data.correction.admin_resolution ?? "");
    setNextStatus(data.correction.status ?? "needs_review");
  }

  async function updateCorrection(eventType = "status_changed") {
    if (!selectedId) return;
    const response = await fetch(`/api/admin/corrections/${encodeURIComponent(selectedId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus, adminResolution: resolution, eventType }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error || "Unable to update correction.");
      return;
    }
    await selectCorrection(selectedId);
    await loadCorrections();
  }

  const statusOptions = useMemo(() => Object.keys(payload?.counts.byStatus ?? {}).sort(), [payload]);
  const typeOptions = useMemo(() => Object.keys(payload?.counts.byType ?? {}).sort(), [payload]);

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-12"><div className="h-72 animate-pulse rounded-2xl bg-slate-100" /></div>;
  }

  if (!user) {
    return <AccessMessage title="Login required" body="The correction queue is admin-only." href="/auth/login" linkLabel="Log in" />;
  }

  if (!isAdmin) {
    return <AccessMessage title="Admin role required" body="This route is blocked unless your account has the admin role." href="/dashboard" linkLabel="Back to dashboard" />;
  }

  return (
    <div className="rw-page-shell">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-2xl border border-slate-300 bg-slate-950 text-white shadow-sm">
          <div className="h-1.5 bg-[linear-gradient(90deg,#b42318_0%,#f5d061_38%,#ffffff_50%,#1d4ed8_100%)]" />
          <div className="p-5 sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">Admin corrections</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Correction review queue</h1>
            <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-200 sm:text-base">
              Review public correction requests, attach sources, request more info, reject unsafe material, and log every status change.
            </p>
            {payload ? <p className="mt-3 text-xs font-bold text-slate-400">Last refreshed {new Date(payload.generatedAt).toLocaleString()}</p> : null}
          </div>
        </section>

        {error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div> : null}

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Total" value={payload?.counts.total ?? 0} />
          <Metric label="New" value={payload?.counts.byStatus.new ?? 0} />
          <Metric label="Needs review" value={payload?.counts.byStatus.needs_review ?? 0} />
          <Metric label="High priority" value={(payload?.counts.byPriority.high ?? 0) + (payload?.counts.byPriority.urgent ?? 0)} />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-3">
            <FilterSelect label="Status" value={status} onChange={setStatus} options={statusOptions} />
            <FilterSelect label="Type" value={type} onChange={setType} options={typeOptions} />
            <FilterSelect label="Priority" value={priority} onChange={setPriority} options={["low", "normal", "high", "urgent"]} />
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <h2 className="text-lg font-black text-slate-950">Requests</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {(payload?.corrections ?? []).map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => void selectCorrection(row.id)}
                  className={`block w-full p-4 text-left transition hover:bg-blue-50 ${selectedId === row.id ? "bg-blue-50" : "bg-white"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black text-slate-950">{row.entity_type}: {row.entity_id}</p>
                    <CorrectionStatusBadge status={row.status} />
                  </div>
                  <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{row.correction_type}</p>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">{row.requested_correction}</p>
                </button>
              ))}
              {!payload?.corrections?.length ? (
                <div className="p-6 text-sm font-semibold text-slate-600">No correction requests match these filters.</div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {detail ? (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl font-black text-slate-950">Correction detail</h2>
                  <CorrectionStatusBadge status={detail.status} />
                </div>
                <div className="mt-4 grid gap-3 text-sm">
                  <Detail label="Entity" value={`${detail.entity_type}: ${detail.entity_id}`} />
                  <Detail label="Type" value={detail.correction_type} />
                  <Detail label="Submitter" value={detail.submitter_email || detail.submitter_name || "Not supplied"} />
                  <Detail label="Current text" value={detail.current_text || "Not supplied"} />
                  <Detail label="Requested correction" value={detail.requested_correction} />
                  <Detail label="Explanation" value={detail.explanation || "Not supplied"} />
                  <Detail label="Source" value={detail.source_url || "Not supplied"} />
                  {detail.url ? (
                    <Link href={detail.url} className="text-sm font-black text-blue-700 hover:underline">
                      Open affected page
                    </Link>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-3">
                  <label className="grid gap-1 text-sm font-black text-blue-950">
                    Next status
                    <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold">
                      {CORRECTION_STATUSES.map((option) => (
                        <option key={option} value={option}>{option.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-black text-blue-950">
                    Admin resolution / note
                    <textarea
                      value={resolution}
                      onChange={(event) => setResolution(event.target.value)}
                      rows={5}
                      maxLength={4000}
                      className="rounded-xl border border-slate-300 px-3 py-3 text-sm font-semibold"
                    />
                  </label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <button type="button" onClick={() => void updateCorrection("status_changed")} className="rounded-xl bg-blue-950 px-4 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-red-700">
                      Save status
                    </button>
                    <button type="button" onClick={() => void updateCorrection("more_info_requested")} className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-black uppercase tracking-wide text-amber-900 hover:bg-amber-100">
                      Need more info
                    </button>
                    <button type="button" onClick={() => void updateCorrection("source_attached")} className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-black uppercase tracking-wide text-emerald-900 hover:bg-emerald-100">
                      Source attached
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Events</h3>
                  <div className="mt-2 grid gap-2">
                    {(detail.events ?? []).map((event) => (
                      <div key={event.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-600">
                        <span className="font-black text-slate-950">{event.event_type}</span> - {new Date(event.created_at).toLocaleString()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm font-semibold text-slate-600">Select a correction request to review it.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-blue-950">{value.toLocaleString()}</p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="grid gap-1 text-sm font-black text-blue-950">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold">
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>{option.replace(/_/g, " ")}</option>
        ))}
      </select>
    </label>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap break-words font-semibold leading-6 text-slate-800">{value}</p>
    </div>
  );
}

function AccessMessage({
  title,
  body,
  href,
  linkLabel,
}: {
  title: string;
  body: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-black text-blue-950">{title}</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{body}</p>
        <Link href={href} className="mt-5 inline-flex rounded-xl bg-blue-950 px-4 py-2 text-sm font-black uppercase tracking-wide text-white hover:bg-red-700">
          {linkLabel}
        </Link>
      </div>
    </div>
  );
}
