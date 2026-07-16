// ============================================================
// East Texas Official Tracker - Type Definitions
// ============================================================

export type Party = "R" | "D" | "I" | "NP" | "VR" | "VD";
// VR = "Votes Republican" (nonpartisan office but pulls R primaries / leans R)
// VD = "Votes Democrat" (nonpartisan office but pulls D primaries / leans D)
export type GovernmentLevel = "federal" | "state" | "county" | "city" | "school-board";
export type VoteChoice = "yea" | "nay" | "absent" | "abstain" | "not-applicable";
export type RedFlagSeverity = "warning" | "critical";
export type RedFlagCategory = "broken-promise" | "conflict-of-interest" | "ethics" | "funding" | "voting-record" | "other";
export type SourceReviewStatus =
  | "needs_source_review"
  | "source_seeded"
  | "verified"
  | "complete";

export interface ContactInfo {
  office?: string;
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: {
    x?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
  };
}

export interface SourceLink {
  title: string;
  url: string;
}

export interface SourceCredit {
  name: string;
  url: string;
  handle?: string;
  note?: string;
}

export interface Official {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  photo?: string;
  photoSourceUrl?: string;
  photoCredit?: string;
  featuredPhoto?: string;
  featuredPhotoSourceUrl?: string;
  featuredPhotoCredit?: string;
  party: Party;
  level: GovernmentLevel;
  position: string;
  district?: string;
  jurisdiction: string;
  county: string[];
  termStart: string;
  termEnd: string;
  contactInfo: ContactInfo;
  bio?: string;
  campaignPromises?: string[];
  reviewStatus?: SourceReviewStatus;
  state?: string;
  bioguideId?: string;
  sourceLinks?: SourceLink[];
  lastVerifiedAt?: string;
}

export interface ScoredVote {
  billId: string;
  billTitle: string;
  session: string;
  date: string;
  officialVote: VoteChoice;
  proEastTexasPosition: "yea" | "nay";
  aligned: boolean;
  explanation: string;
  category: string;
  weight: number;
}

export interface CategoryScore {
  score: number;
  letterGrade: string;
  votes: ScoredVote[];
  weight: number;
}

export interface ScoreCard {
  officialId: string;
  reviewStatus?: SourceReviewStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  overall: number;
  letterGrade: string;
  categories: {
    waterRights: CategoryScore;
    landAndPropertyRights: CategoryScore;
    taxes: CategoryScore;
    governmentTransparency: CategoryScore;
    votingRecord: CategoryScore;
  };
  lastUpdated: string;
}

export interface Donor {
  name: string;
  type: "individual" | "pac" | "corporation" | "party";
  totalAmount: number;
  occupation?: string;
  employer?: string;
  city?: string;
  state?: string;
}

export interface IndustrySector {
  sector: string;
  amount: number;
  percentage: number;
}

export interface DataSource {
  name: string;
  url: string;
  retrievedDate: string;
}

export interface FundingSummary {
  officialId: string;
  reviewStatus?: SourceReviewStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  cycle: string;
  totalRaised: number;
  totalSpent: number;
  cashOnHand: number;
  topDonors: Donor[];
  donorBreakdown: {
    individual: number;
    pac: number;
    selfFunded: number;
    smallDollar: number;
    largeDollar: number;
  };
  geographicBreakdown: {
    inDistrict: number;
    inState: number;
    outOfState: number;
  };
  industrySectors: IndustrySector[];
  lastUpdated: string;
  sources: DataSource[];
}

export type CongressTradingRiskLevel = "watch" | "high" | "critical";
export type CongressTradingSourceTier = "official_record" | "secondary_tracker";
export type CongressTradingMatchStatus = "matched_current_profile" | "unmatched_or_former_profile";

export interface CongressTradingSource {
  name: string;
  url: string;
  retrievedDate: string;
  tier: CongressTradingSourceTier;
}

export interface CongressTradingTrackerRow {
  id: string;
  officialId?: string;
  rank: number;
  name: string;
  chamber: "house" | "senate";
  district: string;
  filings: number;
  transactions: number;
  lastFilingDate: string;
  popularityScore: number;
  popularityNote: string;
  trackerUrl: string;
  officialDisclosureUrl: string;
  officialDisclosureName: string;
  riskLevel: CongressTradingRiskLevel;
  riskReasons: string[];
  status: CongressTradingMatchStatus;
}

