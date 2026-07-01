"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { usePathname } from "next/navigation";
import { canonicalEventName, type AnalyticsEventName } from "@/lib/analytics-taxonomy";

const anonymousIdKey = "repwatchr_visitor_id";
const sessionIdKey = "repwatchr_session_id";
const attributionKey = "repwatchr_first_attribution";

let memoryAnonymousId = "";
let memorySessionId = "";

export interface AttributionContext {
  route: string;
  pathname: string;
  referrer: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  device_type: string;
  browser: string;
  os: string;
}

export interface TrackEventOptions {
  route?: string;
  pathname?: string;
  referrer?: string;
  userId?: string;
  sessionId?: string;
  anonymousId?: string;
  eventFamily?: string;
  metadata?: Record<string, unknown>;
}

function createTrackingId(prefix: "rwv" | "rws") {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
  return `${prefix}_${random}`;
}

function readBrowserId(key: string, prefix: "rwv" | "rws") {
  const memoryValue = prefix === "rwv" ? memoryAnonymousId : memorySessionId;
  try {
    const storage = prefix === "rwv" ? window.localStorage : window.sessionStorage;
    const existing = storage.getItem(key);
    if (existing && /^[a-zA-Z0-9:_-]{16,120}$/.test(existing)) return existing;
    const next = memoryValue || createTrackingId(prefix);
    storage.setItem(key, next);
    if (prefix === "rwv") memoryAnonymousId = next;
    if (prefix === "rws") memorySessionId = next;
    return next;
  } catch {
    if (memoryValue) return memoryValue;
    const next = createTrackingId(prefix);
    if (prefix === "rwv") memoryAnonymousId = next;
    if (prefix === "rws") memorySessionId = next;
    return next;
  }
}

export function getOrCreateAnonymousId() {
  if (typeof window === "undefined") return "";
  return readBrowserId(anonymousIdKey, "rwv");
}

export function getOrCreateSessionId() {
  if (typeof window === "undefined") return "";
  return readBrowserId(sessionIdKey, "rws");
}

function browserName(userAgent: string) {
  if (/edg/i.test(userAgent)) return "edge";
  if (/chrome|chromium|crios/i.test(userAgent)) return "chrome";
  if (/firefox|fxios/i.test(userAgent)) return "firefox";
  if (/safari/i.test(userAgent)) return "safari";
  return "unknown";
}

function osName(userAgent: string) {
  if (/iphone|ipad|ios/i.test(userAgent)) return "ios";
  if (/android/i.test(userAgent)) return "android";
  if (/mac os|macintosh/i.test(userAgent)) return "macos";
  if (/windows/i.test(userAgent)) return "windows";
  if (/linux/i.test(userAgent)) return "linux";
  return "unknown";
}

function deviceType(userAgent: string) {
  if (/(bot|crawler|spider|crawling|preview|slurp)/i.test(userAgent)) return "bot";
  if (/(ipad|tablet)/i.test(userAgent)) return "tablet";
  if (/(mobile|iphone|android)/i.test(userAgent)) return "mobile";
  return "desktop";
}

function sanitizeRoute(value: string) {
  const route = value.trim().split("?")[0]?.split("#")[0] || "/";
  return route.startsWith("/") ? route.slice(0, 500) : "/";
}

function currentRoute() {
  if (typeof window === "undefined") return "/";
  return sanitizeRoute(window.location.pathname || "/");
}

function currentReferrer() {
  if (typeof document === "undefined" || !document.referrer) return "";
  return document.referrer.slice(0, 500);
}

function utmFromSearch() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source")?.slice(0, 120) || undefined,
    utm_medium: params.get("utm_medium")?.slice(0, 120) || undefined,
    utm_campaign: params.get("utm_campaign")?.slice(0, 160) || undefined,
    utm_term: params.get("utm_term")?.slice(0, 160) || undefined,
    utm_content: params.get("utm_content")?.slice(0, 160) || undefined,
  };
}

export function getAttributionContext(): AttributionContext {
  if (typeof window === "undefined") {
    return {
      route: "/",
      pathname: "/",
      referrer: "",
      device_type: "unknown",
      browser: "unknown",
      os: "unknown",
    };
  }

  const route = currentRoute();
  const userAgent = window.navigator.userAgent || "";
  const context: AttributionContext = {
    route,
    pathname: route,
    referrer: currentReferrer(),
    ...utmFromSearch(),
    device_type: deviceType(userAgent),
    browser: browserName(userAgent),
    os: osName(userAgent),
  };

  try {
    if (!localStorage.getItem(attributionKey)) localStorage.setItem(attributionKey, JSON.stringify(context));
  } catch {
    // Attribution is useful but should never break the app.
  }

  return context;
}

export async function trackEvent(
  eventName: AnalyticsEventName | string,
  metadata: Record<string, unknown> = {},
  options: TrackEventOptions = {},
) {
  if (typeof window === "undefined") return;
  const canonical = canonicalEventName(eventName);
  if (!canonical) return;

  const attribution = getAttributionContext();
  const route = sanitizeRoute(options.route || options.pathname || attribution.route);

  const body = {
    eventName: canonical,
    eventFamily: options.eventFamily,
    anonymousId: options.anonymousId || getOrCreateAnonymousId(),
    userId: options.userId,
    sessionId: options.sessionId || getOrCreateSessionId(),
    route,
    pathname: route,
    path: route,
    referrer: options.referrer ?? attribution.referrer,
    utm_source: attribution.utm_source,
    utm_medium: attribution.utm_medium,
    utm_campaign: attribution.utm_campaign,
    utm_term: attribution.utm_term,
    utm_content: attribution.utm_content,
    deviceType: attribution.device_type,
    browser: attribution.browser,
    os: attribution.os,
    metadata,
  };

  try {
    await fetch("/api/analytics/visitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    // First-party analytics must never break navigation.
  }
}

export function useTrackPageView(metadata: Record<string, unknown> = {}) {
  const pathname = usePathname();
  const metadataRef = useRef(metadata);

  useEffect(() => {
    metadataRef.current = metadata;
  }, [metadata]);

  useEffect(() => {
    if (!pathname) return;
    void trackEvent("page_view", metadataRef.current, { route: pathname });
  }, [pathname]);
}

export function useTrackClick(
  eventName: AnalyticsEventName | string,
  metadata: Record<string, unknown> = {},
) {
  const metadataRef = useRef(metadata);

  useEffect(() => {
    metadataRef.current = metadata;
  }, [metadata]);

  return useCallback(() => {
    void trackEvent(eventName, metadataRef.current);
  }, [eventName]);
}

export function useTrackFormStep(formName: string) {
  return useCallback((stepName: AnalyticsEventName | string, metadata: Record<string, unknown> = {}) => {
    void trackEvent(stepName, { ...metadata, form_name: formName });
  }, [formName]);
}

export function useTrackSectionView<T extends Element>(
  ref: RefObject<T | null>,
  sectionName: string,
  metadata: Record<string, unknown> = {},
) {
  const trackedRef = useRef(false);
  const metadataRef = useRef(metadata);

  useEffect(() => {
    metadataRef.current = metadata;
  }, [metadata]);

  useEffect(() => {
    const node = ref.current;
    if (!node || trackedRef.current || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (trackedRef.current) return;
        if (entries.some((entry) => entry.isIntersecting)) {
          trackedRef.current = true;
          void trackEvent("profile_section_viewed", { ...metadataRef.current, section_name: sectionName });
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, sectionName]);
}
