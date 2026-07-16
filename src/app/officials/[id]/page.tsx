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
import CategoryBreakdown from "@/components/scores/CategoryBreakdown";
import CampaignFinanceSourcePanel from "@/components/funding/CampaignFinanceSourcePanel";
import MoneyTrailSection from "@/components/money/MoneyTrailSection";
import VoteTimeline from "@/components/votes/VoteTimeline";
import RedFlagCard from "@/components/shared/RedFlagCard";
import { OfficialProfileHero, ProfileSnapshot } from "@/components/officials/OfficialProfileExperience";
import OfficialStoryProfile from "@/components/officials/OfficialStoryProfile";
import ProfileQuickNav from "@/components/officials/ProfileQuickNav";
import OfficialVotingSection from "@/components/voting/OfficialVotingSection";
import CommentSection from "@/components/comments/CommentSection";
import ShareButtons from "@/components/shared/ShareButtons";
import ProfileOpenTracker from "@/components/shared/ProfileOpenTracker";
import NextUsefulMove from "@/components/shared/NextUsefulMove";
import PublicContentRulesPanel from "@/components/shared/PublicContentRulesPanel";
import ProfileScorecardVote from "@/components/scorecards/ProfileScorecardVote";
import OfficialSocialPanel from "@/components/officials/OfficialSocialPanel";
import { getPublicProfileOverlay, type PublicProfileEnrichmentItem, type PublicProfileOverlay, type PublicProfileVoteSnapshot } from "@/lib/profile-overlays";
import { buildOfficialCompletionSnapshot } from "@/lib/profile-completion";
import { getCongressTradingSnapshot } from "@/lib/congress-trading";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";
import { breadcrumbJsonLd, jsonLd, profilePageJsonLd } from "@/lib/structured-data";
import { buildOfficialDossier, type DossierSourceGroup, type DossierTimelineItem } from "@/lib/official-dossier";
import { getMoneyTrailForOfficial } from "@/lib/money-trail";
import { getOfficialVerifiedBrief } from "@/data/official-verified-briefs";
import { getOfficialPerformanceGrade } from "@/data/official-performance-grades";
import type { Official, PublicVoteRecord, RedFlag, ScoredVote } from "@/types";

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
  return buildRepWatchrMetadata({
    title,
    description,
    path: `/officials/${official.id}`,
    imagePath: buildOgImageUrl("official", { id: official.id }),
    imageAlt: `${official.name} RepWatchr profile`,
    type: "profile",
  });
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
  const moneyTrail = getMoneyTrailForOfficial(id);
  const redFlags = getRedFlags(id);
  const sourceBackedRedFlags = redFlags.filter((flag) => Boolean(flag.sourceUrl));
  const issueCategories = getIssueCategories();
  const relatedNews = getNewsByOfficialId(id);
  const publicVoteRecord = getPublicVoteRecord(id);
  const congressTrading = getCongressTradingSnapshot(id);
  const profileOverlay = await getPublicProfileOverlay("official", id);
  const verifiedBrief = getOfficialVerifiedBrief(id);
  const performanceGrade = getOfficialPerformanceGrade(id);
  const staticCompletion = buildOfficialCompletionSnapshot(official);
  const sourceLinks = official.sourceLinks ?? [];
  const overlayPublicRecords = profileOverlay.enrichmentItems.filter((item) => item.category !== "news");
  const overlayNews = profileOverlay.enrichmentItems.filter((item) => item.category === "news");
  const overlayCompletionPercent = profileOverlay.completion?.completionPercent ?? 0;
  const buildoutPercent = Math.max(overlayCompletionPercent, staticCompletion.completionPercent);
  const buildoutComplete = Boolean(profileOverlay.completion?.isComplete || staticCompletion.isComplete);
  const buildoutMissingItems = buildoutComplete
    ? []
    : profileOverlay.completion?.missingItems ?? staticCompletion.missingItems;
  const dossier = buildOfficialDossier({
    official,
    scoreCard,
    funding,
    redFlags: sourceBackedRedFlags,
    relatedNews,
    publicVoteRecord,
    overlay: profileOverlay,
    congressTrading,
    buildoutPercent,
    missingItems: buildoutMissingItems,
  });
  const profileDescription = `Source-backed RepWatchr profile for ${official.name}, ${official.position} serving ${official.jurisdiction}.`;
  const profileStructuredData = profilePageJsonLd({
    name: official.name,
    path: `/officials/${official.id}`,
    description: profileDescription,
    jobTitle: official.position,
    image: official.photo,
    jurisdiction: official.jurisdiction,
  });
  const breadcrumbStructuredData = breadcrumbJsonLd([
    { name: "RepWatchr", path: "/" },
    { name: "Officials", path: "/officials" },
    { name: official.name, path: `/officials/${official.id}` },
  ]);

  if (verifiedBrief) {
    return (
      <div className="min-h-screen bg-[#f8fbff] text-slate-950">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(profileStructuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbStructuredData) }}
        />
        <ProfileOpenTracker
          profileId={official.id}
          profileType="official"
          path={`/officials/${official.id}`}
          level={official.level}
        />
        <OfficialProfileHero
          official={official}
          sourceCount={dossier.sourceCount}
          buildoutPercent={buildoutPercent}
          buildoutComplete={buildoutComplete}
          voteRecord={publicVoteRecord}
          funding={funding}
          performanceGrade={performanceGrade}
          heroSummary={verifiedBrief.storyLead}
        />
        <ProfileQuickNav storyMode />
        <OfficialStoryProfile
          official={official}
          brief={verifiedBrief}
          voteRecord={publicVoteRecord}
          performanceGrade={performanceGrade}
          sourceCount={dossier.sourceCount}
        />
      </div>
    );
  }

  const allScoredVotes = scoreCard
    ? Object.values(scoreCard.categories).flatMap((c) => c.votes)
    : [];

  return (
    <div className="min-h-screen bg-[#f8fbff] text-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(profileStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbStructuredData) }}
      />
      <ProfileOpenTracker
        profileId={official.id}
        profileType="official"
        path={`/officials/${official.id}`}
        level={official.level}
      />
      <OfficialProfileHero
        official={official}
        sourceCount={dossier.sourceCount}
        buildoutPercent={buildoutPercent}
        buildoutComplete={buildoutComplete}
        voteRecord={publicVoteRecord}
        funding={funding}
        performanceGrade={performanceGrade}
      />
      <ProfileQuickNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfileSnapshot
          official={official}
          sourceCount={dossier.sourceCount}
          buildoutPercent={buildoutPercent}
          buildoutComplete={buildoutComplete}
          voteRecord={publicVoteRecord}
          funding={funding}
          missingItems={buildoutMissingItems}
        />
        <div id="record" className="mb-8 scroll-mt-24 space-y-4">
          <RecordSummaryPanel
            official={official}
            summary={dossier.plainEnglishSummary}
            confirmed={dossier.confirmed}
            needsReview={dossier.needsReview}
          />
          <SourceTrailPanel groups={dossier.sourceGroups} />
          <ScoreMethodologyPanel
            scoreStatus={dossier.scoreStatus}
            hasScoreCard={Boolean(scoreCard)}
            voteRows={publicVoteRecord?.summary.totalVotesLoaded ?? 0}
          />
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
              <ScoreImpactVoteTable votes={allScoredVotes} />
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

        <section id="money" className="scroll-mt-24">
          {moneyTrail ? <MoneyTrailSection trail={moneyTrail} /> : <CampaignFinanceSourcePanel official={official} />}
        </section>

        <ProfileTimelinePanel items={dossier.timeline} />

        <section className="mt-8 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                Connected records
              </p>
              <h2 className="mt-1 text-xl font-black text-gray-950">
                Open the source trails tied to {official.name}.
              </h2>
            </div>
            <Link
              href={`/submit-source?target=${encodeURIComponent(official.id)}`}
              className="w-fit rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-red-800 transition hover:bg-white"
            >
              Submit a better source
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <RelatedRecordLink
              href={`/funding/${official.id}`}
              title="Funding trail"
              detail={funding ? "Donors, geography, source links." : "Campaign finance source path."}
            />
            <RelatedRecordLink
              href="/votes"
              title="Vote records"
              detail={publicVoteRecord ? `${publicVoteRecord.summary.totalVotesLoaded.toLocaleString()} roll-call rows loaded.` : "Open vote source inventory."}
            />
            <RelatedRecordLink
              href="/red-flags"
              title="Red flags"
              detail={`${sourceBackedRedFlags.length} source-linked review item${sourceBackedRedFlags.length === 1 ? "" : "s"} on this profile.`}
            />
            <RelatedRecordLink
              href="/news"
              title="Stories"
              detail={`${relatedNews.length} linked stor${relatedNews.length === 1 ? "y" : "ies"} in RepWatchr.`}
            />
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.85fr]">
          <NextUsefulMove
            recordPath={`/dashboard?watch=${encodeURIComponent(`/officials/${official.id}`)}&target=${encodeURIComponent(official.name)}`}
            sourcePath={`/submit-source?target=${encodeURIComponent(official.id)}`}
            packetPath={`/free-packet?target=${encodeURIComponent(official.name)}`}
            safeShareLine={`RepWatchr profile for ${official.name}: check the votes, funding, public sources, and review notes before sharing stronger claims.`}
            meetingQuestion={`What public record supports ${official.name}'s position on this issue, and where can constituents inspect it?`}
          />
          <PublicContentRulesPanel compact />
        </section>

        <section id="participate" className="mt-8 scroll-mt-24">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-wide text-red-700">
              Citizen layer grade
            </p>
            <h2 className="mt-1 text-xl font-black text-gray-950">
              Verified-resident questionnaire pilot
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

        {sourceBackedRedFlags.length > 0 && (
          <section className="mt-8">
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-wide text-red-700">
                Source-backed red flags
              </p>
              <h2 className="mt-1 text-xl font-bold text-red-700">
                Red Flags ({sourceBackedRedFlags.length})
              </h2>
              <p className="mt-1 max-w-4xl text-sm font-semibold leading-6 text-gray-600">
                These are not unsourced allegations. Each item must carry a public source and a public label before it
                appears on the profile.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <EvidenceLabel label="Confirmed record" tone="green" />
                <EvidenceLabel label="Public question" tone="blue" />
                <EvidenceLabel label="Allegation" tone="amber" />
                <EvidenceLabel label="Needs source" tone="red" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {sourceBackedRedFlags.map((flag) => (
                <div key={flag.id} className="space-y-2">
                  <RedFlagStatusLabel flag={flag} />
                  <RedFlagCard
                    flag={flag}
                    officialName={official.name}
                    jurisdiction={official.jurisdiction}
                    sharePath={`/red-flags?flag=${encodeURIComponent(flag.id)}#red-flag-${flag.id}`}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {overlayPublicRecords.length === 0 && !congressTrading && sourceBackedRedFlags.length === 0 && (
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

        <PublicQuestionsPanel official={official} questions={dossier.publicQuestions} />

        <DossierActionsPanel official={official} sourceCount={dossier.sourceCount} />

        {/* Public Discussion */}
        <CommentSection
          officialId={official.id}
          officialName={official.name}
        />
      </div>
    </div>
  );
}

function RelatedRecordLink({
  href,
  title,
  detail,
}: {
  href: string;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
    >
      <p className="text-sm font-black text-blue-950">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{detail}</p>
    </Link>
  );
}

function RecordSummaryPanel({
  official,
  summary,
  confirmed,
  needsReview,
}: {
  official: Official;
  summary: string;
  confirmed: string[];
  needsReview: string[];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Record summary</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">{official.name} accountability dossier</h2>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-700">{summary}</p>
        </div>
        <Link
          href="/methodology"
          className="w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-blue-800 transition hover:bg-white"
        >
          Methodology
        </Link>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <SummaryList title="What is confirmed" tone="green" items={confirmed} />
        <SummaryList title="What needs more source review" tone="amber" items={needsReview} />
      </div>
    </section>
  );
}

function SummaryList({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "green" | "amber";
  items: string[];
}) {
  const toneClasses =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-amber-200 bg-amber-50 text-amber-950";

  return (
    <div className={`rounded-xl border p-4 ${toneClasses}`}>
      <h3 className="text-sm font-black uppercase tracking-wide">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <li key={item} className="flex gap-2 text-sm font-semibold leading-6">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
              <span>{item}</span>
            </li>
          ))
        ) : (
          <li className="text-sm font-semibold leading-6">No item is loaded for this section yet.</li>
        )}
      </ul>
    </div>
  );
}

function SourceTrailPanel({ groups }: { groups: DossierSourceGroup[] }) {
  return (
    <section id="sources" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Source trail</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">Every claim should point back to a public receipt.</h2>
        <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
          Official links, votes, funding, meetings, articles, corrections, red flags, and disclosure records are split
          apart so a reader can see what is loaded and what still needs a source.
        </p>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {groups.map((group) => (
          <SourceGroupCard key={group.id} group={group} />
        ))}
      </div>
    </section>
  );
}

function SourceGroupCard({ group }: { group: DossierSourceGroup }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-950">{group.title}</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{group.description}</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-black text-slate-700">
          {group.links.length}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {group.links.length > 0 ? (
          group.links.slice(0, 4).map((source) => (
            <a
              key={`${group.id}-${source.url}`}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-blue-800 transition hover:border-blue-300 hover:bg-blue-50"
            >
              <span className="line-clamp-1">{source.title}</span>
              <span className="mt-0.5 block line-clamp-2 text-[11px] font-semibold leading-4 text-slate-500">
                {source.detail}
              </span>
            </a>
          ))
        ) : (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-900">
            {group.emptyText}
          </p>
        )}
      </div>
    </div>
  );
}

