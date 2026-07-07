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
  "race_hub_open",
  "race_candidate_clicked",
  "race_compare_open",
  "race_watch_clicked",
  "race_submit_source_clicked",
  "race_public_question_copied",
  "race_package_interest_clicked",
  "race_source_clicked",
  "badge_profile_open",
  "court_profile_open",
  "public_role_boundary_viewed",
  "agency_policy_source_clicked",
  "public_info_source_clicked",
  "badge_profile_correction_clicked",
  "badge_profile_source_submitted",
  "safety_report_submitted",
  "school_board_page_open",
  "public_body_watch_clicked",
  "meeting_open",
  "agenda_source_clicked",
  "minutes_source_clicked",
  "video_source_clicked",
  "meeting_source_gap_clicked",
  "public_question_copied",
  "school_board_package_interest_clicked",
  "finance_section_open",
  "finance_record_clicked",
  "finance_source_clicked",
  "finance_filter_used",
  "finance_gap_submit_clicked",
  "money_package_interest_clicked",
  "records_response_started",
  "records_response_submitted",
  "records_response_file_uploaded",
  "records_response_packet_generated",
  "records_response_admin_reviewed",
  "records_response_attached_to_profile",
  "digest_preferences_open",
  "digest_preference_changed",
  "digest_preview_generated",
  "digest_queue_created",
  "digest_email_sent",
  "digest_email_failed",
  "digest_unsubscribe_clicked",
  "digest_item_clicked",
  "mobile_action_dock_clicked",
  "pwa_install_prompt_shown",
  "pwa_install_prompt_clicked",
  "pwa_install_prompt_dismissed",
  "pwa_installed",
  "offline_page_viewed",
  "referral_link_created",
  "referral_link_copied",
  "referral_visit",
  "referral_signup",
  "referral_source_submission",
  "referral_packet_created",
  "share_campaign_viewed",
  "share_campaign_clicked",
  "safe_share_text_copied",
  "investor_page_open",
  "partner_page_open",
  "partner_interest_started",
  "partner_interest_submitted",
  "partner_pipeline_open",
  "partner_status_changed",
  "feature_flag_evaluated",
  "pricing_experiment_viewed",
  "pricing_variant_assigned",
  "pricing_cta_clicked",
  "beta_access_requested",
  "package_interest_submitted",
  "beta_invite_sent",
  "api_access_page_open",
  "api_access_requested",
  "api_key_created",
  "api_key_revoked",
  "api_request_received",
  "export_started",
  "export_completed",
  "export_failed",
  "ai_writer_opened",
  "ai_writer_generated",
  "ai_writer_failed",
  "ai_writer_safety_flagged",
  "ai_writer_text_copied",
  "ai_writer_text_inserted",
  "ai_writer_disabled_fallback_used",
  "quality_dashboard_open",
  "smoke_tests_run",
  "smoke_test_failed",
  "app_error_logged",
  "env_validation_failed",
  "deploy_checklist_open",
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
