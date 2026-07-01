"use client";

import type { AnalyticsEventName } from "@/lib/analytics-taxonomy";
export {
  getAttributionContext,
  getOrCreateAnonymousId,
  getOrCreateSessionId,
  trackEvent,
  useTrackClick,
  useTrackFormStep,
  useTrackPageView,
  useTrackSectionView,
} from "@/lib/analytics-client";

export const VISITOR_INTELLIGENCE_EVENT = "repwatchr:visitor-intelligence";

export interface VisitorIntelligenceEventDetail {
  eventType: AnalyticsEventName | LegacyVisitorEventName;
  path?: string;
  entityType?: string;
  entityId?: string;
  entityLabel?: string;
  topic?: string;
  issueId?: string;
  county?: string;
  searchTerm?: string;
  buttonLabel?: string;
  buttonHref?: string;
  shareChannel?: string;
  downloadName?: string;
  packetType?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export type LegacyVisitorEventName =
  | "profile_view"
  | "topic_view"
  | "issue_view"
  | "county_view"
  | "search"
  | "button_click"
  | "share"
  | "packet_build"
  | "packet_creation"
  | "submit_source"
  | "source_submission"
  | "request_review"
  | "email_signup"
  | "watch_record"
  | "watchlist_creation"
  | "official_follow"
  | "race_follow"
  | "admin_dashboard_opened";

export function trackVisitorIntelligenceEvent(detail: VisitorIntelligenceEventDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<VisitorIntelligenceEventDetail>(VISITOR_INTELLIGENCE_EVENT, {
      detail,
    }),
  );
}
