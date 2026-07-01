"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@vercel/analytics";

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

function getSessionDepth(pathname: string) {
  try {
    const seenRaw = sessionStorage.getItem("repwatchr-session-pages");
    const seen = new Set<string>(seenRaw ? JSON.parse(seenRaw) : []);
    seen.add(pathname);
    sessionStorage.setItem("repwatchr-session-pages", JSON.stringify(Array.from(seen).slice(-100)));
    return seen.size;
  } catch {
    return 1;
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

    const sessionPageDepth = getSessionDepth(pathname);
    track("pages_per_session_progress", {
      path: pathname,
      session_page_depth: sessionPageDepth,
      target_pages_per_session: 8,
      target_met: sessionPageDepth >= 8,
    });

    const body = JSON.stringify({
      path: pathname,
      referrerHost: getReferrerHost(),
      sessionPageDepth,
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
