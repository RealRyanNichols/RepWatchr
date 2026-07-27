import type { Metadata } from "next";
import Link from "next/link";
import { getAllOfficials } from "@/lib/data";
import {
  EAST_TEXAS_LAUNCH_JURISDICTIONS,
  HARLETON_COVERAGE_CENTER,
  OFFICE_FAMILY_EXPECTATIONS,
  eastTexasProfileReadiness,
  isInEastTexasLaunchTerritory,
} from "@/lib/east-texas-launch-territory";

export const metadata: Metadata = {
  title: "East Texas Accountability Desk | RepWatchr",
  description: "RepWatchr's source-led profile and reporting desk for elected officials serving communities within 75 road miles of Harleton, Texas.",
};

export default function EastTexasAccountabilityDesk() {
  const officials = getAllOfficials().filter(isInEastTexasLaunchTerritory);
  const readiness = officials.map((official) => ({ official, readiness: eastTexasProfileReadiness(official) }));
  const complete = readiness.filter((row) => row.readiness.percent === 100);
  const needsWork = readiness.filter((row) => row.readiness.percent < 100).sort((a, b) => a.readiness.percent - b.readiness.percent);
  const levels = new Map<string, number>();
  officials.forEach((official) => levels.set(official.level, (levels.get(official.level) ?? 0) + 1));

  return (
    <main className="bg-[#f5f1e8] text-[#111b24]">
      <section className="border-b border-[#cabfae] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="font-semibold text-[#a23a2b]">The East Texas public record</p>
          <div className="mt-5 grid gap-10 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl font-[Fraunces] text-5xl font-semibold leading-[.94] sm:text-7xl">
                Every local office. Every public record. No free passes.
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-700">
                RepWatchr is building the complete accountability desk for officials serving communities within
                {` ${HARLETON_COVERAGE_CENTER.roadRadiusMiles} road miles of ${HARLETON_COVERAGE_CENTER.label}. `}
                Praise must have receipts. Criticism must have receipts. Missing work stays visible until it is finished.
              </p>
            </div>
            <div className="border-l-4 border-[#a23a2b] pl-6">
              <p className="font-[Fraunces] text-5xl font-semibold">{officials.length.toLocaleString()}</p>
              <p className="mt-2 font-semibold">starter profiles currently matched to the launch territory</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {complete.length} pass the current six-part readiness gate. {needsWork.length} still need one or more
                portraits, sources, contacts, social links, biographies, or a current human review.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12">
        <div className="grid gap-px border-y border-[#cabfae] bg-[#cabfae] md:grid-cols-3">
          {[
            ["Counties in scope", EAST_TEXAS_LAUNCH_JURISDICTIONS.counties.length],
            ["Communities indexed", EAST_TEXAS_LAUNCH_JURISDICTIONS.communities.length],
            ["School districts named", EAST_TEXAS_LAUNCH_JURISDICTIONS.schoolDistricts.length],
          ].map(([label, value]) => (
            <div key={label} className="bg-[#f5f1e8] px-5 py-7">
              <p className="font-[Fraunces] text-4xl font-semibold">{value}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <h2 className="font-[Fraunces] text-4xl font-semibold">The office decides the evidence.</h2>
            <p className="mt-4 leading-7 text-slate-700">
              A sheriff is not graded like a legislator. A school trustee is not graded like a prosecutor. Each profile
              measures the duties, decisions, money, access, and promises that belong to that office.
            </p>
          </div>
          <div className="divide-y divide-[#cabfae] border-y border-[#cabfae]">
            {OFFICE_FAMILY_EXPECTATIONS.map((family) => (
              <div key={family.key} className="grid gap-2 py-5 sm:grid-cols-[12rem_1fr]">
                <p className="font-[Fraunces] text-xl font-semibold">{family.label}</p>
                <p className="text-sm leading-6 text-slate-700">{family.records}</p>
              </div>
            ))}
          </div>
        </div>

        <section className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-5 border-b border-[#cabfae] pb-5">
            <div>
              <h2 className="font-[Fraunces] text-4xl font-semibold">Buildout ledger</h2>
              <p className="mt-2 text-slate-700">Lowest-completion profiles come first. Nothing thin is disguised as complete.</p>
            </div>
            <Link href="/officials" className="min-h-11 border border-[#111b24] px-5 py-3 text-sm font-semibold hover:bg-[#111b24] hover:text-white">
              Search every official
            </Link>
          </div>
          <div className="divide-y divide-[#cabfae]">
            {needsWork.slice(0, 24).map(({ official, readiness }) => (
              <Link key={official.id} href={`/officials/${official.id}`} className="grid gap-3 py-5 hover:bg-white/55 sm:grid-cols-[1.3fr_1fr_8rem] sm:items-center">
                <div>
                  <p className="font-[Fraunces] text-2xl font-semibold">{official.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{official.position} · {official.jurisdiction}</p>
                </div>
                <p className="text-sm text-slate-600">
                  {Object.entries(readiness.checks).filter(([, passed]) => !passed).map(([key]) => key).join(" · ")}
                </p>
                <p className="font-[Fraunces] text-2xl font-semibold sm:text-right">{readiness.percent}%</p>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

