import type { Metadata } from "next";
import Link from "next/link";
import { getIssueCategories, getAllOfficials, getScoreCard } from "@/lib/data";
import LetterGradeBadge from "@/components/scores/LetterGradeBadge";

const issueDetails: Record<string, { fullDescription: string; whyItMatters: string[]; keyQuestions: string[] }> = {
  "water-rights": {
    fullDescription: "Water is life in Texas, and who controls it matters. From the Sabine River to the Carrizo-Wilcox Aquifer, Texas water resources are under constant pressure from growing cities, industry, and drought. How your representatives vote on water policy directly affects your well, your property, and your family's future.",
    whyItMatters: [
      "Rural well owners face increasing regulations from groundwater conservation districts",
      "Cities like Dallas and Houston are eyeing Texas water supplies for future growth",
      "Lake and reservoir management affects property values, recreation, and agriculture",
      "Water quality violations in small community systems put families at risk",
      "The Sabine River Authority controls billions of gallons -- who watches them?",
    ],
    keyQuestions: [
      "Does your representative protect rural landowners' groundwater rights?",
      "Have they voted to fund water infrastructure for small communities?",
      "Do they support interbasin water transfers that could drain Texas resources?",
      "Are they transparent about their connections to water district boards?",
    ],
  },
  "land-and-property-rights": {
    fullDescription: "Your land is your legacy. But eminent domain abuse, skyrocketing property appraisals, and pipeline companies threaten Texas landowners every legislative session. Property rights are supposed to be sacred in Texas -- we track whether your representatives actually protect them.",
    whyItMatters: [
      "Pipeline companies can take your land through eminent domain -- often at below-market prices",
      "Property appraisals keep rising, driving up tax bills even when you haven't sold",
      "Mineral rights disputes leave landowners fighting against well-funded corporations",
      "Zoning and land use regulations can strip property value without compensation",
      "Solar and wind energy companies are leasing vast tracts -- are landowners getting fair deals?",
    ],
    keyQuestions: [
      "Has your representative voted to strengthen eminent domain protections?",
      "Do they support appraisal caps that actually help homeowners?",
      "Have they taken money from pipeline or energy companies that use eminent domain?",
      "Do they support the landowner or the corporation when rights conflict?",
    ],
  },
  "taxes": {
    fullDescription: "Texas has no state income tax, but that doesn't mean you aren't taxed heavily. Property taxes in Texas are among the highest in the nation, and they hit homeowners, farmers, and small businesses hardest. Every session, legislators promise relief. We track whether they deliver.",
    whyItMatters: [
      "Texas property taxes are the 6th highest in the nation despite no income tax",
      "School district taxes make up the largest portion of your property tax bill",
      "Small businesses pay disproportionately high property taxes compared to large corporations",
      "Sales tax increases hit low and middle-income families hardest",
      "Unfunded mandates from Austin push costs to local governments -- and your tax bill",
    ],
    keyQuestions: [
      "Has your representative actually voted to lower property tax rates?",
      "Do they support raising the homestead exemption?",
      "Have they voted for corporate tax breaks while your bill went up?",
      "Do they support school funding reform that reduces reliance on property taxes?",
    ],
  },
  "government-transparency": {
    fullDescription: "If they won't let you see what they're doing, they're probably doing something they don't want you to see. Open meetings, public records, campaign finance disclosure -- these are the tools citizens have to hold power accountable. We track how your officials score on transparency.",
    whyItMatters: [
      "Many local governments hold closed-door meetings that should be public",
      "Public records requests are delayed, denied, or priced out of reach",
      "Campaign finance reports reveal who is really pulling the strings",
      "School boards make decisions about your children behind closed doors",
      "Ethics complaints against officials are often buried or dismissed without investigation",
    ],
    keyQuestions: [
      "Does your representative support strengthening the Texas Public Information Act?",
      "Have they voted to keep their own records and communications private?",
      "Do they disclose meetings with lobbyists and special interests?",
      "Have they responded to constituent requests for information?",
    ],
  },
  "voting-record": {
    fullDescription: "Campaign promises are just words. Votes are actions. We track every key vote your representatives cast and compare it to what they promised when they asked for your vote. When they break a promise, you'll know about it here.",
    whyItMatters: [
      "Politicians say one thing on the campaign trail and vote differently in Austin or DC",
      "Party leadership often pressures representatives to vote against their district's interests",
      "Missed votes are votes against your interests -- they count",
      "Committee assignments and procedural votes shape legislation before it ever reaches the floor",
      "Voting patterns reveal who a representative actually serves -- their district or their donors",
    ],
    keyQuestions: [
      "Does your representative vote the way they campaigned?",
      "How often do they miss important votes?",
      "Do they vote with party leadership or with their constituents?",
      "Are their votes consistent, or do they flip based on who's watching?",
    ],
  },
};

