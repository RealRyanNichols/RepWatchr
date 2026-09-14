import type { Metadata } from "next";
import Link from "next/link";
import { getAllOfficials, getAllScoreCards, getIssueCategories } from "@/lib/data";
import LetterGradeBadge from "@/components/scores/LetterGradeBadge";
import PartyBadge from "@/components/officials/PartyBadge";
import VectorArt from "@/components/shared/VectorArt";
import { ISSUE_ART_VIEWBOX, issueArtInnerSvg } from "@/lib/issue-art";
import { calculateLetterGrade } from "@/lib/scoring";
import { CATEGORY_KEY_BY_ISSUE_ID, categoryKeyForIssueId } from "@/lib/vote-record-score";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";
import { breadcrumbJsonLd, datasetJsonLd, jsonLd } from "@/lib/structured-data";

export async function generateStaticParams() {
  return Object.keys(CATEGORY_KEY_BY_ISSUE_ID).map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const categories = getIssueCategories();
  const cat = categories.find((c) => c.id === category);
  return buildRepWatchrMetadata({
    title: cat ? `${cat.name} Scorecard` : "Category Scorecard",
    description: cat?.description ?? "RepWatchr source-backed scorecard category.",
    path: `/scorecards/${category}`,
    imagePath: buildOgImageUrl("methodology", { view: "scorecard", id: category }),
    imageAlt: `${cat?.name ?? "Category"} RepWatchr scorecard preview`,
  });
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
  const catKey = categoryKeyForIssueId(category);

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
  const breadcrumbStructuredData = breadcrumbJsonLd([
    { name: "RepWatchr", path: "/" },
    { name: "Scorecards", path: "/scorecards" },
    { name: issueCat.name, path: `/scorecards/${issueCat.id}` },
  ]);
  const datasetStructuredData = datasetJsonLd({
    name: `${issueCat.name} scorecard`,
    path: `/scorecards/${issueCat.id}`,
    description: issueCat.description,
    keywords: ["scorecard", issueCat.name, "official voting record", "RepWatchr"],
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(datasetStructuredData) }}
      />
      <div className="mb-8">
        <Link
          href="/scorecards"
          className="text-sm text-blue-600 hover:underline"
        >
          &larr; All Scorecards
        </Link>
        <div className="relative mt-3 overflow-hidden rounded-3xl bg-slate-950">
          <VectorArt
            inner={issueArtInnerSvg(issueCat.id, issueCat.color)}
            viewBox={ISSUE_ART_VIEWBOX}
            className="h-48 w-full sm:h-64"
            label={`${issueCat.name} illustration`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
            <span
              className="inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide text-slate-950"
              style={{ backgroundColor: issueCat.color }}
            >
              {issueCat.weight}% of the vote-record score
            </span>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.03em] text-white sm:text-4xl">
              {issueCat.name} Scorecard
            </h1>
          </div>
        </div>
        <p className="mt-4 text-gray-600 max-w-2xl">{issueCat.description}</p>
        <p className="mt-2 text-sm text-gray-500 max-w-2xl">
          Each score below is the weight of an official&apos;s aligned votes divided by the weight of the votes they
          actually cast in this category.{" "}
          <Link href="/methodology/scorecards" className="font-semibold text-blue-600 hover:underline">
            See the full calculation
          </Link>
          . Community responses are a separate signal and live on the main scorecards page and public profile pages.
        </p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          <Link href={`/issues/${issueCat.id}`} className="text-sm font-semibold text-blue-600 hover:underline">
            Why {issueCat.name.toLowerCase()} matters here &rarr;
          </Link>
          <Link href="/issues" className="text-sm font-semibold text-blue-600 hover:underline">
            All five issues &rarr;
          </Link>
        </div>
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
            {ranked.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12">
                  <div className="mx-auto max-w-2xl text-center">
                    <p className="text-base font-semibold text-gray-900">
                      No source-backed {issueCat.name.toLowerCase()} scorecards are loaded yet
                    </p>
                    <p className="mt-2 text-sm text-gray-600">
                      RepWatchr only shows a vote-record scorecard after every vote on it is matched to a reviewed bill
                      file that carries a public source link. An official missing from this table has not cleared that
                      review yet. Do not read that as a clean record.
                    </p>
                    <Link
                      href="/submit-source"
                      className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:underline"
                    >
                      Submit a source to help fill this in &rarr;
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              ranked.map((item, index) => {
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
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
