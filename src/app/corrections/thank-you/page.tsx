import type { Metadata } from "next";
import Link from "next/link";
import CorrectionStatusBadge from "@/components/trust/CorrectionStatusBadge";

export const metadata: Metadata = {
  title: "Correction Received",
  description: "RepWatchr correction request receipt and next actions.",
  robots: { index: false, follow: false },
};

export default async function CorrectionThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; status?: string; entityType?: string }>;
}) {
  const params = await searchParams;
  const id = params.id || "pending";
  const status = params.status || "new";

  return (
    <div className="rw-page-shell">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Correction received</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Your request is in review.</h1>
          <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
            RepWatchr does not auto-publish correction claims as fact. A reviewer must verify the public source, update the affected record, or request more information.
          </p>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">Correction ID</p>
            <p className="mt-1 break-all text-xl font-black text-blue-950">{id}</p>
            <div className="mt-4">
              <CorrectionStatusBadge status={status} />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link href="/sources/submit" className="rounded-2xl bg-blue-950 px-4 py-3 text-center text-sm font-black uppercase tracking-wide text-white hover:bg-red-700">
              Submit another source
            </Link>
            <Link href="/search" className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black uppercase tracking-wide text-blue-950 hover:border-red-300 hover:text-red-700">
              Search records
            </Link>
            <Link href="/privacy/controls" className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black uppercase tracking-wide text-blue-950 hover:border-red-300 hover:text-red-700">
              Privacy controls
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