function ScoreMethodologyPanel({
  scoreStatus,
  hasScoreCard,
  voteRows,
}: {
  scoreStatus: {
    label: string;
    detail: string;
    methodologyDetail: string;
  };
  hasScoreCard: boolean;
  voteRows: number;
}) {
  return (
    <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-800">Score / methodology</p>
          <h2 className="mt-1 text-2xl font-black text-blue-950">{scoreStatus.label}</h2>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-blue-950">{scoreStatus.detail}</p>
          <p className="mt-2 max-w-5xl text-xs font-bold leading-5 text-blue-900">{scoreStatus.methodologyDetail}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:min-w-72">
          <div className="rounded-xl border border-blue-200 bg-white px-4 py-3">
            <p className="text-2xl font-black text-blue-950">{hasScoreCard ? "Yes" : "No"}</p>
            <p className="text-[11px] font-black uppercase tracking-wide text-blue-700">Scored rules</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-white px-4 py-3">
            <p className="text-2xl font-black text-blue-950">{voteRows.toLocaleString()}</p>
            <p className="text-[11px] font-black uppercase tracking-wide text-blue-700">Vote rows</p>
          </div>
          <Link
            href="/methodology"
            className="col-span-2 rounded-xl border border-blue-700 bg-blue-700 px-4 py-3 text-center text-xs font-black uppercase tracking-wide text-white transition hover:bg-blue-800"
          >
            Open methodology
          </Link>
        </div>
      </div>
    </section>
  );
}

