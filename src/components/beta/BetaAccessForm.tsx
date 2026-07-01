"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getAttributionContext,
  getOrCreateAnonymousId,
  trackEvent,
} from "@/lib/analytics-client";

type PackageOption = {
  packageKey: string;
  name: string;
  expectedRange: string;
  billingLabel: string;
};

type SubmissionResult = {
  ok: boolean;
  requestId?: string;
  message?: string;
  summary?: string;
};

const organizationTypes = [
  "citizen",
  "journalist",
  "campaign_public_affairs",
  "civic_group",
  "researcher",
  "legal_research",
  "school_board_parent",
  "county_watch",
  "other",
];

const urgencyOptions = ["this_week", "this_month", "before_election", "ongoing_monitoring", "not_urgent"];

export default function BetaAccessForm({
  packageOptions,
  initialPackageKey,
}: {
  packageOptions: PackageOption[];
  initialPackageKey?: string;
}) {
  const initialPackage =
    packageOptions.find((option) => option.packageKey === initialPackageKey) ?? packageOptions[0];
  const [packageKey, setPackageKey] = useState(initialPackage?.packageKey ?? "quick-record-check");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [useCase, setUseCase] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [organizationType, setOrganizationType] = useState("citizen");
  const [urgency, setUrgency] = useState("this_month");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SubmissionResult | null>(null);

  const selectedPackage = useMemo(
    () => packageOptions.find((option) => option.packageKey === packageKey) ?? packageOptions[0],
    [packageKey, packageOptions],
  );

  useEffect(() => {
    void trackEvent("pricing_experiment_viewed", {
      package_key: packageKey,
      route_type: "beta_access",
    });
  }, [packageKey]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setResult(null);
    void trackEvent("pricing_cta_clicked", { package_key: packageKey, cta: "request_beta_access" });

    const attribution = getAttributionContext();
    const anonymousId = getOrCreateAnonymousId();
    const payload = {
      anonymousId,
      packageKey,
      name,
      email,
      useCase,
      jurisdiction,
      organizationType,
      urgency,
      honeypot,
      sourceRoute: attribution.route,
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
      const response = await fetch("/api/beta-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as SubmissionResult;
      if (!response.ok || !data.ok) {
        throw new Error(data.message || "The beta request could not be submitted.");
      }
      setResult(data);
      void trackEvent("beta_access_requested", { package_key: packageKey, request_id: data.requestId ?? null });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "The beta request could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result?.ok) {
    return (
      <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.10)] sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Beta request received</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">You are in the review queue.</h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
          RepWatchr is collecting demand before launching paid packages. This does not guarantee access,
          pricing, scope, or turnaround.
        </p>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Submission ID</p>
          <p className="mt-1 break-all text-lg font-black text-blue-950">{result.requestId}</p>
          <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">{result.summary}</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/services"
            className="rounded-xl bg-blue-950 px-4 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-red-700"
          >
            View Packages
          </Link>
          <Link
            href="/submit-source"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black uppercase tracking-wide text-blue-950 hover:border-red-300 hover:text-red-700"
          >
            Submit a Source
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black uppercase tracking-wide text-blue-950 hover:border-red-300 hover:text-red-700"
          >
            Create Free Account
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.10)] sm:p-7"
    >
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Beta access</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Tell us what you need monitored.</h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
          No payment is collected here. RepWatchr is testing package demand, scope, urgency, and pricing sensitivity before checkout opens.
        </p>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold leading-6 text-red-800">
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

      <div className="mt-6 grid gap-4">
        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-slate-600">Package</span>
          <select
            value={packageKey}
            onChange={(event) => setPackageKey(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-black text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {packageOptions.map((option) => (
              <option key={option.packageKey} value={option.packageKey}>
                {option.name}
              </option>
            ))}
          </select>
          {selectedPackage ? (
            <span className="mt-2 block text-xs font-bold leading-5 text-slate-500">
              Pricing is not live. Expected ranges only appear when enabled by admin.
            </span>
          ) : null}
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Email</span>
            <input
              type="email"
              value={email}
              required
              onChange={(event) => setEmail(event.target.value)}
              maxLength={180}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Jurisdiction</span>
            <input
              value={jurisdiction}
              onChange={(event) => setJurisdiction(event.target.value)}
              maxLength={180}
              placeholder="Texas, Gregg County, Longview ISD, TX-1"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Organization type</span>
            <select
              value={organizationType}
              onChange={(event) => setOrganizationType(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-black text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {organizationTypes.map((option) => (
                <option key={option} value={option}>
                  {option.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-slate-600">Urgency</span>
          <select
            value={urgency}
            onChange={(event) => setUrgency(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-black text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {urgencyOptions.map((option) => (
              <option key={option} value={option}>
                {option.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-slate-600">Use case</span>
          <textarea
            value={useCase}
            required
            onChange={(event) => setUseCase(event.target.value)}
            rows={6}
            maxLength={3000}
            placeholder="What public records, officials, races, boards, sources, or monitoring work do you need organized?"
            className="mt-1 w-full resize-none rounded-xl border border-slate-300 px-3 py-3 text-sm font-semibold leading-6 text-slate-950 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">
          This request is for source organization, public-record review, civic intelligence, and package demand testing.
          RepWatchr does not promise legal advice, private investigation, guaranteed publication, or political results.
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-950 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {submitting ? "Submitting..." : "Request Beta Access"}
        </button>
      </div>
    </form>
  );
}
