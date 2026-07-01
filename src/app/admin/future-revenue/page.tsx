import type { Metadata } from "next";
import FutureRevenueDashboard from "@/components/admin/FutureRevenueDashboard";

export const metadata: Metadata = {
  title: "Future Revenue | RepWatchr Admin",
  description: "Admin-only hidden feature flags and dormant future revenue infrastructure for RepWatchr.",
  robots: { index: false, follow: false },
};

export default function FutureRevenuePage() {
  return <FutureRevenueDashboard />;
}
