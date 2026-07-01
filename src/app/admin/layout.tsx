import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireAdminPageAccess } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Admin | RepWatchr",
    template: "%s | RepWatchr Admin",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const access = await requireAdminPageAccess();

  if (!access.ok && access.status === 401) {
    redirect("/auth/login");
  }

  if (!access.ok && access.status === 403) {
    redirect("/dashboard?admin=required");
  }

  if (!access.ok) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Admin locked</p>
          <h1 className="mt-3 text-3xl font-black text-blue-950">Admin access is not configured yet.</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
            This route is blocked until Supabase public auth variables are configured. No admin data is rendered without a verified admin session.
          </p>
          <p className="mt-4 rounded-xl bg-slate-50 p-4 text-xs font-bold text-slate-600">
            Needed: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
          </p>
        </div>
      </section>
    );
  }

  return children;
}
