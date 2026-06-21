"use client";

import { useState, type FormEvent } from "react";

type InterestResponse = {
  ok?: boolean;
  id?: string;
  error?: string;
};

const interestTypes = [
  "Investor interest",
  "Strategic partner",
  "Data/API partner",
  "Civic media partner",
  "Election research partner",
  "Contributor network",
];

export default function PartnerInterestForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    organization: "",
    interestType: interestTypes[0],
    checkSizeOrPartnershipType: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setNotice("");
    setError("");

    try {
      const response = await fetch("/api/investor-interest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json().catch(() => null)) as InterestResponse | null;
      if (!response.ok || !data?.ok) {
        setError(data?.error || "Interest form could not be saved. Try again later.");
        return;
      }
      setNotice(`Interest saved. Reference ID: ${data.id}`);
      setForm({
        name: "",
        email: "",
        organization: "",
        interestType: interestTypes[0],
        checkSizeOrPartnershipType: "",
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
        This is an interest form, not a public securities offering. RepWatchr can follow up with proper materials when appropriate.
      </p>

      {notice ? <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-950">{notice}</div> : null}
      {error ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-950">{error}</div> : null}

      <div className="mt-5 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Name</span>
            <input
              value={form.name}
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
              onChange={(event) => update("organization", event.target.value)}
              maxLength={255}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Interest type</span>
            <select
              value={form.interestType}
              onChange={(event) => update("interestType", event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-black text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              {interestTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-slate-600">Check size or partnership type optional</span>
          <input
            value={form.checkSizeOrPartnershipType}
            onChange={(event) => update("checkSizeOrPartnershipType", event.target.value)}
            maxLength={255}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            placeholder="Optional: angel, strategic, data/API, media, contributor network"
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-slate-600">Message</span>
          <textarea
            value={form.message}
            onChange={(event) => update("message", event.target.value)}
            rows={5}
            maxLength={5000}
            className="mt-1 w-full resize-none rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold leading-6 text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            placeholder="What should RepWatchr know about your interest?"
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
