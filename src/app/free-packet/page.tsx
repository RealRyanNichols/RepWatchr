import type { Metadata } from "next";
import Link from "next/link";
import SourcePacketBuilder from "@/components/tools/SourcePacketBuilder";
import { breadcrumbJsonLd, getPageMetadata } from "@/lib/seo";

export const metadata: Metadata = getPageMetadata({
  title: "Free Source Packet Builder",
  description: "Turn one public source URL into a clean, source-backed RepWatchr packet with safe share text, missing context, and next records to request.",
  path: "/free-packet",
  imagePath: "/api/og?type=source-packet&title=Free%20Source%20Packet%20Builder",
});

export default function FreePacketPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_36%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_52%,#fff_100%)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "RepWatchr", path: "/" },
              { name: "Free Source Packet", path: "/free-packet" },
            ]),
          ),
        }}
      />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-6 overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.10)]">
          <div className="h-2 bg-[linear-gradient(90deg,#bf0d3e_0%,#bf0d3e_33%,#ffffff_33%,#ffffff_66%,#002868_66%,#002868_100%)]" />
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Free civic tool</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight tracking-tight text-blue-950 sm:text-6xl">
                Build the receipt before you share the outrage.
              </h1>
              <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-700">
                Paste one public source, name the target, separate confirmed facts from missing context, and create a packet that can be copied, saved, submitted, or turned into a public question.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:min-w-80 lg:grid-cols-1">
              <Link href="/tools/public-records-request" className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:text-red-700">
                Draft records request
              </Link>
              <Link href="/submit-source" className="rounded-2xl bg-red-700 px-4 py-3 text-center text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-950">
                Submit source
              </Link>
            </div>
          </div>
        </section>

        <SourcePacketBuilder surface="free_packet_page" />
      </main>
    </div>
  );
}