export interface CongressTradingDataset {
  snapshotDate: string;
  source: CongressTradingSource;
  officialSources: CongressTradingSource[];
  totals: {
    trackerPoliticians: number;
    trackerTransactions: number;
    rowsParsed: number;
    matchedCurrentProfiles: number;
    unmatchedOrFormerProfiles: number;
    currentProfilesWithRows: number;
    criticalRows: number;
    highRows: number;
  };
  records: CongressTradingTrackerRow[];
  unmatchedRecords: CongressTradingTrackerRow[];
}

export interface CongressTradingProfileSnapshot {
  officialId: string;
  snapshotDate: string;
  source: CongressTradingSource;
  officialSources: CongressTradingSource[];
  rows: CongressTradingTrackerRow[];
  primaryRow: CongressTradingTrackerRow;
  highestRiskLevel: CongressTradingRiskLevel;
}

export interface BillVote {
  officialId: string;
  vote: VoteChoice;
}

export interface Bill {
  id: string;
  reviewStatus?: SourceReviewStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  title: string;
  summary: string;
  session: string;
  level: "federal" | "state";
  chamber: "house" | "senate";
  status: string;
  categories: string[];
  eastTexasImpact: string;
  proEastTexasPosition: "yea" | "nay";
  votes: BillVote[];
  dateVoted: string;
  sourceUrl: string;
}

export interface PublicVoteRecordVote {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  sourceXmlUrl?: string;
  sourceLookupUrl?: string;
  chamber: "house" | "senate";
  congress?: number;
  session: number | string;
  rollCall: number;
  date: string;
  issue: string;
  question: string;
  voteType: string;
  result: string;
  title: string;
  vote: string;
  voteCast: string;
}

export interface PublicVoteRecord {
  officialId: string;
  name: string;
  level: "federal" | "state" | "county" | "city" | "school-board";
  chamber: "house" | "senate";
  session: string;
  lastUpdated: string;
  sourceLinks: SourceLink[];
  summary: {
    totalVotesLoaded: number;
    yea: number;
    nay: number;
    present: number;
    notVoting: number;
    other: number;
  };
  storedVoteRows?: number;
  voteRowStorageNote?: string;
  votes: PublicVoteRecordVote[];
}

export interface IssueCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  weight: number;
  color: string;
}

export interface RedFlag {
  id: string;
  officialId: string;
  title: string;
  description: string;
  severity: RedFlagSeverity;
  category: RedFlagCategory;
  date: string;
  sourceUrl: string;
  whyItMatters: string;
  jurisdiction?: string;
  statusLabel?: string;
  reviewerStatus?: string;
}

// ============================================================
// Vote-Weighted Left/Right Ideology Profile
// ============================================================

export type IdeologyConfidence = "none" | "low" | "medium" | "high";
export type IdeologyVoteDirection = "left" | "center" | "right";

export interface IdeologyVoteEvidence {
  billId: string;
  billTitle: string;
  date: string;
  category: string;
  officialVote: VoteChoice;
  rightPosition: "yea" | "nay";
  direction: IdeologyVoteDirection;
  weight: number;
  impact: number;
  sourceUrl?: string;
  rationale: string;
}

export interface OfficialProfileBuildout {
  completionPercent: number;
  hasPhoto: boolean;
  hasBio: boolean;
  hasPublicSources: boolean;
  hasContactWebsite: boolean;
  hasScorecard: boolean;
  hasVoteRecord: boolean;
  hasFundingSummary: boolean;
  hasRedFlagReview: boolean;
  hasNewsLinks: boolean;
  hasIdeologyChart: boolean;
  isComplete: boolean;
  missingItems: string[];
}

export interface OfficialIdeologyProfile {
  officialId: string;
  name: string;
  party: Party;
  level: GovernmentLevel;
  position: string;
  jurisdiction: string;
  district?: string;
  ideologyScore: number | null;
  ideologyLabel: string;
  confidence: IdeologyConfidence;
  method: string;
  basis: string;
  mappedVoteCount: number;
  directionalMappedVoteCount: number;
  reviewedVoteCount: number;
  totalScorecardVotes: number;
  rightVoteCount: number;
  leftVoteCount: number;
  centerVoteCount: number;
  publicVoteRowsLoaded: number;
  publicVoteRecordLastUpdated?: string | null;
  publicVoteRecordSourceCount: number;
  unreviewedVoteRowsLoaded: number;
  mappedVoteCoveragePercent: number;
  unreviewedScorecardVoteCount?: number;
  lastUpdated: string;
  evidence: IdeologyVoteEvidence[];
  buildout: OfficialProfileBuildout;
}

// ============================================================
// Constitutional Alignment Meter
// ============================================================

export type ConstitutionalAlignmentConfidence = "none" | "low" | "medium" | "high";

