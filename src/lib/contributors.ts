export const contributorLevels = [
  "source_runner",
  "meeting_reporter",
  "vote_hunter",
  "funding_tracker",
  "researcher",
  "fact_checker",
  "editor",
  "community_builder",
] as const;

export type ContributorLevel = (typeof contributorLevels)[number];

export const contributorLevelLabels: Record<ContributorLevel, string> = {
  source_runner: "Source Runner",
  meeting_reporter: "Meeting Reporter",
  vote_hunter: "Vote Hunter",
  funding_tracker: "Funding Tracker",
  researcher: "Researcher",
  fact_checker: "Fact Checker",
  editor: "Editor",
  community_builder: "Community Builder",
};

export const contributorLevelDescriptions: Record<ContributorLevel, string> = {
  source_runner: "Finds public links, filings, rosters, clips, and receipts that can be checked.",
  meeting_reporter: "Tracks public meetings, agendas, minutes, clips, questions, and follow-up records.",
  vote_hunter: "Finds roll calls, bill text, vote pages, and vote-impact context.",
  funding_tracker: "Tracks donors, PACs, filings, vendors, and campaign-finance source links.",
  researcher: "Builds timelines, missing-record lists, target pages, and source packets.",
  fact_checker: "Checks claims against public records and submits corrections when the record is off.",
  editor: "Cleans source packets, story notes, snippets, and public profile language.",
  community_builder: "Helps people watch counties, boards, races, issues, and records without harassment.",
};

export const contributionKinds = [
  "source_submission",
  "meeting_report",
  "vote_hunt",
  "funding_record",
  "research_note",
  "fact_check",
  "editorial_fix",
  "community_build",
] as const;

export type ContributionKind = (typeof contributionKinds)[number];

export const contributionKindLabels: Record<ContributionKind, string> = {
  source_submission: "Source Submission",
  meeting_report: "Meeting Report",
  vote_hunt: "Vote Hunt",
  funding_record: "Funding Record",
  research_note: "Research Note",
  fact_check: "Fact Check",
  editorial_fix: "Editorial Fix",
  community_build: "Community Build",
};

export const contributionXp: Record<ContributionKind, number> = {
  source_submission: 12,
  meeting_report: 18,
  vote_hunt: 18,
  funding_record: 22,
  research_note: 10,
  fact_check: 16,
  editorial_fix: 8,
  community_build: 8,
};

export const contributorBadgeCatalog = [
  {
    badgeKey: "first_receipt",
    name: "First Receipt",
    description: "Submitted the first contribution record for review.",
    iconLabel: "1",
    accent: "blue",
  },
  {
    badgeKey: "source_runner_5",
    name: "Source Runner",
    description: "Five accepted source records attached or accepted.",
    iconLabel: "SRC",
    accent: "red",
  },
  {
    badgeKey: "meeting_reporter_3",
    name: "Meeting Reporter",
    description: "Three meeting, agenda, minutes, or clip records submitted.",
    iconLabel: "MTG",
    accent: "gold",
  },
  {
    badgeKey: "vote_hunter_10",
    name: "Vote Hunter",
    description: "Ten vote records found, checked, or attached.",
    iconLabel: "VOTE",
    accent: "blue",
  },
  {
    badgeKey: "funding_tracker_5",
    name: "Funding Tracker",
    description: "Five campaign-finance, PAC, donor, or filing records submitted.",
    iconLabel: "$",
    accent: "green",
  },
  {
    badgeKey: "verified_fact_checker",
    name: "Verified Fact Checker",
    description: "Repeatedly submitted accurate corrections or source checks.",
    iconLabel: "CHK",
    accent: "slate",
  },
  {
    badgeKey: "county_builder",
    name: "County Builder",
    description: "Built useful records inside a county lane.",
    iconLabel: "CTY",
    accent: "gold",
  },
  {
    badgeKey: "no_paid_rewards",
    name: "Reputation Only",
    description: "RepWatchr recognizes reputation. Contributors are not paid for records.",
    iconLabel: "REP",
    accent: "slate",
  },
] as const;

export type ContributorBadge = (typeof contributorBadgeCatalog)[number];

