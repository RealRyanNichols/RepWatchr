import type { Metadata } from "next";
import Link from "next/link";
import AdminPlannerClient from "@/components/admin/AdminPlannerClient";
import { AdminAuthError, requireAdminPageAccess } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Social Planner | RepWatchr Admin",
  description: "Review, edit, and approve scheduled X and Facebook posts before anything is published.",
  robots: { index: false, follow: false },
};

export default async function AdminPlannerPage() {
  let adminUser;
  try {
    adminUser = await requireAdminPageAccess();
  } catch (error) {
    if (error instanceof AdminAuthError && error.status === 503) {
      return (
        <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Planner offline</p>
          <h1 className="mt-2 text-3xl font-black text-blue-950">Supabase auth is required for the planner.</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Configure Supabase server auth on this deployment, then reload.
          </p>
        </main>
      );
    }
    throw error;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Social planner</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-blue-950 sm:text-4xl">
        Nothing posts until you say so.
      </h1>
      <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
        A scheduled run drafts posts from the daily wire, Notion, Drive, and project-relevant Fieldy leads, then stops
        here. You read it, fix it, approve it or kill it. Approved posts go out on the next scheduled run.
      </p>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        <Link href="/methodology" className="text-sm font-bold text-blue-700 hover:underline">
          The source standard &rarr;
        </Link>
        <Link href="/admin" className="text-sm font-bold text-blue-700 hover:underline">
          Admin home &rarr;
        </Link>
      </div>

      <div className="mt-8">
        <AdminPlannerClient reviewerLabel={adminUser.email ?? adminUser.id} />
      </div>
    </main>
  );
}
