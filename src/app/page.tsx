import Link from "next/link";
import { getAllOfficials, getScoreCard, getIssueCategories } from "@/lib/data";
import OfficialCard from "@/components/officials/OfficialCard";
import SearchBar from "@/components/shared/SearchBar";

const levelCards = [
  {
    level: "federal",
    title: "Federal",
    description: "US House (TX-1) & Senate",
    href: "/officials?level=federal",
  },
  {
    level: "state",
    title: "State",
    description: "TX House (HD-7) & Senate",
    href: "/officials?level=state",
  },
  {
    level: "county",
    title: "County",
    description: "Smith & Gregg Counties",
    href: "/officials?level=county",
  },
  {
    level: "city",
    title: "City",
    description: "Tyler & Longview",
    href: "/officials?level=city",
  },
  {
    level: "school-board",
    title: "School Boards",
    description: "Tyler ISD & Longview ISD",
    href: "/school-boards",
  },
];

export default function HomePage() {
  const officials = getAllOfficials();
  const issueCategories = getIssueCategories();

  // Compute real stats from data
  const counties = new Set(officials.flatMap((o) => o.county));
  const schoolBoards = officials.filter((o) => o.level === "school-board");
  const schoolDistricts = new Set(
    schoolBoards.map((o) => o.jurisdiction)
  );

  const stats = [
    { label: "Officials Tracked", value: String(officials.length) },
    { label: "Issue Categories", value: String(issueCategories.length) },
    { label: "Counties Covered", value: String(counties.size) },
    { label: "School Districts", value: String(schoolDistricts.size) },
  ];

  const featuredOfficials = officials
    .filter((o) => o.level === "federal" || o.level === "state")
    .slice(0, 6);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-red-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <img
              src="/images/icon.png"
              alt="RepWatchr"
              className="h-20 w-20 mx-auto mb-6 rounded-full shadow-lg shadow-blue-500/20"
            />
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Know Your Reps.
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-red-400 bg-clip-text text-transparent">
                Hold Them Accountable.
              </span>
            </h1>
            <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Scorecards, voting records, campaign funding, and red flags for
              every elected official in Texas. Verified Texans can
              vote and comment publicly.
            </p>
            <div className="max-w-xl mx-auto mb-8">
              <SearchBar />
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/officials"
                className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
              >
                Browse All Officials
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-blue-500 hover:shadow-xl transition-all hover:-translate-y-0.5"
              >
                Sign Up to Vote
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
              Scored on East Texas Issues
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

      {/* CTA Cards */}
      <section className="bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Link
              href="/funding"
              className="group rounded-2xl bg-slate-800 p-8 transition-all hover:bg-slate-700 hover:-translate-y-1"
            >
              <h3 className="font-extrabold text-xl text-white mb-3">
                Who Funds Them?
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Follow the money. See who is funding your elected officials and
                where their campaign dollars come from.
              </p>
              <span className="text-blue-400 text-sm font-bold group-hover:translate-x-1 inline-block transition-transform">
                View Funding Data &rarr;
              </span>
            </Link>
            <Link
              href="/red-flags"
              className="group rounded-2xl bg-slate-800 p-8 transition-all hover:bg-slate-700 hover:-translate-y-1"
            >
              <h3 className="font-extrabold text-xl text-white mb-3">
                Red Flags
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Conflicts of interest, broken promises, and issues voters should
                know about but may have missed.
              </p>
              <span className="text-red-400 text-sm font-bold group-hover:translate-x-1 inline-block transition-transform">
                View Red Flags &rarr;
              </span>
            </Link>
            <Link
              href="/methodology"
              className="group rounded-2xl bg-slate-800 p-8 transition-all hover:bg-slate-700 hover:-translate-y-1"
            >
              <h3 className="font-extrabold text-xl text-white mb-3">
                How We Score
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Every score is traceable to specific votes. Transparent
                methodology focused on East Texas interests.
              </p>
              <span className="text-green-400 text-sm font-bold group-hover:translate-x-1 inline-block transition-transform">
                View Methodology &rarr;
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Your Voice Matters
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Sign up, verify your Texas identity, and start voting on officials.
            Share your opinions publicly. Real data from verified residents.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-blue-700 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              Create Free Account
            </Link>
            <Link
              href="/methodology"
              className="rounded-xl border-2 border-white/30 px-8 py-3.5 text-sm font-bold text-white hover:bg-white/10 transition-all"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
