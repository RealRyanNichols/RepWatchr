import type {
  FundingSummary,
  GovernmentLevel,
  Official,
  OfficialProfileBuildout,
  PublicVoteRecord,
  RedFlag,
  ScoreCard,
} from "@/types";
import {
  getAllOfficials,
  getFundingSummary,
  getNewsByOfficialId,
  getPublicVoteRecord,
  getRedFlags,
  getScoreCard,
} from "@/lib/data";
import { getOfficialIdeologyProfile } from "@/lib/ideology";

export type ProfileCompletionKey =
  | "identity"
  | "term"
  | "public_sources"
  | "photo"
  | "contact"
  | "vote_record"
  | "left_right_chart"
  | "scorecard"
  | "funding"
  | "public_records"
  | "news"
  | "social_links";

export type ProfileCompletionPriority = "red" | "yellow" | "green";

export interface ProfileCompletionSnapshot {
  profileType: "official";
  profileId: string;
  profileName: string;
  profilePath: string;
  level: GovernmentLevel;
  state: string | null;
  jurisdiction: string;
  position: string;
  completionPercent: number;
  priority: ProfileCompletionPriority;
  isComplete: boolean;
  loadedItems: ProfileCompletionKey[];
  missingItems: ProfileCompletionKey[];
  sourceReviewStatus: "complete" | "needs_review";
  lastStaticReviewAt: string | null;
  summary: {
    hasPhoto: boolean;
    hasVoteRecord: boolean;
    voteRows: number;
    hasFunding: boolean;
    hasPublicRecords: boolean;
    publicRecordRows: number;
    hasNews: boolean;
    newsRows: number;
    hasSocialLinks: boolean;
    hasLeftRightChart: boolean;
  };
}

export interface ProfileCompletionDashboard {
  generatedAt: string;
  totalProfiles: number;
  completeProfiles: number;
  incompleteProfiles: number;
  averageCompletionPercent: number;
  federalStateProfiles: number;
  federalStateCompleteProfiles: number;
  federalStateAverageCompletionPercent: number;
  missingItemCounts: Array<{ key: ProfileCompletionKey; label: string; count: number }>;
  priorityCounts: Record<ProfileCompletionPriority, number>;
  stateRows: Array<{
    state: string;
    total: number;
    complete: number;
    averageCompletionPercent: number;
    missingPhotos: number;
    missingVotes: number;
    missingFunding: number;
    missingPublicRecords: number;
    missingNews: number;
  }>;
  lowestCompletionProfiles: ProfileCompletionSnapshot[];
}

export const profileCompletionLabels: Record<ProfileCompletionKey, string> = {
  identity: "Identity, office, and jurisdiction",
  term: "Term dates",
  public_sources: "Public source links",
  photo: "Profile photo",
  contact: "Official contact or website",
  vote_record: "Voting record",
  left_right_chart: "Rule-reviewed left/right chart",
  scorecard: "Issue scorecard",
  funding: "Campaign finance summary",
  public_records: "Public records and controversies review",
  news: "Related news links",
  social_links: "Public social or statement links",
};

const completionOrder: ProfileCompletionKey[] = [
  "identity",
  "term",
  "public_sources",
  "photo",
  "contact",
  "vote_record",
  "left_right_chart",
  "scorecard",
  "funding",
  "public_records",
  "news",
  "social_links",
];

function hasIdentity(official: Official) {
  return Boolean(official.name && official.position && official.jurisdiction && official.level);
}

function hasTerm(official: Official) {
  return Boolean(official.termStart && official.termEnd);
}

function hasPublicSources(official: Official) {
  return Boolean(
    official.sourceLinks?.length ||
      official.photoSourceUrl ||
      official.contactInfo.website,
  );
}

function hasContact(official: Official) {
  return Boolean(
    official.contactInfo.website ||
      official.contactInfo.email ||
      official.contactInfo.phone ||
      official.contactInfo.office,
  );
}

function hasSocialLinks(official: Official) {
  const social = official.contactInfo.socialMedia;
  return Boolean(
    social &&
      Object.values(social).some((value) => typeof value === "string" && value.length > 0),
  );
}

