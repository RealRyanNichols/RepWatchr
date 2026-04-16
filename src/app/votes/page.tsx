import type { Metadata } from "next";
import Link from "next/link";
import { getAllBills, getIssueCategories } from "@/lib/data";
import { formatShortDate } from "@/lib/formatting";

export const metadata: Metadata = {
  title: "Tracked Votes",
  description:
    "Bills and votes tracked for Texas official scorecards.",
};

export default function VotesPage() {
  const bills = getAllBills().sort(
    (a, b) => new Date(b.dateVoted).getTime() - new Date(a.dateVoted).getTime()
  );
  const categories = getIssueCategories();

  const getCategoryColor = (catId: string) =>
    categories.find((c) => c.id === catId)?.color ?? "#6B7280";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tracked Votes</h1>
        <p className="mt-2 text-gray-600">
          Bills and votes that factor into Texas official scorecards.
        </p>
      </div>

      <div className="space-y-4">
        {bills.map((bill) => (
          <Link
            key={bill.id}
            href={`/votes/${bill.id}`}
            className="block bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                    {bill.id}
                  </span>
                  <span className="text-xs text-gray-400">
                    {bill.level === "federal" ? "Federal" : "State"} -{" "}
                    {bill.chamber === "house" ? "House" : "Senate"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatShortDate(bill.dateVoted)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900">{bill.title}</h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {bill.summary}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {bill.categories.map((catId) => (
                    <span
                      key={catId}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getCategoryColor(catId) }}
                      />
                      {categories.find((c) => c.id === catId)?.name ?? catId}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-gray-500">
                  {bill.votes.length} votes
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
