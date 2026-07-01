"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

const targetTypes = [
  "Official",
  "Race",
  "School board",
  "Vote",
  "Funding",
  "Red flag",
  "Story lead",
  "Prediction",
  "Data request",
];

type SubmitState = "idle" | "submitting" | "submitted" | "error";

export default function GrowthQuestionIntakeForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");
  const [submissionId, setSubmissionId] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    targetType: targetTypes[0],
    targetName: "",
    geography: "",
    sourceUrl: "",
    questionSummary: "",
    predictionPrompt: "",
    storyAngle: "",
    publicUseConsent: false,
    commercialUseConsent: false,
  });

  const packet = useMemo(
    () =>
      [
        "RepWatchr growth-engine intake",
        `Submission ID: ${submissionId || "[created after submit]"}`,
        `Name: ${form.name || "[name]"}`,
        `Email: ${form.email || "[email]"}`,
        `Target type: ${form.targetType}`,
        `Target: ${form.targetName || "[official, race, board, vote, funder, issue]"}`,
        `Geography: ${form.geography || "[state, county, city, district]"}`,
        `Source URL: ${form.sourceUrl || "[missing source]"}`,
        `Question: ${form.questionSummary || "[public question]"}`,
        `Prediction to track: ${form.predictionPrompt || "[optional]"}`,
        `Story angle: ${form.storyAngle || "[optional]"}`,
        `Public use consent: ${form.publicUseConsent ? "yes" : "no"}`,
        `Aggregate commercial signal consent: ${form.commercialUseConsent ? "yes" : "no"}`,
      ].join("\n"),
    [form, submissionId],
  );

  function updateField(field: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");
    setSubmissionId("");

    try {
      const response = await fetch("/api/growth-question-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        submissionId?: string;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "The question packet could not be submitted.");
      }

      setState("submitted");
      setSubmissionId(result.submissionId || "");
      setMessage(result.message || "Question packet received for review.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "The question packet could not be submitted.");
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Growth intake</p>
        <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">
          Ask the question. Add the source. Let RepWatchr route it.
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          Use this for public-record questions, prediction ideas, story leads, missing visuals, and data requests.
          Keep private addresses, minor-child details, threats, and unsourced accusations out of this form.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-black text-blue-950">
          Name
          <input
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
          Target type
          <select
            value={form.targetType}
            onChange={(event) => updateField("targetType", event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            {targetTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-black text-blue-950">
          Target
          <input
            required
            value={form.targetName}
            onChange={(event) => updateField("targetName", event.target.value)}
            placeholder="Name, race, district, vote, funder, board, issue..."
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="grid gap-1 text-sm font-black text-blue-950">
          Geography
          <input
            value={form.geography}
            onChange={(event) => updateField("geography", event.target.value)}
            placeholder="Texas, Nacogdoches County, TX-01..."
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="grid gap-1 text-sm font-black text-blue-950">
          Public source URL
          <input
            type="url"
            value={form.sourceUrl}
            onChange={(event) => updateField("sourceUrl", event.target.value)}
            placeholder="https://..."
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <label className="mt-3 grid gap-1 text-sm font-black text-blue-950">
        What should RepWatchr check?
        <textarea
          required
          minLength={20}
          rows={4}
          value={form.questionSummary}
          onChange={(event) => updateField("questionSummary", event.target.value)}
          placeholder="Write the public-record question, missing source, data gap, or accountability issue."
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-black text-blue-950">
          Prediction to track
          <textarea
            rows={3}
            value={form.predictionPrompt}
            onChange={(event) => updateField("predictionPrompt", event.target.value)}
            placeholder="Example: Will this race become competitive after filing deadline?"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="grid gap-1 text-sm font-black text-blue-950">
          Blog or story angle
          <textarea
            rows={3}
            value={form.storyAngle}
            onChange={(event) => updateField("storyAngle", event.target.value)}
            placeholder="What should the article explain, and what receipt should it use?"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-3">
        <label className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-950">
          <input
            required
            type="checkbox"
            checked={form.publicUseConsent}
            onChange={(event) => updateField("publicUseConsent", event.target.checked)}
            className="mt-1 h-4 w-4 shrink-0"
          />
          I understand this is a public-record research tool, not legal advice, private investigation, or a place for
          threats, doxxing, or unsourced criminal accusations.
        </label>
        <label className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm font-bold leading-6 text-blue-950">
          <input
            type="checkbox"
            checked={form.commercialUseConsent}
            onChange={(event) => updateField("commercialUseConsent", event.target.checked)}
            className="mt-1 h-4 w-4 shrink-0"
          />
          RepWatchr may use this as an aggregate, de-identified product signal. This does not allow selling private
          identity documents or publishing private contact details.
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={state === "submitting"}
          className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "submitting" ? "Sending..." : "Submit growth question"}
        </button>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(packet)}
          className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white"
        >
          Copy packet
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
          {submissionId ? <span className="mr-2 font-black">ID: {submissionId}</span> : null}
          {message}
        </div>
      ) : null}
    </form>
  );
}
