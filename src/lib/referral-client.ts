"use client";

import { getAnonymousSessionId, trackRepWatchrEvent, type RepWatchrEventName } from "@/lib/client-analytics";
import {
  REFERRAL_STORAGE_KEY,
  sanitizeReferralCode,
  type ReferralEventType,
} from "@/lib/referral-share-campaigns";

export function getStoredReferralCode() {
  if (typeof window === "undefined") return "";
  try {
    return sanitizeReferralCode(window.localStorage.getItem(REFERRAL_STORAGE_KEY));
  } catch {
    return "";
  }
}

export function recordReferralConversion({
  eventType,
  analyticsEvent,
  route,
  entityType,
  entityId,
  metadata = {},
}: {
  eventType: ReferralEventType;
  analyticsEvent?: RepWatchrEventName;
  route?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}) {
  if (typeof window === "undefined") return;
  const referralCode = getStoredReferralCode();
  if (!referralCode) return;
  const anonymousId = getAnonymousSessionId();
  const currentRoute = route || `${window.location.pathname}${window.location.search}`;

  if (analyticsEvent) {
    trackRepWatchrEvent(analyticsEvent, {
      ...metadata,
      referral_code: referralCode,
      route: currentRoute,
      entity_type: entityType || "",
    });
  }

  fetch("/api/referrals/event", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      referralCode,
      anonymousId,
      eventType,
      route: currentRoute,
      entityType,
      entityId,
      metadata,
    }),
    keepalive: true,
  }).catch(() => {
    // Referral conversions are best-effort and must not block the product.
  });
}
