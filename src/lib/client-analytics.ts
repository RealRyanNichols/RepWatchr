"use client";

import { track } from "@vercel/analytics";

export type RepWatchrEventName =
  | "page_view"
  | "profile_open"
  | "official_search"
  | "filter_used"
  | "source_submit_started"
  | "source_submit_completed"
  | "share_copy_clicked"
  | "native_share_clicked"
  | "social_share_clicked"
  | "source_snippet_copied"
  | "profile_watch_clicked"
  | "watchlist_add"
  | "signup_started"
  | "signup_completed"
  | "login"
  | "checkout_started"
  | "checkout_completed"
  | "checkout_canceled"
  | "service_request_submitted"
  | "subscription_started"
  | "article_open"
  | "daily_wire_item_open"
  | "admin_review_completed"
  | "public_records_request_created"
  | "free_packet_started"
  | "free_packet_completed"
  | "email_captured"
  | "account_prompt_clicked"
  | "upsell_clicked"
  | "race_hub_open"
  | "race_candidate_clicked"
  | "race_compare_open"
  | "race_watch_clicked"
  | "race_submit_source_clicked"
  | "race_public_question_copied"
  | "race_package_interest_clicked"
  | "race_source_clicked"
  | "badge_profile_open"
  | "court_profile_open"
  | "public_role_boundary_viewed"
  | "agency_policy_source_clicked"
  | "public_info_source_clicked"
  | "badge_profile_correction_clicked"
  | "badge_profile_source_submitted"
  | "safety_report_submitted"
  | "school_board_page_open"
  | "public_body_watch_clicked"
  | "meeting_open"
  | "agenda_source_clicked"
  | "minutes_source_clicked"
  | "video_source_clicked"
  | "meeting_source_gap_clicked"
  | "public_question_copied"
  | "school_board_package_interest_clicked"
  | "finance_section_open"
  | "finance_record_clicked"
  | "finance_source_clicked"
  | "finance_filter_used"
  | "finance_gap_submit_clicked"
  | "money_package_interest_clicked"
  | "records_response_started"
  | "records_response_submitted"
  | "records_response_file_uploaded"
  | "records_response_packet_generated"
  | "records_response_admin_reviewed"
  | "records_response_attached_to_profile"
  | "digest_preferences_open"
  | "digest_preference_changed"
  | "digest_preview_generated"
  | "digest_queue_created"
  | "digest_email_sent"
  | "digest_email_failed"
  | "digest_unsubscribe_clicked"
  | "digest_item_clicked"
  | "mobile_action_dock_clicked"
  | "pwa_install_prompt_shown"
  | "pwa_install_prompt_clicked"
  | "pwa_install_prompt_dismissed"
  | "pwa_installed"
  | "offline_page_viewed"
  | "referral_link_created"
  | "referral_link_copied"
  | "referral_visit"
  | "referral_signup"
  | "referral_source_submission"
  | "referral_packet_created"
  | "share_campaign_viewed"
  | "share_campaign_clicked"
  | "safe_share_text_copied"
  | "investor_page_open"
  | "partner_page_open"
  | "partner_interest_started"
  | "partner_interest_submitted"
  | "partner_pipeline_open"
  | "partner_status_changed"
  | "feature_flag_evaluated"
  | "pricing_experiment_viewed"
  | "pricing_variant_assigned"
  | "pricing_cta_clicked"
  | "beta_access_requested"
  | "package_interest_submitted"
  | "beta_invite_sent";

type EventMetadata = Record<string, string | number | boolean | null | undefined>;

const sessionKey = "repwatchr.anonymousSessionId.v1";

function makeSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getAnonymousSessionId() {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(sessionKey);
    if (existing) return existing;
    const next = makeSessionId();
    window.localStorage.setItem(sessionKey, next);
    return next;
  } catch {
    return makeSessionId();
  }
}

function currentRoute() {
  if (typeof window === "undefined") return "";
  return `${window.location.pathname}${window.location.search}`;
}

function currentUtm() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || undefined,
    utm_medium: params.get("utm_medium") || undefined,
    utm_campaign: params.get("utm_campaign") || undefined,
    utm_term: params.get("utm_term") || undefined,
    utm_content: params.get("utm_content") || undefined,
  };
}

export function trackRepWatchrEvent(eventName: RepWatchrEventName, metadata: EventMetadata = {}) {
  if (typeof window === "undefined") return;

  const payload = {
    eventName,
    anonymousSessionId: getAnonymousSessionId(),
    route: currentRoute(),
    referrer: document.referrer || "",
    metadata,
    ...currentUtm(),
  };

  track(eventName, Object.fromEntries(Object.entries(metadata).map(([key, value]) => [key, String(value ?? "")])));

  window.setTimeout(() => {
    fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Analytics is best-effort and must never block the product.
    });
  }, 0);
}
