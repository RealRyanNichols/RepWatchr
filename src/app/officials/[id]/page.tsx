import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllOfficials,
  getOfficialWithScores,
  getScoreCard,
  getFundingSummary,
  getRedFlags,
  getIssueCategories,
  getNewsByOfficialId,
  getPublicVoteRecord,
} from "@/lib/data";
import { buildFallbackIdeologyProfile, getOfficialIdeologyProfile } from "@/lib/ideology";
import { getPartyColor } from "@/lib/formatting";
import CategoryBreakdown from "@/components/scores/CategoryBreakdown";
import FundingOverview from "@/components/funding/FundingOverview";
import TopDonorsList from "@/components/funding/TopDonorsList";
import DonorBreakdownChart from "@/components/funding/DonorBreakdownChart";
import GeographicBreakdown from "@/components/funding/GeographicBreakdown";
import VoteTimeline from "@/components/votes/VoteTimeline";
import RedFlagCard from "@/components/shared/RedFlagCard";
import IdeologyChart from "@/components/officials/IdeologyChart";
import OfficialTimeline from "@/components/officials/OfficialTimeline";
import OfficialVotingSection from "@/components/voting/OfficialVotingSection";
import GradeOfficialSection from "@/components/voting/GradeOfficialSection";
import CommentSection from "@/components/comments/CommentSection";
import ShareDrawer from "@/components/shared/ShareDrawer";
import ProfileOpenTracker from "@/components/shared/ProfileOpenTracker";
import ProfileScorecardVote from "@/components/scorecards/ProfileScorecardVote";
import OfficialSocialPanel from "@/components/officials/OfficialSocialPanel";
import VerifiedPoliticalFeedbackPanel from "@/components/profile/VerifiedPoliticalFeedbackPanel";
import { getPublicProfileOverlay, type PublicProfileEnrichmentItem, type PublicProfileOverlay, type PublicProfileVoteSnapshot } from "@/lib/profile-overlays";
import { buildOfficialCompletionSnapshot } from "@/lib/profile-completion";
import { getCongressTradingSnapshot } from "@/lib/congress-trading";
import { buildOfficialTimelineFromSources, dedupeTimelineEvents, getDatabaseTimelineEvents, sortTimelineEvents } from "@/lib/official-timeline";
import OfficialHero from "@/components/officials/OfficialHero";
import SourceTrail, { type ProfileSourceTrailEntry } from "@/components/officials/SourceTrail";
import PublicQuestionCard from "@/components/officials/PublicQuestionCard";
import RelatedProfileCard, { type RelatedProfileCardRecord } from "@/components/officials/RelatedProfileCard";
import ProfileSectionTracker from "@/components/officials/ProfileSectionTracker";
import FeedbackCluster from "@/components/civic/FeedbackCluster";
import TrustExplainerBox from "@/components/trust/TrustExplainerBox";
import { profileFeedbackOptions } from "@/lib/civic-actions";
import type { FundingSummary, NewsArticle, Official, PublicVoteRecord, RedFlag, ScoreCard } from "@/types";

