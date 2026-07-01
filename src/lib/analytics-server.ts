import { eventFamilyFor, canonicalEventName, INTEREST_WEIGHT_BY_EVENT } from "@/lib/analytics-taxonomy";
import { inferInterestSignals, type InterestInferenceInput } from "@/lib/interest-graph";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type MetadataValue = string | number | boolean | null;

export interface ServerTrackEventInput {
  eventName: string;
  anonymousId?: string | null;
  userId?: string | null;
  sessionId?: string | null;
  route?: string | null;
  pathname?: string | null;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  deviceType?: string | null;
  browser?: string | null;
  os?: string | null;
  metadata?: Record<string, unknown>;
}

export interface InterestScoreInput extends InterestInferenceInput {
  anonymousId?: string | null;
  userId?: string | null;
  sessionId?: string | null;
  sourceEntityType?: string | null;
  sourceEntityId?: string | null;
}

function cleanText(value: string | null | undefined, maxLength: number) {
  const cleaned = value
    ?.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[phone]")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned ? cleaned.slice(0, maxLength) : null;
}

function cleanMetadata(metadata: Record<string, unknown> = {}) {
  const output: Record<string, MetadataValue> = {};
  for (const [key, value] of Object.entries(metadata).slice(0, 20)) {
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60);
    if (!safeKey) continue;
    if (typeof value === "string") output[safeKey] = cleanText(value, 240);
    if (typeof value === "number" && Number.isFinite(value)) output[safeKey] = value;
    if (typeof value === "boolean") output[safeKey] = value;
    if (value === null) output[safeKey] = null;
  }
  return output;
}

function normalizeUserId(value: string | null | undefined) {
  const cleaned = cleanText(value, 80);
  return cleaned && /^[0-9a-fA-F-]{32,36}$/.test(cleaned) ? cleaned : null;
}

function normalizeTrackingId(value: string | null | undefined) {
  const cleaned = cleanText(value, 120);
  return cleaned && /^[a-zA-Z0-9:_-]{16,120}$/.test(cleaned) ? cleaned : null;
}

function normalizeRoute(value: string | null | undefined) {
  const route = cleanText(value, 500)?.split("?")[0]?.split("#")[0];
  return route?.startsWith("/") ? route : null;
}

export async function serverTrackEvent(input: ServerTrackEventInput) {
  const eventName = canonicalEventName(input.eventName);
  if (!eventName) return { ok: false, reason: "unknown_event_name" };

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, reason: "supabase_admin_not_configured" };

  const route = normalizeRoute(input.route ?? input.pathname ?? null);
  const { error } = await admin.from("analytics_events").insert({
    event_name: eventName,
    event_family: eventFamilyFor(eventName),
    anonymous_id: normalizeTrackingId(input.anonymousId ?? null),
    user_id: normalizeUserId(input.userId ?? null),
    session_id: normalizeTrackingId(input.sessionId ?? null),
    route,
    pathname: route,
    referrer: cleanText(input.referrer ?? null, 500),
    utm_source: cleanText(input.utm_source ?? null, 120),
    utm_medium: cleanText(input.utm_medium ?? null, 120),
    utm_campaign: cleanText(input.utm_campaign ?? null, 160),
    utm_term: cleanText(input.utm_term ?? null, 160),
    utm_content: cleanText(input.utm_content ?? null, 160),
    device_type: cleanText(input.deviceType ?? null, 40),
    browser: cleanText(input.browser ?? null, 80),
    os: cleanText(input.os ?? null, 80),
    metadata: cleanMetadata(input.metadata),
  });

  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

