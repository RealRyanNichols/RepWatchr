import type { Metadata } from "next";
import Link from "next/link";
import {
  uapEvidenceBuckets,
  uapLearningQuestions,
  uapPageStats,
  uapWatchLanes,
  uapWatchSources,
  type UapSourceStatus,
  type UapTrackStatus,
} from "@/data/uap-watch";

export const metadata: Metadata = {
  title: "UAP Records Watch | RepWatchr",
  description:
    "Track UFO, UAP, alien-claim, congressional, declassification, and National Archives records with source-first public accountability.",
};

function sourceStatusLabel(status: UapSourceStatus) {
  return {
    live_collection: "Live collection",
    rolling_release: "Rolling release",
    introduced_bill: "Introduced bill",
    declassification_process: "Declassification",
  }[status];
}

function sourceStatusClasses(status: UapSourceStatus) {
  return {
    live_collection: "border-blue-200 bg-blue-50 text-blue-800",
    rolling_release: "border-emerald-200 bg-emerald-50 text-emerald-800",
    introduced_bill: "border-amber-200 bg-amber-50 text-amber-800",
    declassification_process: "border-red-200 bg-red-50 text-red-800",
  }[status];
}

function laneStatusLabel(status: UapTrackStatus) {
  return {
    active: "Active",
    watching: "Watching",
    needs_records: "Needs records",
    unverified_claims: "Claims only",
  }[status];
}

function laneStatusClasses(status: UapTrackStatus) {
  return {
    active: "bg-blue-700 text-white",
    watching: "bg-[#d6b35a] text-slate-950",
    needs_records: "bg-red-700 text-white",
    unverified_claims: "bg-slate-950 text-white",
  }[status];
}

function progressClasses(status: UapTrackStatus) {
  return {
    active: "bg-blue-700",
    watching: "bg-[#d6b35a]",
    needs_records: "bg-red-700",
    unverified_claims: "bg-slate-950",
  }[status];
}

function StatCard({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="rw-card min-w-0 rounded-xl p-4">
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{label}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{detail}</p>
    </div>
  );
}

