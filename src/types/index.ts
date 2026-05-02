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

export interface Official {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  photo?: string;
  photoSourceUrl?: string;
  photoCredit?: string;
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
  reviewStatus?: "needs_source_review" | "source_seeded" | "verified" | "complete";
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

export interface BillVote {
  officialId: string;
  vote: VoteChoice;
}

export interface Bill {
  id: string;
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
  chamber: "house" | "senate";
  congress: number;
  session: number;
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
  totalScorecardVotes: number;
  rightVoteCount: number;
  leftVoteCount: number;
  centerVoteCount: number;
  lastUpdated: string;
  evidence: IdeologyVoteEvidence[];
  buildout: OfficialProfileBuildout;
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

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  officialIds: string[];
  tags: NewsTag[];
  sourceUrl?: string;
  sourceName?: string;
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
