import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { cleanText, recordPaymentEvent } from "@/lib/payment-records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedEvents = new Set([
  "page_view",
  "profile_open",
  "official_search",
  "filter_used",
  "source_submit_started",
  "source_submit_completed",
  "share_copy_clicked",
  "native_share_clicked",
  "social_share_clicked",
  "source_snippet_copied",
  "profile_watch_clicked",
  "watchlist_add",
  "signup_started",
  "signup_completed",
  "login",
  "checkout_started",
  "checkout_completed",
  "service_request_submitted",
  "article_open",
  "daily_wire_item_open",
  "admin_review_completed",
  "public_records_request_created",
  "free_packet_started",
  "free_packet_completed",
  "email_captured",
  "account_prompt_clicked",
  "upsell_clicked",
  "checkout_canceled",
  "subscription_started",
]);

type AnalyticsEventBody = {
  eventName?: unknown;
  anonymousSessionId?: unknown;
  route?: unknown;
  referrer?: unknown;
  utm_source?: unknown;
  utm_medium?: unknown;
  utm_campaign?: unknown;
  utm_term?: unknown;
  utm_content?: unknown;
  serviceSlug?: unknown;
  orderId?: unknown;
  stripeCheckoutSessionId?: unknown;
  payload?: unknown;
  metadata?: unknown;
};

const sensitiveMetadataKeys = new Set([
  "email",
  "phone",
  "name",
  "address",
  "source_url",
  "sourceUrl",
  "summary",
  "notes",
  "message",
  "claim",
  "packet",
  "body",
  "password",
  "token",
]);

function normalizeRoute(value: unknown) {
  const route = cleanText(value, 500).split("#")[0];
  if (!route.startsWith("/") || route.startsWith("/api")) return "";
  if (
    route.startsWith("/admin") ||
    route.startsWith("/dashboard") ||
    route.startsWith("/auth") ||
    route.startsWith("/login") ||
    route.startsWith("/create-account")
  ) {
    return "";
  }
  return route;
}

function normalizeReferrer(value: unknown) {
  const text = cleanText(value, 1000);
  if (!text) return "";
  try {
    const url = new URL(text);
    return `${url.origin}${url.pathname}`.slice(0, 1000);
  } catch {
    return text.slice(0, 500);
  }
}

function deviceKind(userAgent: string) {
  const text = userAgent.toLowerCase();
  if (!text) return "unknown";
  if (/(bot|crawler|spider|crawling|preview|slurp)/.test(text)) return "bot";
  if (/(ipad|tablet)/.test(text)) return "tablet";
  if (/(mobile|iphone|android)/.test(text)) return "mobile";
  return "desktop";
}

function browserKind(userAgent: string) {
  if (/Edg\//.test(userAgent)) return "edge";
  if (/Chrome\//.test(userAgent)) return "chrome";
  if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) return "safari";
  if (/Firefox\//.test(userAgent)) return "firefox";
  return "unknown";
}

function sanitizeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const safe: Record<string, string | number | boolean | null> = {};

  for (const [key, rawValue] of Object.entries(source).slice(0, 30)) {
    if (sensitiveMetadataKeys.has(key)) continue;
    if (typeof rawValue === "string") safe[key] = cleanText(rawValue, 255);
    if (typeof rawValue === "number" && Number.isFinite(rawValue)) safe[key] = rawValue;
    if (typeof rawValue === "boolean") safe[key] = rawValue;
    if (rawValue === null) safe[key] = null;
  }

  return safe;
}

async function getOptionalUserId() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as AnalyticsEventBody | null;
  const eventName = cleanText(body?.eventName, 120);

  if (!allowedEvents.has(eventName)) {
    return NextResponse.json({ error: "Unsupported analytics event." }, { status: 400 });
  }

  const payload =
    body?.payload && typeof body.payload === "object" && !Array.isArray(body.payload)
      ? (body.payload as Record<string, unknown>)
      : {};
  const metadata = sanitizeMetadata(body?.metadata ?? payload);
  const serviceSlug = cleanText(body?.serviceSlug, 120) || cleanText(metadata.service_slug, 120) || null;
  const userAgent = request.headers.get("user-agent") ?? "";
  const userId = await getOptionalUserId();

  const admin = getSupabaseAdminClient();
  if (admin) {
    const { error } = await admin.from("site_analytics_events").insert({
      event_name: eventName,
      user_id: userId,
      anonymous_session_id: cleanText(body?.anonymousSessionId, 120) || null,
      route: normalizeRoute(body?.route),
      referrer: normalizeReferrer(body?.referrer),
      utm_source: cleanText(body?.utm_source, 255) || null,
      utm_medium: cleanText(body?.utm_medium, 255) || null,
      utm_campaign: cleanText(body?.utm_campaign, 255) || null,
      utm_term: cleanText(body?.utm_term, 255) || null,
      utm_content: cleanText(body?.utm_content, 255) || null,
      device_kind: deviceKind(userAgent),
      browser_name: browserKind(userAgent),
      metadata,
    });

    if (error) {
      console.warn(JSON.stringify({ level: "warn", msg: "site_analytics_event_insert_skipped", error: error.message }));
    }
  }

  if (
    eventName.startsWith("checkout_") ||
    eventName === "subscription_started" ||
    eventName === "service_request_submitted"
  ) {
    await recordPaymentEvent({
      eventName,
      eventType: "client_analytics",
      serviceSlug,
      orderId: cleanText(body?.orderId, 80) || null,
      stripeCheckoutSessionId: cleanText(body?.stripeCheckoutSessionId, 255) || null,
      payload: {
        ...metadata,
        route: normalizeRoute(body?.route),
        source: "repwatchr_client",
      },
    });
  }

  return NextResponse.json({ ok: true });
}
