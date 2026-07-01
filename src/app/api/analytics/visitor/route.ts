import { NextResponse } from "next/server";
import {
  canonicalEventName,
  eventFamilyFor,
  legacyEventNameForAnalytics,
} from "@/lib/analytics-taxonomy";
import { inferInterestSignals, type InterestInferenceInput } from "@/lib/interest-graph";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const excludedPrefixes = ["/admin", "/api", "/auth", "/dashboard", "/login", "/create-account"];

type AdminClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

interface VisitorPayload {
  anonymousId?: unknown;
  userId?: unknown;
  sessionId?: unknown;
  eventName?: unknown;
  eventFamily?: unknown;
  eventType?: unknown;
  route?: unknown;
  pathname?: unknown;
  path?: unknown;
  referrer?: unknown;
  entryPage?: unknown;
  exitPage?: unknown;
  referrerHost?: unknown;
  utm_source?: unknown;
  utm_medium?: unknown;
  utm_campaign?: unknown;
  utm_term?: unknown;
  utm_content?: unknown;
  deviceType?: unknown;
  browser?: unknown;
  os?: unknown;
  sessionDepth?: unknown;
  timeSpentMs?: unknown;
  scrollPercent?: unknown;
  entityType?: unknown;
  entityId?: unknown;
  entityLabel?: unknown;
  topic?: unknown;
  issueId?: unknown;
  county?: unknown;
  searchTerm?: unknown;
  buttonLabel?: unknown;
  buttonHref?: unknown;
  shareChannel?: unknown;
  downloadName?: unknown;
  packetType?: unknown;
  metadata?: unknown;
}

interface VisitorProfileRow {
  id: string;
  anonymous_id: string;
  user_id: string | null;
  entry_page: string | null;
  exit_page: string | null;
  referrer_host: string | null;
  country_code: string | null;
  device_kind: string;
  session_count: number;
  page_view_count: number;
  button_click_count: number;
  share_count: number;
  packet_build_count: number;
  download_count: number;
  max_depth: number;
  max_scroll_percent: number;
  total_time_ms: number;
  first_route?: string | null;
  last_route?: string | null;
  first_referrer?: string | null;
  latest_referrer?: string | null;
  first_utm?: Record<string, unknown> | null;
  latest_utm?: Record<string, unknown> | null;
  profile_view_count?: number;
  search_count?: number;
  source_click_count?: number;
  source_submission_count?: number;
  watch_click_count?: number;
  share_click_count?: number;
  package_interest_count?: number;
  interest_scores?: Record<string, unknown> | null;
  officials_viewed: Record<string, unknown> | null;
  topics_viewed: Record<string, unknown> | null;
  issues_viewed: Record<string, unknown> | null;
  counties_viewed: Record<string, unknown> | null;
}

interface VisitorSessionRow {
  id: string;
  session_key: string;
  session_id?: string;
  entry_route?: string | null;
  page_depth: number;
  page_views?: number;
  events_count?: number;
  engaged_seconds?: number;
  max_scroll_percent: number;
  total_time_ms: number;
  user_id: string | null;
}

interface RouteSignals {
  entityType?: string;
  entityId?: string;
  entityLabel?: string;
  topic?: string;
  issueId?: string;
}

function redactSensitiveText(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[phone]")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const cleaned = redactSensitiveText(value);
  if (!cleaned) return null;
  return cleaned.slice(0, maxLength);
}

function normalizeTrackingId(value: unknown) {
  const id = normalizeText(value, 120);
  if (!id || !/^[a-zA-Z0-9:_-]{16,120}$/.test(id)) return null;
  return id;
}

function normalizePath(value: unknown) {
  if (typeof value !== "string") return null;
  const path = value.trim().split("?")[0].split("#")[0];
  if (!path.startsWith("/") || path.length > 500) return null;
  if (excludedPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return null;
  return path;
}

function normalizeReferrer(value: unknown) {
  return normalizeText(value, 500);
}

function normalizeHost(value: unknown) {
  const host = normalizeText(value, 120)?.toLowerCase() ?? null;
  if (!host || !/^[a-z0-9.-]+$/.test(host)) return null;
  return host;
}

function hostFromReferrer(value: unknown) {
  const referrer = normalizeText(value, 500);
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname.slice(0, 120).toLowerCase();
  } catch {
    return normalizeHost(referrer);
  }
}

