import type { Metadata } from "next";
import Link from "next/link";
import { getIssueCategories } from "@/lib/data";
import {
  OWNER_LOCKED_ISSUE_POSITIONS,
  REPWATCHR_ALIGNMENT_FACTORS,
  REPWATCHR_SCORE_SCALE,
} from "@/lib/repwatchr-algorithm";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How RepWatchr calculates official scorecards from sourced records, weighted issues, local sentiment, and reviewed evidence.",
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
                  <strong>Local-first:</strong> Scores reflect the people,
                  district, county, state, and voting bloc represented by the
                  official, not a generic national partisan scorecard.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600 mt-0.5">3.</span>
                <span>
                  <strong>Issue-based:</strong> We score on the issues, not on
                  party. Any official who votes to protect the represented
                  voters&apos; interests gets credit regardless of party
                  affiliation.
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
                impact each issue category. Each bill is tagged with the
                locally aligned position -- the vote that best serves the
                represented voters&apos; interests based on the verified source
                record and owner-approved issue rules.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Step 2: Score Each Vote
              </h3>
              <p>
                Each vote is scored: <strong>Aligned</strong> (voted with the
                weighted issue position) = 100 points.{" "}
                <strong>Not Aligned</strong> = 0 points.{" "}
                <strong>Absent/Abstain</strong> = 50 points (neutral).
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
            GideonAI Internal Weighting Model
          </h2>
          <p className="text-gray-700 text-sm mb-4">
            RepWatchr separates the source record from the score. The source
            record must be factual first: bill text, official vote records,
            board minutes, video, public filings, or verified submissions.
            GideonAI can then help weigh those verified records through the
            internal model below.
          </p>
          <div className="not-prose grid gap-3">
            {REPWATCHR_ALIGNMENT_FACTORS.map((factor) => (
              <div key={factor.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold text-gray-900">{factor.label}</h3>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-800">
                    {factor.weight}% weight
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-700">{factor.description}</p>
                <p className="mt-2 text-xs font-semibold text-gray-500">
                  Source rule: {factor.sourceRule}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Owner-Locked Issue Positions
          </h2>
          <p className="text-gray-700 text-sm mb-4">
            Some moral issue positions are not guessed by code. If the issue
            needs Ryan&apos;s clarification, it stays marked that way until the
            position and severity weight are approved.
          </p>
          <div className="not-prose space-y-3">
            {OWNER_LOCKED_ISSUE_POSITIONS.map((issue) => (
              <div key={issue.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-gray-900">{issue.label}</h3>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-gray-700">
                    {issue.status === "confirmed" ? "Confirmed" : "Needs clarification"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-700">{issue.position}</p>
                <p className="mt-2 text-xs font-semibold text-gray-500">{issue.note}</p>
              </div>
            ))}
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
                {REPWATCHR_SCORE_SCALE.map((row) => (
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
