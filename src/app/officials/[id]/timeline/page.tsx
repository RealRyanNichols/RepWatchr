import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import OfficialTimeline from "@/components/officials/OfficialTimeline";
import { getOfficialTimelineBundle } from "@/lib/official-timeline";

export const revalidate = 86400;
export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const bundle = await getOfficialTimelineBundle(id);
  const official = bundle.official;
  if (!official) return { title: "Official Timeline Not Found" };

  const title = `${official.name} Public Record Timeline`;
  const description = `Search and share ${bundle.events.length} source-linked RepWatchr timeline events for ${official.name}, ${official.position} serving ${official.jurisdiction}.`;
  const canonicalUrl = `https://www.repwatchr.com/officials/${official.id}/timeline`;
  const ogImage = `/api/og/official?id=${encodeURIComponent(official.id)}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "RepWatchr",
      type: "profile",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${official.name} RepWatchr public record timeline`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function OfficialTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bundle = await getOfficialTimelineBundle(id);
  const official = bundle.official;
  if (!official) notFound();

  return (
    <main className="min-h-screen bg-[#f8fbff] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                <Link href="/officials" className="hover:text-blue-700">
                  Officials
                </Link>
                <span>/</span>
                <Link href={`/officials/${official.id}`} className="hover:text-blue-700">
                  {official.name}
                </Link>
                <span>/ Timeline</span>
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                {official.name} Timeline
              </h1>
              <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-600">
                A searchable public-record timeline for {official.position} {official.district ? `District ${official.district}` : ""} in {official.jurisdiction}.
              </p>
            </div>
            <Link
              href={`/officials/${official.id}`}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-900 transition hover:border-blue-300 hover:bg-blue-50"
            >
              Back to full dossier
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <OfficialTimeline
          officialId={official.id}
          officialName={official.name}
          events={bundle.events}
        />
      </section>
    </main>
  );
}
