"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { trackEvent } from "@/lib/analytics-client";

export function AdminOpenTracker({ moduleName = "root" }: { moduleName?: string }) {
  useEffect(() => {
    void trackEvent("admin_open", { module: moduleName }, { route: "/admin" });
  }, [moduleName]);

  return null;
}

export function AdminTrackedLink({
  href,
  moduleName,
  eventName = "admin_module_open",
  className,
  children,
}: {
  href: string;
  moduleName: string;
  eventName?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        void trackEvent(eventName, { module: moduleName, href }, { route: "/admin" });
      }}
    >
      {children}
    </Link>
  );
}
