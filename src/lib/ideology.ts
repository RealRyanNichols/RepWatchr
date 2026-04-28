import fs from "fs";
import path from "path";
import type { Official, OfficialIdeologyProfile } from "@/types";

const IDEOLOGY_MASTER_PATH = path.join(process.cwd(), "src", "data", "official-ideology-master.json");

let ideologyProfilesCache: OfficialIdeologyProfile[] | null = null;

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
