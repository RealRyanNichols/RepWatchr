import type { Metadata } from "next";
import Link from "next/link";
import { getAllOfficials, getFundingSummary } from "@/lib/data";
import { formatCurrency } from "@/lib/formatting";
import PartyBadge from "@/components/officials/PartyBadge";

export const metadata: Metadata = {
  title: "Campaign Funding",
  description:
    "Follow the money. See who funds Texas elected officials and where their campaign dollars come from.",
};

export default function FundingPage() {
  const officials = getAllOfficials();

  const fundedOfficials = officials
    .map((official) => {
      const funding = getFundingSummary(official.id);
      return funding ? { official, funding } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b!.funding.totalRaised - a!.funding.totalRaised);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Campaign Funding
        </h1>
        <p className="mt-2 text-gray-600">
          Follow the money. See who is funding your Texas elected officials
          and where their campaign dollars come from.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fundedOfficials.map((item) => {
          const { official, funding } = item!;
          const topSector = funding.industrySectors[0];
          const outOfStatePercent =
            funding.totalRaised > 0
              ? Math.round(
                  (funding.geographicBreakdown.outOfState /
                    funding.totalRaised) *
                    100
                )
              : 0;

          return (
            <Link
              key={official.id}
              href={`/funding/${official.id}`}
              className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {official.name}
                  </h3>
                  <p className="text-sm text-gray-500">{official.position}</p>
                  <div className="mt-1">
                    <PartyBadge party={official.party} />
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Total Raised</p>
                  <p className="text-lg font-bold text-green-700">
                    {formatCurrency(funding.totalRaised)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Cash on Hand</p>
                  <p className="text-lg font-bold text-gray-700">
                    {formatCurrency(funding.cashOnHand)}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {topSector && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Top Sector</span>
                    <span className="font-medium text-gray-700">
                      {topSector.sector}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Out-of-State</span>
                  <span
                    className={`font-medium ${outOfStatePercent > 50 ? "text-red-600" : "text-gray-700"}`}
                  >
                    {outOfStatePercent}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Top Donors</span>
                  <span className="font-medium text-gray-700">
                    {funding.topDonors.length} tracked
                  </span>
                </div>
              </div>

              <p className="mt-4 text-xs text-blue-600 font-medium">
                View full funding details →
              </p>
            </Link>
          );
        })}
      </div>

      {fundedOfficials.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500">
            Campaign funding data is being collected. Check back soon.
          </p>
        </div>
      )}
    </div>
  );
}
