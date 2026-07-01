import type { Metadata } from "next";
import Link from "next/link";
import PrivacyControlsPanel from "@/components/trust/PrivacyControlsPanel";

export const metadata: Metadata = {
  title: "Privacy Controls",
  description: "Manage RepWatchr privacy requests, interest reset, and account data controls.",
};

export default function PrivacyControlsPage() {
  return (
    <div className="rw-page-shell">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">Privacy center</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">Reset, request, or control your RepWatchr data.</h1>
          <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-slate-200 sm:text-base">
            These controls are for interest-profile reset, access requests, deletion requests, contributor visibility, digest opt-outs, and privacy questions.
          </p>
          <Link href="/privacy" className="mt-5 inline-flex rounded-xl border border-white/20 px-4 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-white hover:text-slate-950">
            Read privacy policy
          </Link>
        </section>

        <div className="mt-6">
          <PrivacyControlsPanel />
        </div>
      </main>
    </div>
  );
}
