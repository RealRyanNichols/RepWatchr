import Link from "next/link";
import { getAllOfficials, getScoreCard, getIssueCategories, getAllNews } from "@/lib/data";
import { getSchoolBoardStats } from "@/lib/school-board-research";
import { buildPickerStates } from "@/lib/picker-data";
import OfficialCard from "@/components/officials/OfficialCard";
import GideonSearchBox from "@/components/shared/GideonSearchBox";
import DrillDownPicker from "@/components/school-board/DrillDownPicker";

const levelCards = [
  {
    level: "federal",
    title: "Federal",
    description: "US House & Senate",
    href: "/officials?level=federal",
  },
  {
    level: "state",
    title: "State",
    description: "TX House & Senate",
    href: "/officials?level=state",
  },
  {
    level: "county",
    title: "County",
    description: "30+ Texas Counties",
    href: "/officials?level=county",
  },
  {
    level: "city",
    title: "City",
    description: "43+ Texas Cities",
    href: "/officials?level=city",
  },
  {
    level: "school-board",
    title: "School Boards",
    description: "Sourced profiles live",
    href: "/school-boards",
  },
];

export default function HomePage() {
  const officials = getAllOfficials();
  const issueCategories = getIssueCategories();
  const schoolBoardStats = getSchoolBoardStats();
  const pickerStates = buildPickerStates();

  // Compute real stats from data
  const counties = new Set(officials.flatMap((o) => o.county));

  const stats = [
    { label: "Officials Tracked", value: String(officials.length) },
    { label: "Issue Categories", value: String(issueCategories.length) },
    { label: "Counties Covered", value: String(counties.size) },
    { label: "School Board Profiles", value: String(schoolBoardStats.candidates) },
  ];

  const featuredOfficials = officials
    .filter((o) => o.level === "federal" || o.level === "state")
    .slice(0, 6);

  const latestNews = getAllNews().slice(0, 3);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-blue-100 bg-[linear-gradient(135deg,#ffffff_0%,#f4f8ff_52%,#fff7ed_100%)]">
        <div className="grid h-2 grid-cols-3">
          <div className="bg-red-700" />
          <div className="bg-white" />
          <div className="bg-blue-900" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-24 lg:grid-cols-[1fr_0.85fr] lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-5 flex flex-wrap gap-2">
              {["God", "Family", "Country"].map((value) => (
                <span key={value} className="rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-950 shadow-sm">
                  {value}
                </span>
              ))}
            </div>
            <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-tight text-blue-950 sm:mb-6 sm:text-6xl">
              Know Your Reps.
              <br />
              <span className="text-red-700">
                Hold Them Accountable.
              </span>
            </h1>
            <p className="mb-8 max-w-2xl text-base font-semibold leading-relaxed text-blue-950/75 sm:mb-10 sm:text-lg">
              Scorecards, voting records, campaign funding, and red flags for
              every elected official in Texas. Verified Texans can
              vote and comment publicly.
            </p>
            <div className="mb-8 max-w-xl">
              <GideonSearchBox compact placeholder="Ask Faretta AI to find a rep, school board, county, vote, or record..." />
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/officials"
                className="rounded-xl bg-blue-900 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-xl"
              >
                Browse All Officials
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-xl border border-red-200 bg-white px-6 py-3 text-sm font-bold text-red-700 shadow-lg transition-all hover:-translate-y-0.5 hover:border-red-400 hover:shadow-xl"
              >
                Sign Up to Vote
              </Link>
            </div>
          </div>
          <div className="grid gap-4">
            <DrillDownPicker states={pickerStates} />
            <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/70">
              <p className="text-sm font-black uppercase tracking-wide text-red-700">Texas accountability map</p>
              <h2 className="mt-2 text-3xl font-black text-blue-950">Local politics should be clear enough for families to follow.</h2>
              <div className="mt-6 grid gap-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                    <span className="text-sm font-black text-blue-950">{stat.label}</span>
                    <span className="text-2xl font-black text-red-700">{stat.value}</span>
                  </div>
                ))}
              </div>
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
            From Congress to school boards -- every elected official tracked
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
              Scored on Texas Issues
            </h2>
            <p className="text-gray-500 mt-2">
              Every score links back to a specific vote -- fully transparent
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
                methodology focused on Texas interests.
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
            Sign up, verify your Texas identity, and start voting on officials.
            Share your opinions publicly. Real data from verified residents.
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