function hasRuleReviewedIdeology(officialId: string) {
  const ideologyProfile = getOfficialIdeologyProfile(officialId);
  return Boolean(
    ideologyProfile &&
      ideologyProfile.ideologyScore !== null &&
      ideologyProfile.mappedVoteCount > 0,
  );
}

function priorityFromPercent(completionPercent: number): ProfileCompletionPriority {
  if (completionPercent >= 85) return "green";
  if (completionPercent >= 55) return "yellow";
  return "red";
}

function buildStaticBuildout(
  official: Official,
  scoreCard: ScoreCard | undefined,
  voteRecord: PublicVoteRecord | undefined,
  funding: FundingSummary | undefined,
  redFlags: RedFlag[],
  newsRows: number,
): OfficialProfileBuildout {
  const hasRuleReviewedChart = hasRuleReviewedIdeology(official.id);
  const checks: Array<[ProfileCompletionKey, boolean]> = [
    ["identity", hasIdentity(official)],
    ["term", hasTerm(official)],
    ["public_sources", hasPublicSources(official)],
    ["photo", Boolean(official.photo)],
    ["contact", hasContact(official)],
    ["vote_record", Boolean(voteRecord?.votes.length || scoreCard)],
    ["left_right_chart", hasRuleReviewedChart],
    ["scorecard", Boolean(scoreCard)],
    ["funding", Boolean(funding)],
    ["public_records", redFlags.length > 0],
    ["news", newsRows > 0],
    ["social_links", hasSocialLinks(official)],
  ];

  const loadedCount = checks.filter(([, loaded]) => loaded).length;
  const missingItems = checks
    .filter(([, loaded]) => !loaded)
    .map(([key]) => profileCompletionLabels[key]);

  return {
    completionPercent: Math.round((loadedCount / checks.length) * 100),
    hasPhoto: Boolean(official.photo),
    hasBio: Boolean(official.bio),
    hasPublicSources: hasPublicSources(official),
    hasContactWebsite: Boolean(official.contactInfo.website),
    hasScorecard: Boolean(scoreCard),
    hasVoteRecord: Boolean(voteRecord?.votes.length || scoreCard),
    hasFundingSummary: Boolean(funding),
    hasRedFlagReview: redFlags.length > 0,
    hasNewsLinks: newsRows > 0,
    hasIdeologyChart: hasRuleReviewedChart,
    isComplete: missingItems.length === 0,
    missingItems,
  };
}

export function buildOfficialCompletionSnapshot(official: Official): ProfileCompletionSnapshot {
  const scoreCard = getScoreCard(official.id);
  const voteRecord = getPublicVoteRecord(official.id);
  const funding = getFundingSummary(official.id);
  const redFlags = getRedFlags(official.id);
  const newsRows = getNewsByOfficialId(official.id).length;
  const staticBuildout = buildStaticBuildout(
    official,
    scoreCard,
    voteRecord,
    funding,
    redFlags,
    newsRows,
  );
  const loadedItems = completionOrder.filter((key) => {
    switch (key) {
      case "identity":
        return hasIdentity(official);
      case "term":
        return hasTerm(official);
      case "public_sources":
        return hasPublicSources(official);
      case "photo":
        return Boolean(official.photo);
      case "contact":
        return hasContact(official);
      case "vote_record":
        return Boolean(voteRecord?.votes.length || scoreCard);
      case "left_right_chart":
        return hasRuleReviewedIdeology(official.id);
      case "scorecard":
        return Boolean(scoreCard);
      case "funding":
        return Boolean(funding);
      case "public_records":
        return redFlags.length > 0;
      case "news":
        return newsRows > 0;
      case "social_links":
        return hasSocialLinks(official);
      default:
        return false;
    }
  });
  const loadedSet = new Set(loadedItems);
  const missingItems = completionOrder.filter((key) => !loadedSet.has(key));

  return {
    profileType: "official",
    profileId: official.id,
    profileName: official.name,
    profilePath: `/officials/${official.id}`,
    level: official.level,
    state: official.state ?? null,
    jurisdiction: official.jurisdiction,
    position: official.position,
    completionPercent: staticBuildout.completionPercent,
    priority: priorityFromPercent(staticBuildout.completionPercent),
    isComplete: missingItems.length === 0,
    loadedItems,
    missingItems,
    sourceReviewStatus: missingItems.length === 0 ? "complete" : "needs_review",
    lastStaticReviewAt: official.lastVerifiedAt ?? null,
    summary: {
      hasPhoto: Boolean(official.photo),
      hasVoteRecord: Boolean(voteRecord?.votes.length || scoreCard),
      voteRows: voteRecord?.votes.length ?? 0,
      hasFunding: Boolean(funding),
      hasPublicRecords: redFlags.length > 0,
      publicRecordRows: redFlags.length,
      hasNews: newsRows > 0,
      newsRows,
      hasSocialLinks: hasSocialLinks(official),
      hasLeftRightChart: hasRuleReviewedIdeology(official.id),
    },
  };
}