function ScoreImpactVoteTable({ votes }: { votes: ScoredVote[] }) {
  const sortedVotes = [...votes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">Vote table</p>
        <h3 className="text-lg font-black text-slate-950">Scored votes and score impact</h3>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
          These rows show the local scorecard impact, not every public vote cast by the official.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-white text-xs font-black uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Bill / source</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Vote</th>
              <th className="px-4 py-3">Score impact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sortedVotes.map((vote) => (
              <tr key={`${vote.billId}-${vote.date}`} className="bg-white">
                <td className="px-4 py-3">
                  <Link href={`/votes/${vote.billId}`} className="font-black text-blue-800 hover:underline">
                    {vote.billTitle}
                  </Link>
                  <span className="mt-1 block text-xs font-semibold text-slate-500">{vote.date}</span>
                </td>
                <td className="px-4 py-3 font-bold text-slate-700">{vote.category}</td>
                <td className="px-4 py-3 font-bold uppercase text-slate-700">{vote.officialVote}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-black ${
                      vote.aligned ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
                    }`}
                  >
                    {vote.aligned ? "Aligned" : "Not aligned"} | weight {vote.weight}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProfileTimelinePanel({ items }: { items: DossierTimelineItem[] }) {
  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Timeline</p>
      <h2 className="mt-1 text-xl font-black text-slate-950">Public dates and sourced events</h2>
      <p className="mt-1 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
        Dates are included only when a source-backed event, import, or profile record provides one.
      </p>
      <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="bg-white px-4 py-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    {item.label} | {formatDossierDate(item.date)}
                  </p>
                  <h3 className="mt-1 text-sm font-black text-slate-950">{item.title}</h3>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{item.detail}</p>
                </div>
                {item.sourceUrl ? (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-800 hover:bg-white"
                  >
                    Source
                  </a>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <p className="bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
            No dated source events are loaded yet. Submit a public record with a clear date to build the timeline.
          </p>
        )}
      </div>
    </section>
  );
}

function formatDossierDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function EvidenceLabel({ label, tone }: { label: string; tone: "green" | "blue" | "amber" | "red" }) {
  const classes = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    red: "border-red-200 bg-red-50 text-red-800",
  }[tone];

  return <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${classes}`}>{label}</span>;
}

function redFlagEvidenceLabel(flag: RedFlag): { label: string; tone: "green" | "blue" | "amber" | "red" } {
  const source = flag.sourceUrl.toLowerCase();
  const text = `${flag.title} ${flag.description}`.toLowerCase();
  if (!source) return { label: "Needs source", tone: "red" };
  if (source.includes(".gov") || source.includes("house.gov") || source.includes("senate.gov") || source.includes("fec.gov")) {
    return { label: "Confirmed record", tone: "green" };
  }
  if (text.includes("alleged") || text.includes("allegation") || text.includes("reported")) {
    return { label: "Allegation", tone: "amber" };
  }
  return { label: "Public question", tone: "blue" };
}

function RedFlagStatusLabel({ flag }: { flag: RedFlag }) {
  const status = redFlagEvidenceLabel(flag);
  return <EvidenceLabel label={status.label} tone={status.tone} />;
}

function PublicQuestionsPanel({ official, questions }: { official: Official; questions: string[] }) {
  return (
    <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Public questions</p>
      <h2 className="mt-1 text-xl font-black text-slate-950">Questions voters and reporters can ask</h2>
      <p className="mt-1 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
        These questions are written to ask for records, not to overstate what the profile proves about {official.name}.
      </p>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {questions.map((question, index) => (
          <label key={question} className="block rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Question {index + 1}</span>
            <textarea
              readOnly
              value={question}
              rows={3}
              className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold leading-6 text-slate-800"
            />
          </label>
        ))}
      </div>
    </section>
  );
}

function DossierActionsPanel({ official, sourceCount }: { official: Official; sourceCount: number }) {
  return (
    <section id="dossier-actions" className="mt-10 rounded-2xl border border-slate-300 bg-slate-950 p-5 text-white shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">Actions</p>
      <h2 className="mt-1 text-2xl font-black">Help improve this profile without overclaiming the proof.</h2>
      <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-200">
        This dossier has {sourceCount.toLocaleString()} public source link{sourceCount === 1 ? "" : "s"}. If a record is missing,
        submit the source, request a brief, or watch the profile for updates.
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Link
          href={`/submit-source?target=${encodeURIComponent(official.id)}&type=correction`}
          className="rounded-xl border border-white/10 bg-white px-4 py-3 text-center text-sm font-black text-slate-950 hover:bg-blue-50"
        >
          Submit correction
        </Link>
        <Link
          href={`/submit-source?target=${encodeURIComponent(official.id)}`}
          className="rounded-xl border border-amber-300 bg-amber-300 px-4 py-3 text-center text-sm font-black text-slate-950 hover:bg-amber-200"
        >
          Submit source
        </Link>
        <Link
          href={`/services/official-record-brief?official=${encodeURIComponent(official.id)}`}
          className="rounded-xl border border-red-300 bg-red-600 px-4 py-3 text-center text-sm font-black text-white hover:bg-red-700"
        >
          Request official brief
        </Link>
        <Link
          href={`/dashboard?watch=${encodeURIComponent(`/officials/${official.id}`)}&target=${encodeURIComponent(official.name)}`}
          className="rounded-xl border border-blue-300 bg-blue-600 px-4 py-3 text-center text-sm font-black text-white hover:bg-blue-700"
        >
          Watch profile
        </Link>
        <Link
          href={`/officials/${official.id}`}
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-center text-sm font-black text-white hover:bg-white/20"
        >
          Share profile
        </Link>
      </div>
      <div className="mt-5">
        <ShareButtons
          title={`${official.name} - ${official.position} | RepWatchr`}
          description={`Source-backed RepWatchr dossier for ${official.name}.`}
          path={`/officials/${official.id}`}
          template="confirmed_record"
          subject={`${official.name} public accountability dossier`}
          sourceLabel="official links, voting records, funding sources, public questions, and review gaps"
          className="bg-white text-slate-950"
        />
      </div>
    </section>
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
  if (isJudicialOfficial(official)) {
    return [
      {
        title: "Texas Supreme Court orders and opinions",
        url: "https://www.txcourts.gov/supreme/orders-opinions/",
      },
      {
        title: "Texas Supreme Court case search",
        url: "https://search.txcourts.gov/CaseSearch.aspx?coa=cossup",
      },
      {
        title: "Texas Supreme Court justices",
        url: "https://www.txcourts.gov/supreme/about-the-court/justices/",
      },
    ];
  }
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

function isJudicialOfficial(official: Official) {
  const text = `${official.position} ${official.jurisdiction}`.toLowerCase();
  return text.includes("supreme court") || text.includes("court of criminal appeals");
}

function VoteRecordSourcePanel({ official }: { official: Official }) {
  const sources = voteSourceLinksForOfficial(official);
  const judicial = isJudicialOfficial(official);

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-amber-800">
        {judicial ? "Public judicial record snapshot" : "Public vote record snapshot"}
      </p>
      <h2 className="mt-1 text-xl font-black text-gray-950">
        {judicial ? "Decision source path loaded" : "Vote source path loaded"}
      </h2>
      <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-amber-950">
        {judicial
          ? "Judicial records are tracked through opinions, orders, and case documents, not legislative roll-call votes. RepWatchr has the official source path loaded, but a static decision snapshot has not been imported yet."
          : "This profile has a public vote-source path, but RepWatchr has not loaded a static roll-call snapshot for this office yet. That is a data gap, not a clean voting record."}
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
            Source-backed roll-call votes counted from official public records through {record.lastUpdated}. The newest rows are shown below; these votes are not automatically scored left or right until issue mapping is reviewed.
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
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-gray-500">
          Latest {record.votes.length} stored roll-call rows
        </div>
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
