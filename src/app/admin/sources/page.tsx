import type { Metadata } from "next";
import { AdminSourceQueue } from "@/components/sources/SourceSubmission";

export const metadata: Metadata = {
  title: "Source Review Queue | RepWatchr Admin",
  description: "Admin-only RepWatchr source submission review, notes, status, duplicate, and attach workflow.",
  robots: { index: false, follow: false },
};

export default function AdminSourcesPage() {
  return <AdminSourceQueue />;
}