export type PublicContributorProfile = {
  id: string;
  handle: string;
  display_name: string | null;
  public_bio: string | null;
  county: string | null;
  state: string;
  avatar_url: string | null;
  primary_level: ContributorLevel;
  reputation_status: string;
  total_xp: number;
  contribution_count: number;
  accepted_sources_count: number;
  verified_contributions_count: number;
  useful_votes_count: number;
  rejected_count: number;
  accuracy_score: number;
  last_contributed_at: string | null;
  overall_rank?: number | null;
  state_rank?: number | null;
  county_rank?: number | null;
};

export type ContributorRecordStatus =
  | "submitted"
  | "needs_review"
  | "accepted"
  | "verified"
  | "attached_to_profile"
  | "rejected"
  | "needs_more_info";

export type ContributorRecord = {
  id: string;
  profile_id: string;
  user_id: string;
  kind: ContributionKind;
  target_type: string;
  target_id: string | null;
  target_label: string;
  title: string;
  summary: string;
  source_url: string | null;
  source_date: string | null;
  jurisdiction: string | null;
  county: string | null;
  state: string;
  status: ContributorRecordStatus;
  xp_awarded: number;
  usefulness_score: number;
  accuracy_status: string;
  attached_href: string | null;
  created_at: string;
};

export type ContributorBadgeAward = {
  id: string;
  badge_key: string;
  reason: string | null;
  created_at: string;
  contributor_badges?: {
    name: string;
    description: string;
    icon_label: string;
    accent: string;
  } | null;
};

export function isContributorLevel(value: unknown): value is ContributorLevel {
  return typeof value === "string" && contributorLevels.includes(value as ContributorLevel);
}

export function isContributionKind(value: unknown): value is ContributionKind {
  return typeof value === "string" && contributionKinds.includes(value as ContributionKind);
}

export function normalizeContributorHandle(value: unknown) {
  if (typeof value !== "string") return null;
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, 39);

  return /^[a-z0-9][a-z0-9_-]{2,38}$/.test(cleaned) ? cleaned : null;
}

export function contributorDisplayName(profile: Pick<PublicContributorProfile, "display_name" | "handle">) {
  return profile.display_name?.trim() || `@${profile.handle}`;
}

export function xpForContribution(kind: ContributionKind) {
  return contributionXp[kind] ?? 8;
}

export const fallbackContributors: PublicContributorProfile[] = [
  {
    id: "fallback-source-runner",
    handle: "east-texas-source-runner",
    display_name: "East Texas Source Runner",
    public_bio: "Demo contributor profile showing how public reputation will look once member records are live.",
    county: "Gregg County",
    state: "TX",
    avatar_url: null,
    primary_level: "source_runner",
    reputation_status: "Building record",
    total_xp: 420,
    contribution_count: 31,
    accepted_sources_count: 18,
    verified_contributions_count: 12,
    useful_votes_count: 44,
    rejected_count: 1,
    accuracy_score: 96,
    last_contributed_at: "2026-06-30T12:00:00.000Z",
    overall_rank: 1,
    state_rank: 1,
    county_rank: 1,
  },
  {
    id: "fallback-vote-hunter",
    handle: "vote-hunter-tx",
    display_name: "Texas Vote Hunter",
    public_bio: "Tracks vote pages, bill text, and missing roll-call receipts.",
    county: "Smith County",
    state: "TX",
    avatar_url: null,
    primary_level: "vote_hunter",
    reputation_status: "Verified contributor",
    total_xp: 365,
    contribution_count: 24,
    accepted_sources_count: 11,
    verified_contributions_count: 16,
    useful_votes_count: 57,
    rejected_count: 0,
    accuracy_score: 98,
    last_contributed_at: "2026-06-29T12:00:00.000Z",
    overall_rank: 2,
    state_rank: 2,
    county_rank: 1,
  },
  {
    id: "fallback-funding-tracker",
    handle: "money-trail-watch",
    display_name: "Money Trail Watch",
    public_bio: "Tracks campaign-finance filings, donor records, and PAC links.",
    county: "Bowie County",
    state: "TX",
    avatar_url: null,
    primary_level: "funding_tracker",
    reputation_status: "High accuracy",
    total_xp: 310,
    contribution_count: 19,
    accepted_sources_count: 14,
    verified_contributions_count: 9,
    useful_votes_count: 21,
    rejected_count: 1,
    accuracy_score: 94,
    last_contributed_at: "2026-06-27T12:00:00.000Z",
    overall_rank: 3,
    state_rank: 3,
    county_rank: 1,
  },
];
