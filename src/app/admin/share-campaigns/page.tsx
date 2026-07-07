import type { Metadata } from "next";
import Link from "next/link";
import AdminShareCampaignManager from "@/components/referrals/AdminShareCampaignManager";
import { AdminAuthError, requireAdminPageAccess } from "@/lib/admin-auth";
import { getShareCampaignAdminData } from "@/lib/share-campaign-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Share Campaigns | RepWatchr Admin",
  description: "Secure RepWatchr admin tools for referral links, safe share campaigns, copy review, and campaign stats.",
  robots: { index: false, follow: false },
};

export default async function AdminShareCampaignsPage() {
  let adminUser;
  try {
    adminUser = await requireAdminPageAccess();
  } catch (error) {
    if (error instanceof AdminAuthError && error.status === 503) {
      return (
        <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Share campaigns offline</p>
          <h1 className="mt-2 text-3xl font-black text-blue-950">Supabase auth is required for `/admin/share-campaigns`.</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Apply the referral/share SQL and configure server-side admin auth before using this desk.
          </p>
          <Link href="/" className="primary-button mt-5">Back to RepWatchr</Link>
        </main>
      );
    }
    throw error;
  }

  const data = await getShareCampaignAdminData();

  return (
    <main className="rw-page-shell">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Secure admin</p>
          <h1 className="mt-2 text-4xl font-black text-slate-950">Referral and Share Campaigns</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Signed in as {adminUser.email ?? "admin"}. Build opt-in share moments, track referral visits, and keep copy source-first.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AdminShareCampaignManager initialData={data} />
      </section>
    </main>
  );
}
