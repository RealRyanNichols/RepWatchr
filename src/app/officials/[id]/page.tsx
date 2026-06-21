import type { Metadata } from "next";
import Link from "next/link";
import {
  getOfficialWithScores,
  getScoreCard,
  getFundingSummary,
  getRedFlags,
  getIssueCategories,
  getNewsByOfficialId,
  getPublicVoteRecord,
} from "@/lib/data";
import { buildConstitutionalAlignmentProfile } from "@/lib/constitutional-alignment";
import { buildFallbackIdeologyProfile, getOfficialIdeologyProfile } from "@/lib/ideology";
import { formatLevelName, getPartyColor } from "@/lib/formatting";
import ScoreGauge from "@/components/scores/ScoreGauge";
import CategoryBreakdown from "@/components/scores/CategoryBreakdown";
import CampaignFundingSection from "@/components/funding/CampaignFundingSection";
import CampaignFinanceSourcePanel from "@/components/funding/CampaignFinanceSourcePanel";
import VoteTimeline from "@/components/votes/VoteTimeline";
import RedFlagCard from "@/components/shared/RedFlagCard";
import PartyBadge from "@/components/officials/PartyBadge";
import IdeologyChart from "@/components/officials/IdeologyChart";
import ConstitutionalAlignmentMeter from "@/components/officials/ConstitutionalAlignmentMeter";
import OfficialVotingSection from "@/components/voting/OfficialVotingSection";
import CommentSection from "@/components/comments/CommentSection";
import ShareButtons from "@/components/shared/ShareButtons";
import ReportButton from "@/components/shared/ReportButton";
import ProfileOpenTracker from "@/components/shared/ProfileOpenTracker";
import ProfileScorecardVote from "@/components/scorecards/ProfileScorecardVote";
import OfficialSocialPanel from "@/components/officials/OfficialSocialPanel";
import OfficialPhotoImage, { FEATURED_OFFICIAL_PHOTO_QUALITY } from "@/components/shared/OfficialPhotoImage";
import { getPublicProfileOverlay, type PublicProfileEnrichmentItem, type PublicProfileOverlay, type PublicProfileVoteSnapshot } from "@/lib/profile-overlays";
import { buildOfficialCompletionSnapshot } from "@/lib/profile-completion";
import { getCongressTradingSnapshot } from "@/lib/congress-trading";
import type { Official, PublicVoteRecord } from "@/types";

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
  const ogImage = `/api/og/official?id=${encodeURIComponent(official.id)}`;

  return {
    title,
    description,
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
  const constitutionalAlignment = publicVoteRecord ? buildConstitutionalAlignmentProfile(publicVoteRecord) : null;
  const profileOverlay = await getPublicProfileOverlay("official", id);
  const staticCompletion = buildOfficialCompletionSnapshot(official);
  const sourceLinks = official.sourceLinks ?? [];
  const contactEmail = official.contactInfo.email;
  const contactIsUrl = contactEmail?.startsWith("http://") || contactEmail?.startsWith("https://");
  const overlayPublicRecords = profileOverlay.enrichmentItems.filter((item) => item.category !== "news");
  const overlayNews = profileOverlay.enrichmentItems.filter((item) => item.category === "news");
  const overlayCompletionPercent = profileOverlay.completion?.completionPercent ?? 0;
  const buildoutPercent = Math.max(overlayCompletionPercent, staticCompletion.completionPercent);
  const buildoutComplete = Boolean(profileOverlay.completion?.isComplete || staticCompletion.isComplete);
  const buildoutMissingItems = buildoutComplete
    ? []
    : profileOverlay.completion?.missingItems ?? staticCompletion.missingItems;

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
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:gap-7">
            <figure className="shrink-0">
              <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 text-3xl font-bold text-gray-500 shadow-md shadow-slate-950/10 sm:h-44 sm:w-44 sm:rounded-3xl sm:text-5xl">
                <OfficialPhotoImage
                  official={official}
                  sizes="(min-width: 640px) 352px, 224px"
                  quality={FEATURED_OFFICIAL_PHOTO_QUALITY}
                  preload
                  className="object-cover"
                  fallbackClassName="grid h-full w-full place-items-center text-center font-black uppercase tracking-wide text-gray-500"
                />
              </div>
              {official.photoCredit ? (
                <figcaption className="mt-1 max-w-44 text-[10px] font-semibold leading-4 text-gray-500">
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
        <div className="mb-8 space-y-4">
          <IdeologyChart profile={ideologyProfile} />
          {constitutionalAlignment ? (
            <ConstitutionalAlignmentMeter profile={constitutionalAlignment} />
          ) : null}
        </div>

        <div className="space-y-8">
          {scoreCard && (
            <section>
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Issue Scorecard
              </h2>
              <CategoryBreakdown
                categories={scoreCard.categories}
                issueCategories={issueCategories}
              />
            </section>
          )}

          {!scoreCard && (
            <IssueScorecardStatusPanel official={official} record={publicVoteRecord} />
          )}

          {allScoredVotes.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Voting Record
              </h2>
              <VoteTimeline votes={allScoredVotes} />
            </section>
          )}

          {publicVoteRecord && publicVoteRecord.votes.length > 0 && (
            <FederalVoteRecordPanel record={publicVoteRecord} />
          )}

          {!publicVoteRecord && (
            <VoteRecordSourcePanel official={official} />
          )}

          {profileOverlay.voteSnapshots.length > 0 && (
            <ProfileOverlayVotesPanel votes={profileOverlay.voteSnapshots} />
          )}

          {official.campaignPromises &&
            official.campaignPromises.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-bold text-gray-900">
                  Campaign Promises
                </h2>
                <ul className="space-y-2">
                  {official.campaignPromises.map((promise, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-gray-700"
                    >
                      <span className="mt-1 text-blue-500">&#9679;</span>
                      {promise}
                    </li>
                  ))}
                </ul>
              </section>
            )}
        </div>

        {funding ? (
          <CampaignFundingSection funding={funding} />
        ) : (
          <CampaignFinanceSourcePanel official={official} />
        )}

        <section className="mt-8">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-wide text-red-700">
              Citizen layer grade
            </p>
            <h2 className="mt-1 text-xl font-black text-gray-950">
              Verified voter questionnaire
            </h2>
            <p className="mt-1 max-w-4xl text-sm font-semibold leading-6 text-gray-600">
              This is where verified users answer whether they would vote for the official again, how they voted last time, what changed, and what issue should drive the public grade.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <ProfileScorecardVote
              targetType="official"
              targetId={official.id}
              targetName={official.name}
              targetPath={`/officials/${official.id}`}
              officialState={official.state}
              officialDistrict={official.district}
              officialCounties={official.county}
            />
            <OfficialVotingSection
              officialId={official.id}
              officialCounties={official.county}
            />
          </div>
        </section>

        {(overlayPublicRecords.length > 0 || congressTrading) && (
          <div className="mt-8 space-y-6">
            {overlayPublicRecords.length > 0 && (
              <ProfileOverlayEvidencePanel items={overlayPublicRecords} />
            )}

            {congressTrading && (
              <CongressTradingDisclosurePanel snapshot={congressTrading} />
            )}
          </div>
        )}

        {redFlags.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 text-xl font-bold text-red-700">
              Red Flags ({redFlags.length})
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {redFlags.map((flag) => (
                <RedFlagCard key={flag.id} flag={flag} />
              ))}
            </div>
          </section>
        )}

        {overlayPublicRecords.length === 0 && !congressTrading && redFlags.length === 0 && (
          <PublicRecordsReviewPanel official={official} />
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
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

          {sourceLinks.length > 0 && (
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-3">
              <h2 className="text-lg font-bold text-gray-900">Public Sources</h2>
              <p className="mt-1 text-xs font-semibold text-gray-500">
                Last verified: {official.lastVerifiedAt ?? "source review pending"}
              </p>
              <div className="mt-4 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
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

function IssueScorecardStatusPanel({
  official,
  record,
}: {
  official: Official;
  record?: PublicVoteRecord;
}) {
  const voteCount = record?.summary.totalVotesLoaded ?? 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-blue-700">
            Issue scorecard
          </p>
          <h2 className="mt-1 text-xl font-black text-gray-950">
            Scorecard rule review needed
          </h2>
          <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-gray-600">
            {voteCount > 0
              ? `${voteCount.toLocaleString()} source-backed roll-call rows are loaded for ${official.name}. RepWatchr has not attached reviewed issue-score rules to this profile yet, so the grade should not be treated as neutral or clean.`
              : `RepWatchr has the public profile sources for ${official.name}, but no vote rows are loaded yet. The issue scorecard stays in source-review mode until public votes and issue rules are attached.`}
          </p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-right">
          <p className="text-3xl font-black text-blue-950">{voteCount.toLocaleString()}</p>
          <p className="text-xs font-black uppercase tracking-wide text-blue-700">Votes loaded</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <ReviewStep label="1" title="Load public votes" done={voteCount > 0} />
        <ReviewStep label="2" title="Map issue rules" done={false} />
        <ReviewStep label="3" title="Publish scored grade" done={false} />
      </div>
    </section>
  );
}

function ReviewStep({ label, title, done }: { label: string; title: string; done: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <span
          className={`grid h-8 w-8 place-items-center rounded-full text-sm font-black ${
            done ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"
          }`}
        >
          {label}
        </span>
        <p className="text-sm font-black text-slate-950">{title}</p>
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
        {done ? "Source data is loaded." : "Still requires source-backed review before it can move a public grade."}
      </p>
    </div>
  );
}

function voteSourceLinksForOfficial(official: Official) {
  if (official.level === "federal" && official.position === "U.S. Senator") {
    return [
      {
        title: "Senate roll-call vote menu",
        url: "https://www.senate.gov/legislative/votes_new.htm",
      },
    ];
  }
  if (official.level === "federal" && official.position === "U.S. Representative") {
    return [
      {
        title: "House Clerk roll-call votes",
        url: "https://clerk.house.gov/Votes",
      },
    ];
  }
  if (official.state === "TX" || official.jurisdiction.startsWith("Texas ")) {
    return [
      {
        title: "Texas Legislature Online vote information",
        url: "https://capitol.texas.gov/billlookup/voteinfo.aspx",
      },
    ];
  }
  return official.sourceLinks ?? [];
}

function VoteRecordSourcePanel({ official }: { official: Official }) {
  const sources = voteSourceLinksForOfficial(official);

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-amber-800">
        Public vote record snapshot
      </p>
      <h2 className="mt-1 text-xl font-black text-gray-950">Vote source path loaded</h2>
      <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-amber-950">
        This profile has a public vote-source path, but RepWatchr has not loaded a static roll-call snapshot for this
        office yet. That is a data gap, not a clean voting record.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {sources.map((source) => (
          <a
            key={`${source.title}-${source.url}`}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-black text-amber-900 transition hover:bg-amber-100"
          >
            {source.title}
          </a>
        ))}
      </div>
    </section>
  );
}

function PublicRecordsReviewPanel({ official }: { official: Official }) {
  const sources = official.sourceLinks ?? [];

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-red-700">
            Source-backed overlay
          </p>
          <h2 className="mt-1 text-xl font-black text-gray-950">Public Records & Controversies</h2>
          <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-gray-600">
            No source-linked controversy item is loaded for {official.name} in the static profile review. Readers can
            still inspect the official sources below or submit a public record for review.
          </p>
        </div>
        <Link
          href={`/submit-source?target=${encodeURIComponent(official.id)}`}
          className="w-fit rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-red-800 transition hover:bg-white"
        >
          Submit source
        </Link>
      </div>
      {sources.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {sources.slice(0, 6).map((source) => (
            <a
              key={`${source.title}-${source.url}`}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-blue-800 transition hover:border-blue-200 hover:bg-blue-50"
            >
              {source.title}
            </a>
          ))}
        </div>
      ) : null}
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
            {isComplete ? "Core profile loaded" : "Profile still being built"}
          </h2>
        </div>
        <p className="text-3xl font-black">{percent}%</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80">
        <div className={`h-full ${barClass}`} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
      </div>
      {isComplete ? (
        <p className="mt-3 text-sm font-semibold leading-6">
          This profile currently has the required core sections or source paths loaded.
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm font-semibold leading-6">
            This is not being treated as complete until the missing public-record sections or source paths are filled.
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
            Current public roll-call snapshot
          </h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-gray-600">
            Source-backed roll-call votes loaded from official public records through {record.lastUpdated}. These are not automatically scored left or right until issue mapping is reviewed.
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
