import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "About RepWatchr, the Texas public-record map for officials, school boards, votes, sources, and citizen accountability.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-8 overflow-hidden rounded-2xl border border-blue-100 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_45%,#fff7ed_100%)] shadow-sm">
        <div className="h-1.5 w-full bg-[linear-gradient(90deg,#bf0d3e_0%,#bf0d3e_33%,#ffffff_33%,#ffffff_66%,#002868_66%,#002868_100%)]" />
        <div className="p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
            About RepWatchr
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-blue-950 sm:text-4xl">
            When public records are scattered, make the record clear.
          </h1>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-700">
            RepWatchr exists to help Texans find the people who hold public power, the records that support each profile, the scores and flags tied to public sources, and the citizen feedback attached to that record.
          </p>
        </div>
      </section>

      <div className="space-y-8 text-gray-700">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Our Mission</h2>
          <p className="leading-relaxed">
            The mission is simple: build a source-backed public record for
            Texas government. That means federal, state, county, city, school
            board, and public-board profiles where the officeholder, office,
            jurisdiction, term, votes, funding, praise, concerns, and open gaps
            can be checked against records normal citizens can inspect.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Why Texas?
          </h2>
          <p className="leading-relaxed">
            Texas has thousands of officials and trustees, but the records are
            split across agency sites, county pages, city pages, school
            districts, ethics filings, agendas, minutes, election pages, and
            meeting videos. RepWatchr started in East Texas because local
            government needs the same scrutiny people expect in Austin and
            Washington. The goal is statewide coverage, then a model that can
            be repeated outside Texas.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            What We Track Now
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 mb-1">
                Every Level of Government
              </h3>
              <p className="text-sm text-gray-600">
                US Congress, Texas state offices, county officials, city
                officials, school boards, and public boards where the roster is
                publicly documented.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 mb-1">
                Issue Scorecards
              </h3>
              <p className="text-sm text-gray-600">
                Weighted grades on public record categories, with visible
                reasons and source-backed contributions where a profile has
                enough record to score.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 mb-1">
                Campaign Funding
              </h3>
              <p className="text-sm text-gray-600">
                Donors, committees, filings, industry patterns, and whether
                funding appears tied to the office or district being reviewed.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 mb-1">Red Flags</h3>
              <p className="text-sm text-gray-600">
                Conflicts, disclosure problems, broken promises, meeting
                records, public-source concerns, and open gaps that need more
                evidence before anyone should treat them as established.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            School Board Transparency
          </h2>
          <p className="leading-relaxed">
            School board positions are elected positions, and the politics of
            the people making decisions about local schools should be visible
            to parents and taxpayers. RepWatchr tracks trustees, districts,
            roster sources, votes, agendas, public statements, praise, flags,
            and missing records. No minor children should be named. No private
            addresses should be published. Claims need public sources.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Faretta AI
          </h2>
          <p className="leading-relaxed">
            Faretta AI is the search bar and research assistant inside
            RepWatchr. It helps a citizen turn a plain-English question into a
            path: which official to open, which school district to check, which
            source link matters, what record is missing, and what question
            should be asked next. It does not replace source review. It points
            the work toward records that can be checked.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Source Rules
          </h2>
          <p className="leading-relaxed mb-3">
            Public pages should be record-backed. A strong profile needs:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Official roster, election, appointment, or agency source.</li>
            <li>Public contact page, agenda, minutes, filing, vote, or video.</li>
            <li>Clear labels for facts, public claims, inferences, and gaps.</li>
            <li>No private addresses, no minor children, and no unsourced allegations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            What Comes Next
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Finish the Texas school-board roster district by district.",
              "Expand county and city offices beyond the early East Texas base.",
              "Add public-source intake for new rosters, filings, agendas, and meeting videos.",
              "Use Faretta AI to guide searches, missing-record checks, and citizen questions.",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm font-semibold leading-6 text-blue-950">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            A Project by Ryan Nichols
          </h2>
          <p className="leading-relaxed">
            RepWatchr is built and maintained as a public service for Texas
            communities. It is not affiliated with any political party or
            campaign.
          </p>
          <p className="mt-3">
            <a
              href="https://www.RepWatchr.com"
              className="text-blue-600 hover:underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.RepWatchr.com
            </a>
          </p>
        </section>

        <div className="flex flex-wrap gap-4 pt-4">
          <Link
            href="/methodology"
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-semibold"
          >
            View Our Methodology
          </Link>
          <Link
            href="/officials"
            className="inline-flex items-center px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-semibold"
          >
            Browse Officials
          </Link>
        </div>
      </div>
    </div>
  );
}
