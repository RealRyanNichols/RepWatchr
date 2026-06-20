import type {
  ConstitutionalAlignmentDimension,
  ConstitutionalAlignmentEvidence,
  ConstitutionalAlignmentProfile,
  ConstitutionalDimensionId,
  ConstitutionalVoteReviewStatus,
  PublicVoteRecord,
  PublicVoteRecordVote,
} from "@/types";

interface ConstitutionalRule {
  id: string;
  category: ConstitutionalDimensionId;
  constitutionalPosition: "yea" | "nay";
  weight: number;
  matches: (text: string, vote: PublicVoteRecordVote) => boolean;
  rationale: string;
}

interface ClassifiedVote {
  status: ConstitutionalVoteReviewStatus;
  category: ConstitutionalDimensionId;
  constitutionalPosition: "yea" | "nay" | "review";
  weight: number;
  rationale: string;
}

const DIMENSIONS: Array<Omit<ConstitutionalAlignmentDimension, "score" | "scoredVoteCount" | "possibleWeight">> = [
  {
    id: "individual-liberty",
    name: "Individual liberty",
    description: "Civil liberties, search and seizure limits, speech, religious liberty, and the right to keep and bear arms.",
  },
  {
    id: "limited-government",
    name: "Limited government",
    description: "Votes that restrain federal power, reject overreach, or preserve separation of powers.",
  },
  {
    id: "fiscal-restraint",
    name: "Fiscal restraint",
    description: "Votes that respect budget limits, debt discipline, taxation restraint, and responsible spending.",
  },
  {
    id: "federalism",
    name: "Federalism",
    description: "Votes that protect state authority, local control, and limits on national administrative power.",
  },
  {
    id: "transparency-due-process",
    name: "Due process",
    description: "Votes involving transparency, fair process, warrants, hearings, and accountable government procedure.",
  },
];

const SCORE_RULES: ConstitutionalRule[] = [
  {
    id: "fisa-extension",
    category: "individual-liberty",
    constitutionalPosition: "nay",
    weight: 3,
    matches: (text) => text.includes("fisa") && text.includes("extend"),
    rationale:
      "Extending Foreign Intelligence Surveillance Act authorities is scored as requiring stronger Fourth Amendment and civil-liberty safeguards unless the vote text clearly limits surveillance power.",
  },
  {
    id: "waive-budget-discipline",
    category: "fiscal-restraint",
    constitutionalPosition: "nay",
    weight: 2,
    matches: (text) => text.includes("waive") && text.includes("budgetary discipline"),
    rationale:
      "A vote against waiving budget discipline receives credit because the rubric favors fiscal restraint and legislative budget limits.",
  },
  {
    id: "congressional-disapproval",
    category: "limited-government",
    constitutionalPosition: "yea",
    weight: 2,
    matches: (text) =>
      text.includes("congressional review act") ||
      text.includes("joint resolution providing for congressional disapproval") ||
      text.includes("providing for congressional disapproval"),
    rationale:
      "Congressional disapproval of administrative rules is scored toward limited government and legislative accountability when the vote text clearly identifies that action.",
  },
  {
    id: "terminate-emergency",
    category: "limited-government",
    constitutionalPosition: "yea",
    weight: 2,
    matches: (text) => text.includes("terminate") && text.includes("national emergency"),
    rationale:
      "Ending an emergency declaration is scored toward limited government because the rubric favors returning extraordinary authority to normal constitutional limits.",
  },
];

function normalizeVote(vote: string): "yea" | "nay" | "not-scoreable" {
  const normalized = vote.toLowerCase().trim();
  if (["yea", "aye", "yes"].includes(normalized)) return "yea";
  if (["nay", "no"].includes(normalized)) return "nay";
  return "not-scoreable";
}