export function getOfficialCompletionDashboard(): ProfileCompletionDashboard {
  const rows = getAllOfficials().map(buildOfficialCompletionSnapshot);
  const federalStateRows = rows.filter((row) => row.level === "federal" || row.level === "state");
  const priorityCounts: Record<ProfileCompletionPriority, number> = {
    red: 0,
    yellow: 0,
    green: 0,
  };
  const missingCounts = new Map<ProfileCompletionKey, number>();
  const stateAccumulator = new Map<
    string,
    {
      state: string;
      total: number;
      complete: number;
      completionTotal: number;
      missingPhotos: number;
      missingVotes: number;
      missingFunding: number;
      missingPublicRecords: number;
      missingNews: number;
    }
  >();

  for (const row of rows) {
    priorityCounts[row.priority] += 1;
    row.missingItems.forEach((key) => missingCounts.set(key, (missingCounts.get(key) ?? 0) + 1));

    const state = row.state ?? "Unknown";
    const current =
      stateAccumulator.get(state) ??
      {
        state,
        total: 0,
        complete: 0,
        completionTotal: 0,
        missingPhotos: 0,
        missingVotes: 0,
        missingFunding: 0,
        missingPublicRecords: 0,
        missingNews: 0,
      };
    current.total += 1;
    current.complete += row.isComplete ? 1 : 0;
    current.completionTotal += row.completionPercent;
    current.missingPhotos += row.missingItems.includes("photo") ? 1 : 0;
    current.missingVotes += row.missingItems.includes("vote_record") ? 1 : 0;
    current.missingFunding += row.missingItems.includes("funding") ? 1 : 0;
    current.missingPublicRecords += row.missingItems.includes("public_records") ? 1 : 0;
    current.missingNews += row.missingItems.includes("news") ? 1 : 0;
    stateAccumulator.set(state, current);
  }

  const completionTotal = rows.reduce((total, row) => total + row.completionPercent, 0);
  const federalStateCompletionTotal = federalStateRows.reduce((total, row) => total + row.completionPercent, 0);

  return {
    generatedAt: new Date().toISOString(),
    totalProfiles: rows.length,
    completeProfiles: rows.filter((row) => row.isComplete).length,
    incompleteProfiles: rows.filter((row) => !row.isComplete).length,
    averageCompletionPercent: rows.length ? Math.round(completionTotal / rows.length) : 0,
    federalStateProfiles: federalStateRows.length,
    federalStateCompleteProfiles: federalStateRows.filter((row) => row.isComplete).length,
    federalStateAverageCompletionPercent: federalStateRows.length
      ? Math.round(federalStateCompletionTotal / federalStateRows.length)
      : 0,
    missingItemCounts: Array.from(missingCounts, ([key, count]) => ({
      key,
      label: profileCompletionLabels[key],
      count,
    })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    priorityCounts,
    stateRows: Array.from(stateAccumulator.values())
      .map((row) => ({
        state: row.state,
        total: row.total,
        complete: row.complete,
        averageCompletionPercent: Math.round(row.completionTotal / row.total),
        missingPhotos: row.missingPhotos,
        missingVotes: row.missingVotes,
        missingFunding: row.missingFunding,
        missingPublicRecords: row.missingPublicRecords,
        missingNews: row.missingNews,
      }))
      .sort((a, b) => b.total - a.total || a.state.localeCompare(b.state)),
    lowestCompletionProfiles: [...rows]
      .filter((row) => !row.isComplete)
      .sort((a, b) => a.completionPercent - b.completionPercent || a.profileName.localeCompare(b.profileName))
      .slice(0, 25),
  };
}
