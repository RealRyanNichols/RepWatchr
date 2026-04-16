import type { Metadata } from "next";
import Link from "next/link";
import { getAllOfficials, getAllScoreCards, getIssueCategories } from "@/lib/data";
import LetterGradeBadge from "@/components/scores/LetterGradeBadge";
import PartyBadge from "@/components/officials/PartyBadge";

export const metadata: Metadata = {
  title: "Scorecards",
  description:
    "How Texas officials score on water rights, land rights, taxes, and government transparency.",
};

export default function ScorecardsPage() {
  const officials = getAllOfficials();
  const scoreCards = getAllScoreCards();
  const issueCategories = getIssueCategories();

  const scoredOfficials = officials
    .map((official) => {
      const sc = scoreCards.find((s) => s.officialId === official.id);
      return sc ? { official, scoreCard: sc } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b!.scoreCard.overall - a!.scoreCard.overall);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Scorecards</h1>
        <p className="mt-2 text-gray-600">
          Officials ranked by their overall score on Texas issues. Every
          score is traceable to specific votes.
        </p>
      </div>

      {/* Category Quick Links */}
      <div className="flex flex-wrap gap-3 mb-8">
        {issueCategories.map((cat) => (
          <Link
            key={cat.id}
            href={`/scorecards/${cat.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: cat.color }}
            />
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Rankings Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Official
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overall
                </th>
                {issueCategories.map((cat) => (
                  <th
                    key={cat.id}
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell"
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-1"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name.split(" ")[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scoredOfficials.map((item, index) => {
                const { official, scoreCard } = item!;
                const categoryKeys = Object.keys(scoreCard.categories) as Array<
                  keyof typeof scoreCard.categories
                >;
                return (
                  <tr key={official.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm font-medium text-gray-500">
                      #{index + 1}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/officials/${official.id}`}
                        className="text-sm font-semibold text-blue-600 hover:underline"
                      >
                        {official.name}
                      </Link>
                      <div className="mt-0.5">
                        <PartyBadge party={official.party} />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {official.position}
                      {official.district && (
                        <span className="text-gray-400">
                          {" "}
                          ({official.district})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <LetterGradeBadge grade={scoreCard.letterGrade} />
                      <div className="text-xs text-gray-500 mt-1">
                        {scoreCard.overall}
                      </div>
                    </td>
                    {categoryKeys.map((key) => (
                      <td
                        key={key}
                        className="px-4 py-4 text-center hidden lg:table-cell"
                      >
                        <LetterGradeBadge
                          grade={scoreCard.categories[key].letterGrade}
                          size="sm"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/methodology"
          className="text-sm text-gray-500 hover:text-blue-600"
        >
          How are these scores calculated? View our methodology →
        </Link>
      </div>
    </div>
  );
}
