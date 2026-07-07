"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getAnonymousSessionId, trackRepWatchrEvent } from "@/lib/client-analytics";
import { REFERRAL_QUERY_PARAM, REFERRAL_STORAGE_KEY, sanitizeReferralCode } from "@/lib/referral-share-campaigns";

function currentRoute() {
  return `${window.location.pathname}${window.location.search}`;
}

function eventStorageKey(code: string, route: string) {
  const bucket = Math.floor(Date.now() / 30_000);
  return `repwatchr.referralVisit:${code}:${route}:${bucket}`;
}

export default function ReferralAttributionTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const code = sanitizeReferralCode(params.get(REFERRAL_QUERY_PARAM) || params.get("ref"));
    if (!code) return;

    try {
      window.localStorage.setItem(REFERRAL_STORAGE_KEY, code);
    } catch {
      // Referral attribution must never break navigation.
    }

    const route = currentRoute();
    try {
      const storageKey = eventStorageKey(code, route);
      if (window.sessionStorage.getItem(storageKey)) return;
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      // Continue with best-effort event tracking.
    }

    const anonymousId = getAnonymousSessionId();
    trackRepWatchrEvent("referral_visit", {
      referral_code: code,
      route,
    });

    window.setTimeout(() => {
      fetch("/api/referrals/event", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          referralCode: code,
          anonymousId,
          eventType: "referral_visit",
          route,
        }),
        keepalive: true,
      }).catch(() => {
        // Referral tracking is best-effort and never user-blocking.
      });
    }, 0);
  }, [pathname]);

  return null;
}
