"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { submitForm } from "@/lib/data-intake-client";

const interestTypes = [
  "Data licensing",
  "Custom political report",
  "Verified constituent panel",
  "Campaign research desk",
  "Claimed profile / official response",
  "Partnership",
];

type SubmitState = "idle" | "submitting" | "submitted" | "error";

export default function DataProductInterestForm() {
  const router = useRouter();
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    organization: "",
    interestType: interestTypes[0],
    geography: "",
    useCase: "",
    budgetRange: "",
    consent: false,
  });

  const packet = useMemo(
    () =>
      [
        "RepWatchr data access request",
        `Name: ${form.name || "[name]"}`,
        `Email: ${form.email || "[email]"}`,
        `Organization: ${form.organization || "[organization]"}`,
        `Interest: ${form.interestType}`,
        `Geography: ${form.geography || "[geography]"}`,
        `Use case: ${form.useCase || "[use case]"}`,
        `Budget range: ${form.budgetRange || "[optional]"}`,
      ].join("\n"),
    [form],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");

    try {
      const result = await submitForm("research_request", {
        name: form.name,
        email: form.email,
        organization: form.organization,
        target: form.interestType,
        jurisdiction: form.geography,
        sourceUrl: "",
        useCase: form.useCase,
        budgetRange: form.budgetRange,
        consent: form.consent,
      });
      try {
        window.sessionStorage.setItem(`repwatchr.intakeSummary.${result.submissionId}`, result.summary || packet);
        window.sessionStorage.setItem(`repwatchr.intakeNextAction.${result.submissionId}`, result.nextAction || "");
      } catch {
        // The thank-you route can still fetch status by submission ID.
      }

      setState("submitted");
      setMessage(result.message || "Request received. RepWatchr can follow up with the right data lane.");
      router.push(result.thankYouPath || "/intake/thank-you?form=research_request");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "The request could not be submitted.");
    }
  }

  function updateField(field: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
          Data desk
        </p>
        <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">
          Tell RepWatchr what political data you want.
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          Use this for licensing, custom reports, constituent panels, campaign research, profile claims, and
          partnerships. Keep sensitive private details out of this form.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-black text-blue-950">
          Name
          <input
            required
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            autoComplete="name"
          />
        </label>
        <label className="grid gap-1 text-sm font-black text-blue-950">
          Email
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            autoComplete="email"
          />
        </label>
        <label className="grid gap-1 text-sm font-black text-blue-950">
          Organization
          <input
            value={form.organization}
            onChange={(event) => updateField("organization", event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            autoComplete="organization"
          />
        </label>
        <label className="grid gap-1 text-sm font-black text-blue-950">
          Interest
          <select
            value={form.interestType}
            onChange={(event) => updateField("interestType", event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            {interestTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-black text-blue-950">
          Geography
          <input
            value={form.geography}
            onChange={(event) => updateField("geography", event.target.value)}
            placeholder="Texas, East Texas, county, district, race..."
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="grid gap-1 text-sm font-black text-blue-950">
          Budget range
          <input
            value={form.budgetRange}
            onChange={(event) => updateField("budgetRange", event.target.value)}
            placeholder="Optional"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <label className="mt-3 grid gap-1 text-sm font-black text-blue-950">
        Use case
        <textarea
          required
          minLength={20}
          rows={4}
          value={form.useCase}
          onChange={(event) => updateField("useCase", event.target.value)}
          placeholder="What decision, race, issue, district, official, or dataset are you trying to understand?"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <label className="mt-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-950">
        <input
          required
          type="checkbox"
          checked={form.consent}
          onChange={(event) => updateField("consent", event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0"
        />
        I understand this is a data access inquiry, not legal advice or a promise of political results.
      </label>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={state === "submitting"}
          className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "submitting" ? "Sending..." : "Request data access"}
        </button>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(packet)}
          className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white"
        >
          Copy request packet
        </button>
      </div>

      {message ? (
        <div
          className={`mt-4 rounded-lg border p-3 text-sm font-bold ${
            state === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
          role="status"
        >
          {message}
        </div>
      ) : null}
    </form>
  );
}
