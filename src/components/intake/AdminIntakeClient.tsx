"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  AdminSubmissionDetail,
  AdminSubmissionTable,
  type AdminSubmission,
} from "@/components/intake/FormComponents";
import { trackVisitorIntelligenceEvent } from "@/lib/visitor-intelligence-client";

type Payload = {
  generatedAt: string;
  submissions: AdminSubmission[];
  definitions: Array<{ key: string; name: string; description: string; status: string }>;
  counts: {
    total: number;
    byStatus: Record<string, number>;
    byFormKey: Record<string, number>;
    byPriority: Record<string, number>;
  };
};

export default function AdminIntakeClient() {
  const { user, roles, loading } = useAuth();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [selectedDetail, setSelectedDetail] = useState<Record<string, unknown> | null>(null);
  const [formKey, setFormKey] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [error, setError] = useState("");
  const isAdmin = roles.includes("admin");

  useEffect(() => {
    trackVisitorIntelligenceEvent({
      eventType: "admin_form_opened",
      path: "/admin/intake",
      metadata: { dashboard: "form_intake" },
    });
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    void loadSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, formKey, status, priority]);

  async function loadSubmissions() {
    setError("");
    const params = new URLSearchParams();
    if (formKey) params.set("formKey", formKey);
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    const response = await fetch(`/api/admin/forms?${params.toString()}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to load intake queue.");
      return;
    }
    setPayload(data as Payload);
    const firstId = (data as Payload).submissions[0]?.id;
    if (!selectedId && firstId) void selectSubmission(firstId);
  }

  async function selectSubmission(id: string) {
    setSelectedId(id);
    setSelectedDetail(null);
    const response = await fetch(`/api/admin/forms/${encodeURIComponent(id)}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to load submission.");
      return;
    }
    setSelectedDetail({ ...data.submission, events: data.events });
  }

  async function updateStatus(nextStatus: string, notes: string) {
    if (!selectedId) return;
    const response = await fetch(`/api/admin/forms/${encodeURIComponent(selectedId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus, admin_notes: notes }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error || "Unable to update status.");
      return;
    }
    await selectSubmission(selectedId);
    await loadSubmissions();
  }

  const statusOptions = useMemo(() => Object.keys(payload?.counts.byStatus ?? {}).sort(), [payload]);
  const formOptions = useMemo(() => payload?.definitions.map((definition) => definition.key).sort() ?? [], [payload]);

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-12"><div className="h-72 animate-pulse rounded-2xl bg-slate-100" /></div>;
  }

  if (!user) {
    return <AccessMessage title="Login required" body="The intake queue is admin-only." href="/auth/login" linkLabel="Log in" />;
  }

  if (!isAdmin) {
    return <AccessMessage title="Admin role required" body="This route is blocked unless Supabase says your account has the admin role." href="/dashboard" linkLabel="Back to dashboard" />;
  }

  return (
    <div className="rw-page-shell">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-2xl border border-slate-300 bg-slate-950 text-white shadow-sm">
          <div className="h-1.5 bg-[linear-gradient(90deg,#b42318_0%,#b42318_33%,#ffffff_33%,#ffffff_66%,#1d4ed8_66%,#1d4ed8_100%)]" />
          <div className="p-5 sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">Admin intake</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Universal form queue</h1>
            <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-200 sm:text-base">
              Source submissions, corrections, package interest, contact, missing records, broken links, and public-record requests all land here with status, attribution, and a safe packet.
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
            <FilterSelect label="Form key" value={formKey} onChange={setFormKey} options={formOptions} />
            <FilterSelect label="Status" value={status} onChange={setStatus} options={statusOptions} />
            <FilterSelect label="Priority" value={priority} onChange={setPriority} options={["low", "normal", "high", "urgent"]} />
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <AdminSubmissionTable submissions={payload?.submissions ?? []} selectedId={selectedId} onSelect={selectSubmission} />
          <AdminSubmissionDetail submission={selectedDetail} onStatusChange={updateStatus} />
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
