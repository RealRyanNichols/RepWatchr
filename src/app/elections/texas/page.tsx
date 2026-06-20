import type { Metadata } from "next";
import Link from "next/link";
import {
  TEXAS_ELECTION_DATES,
  getTexasElectionRaces,
  getTexasElectionRacesByLane,
  type TexasElectionRace,
} from "@/data/texas-election-races";
import { getOfficialById } from "@/lib/data";

export const metadata: Metadata = {
  title: "Texas Election Races 2026 | RepWatchr",
  description:
    "Texas-first RepWatchr election race hub for statewide races, East Texas races, state legislative races, school board watch lanes, and source-backed citizen contributions.",
  alternates: {
    canonical: "https://www.repwatchr.com/elections/texas",
  },
  openGraph: {
    title: "Texas Election Races 2026 | RepWatchr",
    description:
      "The Texas-first election watchboard for big statewide races, East Texas races, officials, votes, money, source links, citizen contributions, and share-ready records.",
    url: "https://www.repwatchr.com/elections/texas",
    siteName: "RepWatchr",
    type: "website",
    images: [
      {
        url: "/images/repwatchr-cover-america-first.png",
        width: 2172,
        height: 724,
        alt: "RepWatchr Texas Election Races",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Texas Election Races 2026 | RepWatchr",
    description:
      "Statewide Texas races, East Texas races, officials, votes, money, source links, citizen contributions, and share-ready election records.",
    images: ["/images/repwatchr-cover-america-first.png"],
  },
};

const laneLabels: Record<TexasElectionRace["lane"], string> = {
  "big-race": "Big Texas races",
  "east-texas": "East Texas races",
  "local-watch": "Local watch",
};

const contributionPillars = [
  {
    title: "Source packets always",
    body: "Texas voters and local watchers can build clean race packets even if a live submission flow is temporarily unavailable.",
  },
  {
    title: "Live review queue",
    body: "With Supabase configured, account-based source submissions go into a private review queue before anything becomes public.",
  },
  {
    title: "East Texas priority",
    body: "Longview, Gregg County, Harrison County, Smith County, Tyler, and the surrounding districts get built first.",
  },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function RaceCard({ race }: { race: TexasElectionRace }) {
  const officials = race.officialIds.map((id) => getOfficialById(id)).filter(Boolean);

  return (
    <Link
      href={`/elections/texas/${race.slug}`}
      className="group flex h-full flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-[0_18px_46px_rgba(15,23,42,0.12)]"
    >
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-red-700 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white">
          {race.shortTitle}
        </span>
        <span className="rounded-full bg-blue-950 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white">
          {laneLabels[race.lane]}
        </span>
      </div>
      <h3 className="mt-4 text-xl font-black leading-tight text-blue-950 group-hover:text-red-700">
        {race.title}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-slate-600">
        {race.summary}
      </p>
      {officials.length ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {officials.slice(0, 3).map((official) => (
            <span
              key={official!.id}
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-700"
            >
              {official!.name}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-auto border-t border-slate-100 pt-4">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">{race.region}</p>
        <p className="mt-1 text-sm font-black text-slate-950">{race.electionDate}</p>
        <span className="mt-3 inline-flex text-[11px] font-black uppercase tracking-wide text-blue-800 group-hover:text-red-700">
          Open race record
        </span>
      </div>
    </Link>
  );
}

function RaceSection({
  title,
  kicker,
  races,
}: {
  title: string;
  kicker: string;
  races: TexasElectionRace[];
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">{kicker}</p>
          <h2 className="mt-1 text-2xl font-black leading-tight text-blue-950">{title}</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
          {formatNumber(races.length)} races
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {races.map((race) => (
          <RaceCard key={race.slug} race={race} />
        ))}
      </div>
    </section>
  );
}

export default function TexasElectionRacesPage() {
  const races = getTexasElectionRaces();
  const bigRaces = getTexasElectionRacesByLane("big-race");
  const eastTexasRaces = getTexasElectionRacesByLane("east-texas");
  const localWatch = getTexasElectionRacesByLane("local-watch");

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <section className="border-b border-blue-100 bg-[linear-gradient(135deg,#ffffff_0%,#eef4ff_56%,#fff7ed_100%)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
          <div>
            <p className="inline-flex rounded-full bg-red-700 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white">
              Texas-first race watch
            </p>
            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-blue-950 sm:text-7xl">
              Big races. East Texas records. One place to check first.
            </h1>
            <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-blue-950/75 sm:text-lg">
              This is the election-season map RepWatchr should own first: Texas statewide power,
              East Texas congressional races, state Senate and House districts, and school-board
              races where local records matter.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/elections"
                className="rounded-xl bg-blue-950 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-red-700"
              >
                Election hub
              </Link>
              <Link
                href="/officials?state=TX"
                className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-950"
              >
                Texas officials
              </Link>
              <Link
                href="/elections/texas/contribute"
                className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black uppercase tracking-wide text-amber-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white"
              >
                Contribute a source
              </Link>
            </div>
          </div>

          <div className="grid content-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.10)]">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Total races", races.length],
                ["Big races", bigRaces.length],
                ["East Texas", eastTexasRaces.length],
                ["Local watch", localWatch.length],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-2xl font-black text-slate-950">{formatNumber(Number(value))}</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{label}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-900">Election dates</p>
              <div className="mt-3 grid gap-2">
                {TEXAS_ELECTION_DATES.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2">
                    <span className="text-xs font-black uppercase tracking-wide text-slate-600">{item.label}</span>
                    <span className="text-sm font-black text-blue-950">{item.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
          <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Texas contributor network</p>
              <h2 className="mt-2 text-3xl font-black leading-tight text-blue-950">
                Let Texans help build the record without lowering the standard.
              </h2>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-700">
                The Texas buildout starts with voters, local researchers, parents, county watchers,
                and East Texas people who can point RepWatchr to filings, candidate pages, meeting
                clips, agendas, corrections, and source-backed local issues.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/elections/texas/contribute"
                  className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-950"
                >
                  Add Texas record
                </Link>
                <Link
                  href="/elections/texas/contribute"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:text-red-700"
                >
                  Open packet builder
                </Link>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-1">
              {contributionPillars.map((pillar) => (
                <div key={pillar.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-black text-blue-950">{pillar.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{pillar.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <RaceSection kicker="Statewide attention" title="Big Texas races to watch first" races={bigRaces} />
        <RaceSection kicker="East Texas" title="East Texas congressional and state races" races={eastTexasRaces} />
        <RaceSection kicker="Local power" title="School board and local election lanes" races={localWatch} />
      </main>
    </div>
  );
}
