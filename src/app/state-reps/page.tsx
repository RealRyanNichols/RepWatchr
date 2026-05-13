import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import OfficialGrid from "@/components/officials/OfficialGrid";
import { stateCivicOutreachPriorities } from "@/data/state-civic-outreach-priorities";
import { getAllScoreCards } from "@/lib/data";
import { getAllStateLegislators, getStateLegislatureBuildoutStats } from "@/lib/state-legislature";

export const metadata: Metadata = {
  title: "State Representatives Directory",
  description:
    "Browse RepWatchr's source-seeded state representative and state senator profiles across the United States, with photos, sources, vote-record gaps, and buildout status.",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export default function StateRepsPage() {
  const stateLegislators = getAllStateLegislators();
  const scoreCards = getAllScoreCards();
  const stats = getStateLegislatureBuildoutStats();
  const faceStrip = stateLegislators.filter((official) => official.photo).slice(0, 18);
  const topRows = stats.rows.slice(0, 12);
  const gapRows = [...stats.rows]
    .sort((a, b) => b.profilesMissingPhotos - a.profilesMissingPhotos || a.name.localeCompare(b.name))
    .slice(0, 8);

  return (
    <div className="bg-slate-100 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-lg border border-slate-300 bg-slate-950 text-white shadow-sm">
          <div className="h-1.5 bg-[linear-gradient(90deg,#c1121f_0%,#c1121f_33%,#f5f5f4_33%,#f5f5f4_66%,#1d4ed8_66%,#1d4ed8_100%)]" />
          <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.04fr)_minmax(320px,0.96fr)] lg:p-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">Statehouse command deck</p>
              <h1 className="mt-2 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Every state rep gets a profile.
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-200 sm:text-base">
                State representatives, delegates, assemblymembers, state senators, and territorial legislators are now pulled into one national statehouse view. The next work is photos, vote-direction scoring, funding, local news clips, and correction access.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="#state-rep-directory"
                  className="rounded-lg bg-[#d5aa3f] px-4 py-2 text-sm font-black text-slate-950 shadow-sm transition hover:bg-[#f0c75f]"
                >
                  Open state-rep finder
                </Link>
                <Link
                  href="/officials?level=state"
                  className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/20"
                >
                  View in officials
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <MetricCard label="State legislators" value={formatNumber(stats.totalProfiles)} detail={`${formatNumber(stats.jurisdictionsLoaded)} jurisdictions loaded`} />
              <MetricCard label="State reps/delegates" value={formatNumber(stats.lowerChamberProfiles)} detail="Lower-chamber profiles" />
              <MetricCard label="State senators" value={formatNumber(stats.upperChamberProfiles)} detail="Upper-chamber profiles" />
              <MetricCard label="Faces attached" value={formatNumber(stats.profilesWithPhotos)} detail={`${formatNumber(stats.profilesMissingPhotos)} still need photos`} />
              <MetricCard label="Source linked" value={formatNumber(stats.profilesWithSourceLinks)} detail="OpenStates and official links" />
              <MetricCard label="Vote records" value={formatNumber(stats.profilesWithVoteRecords)} detail="Loaded roll-call layers" />
            </div>
          </div>

          <div className="border-t border-white/10 bg-white/5 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-300">Statehouse face strip</p>
              <p className="text-xs font-black text-[#f5d77b]">{formatNumber(stats.averageStateCompletionPercent)}% avg buildout</p>
            </div>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {faceStrip.map((official) => (
                <Link
                  key={official.id}
                  href={`/officials/${official.id}`}
                  className="group w-36 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white text-slate-950 transition hover:-translate-y-0.5 hover:border-[#d5aa3f]"
                >
                  <div className="relative h-32 bg-slate-200">
                    <Image
                      src={official.photo!}
                      alt={`${official.name} profile photo`}
                      fill
                      sizes="144px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-2">
                    <p className="truncate text-sm font-black group-hover:text-blue-800">{official.name}</p>
                    <p className="mt-0.5 truncate text-[11px] font-bold text-slate-600">{official.district ?? official.position}</p>
                    <p className="mt-1 truncate text-[11px] font-black uppercase tracking-wide text-red-700">
                      {official.state}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.82fr]">
          <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">State completion race</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Which statehouse is closest to green?</h2>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {topRows.map((row) => (
                <StateRaceCard key={row.code} row={row} />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <section className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm sm:p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Photo gap board</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Fastest wins are photos.</h2>
              <div className="mt-4 space-y-2">
                {gapRows.map((row) => (
                  <Link
                    key={row.code}
                    href={row.href}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    <span>
                      <span className="block text-sm font-black text-slate-950">{row.name}</span>
                      <span className="block text-xs font-bold text-slate-600">
                        {formatNumber(row.totalProfiles)} profiles loaded
                      </span>
                    </span>
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-800">
                      {formatNumber(row.profilesMissingPhotos)} missing
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm sm:p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Texas outreach lane</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Civic names stay separate from officeholders.</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                These are research and relationship leads, not elected-official profiles unless a current public-office source verifies that status.
              </p>
              <div className="mt-4 space-y-2">
                {stateCivicOutreachPriorities.map((person) => (
                  <div key={person.name} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-black text-slate-950">{person.name}</p>
                    <p className="mt-1 text-xs font-bold text-slate-600">{person.publicRoleLabel}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {person.sourceLinks.slice(0, 2).map((source) => (
                        <a
                          key={source.url}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-black text-blue-800 hover:border-blue-300 hover:bg-blue-50"
                        >
                          Source
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>

        <div id="state-rep-directory" className="mt-5 scroll-mt-24">
          <Suspense
            fallback={
              <div className="animate-pulse space-y-4 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
                <div className="h-12 rounded-xl bg-gray-200" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-32 rounded-2xl bg-gray-100" />
                  ))}
                </div>
              </div>
            }
          >
            <OfficialGrid
              officials={stateLegislators}
              scoreCards={scoreCards}
              defaultLevel="state"
              resetLabel="Reset to State Reps"
              introText="Start with state reps, then narrow by party, chamber, district, state, or name."
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white p-3 text-slate-950">
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-red-700">{label}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{detail}</p>
    </div>
  );
}

function StateRaceCard({ row }: { row: ReturnType<typeof getStateLegislatureBuildoutStats>["rows"][number] }) {
  return (
    <Link
      href={row.href}
      className="rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:border-blue-300 hover:bg-blue-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-950">{row.name}</p>
          <p className="mt-1 text-xs font-bold text-slate-600">
            {formatNumber(row.lowerChamberProfiles)} lower / {formatNumber(row.upperChamberProfiles)} senate
          </p>
        </div>
        <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-black text-white">{row.completionPercent}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-[#d5aa3f]" style={{ width: `${row.completionPercent}%` }} />
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-600">
        {formatNumber(row.totalProfiles)} profiles, {formatNumber(row.profilesWithPhotos)} faces, {formatNumber(row.profilesWithVoteRecords)} vote records.
      </p>
    </Link>
  );
}
