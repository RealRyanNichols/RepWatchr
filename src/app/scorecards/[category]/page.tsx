import type { Metadata } from "next";
import Link from "next/link";
import { getAllOfficials, getAllScoreCards, getIssueCategories } from "@/lib/data";
import LetterGradeBadge from "@/components/scores/LetterGradeBadge";
import PartyBadge from "@/components/officials/PartyBadge";
import { calculateLetterGrade } from "@/lib/scoring";

const categoryKeyMap: Record<string, string> = {
  "water-rights": "waterRights",
  "land-and-property-rights": "landAndPropertyRights",
  taxes: "taxes",
  "government-transparency": "governmentTransparency",
  "voting-record": "votingRecord",
};

export async function generateStaticParams() {
  return Object.keys(categoryKeyMap).map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const categories = getIssueCategories();
  const cat = categories.find((c) => c.id === category);
  return {
    title: cat ? `${cat.name} Scorecard` : "Category Scorecard",
    description: cat?.description,
  };
}

export default async function CategoryScorecardPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const officials = getAllOfficials();
  const scoreCards = getAllScoreCards();
  const issueCategories = getIssueCategories();
  const issueCat = issueCategories.find((c) => c.id === category);
  const catKey = categoryKeyMap[category];

  if (!issueCat || !catKey) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Category Not Found</h1>
        <Link href="/scorecards" className="mt-4 text-blue-600 hover:underline">
          Back to Scorecards
        </Link>
      </div>
    );
  }

  const ranked = officials
    .map((official) => {
      const sc = scoreCards.find((s) => s.officialId === official.id);
      if (!sc) return null;
      const catScore =
        sc.categories[catKey as keyof typeof sc.categories];
      if (!catScore) return null;
      return { official, catScore, scoreCard: sc };
    })
    .filter(Boolean)
    .sort((a, b) => b!.catScore.score - a!.catScore.score);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link
          href="/scorecards"
          className="text-sm text-blue-600 hover:underline"
        >
          &larr; All Scorecards
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <span
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: issueCat.color }}
          />
          <h1 className="text-3xl font-bold text-gray-900">
            {issueCat.name} Scorecard
          </h1>
        </div>
        <p className="mt-2 text-gray-600 max-w-2xl">{issueCat.description}</p>
        <p className="mt-1 text-sm text-gray-500">
          Weight: {issueCat.weight}% of source-backed official vote-record score. Universal verified profile votes live on
          the main scorecards page and public profile pages.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Official
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Position
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                {issueCat.name} Grade
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Score
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Votes Tracked
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {ranked.map((item, index) => {
              const { official, catScore } = item!;
              return (
                <tr key={official.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm text-gray-500">
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
                  </td>
                  <td className="px-4 py-4 text-center">
                    <LetterGradeBadge grade={calculateLetterGrade(catScore.score)} score={catScore.score} />
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-gray-700">
                    {catScore.score}/100
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-gray-500">
                    {catScore.votes.length}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
