import type { Metadata } from "next";
import AdminIntakeClient from "@/components/intake/AdminIntakeClient";

export const metadata: Metadata = {
  title: "Form Intake | RepWatchr Admin",
  description: "Admin-only universal intake queue for RepWatchr submissions, corrections, package interest, and source review.",
  robots: { index: false, follow: false },
};

export default function AdminIntakePage() {
  return <AdminIntakeClient />;
}
