import Link from "next/link";
import OfficialPhotoImage, { FEATURED_OFFICIAL_PHOTO_QUALITY } from "@/components/shared/OfficialPhotoImage";
import PartyBadge from "@/components/officials/PartyBadge";
import ProfileActionDock from "@/components/officials/ProfileActionDock";
import { formatLevelName } from "@/lib/formatting";
import type { FundingSummary, Official, PublicVoteRecord } from "@/types";
import styles from "./OfficialProfileExperience.module.css";

type OfficialProfileHeroProps = {
  official: Official;
  sourceCount: number;
  buildoutPercent: number;
  buildoutComplete: boolean;
  voteRecord?: PublicVoteRecord;
  funding?: FundingSummary;
};

type ProfileSnapshotProps = OfficialProfileHeroProps & {
  missingItems: string[];
};

export function OfficialProfileHero({
  official,
  sourceCount,
  buildoutPercent,
  buildoutComplete,
  voteRecord,
  funding,
}: OfficialProfileHeroProps) {
  const latestVote = voteRecord?.votes[0];
  const contactHref = official.contactInfo.email
    ? official.contactInfo.email.startsWith("http")
      ? official.contactInfo.email
      : `mailto:${official.contactInfo.email}`
    : official.contactInfo.website;
  const watchHref = `/dashboard?watch=${encodeURIComponent(`/officials/${official.id}`)}&target=${encodeURIComponent(official.name)}`;

  return (
    <section className={styles.hero}>
      <div className={styles.grid} />
      <div className={`${styles.aurora} ${styles.auroraBlue}`} />
      <div className={`${styles.aurora} ${styles.auroraRed}`} />

      <div className="mx-auto max-w-7xl px-4 pb-8 pt-5 sm:px-6 sm:pb-10 lg:px-8 lg:pb-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Link href="/officials" className="transition hover:text-white">
              Officials
            </Link>
            <span aria-hidden="true" className="text-slate-600">
              /
            </span>
            <span className="text-white">{official.name}</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">
            <span className={styles.sourcePulse} aria-hidden="true" />
            Source-linked public record
          </div>
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(24rem,0.72fr)] lg:gap-12">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-200 backdrop-blur">
                2026 civic record
              </span>
              <PartyBadge party={official.party} />
              {official.district ? (
                <span className="rounded-full border border-blue-300/25 bg-blue-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-blue-100">
                  {official.district}
                </span>
              ) : null}
            </div>

            <h1 className="mt-5 max-w-4xl text-[clamp(3.35rem,9vw,7.5rem)] font-black leading-[0.82] tracking-[-0.065em] text-white">
              {official.name}
            </h1>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-base font-bold text-slate-200 sm:text-lg">
              <span>{official.position}</span>
              <span className="h-1 w-1 rounded-full bg-amber-300" aria-hidden="true" />
              <span>{official.jurisdiction}</span>
            </div>
            <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-slate-300 sm:text-lg sm:leading-8">
              A visual, source-linked view of the office, roll calls, money trail, and public record. Missing evidence
              stays labeled as missing—not turned into a conclusion.
            </p>

            <div className="mt-7">
              <ProfileActionDock
                officialName={official.name}
                path={`/officials/${official.id}`}
                watchHref={watchHref}
                contactHref={contactHref}
              />
            </div>

            <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/12 bg-white/10 sm:grid-cols-4">
              <HeroMetric
                label="Votes indexed"
                value={voteRecord ? compactNumber(voteRecord.summary.totalVotesLoaded) : "Pending"}
                detail={voteRecord ? `Through ${formatShortDate(voteRecord.lastUpdated)}` : "Source path only"}
              />
              <HeroMetric
                label="Public receipts"
                value={sourceCount.toLocaleString()}
                detail="Unique linked sources"
              />
              <HeroMetric
                label="Profile depth"
                value={`${buildoutPercent}%`}
                detail={buildoutComplete ? "Core record loaded" : "Buildout continues"}
              />
              <HeroMetric
                label="Money record"
                value={funding ? funding.cycle : "Review"}
                detail={funding ? "Finance cycle loaded" : "Source review pending"}
              />
            </dl>
          </div>

          <figure className={styles.portraitStage}>
            <div className={styles.orbit} />
            <div className={styles.orbitInner} />
            <div className={styles.portraitFrame}>
              <OfficialPhotoImage
                official={official}
                sizes="(min-width: 1024px) 520px, (min-width: 640px) 62vw, 88vw"
                quality={FEATURED_OFFICIAL_PHOTO_QUALITY}
                preload
                className={styles.portraitImage}
                fallbackClassName="grid h-full w-full place-items-center text-7xl font-black text-white/55"
              />
              <div className="absolute bottom-5 left-5 z-[3] max-w-[58%]">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">Serving since</p>
                <p className="mt-1 text-2xl font-black text-white">{formatYear(official.termStart)}</p>
              </div>
            </div>
            <div className={`${styles.glassCard} ${styles.portraitCard} rounded-2xl p-4`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-200">
                  {latestVote ? "Latest indexed roll call" : "Profile status"}
                </p>
                <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black uppercase text-white">
                  {latestVote?.voteCast ?? `${buildoutPercent}% loaded`}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm font-black leading-5 text-white">
                {latestVote?.title || latestVote?.question || "Public record buildout is in progress."}
              </p>
              <p className="mt-2 text-xs font-semibold text-slate-300">
                {latestVote
                  ? `${formatShortDate(latestVote.date)} • House roll ${latestVote.rollCall}`
                  : "Only source-backed items are published."}
              </p>
            </div>
            {official.featuredPhotoCredit || official.photoCredit ? (
              <figcaption className="absolute bottom-1 left-3 z-[5] max-w-[45%] text-[9px] font-semibold leading-4 text-white/55">
                {official.featuredPhotoCredit ?? official.photoCredit}
              </figcaption>
            ) : null}
          </figure>
        </div>
      </div>
    </section>
  );
}

