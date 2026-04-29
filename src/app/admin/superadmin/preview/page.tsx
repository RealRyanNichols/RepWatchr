import type { Metadata } from "next";
import SuperAdminOfficeClient from "@/components/admin/SuperAdminOfficeClient";
import {
  buildSuperAdminSnapshot,
  buildSuperAdminWatchItems,
} from "@/lib/superadmin-data";

export const metadata: Metadata = {
  title: "SuperAdmin Preview | RepWatchr",
  description:
    "Mock-data preview of the RepWatchr SuperAdmin office, tools, analytics, case review, profile questions, and decision cards.",
  robots: { index: false, follow: false },
};

export default function SuperAdminOfficePreviewPage() {
  return (
    <SuperAdminOfficeClient
      initialSnapshot={buildSuperAdminSnapshot()}
      initialWatchItems={buildSuperAdminWatchItems()}
      previewMode
    />
  );
}
