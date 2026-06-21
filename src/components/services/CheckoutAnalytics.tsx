"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";
import { trackRepWatchrEvent } from "@/lib/client-analytics";

type CheckoutAnalyticsProps = {
  eventName: "checkout_completed" | "checkout_canceled" | "subscription_started";
  serviceSlug?: string;
  stripeCheckoutSessionId?: string;
  payload?: Record<string, unknown>;
};

export default function CheckoutAnalytics({
  eventName,
  serviceSlug,
  stripeCheckoutSessionId,
  payload,
}: CheckoutAnalyticsProps) {
  useEffect(() => {
    track(eventName, {
      service_slug: serviceSlug,
      checkout_session_id: stripeCheckoutSessionId,
      ...(payload ?? {}),
    });

    trackRepWatchrEvent(eventName, {
      service_slug: serviceSlug,
      checkout_session_id: stripeCheckoutSessionId,
    });
  }, [eventName, payload, serviceSlug, stripeCheckoutSessionId]);

  return null;
}