export async function generateStaticParams() {
  const categories = getIssueCategories();
  return categories.map((c) => ({ id: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const categories = getIssueCategories();
  const category = categories.find((c) => c.id === id);
  if (!category) return { title: "Issue Not Found" };
  return {
    title: `${category.name} - Texas Issues`,
    description: `How Texas elected officials score on ${category.name.toLowerCase()}. Scorecards, voting records, and accountability.`,
  };
}

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const categories = getIssueCategories();
  const category = categories.find((c) => c.id === id);

  if (!category) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Issue Not Found</h1>
        <Link href="/issues" className="mt-4 text-blue-600 hover:underline">
          Back to Issues
        </Link>
      </div>
    );
  }

  const details = issueDetails[id];
  const categoryKey = id === "water-rights" ? "waterRights"
    : id === "land-and-property-rights" ? "landAndPropertyRights"
    : id === "government-transparency" ? "governmentTransparency"
    : id === "voting-record" ? "votingRecord"
    : id;

  // Get officials with scores for this category
  const officials = getAllOfficials().filter(
    (o) => o.level === "federal" || o.level === "state"
  );
  const scoredOfficials = officials
    .map((o) => {
      const sc = getScoreCard(o.id);
      if (!sc) return null;
      const catScore = (sc.categories as Record<string, { score: number; letterGrade: string }>)[categoryKey];
      if (!catScore) return null;
      return { official: o, score: catScore.score, grade: catScore.letterGrade };
    })
    .filter(Boolean)
    .sort((a, b) => b!.score - a!.score);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/issues"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        &larr; All Issues
      </Link>

      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-1.5 rounded-full"
          style={{ backgroundColor: category.color }}
        />
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
          {category.name}
        </h1>
      </div>

      <p className="text-lg text-gray-600 leading-relaxed mb-8">
        {category.description}
      </p>

      {details && (
        <>
          <div className="rounded-2xl bg-white border border-gray-200 p-6 sm:p-8 mb-8">
            <p className="text-gray-700 leading-relaxed text-base">
              {details.fullDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="rounded-2xl bg-red-50 border border-red-100 p-6">
              <h2 className="text-lg font-bold text-red-900 mb-4">
                Why It Matters
              </h2>
              <ul className="space-y-3">
                {details.whyItMatters.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-red-800">
                    <span className="text-red-500 shrink-0 mt-0.5">&#9679;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-6">
              <h2 className="text-lg font-bold text-blue-900 mb-4">
                Questions to Ask Your Rep
              </h2>
              <ul className="space-y-3">
                {details.keyQuestions.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-blue-800">
                    <span className="text-blue-500 shrink-0 mt-0.5">?</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      {/* Officials ranked on this issue */}
      {scoredOfficials.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            How Your Reps Score on {category.name}
          </h2>
          <div className="space-y-2">
            {scoredOfficials.map((item) => (
              <Link
                key={item!.official.id}
                href={`/officials/${item!.official.id}`}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <div>
                  <p className="font-bold text-gray-900">
                    {item!.official.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {item!.official.position} - {item!.official.district ?? item!.official.jurisdiction}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-600">
                    {item!.score}/100
                  </span>
                  <LetterGradeBadge grade={item!.grade} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 text-center">
        <Link
          href={`/scorecards/${id}`}
          className="inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
        >
          View Full Scorecard for {category.name} &rarr;
        </Link>
      </div>
    </div>
  );
}