export async function updateVisitorProfile(event: ServerTrackEventInput) {
  const admin = getSupabaseAdminClient();
  const anonymousId = normalizeTrackingId(event.anonymousId ?? null);
  if (!admin || !anonymousId) return { ok: false, reason: "missing_admin_or_anonymous_id" };

  const eventName = canonicalEventName(event.eventName) ?? event.eventName;
  const route = normalizeRoute(event.route ?? event.pathname ?? null);
  const now = new Date().toISOString();

  const { data: existing } = await admin
    .from("visitor_profiles")
    .select("id, first_route, page_view_count, profile_view_count, search_count, source_click_count, source_submission_count, watch_click_count, share_click_count, packet_build_count, package_interest_count, session_count, interest_scores")
    .eq("anonymous_id", anonymousId)
    .maybeSingle();

  const patch = {
    anonymous_id: anonymousId,
    last_seen_at: now,
    last_route: route,
    latest_referrer: cleanText(event.referrer ?? null, 500),
    latest_utm: {
      utm_source: cleanText(event.utm_source ?? null, 120),
      utm_medium: cleanText(event.utm_medium ?? null, 120),
      utm_campaign: cleanText(event.utm_campaign ?? null, 160),
      utm_term: cleanText(event.utm_term ?? null, 160),
      utm_content: cleanText(event.utm_content ?? null, 160),
    },
    page_view_count: Number(existing?.page_view_count ?? 0) + (eventName === "page_view" ? 1 : 0),
    profile_view_count: Number(existing?.profile_view_count ?? 0) + (eventName === "profile_open" ? 1 : 0),
    search_count: Number(existing?.search_count ?? 0) + (eventName.includes("search") ? 1 : 0),
    source_click_count: Number(existing?.source_click_count ?? 0) + (eventName === "external_source_click" || eventName === "source_trail_opened" ? 1 : 0),
    source_submission_count: Number(existing?.source_submission_count ?? 0) + (eventName === "source_submit_completed" ? 1 : 0),
    watch_click_count: Number(existing?.watch_click_count ?? 0) + (eventName === "profile_watch_clicked" || eventName === "watchlist_add" ? 1 : 0),
    share_click_count: Number(existing?.share_click_count ?? 0) + (eventName.includes("share") || eventName.includes("copied") ? 1 : 0),
    packet_build_count: Number(existing?.packet_build_count ?? 0) + (eventName === "packet_builder_completed" ? 1 : 0),
    package_interest_count: Number(existing?.package_interest_count ?? 0) + (eventName.startsWith("package_interest") ? 1 : 0),
    updated_at: now,
  };

  if (existing?.id) {
    const { error } = await admin.from("visitor_profiles").update(patch).eq("id", existing.id);
    if (error) return { ok: false, reason: error.message };
    return { ok: true, visitorProfileId: existing.id };
  }

  const { data, error } = await admin
    .from("visitor_profiles")
    .insert({
      ...patch,
      first_route: route,
      first_referrer: cleanText(event.referrer ?? null, 500),
      first_utm: patch.latest_utm,
      session_count: 1,
    })
    .select("id")
    .single();

  if (error) return { ok: false, reason: error.message };
  return { ok: true, visitorProfileId: data?.id };
}

export async function updateInterestScore(input: InterestScoreInput) {
  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, reason: "supabase_admin_not_configured" };

  const eventName = canonicalEventName(input.eventType) ?? input.eventType;
  const signals = inferInterestSignals({ ...input, eventType: eventName });
  if (!signals.length) return { ok: true, scored: 0 };

  const now = new Date().toISOString();
  const anonymousId = normalizeTrackingId(input.anonymousId ?? null);
  const userId = normalizeUserId(input.userId ?? null);
  const metadata = cleanMetadata(input.metadata ?? {});

  for (const signal of signals) {
    const weight = INTEREST_WEIGHT_BY_EVENT[eventName] ?? signal.weight;
    await admin.from("visitor_interest_events").insert({
      anonymous_id: anonymousId,
      user_id: userId,
      interest_key: signal.slug,
      interest_family: "issue",
      weight,
      source_event: eventName,
      source_entity_type: cleanText(input.sourceEntityType ?? input.entityType ?? null, 80),
      source_entity_id: cleanText(input.sourceEntityId ?? input.entityId ?? null, 180),
      route: normalizeRoute(input.path ?? null),
      metadata: { ...metadata, reason: signal.reason },
      created_at: now,
    });
  }

  return { ok: true, scored: signals.length };
}

export async function mergeAnonymousVisitorIntoUser(anonymousId: string, userId: string) {
  const admin = getSupabaseAdminClient();
  const safeAnonymousId = normalizeTrackingId(anonymousId);
  const safeUserId = normalizeUserId(userId);
  if (!admin || !safeAnonymousId || !safeUserId) return { ok: false, reason: "invalid_merge_input" };

  const now = new Date().toISOString();
  const profileUpdate = await admin
    .from("visitor_profiles")
    .update({ converted_user_id: safeUserId, signup_converted_at: now, updated_at: now })
    .eq("anonymous_id", safeAnonymousId);

  await admin.from("analytics_events").update({ user_id: safeUserId }).eq("anonymous_id", safeAnonymousId);
  await admin.from("visitor_interest_events").update({ user_id: safeUserId }).eq("anonymous_id", safeAnonymousId);
  await admin.from("attribution_touches").update({ user_id: safeUserId }).eq("anonymous_id", safeAnonymousId);

  if (profileUpdate.error) return { ok: false, reason: profileUpdate.error.message };
  return { ok: true };
}
