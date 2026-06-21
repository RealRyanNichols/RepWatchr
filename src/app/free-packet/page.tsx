import type { Metadata } from "next";
import Link from "next/link";
import FreePacketFunnel from "@/components/free-packet/FreePacketFunnel";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";

export const metadata: Metadata = buildRepWatchrMetadata({
  title: "Free Source Packet Builder | RepWatchr",
  description:
    "Build a clean source packet from one public URL, save it to the RepWatchr review queue, and copy or download the receipt.",
  path: "/free-packet",
  imagePath: buildOgImageUrl("source-packet", { target: "Free Source Packet Builder" }),
  imageAlt: "RepWatchr free source packet builder preview",
});

export default function FreePacketPage() {
  return (
    <main className="min-h-screen bg-[#f6f9fc]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Free packet funnel</p>
            <h1 className="mt-3 text-4xl font-black leading-[0.98] tracking-tight text-blue-950 sm:text-6xl">
              Build the receipt before the post.
            </h1>
            <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-slate-700 sm:text-lg">
              RepWatchr turns one public source URL into a clean packet: target, jurisdiction, source link, summary, what needs checking, and a copyable share-safe record.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Official", "Race", "School board", "Vote", "Meeting", "Funding", "Red flag", "Correction"].map((label) => (
                <span key={label} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-900">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <FreePacketFunnel />

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-red-700">What happens next</p>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
              Your source goes into review as new. RepWatchr can verify it, reject it, request more info, or attach it to a profile, race, article, or red-flag record.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-red-700">Guardrail</p>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
              Public records first. No private addresses, minor children, threats, doxxing, sealed records, or unsourced allegations.
            </p>
          </div>
          <Link href="/services/quick-record-check" className="rounded-lg border border-red-100 bg-red-50 p-5 text-sm font-bold leading-6 text-red-950 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white">
            <span className="block text-xs font-black uppercase tracking-wide text-red-800">Paid next step</span>
            Need RepWatchr to review one source before you share it? Request a Quick Record Check.
          </Link>
        </section>
      </div>
    </main>
  );
}
