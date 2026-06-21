import type { Metadata } from "next";
import Link from "next/link";
import { getAllOfficials, getFundingSummary } from "@/lib/data";
import { formatCurrency } from "@/lib/formatting";
import PartyBadge from "@/components/officials/PartyBadge";
import ShareButtons from "@/components/shared/ShareButtons";
import {
  getCampaignFinanceSourcePath,
  hasCampaignFinanceSourcePath,
} from "@/lib/campaign-finance-sources";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";

export const metadata: Metadata = {
  ...buildRepWatchrMetadata({
    title: "Campaign Funding | RepWatchr",
    description:
      "Follow reported campaign money, donor categories, geography, source paths, and missing finance records.",
    path: "/funding",
    imagePath: buildOgImageUrl("funding"),
    imageAlt: "RepWatchr campaign funding social preview",
  }),
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
  const fundedIds = new Set(fundedOfficials.map((item) => item!.official.id));
  const sourcePathOfficials = officials
    .filter((official) => !fundedIds.has(official.id))
    .filter((official) => official.level === "federal" || official.state === "TX")
    .filter(hasCampaignFinanceSourcePath)
    .slice(0, 24);

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
        <div className="mt-4">
          <ShareButtons
            title="RepWatchr Campaign Funding"
            description="Follow reported campaign money, donor categories, geography, source paths, and missing finance records."
            path="/funding"
            template="funding_trail"
            subject="RepWatchr campaign funding records"
          />
        </div>
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
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-xs font-black uppercase tracking-wide text-amber-800">
            Source review mode
          </p>
          <h2 className="mt-1 text-xl font-black text-gray-950">
            No matched funding summaries are loaded yet
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-amber-950">
            RepWatchr does not treat missing finance JSON as zero dollars or a clean record. The profiles below link the
            public filing paths that need candidate, committee, cycle, donor, spend, and cash-on-hand review.
          </p>
        </div>
      )}

      {sourcePathOfficials.length > 0 && (
        <section className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-wide text-blue-700">
              Money trail source paths
            </p>
            <h2 className="mt-1 text-2xl font-black text-gray-950">
              Funding profiles ready for filing review
            </h2>
            <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-gray-600">
              These officials have a source path loaded, but RepWatchr still needs matched filing totals before showing
              donor charts or cash-on-hand figures.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sourcePathOfficials.map((official) => {
              const sourcePath = getCampaignFinanceSourcePath(official);

              return (
                <Link
                  key={official.id}
                  href={`/funding/${official.id}`}
                  className="block rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{official.name}</h3>
                      <p className="text-sm text-gray-500">{official.position}</p>
                      <div className="mt-1">
                        <PartyBadge party={official.party} />
                      </div>
                    </div>
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-black uppercase tracking-wide text-amber-800">
                      review
                    </span>
                  </div>
                  <p className="mt-4 text-sm font-semibold leading-6 text-gray-600">
                    {sourcePath.label}
                  </p>
                  <p className="mt-3 text-xs font-black text-blue-700">
                    Open finance source path
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
