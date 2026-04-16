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
import ReportButton from "@/components/shared/ReportButton";
import { getNewsByOfficialId } from "@/lib/data";

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
  const relatedNews = getNewsByOfficialId(id);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Mobile: stacked layout, Desktop: side by side */}
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {/* Photo placeholder */}
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gray-200 flex items-center justify-center text-2xl sm:text-3xl font-bold text-gray-400 shrink-0">
              {official.firstName[0]}
              {official.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900">
                  {official.name}
                </h1>
                <PartyBadge party={official.party} />
              </div>
              <p className="text-base sm:text-lg text-gray-600 mt-1">{official.position}</p>
              <div className="flex flex-wrap gap-2 sm:gap-4 mt-1.5 text-xs sm:text-sm text-gray-500">
                {official.district && <span>District: {official.district}</span>}
                <span>{official.jurisdiction}</span>
                <span>{formatLevelName(official.level)}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <ShareButtons
                  title={`${official.name} - ${official.position} | RepWatchr`}
                  description={`See the scorecard, voting record, and funding data for ${official.name}.`}
                  path={`/officials/${official.id}`}
                />
                <ReportButton
                  officialId={official.id}
                  pageUrl={`/officials/${official.id}`}
                />
              </div>
              {official.bio && (
                <p className="mt-3 text-sm sm:text-base text-gray-700 leading-relaxed max-w-2xl">{official.bio}</p>
              )}
              {official.contactInfo && (
                <div className="flex flex-wrap gap-3 sm:gap-4 mt-3 text-xs sm:text-sm">
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
            {/* Score Gauge - shown inline on desktop, below name on mobile */}
            {scoreCard && (
              <div className="shrink-0 mt-4 sm:mt-0">
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

        {/* Related News */}
        {relatedNews.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              In the News
            </h2>
            <div className="space-y-3">
              {relatedNews.map((article) => (
                <Link
                  key={article.id}
                  href={`/news/${article.id}`}
                  className="group flex gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {article.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {article.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-1">
                      {article.summary}
                    </p>
                    <span className="mt-2 inline-block text-xs text-gray-400">
                      {new Date(article.publishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <Link
              href="/news"
              className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              View All News &rarr;
            </Link>
          </section>
        )}

        {/* Public Discussion */}
        <CommentSection
          officialId={official.id}
          officialName={official.name}
        />
      </div>
    </div>
  );
}
