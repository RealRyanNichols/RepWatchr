import type { Metadata } from "next";
import Link from "next/link";
import PrivacyControlsPanel from "@/components/trust/PrivacyControlsPanel";

export const metadata: Metadata = {
  title: "Dashboard Privacy",
  description: "Member privacy controls for RepWatchr watchlists, digests, contributor visibility, and interest profile.",
  robots: { index: false, follow: false },
};

export default function DashboardPrivacyPage() {
  return (
    <div className="rw-page-shell">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5">
          <Link href="/dashboard" className="text-sm font-black text-blue-700 hover:underline">
            Back to dashboard
          </Link>
        </div>
        <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">Member privacy</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Your RepWatchr privacy controls.</h1>
          <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-slate-600 sm:text-base">
            Manage requests tied to your account and reset the interest signals used for recommendations, dashboards, alerts, and digest topics.
          </p>
        </section>

        <div className="mt-6">
          <PrivacyControlsPanel />
        </div>
      </main>
    </div>
  );
}
