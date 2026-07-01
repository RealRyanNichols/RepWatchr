import Link from "next/link";
import type { TexasRepresentativeBuildout } from "@/lib/texas-representatives";

function percent(loaded: number, expected: number) {
  if (!expected) return 0;
  return Math.round((loaded / expected) * 100);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export default function TexasRepresentativeCommandPanel({
  buildout,
}: {
  buildout: TexasRepresentativeBuildout;
}) {
  const partyTotal = Object.values(buildout.partyCounts).reduce((sum, value) => sum + value, 0);
  const republicanPercent = partyTotal ? Math.round((buildout.partyCounts.R / partyTotal) * 100) : 0;
  const democratPercent = partyTotal ? Math.round((buildout.partyCounts.D / partyTotal) * 100) : 0;

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-slate-300 bg-slate-950 text-white shadow-2xl shadow-slate-950/25">
      <div className="h-2 bg-[linear-gradient(90deg,#b42318_0%,#b42318_34%,#d6b35a_34%,#d6b35a_54%,#1d4ed8_54%,#1d4ed8_100%)]" />
      <div className="rw-shine-card rw-party-wave p-5 sm:p-6 lg:p-7">
        <div className="rw-shine-content grid gap-6 lg:grid-cols-[1fr_0.78fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">
              Texas representative buildout
            </p>
            <h2 className="mt-2 max-w-4xl text-3xl font-black leading-tight tracking-normal sm:text-5xl">
              Every Texas rep gets a profile, a source trail, a visual score state, and a share-ready dossier.
            </h2>
            <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-slate-200 sm:text-base">
              Federal and state Texas representatives are pulled forward here first: photos, official links, score status,
              vote coverage, money coverage, and missing district gaps. Good records get green/blue praise treatment.
              Bad loaded scorecards get red warning treatment. Unscored records stay marked source-review until votes and
              methodology are attached.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/officials?state=TX&level=all"
                className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-red-700"
              >
                Open all Texas reps
              </Link>
              <Link
                href="/officials?state=TX&level=federal"
                className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-white hover:text-blue-950"
              >
                Federal only
              </Link>
              <Link
                href="/officials?state=TX&level=state"
                className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-white hover:text-blue-950"
              >
                Statehouse only
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-lg">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Total buildout</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p className="text-5xl font-black">{buildout.totals.loaded}</p>
                <p className="pb-2 text-sm font-black uppercase tracking-wide text-slate-300">
                  of {buildout.totals.expected}
                </p>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#16a34a,#d6b35a,#1d4ed8)]"
                  style={{ width: `${percent(buildout.totals.loaded, buildout.totals.expected)}%` }}
                />
              </div>
              <p className="mt-3 text-xs font-bold text-slate-300">
                {buildout.totals.missing === 0
                  ? "Texas representative skeleton is fully loaded."
                  : `${buildout.totals.missing} district gap remains visible for source review.`}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatPill label="Photos" value={`${buildout.totals.withPhotos}/${buildout.totals.loaded}`} tone="blue" />
              <StatPill label="Sources" value={`${buildout.totals.sourceLinked}/${buildout.totals.loaded}`} tone="gold" />
              <StatPill label="Vote files" value={formatNumber(buildout.totals.withVotes)} tone="green" />
              <StatPill label="Money files" value={formatNumber(buildout.totals.withFunding)} tone="red" />
            </div>
          </div>
        </div>

        <div className="rw-shine-content mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {buildout.chambers.map((chamber) => (
            <article
              key={chamber.key}
              className={`rounded-2xl border p-4 shadow-lg ${
                chamber.missing.length
                  ? "border-red-300/60 bg-red-950/35"
                  : "border-emerald-300/40 bg-emerald-950/25"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-black leading-tight">{chamber.label}</h3>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                    chamber.missing.length ? "bg-red-500 text-white" : "bg-emerald-400 text-emerald-950"
                  }`}
                >
                  {percent(chamber.loaded, chamber.expected)}%
                </span>
              </div>
              <p className="mt-3 text-3xl font-black">
                {chamber.loaded}
                <span className="text-base text-slate-300"> / {chamber.expected}</span>
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
                <div
                  className={`h-full rounded-full ${
                    chamber.missing.length ? "bg-gradient-to-r from-red-600 to-amber-300" : "bg-gradient-to-r from-emerald-500 to-blue-400"
                  }`}
                  style={{ width: `${percent(chamber.loaded, chamber.expected)}%` }}
                />
              </div>
              <p className="mt-3 text-xs font-bold leading-5 text-slate-300">
                {chamber.missing.length
                  ? `Missing district(s): ${chamber.missing.join(", ")}`
                  : "Loaded with photos and source links in the representative directory."}
              </p>
            </article>
          ))}
        </div>

        <div className="rw-shine-content mt-6 grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-lg">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Party signal</p>
            <div className="mt-4 overflow-hidden rounded-full bg-white/15">
              <div className="flex h-5">
                <div className="bg-red-600" style={{ width: `${republicanPercent}%` }} />
                <div className="bg-blue-600" style={{ width: `${democratPercent}%` }} />
                <div className="flex-1 bg-slate-500" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <StatPill label="Republican" value={formatNumber(buildout.partyCounts.R)} tone="red" />
              <StatPill label="Democrat" value={formatNumber(buildout.partyCounts.D)} tone="blue" />
              <StatPill
                label="Other"
                value={formatNumber(buildout.partyCounts.I + buildout.partyCounts.NP + buildout.partyCounts.VR + buildout.partyCounts.VD)}
                tone="gold"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-lg">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Share graphic states</p>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <SignalCard label="Strong record" value={buildout.scoreStatus.strong} tone="green" />
              <SignalCard label="Mixed record" value={buildout.scoreStatus.mixed} tone="gold" />
              <SignalCard label="Bad record" value={buildout.scoreStatus.bad} tone="red" />
              <SignalCard label="Needs score" value={buildout.scoreStatus.unscored} tone="blue" />
            </div>
            <p className="mt-4 text-xs font-bold leading-5 text-slate-300">
              These labels are tied to loaded scorecards only. No score means source-review, not praise or condemnation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatPill({ label, value, tone }: { label: string; value: string | number; tone: "red" | "blue" | "gold" | "green" }) {
  const tones = {
    red: "border-red-300/40 bg-red-500/15 text-red-100",
    blue: "border-blue-300/40 bg-blue-500/15 text-blue-100",
    gold: "border-amber-300/40 bg-amber-400/15 text-amber-100",
    green: "border-emerald-300/40 bg-emerald-400/15 text-emerald-100",
  };

  return (
    <div className={`rounded-xl border px-3 py-2 ${tones[tone]}`}>
      <p className="text-[10px] font-black uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function SignalCard({ label, value, tone }: { label: string; value: number; tone: "red" | "blue" | "gold" | "green" }) {
  const tones = {
    red: "border-red-300 bg-red-500/20 text-red-100",
    blue: "border-blue-300 bg-blue-500/20 text-blue-100",
    gold: "border-amber-300 bg-amber-400/20 text-amber-100",
    green: "border-emerald-300 bg-emerald-400/20 text-emerald-100",
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-1 text-[11px] font-black uppercase tracking-wide">{label}</p>
    </div>
  );
}
