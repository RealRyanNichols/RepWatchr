import type { Metadata } from "next";
import Link from "next/link";
import OfflinePageTracker from "@/components/mobile/OfflinePageTracker";

export const metadata: Metadata = {
  title: "Offline | RepWatchr",
  description: "RepWatchr offline fallback for the mobile app shell.",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="rw-page-shell">
      <OfflinePageTracker />
      <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Offline mode</p>
          <h1 className="mt-2 text-4xl font-black leading-tight text-slate-950">Live public records need a connection.</h1>
          <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
            RepWatchr cached the app shell so you can get back to search, packets, and source tools quickly. Live profiles,
            dashboard data, admin queues, and submitted records are not cached offline.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link href="/search" className="primary-button text-center">Search again</Link>
            <Link href="/free-packet" className="secondary-button text-center">Open packet builder</Link>
          </div>
          <p className="mt-4 text-sm font-bold leading-6 text-slate-500">
            If you are in a meeting, save the public URL locally and submit it when your connection returns.
          </p>
        </div>
      </section>
    </main>
  );
}
