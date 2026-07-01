"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics-client";

type ProfileSectionTrackerProps = {
  officialId: string;
  officialName: string;
  profilePath: string;
  section: string;
  eventName?: string;
  metadata?: Record<string, unknown>;
};

export default function ProfileSectionTracker({
  officialId,
  officialName,
  profilePath,
  section,
  eventName = "profile_section_viewed",
  metadata = {},
}: ProfileSectionTrackerProps) {
  useEffect(() => {
    void trackEvent(eventName, {
      official_id: officialId,
      official_name: officialName,
      section,
      ...metadata,
    }, { route: profilePath });
  }, [eventName, metadata, officialId, officialName, profilePath, section]);

  return null;
}
