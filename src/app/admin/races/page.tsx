import type { Metadata } from "next";
import Link from "next/link";
import AdminRaceDeskClient from "@/components/admin/AdminRaceDeskClient";
import { AdminAuthError, requireAdminPageAccess } from "@/lib/admin-auth";
import { getAdminRaceDeskData } from "@/lib/race-hub-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Race Desk | RepWatchr Admin",
  description: "Secure RepWatchr admin tools for race pages, candidates, source links, stories, funding records, and red flags.",
  robots: { index: false, follow: false },
};

export default async function AdminRaceDeskPage() {
  let adminUser;

  try {
    adminUser = await requireAdminPageAccess();
  } catch (error) {
    if (error instanceof AdminAuthError && error.status === 503) {
      return (
        <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Race Desk offline</p>
          <h1 className="mt-2 text-3xl font-black text-blue-950">Supabase auth is required for `/admin/races`.</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Secure admin environment is not ready. Check the launch checklist for the exact server-side variables and Supabase role setup.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex rounded-lg bg-blue-950 px-5 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-red-700"
          >
            Back to RepWatchr
          </Link>
        </main>
      );
    }
    throw error;
  }

  const data = await getAdminRaceDeskData();
  return <AdminRaceDeskClient adminEmail={adminUser.email ?? "Admin"} initialData={data} />;
}
