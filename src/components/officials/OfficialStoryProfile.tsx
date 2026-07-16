import Link from "next/link";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import CommentSection from "@/components/comments/CommentSection";
import OfficialVotingSection from "@/components/voting/OfficialVotingSection";
import ProfileScorecardVote from "@/components/scorecards/ProfileScorecardVote";
import type {
  OfficialVerifiedBriefData,
  VerifiedBriefSource,
  VerifiedBriefStoryCard,
} from "@/data/official-verified-briefs";
import type { PerformanceGradeResult } from "@/lib/performance-grade";
import type { Official, PublicVoteRecord } from "@/types";

type OfficialStoryProfileProps = {
  official: Official;
  brief: OfficialVerifiedBriefData;
  voteRecord?: PublicVoteRecord;
  performanceGrade: PerformanceGradeResult;
  sourceCount: number;
};

const evidenceLabels: Record<VerifiedBriefSource["kind"], string> = {
  official_record: "Official record",
  reported: "Independent reporting",
  external_data: "External data",
  interview_statement: "Official's own statement",
};

export default function OfficialStoryProfile({
  official,
  brief,
  voteRecord,
  performanceGrade,
  sourceCount,
}: OfficialStoryProfileProps) {
  const voteTotal = voteRecord?.summary.totalVotesLoaded ?? 0;
  const recordedPositions = voteRecord
    ? voteRecord.summary.yea + voteRecord.summary.nay + voteRecord.summary.present
    : 0;
  const recordedPositionPercent = voteTotal > 0 ? Math.round((recordedPositions / voteTotal) * 1000) / 10 : null;
  const gradeValue =
    performanceGrade.status === "published" && performanceGrade.score !== null && performanceGrade.letterGrade
      ? `${performanceGrade.score} / ${performanceGrade.letterGrade}`
      : performanceGrade.status === "provisional" && performanceGrade.score !== null
        ? `${performanceGrade.score} / provisional`
        : "NR";
  const gradeStatus =
    performanceGrade.status === "published"
      ? `${performanceGrade.confidenceLabel} confidence`
      : performanceGrade.status === "provisional"
        ? "Letter grade withheld"
        : "Evidence gate not cleared yet";
  const allSources = dedupeSources([
    ...brief.strengths.flatMap((item) => item.sources),
    ...brief.concerns.flatMap((item) => item.sources),
    ...brief.turningPoints.flatMap((item) => item.sources),
    ...brief.facts.map((item) => item.source),
    ...brief.timeline.map((item) => item.source),
    brief.media.source,
  ]);

  return (
    <main>
      <section id="snapshot" className="scroll-mt-24 bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(20rem,0.88fr)] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Start here</p>
              <h2 className="mt-3 max-w-4xl text-4xl font-black leading-[0.98] tracking-[-0.045em] text-slate-950 sm:text-6xl">
                Who is {official.name}—and why is this record debated?
              </h2>
              <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-slate-700">{brief.storyLead}</p>
            </div>
            <aside className="rounded-[2rem] border border-amber-300 bg-amber-300 p-6 shadow-[0_24px_70px_rgba(146,64,14,0.16)] sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-950">The short answer</p>
              <p className="mt-3 text-xl font-black leading-8 text-slate-950">{brief.bottomLine}</p>
            </aside>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StoryStat value={gradeValue} label="Overall grade" detail={gradeStatus} tone="dark" />
            <StoryStat
              value={voteTotal ? voteTotal.toLocaleString() : "Pending"}
              label="Roll calls indexed"
              detail="Official Texas House records"
            />
            <StoryStat
              value={recordedPositionPercent === null ? "Pending" : `${recordedPositionPercent}%`}
              label="Recorded position rate"
              detail="Yea, nay, or present—not an attendance grade"
            />
            <StoryStat
              value={brief.headlineSignal?.value ?? sourceCount.toLocaleString()}
              label={brief.headlineSignal?.label ?? "Public sources"}
              detail={brief.headlineSignal?.detail ?? "Unique source-linked receipts"}
            />
          </div>
        </div>
      </section>

      <section id="identity" className="scroll-mt-24 bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ChapterHeading
            eyebrow="Chapter 1 • Who he is"
            title="Before judging the record, understand the job—and the power attached to it."
            description="These are orientation facts, not praise or criticism."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {brief.facts.map((fact) => (
              <a
                key={fact.id}
                href={fact.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-3xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:border-blue-300 hover:bg-blue-50"
              >
                <p className="text-3xl font-black tracking-[-0.04em] text-slate-950">{fact.metric}</p>
                <h3 className="mt-2 text-base font-black text-slate-950">{fact.label}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{fact.detail}</p>
                <p className="mt-4 text-xs font-black uppercase tracking-wide text-blue-700">
                  {fact.source.publisher} ↗
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="balanced-record" className="scroll-mt-24 bg-slate-50 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ChapterHeading
            eyebrow="Chapter 2 • The balanced read"
            title="What the record supports—and what still deserves scrutiny."
            description="The first sentence is the takeaway. Open a card only when you want the context and receipts."
          />

          <div className="mt-9 grid gap-8 xl:grid-cols-2">
            <StoryColumn
              title="Documented district actions"
              subtitle="Appropriations and enacted measures with identified district or landowner aims."
              items={brief.strengths}
              tone="strength"
            />
            <StoryColumn
              title="What deserves a closer look"
              subtitle="Verified vote changes, overlapping roles, or attributed criticism."
              items={brief.concerns}
              tone="concern"
            />
          </div>
        </div>
      </section>

      <section id="record" className="scroll-mt-24 bg-[#071a39] py-14 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ChapterHeading
            eyebrow="Chapter 3 • The record in motion"
            title="Four documented moments in the current debate."
            description="These dated events cover two policy or political disputes and a later election result; they do not establish motive or causation."
            dark
          />
          <ol className="mt-10 grid gap-4 lg:grid-cols-4">
            {brief.turningPoints.map((moment, index) => (
              <li key={moment.id} className="relative rounded-3xl border border-blue-300/20 bg-blue-950/45 p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-amber-300 text-sm font-black text-slate-950">
                    {index + 1}
                  </span>
                  <span className="text-xs font-black uppercase tracking-wide text-blue-200">{moment.dateLabel}</span>
                </div>
                <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-red-300">{moment.label}</p>
                <h3 className="mt-2 text-xl font-black leading-7">{moment.title}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">{moment.detail}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {moment.sources.map((source) => (
                    <a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-amber-200 hover:border-white/35 hover:text-white"
                    >
                      {source.publisher} ↗
                    </a>
                  ))}
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">Hear him answer directly</p>
              <h3 className="mt-2 text-3xl font-black tracking-tight">{brief.media.title}</h3>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-300">{brief.media.description}</p>
            </div>
            <div className="aspect-video overflow-hidden rounded-3xl border border-white/15 bg-black shadow-2xl">
              <iframe
                src={brief.media.embedUrl}
                title={brief.media.title}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="score" className="scroll-mt-24 bg-[linear-gradient(180deg,#f8fbff,#eef4ff)] py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ChapterHeading
            eyebrow="Chapter 4 • The grade"
            title="The grade is earned from job performance—not ideology or popularity."
            description="RepWatchr will show a number and letter only after the same evidence gates are met for every comparable official."
          />

          <div className="mt-9 grid gap-6 lg:grid-cols-[21rem_minmax(0,1fr)]">
            <aside className="rounded-[2rem] bg-slate-950 p-7 text-white shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">Overall performance grade</p>
              <p className="mt-4 text-7xl font-black tracking-[-0.07em]">{gradeValue}</p>
              <p className="mt-3 text-lg font-black text-amber-200">{gradeStatus}</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">{performanceGrade.reason}</p>
              <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
                <div>
                  <dt className="text-[10px] font-black uppercase tracking-wide text-slate-400">Method</dt>
                  <dd className="mt-1 font-black">v{performanceGrade.methodVersion}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-black uppercase tracking-wide text-slate-400">Grade weight ready</dt>
                  <dd className="mt-1 font-black">{performanceGrade.scoreableWeight}%</dd>
                </div>
              </dl>
              <Link href="/methodology" className="mt-6 inline-flex text-sm font-black text-blue-200 hover:text-white">
                Read the full methodology →
              </Link>
            </aside>

            <div className="space-y-3">
              {performanceGrade.dimensions.map((dimension) => (
                <article key={dimension.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-black text-slate-950">{dimension.label}</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{dimension.note}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-950">{dimension.weight}% weight</p>
                      <p className="text-xs font-bold text-amber-700">
                        {dimension.scoreable ? "Cleared" : `${dimension.coverage}% evidence coverage`}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#2563eb,#7c3aed,#e11d48)]"
                      style={{ width: `${dimension.coverage}%` }}
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm font-bold leading-6 text-blue-950">
            Community sentiment, party loyalty, fundraising totals, follower counts, and whether RepWatchr agrees with a
            vote do not change this performance grade.
          </div>
        </div>
      </section>

      <section id="participate" className="scroll-mt-24 bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ChapterHeading
            eyebrow="Chapter 5 • Community room"
            title="Vote. Ask a question. Add a source. Talk to neighbors."
            description="This is the social layer: verified participant sentiment and public discussion, kept separate from the evidence-based performance grade."
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
            <ProfileScorecardVote
              targetType="official"
              targetId={official.id}
              targetName={official.name}
              targetPath={`/officials/${official.id}`}
              officialState={official.state}
              officialDistrict={official.district}
              officialCounties={official.county}
              compact
            />
            <div className="space-y-5">
              <OfficialVotingSection officialId={official.id} officialCounties={official.county} />
              <aside className="rounded-3xl bg-slate-950 p-6 text-white">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">Join in one step</p>
                <h3 className="mt-2 text-xl font-black">Bring your Facebook or X identity.</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                  Social login creates the account. RepWatchr verifies personhood and district residency separately
                  before a response receives verified in-district weight.
                </p>
                <div className="mt-5">
                  <SocialAuthButtons nextPath={`/officials/${official.id}#participate`} />
                </div>
              </aside>
            </div>
          </div>

          <div className="mt-10">
            <CommentSection officialId={official.id} officialName={official.name} storyMode />
          </div>
        </div>
      </section>

      <section id="sources" className="scroll-mt-24 bg-slate-950 py-14 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ChapterHeading
            eyebrow="Source room"
            title="The story comes first. The receipts are one level deeper."
            description={`${allSources.length} source links support this narrative. Open only the trail you want to inspect.`}
            dark
          />
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm font-semibold leading-6 text-slate-300">
            <p>
              <span className="font-black text-white">Reviewed through {brief.reviewedThrough}.</span>{" "}
              {brief.evidenceNote}
            </p>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {allSources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:-translate-y-0.5 hover:border-blue-300/50 hover:bg-blue-400/10"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-200">
                  {evidenceLabels[source.kind]}
                </p>
                <p className="mt-2 text-sm font-black leading-5 text-white">{source.title}</p>
                <p className="mt-2 text-xs font-semibold text-slate-400">{source.publisher} ↗</p>
              </a>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/submit-source?target=${encodeURIComponent(official.id)}`}
              className="rounded-xl bg-amber-300 px-5 py-3 text-sm font-black text-slate-950 hover:bg-amber-200"
            >
              Submit a source
            </Link>
            <Link
              href="/methodology"
              className="rounded-xl border border-white/20 px-5 py-3 text-sm font-black text-white hover:bg-white/10"
            >
              Inspect scoring rules
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function StoryStat({
  value,
  label,
  detail,
  tone = "light",
}: {
  value: string;
  label: string;
  detail: string;
  tone?: "light" | "dark";
}) {
  return (
    <div className={`rounded-2xl border p-5 ${tone === "dark" ? "border-slate-800 bg-slate-950 text-white" : "border-slate-200 bg-white"}`}>
      <p className="text-3xl font-black tracking-[-0.04em]">{value}</p>
      <p className={`mt-1 text-xs font-black uppercase tracking-wide ${tone === "dark" ? "text-amber-200" : "text-blue-900"}`}>
        {label}
      </p>
      <p className={`mt-2 text-xs font-semibold leading-5 ${tone === "dark" ? "text-slate-400" : "text-slate-500"}`}>
        {detail}
      </p>
    </div>
  );
}

function ChapterHeading({
  eyebrow,
  title,
  description,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  dark?: boolean;
}) {
  return (
    <header>
      <p className={`text-xs font-black uppercase tracking-[0.2em] ${dark ? "text-red-300" : "text-red-700"}`}>{eyebrow}</p>
      <h2 className={`mt-3 max-w-5xl text-3xl font-black leading-[1.02] tracking-[-0.04em] sm:text-5xl ${dark ? "text-white" : "text-slate-950"}`}>
        {title}
      </h2>
      <p className={`mt-4 max-w-3xl text-base font-semibold leading-7 ${dark ? "text-slate-300" : "text-slate-600"}`}>
        {description}
      </p>
    </header>
  );
}

function StoryColumn({
  title,
  subtitle,
  items,
  tone,
}: {
  title: string;
  subtitle: string;
  items: readonly VerifiedBriefStoryCard[];
  tone: "strength" | "concern";
}) {
  const toneClasses =
    tone === "strength"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : "border-amber-200 bg-amber-50 text-amber-950";

  return (
    <div>
      <div className={`rounded-3xl border p-6 ${toneClasses}`}>
        <p className="text-xs font-black uppercase tracking-[0.18em]">{tone === "strength" ? "Documented strengths" : "Documented concerns"}</p>
        <h3 className="mt-2 text-3xl font-black tracking-[-0.035em]">{title}</h3>
        <p className="mt-2 text-sm font-semibold leading-6 opacity-80">{subtitle}</p>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <details key={item.id} className="group rounded-2xl border border-slate-200 bg-white p-5 open:shadow-lg">
            <summary className="cursor-pointer list-none">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-lg font-black leading-6 text-slate-950">{item.title}</h4>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{item.summary}</p>
                </div>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-lg font-black text-slate-700 group-open:rotate-45">
                  +
                </span>
              </div>
            </summary>
            <div className="mt-4 border-t border-slate-200 pt-4">
              <p className="text-sm font-semibold leading-6 text-slate-700">{item.detail}</p>
              {item.response ? (
                <p className="mt-3 rounded-xl bg-blue-50 p-3 text-xs font-bold leading-5 text-blue-950">
                  <span className="font-black uppercase tracking-wide">Response/context: </span>
                  {item.response}
                </p>
              ) : null}
              {item.caution ? (
                <p className="mt-3 rounded-xl bg-slate-100 p-3 text-xs font-bold leading-5 text-slate-700">
                  <span className="font-black uppercase tracking-wide">Do not overstate: </span>
                  {item.caution}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {item.sources.map((source) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-blue-800 hover:border-blue-300 hover:bg-blue-50"
                  >
                    {evidenceLabels[source.kind]} • {source.publisher} ↗
                  </a>
                ))}
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function dedupeSources(sources: readonly VerifiedBriefSource[]) {
  const seen = new Set<string>();
  return sources.filter((source) => {
    if (seen.has(source.url)) return false;
    seen.add(source.url);
    return true;
  });
}
