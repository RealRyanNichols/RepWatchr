import Link from "next/link";
import CopySnippetButton from "@/components/shared/CopySnippetButton";
import {
  formatMeetingDate,
  getPublicBodyQuestions,
  type LocalMeeting,
  type LocalSourceGap,
  type PublicBody,
} from "@/lib/local-meetings";

type Props = {
  body: PublicBody;
  meetings: LocalMeeting[];
  compact?: boolean;
};

function statusLabel(value: string) {
  return value.replaceAll("_", " ");
}

function sourceAttr(kind: "agenda" | "minutes" | "video", label: string) {
  if (kind === "agenda") return { "data-agenda-source": label };
  if (kind === "minutes") return { "data-minutes-source": label };
  return { "data-video-source": label };
}

function SourceButton({ href, label, kind }: { href?: string; label: string; kind: "agenda" | "minutes" | "video" }) {
  if (!href) {
    return (
      <span className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-400">
        {label} needed
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-blue-800 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
      {...sourceAttr(kind, label)}
    >
      {label}
    </a>
  );
}

function SourceGapCard({ gap }: { gap: LocalSourceGap }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-amber-800">{gap.priority} priority</p>
          <h4 className="mt-1 text-base font-black text-slate-950">{gap.label}</h4>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-800">
          Source gap
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{gap.detail}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={gap.submitUrl} data-meeting-source-gap={gap.type} className="secondary-button bg-white text-center">
          Submit source
        </Link>
        <Link href={gap.packetUrl} className="secondary-button bg-white text-center">
          Build packet
        </Link>
        <Link href={gap.watchUrl} className="secondary-button bg-white text-center">
          Watch
        </Link>
      </div>
    </div>
  );
}

export function MeetingSummaryCard({ meeting }: { meeting: LocalMeeting }) {
  return (
    <Link
      href={`/meetings/${meeting.slug}`}
      className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-xl"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-red-700">{statusLabel(meeting.status)}</p>
          <h3 className="mt-2 text-lg font-black leading-6 text-slate-950 group-hover:text-blue-800">{meeting.title}</h3>
          <p className="mt-2 text-sm font-semibold text-slate-600">{formatMeetingDate(meeting.meetingDate)}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
          {meeting.sourceCount} source{meeting.sourceCount === 1 ? "" : "s"}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <SourceButton href={meeting.agendaUrl} label="Agenda" kind="agenda" />
        <SourceButton href={meeting.minutesUrl} label="Minutes" kind="minutes" />
        <SourceButton href={meeting.videoUrl} label="Video" kind="video" />
      </div>
    </Link>
  );
}

export default function LocalBodyTracker({ body, meetings, compact = false }: Props) {
  const questions = getPublicBodyQuestions(body);
  const recentMeetings = compact ? meetings.slice(0, 3) : meetings.slice(0, 8);

  return (
    <section id="local-meetings" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Local meeting tracker</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">{body.name}</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
            Agendas, minutes, video links, member rosters, vote records, source gaps, and public questions tied to this public body.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-blue-900">
              {statusLabel(body.bodyType)}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-slate-700">
              {body.county ? `${body.county} County` : body.jurisdiction}
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-emerald-800">
              {body.completenessScore}% complete
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Metric label="Members" value={body.members.length} />
            <Metric label="Meetings" value={meetings.length} />
            <Metric label="Sources" value={body.sourceCount} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={body.watchUrl} data-public-body-watch={body.slug} className="primary-button text-center">
              Watch body
            </Link>
            <Link href={`/submit-source?target=${encodeURIComponent(body.slug)}&type=public_body_source`} className="secondary-button text-center">
              Submit source
            </Link>
            <Link href={`/submit-source?target=${encodeURIComponent(body.slug)}&type=correction_request`} className="secondary-button text-center">
              Request correction
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {body.officialUrl ? (
            <a href={body.officialUrl} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-black text-blue-800 transition hover:border-red-300 hover:bg-red-50">
              Official body source
            </a>
          ) : null}
          {body.meetingsUrl ? (
            <a href={body.meetingsUrl} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-black text-blue-800 transition hover:border-red-300 hover:bg-red-50">
              Meeting records source
            </a>
          ) : null}
          {["School Board Monitor", "County Monitor", "Meeting Watch Desk", "Public Records Packet"].map((label) => (
            <Link
              key={label}
              href={`/services?interest=${encodeURIComponent(label)}&target=${encodeURIComponent(body.slug)}`}
              data-school-board-package-interest={label}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-black text-slate-800 transition hover:border-blue-300 hover:bg-blue-50"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Members</p>
          <div className="mt-3 grid gap-2">
            {body.members.slice(0, compact ? 6 : 14).map((member) => (
              <div key={member.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-950">{member.memberName}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                      {[member.roleTitle, member.districtOrPlace, member.term].filter(Boolean).join(" / ") || "Role needs source"}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{statusLabel(member.status)}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {member.profileUrl ? <Link href={member.profileUrl} className="mini-button">Profile</Link> : null}
                  {member.sourceUrl ? <a href={member.sourceUrl} target="_blank" rel="noopener noreferrer" className="mini-button">Source</a> : null}
                  <Link href={`/submit-source?target=${encodeURIComponent(member.id)}&type=correction_request`} className="mini-button">
                    Correction
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Meetings</p>
          <div className="mt-3 grid gap-3">
            {recentMeetings.length ? recentMeetings.map((meeting) => <MeetingSummaryCard key={meeting.slug} meeting={meeting} />) : (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm font-semibold leading-6 text-slate-600">
                No meeting rows are loaded yet. Submit an agenda, approved minutes, video, or public meeting source to start the tracker.
              </p>
            )}
          </div>
          <Link href={`/jurisdictions/${encodeURIComponent(body.slug)}/meetings`} className="mt-4 inline-flex text-sm font-black text-blue-700 hover:text-red-700">
            Open all meetings and gaps &rarr;
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Agenda/minutes source gaps</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {body.sourceGaps.slice(0, compact ? 4 : 8).map((gap) => <SourceGapCard key={gap.id} gap={gap} />)}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Public questions</p>
          <div className="mt-3 grid gap-3">
            {questions.map((question) => (
              <div key={question} className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-sm font-semibold leading-6 text-slate-700">{question}</p>
                <div className="mt-3">
                  <CopySnippetButton
                    text={question}
                    label="Copy question"
                    trackingEventName="public_question_copied"
                    trackingMetadata={{ bodySlug: body.slug }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}
