"use client";

import { useEffect } from "react";
import { trackRepWatchrEvent, type RepWatchrEventName } from "@/lib/client-analytics";

type RaceHubAnalyticsProps = {
  raceSlug: string;
  raceTitle: string;
  routeKind?: "race" | "county" | "district" | "compare";
  sourceCount?: number;
  candidateCount?: number;
  missingRecordCount?: number;
};

const clickEventByAttribute: Array<{
  attribute: string;
  eventName: RepWatchrEventName;
}> = [
  { attribute: "data-race-candidate", eventName: "race_candidate_clicked" },
  { attribute: "data-race-source", eventName: "race_source_clicked" },
  { attribute: "data-race-watch", eventName: "race_watch_clicked" },
  { attribute: "data-race-submit-source", eventName: "race_submit_source_clicked" },
  { attribute: "data-race-package", eventName: "race_package_interest_clicked" },
  { attribute: "data-race-compare", eventName: "race_compare_open" },
];

export default function RaceHubAnalytics({
  raceSlug,
  raceTitle,
  routeKind = "race",
  sourceCount = 0,
  candidateCount = 0,
  missingRecordCount = 0,
}: RaceHubAnalyticsProps) {
  useEffect(() => {
    trackRepWatchrEvent(routeKind === "compare" ? "race_compare_open" : "race_hub_open", {
      raceSlug,
      raceTitle,
      routeKind,
      sourceCount,
      candidateCount,
      missingRecordCount,
    });
  }, [candidateCount, missingRecordCount, raceSlug, raceTitle, routeKind, sourceCount]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      for (const item of clickEventByAttribute) {
        const element = target.closest(`[${item.attribute}]`);
        if (!element) continue;
        trackRepWatchrEvent(item.eventName, {
          raceSlug,
          raceTitle,
          routeKind,
          label: element.getAttribute(item.attribute) || element.textContent?.trim().slice(0, 120) || "",
          href: element instanceof HTMLAnchorElement ? element.href : "",
        });
        return;
      }
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [raceSlug, raceTitle, routeKind]);

  return null;
}
