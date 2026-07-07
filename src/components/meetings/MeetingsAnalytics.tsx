"use client";

import { useEffect } from "react";
import { trackRepWatchrEvent } from "@/lib/client-analytics";

type Props = {
  pageType: "school_board" | "public_body" | "meeting" | "jurisdiction_meetings";
  entitySlug: string;
  entityName: string;
  sourceCount?: number;
};

const clickEvents = [
  { attribute: "data-public-body-watch", eventName: "public_body_watch_clicked" },
  { attribute: "data-agenda-source", eventName: "agenda_source_clicked" },
  { attribute: "data-minutes-source", eventName: "minutes_source_clicked" },
  { attribute: "data-video-source", eventName: "video_source_clicked" },
  { attribute: "data-meeting-source-gap", eventName: "meeting_source_gap_clicked" },
  { attribute: "data-school-board-package-interest", eventName: "school_board_package_interest_clicked" },
] as const;

export default function MeetingsAnalytics({ pageType, entitySlug, entityName, sourceCount = 0 }: Props) {
  useEffect(() => {
    if (pageType === "meeting") {
      trackRepWatchrEvent("meeting_open", { entitySlug, entityName, sourceCount });
      return;
    }
    if (pageType === "school_board") {
      trackRepWatchrEvent("school_board_page_open", { entitySlug, entityName, sourceCount });
    }
  }, [pageType, entitySlug, entityName, sourceCount]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      for (const item of clickEvents) {
        const element = target.closest(`[${item.attribute}]`);
        if (!element) continue;
        trackRepWatchrEvent(item.eventName, {
          entitySlug,
          entityName,
          pageType,
          label: element.getAttribute(item.attribute) || element.textContent?.trim().slice(0, 120) || "",
          href: element instanceof HTMLAnchorElement ? element.href : "",
        });
        return;
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pageType, entitySlug, entityName]);

  return null;
}
