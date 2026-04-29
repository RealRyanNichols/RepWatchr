"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const excludedPrefixes = ["/admin", "/api", "/auth", "/dashboard", "/login", "/create-account"];

function shouldTrack(pathname: string) {
  if (!pathname.startsWith("/")) return false;
  return !excludedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function getReferrerHost() {
  if (!document.referrer) return "";
  try {
    return new URL(document.referrer).hostname.slice(0, 120);
  } catch {
    return "";
  }
}

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || !shouldTrack(pathname)) return;

    const windowBucket = Math.floor(Date.now() / 15_000);
    const storageKey = `repwatchr-page-view:${pathname}:${windowBucket}`;

    try {
      if (sessionStorage.getItem(storageKey)) return;
      sessionStorage.setItem(storageKey, "1");
    } catch {
      // Analytics must never break navigation when browser storage is blocked.
    }

    const body = JSON.stringify({
      path: pathname,
      referrerHost: getReferrerHost(),
    });

    window.setTimeout(() => {
      fetch("/api/analytics/page-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {
        // Best-effort telemetry only.
      });
    }, 0);
  }, [pathname]);

  return null;
}
