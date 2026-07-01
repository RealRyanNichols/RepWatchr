import type { Metadata } from "next";
import BehavioralAnalyticsDashboard from "@/components/admin/BehavioralAnalyticsDashboard";

export const metadata: Metadata = {
  title: "Analytics | RepWatchr Admin",
  description: "Admin-only analytics, visitor intelligence, attribution, funnels, and engagement reporting.",
  robots: { index: false, follow: false },
};

export default function AdminAnalyticsPage() {
  return <BehavioralAnalyticsDashboard />;
}
