import Link from "next/link";
import Image from "next/image";
import { getAllOfficials, getScoreCard, getIssueCategories, getAllNews, getRedFlags, getRepWatchrDataStats } from "@/lib/data";
import { getSchoolBoardStats } from "@/lib/school-board-research";
import OfficialCard from "@/components/officials/OfficialCard";
import FarettaSearchBox from "@/components/shared/FarettaSearchBox";
import type { Official } from "@/types";

const levelCards = [
  {
    level: "federal",
    title: "Federal",
    description: "U.S. House & Senate",
    href: "/officials?level=federal",
  },
  {
    level: "state",
    title: "State",
    description: "Texas House & Senate live",
    href: "/officials?level=state",
  },
  {
    level: "county",
    title: "County",
    description: "County offices",
    href: "/officials?level=county",
  },
  {
    level: "city",
    title: "City",
    description: "City offices",
    href: "/officials?level=city",
  },
  {
    level: "school-board",
    title: "School Boards",
    description: "Sourced profiles live",
    href: "/school-boards",
  },
];

const memberFunnelTools = [
  {
    label: "Build a records request",
    detail: "Turn a concern into a clean request for agendas, minutes, filings, videos, contracts, or vote records.",
  },
  {
    label: "Start a timeline",
    detail: "Drop facts into a timeline starter that separates dates, claims, records, and missing proof.",
  },
  {
    label: "Track a target",
    detail: "Follow officials, boards, counties, races, attorneys, media, issues, and source gaps from one member office.",
  },
  {
    label: "Copy a safer post",
    detail: "Share what is known without overstating what still needs records.",
  },
];

