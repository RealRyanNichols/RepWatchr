"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getAnonymousSessionId, trackRepWatchrEvent } from "@/lib/client-analytics";
import { PARTNER_INTEREST_TYPES, partnerInterestTypeLabels, type PartnerInterestType } from "@/lib/partner-pipeline";

type InterestResponse = {
  ok?: boolean;
  id?: string;
  error?: string;
};

export default function PartnerInterestForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    organization: "",
    title: "",
    website: "",
    interestType: "investor" as PartnerInterestType,
    budgetOrCheckSize: "",
    jurisdictionFocus: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function attribution() {
    if (typeof window === "undefined") return {};
    const params = new URLSearchParams(window.location.search);
    return {
      anonymousId: getAnonymousSessionId(),
      referrer: document.referrer || "",
      landingPage: `${window.location.pathname}${window.location.search}`,
      utmSource: params.get("utm_source") || "",
      utmMedium: params.get("utm_medium") || "",
      utmCampaign: params.get("utm_campaign") || "",
      utmTerm: params.get("utm_term") || "",
      utmContent: params.get("utm_content") || "",
    };
  }

  function markStarted() {
    if (started) return;
    setStarted(true);
    trackRepWatchrEvent("partner_interest_started", { source: "investors_page" });
  }

  useEffect(() => {
    trackRepWatchrEvent("investor_page_open", { source: "investors_page" });
    trackRepWatchrEvent("partner_page_open", { source: "investors_page", canonical_route: "/investors" });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setNotice("");
    setError("");

    try {
      const response = await fetch("/api/investor-interest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          ...attribution(),
        }),
      });
      const data = (await response.json().catch(() => null)) as InterestResponse | null;
      if (!response.ok || !data?.ok) {
        setError(data?.error || "Interest form could not be saved. Try again later.");
        return;
      }
      setNotice(`Interest saved. Reference ID: ${data.id}`);
      trackRepWatchrEvent("partner_interest_submitted", {
        interest_type: form.interestType,
        source: "investors_page",
      });
      setForm({
        name: "",
        email: "",
        organization: "",
        title: "",
        website: "",
        interestType: "investor",
        budgetOrCheckSize: "",
        jurisdictionFocus: "",
        message: "",
      });
    } catch {
      setError("Interest form could not be saved. Try again later.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Investor / partner interest</p>
      <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">Start the conversation.</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
        This page is for interest collection and partnership conversations. It is not a public securities offering and does not offer investment terms.
      </p>

      {notice ? <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-950">{notice}</div> : null}
      {error ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-950">{error}</div> : null}

      <div className="mt-5 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Name</span>
            <input
              value={form.name}
              onFocus={markStarted}
              onChange={(event) => update("name", event.target.value)}
              required
              maxLength={255}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Email</span>
            <input
              type="email"
              value={form.email}
              onFocus={markStarted}
              onChange={(event) => update("email", event.target.value)}
              required
              maxLength={254}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Organization</span>
            <input
              value={form.organization}
              onFocus={markStarted}
              onChange={(event) => update("organization", event.target.value)}
              maxLength={255}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Interest type</span>
            <select
              value={form.interestType}
              onFocus={markStarted}
              onChange={(event) => update("interestType", event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-black text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              {PARTNER_INTEREST_TYPES.map((type) => (
                <option key={type} value={type}>
                  {partnerInterestTypeLabels[type]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Title / role optional</span>
            <input
              value={form.title}
              onFocus={markStarted}
              onChange={(event) => update("title", event.target.value)}
              maxLength={255}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              placeholder="Founder, editor, partner, analyst, organizer"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Website optional</span>
            <input
              type="url"
              value={form.website}
              onFocus={markStarted}
              onChange={(event) => update("website", event.target.value)}
              maxLength={1000}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              placeholder="https://..."
            />
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-slate-600">Budget / check size optional</span>
          <input
            value={form.budgetOrCheckSize}
            onFocus={markStarted}
            onChange={(event) => update("budgetOrCheckSize", event.target.value)}
            maxLength={255}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            placeholder="Optional: investor range, county monitor budget, API/data budget"
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-slate-600">Jurisdiction focus optional</span>
          <input
            value={form.jurisdictionFocus}
            onFocus={markStarted}
            onChange={(event) => update("jurisdictionFocus", event.target.value)}
            maxLength={255}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            placeholder="Texas, East Texas, county, school district, state, national"
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-slate-600">Message</span>
          <textarea
            value={form.message}
            onFocus={markStarted}
            onChange={(event) => update("message", event.target.value)}
            rows={5}
            maxLength={5000}
            className="mt-1 w-full resize-none rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold leading-6 text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            placeholder="What do you want monitored, partnered on, funded, researched, or discussed?"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-950 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {submitting ? "Sending..." : "Send Interest"}
        </button>
      </div>
    </form>
  );
}
