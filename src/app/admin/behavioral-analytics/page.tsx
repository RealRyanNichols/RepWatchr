import type { Metadata } from "next";
import BehavioralAnalyticsDashboard from "@/components/admin/BehavioralAnalyticsDashboard";

export const metadata: Metadata = {
  title: "Behavioral Analytics | RepWatchr Admin",
  description: "Admin-only behavioral analytics, engagement scores, heatmaps, funnels, cohorts, and top records.",
  robots: { index: false, follow: false },
};

export default function BehavioralAnalyticsPage() {
  return <BehavioralAnalyticsDashboard />;
}
