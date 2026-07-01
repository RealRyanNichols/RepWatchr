"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";
import { trackVisitorIntelligenceEvent } from "@/lib/visitor-intelligence-client";

interface ProfileOpenTrackerProps {
  profileId: string;
  profileType: "official" | "school_board";
  path: string;
  districtSlug?: string;
  level?: string;
}

export default function ProfileOpenTracker({
  profileId,
  profileType,
  path,
  districtSlug,
  level,
}: ProfileOpenTrackerProps) {
  useEffect(() => {
    const properties: Record<string, string> = {
      profile_id: profileId,
      profile_type: profileType,
      path,
    };

    if (districtSlug) properties.district_slug = districtSlug;
    if (level) properties.level = level;

    track("profile_open", properties);
    trackVisitorIntelligenceEvent({
      eventType: "profile_open",
      path,
      entityType: profileType,
      entityId: profileId,
      entityLabel: districtSlug,
      topic: profileType === "official" ? "official_profile" : "school_board",
      metadata: {
        level: level ?? null,
      },
    });
  }, [districtSlug, level, path, profileId, profileType]);

  return null;
}
