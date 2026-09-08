"use client";

import { useState, type FormEvent } from "react";
import { getAnonymousSessionId, trackRepWatchrEvent } from "@/lib/client-analytics";

const scopeOptions = [
  ["public_profiles_read", "Official profiles and office rosters"],
  ["public_sources_read", "Public sources and record changes"],
  ["public_jurisdictions_read", "Jurisdictions and coverage"],
  ["public_races_read", "Public election and race records"],
  ["public_stories_read", "Published stories and source links"],
  ["exports_create", "Scoped public-data export"],
  ["aggregate_trends_read", "Future aggregate research (not available)"],
];

type ApiAccessResponse = {
  ok?: boolean;
  id?: string;
  error?: string;
};

export default function PublicDataApiAccessForm() {
  const [form, setForm] = useState({
    email: "",
    name: "",
    organization: "",
    useCase: "",
    requestedScope: "public_profiles_read",
    jurisdictionFocus: "",
  });
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function markStarted() {
    if (started) return;
    setStarted(true);
    trackRepWatchrEvent("api_access_page_open", { source: "access_form_focus" });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (!form.name.trim() && !form.organization.trim()) {
      setError("Add your name or organization so we can scope your request.");
      return;
    }
    setSubmitting(true);
    setNotice("");
    setError("");

    try {
      const response = await fetch("/api/public-data-api/request-access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, anonymousId: getAnonymousSessionId() }),
      });
      const data = (await response.json().catch(() => null)) as ApiAccessResponse | null;
      if (!response.ok || !data?.ok || typeof data.id !== "string" || !data.id) {
        setError(data?.error || "API access request could not be saved. Try again later.");
        return;
      }
      setNotice(`Pilot request saved. Reference ID: ${data.id}. Next: RepWatchr reviews coverage and scope. No payment was collected or API access granted.`);
      trackRepWatchrEvent("api_access_requested", {
        requested_scope: form.requestedScope,
      });
      setForm({
        email: "",
        name: "",
        organization: "",
        useCase: "",
        requestedScope: "public_profiles_read",
        jurisdictionFocus: "",
      });
    } catch {
      setError("API access request could not be saved. Try again later.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm" id="request-api-access">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-900">Request a scoped pilot</p>
      <h2 className="mt-2 text-2xl font-black text-blue-950">Tell us what data product you need.</h2>
      <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
        This request goes to the review queue. RepWatchr public API access is not publicly launched, and no private user data is sold or exposed.
      </p>

      {notice ? <div role="status" className="mt-4 break-words rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-950">{notice}</div> : null}
      {error ? <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-950">{error}</div> : null}

      <form onSubmit={submit} aria-busy={submitting} className="mt-5 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              maxLength={254}
              value={form.email}
              onFocus={markStarted}
              onChange={(event) => update("email", event.target.value)}
              className="field mt-1 bg-white"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Name (or add organization below)</span>
            <input
              autoComplete="name"
              maxLength={255}
              value={form.name}
              onFocus={markStarted}
              onChange={(event) => update("name", event.target.value)}
              className="field mt-1 bg-white"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Organization</span>
            <input
              autoComplete="organization"
              maxLength={255}
              value={form.organization}
              onFocus={markStarted}
              onChange={(event) => update("organization", event.target.value)}
              placeholder="Media, civic group, campaign, research shop, data team"
              className="field mt-1 bg-white"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Requested data scope</span>
            <select
              value={form.requestedScope}
              onFocus={markStarted}
              onChange={(event) => update("requestedScope", event.target.value)}
              className="field mt-1 bg-white"
            >
              {scopeOptions.map(([scope, label]) => (
                <option key={scope} value={scope}>{label}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-slate-600">Jurisdiction focus</span>
          <input
            required
            maxLength={500}
            value={form.jurisdictionFocus}
            onFocus={markStarted}
            onChange={(event) => update("jurisdictionFocus", event.target.value)}
            placeholder="Texas, East Texas, county, school board, congressional district"
            className="field mt-1 bg-white"
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-slate-600">What do you need delivered?</span>
          <textarea
            required
            minLength={20}
            maxLength={3000}
            rows={5}
            value={form.useCase}
            onFocus={markStarted}
            onChange={(event) => update("useCase", event.target.value)}
            placeholder="Example: a weekly CSV of public officeholders and source changes for our county newsroom. Include the fields, format, timing and pilot package you want to discuss."
            className="field mt-1 bg-white"
          />
        </label>

        <button type="submit" disabled={submitting} className="primary-button disabled:cursor-not-allowed disabled:opacity-50">
          {submitting ? "Saving request..." : "Send pilot request"}
        </button>
        <p className="text-xs leading-5 text-slate-600">We use your contact details to review and respond to this request. Do not include private records or individual voter information. No payment or publication is authorized by submitting.</p>
      </form>
    </section>
  );
}
