import type { Metadata } from "next";
import Link from "next/link";
import { getIssueCategories, getAllBills } from "@/lib/data";

export const metadata: Metadata = {
  title: "Texas Issues",
  description:
    "The issues we track: water rights, land rights, taxes, government transparency, and voting records.",
};

export default function IssuesPage() {
  const categories = getIssueCategories();
  const bills = getAllBills();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Texas Issues
        </h1>
        <p className="mt-2 text-gray-600 max-w-2xl">
          These are the issues we score officials on. Each one directly affects
          Texas residents and communities.
        </p>
      </div>

      <div className="space-y-6">
        {categories.map((cat) => {
          const relatedBills = bills.filter((b) =>
            b.categories.includes(cat.id)
          );
          return (
            <div
              key={cat.id}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-4 h-4 rounded-full mt-1 shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                      {cat.name}
                    </h2>
                    <span
                      className="text-sm font-medium"
                      style={{ color: cat.color }}
                    >
                      {cat.weight}% weight
                    </span>
                  </div>
                  <p className="mt-2 text-gray-600">{cat.description}</p>

                  {relatedBills.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        Tracked Bills ({relatedBills.length})
                      </h3>
                      <div className="space-y-2">
                        {relatedBills.map((bill) => (
                          <Link
                            key={bill.id}
                            href={`/votes/${bill.id}`}
                            className="block text-sm text-blue-600 hover:underline"
                          >
                            {bill.id}: {bill.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <Link
                      href={`/scorecards/${cat.id}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      View {cat.name} Scorecard →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
