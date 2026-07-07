import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import RecordsResponseIntakeForm from "@/components/records-responses/RecordsResponseIntakeForm";
import RecordsResponseStatusBadge from "@/components/records-responses/RecordsResponseStatusBadge";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Records Responses | RepWatchr",
  description: "Private member status page for submitted public records responses.",
  robots: { index: false, follow: false },
};

type RecordsResponseRow = {
  id: string;
  response_title: string | null;
  agency_name: string | null;
  jurisdiction: string | null;
  response_type: string | null;
  response_date: string | null;
  status: string | null;
  sensitivity_status: string | null;
  public_summary: string | null;
  created_at: string | null;
};

export default async function DashboardRecordsResponsesPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Dashboard offline</p>
        <h1 className="mt-2 text-3xl font-black text-blue-950">Supabase auth is required for response status.</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          Public intake still creates a packet backup, but private status history needs Supabase auth and the records response tables.
        </p>
        <Link href="/tools/public-records-response" className="primary-button mt-5">Open response intake</Link>
      </main>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/dashboard/records-responses");

  const { data, error } = await supabase
    .from("records_responses")
    .select("id, response_title, agency_name, jurisdiction, response_type, response_date, status, sensitivity_status, public_summary, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  const responses = (data ?? []) as RecordsResponseRow[];

  return (
    <main className="rw-page-shell">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Member workspace</p>
          <h1 className="mt-2 text-4xl font-black text-slate-950">My public records responses</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Track responses you submitted for review. Documents stay private unless an admin creates a safe public summary or source attachment.
          </p>
          {error ? (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-black text-amber-950">
              Could not load saved responses yet: {error.message}
            </p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="grid content-start gap-4">
          {responses.length ? (
            responses.map((row) => (
              <article key={row.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-slate-950">
                      {row.response_title || `${row.agency_name || "Agency"} response`}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      {row.agency_name || "Agency not supplied"} {row.jurisdiction ? `- ${row.jurisdiction}` : ""}
                    </p>
                  </div>
                  <RecordsResponseStatusBadge status={row.status} sensitivityStatus={row.sensitivity_status} />
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Submitted {row.created_at ? new Date(row.created_at).toLocaleString("en-US") : "recently"}
                </p>
                {row.public_summary ? (
                  <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold leading-6 text-emerald-950">
                    {row.public_summary}
                  </p>
                ) : (
                  <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-950">
                    No public summary yet. Human review is still required.
                  </p>
                )}
              </article>
            ))
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">No responses yet</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Add the first agency response.</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                When a public body replies to your records request, save it here before turning it into a public source packet.
              </p>
            </div>
          )}
        </div>

        <RecordsResponseIntakeForm compact />
      </section>
    </main>
  );
}
