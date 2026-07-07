import type { Metadata } from "next";
import Link from "next/link";
import AdminPricingClient from "@/components/pricing/AdminPricingClient";
import { AdminAuthError, requireAdminPageAccess } from "@/lib/admin-auth";
import { getPricingAdminData } from "@/lib/pricing-beta";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing Experiments | RepWatchr Admin",
  description: "Secure RepWatchr admin desk for feature flags, beta demand, and pricing experiments.",
  robots: { index: false, follow: false },
};

export default async function AdminPricingPage() {
  try {
    await requireAdminPageAccess();
  } catch (error) {
    if (error instanceof AdminAuthError && error.status === 503) {
      return (
        <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Pricing desk offline</p>
          <h1 className="mt-2 text-3xl font-black text-blue-950">Supabase auth is required for `/admin/pricing`.</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Apply the pricing and beta access SQL, then configure server-side admin auth before using this desk.
          </p>
          <Link href="/" className="primary-button mt-5">Back to RepWatchr</Link>
        </main>
      );
    }
    throw error;
  }

  const data = await getPricingAdminData();

  return (
    <main className="rw-page-shell">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Secure admin</p>
          <h1 className="mt-2 text-4xl font-black text-slate-950">Pricing Experiments and Beta Access</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Test demand, messaging, and price sensitivity before charging. Public checkout stays off unless `ENABLE_PAYMENTS=true`.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AdminPricingClient initialData={data} />
      </section>
    </main>
  );
}
