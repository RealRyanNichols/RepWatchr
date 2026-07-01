import type { Metadata } from "next";
import Link from "next/link";
import SourcePacketBuilder from "@/components/tools/SourcePacketBuilder";
import { breadcrumbJsonLd, getPageMetadata } from "@/lib/seo";

export const metadata: Metadata = getPageMetadata({
  title: "Source Packet Builder",
  description: "Build a RepWatchr source packet from a public URL with cautious language, missing context, a public question, and a next-record request.",
  path: "/tools/source-packet-builder",
  imagePath: "/api/og?type=source-packet&title=Source%20Packet%20Builder",
});

export default function SourcePacketBuilderPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_54%,#fff_100%)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "RepWatchr", path: "/" },
              { name: "Tools", path: "/tools/source-packet-builder" },
              { name: "Source Packet Builder", path: "/tools/source-packet-builder" },
            ]),
          ),
        }}
      />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Tool desk</p>
            <h1 className="mt-2 text-4xl font-black text-blue-950 sm:text-6xl">Source Packet Builder</h1>
          </div>
          <Link href="/free-packet" className="rounded-2xl bg-blue-950 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-red-700">
            Open free funnel
          </Link>
        </div>
        <SourcePacketBuilder surface="source_packet_builder_route" />
      </main>
    </div>
  );
}
