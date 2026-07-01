"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  VISITOR_INTELLIGENCE_EVENT,
  getAttributionContext,
  type VisitorIntelligenceEventDetail,
} from "@/lib/visitor-intelligence-client";

const excludedPrefixes = ["/admin", "/api", "/auth", "/dashboard", "/login", "/create-account"];
const visitorIdKey = "repwatchr_visitor_id";
const sessionIdKey = "repwatchr_session_id";
const sessionPagesKey = "repwatchr-visitor-session-pages";
const sessionEntryKey = "repwatchr-visitor-entry-page";
const mergeKey = "repwatchr_visitor_merged";
const queueKey = "repwatchr_visitor_event_queue";

let memoryVisitorId = "";
let memorySessionId = "";

type VisitorPayload = VisitorIntelligenceEventDetail & {
  eventName?: string;
  anonymousId: string;
  sessionId: string;
  route?: string;
  pathname?: string;
  referrer?: string;
  entryPage?: string;
  exitPage?: string;
  referrerHost?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  sessionDepth?: number;
  timeSpentMs?: number;
  scrollPercent?: number;
};

function shouldTrack(pathname: string) {
  if (!pathname.startsWith("/")) return false;
  return !excludedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function shouldTrackExplicitPrivateEvent(eventType: string) {
  return (
    eventType === "admin_dashboard_opened" ||
    eventType === "admin_open" ||
    eventType.startsWith("dashboard_") ||
    eventType === "watchlist_open" ||
    eventType === "packet_open" ||
    eventType === "saved_search_open" ||
    eventType === "digest_settings_changed" ||
    eventType === "interest_profile_reset" ||
    eventType === "package_interest_clicked_from_dashboard"
  );
}

function createTrackingId(prefix: "rwv" | "rws") {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
  return `${prefix}_${random}`;
}

function readLocalId(key: string, prefix: "rwv" | "rws") {
  const memoryValue = prefix === "rwv" ? memoryVisitorId : memorySessionId;
  try {
    const storage = prefix === "rwv" ? window.localStorage : window.sessionStorage;
    const existing = storage.getItem(key);
    if (existing && /^[a-zA-Z0-9:_-]{16,120}$/.test(existing)) return existing;
    const next = memoryValue || createTrackingId(prefix);
    storage.setItem(key, next);
    if (prefix === "rwv") memoryVisitorId = next;
    if (prefix === "rws") memorySessionId = next;
    return next;
  } catch {
    if (memoryValue) return memoryValue;
    const next = createTrackingId(prefix);
    if (prefix === "rwv") memoryVisitorId = next;
    if (prefix === "rws") memorySessionId = next;
    return next;
  }
}

function getAnonymousId() {
  return readLocalId(visitorIdKey, "rwv");
}

function getSessionId() {
  return readLocalId(sessionIdKey, "rws");
}

function getReferrerHost() {
  if (!document.referrer) return "";
  try {
    return new URL(document.referrer).hostname.slice(0, 120);
  } catch {
    return "";
  }
}

function getEntryPage(pathname: string) {
  try {
    const existing = sessionStorage.getItem(sessionEntryKey);
    if (existing?.startsWith("/")) return existing;
    sessionStorage.setItem(sessionEntryKey, pathname);
  } catch {
    // Storage can be blocked. Entry page is best-effort only.
  }
  return pathname;
}

function getSessionDepth(pathname: string) {
  try {
    const seenRaw = sessionStorage.getItem(sessionPagesKey);
    const seen = new Set<string>(seenRaw ? JSON.parse(seenRaw) : []);
    seen.add(pathname);
    sessionStorage.setItem(sessionPagesKey, JSON.stringify(Array.from(seen).slice(-200)));
    return seen.size;
  } catch {
    return 1;
  }
}

function currentScrollPercent() {
  const root = document.documentElement;
  const scrollable = Math.max(1, root.scrollHeight - window.innerHeight);
  return Math.max(0, Math.min(100, Math.round((window.scrollY / scrollable) * 100)));
}

function getQueryValue(names: string[]) {
  try {
    const params = new URLSearchParams(window.location.search);
    for (const name of names) {
      const value = params.get(name)?.trim();
      if (value) return value.slice(0, 180);
    }
  } catch {
    // Ignore malformed URLs.
  }
  return "";
}

function isDownloadHref(href: string) {
  return /\.(pdf|csv|json|zip|txt|md|docx?|xlsx?)($|\?)/i.test(href);
}

function cleanHref(href: string) {
  if (!href) return "";
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin === window.location.origin) return url.pathname;
    return `${url.hostname}${url.pathname}`.slice(0, 500);
  } catch {
    return href.slice(0, 500);
  }
}

