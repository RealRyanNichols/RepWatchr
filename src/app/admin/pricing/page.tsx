import type { Metadata } from "next";
import PricingExperimentsDashboard from "@/components/admin/PricingExperimentsDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing Experiments | RepWatchr Admin",
  description: "Admin-only pricing experiments, beta access requests, and feature flag controls.",
  robots: { index: false, follow: false },
};

export default function AdminPricingPage() {
  return <PricingExperimentsDashboard />;
}
