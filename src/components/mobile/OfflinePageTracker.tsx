"use client";

import { useEffect } from "react";
import { trackRepWatchrEvent } from "@/lib/client-analytics";

export default function OfflinePageTracker() {
  useEffect(() => {
    trackRepWatchrEvent("offline_page_viewed", { source: "service_worker_fallback" });
  }, []);

  return null;
}
