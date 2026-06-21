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
import CampaignFinanceSourcePanel from "@/components/funding/CampaignFinanceSourcePanel";
import ShareButtons from "@/components/shared/ShareButtons";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";
import { breadcrumbJsonLd, datasetJsonLd, jsonLd } from "@/lib/structured-data";

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
  return buildRepWatchrMetadata({
    title: `Funding: ${official.name}`,
    description: `Campaign finance source path and reported funding data for ${official.name}, ${official.position}.`,
    path: `/funding/${official.id}`,
    imagePath: buildOgImageUrl("funding", { officialId: official.id }),
    imageAlt: `${official.name} RepWatchr funding preview`,
  });
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
    const breadcrumbStructuredData = breadcrumbJsonLd([
      { name: "RepWatchr", path: "/" },
      { name: "Funding", path: "/funding" },
      { name: official.name, path: `/funding/${official.id}` },
    ]);
    const datasetStructuredData = datasetJsonLd({
      name: `${official.name} campaign finance source path`,
      path: `/funding/${official.id}`,
      description: `Campaign finance source path for ${official.name}. Matched donor totals have not been loaded yet.`,
      keywords: ["campaign finance", official.name, official.position, official.jurisdiction],
    });

    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbStructuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(datasetStructuredData) }}
        />
        <Link href="/funding" className="text-sm font-semibold text-blue-600 hover:underline">
          Back to all funding
        </Link>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-black text-gray-950">{official.name}</h1>
              <p className="mt-1 text-sm font-semibold text-gray-600">
                {official.position} - {formatLevelName(official.level)}
              </p>
            </div>
            <Link
              href={`/officials/${official.id}`}
              className="w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-800 transition hover:bg-white"
            >
              View profile
            </Link>
          </div>
          <div className="mt-5">
            <ShareButtons
              title={`Funding source path: ${official.name}`}
              description={`Campaign finance source path for ${official.name}. RepWatchr still needs matched totals before showing donor charts.`}
              path={`/funding/${official.id}`}
              template="missing_source"
              subject={`${official.name} campaign finance source path`}
            />
          </div>
        </div>
        <CampaignFinanceSourcePanel official={official} />
      </div>
    );
  }
  const breadcrumbStructuredData = breadcrumbJsonLd([
    { name: "RepWatchr", path: "/" },
    { name: "Funding", path: "/funding" },
    { name: official.name, path: `/funding/${official.id}` },
  ]);
  const datasetStructuredData = datasetJsonLd({
    name: `${official.name} campaign funding data`,
    path: `/funding/${official.id}`,
    description: `Reported campaign finance totals, donors, geography, and source links for ${official.name}.`,
    keywords: ["campaign finance", "donors", official.name, funding.cycle, official.position],
    dateModified: funding.lastUpdated,
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
          <div className="mt-4">
            <ShareButtons
              title={`Funding trail: ${official.name}`}
              description={`Reported campaign finance totals, donors, geography, and source links for ${official.name}.`}
              path={`/funding/${official.id}`}
              template="funding_trail"
              subject={`${official.name} campaign funding`}
              sourceLabel={funding.sources[0]?.name || "campaign finance source links"}
            />
          </div>
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