export type ConstitutionalDimensionId =
  | "individual-liberty"
  | "limited-government"
  | "fiscal-restraint"
  | "federalism"
  | "transparency-due-process";

export type ConstitutionalVoteReviewStatus =
  | "scored"
  | "needs-policy-review"
  | "not-scoreable";

export interface ConstitutionalAlignmentDimension {
  id: ConstitutionalDimensionId;
  name: string;
  description: string;
  score: number | null;
  scoredVoteCount: number;
  possibleWeight: number;
}

export interface ConstitutionalAlignmentEvidence {
  sourceId: string;
  title: string;
  date: string;
  voteCast: string;
  vote: string;
  sourceUrl: string;
  category: ConstitutionalDimensionId;
  constitutionalPosition: "yea" | "nay" | "review";
  aligned: boolean | null;
  weight: number;
  impact: number;
  rationale: string;
  reviewStatus: ConstitutionalVoteReviewStatus;
}

export interface ConstitutionalAlignmentProfile {
  officialId: string;
  name: string;
  score: number | null;
  label: string;
  confidence: ConstitutionalAlignmentConfidence;
  method: string;
  basis: string;
  totalVotesLoaded: number;
  scoredVoteCount: number;
  reviewVoteCount: number;
  notScoreableVoteCount: number;
  lastUpdated: string;
  dimensions: ConstitutionalAlignmentDimension[];
  evidence: ConstitutionalAlignmentEvidence[];
  sourceLinks: SourceLink[];
}

// ============================================================
// News / Articles
// ============================================================

export type NewsTag = "breaking" | "investigation" | "update" | "opinion" | "watchdog" | "election" | "corruption" | "transparency";

export type NewsScope = "east-texas" | "texas" | "national";

export type NewsPowerChannel =
  | "officials"
  | "school-boards"
  | "attorneys"
  | "media"
  | "public-safety"
  | "elections"
  | "courts"
  | "money";

export type EditorialStatus = "draft" | "in_review" | "approved" | "archived";

export type PublicPostPlatform = "x" | "youtube" | "facebook" | "instagram" | "tiktok" | "other";

export interface PublicPostEmbed {
  platform: PublicPostPlatform;
  url: string;
  author: string;
  label?: string;
  context?: string;
  publishedAt?: string;
}

export type OfficialCoverageTone = "positive" | "critical" | "neutral";

export interface OfficialCoverageClassification {
  /** Person-specific editorial classification. Never inferred from party or headline tone. */
  tone: OfficialCoverageTone;
  rationale: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  officialIds: string[];
  tags: NewsTag[];
  sourceUrl?: string;
  sourceName?: string;
  sourceLinks?: SourceLink[];
  imageUrl?: string;
  author: string;
  publishedAt: string;
  featured: boolean;
  scope?: NewsScope;
  state?: string;
  counties?: string[];
  cities?: string[];
  locationLabel?: string;
  powerChannels?: NewsPowerChannel[];
  sourceStatus?: "source_linked" | "needs_source_review";
  /** Public surfaces require an explicit editorial approval. */
  editorialStatus?: EditorialStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  correctionStatus?: "none" | "under_review" | "corrected";
  topicKey?: string;
  primarySourceCount?: number;
  independentPublisherCount?: number;
  midtermRelevance?: 0 | 1 | 2 | 3;
  publicPostEmbeds?: PublicPostEmbed[];
  /** An article can treat different named officials differently, so tone is keyed by official id. */
  officialCoverage?: Record<string, OfficialCoverageClassification>;
}

// ============================================================
// Citizen Voting System Types
// ============================================================

export type CitizenVote = "approve" | "disapprove";

export interface UserProfile {
  id: string;
  userId: string;
  county: string;
  district?: string;
  verified: boolean;
  createdAt: string;
}

export interface CastVote {
  id: string;
  userId: string;
  officialId: string;
  vote: CitizenVote;
  county: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalRating {
  officialId: string;
  totalVotes: number;
  approveCount: number;
  disapproveCount: number;
  approvalPercentage: number;
  inDistrict: {
    totalVotes: number;
    approveCount: number;
    disapproveCount: number;
    approvalPercentage: number;
  };
  allTexas: {
    totalVotes: number;
    approveCount: number;
    disapproveCount: number;
    approvalPercentage: number;
  };
}

// Computed types used by the UI
export interface OfficialWithScores extends Official {
  scoreCard?: ScoreCard;
  fundingSummary?: FundingSummary;
  redFlags?: RedFlag[];
}

export interface ScoreCategory {
  key: string;
  name: string;
  score: number;
  letterGrade: string;
  color: string;
}
