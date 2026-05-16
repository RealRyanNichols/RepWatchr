import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  getOfficialWithScores,
  getScoreCard,
  getFundingSummary,
  getRedFlags,
  getIssueCategories,
  getNewsByOfficialId,
  getPublicVoteRecord,
} from "@/lib/data";
import { buildFallbackIdeologyProfile, getOfficialIdeologyProfile } from "@/lib/ideology";
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
import IdeologyChart from "@/components/officials/IdeologyChart";
import OfficialVotingSection from "@/components/voting/OfficialVotingSection";
import GradeOfficialSection from "@/components/voting/GradeOfficialSection";
import CommentSection from "@/components/comments/CommentSection";
import ShareButtons from "@/components/shared/ShareButtons";
import ReportButton from "@/components/shared/ReportButton";
import ProfileOpenTracker from "@/components/shared/ProfileOpenTracker";
import ProfileScorecardVote from "@/components/scorecards/ProfileScorecardVote";
import OfficialSocialPanel from "@/components/officials/OfficialSocialPanel";
import { getPublicProfileOverlay, type PublicProfileEnrichmentItem, type PublicProfileOverlay, type PublicProfileVoteSnapshot } from "@/lib/profile-overlays";
import { buildOfficialCompletionSnapshot } from "@/lib/profile-completion";

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
  return {
    title: `${official.name} - ${official.position}`,
    description: `Source-backed RepWatchr profile for ${official.name}, ${official.position} serving ${official.jurisdiction}.`,
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
  const ideologyProfile = getOfficialIdeologyProfile(id) ?? buildFallbackIdeologyProfile(official);
  const profileOverlay = await getPublicProfileOverlay("official", id);
  const staticCompletion = buildOfficialCompletionSnapshot(official);
  const sourceLinks = official.sourceLinks ?? [];
  const contactEmail = official.contactInfo.email;
  const contactIsUrl = contactEmail?.startsWith("http://") || contactEmail?.startsWith("https://");
  const overlayPublicRecords = profileOverlay.enrichmentItems.filter((item) => item.category !== "news");
  const overlayNews = profileOverlay.enrichmentItems.filter((item) => item.category === "news");
  const buildoutPercent = profileOverlay.completion?.completionPercent ?? staticCompletion.completionPercent;
  const buildoutComplete = profileOverlay.completion?.isComplete ?? staticCompletion.isComplete;
  const buildoutMissingItems = profileOverlay.completion?.missingItems ?? staticCompletion.missingItems;

  const allScoredVotes = scoreCard
    ? Object.values(scoreCard.categories).flatMap((c) => c.votes)
    : [];

  const partyColor = getPartyColor(official.party);

  return (
    <div className="min-h-screen bg-[#f8fbff] text-slate-950">
      <ProfileOpenTracker
        profileId={official.id}
        profileType="official"
        path={`/officials/${official.id}`}
        level={official.level}
      />
      {/* Hero */}
      <section
        className="border-b-4 bg-white text-slate-950"
        style={{ borderBottomColor: partyColor }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Mobile: stacked layout, Desktop: side by side */}
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <figure className="shrink-0">
              <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 text-2xl font-bold text-gray-500 shadow-sm sm:h-28 sm:w-28 sm:text-3xl">
                {official.photo ? (
                  <Image
                    src={official.photo}
                    alt={`${official.name} profile photo`}
                    fill
                    sizes="(min-width: 640px) 112px, 80px"
                    className="object-cover"
                  />
                ) : (
                  <>
                    {official.firstName[0]}
                    {official.lastName[0]}
                  </>
                )}
              </div>
              {official.photoCredit ? (
                <figcaption className="mt-1 max-w-28 text-[10px] font-semibold leading-4 text-gray-500">
                  {official.photoCredit}
                </figcaption>
              ) : null}
            </figure>
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
                  {official.contactInfo.office && (
                    <span className="text-gray-600">
                      Office: {official.contactInfo.office}
                    </span>
                  )}
                  {official.contactInfo.phone && (
                    <span className="text-gray-600">
                      Phone: {official.contactInfo.phone}
                    </span>
                  )}
                  {contactEmail && (
                    <a
                      href={contactIsUrl ? contactEmail : `mailto:${contactEmail}`}
                      className="text-blue-600 hover:underline"
                      target={contactIsUrl ? "_blank" : undefined}
                      rel={contactIsUrl ? "noopener noreferrer" : undefined}
                    >
                      {contactIsUrl ? "Contact Form" : contactEmail}
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

        {overlayPublicRecords.length > 0 && (
          <ProfileOverlayEvidencePanel items={overlayPublicRecords} />
        )}

        <div className="mb-8">
          <IdeologyChart profile={ideologyProfile} />
        </div>

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

            {publicVoteRecord && publicVoteRecord.votes.length > 0 && (
              <FederalVoteRecordPanel record={publicVoteRecord} />
            )}

            {profileOverlay.voteSnapshots.length > 0 && (
              <ProfileOverlayVotesPanel votes={profileOverlay.voteSnapshots} />
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
            <ProfileScorecardVote
              targetType="official"
              targetId={official.id}
              targetName={official.name}
              targetPath={`/officials/${official.id}`}
            />

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

            {sourceLinks.length > 0 && (
              <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900">Public Sources</h2>
                <p className="mt-1 text-xs font-semibold text-gray-500">
                  Last verified: {official.lastVerifiedAt ?? "source review pending"}
                </p>
                <div className="mt-4 space-y-2">
                  {sourceLinks.map((source) => (
                    <a
                      key={`${source.title}-${source.url}`}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-blue-50"
                    >
                      <span>{source.title}</span>
                      <span className="shrink-0 text-xs uppercase tracking-wide">Open</span>
                    </a>
                  ))}
                </div>
              </section>
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

        {overlayNews.length > 0 && (
          <ProfileOverlayEvidencePanel items={overlayNews} title="Latest Source-Linked Updates" />
        )}

        {profileOverlay.publicStatements.length > 0 && (
          <ProfileOverlayStatementsPanel overlay={profileOverlay} />
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
  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-blue-700">
            Public vote record snapshot
          </p>
          <h2 className="mt-1 text-xl font-black text-gray-950">
            Recent federal roll calls
          </h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-gray-600">
            Source-backed roll-call votes loaded from official House and Senate records. These are not automatically scored left or right until issue mapping is reviewed.
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
