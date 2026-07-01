"use client";

import { useEffect } from "react";
import type { RepWatchrPackage } from "@/data/repwatchr-packages";
import { trackEvent } from "@/lib/analytics-client";

export default function PackagePageTracker({ packageItem }: { packageItem: RepWatchrPackage }) {
  useEffect(() => {
    void trackEvent("package_page_open", {
      package_key: packageItem.packageKey,
      package_slug: packageItem.slug,
      package_name: packageItem.name,
    });
  }, [packageItem.packageKey, packageItem.name, packageItem.slug]);

  return null;
}
