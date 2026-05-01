import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllOfficials,
  getOfficialById,
  getFundingSummary,
} from "@/lib/data";
import { formatCurrency, formatLevelName } from "@/lib/formatting";
import PartyBadge from "@/components/officials/PartyBadge";
import FundingOverview from "@/components/funding/FundingOverview";
import TopDonorsList from "@/components/funding/TopDonorsList";
import DonorBreakdownChart from "@/components/funding/DonorBreakdownChart";
import GeographicBreakdown from "@/components/funding/GeographicBreakdown";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  const officials = getAllOfficials();
  return officials
    .filter((official) => Boolean(getFundingSummary(official.id)))
    .map((o) => ({ officialId: o.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ officialId: string }>;
}): Promise<Metadata> {
  const { officialId } = await params;
  const official = getOfficialById(officialId);
  if (!official) return { title: "Not Found" };
  return {
    title: `Funding: ${official.name}`,
    description: `Campaign finance data for ${official.name}, ${official.position}.`,
  };
}

export default async function OfficialFundingPage({
  params,
}: {
  params: Promise<{ officialId: string }>;
}) {
  const { officialId } = await params;
  const official = getOfficialById(officialId);
  const funding = getFundingSummary(officialId);

  if (!official) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Official Not Found</h1>
        <Link href="/funding" className="mt-4 text-blue-600 hover:underline">
          Back to Funding
        </Link>
      </div>
    );
  }

  if (!funding) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">{official.name}</h1>
        <p className="mt-2 text-gray-600">
          Campaign funding data is not yet available for this official.
        </p>
        <Link
          href={`/officials/${official.id}`}
          className="mt-4 text-blue-600 hover:underline"
        >
          View Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/funding" className="text-sm text-blue-600 hover:underline">
        ← All Funding
      </Link>

      <div className="mt-4 mb-8 flex items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">
              {official.name}
            </h1>
            <PartyBadge party={official.party} />
          </div>
          <p className="text-gray-600">
            {official.position} - {formatLevelName(official.level)}
          </p>
          <p className="text-sm text-gray-500">
            Cycle: {funding.cycle} | Last updated: {funding.lastUpdated}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <FundingOverview funding={funding} />

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Top Donors
            </h2>
            <TopDonorsList donors={funding.topDonors} />
          </section>

          {/* Industry Sectors */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Funding by Industry
            </h2>
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="space-y-3">
                {funding.industrySectors.map((sector) => (
                  <div key={sector.sector}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{sector.sector}</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(sector.amount)} ({sector.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${sector.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <DonorBreakdownChart breakdown={funding.donorBreakdown} />
          <GeographicBreakdown breakdown={funding.geographicBreakdown} />

          {/* Data Sources */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-2">
              Data Sources
            </h3>
            {funding.sources.map((src, i) => (
              <p key={i} className="text-xs text-gray-600 mb-1">
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {src.name}
                </a>
                <span className="text-gray-400">
                  {" "}
                  (retrieved {src.retrievedDate})
                </span>
              </p>
            ))}
          </div>

          <Link
            href={`/officials/${official.id}`}
            className="block text-center py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            View Full Profile →
          </Link>
        </div>
      </div>
    </div>
  );
}
