"use client";

import Link from "next/link";
import { useState } from "react";
import { track } from "@vercel/analytics";
import { trackRepWatchrEvent } from "@/lib/client-analytics";

type ServiceCheckoutButtonProps = {
  serviceSlug: string;
  label: string;
  fallbackHref: string;
  paymentsEnabled: boolean;
  className: string;
};

type CheckoutResponse = {
  url?: string;
  fallback?: boolean;
  fallbackHref?: string;
  error?: string;
};

export default function ServiceCheckoutButton({
  serviceSlug,
  label,
  fallbackHref,
  paymentsEnabled,
  className,
}: ServiceCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestHref = `${fallbackHref}?request=1#request-package`;
  const betaAccessHref = `${fallbackHref}#beta-access`;

  if (!paymentsEnabled) {
    return (
      <Link href={betaAccessHref} className={className}>
        Request beta access
      </Link>
    );
  }

  async function startCheckout() {
    if (loading) return;
    setLoading(true);
    setError("");
    track("checkout_started", { service_slug: serviceSlug });
    trackRepWatchrEvent("checkout_started", { service_slug: serviceSlug });

    try {
      const response = await fetch("/api/stripe/service-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceSlug }),
      });
      const data = (await response.json().catch(() => null)) as CheckoutResponse | null;

      if (data?.url) {
        window.location.assign(data.url);
        return;
      }

      if (data?.fallback) {
        window.location.assign(data.fallbackHref ?? requestHref);
        return;
      }

      setError(data?.error ?? "Checkout could not start. Use the request form.");
    } catch {
      setError("Checkout could not start. Use the request form.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <button type="button" onClick={startCheckout} disabled={loading} className={className}>
        {loading ? "Opening Checkout..." : label}
      </button>
      {error ? (
        <Link href={requestHref} className="text-center text-xs font-black uppercase tracking-wide text-red-700">
          {error}
        </Link>
      ) : null}
    </div>
  );
}
