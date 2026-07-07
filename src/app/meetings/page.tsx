import type { Metadata } from "next";
import Link from "next/link";
import MeetingsAnalytics from "@/components/meetings/MeetingsAnalytics";
import { MeetingSummaryCard } from "@/components/meetings/LocalBodyTracker";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";
import { getLocalMeetings, getPublicBodies } from "@/lib/local-meetings";
import { breadcrumbJsonLd, datasetJsonLd, jsonLd } from "@/lib/structured-data";

export const metadata: Metadata = buildRepWatchrMetadata({
  title: "Local Meeting Tracker | RepWatchr",
  description: "Track school board, city council, county, board, and commission meeting sources, agendas, minutes, videos, votes, and source gaps.",
  path: "/meetings",
  imagePath: buildOgImageUrl("school-board", { type: "meetings" }),
  imageAlt: "RepWatchr local meeting tracker preview",
});

export default function MeetingsPage() {
  const meetings = getLocalMeetings();
  const bodies = getPublicBodies();
  const recentMeetings = meetings.slice(0, 60);
  const bodyCount = bodies.length;
  const sourceCount = meetings.reduce((sum, meeting) => sum + meeting.sourceCount, 0);
  const sourceGapCount = meetings.reduce((sum, meeting) => sum + meeting.sourceGaps.length, 0);
  const breadcrumbStructuredData = breadcrumbJsonLd([
    { name: "RepWatchr", path: "/" },
    { name: "Meetings", path: "/meetings" },
  ]);
  const datasetStructuredData = datasetJsonLd({
    name: "RepWatchr local meeting source tracker",
    path: "/meetings",
    description: "Public body meeting source tracker for agendas, minutes, videos, vote records, and source gaps.",
    keywords: ["school boards", "public meetings", "agendas", "minutes", "RepWatchr"],
  });

  return (
    <main className="rw-page-shell">
      <MeetingsAnalytics pageType="public_body" entitySlug="meetings" entityName="Local Meeting Tracker" sourceCount={sourceCount} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbStructuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(datasetStructuredData) }} />

      <section className="border-b border-slate-200 bg-[linear-gradient(135deg,#071225_0%,#102b57_52%,#f8fafc_52%,#ffffff_100%)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8">
          <div className="text-white">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Local meeting tracker</p>
            <h1 className="mt-3 text-4xl font-black leading-tight sm:text-6xl">Agendas. Minutes. Videos. Votes.</h1>
            <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-200">
              RepWatchr tracks public bodies through official meeting sources first. Missing agendas, minutes, vote records, videos, and member sources become source gaps people can help fill.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/submit-source?target=local-meetings&type=meeting_source" className="primary-button bg-white text-slate-950 hover:bg-blue-50">
                Submit meeting source
              </Link>
              <Link href="/free-packet?target=meeting" className="secondary-button border-white/30 bg-white/10 text-white hover:bg-white/20">
                Build source packet
              </Link>
            </div>
          </div>
          <div className="grid gap-3 rounded-3xl border border-white/30 bg-white/90 p-5 shadow-2xl">
            <Metric label="Public bodies" value={bodyCount} />
            <Metric label="Meeting rows" value={meetings.length} />
            <Metric label="Source links" value={sourceCount} />
            <Metric label="Open source gaps" value={sourceGapCount} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Public bodies</p>
          <div className="mt-4 grid gap-2">
            {bodies.slice(0, 24).map((body) => (
              <Link key={body.slug} href={`/jurisdictions/${body.slug}/meetings`} className="rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-blue-300 hover:bg-blue-50">
                <p className="font-black text-slate-950">{body.name}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                  {body.county ? `${body.county} County` : body.jurisdiction} / {body.sourceGaps.length} gaps
                </p>
              </Link>
            ))}
          </div>
        </aside>

        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Recent meeting records</p>
              <h2 className="text-3xl font-black text-slate-950">Open the meeting file</h2>
            </div>
            <Link href="/school-boards" className="secondary-button">School boards</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {recentMeetings.map((meeting) => <MeetingSummaryCard key={meeting.slug} meeting={meeting} />)}
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}
