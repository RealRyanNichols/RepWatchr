import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getAllOfficials, getAllScoreCards, getRepWatchrDataStats } from "@/lib/data";
import { getSchoolBoardStats } from "@/lib/school-board-research";
import OfficialGrid from "@/components/officials/OfficialGrid";
import type { GovernmentLevel } from "@/types";
import { getNationalBuildoutSummary, nationalGovernmentScopes } from "@/data/national-buildout";

export const metadata: Metadata = {
  title: "Elected Officials Directory",
  description:
    "Browse sourced elected-official profiles. Texas is the first loaded state, with federal, state, county, city, and school-board records.",
};

const levelLabels: Record<GovernmentLevel, string> = {
  federal: "Federal",
  state: "State",
  county: "County",
  city: "City",
  "school-board": "School Board",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export default function OfficialsPage() {
  const officials = getAllOfficials();
  const scoreCards = getAllScoreCards();
  const schoolBoardStats = getSchoolBoardStats();
  const dataStats = getRepWatchrDataStats();
  const nationalSummary = getNationalBuildoutSummary();
  const levelCounts = officials.reduce<Record<GovernmentLevel, number>>(
    (acc, official) => {
      acc[official.level] = (acc[official.level] ?? 0) + 1;
      return acc;
    },
    {
      federal: 0,
      state: 0,
      county: 0,
      city: 0,
      "school-board": 0,
    },
  );
  const statCards = [
    {
      label: "Federal/state seats",
      value: formatNumber(dataStats.federalAndStateSeatProfilesLoaded),
      detail: `${dataStats.federalProfilesLoaded}/${dataStats.federalExpectedSeats} Texas federal seats and ${dataStats.stateLegislatorProfilesLoaded}/${dataStats.stateLegislatureExpectedSeats} Texas legislative seats have person profile files.`,
    },
    {
      label: "Source-seeded profiles",
      value: formatNumber(dataStats.sourceSeededOfficialProfiles),
      detail: `${formatNumber(dataStats.officialsWithSourceLinks)} source-linked profiles and ${formatNumber(dataStats.officialsWithPhotos)} local photos; ${formatNumber(dataStats.missingReviewStatusOfficialProfiles)} legacy files still need review status.`,
    },
    {
      label: "Tracked record sets",
      value: formatNumber(dataStats.scoreCards),
      detail: `${formatNumber(dataStats.fundingSummaries)} funding summaries, ${formatNumber(dataStats.redFlagItems)} red-flag items, and ${formatNumber(dataStats.bills)} vote files are loaded.`,
    },
    {
      label: "School-board dossiers",
      value: formatNumber(schoolBoardStats.candidates),
      detail: `${formatNumber(schoolBoardStats.districts)} Texas districts, ${formatNumber(schoolBoardStats.stubProfiles)} queued or in-progress profiles, ${formatNumber(schoolBoardStats.gapCount)} research gaps.`,
    },
  ];
  return (
    <div className="bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <h1 className="sr-only">Elected officials directory</h1>
        <Suspense
          fallback={
            <div className="animate-pulse space-y-4 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
              <div className="h-12 rounded-xl bg-gray-200" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-8 w-24 rounded-full bg-gray-100" />
                ))}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-32 rounded-2xl bg-gray-100" />
                ))}
              </div>
            </div>
          }
        >
          <OfficialGrid officials={officials} scoreCards={scoreCards} />
        </Suspense>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-300 bg-white text-slate-950 shadow-sm">
          <div className="h-1.5 w-full bg-[linear-gradient(90deg,#b42318_0%,#b42318_48%,#ffffff_48%,#ffffff_52%,#1d4ed8_52%,#1d4ed8_100%)]" />
          <div className="grid gap-6 p-5 lg:grid-cols-[1.18fr_0.82fr] lg:p-7">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                United States public-record map
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Elected officials, source-backed.
              </h2>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700 sm:text-base">
                RepWatchr is built for nationwide coverage. The national model is enabled for every state, D.C., territories, tribal governments, school boards, special districts, courts, and other public offices. Texas is the first loaded state; every other row stays marked queued or partial until public sources are attached.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {Object.entries(levelLabels).map(([level, label]) => (
                  <Link
                    key={level}
                    href={`/officials?level=${level}`}
                    className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-800 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-800"
                  >
                    {label}: {formatNumber(levelCounts[level as GovernmentLevel])}
                  </Link>
                ))}
                <Link
                  href="/buildout"
                  className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-black text-red-800 transition hover:border-red-300 hover:bg-white"
                >
                  National model: {formatNumber(nationalSummary.enabledJurisdictions)} jurisdictions
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {statCards.map((card) => (
                <div key={card.label} className="rounded-xl border border-slate-300 bg-slate-50 p-4 shadow-sm">
                  <p className="text-2xl font-black text-slate-950">{card.value}</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{card.label}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-700">{card.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
            Nationwide source lanes
          </p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">
            Federal, state, local, tribal, and public-organization profiles use the same model.
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {nationalGovernmentScopes.slice(0, 6).map((scope) => (
              <div key={scope.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-950">{scope.label}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{scope.buildoutNeed}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
