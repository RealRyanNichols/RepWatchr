"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics-client";

type HomepageEventName =
  | "homepage_open"
  | "homepage_quick_chip_clicked"
  | "homepage_counter_clicked"
  | "homepage_action_card_clicked"
  | "homepage_recent_profile_clicked"
  | "homepage_source_gap_clicked"
  | "homepage_packet_funnel_viewed"
  | "homepage_packet_started"
  | "homepage_watchlist_cta_clicked"
  | "homepage_package_interest_clicked"
  | "homepage_trust_box_clicked";

type MetadataValue = string | number | boolean | null | undefined;
type HomepageEventMetadata = Record<string, MetadataValue>;

export function HomepageOpenTracker() {
  useEffect(() => {
    void trackEvent("homepage_open", {
      surface: "homepage",
    });
  }, []);

  return null;
}

export function HomepageSectionViewTracker({
  eventName,
  metadata,
}: {
  eventName: HomepageEventName;
  metadata?: HomepageEventMetadata;
}) {
  useEffect(() => {
    void trackEvent(eventName, {
      surface: "homepage",
      ...metadata,
    });
  }, [eventName, metadata]);

  return null;
}

export function HomepageTrackedLink({
  eventName,
  metadata,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof Link> & {
  eventName: HomepageEventName;
  metadata?: HomepageEventMetadata;
  children: ReactNode;
}) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        props.onClick?.(event);
        void trackEvent(eventName, {
          surface: "homepage",
          href: typeof props.href === "string" ? props.href : props.href.toString(),
          ...metadata,
        });
      }}
    >
      {children}
    </Link>
  );
}
