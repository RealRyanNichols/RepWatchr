import type { Metadata } from "next";
import Link from "next/link";
import AdminPublicDataApiClient from "@/components/public-data-api/AdminPublicDataApiClient";
import { AdminAuthError, requireAdminPageAccess } from "@/lib/admin-auth";
import { getPublicDataApiAdminData } from "@/lib/public-data-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Public Data API | RepWatchr Admin",
  description: "Secure RepWatchr admin desk for future API access, export requests, usage, and scopes.",
  robots: { index: false, follow: false },
};

export default async function AdminPublicDataApiPage() {
  try {
    await requireAdminPageAccess();
  } catch (error) {
    if (error instanceof AdminAuthError && error.status === 503) {
      return (
        <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">API desk offline</p>
          <h1 className="mt-2 text-3xl font-black text-blue-950">Supabase auth is required for `/admin/api`.</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Apply the public data API SQL, then configure server-side admin auth before issuing keys or reviewing requests.
          </p>
          <Link href="/" className="primary-button mt-5">Back to RepWatchr</Link>
        </main>
      );
    }
    throw error;
  }

  const data = await getPublicDataApiAdminData();

  return (
    <main className="rw-page-shell">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Secure admin</p>
          <h1 className="mt-2 text-4xl font-black text-slate-950">Public Data API and Exports</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Review API access demand, usage, scopes, keys, and future export jobs. Public API access stays off unless `ENABLE_PUBLIC_API=true`.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AdminPublicDataApiClient initialData={data} />
      </section>
    </main>
  );
}
