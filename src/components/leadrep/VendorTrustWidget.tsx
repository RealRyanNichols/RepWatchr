"use client";

import { useMemo, useState, type FormEvent } from "react";

type VendorForm = {
  businessName: string;
  website: string;
  cityState: string;
  licenseNumber: string;
  requesterEmail: string;
  consent: boolean;
  recurringInterest: boolean;
};

const initialForm: VendorForm = {
  businessName: "",
  website: "",
  cityState: "",
  licenseNumber: "",
  requesterEmail: "",
  consent: false,
  recurringInterest: true,
};

function confidenceScore(form: VendorForm) {
  let score = 42;
  if (form.website.startsWith("https://")) score += 16;
  if (form.cityState.includes(",")) score += 10;
  if (form.licenseNumber.trim()) score += 14;
  if (form.businessName.trim().length > 4) score += 8;
  if (form.consent) score += 6;
  return Math.max(15, Math.min(94, score));
}

async function postVendorHandoff(form: VendorForm, score: number, eventType: string) {
  await fetch("/api/leadrep/handoff", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      package_type: "vendortrust_badge",
      industry: "home_services_vendor_check",
      buyer_type: "family_or_local_buyer",
      source_url: form.website,
      urgency: form.licenseNumber ? "standard" : "needs_registry_check",
      budget_range: "$29_check_or_$39_monthly",
      confidence_score: score,
      requested_report: eventType === "run_vendor_check",
      recurring_interest: form.recurringInterest,
      payload_json: {
        event_type: eventType,
        vendor_business_name: form.businessName,
        website: form.website,
        city_state: form.cityState,
        license_number_supplied: Boolean(form.licenseNumber),
        requester_email: form.requesterEmail,
        consent_public_source: form.consent,
      },
    }),
  });
}

export function VendorTrustWidget({ embedMode = false }: { embedMode?: boolean }) {
  const [form, setForm] = useState<VendorForm>(initialForm);
  const [status, setStatus] = useState("");
  const [previewed, setPreviewed] = useState(false);
  const score = useMemo(() => confidenceScore(form), [form]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPreviewed(true);
    setStatus("VendorTrust preview generated. Full vendor check requires review before any public badge.");
    await postVendorHandoff(form, score, "vendortrust_preview_generated").catch(() => undefined);
  }

  async function runCheck() {
    if (!form.consent) {
      setStatus("Consent/public-source acknowledgment is required before running the vendor check.");
      return;
    }
    setStatus("Vendor check request captured. Public badge remains pending until sources are reviewed.");
    await postVendorHandoff(form, score, "run_vendor_check").catch(() => undefined);
  }

  return (
    <div className={`grid gap-4 ${embedMode ? "" : "lg:grid-cols-[0.95fr_1.05fr]"}`}>
      <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">VendorTrust Badge</p>
        <h2 className="mt-2 text-2xl font-black text-blue-950">Check a vendor before trust becomes expensive.</h2>
        <div className="mt-5 grid gap-3">
          <input className="field" required placeholder="Vendor/business name" value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} />
          <input className="field" required type="url" placeholder="Website" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} />
          <input className="field" required placeholder="City, State" value={form.cityState} onChange={(event) => setForm({ ...form, cityState: event.target.value })} />
          <input className="field" placeholder="License number optional" value={form.licenseNumber} onChange={(event) => setForm({ ...form, licenseNumber: event.target.value })} />
          <label className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm font-bold text-slate-600">
            Insurance proof optional upload placeholder
            <input className="mt-2 block w-full text-xs" type="file" disabled />
          </label>
          <input className="field" required type="email" placeholder="Requester email" value={form.requesterEmail} onChange={(event) => setForm({ ...form, requesterEmail: event.target.value })} />
          <label className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-bold leading-6 text-slate-700">
            <input type="checkbox" checked={form.recurringInterest} onChange={(event) => setForm({ ...form, recurringInterest: event.target.checked })} />
            I want Family Vendor Shield monthly monitoring if this category is useful.
          </label>
          <label className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-bold leading-6 text-slate-700">
            <input required type="checkbox" checked={form.consent} onChange={(event) => setForm({ ...form, consent: event.target.checked })} />
            I consent to a public-source vendor check. No private claims or unsupported accusations.
          </label>
          <button className="min-h-12 rounded-lg bg-blue-950 px-4 text-sm font-black uppercase tracking-wide text-white hover:bg-red-700">
            Generate Vendor Preview
          </button>
        </div>
      </form>

      <section className="rounded-lg border border-slate-200 bg-blue-950 p-5 text-white shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-200">Output preview</p>
        <h2 className="mt-2 text-2xl font-black">VendorTrust confidence score</h2>
        <div className="mt-5 rounded-lg border border-white/10 bg-white/10 p-5">
          <div className="flex items-end justify-between gap-4">
            <strong className="text-6xl font-black">{score}</strong>
            <span className="pb-2 text-sm font-black uppercase tracking-wide text-blue-100">pending proof</span>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#d6b35a]" style={{ width: `${score}%` }} />
          </div>
        </div>
        <div className="mt-5 grid gap-3">
          <PreviewRow title="Public-source check" body="Pending: business website, public records, registry pages, and labeled source links." />
          <PreviewRow title="License/registry" body={form.licenseNumber ? "License number supplied; registry check still pending." : "Placeholder: license or registry lookup needed."} />
          <PreviewRow title="Review count" body="Placeholder: review-count pattern only after public source review." />
          <PreviewRow title="Complaint source" body="Placeholder: complaint-source scan must cite public records or review platforms." />
        </div>
        <div className="mt-5 rounded-lg border border-[#d6b35a]/40 bg-white/10 p-4">
          <p className="text-2xl font-black">$29</p>
          <p className="text-sm font-bold text-blue-100">Run Vendor Check</p>
          <p className="mt-1 text-xs font-semibold text-slate-300">Recurring upsell: Family Vendor Shield $39/mo</p>
          <button type="button" onClick={runCheck} className="mt-4 min-h-11 w-full rounded-lg bg-[#d6b35a] px-4 text-sm font-black uppercase tracking-wide text-blue-950 hover:bg-white">
            Run Vendor Check
          </button>
        </div>
        {previewed || status ? <p className="mt-4 rounded-lg bg-white/10 p-3 text-sm font-bold text-blue-50">{status}</p> : null}
      </section>
    </div>
  );
}

function PreviewRow({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <p className="text-sm font-black text-white">{title}</p>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-200">{body}</p>
    </div>
  );
}
