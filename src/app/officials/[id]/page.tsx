import type { Metadata } from "next";
import Link from "next/link";
import {
  getFundingSummary,
  getNewsByOfficialId,
  getOfficialWithScores,
  getPublicVoteRecord,
  getRedFlags,
  getScoreCard,
} from "@/lib/data";
import { OfficialProfileHero } from "@/components/officials/OfficialProfileExperience";
import OfficialAccountabilitySnapshot from "@/components/officials/OfficialAccountabilitySnapshot";
import OfficialStoryProfile from "@/components/officials/OfficialStoryProfile";
import ProfileQuickNav from "@/components/officials/ProfileQuickNav";
import UniversalOfficialDashboard from "@/components/officials/UniversalOfficialDashboard";
import ProfileOpenTracker from "@/components/shared/ProfileOpenTracker";
import { getPublicProfileOverlay } from "@/lib/profile-overlays";
import { buildOfficialCompletionSnapshot } from "@/lib/profile-completion";
import { getCongressTradingSnapshot } from "@/lib/congress-trading";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";
import { breadcrumbJsonLd, jsonLd, profilePageJsonLd } from "@/lib/structured-data";
import { buildOfficialDossier } from "@/lib/official-dossier";
import { getOfficialVerifiedBrief } from "@/data/official-verified-briefs";
import { getOfficialPerformanceGrade } from "@/data/official-performance-grades";
import { getOfficeAccountabilityProfile } from "@/lib/official-accountability";

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
      <div className="min-h-screen bg-[#f4f1e8] px-4 py-16 text-center text-[#15212b]">
        <h1 className="font-serif text-3xl font-bold">Official not found</h1>
        <p className="mt-2 text-[#69645b]">The requested public profile does not exist.</p>
        <Link href="/officials" className="mt-5 inline-flex font-bold text-[#204f77] underline underline-offset-4">
          Browse all officials
        </Link>
      </div>
    );
  }

  const scoreCardCandidate = getScoreCard(id);
  const scoreCard =
    scoreCardCandidate?.reviewStatus === "verified" || scoreCardCandidate?.reviewStatus === "complete"
      ? scoreCardCandidate
      : undefined;
  const fundingCandidate = getFundingSummary(id);
  const funding =
    fundingCandidate?.reviewStatus === "verified" || fundingCandidate?.reviewStatus === "complete"
      ? fundingCandidate
      : undefined;
  const sourceBackedRedFlags = getRedFlags(id).filter(
    (flag) =>
      Boolean(flag.sourceUrl) &&
      (flag.reviewerStatus === "verified" || flag.reviewerStatus === "complete"),
  );
  const relatedNews = getNewsByOfficialId(id);
  const publicVoteRecord = getPublicVoteRecord(id);
  const congressTrading = getCongressTradingSnapshot(id);
  const profileOverlay = await getPublicProfileOverlay("official", id);
  const verifiedBrief = getOfficialVerifiedBrief(id);
  const performanceGrade = getOfficialPerformanceGrade(id);
  const officeAccountability = getOfficeAccountabilityProfile(official);
  const applicablePerformanceGrade = officeAccountability.supportsLegislatorGrade
    ? performanceGrade
    : undefined;
  const staticCompletion = buildOfficialCompletionSnapshot(official);
  // Overlay completion snapshots predate the current role-aware evidence model.
  // Until they carry a compatible method version, the current static review is
  // the only safe publication source for completion language.
  const buildoutPercent = staticCompletion.completionPercent;
  const buildoutComplete = staticCompletion.isComplete;
  const buildoutMissingItems = buildoutComplete ? [] : staticCompletion.missingItems;
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

  const sharedProfileShell = (
    <>
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
        performanceGrade={applicablePerformanceGrade}
        heroSummary={
          verifiedBrief?.storyLead ??
          official.bio ??
          `A compact public dashboard for ${official.name}: overall grade state, voting activity, community sentiment, reviewed coverage, official links, and the evidence still missing.`
        }
      />
    </>
  );

  const universalDashboard = (
    <>
      <OfficialAccountabilitySnapshot
        official={official}
        performanceGrade={applicablePerformanceGrade}
        voteRecord={publicVoteRecord}
        relatedNews={relatedNews}
        redFlags={sourceBackedRedFlags}
        verifiedBrief={verifiedBrief}
      />
      <UniversalOfficialDashboard
        official={official}
        voteRecord={publicVoteRecord}
        funding={funding}
        relatedNews={relatedNews}
        redFlags={sourceBackedRedFlags}
        overlay={profileOverlay}
        sourceCount={dossier.sourceCount}
        buildoutPercent={buildoutPercent}
        buildoutComplete={buildoutComplete}
        missingItems={buildoutMissingItems}
        verifiedBrief={verifiedBrief}
      />
    </>
  );

  if (verifiedBrief) {
    return (
      <div className="min-h-screen bg-[#f4f1e8] text-[#15212b]">
        {sharedProfileShell}
        <ProfileQuickNav dashboardMode />
        <OfficialStoryProfile
          official={official}
          brief={verifiedBrief}
          sourceCount={dossier.sourceCount}
        />
        {universalDashboard}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f1e8] text-[#15212b]">
      {sharedProfileShell}
      <ProfileQuickNav dashboardMode />
      {universalDashboard}
    </div>
  );
}