export function ProfileSnapshot({
  official,
  sourceCount,
  buildoutPercent,
  buildoutComplete,
  voteRecord,
  funding,
  missingItems,
}: ProfileSnapshotProps) {
  const voteTotal = voteRecord?.summary.totalVotesLoaded ?? 0;
  const voteSegments = voteRecord
    ? [
        { label: "Yea", value: voteRecord.summary.yea, color: "#2563eb" },
        { label: "Nay", value: voteRecord.summary.nay, color: "#e11d48" },
        { label: "Present", value: voteRecord.summary.present, color: "#f59e0b" },
        { label: "Not voting", value: voteRecord.summary.notVoting + voteRecord.summary.other, color: "#94a3b8" },
      ]
    : [];
  const donutBackground = voteSegments.length
    ? buildConicGradient(voteSegments, voteTotal)
    : "conic-gradient(#e2e8f0 0 100%)";

  return (
    <section id="snapshot" className="scroll-mt-24 py-10 sm:py-14">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">The 60-second brief</p>
          <h2 className="mt-2 max-w-3xl text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">
            The record at a glance—before the spin.
          </h2>
        </div>
        <Link
          href="#sources"
          className="w-fit rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-800"
        >
          Inspect every source ↓
        </Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(26rem,0.95fr)]">
        <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.09)]">
          <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_16rem]">
            <div className="p-6 sm:p-8">
              <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-800">
                Office snapshot
              </span>
              <p className="mt-5 text-xl font-black leading-8 text-slate-950 sm:text-2xl sm:leading-9">
                {official.name} serves as {official.position}
                {official.district ? ` for ${official.district}` : ""}.
              </p>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                RepWatchr currently connects this profile to {voteTotal.toLocaleString()} indexed roll-call result
                {voteTotal === 1 ? "" : "s"} and {sourceCount.toLocaleString()} unique public receipt
                {sourceCount === 1 ? "" : "s"}. Those counts describe what is loaded, not an approval rating.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <BriefFact label="Office" value={formatLevelName(official.level)} detail={official.jurisdiction} />
                <BriefFact label="Term began" value={formatFullDate(official.termStart)} detail={official.termEnd} />
                <BriefFact
                  label="Record refreshed"
                  value={formatFullDate(voteRecord?.lastUpdated ?? official.lastVerifiedAt)}
                  detail="Newest loaded source review"
                />
              </div>
            </div>

            <div className="flex flex-col justify-between bg-[linear-gradient(155deg,#eff6ff,#f8fafc_55%,#fff1f2)] p-6 md:border-l md:border-slate-200">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Evidence depth</p>
                <p className="mt-2 text-5xl font-black tracking-[-0.06em] text-slate-950">{buildoutPercent}%</p>
                <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
                  {buildoutComplete ? "Core sections are loaded." : "Open evidence gaps remain clearly labeled."}
                </p>
              </div>
              <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-white shadow-inner">
                <div
                  className={`${styles.activityBar} h-full rounded-full bg-[linear-gradient(90deg,#2563eb,#7c3aed,#e11d48)]`}
                  style={{ width: `${Math.min(100, Math.max(0, buildoutPercent))}%` }}
                />
              </div>
              {!buildoutComplete && missingItems.length > 0 ? (
                <details className="mt-5 rounded-xl border border-slate-200 bg-white/80 p-3 open:shadow-sm">
                  <summary className="cursor-pointer text-xs font-black text-slate-800">See remaining evidence gaps</summary>
                  <ul className="mt-3 space-y-1.5 text-xs font-semibold text-slate-600">
                    {missingItems.slice(0, 6).map((item) => (
                      <li key={item}>• {item.replace(/_/g, " ")}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.09)] sm:p-7">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className={styles.donut} style={{ background: donutBackground }} aria-label="Indexed vote mix chart">
              <div className={styles.donutLabel}>
                <p className="text-3xl font-black tracking-[-0.05em] text-slate-950">{compactNumber(voteTotal)}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">Votes indexed</p>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">Recorded activity mix</p>
              <h3 className="mt-1 text-2xl font-black tracking-[-0.03em] text-slate-950">How the loaded rolls break down</h3>
              <div className="mt-4 space-y-3">
                {voteSegments.length > 0 ? (
                  voteSegments.map((segment, index) => (
                    <VoteLegendRow key={segment.label} segment={segment} total={voteTotal} delay={index * 80} />
                  ))
                ) : (
                  <p className="rounded-xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-950">
                    A roll-call snapshot is not loaded yet. This chart stays neutral until official rows are attached.
                  </p>
                )}
              </div>
            </div>
          </div>
          <p className="mt-5 border-t border-slate-200 pt-4 text-[11px] font-semibold leading-5 text-slate-500">
            Activity counts describe recorded vote casts only. They do not label a vote good, bad, left, or right.
          </p>
        </article>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]">
        <LatestVoteStrip record={voteRecord} />
        <MoneySnapshot funding={funding} officialId={official.id} />
      </div>
    </section>
  );
}

function HeroMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="min-w-0 bg-slate-950/40 px-4 py-4 backdrop-blur-md sm:px-5">
      <dt className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</dt>
      <dd className="mt-1 text-xl font-black tracking-[-0.03em] text-white">{value}</dd>
      <p className="mt-1 truncate text-[10px] font-semibold text-slate-400">{detail}</p>
    </div>
  );
}

function BriefFact({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.17em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-black leading-5 text-slate-950">{value}</p>
      <p className="mt-1 line-clamp-2 text-[10px] font-semibold leading-4 text-slate-500">{detail}</p>
    </div>
  );
}

function VoteLegendRow({
  segment,
  total,
  delay,
}: {
  segment: { label: string; value: number; color: string };
  total: number;
  delay: number;
}) {
  const percentage = total ? (segment.value / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs font-bold">
        <span className="flex items-center gap-2 text-slate-700">
          <span className="h-2 w-2 rounded-full" style={{ background: segment.color }} />
          {segment.label}
        </span>
        <span className="text-slate-950">
          {segment.value.toLocaleString()} <span className="text-slate-400">· {percentage.toFixed(1)}%</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`${styles.activityBar} h-full rounded-full`}
          style={{ width: `${percentage}%`, background: segment.color, animationDelay: `${delay}ms` }}
        />
      </div>
    </div>
  );
}

