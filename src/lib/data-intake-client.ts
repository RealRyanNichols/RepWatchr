"use client";

import { getAttributionContext, getOrCreateAnonymousId, getOrCreateSessionId, trackEvent } from "@/lib/analytics-client";
import type { FormKey } from "@/lib/data-intake";

export interface FormAttributionContext {
  anonymousId: string;
  sessionId: string;
  route: string;
  pathname: string;
  referrer: string;
  utm: Record<string, string | undefined>;
  deviceType: string;
  browser: string;
  os: string;
}

export function getFormAttribution(): FormAttributionContext {
  const attribution = getAttributionContext();
  return {
    anonymousId: getOrCreateAnonymousId(),
    sessionId: getOrCreateSessionId(),
    route: attribution.route,
    pathname: attribution.pathname,
    referrer: attribution.referrer,
    utm: {
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      utm_term: attribution.utm_term,
      utm_content: attribution.utm_content,
    },
    deviceType: attribution.device_type,
    browser: attribution.browser,
    os: attribution.os,
  };
}

export async function submitForm(formKey: FormKey, payload: Record<string, unknown>, context = getFormAttribution()) {
  await trackEvent("form_submitted", { form_key: formKey }, { route: context.route });

  const response = await fetch("/api/forms/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ formKey, payload, context }),
  });

  const result = (await response.json().catch(() => null)) as {
    ok?: boolean;
    message?: string;
    submissionId?: string;
    status?: string;
    summary?: string;
    nextAction?: string;
    thankYouPath?: string;
    errors?: string[];
  } | null;

  if (!response.ok || !result?.ok) {
    await trackEvent("form_submit_failed", { form_key: formKey, errors: result?.errors?.join(" | ") ?? result?.message ?? "failed" }, { route: context.route });
    throw new Error(result?.message || result?.errors?.[0] || "The form could not be submitted.");
  }

  return result;
}
