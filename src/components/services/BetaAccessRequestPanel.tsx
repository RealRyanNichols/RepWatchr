"use client";

import { useState, type FormEvent } from "react";
import type { RepWatchrService } from "@/data/repwatchr-services";
import { getAnonymousSessionId, trackRepWatchrEvent } from "@/lib/client-analytics";

type BetaAccessRequestPanelProps = {
  service: RepWatchrService;
  showExpectedPricing: boolean;
  expectedRangeLabel: string;
};

type BetaResponse = {
  ok?: boolean;
  id?: string;
  error?: string;
};

export default function BetaAccessRequestPanel({
  service,
  showExpectedPricing,
  expectedRangeLabel,
}: BetaAccessRequestPanelProps) {
  const [form, setForm] = useState({
    email: "",
    name: "",
    useCase: "",
    jurisdiction: "",
    organizationType: "",
    urgency: "",
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
    trackRepWatchrEvent("pricing_cta_clicked", {
      package_key: service.slug,
      source: "beta_access_panel",
      payments_enabled: false,
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setNotice("");
    setError("");

    try {
      const response = await fetch("/api/beta-access/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          packageKey: service.slug,
          anonymousId: getAnonymousSessionId(),
        }),
      });
      const data = (await response.json().catch(() => null)) as BetaResponse | null;
      if (!response.ok || !data?.ok) {
        setError(data?.error || "Beta access request could not be saved. Try again later.");
        return;
      }
      setNotice(`Beta access request saved. Reference ID: ${data.id}`);
      trackRepWatchrEvent("beta_access_requested", {
        package_key: service.slug,
        source: "beta_access_panel",
      });
      setForm({
        email: "",
        name: "",
        useCase: "",
        jurisdiction: "",
        organizationType: "",
        urgency: "",
      });
    } catch {
      setError("Beta access request could not be saved. Try again later.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="beta-access" className="rounded-lg border border-blue-200 bg-blue-50 p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-900">Beta access</p>
      <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">Request beta access</h2>
      <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
        Tell us what you need monitored. RepWatchr is collecting demand before launching paid packages.
      </p>
      <div className="mt-4 rounded-lg border border-blue-200 bg-white p-3 text-sm font-bold leading-6 text-blue-950">
        <span className="font-black">{service.name}</span>
        {showExpectedPricing && expectedRangeLabel ? (
          <span> / expected range: {expectedRangeLabel}. This is not checkout.</span>
        ) : (
          <span> / pricing is being tested before public checkout.</span>
        )}
      </div>
      <p className="mt-3 text-xs font-bold leading-5 text-slate-600">
        No payment is collected here. Access is reviewed manually and is not guaranteed.
      </p>

      {notice ? <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-950">{notice}</div> : null}
      {error ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-950">{error}</div> : null}

      <form onSubmit={submit} className="mt-5 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Email</span>
            <input
              type="email"
              required
              value={form.email}
              onFocus={markStarted}
              onChange={(event) => update("email", event.target.value)}
              className="field mt-1 bg-white"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Name optional</span>
            <input
              value={form.name}
              onFocus={markStarted}
              onChange={(event) => update("name", event.target.value)}
              className="field mt-1 bg-white"
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Jurisdiction</span>
            <input
              value={form.jurisdiction}
              onFocus={markStarted}
              onChange={(event) => update("jurisdiction", event.target.value)}
              placeholder="County, race, district, school board"
              className="field mt-1 bg-white"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Organization type</span>
            <select
              value={form.organizationType}
              onFocus={markStarted}
              onChange={(event) => update("organizationType", event.target.value)}
              className="field mt-1 bg-white"
            >
              <option value="">Choose one</option>
              <option value="citizen">Citizen / voter</option>
              <option value="journalist">Journalist</option>
              <option value="civic_group">Civic group</option>
              <option value="campaign_public_affairs">Campaign / public affairs</option>
              <option value="legal_research">Legal / research customer</option>
              <option value="school_board_watch">School board watcher</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>
        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-slate-600">What do you need monitored?</span>
          <textarea
            required
            rows={4}
            value={form.useCase}
            onFocus={markStarted}
            onChange={(event) => update("useCase", event.target.value)}
            placeholder="Example: Bowie County races, Longview ISD board, campaign finance filings, source gaps, or official profile reviews."
            className="field mt-1 bg-white"
          />
        </label>
        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-slate-600">Urgency optional</span>
          <input
            value={form.urgency}
            onFocus={markStarted}
            onChange={(event) => update("urgency", event.target.value)}
            placeholder="This week, before filing deadline, next election cycle"
            className="field mt-1 bg-white"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="primary-button disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Request beta access"}
        </button>
      </form>
    </section>
  );
}