function LatestVoteStrip({ record }: { record?: PublicVoteRecord }) {
  return (
    <article className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.14)] sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">Recent source receipts</p>
          <h3 className="mt-1 text-2xl font-black tracking-[-0.03em]">Latest indexed roll calls</h3>
        </div>
        {record ? <span className="text-xs font-bold text-slate-400">Updated {formatFullDate(record.lastUpdated)}</span> : null}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {record?.votes.slice(0, 3).map((vote) => (
          <a
            key={vote.sourceId}
            href={vote.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.recordCard} group rounded-2xl border border-white/10 bg-white/[0.07] p-4 pl-5 transition hover:-translate-y-1 hover:border-blue-300/35 hover:bg-white/[0.12]`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                Roll {vote.rollCall} · {formatShortDate(vote.date)}
              </span>
              <span className="rounded-full bg-white/10 px-2 py-1 text-[9px] font-black uppercase text-white">
                {vote.voteCast}
              </span>
            </div>
            <p className="mt-3 line-clamp-2 text-sm font-black leading-5 text-white transition group-hover:text-blue-200">
              {vote.title || vote.question || vote.issue}
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-blue-300">
              Open official record <span aria-hidden="true">↗</span>
            </span>
          </a>
        )) ?? (
          <p className="md:col-span-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm font-semibold text-slate-300">
            No roll-call rows are loaded for display yet. The source room shows where records can be checked.
          </p>
        )}
      </div>
    </article>
  );
}

function MoneySnapshot({ funding, officialId }: { funding?: FundingSummary; officialId: string }) {
  return (
    <article className="rounded-[2rem] border border-amber-200 bg-[linear-gradient(145deg,#fffbeb,#fff7ed_62%,#fff)] p-6 shadow-[0_24px_70px_rgba(120,53,15,0.08)] sm:p-7">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-800">Money snapshot</p>
      {funding ? (
        <>
          <p className="mt-2 text-4xl font-black tracking-[-0.055em] text-slate-950">{formatMoney(funding.totalRaised)}</p>
          <p className="mt-1 text-xs font-bold text-slate-600">Total raised · {funding.cycle} cycle</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-amber-200/70 bg-white/80 p-3">
              <p className="text-lg font-black text-slate-950">{formatMoney(funding.totalSpent)}</p>
              <p className="text-[9px] font-black uppercase tracking-wide text-slate-500">Spent</p>
            </div>
            <div className="rounded-xl border border-amber-200/70 bg-white/80 p-3">
              <p className="text-lg font-black text-slate-950">{formatMoney(funding.cashOnHand)}</p>
              <p className="text-[9px] font-black uppercase tracking-wide text-slate-500">Cash on hand</p>
            </div>
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950">Source review pending</p>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
            No reviewed finance totals are displayed here until a source-backed snapshot is ready.
          </p>
        </>
      )}
      <Link
        href={`/funding/${officialId}`}
        className="mt-5 inline-flex items-center gap-1 text-xs font-black text-amber-900 transition hover:text-red-800"
      >
        Open the money trail <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}

function buildConicGradient(
  segments: Array<{ value: number; color: string }>,
  total: number,
) {
  if (!total) return "conic-gradient(#e2e8f0 0 100%)";
  let cursor = 0;
  const stops = segments.map((segment) => {
    const start = cursor;
    cursor += (segment.value / total) * 100;
    return `${segment.color} ${start.toFixed(3)}% ${cursor.toFixed(3)}%`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatYear(value?: string) {
  if (!value) return "Review pending";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.getUTCFullYear().toString();
}

function formatShortDate(value?: string) {
  if (!value) return "Pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function formatFullDate(value?: string) {
  if (!value) return "Source review pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