function elementLabel(element: Element) {
  if (!(element instanceof HTMLElement)) return "";
  return (
    element.getAttribute("aria-label") ||
    element.getAttribute("title") ||
    element.innerText ||
    element.textContent ||
    ""
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

function classifyAction(label: string, href: string, element: Element) {
  const haystack = `${label} ${href} ${element.getAttribute("data-visitor-action") ?? ""}`.toLowerCase();
  if (element instanceof HTMLAnchorElement && element.hasAttribute("download")) return "download";
  if (isDownloadHref(href)) return "download";
  if (/(request package|package interest|official brief|race source pack|quick record check|election watch desk)/.test(haystack)) return "package_interest_clicked";
  if (/(checkout|stripe|pay now|buy now|start package|order package|request package)/.test(haystack)) return "checkout_started";
  if (/(email signup|sign up|create account|join free|free founder|newsletter|digest)/.test(haystack)) return "digest_signup";
  if (/(follow official|official follow|follow this official|save official)/.test(haystack)) return "profile_watch_clicked";
  if (/(follow race|race follow|follow this race|save race)/.test(haystack)) return "watchlist_add";
  if (/(watchlist|create watchlist|save to watchlist|add to watchlist)/.test(haystack)) return "watchlist_add";
  if (/(twitter\.com\/intent|x\.com\/intent|facebook\.com\/sharer|linkedin\.com\/sharing|native share|share on|copy safe|copy link|share)/.test(haystack)) {
    if (/twitter\.com\/intent|x\.com\/intent|facebook\.com\/sharer|linkedin\.com\/sharing|share on/.test(haystack)) return "social_share_clicked";
    if (/native share/.test(haystack)) return "native_share_clicked";
    return "share_snippet_copied";
  }
  if (/(packet|source pack|brief builder|build source|free source packet)/.test(haystack)) return "packet_builder_started";
  if (/(submit source|missing source|source submission|submit one source|better source)/.test(haystack)) return "source_submit_started";
  if (/(watch this|watch official|watch record)/.test(haystack)) return "profile_watch_clicked";
  if (/(request review|request official brief|review this|correction|report incorrect)/.test(haystack)) return "correction_clicked";
  if (element instanceof HTMLAnchorElement && href && !href.startsWith(window.location.origin)) return "external_source_click";
  return "next_action_click";
}

function shareChannel(label: string, href: string) {
  const text = `${label} ${href}`.toLowerCase();
  if (text.includes("facebook")) return "facebook";
  if (text.includes("linkedin")) return "linkedin";
  if (text.includes("twitter") || text.includes("x.com") || text.includes("share on x")) return "x";
  if (text.includes("copy")) return "copy";
  return "site";
}

function queuePayload(payload: VisitorPayload) {
  try {
    const existing = JSON.parse(localStorage.getItem(queueKey) || "[]") as VisitorPayload[];
    existing.push(payload);
    localStorage.setItem(queueKey, JSON.stringify(existing.slice(-100)));
  } catch {
    // If storage is blocked, analytics should not affect the page.
  }
}

function readQueuedPayloads() {
  try {
    const queued = JSON.parse(localStorage.getItem(queueKey) || "[]") as VisitorPayload[];
    localStorage.removeItem(queueKey);
    return queued.slice(0, 100);
  } catch {
    return [];
  }
}

async function postPayload(payload: VisitorPayload, queueOnFail = true) {
  try {
    const response = await fetch("/api/analytics/visitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    if (!response.ok && response.status !== 204 && queueOnFail) queuePayload(payload);
  } catch {
    if (queueOnFail) queuePayload(payload);
  }
}

function sendPayload(payload: VisitorPayload, queueOnFail = true) {
  void postPayload(payload, queueOnFail);
}

function clickPosition(event: MouseEvent) {
  const root = document.documentElement;
  const width = Math.max(1, window.innerWidth || root.clientWidth || 1);
  const documentHeight = Math.max(1, root.scrollHeight || document.body.scrollHeight || window.innerHeight || 1);
  return {
    x_percent: Math.max(0, Math.min(100, Math.round((event.clientX / width) * 100))),
    y_percent: Math.max(0, Math.min(100, Math.round(((event.clientY + window.scrollY) / documentHeight) * 100))),
    viewport_width: Math.round(width),
    viewport_height: Math.round(window.innerHeight || root.clientHeight || 0),
  };
}

function basePayload(pathname: string): Omit<VisitorPayload, "eventType"> {
  const attribution = getAttributionContext();
  return {
    anonymousId: getAnonymousId(),
    sessionId: getSessionId(),
    route: pathname,
    pathname,
    path: pathname,
    entryPage: getEntryPage(pathname),
    referrer: attribution.referrer,
    referrerHost: getReferrerHost(),
    utm_source: attribution.utm_source,
    utm_medium: attribution.utm_medium,
    utm_campaign: attribution.utm_campaign,
    utm_term: attribution.utm_term,
    utm_content: attribution.utm_content,
    deviceType: attribution.device_type,
    browser: attribution.browser,
    os: attribution.os,
    sessionDepth: getSessionDepth(pathname),
  };
}

async function flushQueue(pathname: string) {
  const queued = readQueuedPayloads();
  if (!queued.length) return;
  const base = basePayload(pathname);
  for (const payload of queued) {
    await postPayload({ ...base, ...payload }, false);
  }
}

async function tryMergeVisitor() {
  const anonymousId = getAnonymousId();
  try {
    if (localStorage.getItem(mergeKey) === anonymousId) return;
  } catch {
    // Storage can be unavailable.
  }

  try {
    const response = await fetch("/api/analytics/visitor/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anonymousId }),
      keepalive: true,
    });
    if (!response.ok) return;
    const result = (await response.json().catch(() => null)) as { merged?: boolean } | null;
    if (result?.merged) {
      try {
        localStorage.setItem(mergeKey, anonymousId);
      } catch {
        // Best-effort marker only.
      }
    }
  } catch {
    // Merge retries on the next navigation.
  }
}

export default function VisitorIntelligenceTracker() {
  const pathname = usePathname();
  const pathRef = useRef(pathname || "/");
  const startRef = useRef(Date.now());
  const maxScrollRef = useRef(0);
  const lastScrollBucketRef = useRef(0);

  useEffect(() => {
    if (!pathname) return;

    void tryMergeVisitor();

    if (!shouldTrack(pathname)) {
      pathRef.current = pathname || "/";
      return;
    }

    pathRef.current = pathname;
    startRef.current = Date.now();
    maxScrollRef.current = currentScrollPercent();
    lastScrollBucketRef.current = Math.floor(maxScrollRef.current / 25) * 25;

    void flushQueue(pathname);
    const searchTerm = getQueryValue(["q", "query", "search", "term"]);
    const county = getQueryValue(["county"]);
    const issueId = getQueryValue(["issue", "issueId"]);
    const base = basePayload(pathname);

    sendPayload({
      ...base,
      eventType: "page_view",
      searchTerm: searchTerm || undefined,
      county: county || undefined,
      issueId: issueId || undefined,
    });

    if (searchTerm) {
      sendPayload({
        ...base,
        eventType: "global_search_submitted",
        searchTerm,
        county: county || undefined,
        issueId: issueId || undefined,
      });
    }

    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has("session_id") || params.get("checkout") === "success" || params.get("payment") === "success") {
        sendPayload({
          ...base,
          eventType: "checkout_completed",
          metadata: { source: "checkout_return_url" },
        });
      }
    } catch {
      // Ignore malformed query strings.
    }

    return () => {
      const timeSpentMs = Date.now() - startRef.current;
      sendPayload({
        ...basePayload(pathname),
        eventType: "time_spent",
        timeSpentMs,
        scrollPercent: maxScrollRef.current,
        exitPage: pathname,
      });
    };
  }, [pathname]);

  useEffect(() => {
    function handleScroll() {
      const pathnameNow = pathRef.current;
      if (!shouldTrack(pathnameNow)) return;
      const percent = currentScrollPercent();
      maxScrollRef.current = Math.max(maxScrollRef.current, percent);
      const bucket = Math.floor(percent / 25) * 25;
      if (bucket < 25 || bucket <= lastScrollBucketRef.current) return;
      lastScrollBucketRef.current = bucket;
      sendPayload({
        ...basePayload(pathnameNow),
        eventType: "scroll_depth",
        scrollPercent: bucket,
      });
    }

    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const interactive = target.closest("a, button, [role='button'], [data-visitor-action]");
      if (!interactive || !(interactive instanceof Element)) return;

      const pathnameNow = pathRef.current;
      if (!shouldTrack(pathnameNow)) return;

      const anchor = interactive instanceof HTMLAnchorElement ? interactive : interactive.closest("a");
      const href = anchor instanceof HTMLAnchorElement ? anchor.href : interactive.getAttribute("data-href") ?? "";
      const label = elementLabel(interactive);
      const action = classifyAction(label, href, interactive) as VisitorIntelligenceEventDetail["eventType"];
      const cleanedHref = cleanHref(href);
      const heatmap = clickPosition(event);
      const elementRole =
        interactive.getAttribute("role") ||
        (interactive instanceof HTMLButtonElement ? "button" : interactive instanceof HTMLAnchorElement ? "link" : interactive.tagName.toLowerCase());

      sendPayload({
        ...basePayload(pathnameNow),
        eventType: action,
        buttonLabel: label || undefined,
        buttonHref: cleanedHref || undefined,
        shareChannel: String(action).includes("share") || String(action).includes("copied") ? shareChannel(label, href) : undefined,
        downloadName: action === "download" ? label || cleanedHref : undefined,
        packetType: String(action).startsWith("packet_builder") ? label || "source_packet" : undefined,
        metadata: {
          action_kind: action,
        },
      });

      sendPayload({
        ...basePayload(pathnameNow),
        eventType: "heatmap_click",
        buttonLabel: label || undefined,
        buttonHref: cleanedHref || undefined,
        metadata: {
          ...heatmap,
          element_role: elementRole,
          action_kind: action,
        },
      });
    }

    function handleSubmit(event: SubmitEvent) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const pathnameNow = pathRef.current;
      if (!shouldTrack(pathnameNow)) return;
      const formData = new FormData(form);
      const formLabel = `${form.getAttribute("aria-label") ?? ""} ${form.getAttribute("name") ?? ""} ${form.id ?? ""} ${pathnameNow}`.toLowerCase();
      const searchTerm =
        String(formData.get("q") ?? formData.get("query") ?? formData.get("search") ?? formData.get("term") ?? "").trim();
      if (searchTerm) {
        sendPayload({
          ...basePayload(pathnameNow),
          eventType: "global_search_submitted",
          searchTerm: searchTerm.slice(0, 180),
        });
      }
      if (formData.has("email") || /signup|newsletter|digest|free-packet|create-account/.test(formLabel)) {
        sendPayload({
          ...basePayload(pathnameNow),
          eventType: "digest_signup",
          metadata: { form: formLabel.slice(0, 120) },
        });
      }
      if (/submit-source|source|correction|report/.test(formLabel) || pathnameNow.includes("submit-source")) {
        sendPayload({
          ...basePayload(pathnameNow),
          eventType: "source_submit_completed",
          metadata: { form: formLabel.slice(0, 120) },
        });
      }
      if (/packet|builder|free-packet/.test(formLabel) || pathnameNow.includes("free-packet")) {
        sendPayload({
          ...basePayload(pathnameNow),
          eventType: "packet_builder_completed",
          metadata: { form: formLabel.slice(0, 120) },
        });
      }
    }

    function handleVisitorEvent(event: Event) {
      const customEvent = event as CustomEvent<VisitorIntelligenceEventDetail>;
      const pathnameNow = customEvent.detail.path || pathRef.current;
      if (!shouldTrack(pathnameNow) && !shouldTrackExplicitPrivateEvent(customEvent.detail.eventType)) {
        return;
      }
      sendPayload({
        ...basePayload(pathnameNow),
        ...customEvent.detail,
      });
    }

    function handlePageHide() {
      const pathnameNow = pathRef.current;
      if (!shouldTrack(pathnameNow)) return;
      const timeSpentMs = Date.now() - startRef.current;
      sendPayload({
        ...basePayload(pathnameNow),
        eventType: "exit",
        timeSpentMs,
        scrollPercent: maxScrollRef.current,
        exitPage: pathnameNow,
      });
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);
    window.addEventListener(VISITOR_INTELLIGENCE_EVENT, handleVisitorEvent);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
      window.removeEventListener(VISITOR_INTELLIGENCE_EVENT, handleVisitorEvent);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  return null;
}
