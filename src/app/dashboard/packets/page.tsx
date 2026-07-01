import type { Metadata } from "next";
import Link from "next/link";
import SourcePacketBuilder from "@/components/tools/SourcePacketBuilder";

export const metadata: Metadata = {
  title: "Saved Source Packets",
  description: "Private RepWatchr member workspace for source packets.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardPacketsPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_54%,#fff_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-6 rounded-[2rem] border border-blue-100 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.10)]">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Member packets</p>
          <h1 className="mt-2 text-4xl font-black text-blue-950 sm:text-6xl">Source packets</h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
            Build, copy, submit, and save source packets from the member dashboard. Saved database rows appear here after the Supabase migration is applied.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/dashboard" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black uppercase tracking-wide text-blue-950 hover:border-red-300 hover:text-red-700">
              Dashboard
            </Link>
            <Link href="/dashboard/records-requests" className="rounded-xl bg-blue-950 px-4 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-red-700">
              Records requests
            </Link>
          </div>
        </section>
        <SourcePacketBuilder surface="dashboard_packets" />
      </div>
    </main>
  );
}
