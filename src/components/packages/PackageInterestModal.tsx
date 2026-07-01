"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import {
  PACKAGE_BUDGET_RANGES,
  PACKAGE_ORGANIZATION_TYPES,
  PACKAGE_URGENCY_OPTIONS,
  type RepWatchrPackage,
} from "@/data/repwatchr-packages";
import { getAttributionContext, getOrCreateAnonymousId, trackEvent } from "@/lib/analytics-client";

type SubmissionResult = {
  ok: boolean;
  submissionId?: string;
  message?: string;
  summary?: string;
};

const entityTypes = [
  "official",
  "race",
  "agency",
  "school board",
  "county",
  "city",
  "court",
  "issue",
  "source",
  "other",
] as const;

export default function PackageInterestModal({
  packageItem,
  buttonLabel,
  buttonClassName,
}: {
  packageItem: RepWatchrPackage;
  buttonLabel?: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [useCase, setUseCase] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [entityType, setEntityType] = useState<(typeof entityTypes)[number]>("official");
  const [entityId, setEntityId] = useState("");
  const [urgency, setUrgency] = useState<(typeof PACKAGE_URGENCY_OPTIONS)[number]>("this month");
  const [organizationType, setOrganizationType] =
    useState<(typeof PACKAGE_ORGANIZATION_TYPES)[number]>("individual citizen");
  const [budgetRange, setBudgetRange] = useState<(typeof PACKAGE_BUDGET_RANGES)[number]>("not sure yet");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SubmissionResult | null>(null);

  function openModal() {
    setOpen(true);
    void trackEvent("package_interest_clicked", {
      package_key: packageItem.packageKey,
      package_slug: packageItem.slug,
      package_name: packageItem.name,
    });
  }

  function closeModal() {
    if (dirty && !result?.ok) {
      void trackEvent("package_interest_abandoned", {
        package_key: packageItem.packageKey,
        package_slug: packageItem.slug,
      });
    }
    setOpen(false);
  }

  function markDirty() {
    if (!dirty) setDirty(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setResult(null);

    const attribution = getAttributionContext();
    const payload = {
      anonymousId: getOrCreateAnonymousId(),
      packageKey: packageItem.packageKey,
      email,
      name,
      useCase,
      jurisdiction,
      entityType,
      entityId,
      urgency,
      organizationType,
      budgetRange,
      message,
      honeypot,
      sourceRoute: attribution.route || `/packages/${packageItem.slug}`,
      referrer: attribution.referrer,
      utm: {
        utm_source: attribution.utm_source,
        utm_medium: attribution.utm_medium,
        utm_campaign: attribution.utm_campaign,
        utm_term: attribution.utm_term,
        utm_content: attribution.utm_content,
      },
    };

    try {
      const response = await fetch("/api/package-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as SubmissionResult;
      if (!response.ok || !data.ok) {
        throw new Error(data.message || "The package interest request could not be submitted.");
      }
      setResult(data);
      setDirty(false);
      void trackEvent("package_interest_submitted", {
        package_key: packageItem.packageKey,
        package_slug: packageItem.slug,
        package_interest_id: data.submissionId ?? null,
        urgency,
        organization_type: organizationType,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The package interest request could not be submitted.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={
          buttonClassName ??
          "inline-flex min-h-12 items-center justify-center rounded-2xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[0_16px_35px_rgba(185,28,28,0.24)] transition hover:-translate-y-0.5 hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
        }
      >
        {buttonLabel ?? packageItem.ctaLabels[0] ?? "I want this"}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`package-interest-${packageItem.slug}`}
        >
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/15 bg-white shadow-[0_35px_100px_rgba(0,0,0,0.35)]">
            <div className="h-1.5 bg-[linear-gradient(90deg,#b91c1c_0%,#f5d061_36%,#f8fafc_50%,#2563eb_100%)]" />
            <div className="p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Package interest</p>
                  <h2
                    id={`package-interest-${packageItem.slug}`}
                    className="mt-2 text-3xl font-black tracking-tight text-slate-950"
                  >
                    {packageItem.name}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-700">
                    No payment is collected here. RepWatchr is measuring demand, scope, urgency, and fulfillment fit before checkout opens.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-700 hover:border-red-300 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                >
                  Close
                </button>
              </div>

              {result?.ok ? (
                <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Request received</p>
                  <h3 className="mt-2 text-2xl font-black text-slate-950">This is now a demand signal.</h3>
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                    RepWatchr will use this to decide what packages deserve beta testing, manual fulfillment, and eventually checkout.
                  </p>
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">Submission ID</p>
                    <p className="mt-1 break-all text-lg font-black text-blue-950">{result.submissionId}</p>
                    <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
                      {result.summary}
                    </p>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href="/free-packet"
                      className="rounded-xl bg-blue-950 px-4 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-red-700"
                      onClick={() =>
                        void trackEvent("free_tool_clicked_from_package", {
                          package_key: packageItem.packageKey,
                          tool: "free_packet",
                        })
                      }
                    >
                      Build Free Packet
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black uppercase tracking-wide text-blue-950 hover:border-red-300 hover:text-red-700"
                    >
                      Create Free Account
                    </Link>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black uppercase tracking-wide text-blue-950 hover:border-red-300 hover:text-red-700"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
                  {error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold leading-6 text-red-800">
                      {error}
                    </div>
                  ) : null}

                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(event) => setHoneypot(event.target.value)}
                    className="hidden"
                    aria-hidden="true"
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-wide text-slate-600">Email</span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(event) => {
                          markDirty();
                          setEmail(event.target.value);
                        }}
                        maxLength={180}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-wide text-slate-600">Name optional</span>
                      <input
                        value={name}
                        onChange={(event) => {
                          markDirty();
                          setName(event.target.value);
                        }}
                        maxLength={120}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-wide text-slate-600">Jurisdiction</span>
                      <input
                        value={jurisdiction}
                        onChange={(event) => {
                          markDirty();
                          setJurisdiction(event.target.value);
                        }}
                        maxLength={180}
                        placeholder="Texas, Gregg County, Longview ISD, TX-1"
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-wide text-slate-600">Target type</span>
                      <select
                        value={entityType}
                        onChange={(event) => {
                          markDirty();
                          setEntityType(event.target.value as (typeof entityTypes)[number]);
                        }}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-black text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      >
                        {entityTypes.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-wide text-slate-600">
                      Target official, race, agency, or board optional
                    </span>
                    <input
                      value={entityId}
                      onChange={(event) => {
                        markDirty();
                        setEntityId(event.target.value);
                      }}
                      maxLength={180}
                      placeholder="Ted Cruz, Nacogdoches County election, Bowie County, Longview ISD"
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-wide text-slate-600">Urgency</span>
                      <select
                        value={urgency}
                        onChange={(event) => {
                          markDirty();
                          setUrgency(event.target.value as (typeof PACKAGE_URGENCY_OPTIONS)[number]);
                        }}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-black text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      >
                        {PACKAGE_URGENCY_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-wide text-slate-600">Organization</span>
                      <select
                        value={organizationType}
                        onChange={(event) => {
                          markDirty();
                          setOrganizationType(event.target.value as (typeof PACKAGE_ORGANIZATION_TYPES)[number]);
                        }}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-black text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      >
                        {PACKAGE_ORGANIZATION_TYPES.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-wide text-slate-600">Budget optional</span>
                      <select
                        value={budgetRange}
                        onChange={(event) => {
                          markDirty();
                          setBudgetRange(event.target.value as (typeof PACKAGE_BUDGET_RANGES)[number]);
                        }}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-black text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      >
                        {PACKAGE_BUDGET_RANGES.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-wide text-slate-600">Use case</span>
                    <textarea
                      required
                      value={useCase}
                      onChange={(event) => {
                        markDirty();
                        setUseCase(event.target.value);
                      }}
                      rows={5}
                      maxLength={3000}
                      placeholder="What public records, officials, races, agencies, meetings, sources, or monitoring work do you need organized?"
                      className="mt-1 w-full resize-none rounded-xl border border-slate-300 px-3 py-3 text-sm font-semibold leading-6 text-slate-950 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-wide text-slate-600">Message optional</span>
                    <textarea
                      value={message}
                      onChange={(event) => {
                        markDirty();
                        setMessage(event.target.value);
                      }}
                      rows={3}
                      maxLength={2000}
                      placeholder="Deadline, source links, or context RepWatchr should know before deciding whether this package is ready."
                      className="mt-1 w-full resize-none rounded-xl border border-slate-300 px-3 py-3 text-sm font-semibold leading-6 text-slate-950 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">
                    Keep it source-safe. Do not submit private home addresses, minor children, threats, harassment
                    instructions, or unsupported criminal accusations.
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="min-h-12 rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-950 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                  >
                    {submitting ? "Submitting..." : "Submit package interest"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
