import type { Metadata } from "next";
import AdminControlCenterClient from "@/components/admin/AdminControlCenterClient";

export const metadata: Metadata = {
  title: "Data Control Center | RepWatchr Admin",
  description: "Admin-only RepWatchr data, analytics, source, and social monitoring control center.",
  robots: { index: false, follow: false },
};

export default function AdminControlCenterPage() {
  return <AdminControlCenterClient />;
}
