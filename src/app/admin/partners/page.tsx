import type { Metadata } from "next";
import Link from "next/link";
import AdminPartnerPipelineClient from "@/components/investors/AdminPartnerPipelineClient";
import { AdminAuthError, requireAdminPageAccess } from "@/lib/admin-auth";
import { getPartnerPipelineData } from "@/lib/partner-pipeline-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Partner Pipeline | RepWatchr Admin",
  description: "Secure RepWatchr admin pipeline for investors, partners, sponsors, B2B leads, and organization accounts.",
  robots: { index: false, follow: false },
};

export default async function AdminPartnersPage() {
  let adminUser;
  try {
    adminUser = await requireAdminPageAccess();
  } catch (error) {
    if (error instanceof AdminAuthError && error.status === 503) {
      return (
        <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Partner pipeline offline</p>
          <h1 className="mt-2 text-3xl font-black text-blue-950">Supabase auth is required for `/admin/partners`.</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Apply the investor/partner pipeline SQL and configure server-side admin auth before using this desk.
          </p>
          <Link href="/" className="primary-button mt-5">Back to RepWatchr</Link>
        </main>
      );
    }
    throw error;
  }

  const data = await getPartnerPipelineData();

  return (
    <main className="rw-page-shell">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Secure admin</p>
          <h1 className="mt-2 text-4xl font-black text-slate-950">Investor, Partner, Sponsor, and B2B Pipeline</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Signed in as {adminUser.email ?? "admin"}. Review interest, qualify conversations, create partner accounts, and keep sponsor boundaries explicit.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AdminPartnerPipelineClient initialData={data} adminUserId={adminUser.id} />
      </section>
    </main>
  );
}
