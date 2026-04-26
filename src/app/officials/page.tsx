import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getAllOfficials, getAllScoreCards } from "@/lib/data";
import { getSchoolBoardStats } from "@/lib/school-board-research";
import OfficialGrid from "@/components/officials/OfficialGrid";
import type { GovernmentLevel } from "@/types";

export const metadata: Metadata = {
  title: "All Government Officials",
  description:
    "Browse sourced Texas government profiles across federal, state, county, city, and school-board offices.",
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
  const trackedCounties = new Set(officials.flatMap((official) => official.county)).size;
  const statCards = [
    { label: "Official profiles", value: formatNumber(officials.length), detail: "Loaded from local public-record files" },
    { label: "School-board profiles", value: formatNumber(schoolBoardStats.candidates), detail: `${formatNumber(schoolBoardStats.districts)} Texas districts loaded` },
    { label: "Counties touched", value: formatNumber(Math.max(trackedCounties, schoolBoardStats.counties)), detail: "County, city, and school-board coverage" },
    { label: "Source links", value: formatNumber(schoolBoardStats.sourceCount), detail: "School-board roster and profile sources" },
  ];
  const actionCards = [
    {
      title: "Ask Faretta AI",
      href: "/faretta-ai?q=Find every official for my county",
      body: "Use plain English to find a county, city, school board, race, official, vote, donor, or public-record path.",
    },
    {
      title: "Open School Boards",
      href: "/school-boards",
      body: "Jump into the Texas school-board picker and open districts or members quickly.",
    },
    {
      title: "Report Missing Official",
      href: "/feedback",
      body: "Send the public source URL, office, jurisdiction, term date, and what needs to be corrected or added.",
    },
    {
      title: "Read Methodology",
      href: "/methodology",
      body: "Check how RepWatchr separates records, public claims, scores, flags, and citizen input.",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-8 overflow-hidden rounded-2xl border border-blue-100 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_47%,#fff7ed_100%)] shadow-sm">
        <div className="h-1.5 w-full bg-[linear-gradient(90deg,#bf0d3e_0%,#bf0d3e_33%,#ffffff_33%,#ffffff_66%,#002868_66%,#002868_100%)]" />
        <div className="grid gap-6 p-5 lg:grid-cols-[1.25fr_0.75fr] lg:p-7">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
              Texas public-record map
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-blue-950 sm:text-4xl">
              All government officials, source-backed.
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700 sm:text-base">
              RepWatchr is being built to cover every Texas office we can verify: federal, state, county, city, school board, and appointed public boards where a public record confirms the seat. A profile should show who holds power, what records support it, what citizens say, and what is still missing.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {Object.entries(levelLabels).map(([level, label]) => (
                <Link
                  key={level}
                  href={`/officials?level=${level}`}
                  className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-black text-blue-950 transition hover:border-red-200 hover:text-red-700"
                >
                  {label}: {formatNumber(levelCounts[level as GovernmentLevel])}
                </Link>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {statCards.map((card) => (
              <div key={card.label} className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
                <p className="text-2xl font-black text-blue-950">{card.value}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{card.label}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{card.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {actionCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
          >
            <p className="text-sm font-black text-blue-950">{card.title}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{card.body}</p>
          </Link>
        ))}
      </section>

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
              New information path
            </p>
            <h2 className="mt-2 text-xl font-black text-slate-950">
              Add it only when the public record supports it.
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Faretta AI can help turn a name, county, district, roster page, agenda, filing, or election source into a research checklist. The public profile still needs a source URL before it changes the record.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Official name and office",
              "Jurisdiction, county, district, or seat",
              "Public source URL",
              "Term, election date, or appointment date",
              "What changed or needs review",
              "No private addresses or minor children",
            ].map((item) => (
              <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Suspense
        fallback={
          <div className="animate-pulse space-y-4">
            <div className="h-10 rounded-xl bg-gray-200" />
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
    </div>
  );
}
