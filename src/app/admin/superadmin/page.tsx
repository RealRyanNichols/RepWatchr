import type { Metadata } from "next";
import SuperAdminOfficeClient from "@/components/admin/SuperAdminOfficeClient";
import {
  buildSuperAdminSnapshot,
  buildSuperAdminWatchItems,
} from "@/lib/superadmin-data";

export const metadata: Metadata = {
  title: "SuperAdmin Office | RepWatchr",
  description:
    "RepWatchr operator office for Texas buildout progress, analytics, case review, profile questions, and accountability decisions.",
  robots: { index: false, follow: false },
};

export default function SuperAdminOfficePage() {
  return (
    <SuperAdminOfficeClient
      initialSnapshot={buildSuperAdminSnapshot()}
      initialWatchItems={buildSuperAdminWatchItems()}
    />
  );
}
