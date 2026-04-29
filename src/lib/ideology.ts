import fs from "fs";
import path from "path";
import type { Official, OfficialIdeologyProfile } from "@/types";

const IDEOLOGY_MASTER_PATH = path.join(process.cwd(), "src", "data", "official-ideology-master.json");

let ideologyProfilesCache: OfficialIdeologyProfile[] | null = null;

export interface OfficialBuildoutStats {
  totalProfiles: number;
  completeProfiles: number;
  incompleteProfiles: number;
  averageCompletionPercent: number;
  voteWeightedProfiles: number;
  pendingIdeologyProfiles: number;
  missingItemCounts: Array<{ label: string; count: number }>;
  lowestCompletionProfiles: Array<{
    officialId: string;
    name: string;
    position: string;
    jurisdiction: string;
    completionPercent: number;
    missingItems: string[];
  }>;
}

function readIdeologyProfiles(): OfficialIdeologyProfile[] {
  if (ideologyProfilesCache) return ideologyProfilesCache;

  try {
    const raw = fs.readFileSync(IDEOLOGY_MASTER_PATH, "utf-8");
    ideologyProfilesCache = JSON.parse(raw) as OfficialIdeologyProfile[];
  } catch {
    ideologyProfilesCache = [];
  }

  return ideologyProfilesCache;
}

export function getAllOfficialIdeologyProfiles(): OfficialIdeologyProfile[] {
  return readIdeologyProfiles();
}

export function getOfficialIdeologyProfile(officialId: string): OfficialIdeologyProfile | undefined {
  return readIdeologyProfiles().find((profile) => profile.officialId === officialId);
}

export function getOfficialProfileBuildoutStats(): OfficialBuildoutStats {
  const profiles = readIdeologyProfiles();
  const totalProfiles = profiles.length;
  const completeProfiles = profiles.filter((profile) => profile.buildout.isComplete).length;
  const voteWeightedProfiles = profiles.filter((profile) => profile.ideologyScore !== null).length;
  const missingCounts = new Map<string, number>();

  for (const profile of profiles) {
    for (const item of profile.buildout.missingItems) {
      missingCounts.set(item, (missingCounts.get(item) ?? 0) + 1);
    }
  }

  const completionTotal = profiles.reduce((total, profile) => total + profile.buildout.completionPercent, 0);
  const lowestCompletionProfiles = [...profiles]
    .filter((profile) => !profile.buildout.isComplete)
    .sort((a, b) => {
      const percentDiff = a.buildout.completionPercent - b.buildout.completionPercent;
      if (percentDiff !== 0) return percentDiff;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 12)
    .map((profile) => ({
      officialId: profile.officialId,
      name: profile.name,
      position: profile.position,
      jurisdiction: profile.jurisdiction,
      completionPercent: profile.buildout.completionPercent,
      missingItems: profile.buildout.missingItems,
    }));

  return {
    totalProfiles,
    completeProfiles,
    incompleteProfiles: Math.max(0, totalProfiles - completeProfiles),
    averageCompletionPercent: totalProfiles > 0 ? Math.round(completionTotal / totalProfiles) : 0,
    voteWeightedProfiles,
    pendingIdeologyProfiles: Math.max(0, totalProfiles - voteWeightedProfiles),
    missingItemCounts: Array.from(missingCounts, ([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    lowestCompletionProfiles,
  };
}

export function buildFallbackIdeologyProfile(official: Official): OfficialIdeologyProfile {
  return {
    officialId: official.id,
    name: official.name,
    party: official.party,
    level: official.level,
    position: official.position,
    jurisdiction: official.jurisdiction,
    district: official.district,
    ideologyScore: null,
    ideologyLabel: "Vote record pending",
    confidence: "none",
    method: "No master ideology row was found for this official.",
    basis: "The chart stays centered until the official is added to src/data/official-ideology-master.json.",
    mappedVoteCount: 0,
    totalScorecardVotes: 0,
    rightVoteCount: 0,
    leftVoteCount: 0,
    centerVoteCount: 0,
    lastUpdated: "unknown",
    evidence: [],
    buildout: {
      completionPercent: 0,
      hasPhoto: Boolean(official.photo),
      hasBio: Boolean(official.bio),
      hasPublicSources: (official.sourceLinks?.length ?? 0) > 0,
      hasContactWebsite: Boolean(official.contactInfo.website),
      hasScorecard: false,
      hasVoteRecord: false,
      hasFundingSummary: false,
      hasRedFlagReview: false,
      hasNewsLinks: false,
      hasIdeologyChart: false,
      isComplete: false,
      missingItems: ["master ideology row", "vote-direction review"],
    },
  };
}
