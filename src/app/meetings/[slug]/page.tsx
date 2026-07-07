import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MeetingsAnalytics from "@/components/meetings/MeetingsAnalytics";
import CopySnippetButton from "@/components/shared/CopySnippetButton";
import {
  formatMeetingDate,
  getLocalMeetings,
  getMeetingBySlug,
  getPublicBodyBySlug,
  getPublicBodyQuestions,
} from "@/lib/local-meetings";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";
import { breadcrumbJsonLd, datasetJsonLd, jsonLd } from "@/lib/structured-data";

export function generateStaticParams() {
  return getLocalMeetings().map((meeting) => ({ slug: meeting.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const meeting = getMeetingBySlug(slug);
  if (!meeting) return { title: "Meeting Not Found | RepWatchr" };
  return buildRepWatchrMetadata({
    title: `${meeting.title} | RepWatchr`,
    description: `${meeting.publicBodyName} meeting source file: agendas, minutes, videos, items, votes, and source gaps.`,
    path: `/meetings/${meeting.slug}`,
    imagePath: buildOgImageUrl("school-board", { type: "meeting", meeting: meeting.slug }),
    imageAlt: `${meeting.title} RepWatchr meeting tracker preview`,
  });
}

export default async function MeetingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meeting = getMeetingBySlug(slug);
  if (!meeting) notFound();
  const body = getPublicBodyBySlug(meeting.publicBodySlug);
  const questions = getPublicBodyQuestions(meeting);
  const breadcrumbStructuredData = breadcrumbJsonLd([
    { name: "RepWatchr", path: "/" },
    { name: "Meetings", path: "/meetings" },
    { name: meeting.title, path: `/meetings/${meeting.slug}` },
  ]);
  const datasetStructuredData = datasetJsonLd({
    name: `${meeting.title} meeting source file`,
    path: `/meetings/${meeting.slug}`,
    description: `${meeting.publicBodyName} meeting sources, agenda/minutes/video status, public questions, and source gaps.`,
    keywords: ["public meeting", meeting.publicBodyName, "agenda", "minutes", "RepWatchr"],
  });

  return (
    <main className="rw-page-shell">
      <MeetingsAnalytics pageType="meeting" entitySlug={meeting.slug} entityName={meeting.title} sourceCount={meeting.sourceCount} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbStructuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(datasetStructuredData) }} />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <Link href="/meetings" className="text-sm font-black text-blue-700 hover:text-red-700">&larr; Meetings</Link>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_0.75fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">{meeting.status.replaceAll("_", " ")}</p>
              <h1 className="mt-2 text-4xl font-black leading-tight text-slate-950 sm:text-5xl">{meeting.title}</h1>
              <p className="mt-3 text-base font-semibold leading-7 text-slate-700">
                {meeting.publicBodyName} / {formatMeetingDate(meeting.meetingDate)}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {body ? <Link href={body.profileUrl} className="primary-button">Open public body</Link> : null}
                <Link href={`/submit-source?target=${encodeURIComponent(meeting.slug)}&type=meeting_source`} className="secondary-button">Submit missing source</Link>
                {body ? <Link href={body.watchUrl} data-public-body-watch={body.slug} className="secondary-button">Watch body</Link> : null}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Source trail</p>
              <div className="mt-3 grid gap-2">
                <SourceLink href={meeting.agendaUrl} label="Agenda" attr="data-agenda-source" />
                <SourceLink href={meeting.minutesUrl} label="Minutes" attr="data-minutes-source" />
                <SourceLink href={meeting.videoUrl} label="Video" attr="data-video-source" />
                <SourceLink href={meeting.transcriptUrl} label="Transcript" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Items and votes</p>
          <div className="mt-4 grid gap-3">
            {meeting.items.length ? meeting.items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-black text-slate-950">{item.itemNumber ? `${item.itemNumber}. ` : ""}{item.title}</p>
                {item.description ? <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{item.description}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-600">{item.status.replaceAll("_", " ")}</span>
                  {item.voteResult ? <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-800">{item.voteResult}</span> : null}
                  {item.sourceUrl ? <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="mini-button">Item source</a> : null}
                </div>
                {item.votes.length ? (
                  <div className="mt-3 grid gap-2">
                    {item.votes.map((vote) => (
                      <p key={vote.id} className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                        {vote.voterName ?? "Voter"}: {vote.votePosition ?? "position needs source"} ({vote.confidence.replaceAll("_", " ")})
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            )) : (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600">
                Item-level agenda and vote records have not been loaded yet.
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Source gaps</p>
            <div className="mt-3 grid gap-3">
              {meeting.sourceGaps.map((gap) => (
                <Link key={gap.id} href={gap.submitUrl} data-meeting-source-gap={gap.type} className="rounded-xl border border-amber-200 bg-white p-3 transition hover:border-blue-300 hover:bg-blue-50">
                  <p className="font-black text-slate-950">{gap.label}</p>
                  <p className="mt-1 text-sm font-semibold leading-5 text-slate-600">{gap.detail}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Public questions</p>
            <div className="mt-3 grid gap-3">
              {questions.map((question) => (
                <div key={question} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold leading-6 text-slate-700">{question}</p>
                  <div className="mt-3">
                    <CopySnippetButton text={question} label="Copy question" trackingEventName="public_question_copied" trackingMetadata={{ meetingSlug: meeting.slug }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function SourceLink({ href, label, attr }: { href?: string; label: string; attr?: string }) {
  if (!href) {
    return <span className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-400">{label} needed</span>;
  }
  const props = attr ? { [attr]: label } : {};
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-black text-blue-800 hover:border-red-300 hover:bg-red-50" {...props}>
      {label}
    </a>
  );
}
