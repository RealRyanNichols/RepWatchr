import type { Metadata } from "next";
import Link from "next/link";
import { getIssueCategories } from "@/lib/data";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How we calculate scores for Texas elected officials. Transparent, traceable, and focused on local issues.",
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
