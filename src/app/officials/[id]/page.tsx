import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllOfficials,
  getOfficialWithScores,
  getScoreCard,
  getFundingSummary,
  getRedFlags,
  getIssueCategories,
} from "@/lib/data";
import { formatLevelName, getPartyColor } from "@/lib/formatting";
import ScoreGauge from "@/components/scores/ScoreGauge";
import CategoryBreakdown from "@/components/scores/CategoryBreakdown";
import FundingOverview from "@/components/funding/FundingOverview";
import TopDonorsList from "@/components/funding/TopDonorsList";
import DonorBreakdownChart from "@/components/funding/DonorBreakdownChart";
import GeographicBreakdown from "@/components/funding/GeographicBreakdown";
import VoteTimeline from "@/components/votes/VoteTimeline";
import RedFlagCard from "@/components/shared/RedFlagCard";
import PartyBadge from "@/components/officials/PartyBadge";
import OfficialVotingSection from "@/components/voting/OfficialVotingSection";
import CommentSection from "@/components/comments/CommentSection";
import ShareButtons from "@/components/shared/ShareButtons";

export async function generateStaticParams() {
  const officials = getAllOfficials();
  return officials.map((o) => ({ id: o.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const official = getOfficialWithScores(id);
  if (!official) return { title: "Official Not Found" };
  return {
    title: `${official.name} - ${official.position}`,
    description: `Scorecard, voting record, and campaign finance data for ${official.name}, ${official.position} serving ${official.jurisdiction}.`,
  };
}

export default async function OfficialProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const official = getOfficialWithScores(id);

  if (!official) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Official Not Found</h1>
        <p className="mt-2 text-gray-600">
          The official you are looking for does not exist.
        </p>
        <Link href="/officials" className="mt-4 text-blue-600 hover:underline">
          Browse all officials
        </Link>
      </div>
    );
  }

  const scoreCard = getScoreCard(id);
  const funding = getFundingSummary(id);
  const redFlags = getRedFlags(id);
  const issueCategories = getIssueCategories();

  const allScoredVotes = scoreCard
    ? Object.values(scoreCard.categories).flatMap((c) => c.votes)
    : [];

  const partyColor = getPartyColor(official.party);

  return (
    <div>
      {/* Hero */}
      <section
        className="border-b-4"
        style={{ borderBottomColor: partyColor }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Photo placeholder */}
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold text-gray-400 shrink-0">
              {official.firstName[0]}
              {official.lastName[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold text-gray-900">
                  {official.name}
                </h1>
                <PartyBadge party={official.party} />
              </div>
              <p className="text-lg text-gray-600 mt-1">{official.position}</p>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                {official.district && <span>District: {official.district}</span>}
                <span>{official.jurisdiction}</span>
                <span>{formatLevelName(official.level)}</span>
              </div>
              <div className="mt-3">
                <ShareButtons
                  title={`${official.name} - ${official.position} | RepWatchr`}
                  description={`See the scorecard, voting record, and funding data for ${official.name}.`}
                  path={`/officials/${official.id}`}
                />
              </div>
              {official.bio && (
                <p className="mt-3 text-gray-700 max-w-2xl">{official.bio}</p>
              )}
              {official.contactInfo && (
                <div className="flex flex-wrap gap-4 mt-3 text-sm">
                  {official.contactInfo.phone && (
                    <span className="text-gray-600">
                      Phone: {official.contactInfo.phone}
                    </span>
                  )}
                  {official.contactInfo.email && (
                    <a
                      href={`mailto:${official.contactInfo.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {official.contactInfo.email}
                    </a>
                  )}
                  {official.contactInfo.website && (
                    <a
                      href={official.contactInfo.website}
                      className="text-blue-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Official Website
                    </a>
                  )}
                </div>
              )}
            </div>
            {/* Score Gauge */}
            {scoreCard && (
              <div className="shrink-0">
                <ScoreGauge
                  score={scoreCard.overall}
                  letterGrade={scoreCard.letterGrade}
                  size="lg"
                />
                <p className="text-center text-xs text-gray-500 mt-1">
                  Overall Score
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Red Flags */}
        {redFlags.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-red-700 mb-4">
              Red Flags ({redFlags.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {redFlags.map((flag) => (
                <RedFlagCard key={flag.id} flag={flag} />
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Scores + Votes */}
          <div className="lg:col-span-2 space-y-8">
            {/* Scorecard */}
            {scoreCard && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Issue Scorecard
                </h2>
                <CategoryBreakdown
                  categories={scoreCard.categories}
                  issueCategories={issueCategories}
                />
              </section>
            )}

            {/* Voting Record */}
            {allScoredVotes.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Voting Record
                </h2>
                <VoteTimeline votes={allScoredVotes} />
              </section>
            )}

            {/* Campaign Promises */}
            {official.campaignPromises &&
              official.campaignPromises.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Campaign Promises
                  </h2>
                  <ul className="space-y-2">
                    {official.campaignPromises.map((promise, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-gray-700"
                      >
                        <span className="text-blue-500 mt-1">&#9679;</span>
                        {promise}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
          </div>

          {/* Right Column: Citizen Vote + Funding */}
          <div className="space-y-6">
            {/* Citizen Approval Rating & Vote Button */}
            <OfficialVotingSection
              officialId={official.id}
              officialCounties={official.county}
            />

            {funding && (
              <>
                <h2 className="text-xl font-bold text-gray-900">
                  Campaign Funding
                </h2>
                <FundingOverview funding={funding} />
                <DonorBreakdownChart breakdown={funding.donorBreakdown} />
                <GeographicBreakdown
                  breakdown={funding.geographicBreakdown}
                />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Top Donors
                  </h3>
                  <TopDonorsList donors={funding.topDonors} />
                </div>
                {funding.sources.length > 0 && (
                  <div className="text-xs text-gray-500">
                    <p className="font-medium mb-1">Data Sources:</p>
                    {funding.sources.map((src, i) => (
                      <p key={i}>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {src.name}
                        </a>{" "}
                        (retrieved {src.retrievedDate})
                      </p>
                    ))}
                  </div>
                )}
              </>
            )}

            {!funding && !scoreCard && (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-500 text-sm">
                  Detailed scoring and funding data is being collected for this
                  official. Check back soon.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Public Discussion */}
        <CommentSection
          officialId={official.id}
          officialName={official.name}
        />
      </div>
    </div>
  );
}
