import type { Metadata } from "next";
import MonetizationReadinessDashboard from "@/components/admin/MonetizationReadinessDashboard";

export const metadata: Metadata = {
  title: "Monetization Readiness | RepWatchr Admin",
  description: "Admin-only RepWatchr readiness report for public profiles, source intake, analytics, trust, SEO, and future revenue gates.",
  robots: { index: false, follow: false },
};

export default function MonetizationReadinessPage() {
  return <MonetizationReadinessDashboard />;
}
