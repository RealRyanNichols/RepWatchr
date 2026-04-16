import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllBills,
  getBillById,
  getOfficialById,
  getIssueCategories,
} from "@/lib/data";
import { formatDate } from "@/lib/formatting";
import PartyBadge from "@/components/officials/PartyBadge";

export async function generateStaticParams() {
  const bills = getAllBills();
  return bills.map((b) => ({ billId: b.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ billId: string }>;
}): Promise<Metadata> {
  const { billId } = await params;
  const bill = getBillById(billId);
  if (!bill) return { title: "Bill Not Found" };
  return {
    title: bill.title,
    description: bill.summary,
  };
}

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ billId: string }>;
}) {
  const { billId } = await params;
  const bill = getBillById(billId);
  const categories = getIssueCategories();

  if (!bill) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Bill Not Found</h1>
        <Link href="/votes" className="mt-4 text-blue-600 hover:underline">
          Back to Votes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/votes" className="text-sm text-blue-600 hover:underline">
        ← All Tracked Votes
      </Link>

      <div className="mt-4 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">
            {bill.id}
          </span>
          <span className="text-sm text-gray-500">
            {bill.level === "federal" ? "Federal" : "State"} -{" "}
            {bill.chamber === "house" ? "House" : "Senate"}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{bill.title}</h1>
        <p className="mt-2 text-gray-600">{bill.summary}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
          <span>Voted: {formatDate(bill.dateVoted)}</span>
          <span>Session: {bill.session}</span>
          <span>Status: {bill.status}</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {bill.categories.map((catId) => {
            const cat = categories.find((c) => c.id === catId);
            return (
              <span
                key={catId}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cat?.color ?? "#6B7280" }}
                />
                {cat?.name ?? catId}
              </span>
            );
          })}
        </div>
      </div>

      {/* Texas Impact */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-8">
        <h2 className="font-semibold text-blue-900 mb-2">
          Why This Matters for Texas
        </h2>
        <p className="text-blue-800 text-sm">{bill.eastTexasImpact}</p>
        <p className="text-xs text-blue-600 mt-2">
          Pro-Texas position:{" "}
          <span className="font-medium uppercase">
            {bill.proEastTexasPosition}
          </span>
        </p>
      </div>

      {/* How Officials Voted */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        How Officials Voted
      </h2>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Official
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Position
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Vote
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Aligned?
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bill.votes.map((v) => {
              const official = getOfficialById(v.officialId);
              if (!official) return null;
              const aligned =
                v.vote === bill.proEastTexasPosition;
              const isAbsent = v.vote === "absent" || v.vote === "abstain";
              return (
                <tr key={v.officialId} className="hover:bg-gray-50">
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
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium uppercase ${
                        v.vote === "yea"
                          ? "bg-green-100 text-green-800"
                          : v.vote === "nay"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {v.vote}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {isAbsent ? (
                      <span className="text-gray-400 text-sm">N/A</span>
                    ) : aligned ? (
                      <span className="text-green-600 font-medium text-sm">
                        Aligned
                      </span>
                    ) : (
                      <span className="text-red-600 font-medium text-sm">
                        Not Aligned
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {bill.sourceUrl && (
        <p className="mt-4 text-sm text-gray-500">
          Source:{" "}
          <a
            href={bill.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View official record
          </a>
        </p>
      )}
    </div>
  );
}
