"use client";

import { useEffect } from "react";
import { trackRepWatchrEvent, type RepWatchrEventName } from "@/lib/client-analytics";

type RouteEventTrackerProps = {
  eventName: Extract<RepWatchrEventName, "article_open" | "daily_wire_item_open">;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

export default function RouteEventTracker({ eventName, metadata = {} }: RouteEventTrackerProps) {
  useEffect(() => {
    trackRepWatchrEvent(eventName, metadata);
  }, [eventName, metadata]);

  return null;
}
