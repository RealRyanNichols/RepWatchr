import type { Metadata } from "next";
import AdminCorrectionsClient from "@/components/trust/AdminCorrectionsClient";

export const metadata: Metadata = {
  title: "Corrections | RepWatchr Admin",
  description: "Admin-only correction review queue for RepWatchr public records.",
  robots: { index: false, follow: false },
};

export default function AdminCorrectionsPage() {
  return <AdminCorrectionsClient />;
}