function normalizeHref(value: unknown) {
  const href = normalizeText(value, 500);
  if (!href) return null;
  try {
    const url = new URL(href, "https://www.repwatchr.com");
    if (url.origin === "https://www.repwatchr.com") return url.pathname.slice(0, 500);
    return `${url.hostname}${url.pathname}`.slice(0, 500);
  } catch {
    return href.slice(0, 500);
  }
}

function normalizeNumber(value: unknown, min: number, max: number) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.round(parsed);
  if (rounded < min) return min;
  if (rounded > max) return max;
  return rounded;
}

function deviceKind(userAgent: string) {
  const text = userAgent.toLowerCase();
  if (!text) return "unknown";
  if (/(bot|crawler|spider|crawling|preview|slurp)/.test(text)) return "bot";
  if (/(ipad|tablet)/.test(text)) return "tablet";
  if (/(mobile|iphone|android)/.test(text)) return "mobile";
  return "desktop";
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

function countryCode(request: Request) {
  const country = request.headers.get("x-vercel-ip-country")?.slice(0, 2).toUpperCase() || null;
  return country && /^[A-Z]{2}$/.test(country) ? country : null;
}

function compactRecord<T extends Record<string, unknown>>(record: T) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)) as Partial<T>;
}

function routeSignals(path: string | null): RouteSignals {
  if (!path) return {};
  const segments = path.split("/").filter(Boolean);
  const [first, second, third] = segments;

  if (first === "officials" && second) {
    return { entityType: "official", entityId: second, topic: "official_profile" };
  }

  if (first === "school-boards" && second && third) {
    return { entityType: "school_board_candidate", entityId: third, entityLabel: second, topic: "school_board" };
  }

  if (first === "school-boards" && second) {
    return { entityType: "school_board", entityId: second, topic: "school_board" };
  }

  if (first === "funding" && second) {
    return { entityType: "official_funding", entityId: second, topic: "funding" };
  }

  if (first === "issues" && second) {
    return { entityType: "issue", entityId: second, issueId: second, topic: "issue" };
  }

  if (first === "votes" && second) {
    return { entityType: "vote", entityId: second, topic: "vote_record" };
  }

  if (first === "elections" && second === "texas" && third) {
    return { entityType: "texas_race", entityId: third, topic: "texas_elections" };
  }

  if (first === "news" && second) {
    return { entityType: "article", entityId: second, topic: "story" };
  }

  if (first === "services" && second) {
    return { entityType: "service", entityId: second, topic: "paid_services" };
  }

  if (first) return { topic: first.replace(/-/g, "_") };
  return { topic: "homepage" };
}

function normalizeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const output: Record<string, string | number | boolean | null> = {};
  for (const [key, rawValue] of Object.entries(value).slice(0, 12)) {
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60);
    if (!safeKey) continue;
    if (typeof rawValue === "string") output[safeKey] = normalizeText(rawValue, 180);
    if (typeof rawValue === "number" && Number.isFinite(rawValue)) output[safeKey] = rawValue;
    if (typeof rawValue === "boolean") output[safeKey] = rawValue;
    if (rawValue === null) output[safeKey] = null;
  }
  return output;
}

