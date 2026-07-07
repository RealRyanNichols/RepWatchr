import type { Metadata } from "next";
import Link from "next/link";
import LocalBodyTracker, { MeetingSummaryCard } from "@/components/meetings/LocalBodyTracker";
import MeetingsAnalytics from "@/components/meetings/MeetingsAnalytics";
import { getMeetingsForJurisdiction, getPublicBodies } from "@/lib/local-meetings";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";
import { breadcrumbJsonLd, datasetJsonLd, jsonLd } from "@/lib/structured-data";

export function generateStaticParams() {
  return getPublicBodies().slice(0, 80).map((body) => ({ slug: body.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { body } = getMeetingsForJurisdiction(slug);
  const title = body ? `${body.name} Meetings | RepWatchr` : `${slug.replaceAll("-", " ")} Meetings | RepWatchr`;
  const description = body
    ? `${body.name} meeting tracker: members, agendas, minutes, videos, public questions, and source gaps.`
    : "RepWatchr jurisdiction meeting tracker for public bodies, agendas, minutes, videos, and source gaps.";
  return buildRepWatchrMetadata({
    title,
    description,
    path: `/jurisdictions/${slug}/meetings`,
    imagePath: buildOgImageUrl("school-board", { type: "jurisdiction-meetings", jurisdiction: slug }),
    imageAlt: `${title} preview`,
  });
}

export default async function JurisdictionMeetingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { body, meetings } = getMeetingsForJurisdiction(slug);
  const title = body ? body.name : slug.replaceAll("-", " ");
  const breadcrumbStructuredData = breadcrumbJsonLd([
    { name: "RepWatchr", path: "/" },
    { name: "Meetings", path: "/meetings" },
    { name: title, path: `/jurisdictions/${slug}/meetings` },
  ]);
  const datasetStructuredData = datasetJsonLd({
    name: `${title} public meeting tracker`,
    path: `/jurisdictions/${slug}/meetings`,
    description: "Jurisdiction-level public meeting source tracker with source gaps and public questions.",
    keywords: ["public meetings", title, "agendas", "minutes", "RepWatchr"],
  });

  return (
    <main className="rw-page-shell">
      <MeetingsAnalytics
        pageType="jurisdiction_meetings"
        entitySlug={slug}
        entityName={title}
        sourceCount={meetings.reduce((sum, meeting) => sum + meeting.sourceCount, 0)}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbStructuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(datasetStructuredData) }} />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Link href="/meetings" className="text-sm font-black text-blue-700 hover:text-red-700">&larr; Meetings</Link>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-red-700">Jurisdiction meetings</p>
          <h1 className="mt-2 text-4xl font-black text-slate-950 sm:text-5xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-700">
            Public body meetings, source gaps, agendas, minutes, videos, and public questions for this jurisdiction lane.
          </p>
        </div>
      </section>

      {body ? (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <LocalBodyTracker body={body} meetings={meetings} />
        </section>
      ) : (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2">
            {meetings.length ? meetings.map((meeting) => <MeetingSummaryCard key={meeting.slug} meeting={meeting} />) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center">
                <p className="font-black text-slate-950">No meeting rows loaded yet.</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Submit an official agenda, minutes page, video link, or public body roster to start this jurisdiction lane.</p>
                <Link href={`/submit-source?target=${encodeURIComponent(slug)}&type=meeting_source`} className="primary-button mt-4">
                  Submit meeting source
                </Link>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
