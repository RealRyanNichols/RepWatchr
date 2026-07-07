"use client";

import { useEffect } from "react";
import { trackRepWatchrEvent } from "@/lib/client-analytics";
import type { PublicRoleGroup } from "@/lib/public-role-safety";

type Props = {
  profileSlug: string;
  profileName: string;
  group: PublicRoleGroup;
  sourceCount: number;
};

const clickEvents = [
  { attribute: "data-agency-policy-source", eventName: "agency_policy_source_clicked" },
  { attribute: "data-public-info-source", eventName: "public_info_source_clicked" },
  { attribute: "data-badge-correction", eventName: "badge_profile_correction_clicked" },
  { attribute: "data-badge-source-submit", eventName: "badge_profile_source_submitted" },
  { attribute: "data-safety-report", eventName: "safety_report_submitted" },
] as const;

export default function PublicSafetyProfileAnalytics({ profileSlug, profileName, group, sourceCount }: Props) {
  useEffect(() => {
    trackRepWatchrEvent(group === "court" ? "court_profile_open" : "badge_profile_open", {
      profileSlug,
      profileName,
      publicRoleGroup: group,
      sourceCount,
    });
    trackRepWatchrEvent("public_role_boundary_viewed", {
      profileSlug,
      profileName,
      publicRoleGroup: group,
    });
  }, [profileSlug, profileName, group, sourceCount]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      for (const item of clickEvents) {
        const element = target.closest(`[${item.attribute}]`);
        if (!element) continue;
        trackRepWatchrEvent(item.eventName, {
          profileSlug,
          profileName,
          publicRoleGroup: group,
          label: element.getAttribute(item.attribute) || element.textContent?.trim().slice(0, 120) || "",
          href: element instanceof HTMLAnchorElement ? element.href : "",
        });
        return;
      }
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [profileSlug, profileName, group]);

  return null;
}
