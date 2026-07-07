"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { PartnerPipelineData, PartnerInterestRow } from "@/lib/partner-pipeline-admin";
import {
  PARTNER_INTEREST_TYPES,
  PARTNER_PIPELINE_STATUSES,
  partnerInterestTypeLabels,
  statusLabel,
} from "@/lib/partner-pipeline";
import { trackRepWatchrEvent } from "@/lib/client-analytics";

type AdminPartnerPipelineClientProps = {
  initialData: PartnerPipelineData;
  adminUserId: string;
};

async function postAdminAction(payload: Record<string, unknown>) {
  const response = await fetch("/api/admin/partners", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) throw new Error(data?.error || "Partner pipeline action failed.");
  return data;
}

function csvEscape(value: unknown) {
  const text = String(value ?? "").replaceAll("\"", "\"\"");
  return `"${text}"`;
}

function downloadCsv(leads: PartnerInterestRow[]) {
  const headers = ["id", "name", "email", "organization", "interest_type", "status", "jurisdiction_focus", "created_at"];
  const rows = leads.map((lead) =>
    headers.map((header) => csvEscape(lead[header as keyof PartnerInterestRow])).join(","),
  );
  const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `repwatchr-partner-pipeline-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AdminPartnerPipelineClient({ initialData, adminUserId }: AdminPartnerPipelineClientProps) {
  const [data, setData] = useState(initialData);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const filteredLeads = useMemo(
    () =>
      data.leads.filter((lead) => {
        const typeMatch = typeFilter === "all" || lead.interest_type === typeFilter;
        const statusMatch = statusFilter === "all" || lead.status === statusFilter;
        return typeMatch && statusMatch;
      }),
    [data.leads, statusFilter, typeFilter],
  );

  useEffect(() => {
    trackRepWatchrEvent("partner_pipeline_open", { lead_count: data.leads.length });
  }, [data.leads.length]);

  async function refresh() {
    const response = await fetch("/api/admin/partners", { cache: "no-store" });
    const next = await response.json();
    if (next?.ok) setData(next.data);
  }

  async function updateStatus(event: FormEvent<HTMLFormElement>, leadId: string) {
    event.preventDefault();
    setNotice("");
    setError("");
    const form = new FormData(event.currentTarget);
    const status = String(form.get("status") || "reviewed");
    try {
      await postAdminAction({
        action: "update_status",
        leadId,
        status,
        notes: form.get("notes"),
      });
      trackRepWatchrEvent("partner_status_changed", { status });
      setNotice("Partner lead status updated.");
      await refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Status update failed.");
    }
  }

  async function addNote(event: FormEvent<HTMLFormElement>, leadId: string) {
    event.preventDefault();
    setNotice("");
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await postAdminAction({ action: "add_note", leadId, notes: form.get("notes") });
      event.currentTarget.reset();
      setNotice("Note added.");
      await refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Note failed.");
    }
  }

  async function assignOwner(leadId: string, assignedTo: string) {
    setNotice("");
    setError("");
    try {
      await postAdminAction({ action: "assign_owner", leadId, assignedTo });
      setNotice("Owner assignment saved.");
      await refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Assignment failed.");
    }
  }

  async function createAccount(event: FormEvent<HTMLFormElement>, lead: PartnerInterestRow) {
    event.preventDefault();
    setNotice("");
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await postAdminAction({
        action: "create_partner_account",
        leadId: lead.id,
        accountName: form.get("accountName") || lead.organization || lead.name,
        accountType: form.get("accountType") || lead.interest_type,
        website: form.get("website") || lead.website || "",
        contactEmail: form.get("contactEmail") || lead.email,
        accountStatus: form.get("accountStatus") || "prospect",
        notes: form.get("notes"),
      });
      setNotice("Partner account created.");
      await refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Partner account save failed.");
    }
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Total leads" value={data.stats.totalLeads} />
        <Metric label="New" value={data.stats.newLeads} />
        <Metric label="Qualified" value={data.stats.qualifiedLeads} />
        <Metric label="Accounts" value={data.stats.partnerAccounts} />
        <Metric label="Investor interest" value={data.stats.investorInterest} />
      </section>

      {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-950">{notice}</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-950">{error}</div> : null}
      {data.errors.length ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-950">
          Pipeline data warnings: {data.errors.join(" / ")}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Partner pipeline</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Leads and conversations</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="field max-w-xs">
              <option value="all">All types</option>
              {PARTNER_INTEREST_TYPES.map((type) => (
                <option key={type} value={type}>
                  {partnerInterestTypeLabels[type]}
                </option>
              ))}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="field max-w-xs">
              <option value="all">All statuses</option>
              {PARTNER_PIPELINE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => downloadCsv(filteredLeads)} className="secondary-button">
              Export filtered CSV
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {filteredLeads.length ? (
            filteredLeads.map((lead) => (
              <article key={lead.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                      {statusLabel(lead.status)} / {partnerInterestTypeLabels[lead.interest_type as keyof typeof partnerInterestTypeLabels] ?? lead.interest_type}
                    </p>
                    <h3 className="mt-1 text-2xl font-black text-slate-950">{lead.name}</h3>
                    <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
                      {lead.organization || "No organization supplied"} {lead.title ? `/ ${lead.title}` : ""}
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{lead.email}</p>
                    {lead.website ? <p className="mt-1 break-all text-sm font-semibold text-blue-700">{lead.website}</p> : null}
                    {lead.budget_or_check_size ? (
                      <p className="mt-3 text-sm font-bold text-slate-700">Budget/check size: {lead.budget_or_check_size}</p>
                    ) : null}
                    {lead.jurisdiction_focus ? (
                      <p className="mt-1 text-sm font-bold text-slate-700">Jurisdiction: {lead.jurisdiction_focus}</p>
                    ) : null}
                    {lead.message ? <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{lead.message}</p> : null}
                    <p className="mt-3 text-xs font-bold text-slate-500">Created {new Date(lead.created_at).toLocaleString()}</p>
                  </div>

                  <div className="grid gap-3">
                    <form onSubmit={(event) => updateStatus(event, lead.id)} className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">Status</p>
                      <select name="status" defaultValue={lead.status} className="field mt-2">
                        {PARTNER_PIPELINE_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {statusLabel(status)}
                          </option>
                        ))}
                      </select>
                      <textarea name="notes" rows={2} className="field mt-2" placeholder="Internal status note" />
                      <button type="submit" className="secondary-button mt-2 w-full">Save status</button>
                    </form>

                    <form onSubmit={(event) => addNote(event, lead.id)} className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">Internal note</p>
                      <textarea name="notes" rows={2} required className="field mt-2" placeholder="Add note" />
                      <button type="submit" className="secondary-button mt-2 w-full">Add note</button>
                    </form>

                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">Assign owner</p>
                      <div className="mt-2 flex gap-2">
                        <input defaultValue={lead.assigned_to || adminUserId} className="field" onBlur={(event) => assignOwner(lead.id, event.target.value)} />
                      </div>
                    </div>

                    <details className="rounded-xl border border-slate-200 bg-white p-3">
                      <summary className="cursor-pointer text-xs font-black uppercase tracking-wide text-slate-500">Create partner account</summary>
                      <form onSubmit={(event) => createAccount(event, lead)} className="mt-3 grid gap-2">
                        <input name="accountName" defaultValue={lead.organization || lead.name} className="field" placeholder="Account name" />
                        <select name="accountType" defaultValue={lead.interest_type} className="field">
                          {PARTNER_INTEREST_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {partnerInterestTypeLabels[type]}
                            </option>
                          ))}
                        </select>
                        <input name="website" defaultValue={lead.website || ""} className="field" placeholder="https://..." />
                        <input name="contactEmail" defaultValue={lead.email} className="field" placeholder="contact email" />
                        <select name="accountStatus" defaultValue="prospect" className="field">
                          {["prospect", "active", "paused", "not_fit", "archived"].map((status) => (
                            <option key={status} value={status}>{statusLabel(status)}</option>
                          ))}
                        </select>
                        <textarea name="notes" rows={2} className="field" placeholder="Account notes" />
                        <button type="submit" className="secondary-button">Create account</button>
                      </form>
                    </details>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600">
              No partner leads match the current filters.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Recent events</p>
          <div className="mt-4 grid gap-2">
            {data.events.slice(0, 12).map((event) => (
              <div key={event.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-black text-slate-950">{statusLabel(event.event_type)}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">{new Date(event.created_at).toLocaleString()}</p>
                {event.notes ? <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{event.notes}</p> : null}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Partner accounts</p>
          <div className="mt-4 grid gap-2">
            {data.accounts.slice(0, 12).map((account) => (
              <div key={account.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-black text-slate-950">{account.name}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                  {account.account_type.replaceAll("_", " ")} / {statusLabel(account.status)}
                </p>
                {account.contact_email ? <p className="mt-2 text-sm font-semibold text-slate-700">{account.contact_email}</p> : null}
              </div>
            ))}
          </div>
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
