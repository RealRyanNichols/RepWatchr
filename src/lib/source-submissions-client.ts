"use client";

import {
  getAttributionContext,
  getOrCreateAnonymousId,
  getOrCreateSessionId,
  trackEvent,
} from "@/lib/analytics-client";

export function getSourceSubmissionContext() {
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

export async function submitSource(payload: Record<string, unknown>) {
  const context = getSourceSubmissionContext();
  await trackEvent("source_submit_started", {
    target_type: payload.targetType,
    source_type: payload.sourceType,
  });

  const response = await fetch("/api/sources/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload, context }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    await trackEvent("source_submit_failed", {
      target_type: payload.targetType,
      source_type: payload.sourceType,
      message: data?.message ?? "source_submit_failed",
    });
    throw new Error(data?.message ?? "The source could not be submitted.");
  }

  return data as {
    ok: true;
    stored: boolean;
    submissionId: string;
    submissionStatus: string;
    label: string;
    summary: string;
    message: string;
    thankYouPath: string;
  };
}