function initialsFor(official: Official) {
  return `${official.firstName[0] ?? ""}${official.lastName[0] ?? ""}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function ProfileTicker({ officials }: { officials: Official[] }) {
  const rows = [...officials, ...officials];

  return (
    <div className="overflow-hidden border-y border-slate-200 bg-white">
      <div className="repwatchr-profile-marquee flex w-max gap-3 py-3">
        {rows.map((official, index) => (
          <Link
            key={`${official.id}-${index}`}
            href={`/officials/${official.id}`}
            className="group flex min-w-[210px] items-center gap-3 rounded-full border border-slate-200 bg-slate-50 py-2 pl-2 pr-4 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
          >
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white bg-slate-200 shadow-sm">
              {official.photo ? (
                <Image
                  src={official.photo}
                  alt={`${official.name} profile photo`}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-xs font-black text-slate-700">
                  {initialsFor(official)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950 group-hover:text-blue-800">
                {official.name}
              </p>
              <p className="truncate text-[11px] font-bold text-slate-500">
                {official.position} / {official.district ?? official.jurisdiction}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function WatchBoardCard({
  official,
  score,
  redFlags,
}: {
  official: Official;
  score?: number;
  redFlags: number;
}) {
  return (
    <Link
      href={`/officials/${official.id}`}
      className="group grid grid-cols-[56px_1fr_auto] items-center gap-3 rounded-xl border border-slate-300 bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md"
    >
      <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        {official.photo ? (
          <Image
            src={official.photo}
            alt={`${official.name} profile photo`}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-sm font-black text-slate-700">
            {initialsFor(official)}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-slate-950 group-hover:text-red-700">
          {official.name}
        </p>
        <p className="truncate text-[11px] font-bold text-slate-500">
          {official.position} / {official.district ?? official.jurisdiction}
        </p>
        <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-blue-800">
          {redFlags} flag{redFlags === 1 ? "" : "s"} loaded
        </p>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
          Score
        </p>
        <p className="text-xl font-black text-red-700">
          {typeof score === "number" ? score : "Open"}
        </p>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const officials = getAllOfficials();
  const issueCategories = getIssueCategories();
  const schoolBoardStats = getSchoolBoardStats();
  const dataStats = getRepWatchrDataStats();

  const stats = [
    { label: "Federal/State Seat Profiles", value: formatNumber(dataStats.federalAndStateSeatProfilesLoaded), caption: `${dataStats.federalAndStateProfileGaps} expected gaps` },
    { label: "Official Photos", value: formatNumber(dataStats.officialsWithPhotos), caption: "local headshots loaded" },
    { label: "School Board Trustees", value: formatNumber(schoolBoardStats.candidates), caption: "TEA source seed" },
    { label: "Scored Profiles", value: formatNumber(dataStats.officialsWithScoreCards), caption: `${dataStats.bills} vote files loaded` },
  ];

  const photoOfficials = officials
    .filter((official) => official.photo && (official.level === "federal" || official.level === "state"))
    .slice(0, 42);

  const watchBoardOfficials = officials
    .filter((official) => official.photo && (official.level === "federal" || official.level === "state"))
    .map((official) => {
      const scoreCard = getScoreCard(official.id);
      const redFlagCount = getRedFlags(official.id).length;
      return {
        official,
        score: scoreCard?.overall,
        redFlagCount,
        heat: redFlagCount * 18 + (scoreCard ? 100 - scoreCard.overall : 0),
      };
    })
    .filter(({ score, redFlagCount }) => typeof score === "number" || redFlagCount > 0)
    .sort((a, b) => b.heat - a.heat)
    .slice(0, 4);

  const featuredOfficials = officials
    .filter((o) => o.level === "federal" || o.level === "state")
    .slice(0, 6);

  const latestNews = getAllNews().slice(0, 3);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-blue-100 bg-[linear-gradient(135deg,#ffffff_0%,#eef4ff_48%,#fff7ed_100%)]">
        <div className="grid h-2 grid-cols-3">
          <div className="bg-red-700" />
          <div className="bg-white" />
          <div className="bg-blue-900" />
        </div>
        <ProfileTicker officials={photoOfficials} />
        <div className="relative mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 sm:py-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)] lg:px-8">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-red-700 px-3 py-1 text-xs font-black uppercase tracking-wide text-white shadow-sm">
                Watch Board Live
              </span>
              <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-950 shadow-sm">
                {formatNumber(dataStats.officialsWithPhotos)} faces loaded
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-900 shadow-sm">
                Source-backed only
              </span>
            </div>
            <h1 className="mt-4 text-4xl font-black leading-[0.96] tracking-tight text-blue-950 sm:text-6xl lg:text-7xl">
              Know Your Reps.
              <span className="block text-red-700">Put Them On The Record.</span>
            </h1>
            <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-blue-950/75 sm:text-lg">
              Open a profile, check the score, follow the money, send a missing source, or flag the record that voters need to see. Texas is live first; the national map builds from public records.
            </p>
            <div className="mt-5 max-w-2xl">
              <FarettaSearchBox compact placeholder="Ask Faretta AI who represents you, who funded them, or what record to pull..." />
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <Link
                href="/officials"
                className="rounded-xl bg-blue-900 px-4 py-3 text-center text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-red-700"
              >
                Open Officials
              </Link>
              <Link
                href="/create-account"
                className="rounded-xl border border-red-200 bg-white px-4 py-3 text-center text-sm font-black text-red-700 shadow-sm transition hover:-translate-y-0.5 hover:border-red-400 hover:bg-red-50"
              >
                Create Free Account
              </Link>
              <Link
                href="/school-boards"
                className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-center text-sm font-black text-blue-950 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-50"
              >
                School Boards
              </Link>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-slate-200 bg-white/85 p-3 shadow-sm">
                  <p className="text-2xl font-black text-blue-950">{stat.value}</p>
                  <p className="mt-1 text-[11px] font-black uppercase leading-4 text-red-700">{stat.label}</p>
                  <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500">{stat.caption}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-slate-300 bg-slate-950 p-4 text-white shadow-xl shadow-blue-950/20">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">The Watch Board</p>
                  <h2 className="mt-1 text-2xl font-black">Records voters should open first.</h2>
                </div>
                <Link href="/red-flags" className="shrink-0 rounded-full bg-red-700 px-3 py-1.5 text-xs font-black text-white transition hover:bg-red-600">
                  Red flags
                </Link>
              </div>
              <div className="mt-4 grid gap-2">
                {watchBoardOfficials.map(({ official, score, redFlagCount }) => (
                  <WatchBoardCard
                    key={official.id}
                    official={official}
                    score={score}
                    redFlags={redFlagCount}
                  />
                ))}
              </div>
              <p className="mt-3 text-xs font-semibold leading-5 text-slate-300">
                This board is driven by loaded scores and red-flag records. It changes when the source file changes.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/attorneys" className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md">
                <p className="text-xs font-black uppercase tracking-wide text-red-700">New lane</p>
                <h3 className="mt-1 text-lg font-black text-blue-950">Attorney Watch</h3>
                <p className="mt-1 text-sm font-semibold leading-5 text-slate-600">Law firms and attorneys tied to public power.</p>
              </Link>
              <Link href="/media" className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md">
                <p className="text-xs font-black uppercase tracking-wide text-red-700">New lane</p>
                <h3 className="mt-1 text-lg font-black text-blue-950">Media Watch</h3>
                <p className="mt-1 text-sm font-semibold leading-5 text-slate-600">Newsrooms, editors, reporters, corrections.</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
            {stats.map((stat) => (
              <div key={stat.label} className="py-6 px-4 text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {stat.label}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-gray-400">
                  {stat.caption}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Member Funnel */}
      <section className="border-b border-blue-100 bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-red-300">Free founder access</p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-5xl">
              Give people useful political tools before asking them for money.
            </h2>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-slate-300">
              Create an account and get the member office: watch lists, accountability packets,
              public-records request drafts, timeline starters, source tracking, signal map, and Faretta AI.
              The goal is simple: make RepWatchr useful enough that people come back.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/create-account"
                className="rounded-xl bg-white px-5 py-3 text-sm font-black text-blue-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50"
              >
                Start Free
              </Link>
              <Link
                href="/dashboard"
                className="rounded-xl border border-white/20 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Open Member Office
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-amber-300/30 bg-amber-300 p-5 text-slate-950">
              <p className="text-xs font-black uppercase tracking-wide">Founder window</p>
              <p className="mt-2 text-4xl font-black">90 days</p>
              <p className="mt-2 text-sm font-bold leading-6">
                Free buildout period. No price wall until the tools become part of people&apos;s regular research habit.
              </p>
            </div>
            {memberFunnelTools.map((tool) => (
              <div key={tool.label} className="rounded-2xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-black text-white">{tool.label}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{tool.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by Level */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Browse by Government Level
          </h2>
          <p className="text-gray-500 mt-2">
            From Congress to school boards, Texas is loaded first and every state follows the same source-backed model.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {levelCards.map((card) => (
            <Link
              key={card.level}
              href={card.href}
              className="group block rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg hover:border-blue-200 hover:-translate-y-1"
            >
              <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                {card.title}
              </h3>
              <p className="text-sm text-gray-500 mt-2">{card.description}</p>
              <span className="inline-block mt-4 text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                View Officials &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Issue Categories */}
      <section className="bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Scored on Public Issues
            </h2>
            <p className="text-gray-500 mt-2">
              Every score links back to a specific vote. Texas issue categories are the first live scoring set.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {issueCategories.map((issue) => (
              <Link
                key={issue.id}
                href={`/scorecards/${issue.id}`}
                className="group block rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <div
                  className="w-10 h-1 rounded-full mb-4"
                  style={{ backgroundColor: issue.color }}
                />
                <h3 className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                  {issue.name}
                </h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2">
                  {issue.description}
                </p>
                <p
                  className="text-xs font-bold mt-3"
                  style={{ color: issue.color }}
                >
                  {issue.weight}% of overall score
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Officials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Featured Officials
            </h2>
            <p className="text-gray-500 mt-1">
              Federal and state representatives
            </p>
          </div>
          <Link
            href="/officials"
            className="text-blue-600 hover:text-blue-800 text-sm font-bold"
          >
            View All &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featuredOfficials.map((official) => (
            <OfficialCard
              key={official.id}
              official={official}
              scoreCard={getScoreCard(official.id)}
            />
          ))}
        </div>
      </section>

      {/* Latest News */}
      {latestNews.length > 0 && (
        <section className="bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900">
                  Latest News
                </h2>
                <p className="text-gray-500 mt-1">
                  Breaking stories and accountability reports
                </p>
              </div>
              <Link
                href="/news"
                className="text-blue-600 hover:text-blue-800 text-sm font-bold"
              >
                All News &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {latestNews.map((article) => (
                <Link
                  key={article.id}
                  href={`/news/${article.id}`}
                  className="group block rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {article.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                    {article.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                    {article.summary}
                  </p>
                  <span className="inline-block mt-4 text-xs text-gray-400">
                    {new Date(article.publishedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Cards */}
      <section className="border-y border-blue-100 bg-[#f4f8ff]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Link
              href="/funding"
              className="group rounded-2xl border border-blue-100 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
            >
              <h3 className="font-extrabold text-xl text-blue-950 mb-3">
                Who Funds Them?
              </h3>
              <p className="text-blue-950/70 text-sm leading-relaxed mb-4">
                Follow the money. See who is funding your elected officials and
                where their campaign dollars come from.
              </p>
              <span className="text-blue-700 text-sm font-bold group-hover:translate-x-1 inline-block transition-transform">
                View Funding Data &rarr;
              </span>
            </Link>
            <Link
              href="/red-flags"
              className="group rounded-2xl border border-red-100 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-red-300 hover:shadow-lg"
            >
              <h3 className="font-extrabold text-xl text-red-700 mb-3">
                Red Flags
              </h3>
              <p className="text-blue-950/70 text-sm leading-relaxed mb-4">
                Conflicts of interest, broken promises, and issues voters should
                know about but may have missed.
              </p>
              <span className="text-red-700 text-sm font-bold group-hover:translate-x-1 inline-block transition-transform">
                View Red Flags &rarr;
              </span>
            </Link>
            <Link
              href="/methodology"
              className="group rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
            >
              <h3 className="font-extrabold text-xl text-emerald-800 mb-3">
                How We Score
              </h3>
              <p className="text-blue-950/70 text-sm leading-relaxed mb-4">
                Every score is traceable to specific votes. Transparent
                methodology focused on state-specific public interests.
              </p>
              <span className="text-emerald-700 text-sm font-bold group-hover:translate-x-1 inline-block transition-transform">
                View Methodology &rarr;
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="mx-auto mb-6 h-1.5 max-w-xs rounded-full bg-[linear-gradient(90deg,#bf0d3e_0%,#bf0d3e_35%,#ffffff_35%,#ffffff_65%,#002868_65%,#002868_100%)] shadow-sm" />
          <h2 className="text-3xl font-extrabold text-blue-950 mb-4">
            Your Voice Matters
          </h2>
          <p className="text-blue-950/70 text-lg mb-8 max-w-2xl mx-auto">
            Sign up, verify where voter verification is live, and start tracking
            officials. Texas verification is first; the national map builds state by state.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="rounded-xl bg-blue-900 px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 hover:bg-red-700"
            >
              Create Free Account
            </Link>
            <Link
              href="/methodology"
              className="rounded-xl border-2 border-red-200 px-8 py-3.5 text-sm font-bold text-red-700 hover:bg-red-50 transition-all"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
