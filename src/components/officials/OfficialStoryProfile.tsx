import Link from "next/link";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import CommentSection from "@/components/comments/CommentSection";
import ProfileScorecardVote from "@/components/scorecards/ProfileScorecardVote";
import OfficialVotingSection from "@/components/voting/OfficialVotingSection";
import type {
  OfficialVerifiedBriefData,
  VerifiedBriefSource,
  VerifiedBriefStoryCard,
} from "@/data/official-verified-briefs";
import type { PerformanceGradeResult } from "@/lib/performance-grade";
import type { Official, PublicVoteRecord } from "@/types";
import styles from "./OfficialStoryProfile.module.css";

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
  interview_statement: "Official statement",
};

export default function OfficialStoryProfile({
  official,
  brief,
  voteRecord,
  performanceGrade,
  sourceCount,
}: OfficialStoryProfileProps) {
  const gradeValue =
    performanceGrade.status === "published" && performanceGrade.score !== null && performanceGrade.letterGrade
      ? `${performanceGrade.score} · ${performanceGrade.letterGrade}`
      : performanceGrade.status === "provisional" && performanceGrade.score !== null
        ? `${performanceGrade.score} provisional`
        : "Not rated";
  const gradeStatus =
    performanceGrade.status === "published"
      ? `${performanceGrade.confidenceLabel} confidence`
      : performanceGrade.status === "provisional"
        ? "Letter grade withheld"
        : "The evidence gate has not cleared";
  const allSources = dedupeSources([
    ...brief.strengths.flatMap((item) => item.sources),
    ...brief.concerns.flatMap((item) => item.sources),
    ...brief.turningPoints.flatMap((item) => item.sources),
    ...brief.facts.map((item) => item.source),
    ...brief.timeline.map((item) => item.source),
    brief.media.source,
  ]);

  return (
    <main className={styles.story}>
      <section id="snapshot" className="scroll-mt-24 bg-[#f4f1e8] py-16 sm:py-24 lg:scroll-mt-52">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(24rem,1.15fr)] lg:items-start">
            <header>
              <p className="flex items-center gap-3 text-sm font-semibold text-[#a23a2b]">
                <span className="h-1 w-10 bg-[#a23a2b]" aria-hidden="true" />
                Start here
              </p>
              <h2 className={`${styles.display} mt-6 max-w-3xl text-4xl font-bold leading-[1.03] text-[#111b24] sm:text-6xl`}>
                Who is {official.name}—and why is this record debated?
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4f5659]">{brief.storyLead}</p>
            </header>

            <blockquote className="border-l-4 border-[#a23a2b] bg-[#f3e5dc] px-7 py-8 sm:px-10 sm:py-10">
              <p className="text-sm font-semibold text-[#a23a2b]">The short answer</p>
              <p className={`${styles.display} mt-4 text-2xl font-normal leading-9 text-[#111b24] sm:text-3xl sm:leading-10`}>
                {brief.bottomLine}
              </p>
            </blockquote>
          </div>
          <p className="mt-12 border-t border-[#cbc4b5] pt-4 text-sm leading-6 text-[#62676a]">
            This is the guided evidence layer. The dashboard above carries the grade state, activity totals, public links,
            and participation actions. {voteRecord
              ? `${voteRecord.summary.totalVotesLoaded.toLocaleString()} official roll calls are currently indexed.`
              : "The roll-call ledger is still awaiting a source-backed load."}
          </p>
        </div>
      </section>

      <section id="identity" className="scroll-mt-24 bg-[#fbfaf6] py-16 sm:py-24 lg:scroll-mt-52">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ChapterHeading
            number="01"
            eyebrow="The office"
            title="Understand the job before judging the record."
            description="These are orientation facts, not praise or criticism. Each line opens the source behind it."
          />

          <dl className="mt-12 grid border-b border-[#cbc4b5] md:grid-cols-2 md:gap-x-12">
            {brief.facts.map((fact) => (
              <div key={fact.id} className="border-t border-[#cbc4b5] py-7">
                <dt className={`${styles.display} text-3xl font-bold text-[#111b24]`}>{fact.metric}</dt>
                <dd className="mt-2 text-base font-semibold text-[#111b24]">{fact.label}</dd>
                <dd className="mt-2 max-w-xl text-sm leading-6 text-[#5d6264]">{fact.detail}</dd>
                <dd className="mt-4">
                  <a
                    href={fact.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-[#163b5c] underline decoration-[#a9b6bf] underline-offset-4 hover:decoration-[#163b5c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a23a2b]"
                  >
                    {fact.source.publisher} ↗
                  </a>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="balanced-record" className="scroll-mt-24 bg-white py-16 sm:py-24 lg:scroll-mt-52">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ChapterHeading
            number="02"
            eyebrow="The documented record"
            title="Start with what he delivered. Then examine where the record gets complicated."
            description="The same evidence rules apply to favorable and critical material. Expand a row only when you want the detail, response, limits, and receipts."
          />

          <div className="mt-14 space-y-20">
            <RecordLedgerSection
              title="What he delivered"
              subtitle="Appropriations and enacted measures with identified district or landowner aims."
              items={brief.strengths}
              tone="strength"
            />
            <RecordLedgerSection
              title="Where the record gets complicated"
              subtitle="Verified changes, overlapping roles, and named criticism—without treating inference as fact."
              items={brief.concerns}
              tone="concern"
            />
          </div>
        </div>
      </section>

      <section id="record" className="scroll-mt-24 bg-[#111b24] py-16 text-white sm:py-24 lg:scroll-mt-52">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ChapterHeading
            number="03"
            eyebrow="The record in motion"
            title="Four moments that shaped the current debate."
            description="The sequence documents a change over time. It does not claim to prove motive or causation."
            dark
          />

          <ol className="relative mt-14 border-l border-[#5c6c76]">
            {brief.turningPoints.map((moment, index) => (
              <li key={moment.id} className="relative grid gap-4 border-b border-white/15 py-9 pl-8 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-10 sm:pl-12">
                <span className="absolute -left-[5px] top-12 h-[9px] w-[9px] bg-[#b58b32]" aria-hidden="true" />
                <div>
                  <p className={`${styles.display} text-3xl font-bold text-[#d7b85f]`}>{moment.dateLabel}</p>
                  <p className="mt-2 text-sm text-slate-400">Moment {index + 1}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#e0a49a]">{moment.label}</p>
                  <h3 className={`${styles.display} mt-2 text-2xl font-bold leading-8 sm:text-3xl`}>{moment.title}</h3>
                  <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">{moment.detail}</p>
                  <EvidenceLinks sources={moment.sources} dark />
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-16 grid gap-8 border-t border-white/20 pt-12 lg:grid-cols-[minmax(0,0.75fr)_minmax(24rem,1.25fr)] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-[#e0a49a]">In his own words</p>
              <h3 className={`${styles.display} mt-3 text-3xl font-bold sm:text-4xl`}>{brief.media.title}</h3>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">{brief.media.description}</p>
            </div>
            <div className="aspect-video overflow-hidden rounded-sm border border-white/20 bg-black">
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

      <section id="score" className="scroll-mt-24 bg-[#f4f1e8] py-16 sm:py-24 lg:scroll-mt-52">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ChapterHeading
            number="04"
            eyebrow="The performance grade"
            title="The instrument must be honest enough to say “not rated.”"
            description="A number and letter appear only after comparable officials clear the same evidence, confidence, coverage, and ethics gates."
          />

          <div className="mt-14 grid gap-12 lg:grid-cols-[20rem_minmax(0,1fr)]">
            <aside className="border-y-4 border-[#a23a2b] py-8">
              <p className="text-sm font-semibold text-[#a23a2b]">Overall performance</p>
              <p className={`${styles.display} mt-4 text-6xl font-bold leading-none text-[#111b24]`}>{gradeValue}</p>
              <p className="mt-4 text-base font-semibold text-[#163b5c]">{gradeStatus}</p>
              <p className="mt-4 text-sm leading-6 text-[#555d60]">{performanceGrade.reason}</p>
              <dl className="mt-7 grid grid-cols-2 gap-6 border-t border-[#cbc4b5] pt-5 text-sm">
                <div>
                  <dt className="text-[#62676a]">Method</dt>
                  <dd className="mt-1 font-bold text-[#111b24]">v{performanceGrade.methodVersion}</dd>
                </div>
                <div>
                  <dt className="text-[#62676a]">Weight ready</dt>
                  <dd className="mt-1 font-bold text-[#111b24]">{performanceGrade.scoreableWeight}%</dd>
                </div>
              </dl>
              <Link
                href="/methodology"
                className="mt-7 inline-flex text-sm font-semibold text-[#163b5c] underline decoration-[#a9b6bf] underline-offset-4 hover:decoration-[#163b5c]"
              >
                Read the method →
              </Link>
            </aside>

            <div className="border-b border-[#cbc4b5]">
              {performanceGrade.dimensions.map((dimension) => (
                <div key={dimension.id} className="grid gap-4 border-t border-[#cbc4b5] py-6 sm:grid-cols-[minmax(0,1fr)_11rem] sm:items-center sm:gap-8">
                  <div>
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h3 className={`${styles.display} text-xl font-bold text-[#111b24]`}>{dimension.label}</h3>
                      <p className="text-sm font-semibold text-[#163b5c]">{dimension.weight}% of grade</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#5d6264]">{dimension.note}</p>
                  </div>
                  <div>
                    <div className="h-2 bg-[#ddd7ca]" aria-hidden="true">
                      <div className="h-full bg-[#163b5c]" style={{ width: `${dimension.coverage}%` }} />
                    </div>
                    <p className="mt-2 text-right text-sm font-semibold text-[#111b24]">
                      {dimension.scoreable ? "Evidence cleared" : `${dimension.coverage}% coverage`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-10 border-t border-[#cbc4b5] pt-5 text-sm font-semibold leading-6 text-[#163b5c]">
            Community sentiment, party loyalty, fundraising totals, follower counts, and RepWatchr’s agreement with a
            vote do not change this performance grade.
          </p>
        </div>
      </section>

      <section id="participate" className="scroll-mt-24 bg-white py-16 sm:py-24 lg:scroll-mt-52">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ChapterHeading
            number="05"
            eyebrow="Community"
            title="Vote, question the record, add a source, and talk to neighbors."
            description="Public sentiment and discussion remain separate from the evidence-based performance grade."
          />

          <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
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
            <div className="space-y-8">
              <OfficialVotingSection officialId={official.id} officialCounties={official.county} />
              <aside className="border-y border-[#cbc4b5] py-7">
                <p className="text-sm font-semibold text-[#a23a2b]">Join the discussion</p>
                <h3 className={`${styles.display} mt-2 text-2xl font-bold text-[#111b24]`}>Use Facebook or X to start.</h3>
                <p className="mt-3 text-sm leading-6 text-[#5d6264]">
                  Social login creates the account. Human and district-residency checks are separate before a response
                  receives verified in-district weight.
                </p>
                <div className="mt-5">
                  <SocialAuthButtons nextPath={`/officials/${official.id}#participate`} />
                </div>
              </aside>
            </div>
          </div>

          <div className="mt-12 border-t border-[#cbc4b5] pt-10">
            <CommentSection officialId={official.id} officialName={official.name} storyMode />
          </div>
        </div>
      </section>

      <section id="sources" className="scroll-mt-24 bg-[#111b24] py-16 text-white sm:py-24 lg:scroll-mt-52">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ChapterHeading
            number="06"
            eyebrow="Source room"
            title="The story is readable. The receipts remain inspectable."
            description={`${allSources.length} source links support this profile. Open the part of the trail you want to check.`}
            dark
          />

          <p className="mt-10 border-y border-white/20 py-5 text-sm leading-6 text-slate-300">
            <span className="font-semibold text-white">Reviewed through {brief.reviewedThrough}.</span> {brief.evidenceNote}
          </p>

          <ol className="mt-8 border-b border-white/20">
            {allSources.map((source, index) => (
              <li key={source.url} className="grid gap-3 border-t border-white/20 py-5 sm:grid-cols-[3rem_11rem_minmax(0,1fr)_10rem] sm:items-baseline sm:gap-5">
                <span className={`${styles.display} text-xl font-bold text-[#d7b85f]`}>{String(index + 1).padStart(2, "0")}</span>
                <span className="text-sm text-slate-400">{evidenceLabels[source.kind]}</span>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold leading-6 text-white underline decoration-white/25 underline-offset-4 hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7b85f]"
                >
                  {source.title} ↗
                </a>
                <span className="text-sm text-slate-400 sm:text-right">{source.publisher}</span>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-4">
            <Link
              href={`/submit-source?target=${encodeURIComponent(official.id)}`}
              className="border-b-2 border-[#d7b85f] pb-1 text-sm font-semibold text-[#f2dc99] hover:text-white"
            >
              Submit a source
            </Link>
            <Link
              href="/methodology"
              className="border-b-2 border-white/30 pb-1 text-sm font-semibold text-white hover:border-white"
            >
              Inspect scoring rules
            </Link>
          </div>
          <p className="mt-10 text-xs leading-5 text-slate-500">{sourceCount.toLocaleString()} unique public receipts are currently associated with this official’s complete dashboard record.</p>
        </div>
      </section>
    </main>
  );
}

function ChapterHeading({
  number,
  eyebrow,
  title,
  description,
  dark = false,
}: {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  dark?: boolean;
}) {
  return (
    <header className="grid gap-5 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-10">
      <p className={`${styles.display} text-7xl font-bold leading-none ${dark ? "text-[#d7b85f]" : "text-[#a23a2b]"}`} aria-hidden="true">
        {number}
      </p>
      <div>
        <p className={`text-sm font-semibold ${dark ? "text-[#e0a49a]" : "text-[#a23a2b]"}`}>{eyebrow}</p>
        <h2 className={`${styles.display} mt-3 max-w-5xl text-4xl font-bold leading-[1.04] sm:text-5xl ${dark ? "text-white" : "text-[#111b24]"}`}>
          {title}
        </h2>
        <p className={`mt-4 max-w-3xl text-base leading-7 ${dark ? "text-slate-300" : "text-[#5d6264]"}`}>{description}</p>
      </div>
    </header>
  );
}

function RecordLedgerSection({
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
  const accent = tone === "strength" ? "text-[#163b5c]" : "text-[#a23a2b]";

  return (
    <section>
      <div className="grid gap-3 border-b-2 border-[#111b24] pb-5 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)] md:items-end md:gap-10">
        <h3 className={`${styles.display} text-3xl font-bold sm:text-4xl ${accent}`}>{title}</h3>
        <p className="text-sm leading-6 text-[#5d6264] md:text-right">{subtitle}</p>
      </div>
      <ol>
        {items.map((item, index) => (
          <li key={item.id} className="border-b border-[#cbc4b5]">
            <details className="group py-7">
              <summary className="cursor-pointer list-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a23a2b]">
                <span className="grid gap-4 sm:grid-cols-[3rem_minmax(0,1fr)_2rem] sm:items-start sm:gap-6">
                  <span className={`${styles.display} text-xl font-bold text-[#8c8a82]`}>{String(index + 1).padStart(2, "0")}</span>
                  <span>
                    <span className={`${styles.display} block text-2xl font-bold leading-8 text-[#111b24]`}>{item.title}</span>
                    <span className="mt-2 block max-w-4xl text-base leading-7 text-[#5d6264]">{item.summary}</span>
                  </span>
                  <span className="text-2xl font-light text-[#a23a2b] transition-transform group-open:rotate-45 motion-reduce:transform-none motion-reduce:transition-none" aria-hidden="true">+</span>
                </span>
              </summary>
              <div className="ml-0 mt-6 grid gap-7 border-l-2 border-[#cbc4b5] pl-5 sm:ml-[4.5rem] sm:pl-7 lg:grid-cols-[minmax(0,1fr)_19rem]">
                <div>
                  <p className="text-sm leading-7 text-[#343b3e]">{item.detail}</p>
                  {item.response ? (
                    <p className="mt-5 border-l-4 border-[#163b5c] pl-4 text-sm leading-6 text-[#40484b]">
                      <span className="font-semibold text-[#163b5c]">Response or context: </span>
                      {item.response}
                    </p>
                  ) : null}
                  {item.caution ? (
                    <p className="mt-5 border-l-4 border-[#a23a2b] pl-4 text-sm leading-6 text-[#40484b]">
                      <span className="font-semibold text-[#a23a2b]">What the evidence does not prove: </span>
                      {item.caution}
                    </p>
                  ) : null}
                </div>
                <EvidenceLinks sources={item.sources} />
              </div>
            </details>
          </li>
        ))}
      </ol>
    </section>
  );
}

function EvidenceLinks({ sources, dark = false }: { sources: readonly VerifiedBriefSource[]; dark?: boolean }) {
  return (
    <ol className={`mt-5 space-y-2 text-sm ${dark ? "sm:col-start-2" : "lg:mt-0"}`} aria-label="Evidence sources">
      {sources.map((source, index) => (
        <li key={source.url}>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 ${
              dark
                ? "text-[#f2dc99] decoration-white/25 hover:decoration-white focus-visible:outline-[#d7b85f]"
                : "text-[#163b5c] decoration-[#a9b6bf] hover:decoration-[#163b5c] focus-visible:outline-[#a23a2b]"
            }`}
          >
            {index + 1}. {source.publisher} · {evidenceLabels[source.kind]} ↗
          </a>
        </li>
      ))}
    </ol>
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