export default function UapPage() {
  return (
    <div className="rw-page">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rw-hero-panel overflow-hidden rounded-2xl text-slate-950">
          <div className="grid gap-6 p-5 lg:grid-cols-[1.1fr_0.9fr] lg:p-7">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                UFOs, UAPs, alien claims, and government records
              </p>
              <h1 className="mt-3 max-w-full break-words text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
                UAP Records Watch
              </h1>
              <p className="mt-3 max-w-3xl break-words text-sm font-semibold leading-6 text-slate-700 sm:text-base">
                The government record is moving: NARA has a UFO/UAP records hub, a 2025 UAP release stream, and a Record Group 615 collection. RepWatchr tracks official records, congressional actions, declassification limits, hearing files, and alien claims without turning rumors into findings.
              </p>
              <p className="mt-3 max-w-3xl rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black leading-5 text-blue-950">
                Current posture: public records and transparency efforts are real; the sources attached here do not make an official finding that aliens are confirmed.
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Link href="#tracker" className="rw-action-button rounded-xl px-4 py-3 text-center text-sm font-black transition">
                  Open tracker
                </Link>
                <a
                  href="https://www.archives.gov/research/topics/uaps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rw-secondary-button rounded-xl px-4 py-3 text-center text-sm font-black transition"
                >
                  NARA source hub
                </a>
                <a
                  href="https://www.congress.gov/bill/119th-congress/house-bill/1187"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rw-secondary-button rounded-xl px-4 py-3 text-center text-sm font-black transition"
                >
                  H.R.1187
                </a>
              </div>
            </div>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <StatCard
                label="Official sources"
                value={uapPageStats.officialSources}
                detail="NARA, Congress.gov, and AARO records seeded into the watch stack."
              />
              <StatCard
                label="Tracker lanes"
                value={uapPageStats.trackerLanes}
                detail="Records, legislation, declassification, hearings, and claim review."
              />
              <StatCard
                label="Buildout"
                value={`${uapPageStats.averageCompletion}%`}
                detail="Completion starts as a records map, then grows into source-linked releases."
              />
              <StatCard
                label="Active releases"
                value={uapPageStats.activeRecords}
                detail="Live or rolling official record streams currently connected."
              />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rw-card rw-card-blue rounded-xl p-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-red-700">Rule one</p>
            <h2 className="mt-1 text-base font-black text-slate-950">Records before reactions.</h2>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
              Source pages, catalog records, bill text, hearing exhibits, and agency releases come before claims.
            </p>
          </div>
          <div className="rw-card rw-card-gold rounded-xl p-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-red-700">Rule two</p>
            <h2 className="mt-1 text-base font-black text-slate-950">Alien claims stay separate.</h2>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
              Non-human intelligence, crash retrieval, and reverse-engineering claims stay in a claim bucket until records support them.
            </p>
          </div>
          <div className="rw-card rw-card-red rounded-xl p-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-red-700">Rule three</p>
            <h2 className="mt-1 text-base font-black text-slate-950">No fake certainty.</h2>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
              Testimony, headlines, clips, and rumors are leads. The page labels what is official, proposed, unresolved, or unverified.
            </p>
          </div>
        </section>

        <section className="rw-dark-panel mt-8 rounded-2xl p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d6b35a]">Official source stack</p>
              <h2 className="text-2xl font-black text-white">Start with records people can check.</h2>
            </div>
            <p className="text-xs font-bold text-slate-300">{uapWatchSources.length} public sources loaded.</p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {uapWatchSources.map((source) => (
              <a
                key={source.id}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl border border-white/15 bg-white/10 p-4 transition hover:-translate-y-0.5 hover:bg-white/15"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wide text-[#d6b35a]">{source.agency}</p>
                    <h3 className="mt-1 text-lg font-black leading-tight text-white">{source.title}</h3>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${sourceStatusClasses(source.status)}`}>
                    {sourceStatusLabel(source.status)}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-200">{source.summary}</p>
                <p className="mt-3 text-xs font-black uppercase tracking-wide text-slate-400">Checked {source.lastCheckedAt}</p>
              </a>
            ))}
          </div>
        </section>

        <section id="tracker" className="mt-8 scroll-mt-28">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d6b35a]">Completion stages</p>
              <h2 className="text-2xl font-black text-white">Release, records, and claims tracker</h2>
            </div>
            <p className="text-xs font-bold text-slate-300">Source intake first. Findings later.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {uapWatchLanes.map((lane) => (
              <article key={lane.id} className="rw-card rounded-2xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wide text-red-700">{lane.label}</p>
                    <h3 className="mt-1 text-xl font-black text-slate-950">{lane.title}</h3>
                  </div>
                  <span className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${laneStatusClasses(lane.status)}`}>
                    {laneStatusLabel(lane.status)}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{lane.detail}</p>
                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">Buildout</p>
                    <p className="text-sm font-black text-slate-950">{lane.completion}%</p>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <div className={`h-full rounded-full ${progressClasses(lane.status)}`} style={{ width: `${lane.completion}%` }} />
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-slate-200 bg-white/70 p-3">
                  <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">Next intake move</p>
                  <p className="mt-1 text-sm font-black leading-5 text-slate-800">{lane.nextStep}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rw-panel mt-8 overflow-hidden rounded-2xl p-5">
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                Evidence buckets before claims
              </p>
              <h2 className="mt-2 text-xl font-black text-slate-950">
                Every wild story needs a plain source path.
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                This topic can be fun without becoming sloppy. RepWatchr should ask: who said it, where is the record, what agency owns it, what date was it released, and what is still missing?
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {uapEvidenceBuckets.map((item) => (
                <div key={item} className="rw-card rounded-lg px-3 py-2 text-sm font-black text-slate-800">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/20">
          <div className="grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d6b35a]">
                Intake questions
              </p>
              <h2 className="mt-2 text-xl font-black text-white">
                Teach the tracker what to look for next.
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                These are the questions the page should ask every time a new UFO, UAP, hearing, video, or alien claim gets submitted.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {uapLearningQuestions.map((question, index) => (
                <div key={question} className="rounded-xl border border-white/15 bg-[#06172f]/70 p-3">
                  <p className="text-[11px] font-black uppercase tracking-wide text-[#d6b35a]">
                    Question {index + 1}
                  </p>
                  <p className="mt-1 text-sm font-black leading-5 text-white">{question}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
