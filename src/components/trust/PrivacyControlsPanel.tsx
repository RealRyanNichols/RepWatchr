"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getAttributionContext, getOrCreateAnonymousId, trackEvent } from "@/lib/analytics-client";
import { PRIVACY_REQUEST_TYPES, type PrivacyRequestType } from "@/lib/trust-safety";

type PrivacyResponse = {
  ok: boolean;
  requestId?: string;
  resetApplied?: boolean;
  message?: string;
};

export default function PrivacyControlsPanel({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const [requestType, setRequestType] = useState<PrivacyRequestType>("access");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void trackEvent("privacy_page_open", { panel: compact ? "compact" : "full" });
  }, [compact]);

  async function resetInterestProfile() {
    setResetting(true);
    setNotice("");
    setError("");
    try {
      const attribution = getAttributionContext();
      const response = await fetch("/api/privacy/interest-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymousId: getOrCreateAnonymousId(),
          sourceRoute: attribution.route,
          referrer: attribution.referrer,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as PrivacyResponse;
      if (!response.ok || !data.ok) throw new Error(data.message || "Interest profile reset could not be completed.");
      setNotice(data.message || "Interest profile reset request processed.");
      void trackEvent("interest_profile_reset", { reset_applied: data.resetApplied ?? false });
      void trackEvent("privacy_control_used", { control: "interest_profile_reset" });
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Interest profile reset could not be completed.");
    } finally {
      setResetting(false);
    }
  }

  async function submitPrivacyRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setNotice("");
    setError("");
    try {
      const attribution = getAttributionContext();
      const response = await fetch("/api/privacy-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymousId: getOrCreateAnonymousId(),
          email: user?.email ?? email,
          requestType,
          message,
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
        }),
      });
      const data = (await response.json().catch(() => ({}))) as PrivacyResponse;
      if (!response.ok || !data.ok) throw new Error(data.message || "Privacy request could not be submitted.");
      setNotice(`Privacy request received. Request ID: ${data.requestId}`);
      setMessage("");
      setHoneypot("");
      void trackEvent("privacy_request_submitted", { request_type: requestType, request_id: data.requestId ?? null });
      void trackEvent("privacy_control_used", { control: "privacy_request", request_type: requestType });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Privacy request could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={`rounded-3xl border border-blue-100 bg-white shadow-sm ${compact ? "p-5" : "p-5 sm:p-7"}`}>
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Privacy controls</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Control the data RepWatchr uses to make the product useful.</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            RepWatchr uses first-party analytics, watchlists, source submissions, and interest signals to improve public-record workflows. It does not sell personal political-interest profiles or private watchlists.
          </p>
          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={resetInterestProfile}
              disabled={resetting}
              className="rounded-2xl bg-blue-950 px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resetting ? "Resetting..." : "Reset interest profile"}
            </button>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700">
              Watchlist deletion, digest opt-outs, contributor visibility, account deletion, and access requests are handled through the request queue until account-specific dashboards are fully wired.
            </div>
          </div>
        </div>

        <form onSubmit={submitPrivacyRequest} className="grid gap-4">
          <label className="grid gap-1 text-sm font-black text-blue-950">
            Request type
            <select
              value={requestType}
              onChange={(event) => setRequestType(event.target.value as PrivacyRequestType)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-800"
            >
              {PRIVACY_REQUEST_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          {!user?.email ? (
            <label className="grid gap-1 text-sm font-black text-blue-950">
              Email
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
                className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-800"
                placeholder="you@example.com"
              />
            </label>
          ) : null}
          <label className="grid gap-1 text-sm font-black text-blue-950">
            Request details
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={5}
              required
              minLength={8}
              maxLength={3000}
              className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-800"
              placeholder="Tell RepWatchr what privacy control, access request, deletion request, or correction you need reviewed."
            />
          </label>
          <label className="sr-only">
            Leave this field blank
            <input value={honeypot} onChange={(event) => setHoneypot(event.target.value)} tabIndex={-1} autoComplete="off" />
          </label>
          {notice ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{notice}</p> : null}
          {error ? <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-2xl bg-red-700 px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit privacy request"}
          </button>
        </form>
      </div>
    </section>
  );
}
