import type { Metadata } from "next";
import Link from "next/link";
import { getIssueCategories } from "@/lib/data";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";

export const metadata: Metadata = {
  ...buildRepWatchrMetadata({
    title: "Methodology | RepWatchr",
    description:
      "How RepWatchr separates facts, public records, scored votes, source gaps, and review status before a claim becomes shareable.",
    path: "/methodology",
    imagePath: buildOgImageUrl("methodology"),
    imageAlt: "RepWatchr methodology social preview",
  }),
};

export default function MethodologyPage() {
  const categories = getIssueCategories();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        How We Score Officials
      </h1>

      <div className="prose prose-gray max-w-none">
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Our Principles
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 not-prose">
            <ul className="space-y-3 text-sm text-blue-900">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600 mt-0.5">1.</span>
                <span>
                  <strong>Transparent:</strong> Every score is traceable to
                  specific votes. No black boxes. You can see exactly which
                  votes contributed to every grade.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600 mt-0.5">2.</span>
                <span>
                  <strong>Texas-focused:</strong> Scores reflect what
                  matters to Texas residents specifically, not national
                  partisan scorecards.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600 mt-0.5">3.</span>
                <span>
                  <strong>Issue-based:</strong> We score on the issues, not on
                  party. Any official who votes to protect Texas interests
                  gets credit regardless of party affiliation.
                </span>
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Issue Categories
          </h2>
          <p className="text-gray-600 mb-4">
            Officials are scored across five issue categories, each weighted
            equally at 20% of the overall score:
          </p>
          <div className="not-prose grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                </div>
                <p className="text-sm text-gray-600">{cat.description}</p>
                <p
                  className="text-xs font-medium mt-2"
                  style={{ color: cat.color }}
                >
                  {cat.weight}% of overall score
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            How Scores Are Calculated
          </h2>
          <div className="space-y-4 text-gray-700 text-sm">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Step 1: Identify Relevant Bills
              </h3>
              <p>
                We identify bills at the federal and state level that directly
                impact Texas on each issue category. Each bill is tagged
                with the &quot;pro-Texas&quot; position -- the vote that
                best serves Texas residents&apos; interests.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Step 2: Score Each Vote
              </h3>
              <p>
                Each vote is scored: <strong>Aligned</strong> (voted in East
                Texas interest) = 100 points. <strong>Not Aligned</strong> =
                0 points. <strong>Absent/Abstain</strong> = 50 points (neutral).
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Step 3: Category Score
              </h3>
              <p>
                The category score is the weighted average of all scored votes
                in that category. Major legislation is weighted more heavily
                than procedural votes.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Step 4: Overall Score
              </h3>
              <p>
                The overall score is the weighted average of all category
                scores. Each category contributes its designated weight
                (currently 20% each).
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Left / Right Ideology Chart
          </h2>
          <div className="space-y-4 text-gray-700 text-sm">
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Federal Officials: Official Roll Calls First
              </h3>
              <p>
                For U.S. House and U.S. Senate profiles, RepWatchr loads
                source snapshots from the official House Clerk and Senate
                roll-call feeds. Those rows are evidence records first. They do
                not automatically move the left/right meter until a reviewed
                issue rule maps that vote to a direction.
              </p>
              <p className="mt-2">
                Sources:{" "}
                <a
                  href="https://clerk.house.gov/evs/2026/index.asp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-700 hover:underline"
                >
                  House Clerk roll calls
                </a>{" "}
                and{" "}
                <a
                  href="https://www.senate.gov/legislative/LIS/roll_call_lists/vote_menu_119_2.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-700 hover:underline"
                >
                  Senate roll-call XML
                </a>
                .
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Texas State and Local Officials
              </h3>
              <p>
                State representatives, senators, school board members, county
                officials, and city officials do not receive an automatic
                left/right score until RepWatchr has enough source-backed
                votes, minutes, agendas, or public records to avoid guessing.
                Texas Legislature Online roll calls and local meeting minutes
                are the next source lanes.
              </p>
            </div>
          </div>
        </section>

        <section id="record-lenses" className="mb-8 scroll-mt-24">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Record Lenses and Editorial Neutrality
          </h2>
          <div className="space-y-4 text-gray-700 text-sm">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                What It Measures
              </h3>
              <p>
                RepWatchr publishes the underlying roll call, bill text,
                campaign statement, source date, and review status. The public
                site does not assign every official a universal moral,
                constitutional, left/right, or partisan grade.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                What Moves the Meter
              </h3>
              <p>
                Descriptive comparisons may group votes by a plainly named
                issue, but the same source hierarchy, question set, response
                window, and completeness standard apply to every candidate.
                Opinion lenses, if introduced later, must be optional, fully
                disclosed, and never presented as neutral fact.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Source Path
              </h3>
              <p>
                Federal roll calls link to the House Clerk, Senate roll-call
                tables, and Congress.gov where available. Texas state records
                use Texas Legislature Online. Local records require meeting
                minutes, agendas, video, or a public-record response before a
                factual claim is marked confirmed.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 not-prose">
                {[
                  ["House Clerk Votes", "https://clerk.house.gov/Votes"],
                  ["Senate Votes", "https://www.senate.gov/legislative/HowTo/how_to_votes.htm"],
                  ["Congress.gov API", "https://api.congress.gov/"],
                  ["Texas Vote Info", "https://capitol.texas.gov/help/findvoteinfo.aspx"],
                  ["U.S. Constitution", "https://www.archives.gov/founding-docs/constitution-transcript"],
                  ["Bill of Rights", "https://www.archives.gov/founding-docs/bill-of-rights/what-does-it-say"],
                ].map(([label, href]) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-blue-700 hover:bg-blue-50"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Letter Grade Scale
          </h2>
          <div className="not-prose overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Grade
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Score Range
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Meaning
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { grade: "A+ / A / A-", range: "90 - 100", meaning: "Excellent - Strongly aligned with Texas interests" },
                  { grade: "B+ / B / B-", range: "80 - 89", meaning: "Good - Generally supportive of Texas interests" },
                  { grade: "C+ / C / C-", range: "70 - 79", meaning: "Average - Mixed record on Texas issues" },
                  { grade: "D+ / D / D-", range: "60 - 69", meaning: "Below Average - Often votes against Texas interests" },
                  { grade: "F", range: "0 - 59", meaning: "Poor - Consistently votes against Texas interests" },
                ].map((row) => (
                  <tr key={row.grade}>
                    <td className="px-4 py-2 font-medium">{row.grade}</td>
                    <td className="px-4 py-2 text-gray-600">{row.range}</td>
                    <td className="px-4 py-2 text-gray-600">{row.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Officials Without Voting Records
          </h2>
          <p className="text-gray-700 text-sm">
            County judges, commissioners, mayors, city council members, and
            school board members often do not have easily accessible roll-call
            voting records. For these officials, we display
            &quot;Insufficient Data&quot; rather than a misleading score. As
            we gather more data from commissioner court votes, city council
            meetings, and school board minutes, scores will be added.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Campaign Finance Data
          </h2>
          <p className="text-gray-700 text-sm mb-3">
            Campaign funding data is sourced from:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>
              <strong>Federal officials:</strong> Federal Election Commission
              (FEC) via OpenFEC API
            </li>
            <li>
              <strong>State officials:</strong> Texas Ethics Commission (TEC)
              electronic filing data
            </li>
            <li>
              <strong>Local officials:</strong> TEC local filer database
              (where available)
            </li>
          </ul>
        </section>

        <div className="bg-gray-100 rounded-lg p-6 text-center">
          <p className="text-gray-600 text-sm mb-3">
            Have questions about our methodology or see an error?
          </p>
          <Link
            href="/about"
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            Contact us →
          </Link>
        </div>
      </div>
    </div>
  );
}
