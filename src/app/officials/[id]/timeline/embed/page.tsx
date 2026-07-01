import type { Metadata } from "next";
import { notFound } from "next/navigation";
import OfficialTimeline from "@/components/officials/OfficialTimeline";
import { getOfficialTimelineBundle } from "@/lib/official-timeline";

export const revalidate = 86400;
export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const bundle = await getOfficialTimelineBundle(id);
  const official = bundle.official;

  return {
    title: official ? `${official.name} RepWatchr Timeline Embed` : "RepWatchr Timeline Embed",
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function OfficialTimelineEmbedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bundle = await getOfficialTimelineBundle(id);
  const official = bundle.official;
  if (!official) notFound();

  const embeddableEvents = bundle.events.filter((event) => event.embedAllowed);

  return (
    <main className="bg-white text-slate-950">
      <OfficialTimeline
        officialId={official.id}
        officialName={official.name}
        events={embeddableEvents}
        embedded
      />
    </main>
  );
}
