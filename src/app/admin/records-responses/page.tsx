import type { Metadata } from "next";
import Link from "next/link";
import AdminRecordsResponseQueue from "@/components/records-responses/AdminRecordsResponseQueue";
import { AdminAuthError, requireAdminPageAccess } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Records Response Desk | RepWatchr Admin",
  description: "Secure RepWatchr admin review queue for public records responses, uploaded documents, summaries, and source attachments.",
  robots: { index: false, follow: false },
};

export default async function AdminRecordsResponsesPage() {
  let adminUser;
  try {
    adminUser = await requireAdminPageAccess();
  } catch (error) {
    if (error instanceof AdminAuthError && error.status === 503) {
      return (
        <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Records Response Desk offline</p>
          <h1 className="mt-2 text-3xl font-black text-blue-950">Supabase auth is required for `/admin/records-responses`.</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Apply the public records response SQL and configure Supabase auth before using document review.
          </p>
          <Link href="/" className="primary-button mt-5">Back to RepWatchr</Link>
        </main>
      );
    }
    throw error;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = supabase
    ? await supabase
        .from("records_responses")
        .select("*, records_response_files(*)")
        .order("created_at", { ascending: false })
        .limit(40)
    : { data: [], error: { message: "Supabase admin client is not configured." } };

  return (
    <main className="rw-page-shell">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Secure admin</p>
          <h1 className="mt-2 text-4xl font-black text-slate-950">Records Response Desk</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Signed in as {adminUser.email ?? "admin"}. Review uploaded public-record responses, mark sensitivity, write safe summaries, and record attachment decisions.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/admin" className="secondary-button">Admin overview</Link>
            <Link href="/tools/public-records-response" className="secondary-button">Public intake</Link>
          </div>
          {error ? (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-black text-amber-950">
              Could not load response queue: {error.message}
            </p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AdminRecordsResponseQueue responses={(data ?? []) as never} />
      </section>
    </main>
  );
}