export const revalidate = 86400;
export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const official = getOfficialWithScores(id);
  if (!official) return { title: "Official Not Found" };
  const title = `${official.name} - ${official.position}`;
  const description = `Source-backed RepWatchr profile for ${official.name}, ${official.position} serving ${official.jurisdiction}.`;
  const canonicalUrl = `https://www.repwatchr.com/officials/${official.id}`;
  const ogImage = `https://www.repwatchr.com/api/og/official?id=${encodeURIComponent(official.id)}`;
  const completion = buildOfficialCompletionSnapshot(official);
  const sourceCount = official.sourceLinks?.length ?? 0;
  const shouldIndex =
    completion.completionPercent >= 35 &&
    sourceCount > 0 &&
    official.reviewStatus !== "needs_source_review";

  return {
    title,
    description,
    robots: {
      index: shouldIndex,
      follow: true,
    },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "RepWatchr",
      type: "profile",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${official.name} RepWatchr profile`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
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
      <div className="min-h-screen bg-[#f8fbff] px-4 py-16 text-center text-slate-950">
        <h1 className="text-2xl font-bold text-slate-950">Official Not Found</h1>
        <p className="mt-2 text-slate-600">
          The official you are looking for does not exist.
        </p>
        <Link href="/officials" className="mt-4 text-blue-700 hover:underline">
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
  const publicVoteRecord = getPublicVoteRecord(id);
  const congressTrading = getCongressTradingSnapshot(id);
  const ideologyProfile = getOfficialIdeologyProfile(id) ?? buildFallbackIdeologyProfile(official);
  const profileOverlay = await getPublicProfileOverlay("official", id);
  const staticCompletion = buildOfficialCompletionSnapshot(official);
  const overlayPublicRecords = profileOverlay.enrichmentItems.filter((item) => item.category !== "news");
  const overlayNews = profileOverlay.enrichmentItems.filter((item) => item.category === "news");
  const buildoutPercent = profileOverlay.completion?.completionPercent ?? staticCompletion.completionPercent;
  const buildoutComplete = profileOverlay.completion?.isComplete ?? staticCompletion.isComplete;
  const buildoutMissingItems = profileOverlay.completion?.missingItems ?? staticCompletion.missingItems;
  const staticTimelineEvents = buildOfficialTimelineFromSources({
    official,
    scoreCard,
    funding,
    redFlags,
    relatedNews,
    publicVoteRecord,
    profileOverlay,
    congressTrading,
  });
  const databaseTimeline = await getDatabaseTimelineEvents(id);
  const timelineEvents = sortTimelineEvents(dedupeTimelineEvents([...databaseTimeline.events, ...staticTimelineEvents]));

  const allScoredVotes = scoreCard
    ? Object.values(scoreCard.categories).flatMap((c) => c.votes)
    : [];

  const partyColor = getPartyColor(official.party);
  const profilePath = `/officials/${official.id}`;
  const sourceTrailEntries = buildProfileSourceTrail({
    official,
    funding,
    redFlags,
    relatedNews,
    publicVoteRecord,
    profileOverlay,
    congressTrading,
  });
  const sourceCount = sourceTrailEntries.length;
  const latestProfileUpdate = latestDate(
    official.lastVerifiedAt,
    scoreCard?.lastUpdated,
    funding?.lastUpdated,
    publicVoteRecord?.lastUpdated,
    profileOverlay.completion?.lastCheckedAt,
    ...redFlags.map((flag) => flag.date),
    ...relatedNews.map((article) => article.publishedAt),
  );
  const confidenceLabel = profileConfidenceLabel(
    sourceCount,
    buildoutPercent,
    publicVoteRecord?.summary.totalVotesLoaded ?? 0,
  );
  const recordSummary = buildRecordSummary({
    official,
    sourceCount,
    completionPercent: buildoutPercent,
    missingItems: buildoutMissingItems,
    scoreCard,
    funding,
    redFlags,
    publicVoteRecord,
    timelineEventCount: timelineEvents.length,
    latestUpdate: latestProfileUpdate,
  });
  const publicQuestions = buildPublicQuestions({
    official,
    missingItems: buildoutMissingItems,
    funding,
    publicVoteRecord,
    sourceCount,
  });
  const primarySourceUrl = sourceTrailEntries[0]?.url;
  const primaryPublicQuestion = publicQuestions[0]?.question ?? `Which public source best confirms the current record for ${official.name}?`;
  const profileSourcePacket = buildProfileSharePacket({
    official,
    profilePath,
    sourceCount,
    completionPercent: buildoutPercent,
    confidenceLabel,
    sources: sourceTrailEntries,
    publicQuestion: primaryPublicQuestion,
  });
  const relatedProfiles = buildRelatedProfiles(official, getAllOfficials());
  const canonicalUrl = `https://www.repwatchr.com${profilePath}`;
  const pageDescription = `Source-backed RepWatchr profile for ${official.name}, ${official.position} serving ${official.jurisdiction}.`;
  const jsonLd = profileJsonLd({
    official,
    canonicalUrl,
    description: pageDescription,
    sourceCount,
    completionPercent: buildoutPercent,
  });

  return (
    <div className="min-h-screen bg-[#f8fbff] text-slate-950">
      {jsonLd.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
      <ProfileOpenTracker
        profileId={official.id}
        profileType="official"
        path={profilePath}
        level={official.level}
      />
      <OfficialHero
        official={{ ...official, scoreCard, fundingSummary: funding, redFlags }}
        sourceCount={sourceCount}
        completionPercent={buildoutPercent}
        confidenceLabel={confidenceLabel}
        lastUpdatedLabel={dateLabel(latestProfileUpdate)}
        partyColor={partyColor}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RecordSummaryPanel summary={recordSummary} officialName={official.name} />

        <div className="mt-6">
          <FeedbackCluster
            entityType="official"
            entityId={official.id}
            route={profilePath}
            title="Profile feedback"
            description="This is civic/product feedback, not election voting. Use it to tell RepWatchr what needs more records."
            options={profileFeedbackOptions}
          />
        </div>

        <div className="mt-6">
          <ShareDrawer
            title={`${official.name} RepWatchr profile`}
            entityName={official.name}
            path={profilePath}
            description={recordSummary.confirmed[0] ?? pageDescription}
            sourceUrl={primarySourceUrl}
            sourcePacket={profileSourcePacket}
            publicQuestion={primaryPublicQuestion}
            meetingQuestion={`Before the next public meeting, ask: ${primaryPublicQuestion}`}
            snippetKind={sourceCount > 0 ? "confirmed_public_record" : "needs_source"}
            submitSourcePath={`/sources/submit?form=submit_source&targetType=official&targetId=${encodeURIComponent(official.id)}&targetName=${encodeURIComponent(official.name)}`}
            correctionPath={`/sources/submit?form=correction_request&targetType=official&targetId=${encodeURIComponent(official.id)}&targetName=${encodeURIComponent(official.name)}`}
          />
        </div>

        <div className="mt-8">
          <SourceTrail
            officialId={official.id}
            officialName={official.name}
            profilePath={profilePath}
            sources={sourceTrailEntries}
          />
        </div>

        <div className="mb-8">
          <IdeologyChart
            profile={ideologyProfile}
            publicVoteCount={publicVoteRecord?.summary.totalVotesLoaded ?? 0}
            publicVoteSession={publicVoteRecord?.session}
            completionPercent={buildoutPercent}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Scores + Votes */}
          <div className="lg:col-span-2 space-y-8">
            {/* Scorecard */}
            {scoreCard && (
              <section>
                <ProfileSectionTracker
                  officialId={official.id}
                  officialName={official.name}
                  profilePath={profilePath}
                  section="issue_scorecard"
                />
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
                <ProfileSectionTracker
                  officialId={official.id}
                  officialName={official.name}
                  profilePath={profilePath}
                  section="voting_record"
                  eventName="vote_table_opened"
                  metadata={{ scored_vote_count: allScoredVotes.length }}
                />
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Voting Record
                </h2>
                <VoteTimeline votes={allScoredVotes} />
              </section>
            )}

            {publicVoteRecord && publicVoteRecord.votes.length > 0 && (
              <FederalVoteRecordPanel record={publicVoteRecord} />
            )}

            {profileOverlay.voteSnapshots.length > 0 && (
              <ProfileOverlayVotesPanel votes={profileOverlay.voteSnapshots} />
            )}

            {allScoredVotes.length === 0 &&
              (!publicVoteRecord || publicVoteRecord.votes.length === 0) &&
              profileOverlay.voteSnapshots.length === 0 && (
                <ProfileDataEmptyState
                  title="No vote records attached yet"
                  body="RepWatchr is not assigning vote meaning without a public vote source. Submit a roll call, meeting vote, agenda, minutes, or official vote page."
                  primaryHref={`/sources/submit?form=submit_source&sourceType=vote&targetType=official&targetId=${encodeURIComponent(official.id)}&targetName=${encodeURIComponent(official.name)}`}
                  primaryLabel="Submit vote source"
                  secondaryHref={`/dashboard/watchlists?entityType=official&entityId=${encodeURIComponent(official.id)}&label=${encodeURIComponent(official.name)}`}
                  secondaryLabel="Watch for vote updates"
                />
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
            <VerifiedPoliticalFeedbackPanel
              officialId={official.id}
              officialName={official.name}
              state={official.state}
              counties={official.county}
            />

            <ProfileScorecardVote
              targetType="official"
              targetId={official.id}
              targetName={official.name}
              targetPath={`/officials/${official.id}`}
            />

            {funding && (
              <>
                <ProfileSectionTracker
                  officialId={official.id}
                  officialName={official.name}
                  profilePath={profilePath}
                  section="campaign_funding"
                  eventName="funding_table_opened"
                  metadata={{ cycle: funding.cycle }}
                />
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

            {!funding && (
              <ProfileDataEmptyState
                title="No campaign finance sources attached yet"
                body="Funding records need a public filing source before RepWatchr summarizes donors, PACs, vendors, or campaign finance movement."
                primaryHref={`/sources/submit?form=submit_source&sourceType=funding&targetType=official&targetId=${encodeURIComponent(official.id)}&targetName=${encodeURIComponent(official.name)}`}
                primaryLabel="Submit funding source"
                secondaryHref={`/services/local-race-source-pack?targetType=official&targetId=${encodeURIComponent(official.id)}&targetName=${encodeURIComponent(official.name)}`}
                secondaryLabel="Request finance source pack"
              />
            )}

            <OfficialSocialPanel
              officialName={official.name}
              contactInfo={official.contactInfo}
            />

            <ProfileBuildoutPanel
              percent={buildoutPercent}
              isComplete={buildoutComplete}
              missingItems={buildoutMissingItems}
            />

            <ProfileOverlayStatusPanel overlay={profileOverlay} />

            {/* Citizen Approval Rating & Vote Button */}
            <OfficialVotingSection
              officialId={official.id}
              officialCounties={official.county}
            />
            <GradeOfficialSection
              officialId={official.id}
              officialCounties={official.county.map((c) =>
                c.toLowerCase().endsWith("county") ? c : `${c} County`
              )}
              officialName={official.name}
            />

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

        <div className="mt-10">
          <ProfileSectionTracker
            officialId={official.id}
            officialName={official.name}
            profilePath={profilePath}
            section="timeline"
            eventName="timeline_opened"
            metadata={{ event_count: timelineEvents.length }}
          />
          <OfficialTimeline
            officialId={official.id}
            officialName={official.name}
            events={timelineEvents}
            compact
          />
        </div>

        <section className="mt-10">
          <ProfileSectionTracker
            officialId={official.id}
            officialName={official.name}
            profilePath={profilePath}
            section="public_questions"
          />
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">
                Public questions
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Ask for the record, not the rumor.
              </h2>
            </div>
            <Link
              href={`/sources/submit?targetType=official&targetId=${encodeURIComponent(official.id)}&targetName=${encodeURIComponent(official.name)}`}
              className="w-fit rounded-xl bg-slate-950 px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Submit a better source
            </Link>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {publicQuestions.map((item) => (
              <PublicQuestionCard
                key={item.question}
                officialId={official.id}
                officialName={official.name}
                profilePath={profilePath}
                question={item.question}
                context={item.context}
              />
            ))}
          </div>
        </section>

        {(redFlags.length > 0 || overlayPublicRecords.length > 0 || congressTrading) && (
          <section className="mt-10 space-y-8" aria-label="Public records, red flags, and disclosure watch">
            <ProfileSectionTracker
              officialId={official.id}
              officialName={official.name}
              profilePath={profilePath}
              section="red_flags_and_disclosures"
              eventName="red_flag_opened"
              metadata={{
                red_flag_count: redFlags.length,
                overlay_count: overlayPublicRecords.length,
                has_congress_trading: Boolean(congressTrading),
              }}
            />
            {redFlags.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-bold text-red-700">
                  Red Flags ({redFlags.length})
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {redFlags.map((flag) => (
                    <RedFlagCard key={flag.id} flag={flag} />
                  ))}
                </div>
              </div>
            )}

            {overlayPublicRecords.length > 0 && (
              <ProfileOverlayEvidencePanel items={overlayPublicRecords} />
            )}

            {congressTrading && (
              <CongressTradingDisclosurePanel snapshot={congressTrading} />
            )}
          </section>
        )}

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

        {overlayNews.length > 0 && (
          <ProfileOverlayEvidencePanel items={overlayNews} title="Latest Source-Linked Updates" />
        )}

        {profileOverlay.publicStatements.length > 0 && (
          <ProfileOverlayStatementsPanel overlay={profileOverlay} />
        )}

        {relatedProfiles.length > 0 && (
          <section className="mt-10">
            <ProfileSectionTracker
              officialId={official.id}
              officialName={official.name}
              profilePath={profilePath}
              section="related_profiles"
              metadata={{ related_count: relatedProfiles.length }}
            />
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                  Keep checking
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Related profiles to compare next
                </h2>
              </div>
              <Link
                href="/officials"
                className="w-fit rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black uppercase tracking-wide text-slate-950 transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700"
              >
                Open official search
              </Link>
            </div>
            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {relatedProfiles.map((profile) => (
                <RelatedProfileCard key={profile.id} profile={profile} />
              ))}
            </div>
          </section>
        )}

        <NextProfileActions
          officialId={official.id}
          officialName={official.name}
          profilePath={profilePath}
        />

        <TrustCorrectionBox
          officialId={official.id}
          officialName={official.name}
          profilePath={profilePath}
        />

        {/* Public Discussion */}
        <CommentSection
          officialId={official.id}
          officialName={official.name}
        />
      </div>
    </div>
  );
}

function RecordSummaryPanel({
  summary,
  officialName,
}: {
  summary: RecordSummary;
  officialName: string;
}) {
  const columns = [
    {
      title: "Confirmed",
      eyebrow: "Record summary",
      items: summary.confirmed,
      tone: "border-emerald-200 bg-emerald-50 text-emerald-950",
      dot: "bg-emerald-500",
    },
    {
      title: "Needs source review",
      eyebrow: "Still open",
      items: summary.needsSource,
      tone: "border-amber-200 bg-amber-50 text-amber-950",
      dot: "bg-amber-500",
    },
    {
      title: "Changed recently",
      eyebrow: "Watch signals",
      items: summary.changedRecently,
      tone: "border-blue-200 bg-blue-50 text-blue-950",
      dot: "bg-blue-500",
    },
    {
      title: "What is not known",
      eyebrow: "Trust guardrail",
      items: summary.notKnown,
      tone: "border-slate-200 bg-white text-slate-950",
      dot: "bg-slate-400",
    },
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_22px_70px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">
            Record summary
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            What RepWatchr can say about {officialName}
          </h2>
        </div>
        <Link
          href="/methodology"
          className="w-fit rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-black uppercase tracking-wide text-slate-950 transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700"
        >
          Read methodology
        </Link>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-4">
        {columns.map((column) => (
          <div key={column.title} className={`rounded-2xl border p-4 ${column.tone}`}>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] opacity-70">
              {column.eyebrow}
            </p>
            <h3 className="mt-2 text-lg font-black leading-tight">{column.title}</h3>
            <ul className="mt-3 space-y-3 text-sm font-semibold leading-6">
              {column.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${column.dot}`} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function buildProfileSharePacket({
  official,
  profilePath,
  sourceCount,
  completionPercent,
  confidenceLabel,
  sources,
  publicQuestion,
}: {
  official: Official;
  profilePath: string;
  sourceCount: number;
  completionPercent: number;
  confidenceLabel: string;
  sources: ProfileSourceTrailEntry[];
  publicQuestion: string;
}) {
  const sourceLines = sources.slice(0, 6).map((source, index) => {
    const label = [source.category.replace(/_/g, " "), source.confidenceLabel, source.statusLabel]
      .filter(Boolean)
      .join(" | ");
    return `${index + 1}. ${source.title} (${label})\n   ${source.url}`;
  });

  return [
    `RepWatchr profile: ${official.name}`,
    `${official.position} | ${official.jurisdiction} | ${official.party}`,
    `Profile URL: https://www.repwatchr.com${profilePath}`,
    `Sources loaded: ${sourceCount}`,
    `Profile completeness: ${completionPercent}%`,
    `Confidence label: ${confidenceLabel}`,
    "",
    `Public question: ${publicQuestion}`,
    "",
    sourceLines.length ? "Source trail:" : "Source trail: needs public source submissions.",
    ...sourceLines,
    "",
    "RepWatchr rule: share the receipt, not unsupported claims.",
  ].join("\n");
}

function NextProfileActions({
  officialId,
  officialName,
  profilePath,
}: {
  officialId: string;
  officialName: string;
  profilePath: string;
}) {
  const params = `targetType=official&targetId=${encodeURIComponent(officialId)}&targetName=${encodeURIComponent(officialName)}`;
  const actions = [
    {
      label: "Watch this official",
      href: `/dashboard/watchlists?entityType=official&entityId=${encodeURIComponent(officialId)}&label=${encodeURIComponent(officialName)}`,
      description: "Save the profile and come back when sources, votes, or funding change.",
    },
    {
      label: "Submit one missing source",
      href: `/sources/submit?${params}`,
      description: "Send a public URL into the review queue without overclaiming it.",
    },
    {
      label: "Build a source packet",
      href: `/services/free-source-packet?${params}`,
      description: "Turn one public link into a copyable source-backed packet.",
    },
    {
      label: "Request official brief",
      href: `/services/official-record-brief?${params}`,
      description: "Paid research lane for a fuller public-record brief.",
    },
  ];

  return (
    <section className="mt-10 rounded-3xl border border-blue-100 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_34%),linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_22px_70px_rgba(15,23,42,0.08)] sm:p-6">
      <ProfileSectionTracker
        officialId={officialId}
        officialName={officialName}
        profilePath={profilePath}
        section="next_profile_actions"
      />
      <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
        Your next useful move
      </p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">
        Do not stop at this page.
      </h2>
      <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
        Watch the record, improve the source trail, build a packet, or request a deeper public-record brief. Every action should make the record easier to inspect.
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-950/10"
          >
            <h3 className="text-base font-black text-slate-950 group-hover:text-blue-700">
              {action.label}
            </h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              {action.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function TrustCorrectionBox({
  officialId,
  officialName,
  profilePath,
}: {
  officialId: string;
  officialName: string;
  profilePath: string;
}) {
  return (
    <section className="mt-8">
      <ProfileSectionTracker
        officialId={officialId}
        officialName={officialName}
        profilePath={profilePath}
        section="trust_and_correction"
      />
      <TrustExplainerBox
        entityType="official"
        entityId={officialId}
        entityName={officialName}
        url={profilePath}
      />
    </section>
  );
}

function ProfileDataEmptyState({
  title,
  body,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
        Needs source
      </p>
      <h2 className="mt-2 text-xl font-black text-slate-950">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{body}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={primaryHref}
          className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-700"
        >
          {primaryLabel}
        </Link>
        <Link
          href={secondaryHref}
          className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-black uppercase tracking-wide text-slate-950 transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700"
        >
          {secondaryLabel}
        </Link>
      </div>
    </section>
  );
}

function ProfileBuildoutPanel({
  percent,
  isComplete,
  missingItems,
}: {
  percent: number;
  isComplete: boolean;
  missingItems: string[];
}) {
  const tone = isComplete ? "emerald" : percent >= 60 ? "blue" : percent >= 35 ? "amber" : "red";
  const toneClasses = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-red-200 bg-red-50 text-red-800",
  }[tone];
  const barClass = {
    emerald: "bg-emerald-600",
    blue: "bg-blue-600",
    amber: "bg-amber-500",
    red: "bg-red-600",
  }[tone];

  return (
    <section className={`rounded-xl border p-5 shadow-sm ${toneClasses}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wide">Profile buildout</p>
          <h2 className="mt-1 text-lg font-black">
            {isComplete ? "Full profile" : "Profile still being built"}
          </h2>
        </div>
        <p className="text-3xl font-black">{percent}%</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80">
        <div className={`h-full ${barClass}`} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
      </div>
      {isComplete ? (
        <p className="mt-3 text-sm font-semibold leading-6">
          This profile currently has every required public-record section loaded.
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm font-semibold leading-6">
            This is not being treated as complete until the missing public-record sections are filled.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {missingItems.slice(0, 8).map((item) => (
              <span key={item} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black capitalize shadow-sm">
                {item.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function FederalVoteRecordPanel({
  record,
}: {
  record: NonNullable<ReturnType<typeof getPublicVoteRecord>>;
}) {
  const isTexasStateRecord = record.level === "state" && "state" in record && record.state === "TX";
  const title = isTexasStateRecord ? "Texas Legislature roll calls" : "Current Congress roll calls";
  const sourceNote = isTexasStateRecord
    ? "Source-backed Texas Legislature record votes loaded from Texas Legislature Online. These are not automatically scored left or right until issue mapping is reviewed."
    : "Source-backed roll-call votes loaded from official House and Senate records. These are not automatically scored left or right until issue mapping is reviewed.";

  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-blue-700">
            Public vote record snapshot
          </p>
          <h2 className="mt-1 text-xl font-black text-gray-950">
            {title}
          </h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-gray-600">
            {sourceNote}
          </p>
          <p className="mt-2 text-xs font-black uppercase tracking-wide text-gray-500">
            {record.session}
          </p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-right">
          <p className="text-3xl font-black text-blue-950">{record.summary.totalVotesLoaded}</p>
          <p className="text-xs font-black uppercase tracking-wide text-blue-700">Votes loaded</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <VoteMetric label="Yea" value={record.summary.yea} />
        <VoteMetric label="Nay" value={record.summary.nay} />
        <VoteMetric label="Present" value={record.summary.present} />
        <VoteMetric label="Not voting" value={record.summary.notVoting} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-gray-200">
        <div className="divide-y divide-gray-200">
          {record.votes.slice(0, 8).map((vote) => (
            <a
              key={vote.sourceId}
              href={vote.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white px-4 py-3 transition hover:bg-blue-50"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-wide text-gray-500">
                    {vote.chamber} roll {vote.rollCall} | {vote.date}
                  </p>
                  <h3 className="mt-1 line-clamp-2 text-sm font-black text-gray-950">
                    {vote.title || vote.question || vote.issue}
                  </h3>
                  <p className="mt-1 line-clamp-1 text-xs font-semibold text-gray-500">
                    {vote.question} | {vote.result}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-gray-700">
                  {vote.voteCast}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {record.sourceLinks.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-800 hover:bg-blue-100"
          >
            {source.title}
          </a>
        ))}
      </div>
    </section>
  );
}

function VoteMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
      <p className="text-lg font-black text-gray-950">{value}</p>
      <p className="text-[11px] font-black uppercase tracking-wide text-gray-500">{label}</p>
    </div>
  );
}

function CongressTradingDisclosurePanel({
  snapshot,
}: {
  snapshot: NonNullable<ReturnType<typeof getCongressTradingSnapshot>>;
}) {
  const primary = snapshot.primaryRow;
  const tone = snapshot.highestRiskLevel;
  const toneClasses = {
    critical: {
      shell: "border-red-300 bg-red-50",
      eyebrow: "text-red-800",
      badge: "border-red-200 bg-red-700 text-white",
      metric: "border-red-200 bg-white text-red-950",
      link: "border-red-200 bg-white text-red-800 hover:bg-red-100",
    },
    high: {
      shell: "border-amber-300 bg-amber-50",
      eyebrow: "text-amber-800",
      badge: "border-amber-200 bg-amber-600 text-white",
      metric: "border-amber-200 bg-white text-amber-950",
      link: "border-amber-200 bg-white text-amber-800 hover:bg-amber-100",
    },
    watch: {
      shell: "border-blue-200 bg-blue-50",
      eyebrow: "text-blue-800",
      badge: "border-blue-200 bg-blue-700 text-white",
      metric: "border-blue-200 bg-white text-blue-950",
      link: "border-blue-200 bg-white text-blue-800 hover:bg-blue-100",
    },
  }[tone];
  const riskLabel = {
    critical: "Critical disclosure review",
    high: "High disclosure review",
    watch: "Trading disclosure watch",
  }[tone];

  return (
    <section className={`mb-8 rounded-2xl border p-5 shadow-sm ${toneClasses.shell}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className={`text-xs font-black uppercase tracking-wide ${toneClasses.eyebrow}`}>
            Congress trading disclosure flag
          </p>
          <h2 className="mt-1 text-2xl font-black text-gray-950">{riskLabel}</h2>
          <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-gray-700">
            RepWatchr is highlighting public disclosure volume and recency from a secondary tracker, then linking the
            official House or Senate disclosure portal for source review. This is not a finding of wrongdoing.
          </p>
        </div>
        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${toneClasses.badge}`}>
          {tone}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className={`rounded-xl border p-4 ${toneClasses.metric}`}>
          <p className="text-3xl font-black">{primary.transactions.toLocaleString()}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-wide">Tracker transactions</p>
        </div>
        <div className={`rounded-xl border p-4 ${toneClasses.metric}`}>
          <p className="text-3xl font-black">{primary.filings.toLocaleString()}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-wide">Disclosure filings</p>
        </div>
        <div className={`rounded-xl border p-4 ${toneClasses.metric}`}>
          <p className="text-3xl font-black">{primary.lastFilingDate}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-wide">Latest tracker filing</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-xl border border-white/70 bg-white/80 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-gray-500">Why this is highlighted</p>
          <ul className="mt-2 space-y-2 text-sm font-semibold leading-6 text-gray-700">
            {primary.riskReasons.map((reason) => (
              <li key={reason} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-600" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
          {snapshot.rows.length > 1 ? (
            <p className="mt-3 text-xs font-bold text-gray-500">
              {snapshot.rows.length} tracker rows matched this current profile. The highest-volume row is shown first
              so duplicate or historical tracker entries do not get silently blended into one number.
            </p>
          ) : null}
        </div>
        <div className="rounded-xl border border-white/70 bg-white/80 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-gray-500">Source path</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={primary.trackerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-full border px-3 py-1.5 text-xs font-black ${toneClasses.link}`}
            >
              Open tracker profile
            </a>
            <a
              href={primary.officialDisclosureUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-full border px-3 py-1.5 text-xs font-black ${toneClasses.link}`}
            >
              {primary.officialDisclosureName}
            </a>
            <a
              href={snapshot.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-full border px-3 py-1.5 text-xs font-black ${toneClasses.link}`}
            >
              Snapshot source
            </a>
          </div>
          <p className="mt-3 text-xs font-semibold leading-5 text-gray-600">
            Snapshot pulled {snapshot.snapshotDate}. Official portals are attached so readers can verify filed PTR and
            financial disclosure records before treating a tracker row as complete.
          </p>
        </div>
      </div>
    </section>
  );
}

function ProfileOverlayEvidencePanel({
  items,
  title = "Public Records & Controversies",
}: {
  items: PublicProfileEnrichmentItem[];
  title?: string;
}) {
  return (
    <section className="mb-8 rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-red-700">Source-backed overlay</p>
          <h2 className="mt-1 text-xl font-black text-gray-950">{title}</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-gray-600">
            Auto-published items require an official record or named publication source. Weak matches stay out of public view.
          </p>
        </div>
        <span className="w-fit rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-black text-red-800">
          {items.length} linked
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.slice(0, 8).map((item) => (
          <a
            key={item.id}
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-red-200 hover:bg-red-50"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-blue-800">
                {item.category.replace(/_/g, " ")}
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-800">
                {item.sourceTier.replace(/_/g, " ")}
              </span>
            </div>
            <h3 className="mt-2 line-clamp-2 text-sm font-black text-gray-950">{item.title}</h3>
            <p className="mt-1 line-clamp-3 text-xs font-semibold leading-5 text-gray-600">{item.summary}</p>
            <p className="mt-2 text-[11px] font-black uppercase tracking-wide text-gray-500">
              {item.sourceName}
              {item.eventDate ? ` | ${new Date(item.eventDate).toLocaleDateString()}` : ""}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}

function ProfileOverlayVotesPanel({ votes }: { votes: PublicProfileVoteSnapshot[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-blue-700">Daily vote overlay</p>
          <h2 className="mt-1 text-xl font-black text-gray-950">Latest loaded roll calls</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-gray-600">
            These are source snapshots from the daily pipeline. The left/right chart moves only when a reviewed issue rule exists.
          </p>
        </div>
        <span className="w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-800">
          {votes.length} recent
        </span>
      </div>

      <div className="mt-4 divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200">
        {votes.slice(0, 8).map((vote) => (
          <a
            key={vote.id}
            href={vote.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white px-4 py-3 transition hover:bg-blue-50"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-gray-500">
                  {vote.chamber ?? "roll call"} {vote.rollCall ? `#${vote.rollCall}` : ""}{" "}
                  {vote.voteDate ? `| ${vote.voteDate}` : ""}
                </p>
                <h3 className="mt-1 line-clamp-2 text-sm font-black text-gray-950">
                  {vote.issue ?? vote.question ?? vote.sourceVoteId}
                </h3>
                <p className="mt-1 text-xs font-semibold text-gray-500">
                  Rule status: {vote.ruleReviewStatus.replace(/_/g, " ")}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-gray-700">
                {vote.voteCast ?? "loaded"}
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function ProfileOverlayStatusPanel({ overlay }: { overlay: PublicProfileOverlay }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">Daily data overlay</p>
      <h2 className="mt-1 text-lg font-black text-slate-950">
        {overlay.configured ? "Live overlay ready" : "Static profile mode"}
      </h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        {overlay.configured
          ? "Supabase can add daily votes, news, public records, and statement links without a full site rebuild."
          : "The profile still works from Git JSON. Configure Supabase service keys and run the overlay SQL to enable daily additions."}
      </p>
      {overlay.completion ? (
        <p className="mt-2 text-xs font-black uppercase tracking-wide text-blue-800">
          Last checked {new Date(overlay.completion.lastCheckedAt).toLocaleString()}
        </p>
      ) : null}
      {overlay.errors.length > 0 ? (
        <p className="mt-2 text-xs font-semibold leading-5 text-amber-700">
          Overlay setup note: {overlay.errors[0]}
        </p>
      ) : null}
    </section>
  );
}

function ProfileOverlayStatementsPanel({ overlay }: { overlay: PublicProfileOverlay }) {
  return (
    <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-blue-700">Public statements</p>
      <h2 className="mt-1 text-xl font-black text-gray-950">Recent sourced public statements</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {overlay.publicStatements.map((statement) => (
          <a
            key={statement.id}
            href={statement.statementUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-blue-200 hover:bg-blue-50"
          >
            <p className="text-xs font-black uppercase tracking-wide text-gray-500">
              {statement.platform}
              {statement.statementDate ? ` | ${new Date(statement.statementDate).toLocaleDateString()}` : ""}
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-gray-700">
              {statement.excerpt ?? statement.contextNote ?? "Open public statement source"}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}

type CongressTradingSnapshot = NonNullable<ReturnType<typeof getCongressTradingSnapshot>>;

type RecordSummary = {
  confirmed: string[];
  needsSource: string[];
  changedRecently: string[];
  notKnown: string[];
};

function sourceDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function dateLabel(value: string | null | undefined) {
  if (!value) return "Pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function latestDate(...values: Array<string | null | undefined>) {
  const dates = values
    .map((value) => (value ? new Date(value) : null))
    .filter((value): value is Date => Boolean(value && !Number.isNaN(value.getTime())))
    .sort((a, b) => b.getTime() - a.getTime());

  return dates[0]?.toISOString() ?? null;
}

function sourceConfidence(url: string, sourceName?: string | null) {
  const domain = sourceDomain(url)?.toLowerCase() ?? "";
  const name = sourceName?.toLowerCase() ?? "";

  if (domain.endsWith(".gov") || domain.includes("congress.gov") || domain.includes("senate.gov") || domain.includes("house.gov") || domain.includes("fec.gov") || domain.includes("capitol.texas.gov")) {
    return "Official record";
  }

  if (/(tribune|times|post|news|journal|chronicle|herald|gazette|reporter|press|radio|tv|apnews|reuters|politico|npr|pbs)/i.test(domain) || /(news|journal|tribune|times|post|press|radio|tv)/i.test(name)) {
    return "Named source";
  }

  return "Source linked";
}

function profileConfidenceLabel(sourceCount: number, completionPercent: number, publicVoteCount: number) {
  if (completionPercent >= 85 && sourceCount >= 5 && publicVoteCount >= 25) return "High confidence";
  if (completionPercent >= 65 && sourceCount >= 3) return "Source-backed";
  if (sourceCount > 0) return "Source-seeded";
  return "Needs source";
}

function overlayCategoryToSourceCategory(category: PublicProfileEnrichmentItem["category"]): ProfileSourceTrailEntry["category"] {
  if (category === "funding") return "funding";
  if (category === "statement") return "public_statement";
  if (category === "news") return "article";
  if (category === "public_record" || category === "lawsuit" || category === "ethics") return "court_agency_record";
  return "under_review";
}

function buildProfileSourceTrail({
  official,
  funding,
  redFlags,
  relatedNews,
  publicVoteRecord,
  profileOverlay,
  congressTrading,
}: {
  official: Official;
  funding?: FundingSummary;
  redFlags: RedFlag[];
  relatedNews: NewsArticle[];
  publicVoteRecord?: PublicVoteRecord;
  profileOverlay: PublicProfileOverlay;
  congressTrading?: CongressTradingSnapshot;
}): ProfileSourceTrailEntry[] {
  const byUrl = new Map<string, ProfileSourceTrailEntry>();

  function add(entry: Omit<ProfileSourceTrailEntry, "id" | "domain"> & { id?: string }) {
    if (!entry.url || byUrl.has(entry.url)) return;
    byUrl.set(entry.url, {
      ...entry,
      id: entry.id ?? `${entry.category}-${byUrl.size + 1}`,
      domain: sourceDomain(entry.url),
    });
  }

  for (const source of official.sourceLinks ?? []) {
    add({
      title: source.title,
      url: source.url,
      category: "official_source",
      date: official.lastVerifiedAt,
      sourceName: source.title,
      confidenceLabel: sourceConfidence(source.url, source.title),
      statusLabel: "Attached to profile",
      summary: `Official source link attached to ${official.name}'s profile.`,
    });
  }

  if (official.photoSourceUrl) {
    add({
      title: "Profile photo source",
      url: official.photoSourceUrl,
      category: "official_source",
      date: official.lastVerifiedAt,
      sourceName: official.photoCredit ?? "Photo source",
      confidenceLabel: sourceConfidence(official.photoSourceUrl, official.photoCredit),
      statusLabel: "Photo source",
      summary: "Public source attached for the profile image.",
    });
  }

  if (official.contactInfo.website) {
    add({
      title: "Official website",
      url: official.contactInfo.website,
      category: "official_source",
      date: official.lastVerifiedAt,
      sourceName: "Official website",
      confidenceLabel: sourceConfidence(official.contactInfo.website, "Official website"),
      statusLabel: "Public contact",
      summary: "Primary public website or official office page.",
    });
  }

  for (const source of publicVoteRecord?.sourceLinks ?? []) {
    add({
      title: source.title,
      url: source.url,
      category: "vote",
      date: publicVoteRecord?.lastUpdated,
      sourceName: source.title,
      confidenceLabel: sourceConfidence(source.url, source.title),
      statusLabel: "Vote source",
      summary: `${publicVoteRecord?.summary.totalVotesLoaded ?? 0} public roll-call votes loaded from this source lane.`,
    });
  }

  for (const vote of publicVoteRecord?.votes.slice(0, 12) ?? []) {
    add({
      title: vote.title || vote.question || `${vote.chamber} roll call ${vote.rollCall}`,
      url: vote.sourceUrl,
      category: "vote",
      date: vote.date,
      sourceName: vote.sourceName,
      confidenceLabel: sourceConfidence(vote.sourceUrl, vote.sourceName),
      statusLabel: "Roll call",
      summary: `${vote.question} Result: ${vote.result}. Vote cast: ${vote.voteCast}.`,
    });
  }

  for (const source of funding?.sources ?? []) {
    add({
      title: source.name,
      url: source.url,
      category: "funding",
      date: source.retrievedDate || funding?.lastUpdated,
      sourceName: source.name,
      confidenceLabel: sourceConfidence(source.url, source.name),
      statusLabel: "Funding source",
      summary: `Campaign finance summary for cycle ${funding?.cycle}. Donations are public records and do not, by themselves, prove wrongdoing.`,
    });
  }

  for (const flag of redFlags) {
    add({
      title: flag.title,
      url: flag.sourceUrl,
      category: flag.category === "funding" ? "funding" : "court_agency_record",
      date: flag.date,
      sourceName: "Red flag source",
      confidenceLabel: sourceConfidence(flag.sourceUrl, flag.title),
      statusLabel: "Source-backed review",
      summary: flag.description,
    });
  }

  for (const article of relatedNews) {
    if (article.sourceUrl) {
      add({
        title: article.title,
        url: article.sourceUrl,
        category: "article",
        date: article.publishedAt,
        sourceName: article.sourceName ?? "Article source",
        confidenceLabel: sourceConfidence(article.sourceUrl, article.sourceName),
        statusLabel: article.sourceStatus === "needs_source_review" ? "Needs review" : "Source-linked",
        summary: article.summary,
      });
    }

    for (const source of article.sourceLinks ?? []) {
      add({
        title: source.title,
        url: source.url,
        category: "article",
        date: article.publishedAt,
        sourceName: article.sourceName ?? source.title,
        confidenceLabel: sourceConfidence(source.url, source.title),
        statusLabel: article.sourceStatus === "needs_source_review" ? "Needs review" : "Source-linked",
        summary: article.summary,
      });
    }
  }

  for (const item of profileOverlay.enrichmentItems) {
    add({
      id: item.id,
      title: item.title,
      url: item.sourceUrl,
      category: overlayCategoryToSourceCategory(item.category),
      date: item.eventDate,
      sourceName: item.sourceName,
      confidenceLabel: item.sourceTier.replace(/_/g, " "),
      statusLabel: item.status.replace(/_/g, " "),
      summary: item.summary,
    });
  }

  for (const vote of profileOverlay.voteSnapshots) {
    add({
      id: vote.id,
      title: vote.issue ?? vote.question ?? vote.sourceVoteId,
      url: vote.sourceUrl,
      category: "vote",
      date: vote.voteDate,
      sourceName: "Daily vote source",
      confidenceLabel: "Source linked",
      statusLabel: vote.ruleReviewStatus.replace(/_/g, " "),
      summary: vote.voteCast ? `Vote cast: ${vote.voteCast}.` : "Daily roll-call source awaiting issue mapping.",
    });
  }

  for (const statement of profileOverlay.publicStatements) {
    add({
      id: statement.id,
      title: `${statement.platform} public statement`,
      url: statement.statementUrl,
      category: "public_statement",
      date: statement.statementDate,
      sourceName: statement.platform,
      confidenceLabel: sourceConfidence(statement.statementUrl, statement.platform),
      statusLabel: "Approved statement",
      summary: statement.excerpt ?? statement.contextNote ?? "Public statement source attached to profile.",
    });
  }

  if (congressTrading) {
    add({
      title: `${official.name} trading tracker profile`,
      url: congressTrading.primaryRow.trackerUrl,
      category: "under_review",
      date: congressTrading.primaryRow.lastFilingDate,
      sourceName: congressTrading.source.name,
      confidenceLabel: "Secondary tracker",
      statusLabel: "Disclosure watch",
      summary: "Secondary tracker link attached for public review. This is not a finding of wrongdoing.",
    });
    add({
      title: congressTrading.primaryRow.officialDisclosureName,
      url: congressTrading.primaryRow.officialDisclosureUrl,
      category: "court_agency_record",
      date: congressTrading.primaryRow.lastFilingDate,
      sourceName: congressTrading.primaryRow.officialDisclosureName,
      confidenceLabel: "Official record",
      statusLabel: "Disclosure source",
      summary: "Official disclosure portal attached so readers can verify the public filing path.",
    });
    add({
      title: congressTrading.source.name,
      url: congressTrading.source.url,
      category: "under_review",
      date: congressTrading.source.retrievedDate,
      sourceName: congressTrading.source.name,
      confidenceLabel: congressTrading.source.tier.replace(/_/g, " "),
      statusLabel: "Snapshot source",
      summary: "Dataset source used for the disclosure-watch snapshot.",
    });
  }

  return [...byUrl.values()].sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });
}

function buildRecordSummary({
  official,
  sourceCount,
  completionPercent,
  missingItems,
  scoreCard,
  funding,
  redFlags,
  publicVoteRecord,
  timelineEventCount,
  latestUpdate,
}: {
  official: Official;
  sourceCount: number;
  completionPercent: number;
  missingItems: string[];
  scoreCard?: ScoreCard;
  funding?: FundingSummary;
  redFlags: RedFlag[];
  publicVoteRecord?: PublicVoteRecord;
  timelineEventCount: number;
  latestUpdate: string | null;
}): RecordSummary {
  const confirmed = [
    `${official.name} is listed as ${official.position} for ${official.jurisdiction}${official.district ? `, ${official.district}` : ""}.`,
    `${sourceCount} public source ${sourceCount === 1 ? "link is" : "links are"} attached to this profile.`,
  ];

  if (publicVoteRecord?.summary.totalVotesLoaded) {
    confirmed.push(`${publicVoteRecord.summary.totalVotesLoaded.toLocaleString()} public vote rows are loaded for review.`);
  }

  if (scoreCard) {
    confirmed.push(`A RepWatchr issue scorecard is loaded with an overall ${scoreCard.letterGrade} grade and ${Object.values(scoreCard.categories).flatMap((category) => category.votes).length} scored vote entries.`);
  }

  if (funding) {
    confirmed.push(`A campaign funding snapshot is loaded for the ${funding.cycle} cycle. Funding records show public money trails; they do not prove misconduct by themselves.`);
  }

  if (redFlags.length > 0) {
    confirmed.push(`${redFlags.length} source-backed review ${redFlags.length === 1 ? "item is" : "items are"} attached below the score, vote, and funding sections.`);
  }

  const needsSource = missingItems.length > 0
    ? missingItems.slice(0, 6)
    : ["No required buildout item is currently marked missing, but readers can still submit better sources or corrections."];

  return {
    confirmed,
    needsSource,
    changedRecently: [
      latestUpdate ? `Latest profile update signal: ${dateLabel(latestUpdate)}.` : "No recent update timestamp is loaded yet.",
      `${timelineEventCount} timeline ${timelineEventCount === 1 ? "event is" : "events are"} available for filtering, copying, or sharing.`,
      `Profile buildout currently shows ${completionPercent}% completeness.`,
    ],
    notKnown: [
      "RepWatchr is not claiming this is every public record ever created about the official.",
      "Unreviewed public submissions do not become verified facts until the source path is checked.",
      "Scores are methodology signals, not legal findings or proof of misconduct.",
    ],
  };
}

function buildRelatedProfiles(official: Official, officials: Official[]): RelatedProfileCardRecord[] {
  const officialCountySet = new Set(official.county.map((county) => county.toLowerCase()));

  return officials
    .filter((candidate) => candidate.id !== official.id)
    .map((candidate) => {
      let score = 0;
      let reason = "";

      if (candidate.jurisdiction === official.jurisdiction) {
        score += 6;
        reason = "Same jurisdiction";
      }

      if (candidate.level === official.level) {
        score += 4;
        reason ||= "Same office level";
      }

      if (candidate.position === official.position) {
        score += 3;
        reason ||= "Same office";
      }

      if (candidate.district && official.district && candidate.district === official.district) {
        score += 5;
        reason = "Same district";
      }

      if (candidate.county.some((county) => officialCountySet.has(county.toLowerCase()))) {
        score += 4;
        reason ||= "Same county";
      }

      if (candidate.party === official.party) {
        score += 1;
        reason ||= "Same party";
      }

      return { candidate, score, reason: reason || "Related profile" };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.candidate.name.localeCompare(b.candidate.name))
    .slice(0, 6)
    .map(({ candidate, reason }) => ({
      id: candidate.id,
      name: candidate.name,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      photo: candidate.photo,
      party: candidate.party,
      level: candidate.level,
      position: candidate.position,
      jurisdiction: candidate.jurisdiction,
      district: candidate.district,
      reason,
    }));
}

function buildPublicQuestions({
  official,
  missingItems,
  funding,
  publicVoteRecord,
  sourceCount,
}: {
  official: Official;
  missingItems: string[];
  funding?: FundingSummary;
  publicVoteRecord?: PublicVoteRecord;
  sourceCount: number;
}) {
  const questions: Array<{ question: string; context: string }> = [
    {
      question: `Which public source should voters use to verify ${official.name}'s current record for ${official.position}?`,
      context: "A safe starting point when a profile has source gaps or stale links.",
    },
  ];

  if (!publicVoteRecord?.summary.totalVotesLoaded) {
    questions.push({
      question: `Can you point voters to the official vote record or meeting record for ${official.name}'s current term?`,
      context: "Use this when the vote table is empty or the left/right model needs more reviewed vote rows.",
    });
  }

  if (!funding) {
    questions.push({
      question: `Where is the current campaign finance source for ${official.name}, and which filing covers this cycle?`,
      context: "Funding questions should ask for public filings, not jump to conclusions about donors.",
    });
  }

  if (missingItems.length > 0) {
    questions.push({
      question: `RepWatchr shows a missing source area for ${missingItems[0]}. What official record should be attached?`,
      context: "This turns a profile gap into a concrete public-record request.",
    });
  }

  if (sourceCount > 0) {
    questions.push({
      question: `Is this source path complete, or is there a better official record RepWatchr should attach?`,
      context: "Use this before sharing a hard claim when a better source may exist.",
    });
  }

  return questions.slice(0, 4);
}

function profileJsonLd({
  official,
  canonicalUrl,
  description,
  sourceCount,
  completionPercent,
}: {
  official: Official;
  canonicalUrl: string;
  description: string;
  sourceCount: number;
  completionPercent: number;
}) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "RepWatchr",
          item: "https://www.repwatchr.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Officials",
          item: "https://www.repwatchr.com/officials",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: official.name,
          item: canonicalUrl,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      name: `${official.name} RepWatchr profile`,
      description,
      url: canonicalUrl,
      dateModified: official.lastVerifiedAt,
      mainEntity: {
        "@type": "Person",
        name: official.name,
        jobTitle: official.position,
        affiliation: official.jurisdiction,
        url: official.contactInfo.website,
        image: official.photo,
      },
      about: {
        "@type": "Dataset",
        name: `${official.name} public-record profile data`,
        description: `RepWatchr source trail with ${sourceCount} source links and ${completionPercent}% profile buildout.`,
        creator: {
          "@type": "Organization",
          name: "RepWatchr",
          url: "https://www.repwatchr.com",
        },
      },
    },
  ];
}