function searchableText(vote: PublicVoteRecordVote): string {
  return [
    vote.issue,
    vote.question,
    vote.voteType,
    vote.result,
    vote.title,
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function classifyVote(vote: PublicVoteRecordVote): ClassifiedVote {
  const normalized = normalizeVote(vote.vote);
  if (normalized === "not-scoreable") {
    return {
      status: "not-scoreable",
      category: "transparency-due-process",
      constitutionalPosition: "review",
      weight: 0,
      rationale: "No score is assigned when the official did not cast a yea/nay vote.",
    };
  }

  const text = searchableText(vote);
  const matchingRule = SCORE_RULES.find((rule) => rule.matches(text, vote));
  if (matchingRule) {
    return {
      status: "scored",
      category: matchingRule.category,
      constitutionalPosition: matchingRule.constitutionalPosition,
      weight: matchingRule.weight,
      rationale: matchingRule.rationale,
    };
  }

  if (
    text.includes("nomination") ||
    text.includes("confirmation") ||
    text.includes("cloture") ||
    text.includes("motion to proceed") ||
    text.includes("motion to discharge") ||
    text.includes("point of order") ||
    text.includes("amendment") ||
    text.includes("farm, food, and national security act")
  ) {
    return {
      status: "needs-policy-review",
      category: "transparency-due-process",
      constitutionalPosition: "review",
      weight: 0,
      rationale:
        "This vote needs a human policy rule before it can fairly move a constitutional meter. RepWatchr does not force vague procedural votes, nominations, or broad omnibus bills into a score.",
    };
  }

  return {
    status: "needs-policy-review",
    category: "limited-government",
    constitutionalPosition: "review",
    weight: 0,
    rationale:
      "No reviewed constitutional scoring rule matches this vote yet. It stays visible for source review but does not affect the score.",
  };
}

function confidenceFor(scoredVoteCount: number, totalVotesLoaded: number): ConstitutionalAlignmentProfile["confidence"] {
  if (scoredVoteCount === 0) return "none";
  if (scoredVoteCount < 3 || totalVotesLoaded < 10) return "low";
  if (scoredVoteCount < 8) return "medium";
  return "high";
}

function labelFor(score: number | null): string {
  if (score === null) return "Needs constitutional vote review";
  if (score >= 85) return "Strong constitutional alignment";
  if (score >= 70) return "Generally constitutional alignment";
  if (score >= 50) return "Mixed constitutional record";
  return "Needs constitutional scrutiny";
}

function buildDimensions(evidence: ConstitutionalAlignmentEvidence[]): ConstitutionalAlignmentDimension[] {
  return DIMENSIONS.map((dimension) => {
    const scored = evidence.filter(
      (item) => item.reviewStatus === "scored" && item.category === dimension.id && item.weight > 0,
    );
    const possibleWeight = scored.reduce((total, item) => total + item.weight, 0);
    const alignedWeight = scored.reduce((total, item) => total + (item.aligned ? item.weight : 0), 0);

    return {
      ...dimension,
      score: possibleWeight > 0 ? Math.round((alignedWeight / possibleWeight) * 100) : null,
      scoredVoteCount: scored.length,
      possibleWeight,
    };
  });
}

export function buildConstitutionalAlignmentProfile(record: PublicVoteRecord): ConstitutionalAlignmentProfile {
  const evidence = record.votes.map((vote) => {
    const classification = classifyVote(vote);
    const normalizedVote = normalizeVote(vote.vote);
    const aligned =
      classification.status === "scored" && normalizedVote !== "not-scoreable"
        ? normalizedVote === classification.constitutionalPosition
        : null;
    const impact = classification.status === "scored" ? (aligned ? classification.weight : -classification.weight) : 0;

    return {
      sourceId: vote.sourceId,
      title: vote.title || vote.question || vote.issue || `Roll call ${vote.rollCall}`,
      date: vote.date,
      voteCast: vote.voteCast,
      vote: vote.vote,
      sourceUrl: vote.sourceUrl,
      category: classification.category,
      constitutionalPosition: classification.constitutionalPosition,
      aligned,
      weight: classification.weight,
      impact,
      rationale: classification.rationale,
      reviewStatus: classification.status,
    } satisfies ConstitutionalAlignmentEvidence;
  });

  const scoredEvidence = evidence.filter((item) => item.reviewStatus === "scored" && item.weight > 0);
  const possibleWeight = scoredEvidence.reduce((total, item) => total + item.weight, 0);
  const alignedWeight = scoredEvidence.reduce((total, item) => total + (item.aligned ? item.weight : 0), 0);
  const score = possibleWeight > 0 ? Math.round((alignedWeight / possibleWeight) * 100) : null;
  const reviewVoteCount = evidence.filter((item) => item.reviewStatus === "needs-policy-review").length;
  const notScoreableVoteCount = evidence.filter((item) => item.reviewStatus === "not-scoreable").length;

  return {
    officialId: record.officialId,
    name: record.name,
    score,
    label: labelFor(score),
    confidence: confidenceFor(scoredEvidence.length, record.summary.totalVotesLoaded),
    method:
      "RepWatchr constitutional alignment applies reviewed issue rules to loaded public roll-call votes. Unreviewed procedural votes stay visible but do not move the score.",
    basis:
      "The rubric is anchored to limited government, individual liberty, fiscal restraint, federalism, transparency, and due process. It is a civic accountability signal, not a legal finding.",
    totalVotesLoaded: record.summary.totalVotesLoaded,
    scoredVoteCount: scoredEvidence.length,
    reviewVoteCount,
    notScoreableVoteCount,
    lastUpdated: record.lastUpdated,
    dimensions: buildDimensions(evidence),
    evidence,
    sourceLinks: record.sourceLinks,
  };
}
