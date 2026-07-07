import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AdminAuthError, requireAdminPageAccess } from "@/lib/admin-auth";
import { getAllCommitteeRecords, getAllDonorEntities, getAllFinanceRecords, getAllMoneyTrailDossiers } from "@/lib/money-trail";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Money Desk | RepWatchr Admin",
  description: "Secure RepWatchr admin tools for finance records, committees, donor/source entities, and public vendor records.",
  robots: { index: false, follow: false },
};

export default async function AdminMoneyPage() {
  let adminUser;
  try {
    adminUser = await requireAdminPageAccess();
  } catch (error) {
    if (error instanceof AdminAuthError && error.status === 503) {
      return (
        <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Money Desk offline</p>
          <h1 className="mt-2 text-3xl font-black text-blue-950">Supabase auth is required for `/admin/money`.</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Apply the campaign finance SQL and configure Supabase auth before using admin money tools.
          </p>
          <Link href="/" className="primary-button mt-5">Back to RepWatchr</Link>
        </main>
      );
    }
    throw error;
  }

  const dossiers = getAllMoneyTrailDossiers();
  const records = getAllFinanceRecords();
  const committees = getAllCommitteeRecords();
  const donors = getAllDonorEntities();

  return (
    <main className="rw-page-shell">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Secure admin</p>
          <h1 className="mt-2 text-4xl font-black text-slate-950">Money Desk</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Signed in as {adminUser.email ?? "admin"}. Stage campaign finance, committee, donor/source aggregate, and public vendor records.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <Metric label="Money profiles" value={dossiers.length} />
            <Metric label="Seed finance rows" value={records.length} />
            <Metric label="Committees/sources" value={committees.length} />
            <Metric label="Donor aggregates" value={donors.length} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-8">
        <AdminForm title="Attach finance record" action="create_finance_record">
          <Field name="entity_id" label="Entity ID" required />
          <Field name="entity_type" label="Entity type" placeholder="official, candidate, race, agency" />
          <Field name="candidate_name" label="Candidate/official name" />
          <Field name="committee_name" label="Committee name" />
          <Field name="counterparty_name" label="Donor, payee, vendor, or aggregate name" />
          <Select name="counterparty_type" label="Counterparty type" options={["individual", "PAC", "committee", "business", "union", "nonprofit", "candidate", "party", "vendor", "government_entity", "unknown"]} />
          <Select name="record_type" label="Record type" options={["contribution", "expenditure", "loan", "refund", "in_kind", "transfer", "debt", "filing", "report_summary", "contract", "payment", "procurement", "invoice", "grant", "award", "reimbursement", "other"]} />
          <Field name="amount" label="Amount" placeholder="25000" />
          <Field name="transaction_date" label="Transaction/source date" placeholder="2026-06-30" />
          <Field name="cycle" label="Cycle" placeholder="2026" />
          <Field name="jurisdiction" label="Jurisdiction" />
          <Field name="state" label="State" placeholder="TX" />
          <Field name="source_url" label="Source URL" required />
          <Field name="source_key" label="Source key / filing ID" />
          <Select name="confidence" label="Confidence" options={["source_backed", "official_record", "aggregate_source", "needs_review", "missing_source"]} />
        </AdminForm>

        <AdminForm title="Add committee/source" action="create_committee">
          <Field name="name" label="Committee/source name" required />
          <Field name="slug" label="Slug" />
          <Select name="committee_type" label="Committee type" options={["candidate_committee", "officeholder_account", "PAC", "party_committee", "source_path", "unknown"]} />
          <Field name="jurisdiction" label="Jurisdiction" />
          <Field name="state" label="State" />
          <Field name="fec_id" label="FEC ID" />
          <Field name="state_id" label="State filing ID" />
          <Field name="official_url" label="Official URL" />
          <Field name="source_url" label="Source URL" />
        </AdminForm>

        <AdminForm title="Add donor/source entity" action="create_donor_entity">
          <Field name="name" label="Name" required />
          <Field name="slug" label="Slug" />
          <Select name="donor_type" label="Donor/source type" options={["individual", "PAC", "committee", "business", "union", "nonprofit", "candidate", "party", "vendor", "government_entity", "unknown"]} />
          <Field name="jurisdiction" label="Jurisdiction" />
          <Field name="state" label="State" />
          <Field name="source_url" label="Source URL" />
        </AdminForm>

        <AdminForm title="Add public vendor/procurement record" action="create_vendor_record">
          <Field name="entity_id" label="Entity/agency ID" />
          <Field name="vendor_name" label="Vendor name" required />
          <Field name="amount" label="Amount" />
          <Field name="transaction_date" label="Transaction/source date" />
          <Select name="record_type" label="Record type" options={["contract", "payment", "procurement", "invoice", "grant", "award", "reimbursement", "other"]} />
          <Field name="contract_or_invoice" label="Contract/invoice ID" />
          <Field name="source_url" label="Source URL" required />
          <Select name="confidence" label="Confidence" options={["source_backed", "official_record", "needs_review", "missing_source"]} />
        </AdminForm>
      </section>
    </main>
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

function AdminForm({ title, action, children }: { title: string; action: string; children: ReactNode }) {
  return (
    <form action="/api/admin/money" method="post" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <input type="hidden" name="action" value={action} />
      <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Admin action</p>
      <h2 className="mt-1 text-2xl font-black text-slate-950">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Every public row needs a source URL. Keep labels neutral.</p>
      <div className="mt-4 grid gap-3">{children}</div>
      <button type="submit" className="primary-button mt-4">Save</button>
    </form>
  );
}

function Field({ name, label, required = false, placeholder = "" }: { name: string; label: string; required?: boolean; placeholder?: string }) {
  return (
    <label className="grid gap-1 text-sm font-bold text-slate-700">
      {label}
      <input name={name} required={required} placeholder={placeholder} className="field" />
    </label>
  );
}

function Select({ name, label, options }: { name: string; label: string; options: string[] }) {
  return (
    <label className="grid gap-1 text-sm font-bold text-slate-700">
      {label}
      <select name={name} className="field">
        {options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
      </select>
    </label>
  );
}
