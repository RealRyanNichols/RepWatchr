import type { Metadata } from "next";
import Link from "next/link";
import AdminQualityDashboardClient from "@/components/quality/AdminQualityDashboardClient";
import { AdminAuthError, requireAdminPageAccess } from "@/lib/admin-auth";
import { getQualityAdminData } from "@/lib/qa-monitoring";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Quality Monitor | RepWatchr Admin",
  description: "Admin-only QA, environment, route smoke, error monitoring, and deploy-readiness desk for RepWatchr.",
  robots: { index: false, follow: false },
};

export default async function AdminQualityPage() {
  try {
    await requireAdminPageAccess();
  } catch (error) {
    if (error instanceof AdminAuthError && error.status === 503) {
      return (
        <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Quality desk offline</p>
          <h1 className="mt-2 text-3xl font-black text-blue-950">Supabase auth is required for `/admin/quality`.</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Configure server-side admin auth before reviewing route health, error logs, and deploy readiness.
          </p>
          <Link href="/" className="primary-button mt-5">Back to RepWatchr</Link>
        </main>
      );
    }
    throw error;
  }

  const data = await getQualityAdminData();

  return (
    <main className="rw-page-shell">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AdminQualityDashboardClient initialData={data} />
      </section>
    </main>
  );
}