function metadataNumber(metadata: Record<string, string | number | boolean | null>, key: string, min: number, max: number) {
  const rawValue = metadata[key];
  const parsed = typeof rawValue === "number" ? rawValue : typeof rawValue === "string" ? Number(rawValue) : Number.NaN;
  if (!Number.isFinite(parsed)) return null;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

async function recordHeatmapClick(
  admin: AdminClient,
  input: {
    visitorEventId: string;
    profile: VisitorProfileRow;
    session: VisitorSessionRow | null;
    eventType: string;
    path: string | null;
    buttonLabel: string | null;
    buttonHref: string | null;
    metadata: Record<string, string | number | boolean | null>;
    now: string;
  },
) {
  if (input.eventType !== "heatmap_click" || !input.path) return;

  const xPercent = metadataNumber(input.metadata, "x_percent", 0, 100);
  const yPercent = metadataNumber(input.metadata, "y_percent", 0, 100);
  if (xPercent === null || yPercent === null) return;

  const result = await admin.from("behavioral_heatmap_events").insert(
    compactRecord({
      visitor_event_id: input.visitorEventId,
      visitor_profile_id: input.profile.id,
      session_id: input.session?.id,
      anonymous_id: input.profile.anonymous_id,
      user_id: input.profile.user_id,
      path: input.path,
      element_label: input.buttonLabel,
      element_href: input.buttonHref,
      element_role: normalizeText(input.metadata.element_role, 60),
      x_percent: xPercent,
      y_percent: yPercent,
      viewport_width: metadataNumber(input.metadata, "viewport_width", 0, 10000),
      viewport_height: metadataNumber(input.metadata, "viewport_height", 0, 10000),
      occurred_at: input.now,
      metadata: input.metadata,
    }),
  );

  if (result.error) {
    if (/behavioral_heatmap_events|does not exist|schema cache/i.test(result.error.message)) return;
    logSkipped(`heatmap_insert_failed: ${result.error.message}`);
  }
}

function bumpRollupMap(
  value: Record<string, unknown> | null,
  key: string | null,
  label: string | null,
  now: string,
) {
  if (!key) return value ?? {};
  const output = value && typeof value === "object" && !Array.isArray(value) ? { ...value } : {};
  const current = output[key];
  const currentObject =
    current && typeof current === "object" && !Array.isArray(current)
      ? (current as { count?: unknown })
      : null;
  const currentCount =
    typeof current === "number"
      ? current
      : typeof currentObject?.count === "number"
        ? currentObject.count
        : 0;

  output[key] = {
    count: currentCount + 1,
    label: label ?? key,
    last_seen_at: now,
  };

  const keys = Object.keys(output);
  if (keys.length > 250) {
    for (const staleKey of keys.slice(0, keys.length - 250)) delete output[staleKey];
  }

  return output;
}

async function findOrCreateProfile(
  admin: AdminClient,
  anonymousId: string,
  initial: {
    path: string | null;
    referrerHost: string | null;
    device: string;
    country: string | null;
  },
) {
  const lookup = await admin
    .from("visitor_profiles")
    .select(
      "id, anonymous_id, user_id, entry_page, exit_page, referrer_host, country_code, device_kind, session_count, page_view_count, button_click_count, share_count, packet_build_count, download_count, max_depth, max_scroll_percent, total_time_ms, officials_viewed, topics_viewed, issues_viewed, counties_viewed",
    )
    .eq("anonymous_id", anonymousId)
    .maybeSingle();

  if (lookup.error) return { profile: null, error: lookup.error.message };
  if (lookup.data) {
    const profile = await hydrateVisitorProfileV2(admin, lookup.data as VisitorProfileRow);
    return { profile, error: null };
  }

  const created = await admin
    .from("visitor_profiles")
    .insert({
      anonymous_id: anonymousId,
      entry_page: initial.path,
      exit_page: initial.path,
      referrer_host: initial.referrerHost,
      country_code: initial.country,
      device_kind: initial.device,
    })
    .select(
      "id, anonymous_id, user_id, entry_page, exit_page, referrer_host, country_code, device_kind, session_count, page_view_count, button_click_count, share_count, packet_build_count, download_count, max_depth, max_scroll_percent, total_time_ms, officials_viewed, topics_viewed, issues_viewed, counties_viewed",
    )
    .single();

  if (created.error) return { profile: null, error: created.error.message };
  const profile = await hydrateVisitorProfileV2(admin, created.data as VisitorProfileRow);
  return { profile, error: null };
}

async function hydrateVisitorProfileV2(admin: AdminClient, profile: VisitorProfileRow) {
  const result = await admin
    .from("visitor_profiles")
    .select(
      "first_route, last_route, first_referrer, latest_referrer, first_utm, latest_utm, profile_view_count, search_count, source_click_count, source_submission_count, watch_click_count, share_click_count, package_interest_count, interest_scores",
    )
    .eq("id", profile.id)
    .maybeSingle();

  if (result.error) {
    if (!/first_route|latest_utm|interest_scores|schema cache/i.test(result.error.message)) {
      logSkipped(`visitor_profile_v2_hydrate_failed: ${result.error.message}`);
    }
    return profile;
  }

  return { ...profile, ...(result.data ?? {}) } as VisitorProfileRow;
}

async function findOrCreateSession(
  admin: AdminClient,
  sessionKey: string,
  profile: VisitorProfileRow,
  initial: {
    path: string | null;
    entryPage: string | null;
    exitPage: string | null;
    referrerHost: string | null;
    device: string;
    country: string | null;
    sessionDepth: number | null;
    scrollPercent: number | null;
  },
) {
  const lookup = await admin
    .from("visitor_sessions")
    .select("id, session_key, page_depth, max_scroll_percent, total_time_ms, user_id")
    .eq("session_key", sessionKey)
    .maybeSingle();

  if (lookup.error) return { session: null, created: false, error: lookup.error.message };
  if (lookup.data) {
    const session = await hydrateVisitorSessionV2(admin, lookup.data as VisitorSessionRow);
    return { session, created: false, error: null };
  }

  const created = await admin
    .from("visitor_sessions")
    .insert({
      session_key: sessionKey,
      visitor_profile_id: profile.id,
      anonymous_id: profile.anonymous_id,
      user_id: profile.user_id,
      entry_page: initial.entryPage ?? initial.path,
      exit_page: initial.exitPage ?? initial.path,
      referrer_host: initial.referrerHost,
      country_code: initial.country,
      device_kind: initial.device,
      page_depth: initial.sessionDepth ?? 0,
      max_scroll_percent: initial.scrollPercent ?? 0,
    })
    .select("id, session_key, page_depth, max_scroll_percent, total_time_ms, user_id")
    .single();

  if (created.error) return { session: null, created: false, error: created.error.message };
  const session = await hydrateVisitorSessionV2(admin, created.data as VisitorSessionRow);
  return { session, created: true, error: null };
}

async function hydrateVisitorSessionV2(admin: AdminClient, session: VisitorSessionRow) {
  const result = await admin
    .from("visitor_sessions")
    .select("session_id, entry_route, page_views, events_count, engaged_seconds")
    .eq("id", session.id)
    .maybeSingle();

  if (result.error) {
    if (!/session_id|entry_route|events_count|schema cache/i.test(result.error.message)) {
      logSkipped(`visitor_session_v2_hydrate_failed: ${result.error.message}`);
    }
    return session;
  }

  return { ...session, ...(result.data ?? {}) } as VisitorSessionRow;
}

function logSkipped(reason: string) {
  console.warn(JSON.stringify({ level: "warn", msg: "visitor_intelligence_skipped", reason }));
}

async function recordInterestSignals(
  admin: AdminClient,
  profile: VisitorProfileRow,
  session: VisitorSessionRow | null,
  visitorEventId: string | null,
  input: InterestInferenceInput,
  now: string,
) {
  const signals = inferInterestSignals(input);
  if (!signals.length) return;

  for (const signal of signals) {
    const eventResult = await admin.from("visitor_interest_events").insert(
      compactRecord({
        visitor_profile_id: profile.id,
        session_id: session?.id,
        visitor_event_id: visitorEventId,
        anonymous_id: profile.anonymous_id,
        user_id: profile.user_id,
        interest_slug: signal.slug,
        interest_key: signal.slug,
        interest_family: input.topic ? "issue" : "engagement_type",
        weight: signal.weight,
        source_event_type: input.eventType,
        source_event: input.eventType,
        source_entity_type: input.entityType,
        source_entity_id: input.entityId,
        path: input.path,
        route: input.path,
        reason: signal.reason,
        metadata: {
          reason: signal.reason,
          entity_label: input.entityLabel,
          topic: input.topic,
          issue_id: input.issueId,
          county: input.county,
        },
        created_at: now,
      }),
    );

    if (eventResult.error) {
      logSkipped(`interest_event_failed: ${eventResult.error.message}`);
      return;
    }

    const existing = await admin
      .from("visitor_interest_scores")
      .select("id, score, raw_event_count")
      .eq("visitor_profile_id", profile.id)
      .eq("interest_slug", signal.slug)
      .maybeSingle();

    if (existing.error) {
      logSkipped(`interest_score_lookup_failed: ${existing.error.message}`);
      return;
    }

    if (existing.data) {
      await admin
        .from("visitor_interest_scores")
        .update({
          user_id: profile.user_id,
          score: Number(existing.data.score ?? 0) + signal.weight,
          raw_event_count: Number(existing.data.raw_event_count ?? 0) + 1,
          last_weight: signal.weight,
          last_reason: signal.reason,
          last_scored_at: now,
          updated_at: now,
        })
        .eq("id", existing.data.id);
    } else {
      await admin.from("visitor_interest_scores").insert({
        visitor_profile_id: profile.id,
        anonymous_id: profile.anonymous_id,
        user_id: profile.user_id,
        interest_slug: signal.slug,
        score: signal.weight,
        raw_event_count: 1,
        last_weight: signal.weight,
        last_reason: signal.reason,
        first_scored_at: now,
        last_scored_at: now,
        updated_at: now,
      });
    }
  }

  const topScores = await admin
    .from("visitor_interest_scores")
    .select("interest_slug, score, raw_event_count, last_scored_at")
    .eq("visitor_profile_id", profile.id)
    .order("score", { ascending: false })
    .limit(12);

  if (!topScores.error) {
    const interestScores = Object.fromEntries(
      (topScores.data ?? []).map((row) => [
        row.interest_slug,
        {
          score: row.score,
          raw_event_count: row.raw_event_count,
          last_scored_at: row.last_scored_at,
        },
      ]),
    );

    await admin
      .from("visitor_profiles")
      .update({
        interest_profile: {
          top: topScores.data ?? [],
          updated_at: now,
        },
        interest_scores: interestScores,
        updated_at: now,
      })
      .eq("id", profile.id);
  }
}

async function recordAnalyticsEvent(
  admin: AdminClient,
  input: {
    eventName: string;
    anonymousId: string;
    userId: string | null;
    sessionKey: string;
    path: string | null;
    referrer: string | null;
    utm: Record<string, string | null>;
    device: string;
    browser: string;
    os: string;
    metadata: Record<string, string | number | boolean | null>;
    now: string;
  },
) {
  const { error } = await admin.from("analytics_events").insert({
    event_name: input.eventName,
    event_family: eventFamilyFor(input.eventName),
    anonymous_id: input.anonymousId,
    user_id: input.userId,
    session_id: input.sessionKey,
    route: input.path,
    pathname: input.path,
    referrer: input.referrer,
    utm_source: input.utm.utm_source,
    utm_medium: input.utm.utm_medium,
    utm_campaign: input.utm.utm_campaign,
    utm_term: input.utm.utm_term,
    utm_content: input.utm.utm_content,
    device_type: input.device,
    browser: input.browser,
    os: input.os,
    metadata: input.metadata,
    created_at: input.now,
  });

  if (error && !/analytics_events|does not exist|schema cache/i.test(error.message)) {
    logSkipped(`analytics_event_insert_failed: ${error.message}`);
  }
}

async function recordAttributionTouch(
  admin: AdminClient,
  input: {
    anonymousId: string;
    userId: string | null;
    sessionKey: string;
    touchType: string;
    path: string | null;
    referrer: string | null;
    utm: Record<string, string | null>;
    metadata: Record<string, string | number | boolean | null>;
    now: string;
  },
) {
  const hasAttribution = Boolean(input.referrer || Object.values(input.utm).some(Boolean));
  if (!hasAttribution && input.touchType === "page_view") return;

  const { error } = await admin.from("attribution_touches").insert({
    anonymous_id: input.anonymousId,
    user_id: input.userId,
    session_id: input.sessionKey,
    touch_type: input.touchType,
    route: input.path,
    referrer: input.referrer,
    utm_source: input.utm.utm_source,
    utm_medium: input.utm.utm_medium,
    utm_campaign: input.utm.utm_campaign,
    utm_term: input.utm.utm_term,
    utm_content: input.utm.utm_content,
    metadata: input.metadata,
    created_at: input.now,
  });

  if (error && !/attribution_touches|does not exist|schema cache/i.test(error.message)) {
    logSkipped(`attribution_insert_failed: ${error.message}`);
  }
}

async function updatePromptVisitorProfileFields(
  admin: AdminClient,
  input: {
    profile: VisitorProfileRow;
    session: VisitorSessionRow | null;
    eventName: string;
    sessionKey: string;
    path: string | null;
    referrer: string | null;
    utm: Record<string, string | null>;
    now: string;
  },
) {
  const existingScores =
    input.profile.interest_scores && typeof input.profile.interest_scores === "object"
      ? input.profile.interest_scores
      : {};

  const profilePatch = {
    first_route: input.profile.first_route ?? input.path,
    last_route: input.path,
    first_referrer: input.profile.first_referrer ?? input.referrer,
    latest_referrer: input.referrer,
    first_utm: input.profile.first_utm ?? input.utm,
    latest_utm: input.utm,
    profile_view_count: Number(input.profile.profile_view_count ?? 0) + (input.eventName === "profile_open" ? 1 : 0),
    search_count: Number(input.profile.search_count ?? 0) + (input.eventName.includes("search") ? 1 : 0),
    source_click_count:
      Number(input.profile.source_click_count ?? 0) +
      (input.eventName === "external_source_click" || input.eventName === "source_trail_opened" ? 1 : 0),
    source_submission_count:
      Number(input.profile.source_submission_count ?? 0) + (input.eventName === "source_submit_completed" ? 1 : 0),
    watch_click_count:
      Number(input.profile.watch_click_count ?? 0) +
      (input.eventName === "profile_watch_clicked" || input.eventName === "watchlist_add" ? 1 : 0),
    share_click_count:
      Number(input.profile.share_click_count ?? 0) +
      (input.eventName.includes("share") || input.eventName.includes("copied") ? 1 : 0),
    package_interest_count:
      Number(input.profile.package_interest_count ?? 0) + (input.eventName.startsWith("package_interest") ? 1 : 0),
    interest_scores: existingScores,
    updated_at: input.now,
  };

  const profileResult = await admin.from("visitor_profiles").update(profilePatch).eq("id", input.profile.id);
  if (profileResult.error && !/first_route|last_route|interest_scores|schema cache/i.test(profileResult.error.message)) {
    logSkipped(`visitor_profile_v2_update_failed: ${profileResult.error.message}`);
  }

  if (!input.session) return;

  const sessionResult = await admin
    .from("visitor_sessions")
    .update(compactRecord({
      session_id: input.sessionKey,
      ended_at: input.eventName === "exit" ? input.now : undefined,
      entry_route: input.session.entry_route ?? input.path,
      exit_route: input.path,
      referrer: input.referrer,
      utm: input.utm,
      page_views: Number(input.session.page_views ?? 0) + (input.eventName === "page_view" ? 1 : 0),
      events_count: Number(input.session.events_count ?? 0) + 1,
      engaged_seconds: Number(input.session.engaged_seconds ?? 0),
    }))
    .eq("id", input.session.id);

  if (sessionResult.error && !/session_id|entry_route|events_count|schema cache/i.test(sessionResult.error.message)) {
    logSkipped(`visitor_session_v2_update_failed: ${sessionResult.error.message}`);
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as VisitorPayload | null;
  const anonymousId = normalizeTrackingId(body?.anonymousId);
  const sessionKey = normalizeTrackingId(body?.sessionId);
  const requestedEvent = normalizeText(body?.eventName ?? body?.eventType, 80) ?? "next_action_click";
  const analyticsEventName = canonicalEventName(requestedEvent);
  const eventType = analyticsEventName ? legacyEventNameForAnalytics(analyticsEventName) : null;

  if (!anonymousId || !sessionKey || !analyticsEventName || !eventType) {
    return new Response(null, { status: 204 });
  }

  const path = normalizePath(body?.pathname) ?? normalizePath(body?.route) ?? normalizePath(body?.path);
  const entryPage = normalizePath(body?.entryPage);
  const exitPage = normalizePath(body?.exitPage);
  const referrer = normalizeReferrer(body?.referrer);
  const referrerHost = normalizeHost(body?.referrerHost) ?? hostFromReferrer(body?.referrer);
  const sessionDepth = normalizeNumber(body?.sessionDepth, 0, 1000);
  const timeSpentMs = normalizeNumber(body?.timeSpentMs, 0, 86_400_000);
  const scrollPercent = normalizeNumber(body?.scrollPercent, 0, 100);
  const userAgent = request.headers.get("user-agent") ?? "";
  const device = normalizeText(body?.deviceType, 40) ?? deviceKind(userAgent);
  const browser = normalizeText(body?.browser, 80) ?? browserName(userAgent);
  const os = normalizeText(body?.os, 80) ?? osName(userAgent);
  const country = countryCode(request);
  const routeDerived = routeSignals(path);

  const admin = getSupabaseAdminClient();
  if (!admin) return new Response(null, { status: 204 });

  const { profile, error: profileError } = await findOrCreateProfile(admin, anonymousId, {
    path,
    referrerHost,
    device,
    country,
  });

  if (!profile) {
    logSkipped(profileError ?? "profile_lookup_failed");
    return new Response(null, { status: 204 });
  }

  const { session, created: sessionCreated, error: sessionError } = await findOrCreateSession(admin, sessionKey, profile, {
    path,
    entryPage,
    exitPage,
    referrerHost,
    device,
    country,
    sessionDepth,
    scrollPercent,
  });

  if (sessionError) {
    logSkipped(sessionError);
    return new Response(null, { status: 204 });
  }

  const entityType = normalizeText(body?.entityType, 80) ?? routeDerived.entityType ?? null;
  const entityId = normalizeText(body?.entityId, 180) ?? routeDerived.entityId ?? null;
  const entityLabel = normalizeText(body?.entityLabel, 220) ?? routeDerived.entityLabel ?? null;
  const topic = normalizeText(body?.topic, 160) ?? routeDerived.topic ?? null;
  const issueId = normalizeText(body?.issueId, 160) ?? routeDerived.issueId ?? null;
  const county = normalizeText(body?.county, 120);
  const searchTerm = normalizeText(body?.searchTerm, 180);
  const buttonLabel = normalizeText(body?.buttonLabel, 160);
  const buttonHref = normalizeHref(body?.buttonHref);
  const shareChannel = normalizeText(body?.shareChannel, 60);
  const downloadName = normalizeText(body?.downloadName, 180);
  const packetType = normalizeText(body?.packetType, 120);
  const metadata = normalizeMetadata(body?.metadata);
  const analyticsMetadata: Record<string, string | number | boolean | null> = {
    ...metadata,
    entityType,
    entityId,
    entityLabel,
    entity_type: entityType,
    entity_id: entityId,
    entity_label: entityLabel,
    topic,
    issueId,
    issue_id: issueId,
    county,
    searchTerm,
    search_term: searchTerm,
    buttonLabel,
    button_label: buttonLabel,
    shareChannel,
    share_channel: shareChannel,
    downloadName,
    download_name: downloadName,
    packetType,
    packet_type: packetType,
  };
  const utm = {
    utm_source: normalizeText(body?.utm_source, 120),
    utm_medium: normalizeText(body?.utm_medium, 120),
    utm_campaign: normalizeText(body?.utm_campaign, 160),
    utm_term: normalizeText(body?.utm_term, 160),
    utm_content: normalizeText(body?.utm_content, 160),
  };
  const now = new Date().toISOString();

  await recordAnalyticsEvent(admin, {
    eventName: analyticsEventName,
    anonymousId,
    userId: profile.user_id,
    sessionKey,
    path,
    referrer,
    utm,
    device,
    browser,
    os,
    metadata: analyticsMetadata,
    now,
  });

  await recordAttributionTouch(admin, {
    anonymousId,
    userId: profile.user_id,
    sessionKey,
    touchType: analyticsEventName,
    path,
    referrer,
    utm,
    metadata: analyticsMetadata,
    now,
  });

  const eventResult = await admin
    .from("visitor_events")
    .insert(
    compactRecord({
      visitor_profile_id: profile.id,
      session_id: session?.id,
      anonymous_id: anonymousId,
      user_id: profile.user_id,
      event_type: eventType,
      path,
      entry_page: entryPage,
      exit_page: exitPage,
      referrer_host: referrerHost,
      device_kind: device,
      country_code: country,
      session_depth: sessionDepth,
      time_spent_ms: timeSpentMs,
      scroll_percent: scrollPercent,
      entity_type: entityType,
      entity_id: entityId,
      entity_label: entityLabel,
      topic,
      issue_id: issueId,
      county,
      search_term: searchTerm,
      button_label: buttonLabel,
      button_href: buttonHref,
      share_channel: shareChannel,
      download_name: downloadName,
      packet_type: packetType,
      metadata: analyticsMetadata,
      occurred_at: now,
    }),
    )
    .select("id")
    .single();

  if (eventResult.error) {
    logSkipped(eventResult.error.message);
    return new Response(null, { status: 204 });
  }

  await recordInterestSignals(
    admin,
    profile,
    session,
    typeof eventResult.data?.id === "string" ? eventResult.data.id : null,
    {
      eventType,
      path,
      entityType,
      entityId,
      entityLabel,
      topic,
      issueId,
      county,
      searchTerm,
      buttonLabel,
      buttonHref,
      shareChannel,
      downloadName,
      packetType,
      timeSpentMs,
      scrollPercent,
      sessionDepth,
      metadata: {
        ...analyticsMetadata,
        analytics_event_name: analyticsEventName,
      },
    },
    now,
  );

  await recordHeatmapClick(admin, {
    visitorEventId: eventResult.data.id,
    profile,
    session,
    eventType,
    path,
    buttonLabel,
    buttonHref,
    metadata: analyticsMetadata,
    now,
  });

  await updatePromptVisitorProfileFields(admin, {
    profile,
    session,
    eventName: analyticsEventName,
    sessionKey,
    path,
    referrer,
    utm,
    now,
  });

  const profilePatch = compactRecord({
    last_seen_at: now,
    updated_at: now,
    exit_page: exitPage ?? path ?? profile.exit_page,
    referrer_host: profile.referrer_host ?? referrerHost,
    country_code: profile.country_code ?? country,
    device_kind: device,
    session_count: profile.session_count + (sessionCreated ? 1 : 0),
    page_view_count: profile.page_view_count + (analyticsEventName === "page_view" ? 1 : 0),
    button_click_count: profile.button_click_count + (eventType === "button_click" ? 1 : 0),
    share_count: profile.share_count + (analyticsEventName.includes("share") || analyticsEventName.includes("copied") ? 1 : 0),
    packet_build_count: profile.packet_build_count + (analyticsEventName === "packet_builder_completed" || eventType === "packet_creation" ? 1 : 0),
    download_count: profile.download_count + (eventType === "download" ? 1 : 0),
    max_depth: Math.max(profile.max_depth ?? 0, sessionDepth ?? 0),
    max_scroll_percent: Math.max(profile.max_scroll_percent ?? 0, scrollPercent ?? 0),
    total_time_ms: (profile.total_time_ms ?? 0) + (timeSpentMs ?? 0),
    officials_viewed:
      entityType === "official"
        ? bumpRollupMap(profile.officials_viewed, entityId, entityLabel, now)
        : profile.officials_viewed,
    topics_viewed: topic ? bumpRollupMap(profile.topics_viewed, topic, topic, now) : profile.topics_viewed,
    issues_viewed: issueId ? bumpRollupMap(profile.issues_viewed, issueId, entityLabel ?? issueId, now) : profile.issues_viewed,
    counties_viewed: county ? bumpRollupMap(profile.counties_viewed, county, county, now) : profile.counties_viewed,
    last_event_type: eventType,
  });

  await admin.from("visitor_profiles").update(profilePatch).eq("id", profile.id);

  if (session) {
    const sessionPatch = compactRecord({
      last_seen_at: now,
      updated_at: now,
      exit_page: exitPage ?? path,
      page_depth: Math.max(session.page_depth ?? 0, sessionDepth ?? 0),
      max_scroll_percent: Math.max(session.max_scroll_percent ?? 0, scrollPercent ?? 0),
      total_time_ms: (session.total_time_ms ?? 0) + (timeSpentMs ?? 0),
      user_id: profile.user_id ?? session.user_id,
    });
    await admin.from("visitor_sessions").update(sessionPatch).eq("id", session.id);
  }

  return NextResponse.json({ ok: true, visitorProfileId: profile.id });
}
