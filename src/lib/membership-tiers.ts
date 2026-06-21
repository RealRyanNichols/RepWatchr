export type MembershipTierId = "free_founder" | "watcher_pro" | "research_desk";

export type MembershipFeatureKey =
  | "watchlist"
  | "source_packets"
  | "public_record_drafts"
  | "saved_profiles"
  | "alerts_digests"
  | "export_tools"
  | "team_workspace"
  | "race_source_trackers"
  | "priority_review"
  | "monthly_source_brief";

export type MembershipTier = {
  id: MembershipTierId;
  name: string;
  priceLabel: string;
  summary: string;
  isPaid: boolean;
  features: string[];
  limits: {
    watchlistItems: number;
    savedPackets: number;
    publicRecordDrafts: number;
    savedProfiles: number;
    monthlyBriefAllowance: number;
  };
  featureKeys: MembershipFeatureKey[];
  upgradeHref: string;
};

export const CONTRIBUTOR_ROLES = [
  {
    id: "source_runner",
    label: "Source Runner",
    detail: "Finds official links, agendas, filings, vote pages, and receipts.",
  },
  {
    id: "meeting_reporter",
    label: "Meeting Reporter",
    detail: "Tracks agendas, meeting clips, minutes, and public questions.",
  },
  {
    id: "profile_builder",
    label: "Profile Builder",
    detail: "Adds missing profile fields and source trails.",
  },
  {
    id: "share_editor",
    label: "Share Editor",
    detail: "Turns records into safe, copyable public lines.",
  },
  {
    id: "scorecard_reader",
    label: "Scorecard Reader",
    detail: "Reviews score context and vote impact before sharing.",
  },
  {
    id: "money_trail_watcher",
    label: "Money Trail Watcher",
    detail: "Checks donor, PAC, vendor, and funding-source trails.",
  },
];

export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: "free_founder",
    name: "Free Founder Access",
    priceLabel: "$0 while founder access is open",
    summary: "Start watching officials, building packets, saving profiles, and drafting public-record requests.",
    isPaid: false,
    features: [
      "Watchlist for officials, school boards, races, issues, attorneys, media, and authority figures",
      "Source packet builder with copy/export backup",
      "Limited public-record request drafts",
      "Saved profiles and dashboard submissions",
    ],
    limits: {
      watchlistItems: 25,
      savedPackets: 10,
      publicRecordDrafts: 5,
      savedProfiles: 25,
      monthlyBriefAllowance: 0,
    },
    featureKeys: ["watchlist", "source_packets", "public_record_drafts", "saved_profiles", "export_tools"],
    upgradeHref: "/dashboard#paid-services",
  },
  {
    id: "watcher_pro",
    name: "Watcher Pro",
    priceLabel: "Paid tier ready for Stripe pricing",
    summary: "Expanded saved work, exports, alerts, and digest tools for active local watchers.",
    isPaid: true,
    features: [
      "Expanded watchlists",
      "More saved packets and public-record drafts",
      "Alerts and digests",
      "Markdown/text export tools",
    ],
    limits: {
      watchlistItems: 250,
      savedPackets: 100,
      publicRecordDrafts: 50,
      savedProfiles: 250,
      monthlyBriefAllowance: 0,
    },
    featureKeys: [
      "watchlist",
      "source_packets",
      "public_record_drafts",
      "saved_profiles",
      "alerts_digests",
      "export_tools",
    ],
    upgradeHref: "/services/election-watch-desk",
  },
  {
    id: "research_desk",
    name: "Research Desk",
    priceLabel: "Team tier ready for Stripe pricing",
    summary: "Team workspace, race/source trackers, priority review, and a monthly source brief allowance.",
    isPaid: true,
    features: [
      "Team workspace",
      "Race and source trackers",
      "Priority source review lane",
      "Monthly source brief allowance",
    ],
    limits: {
      watchlistItems: 1000,
      savedPackets: 500,
      publicRecordDrafts: 250,
      savedProfiles: 1000,
      monthlyBriefAllowance: 1,
    },
    featureKeys: [
      "watchlist",
      "source_packets",
      "public_record_drafts",
      "saved_profiles",
      "alerts_digests",
      "export_tools",
      "team_workspace",
      "race_source_trackers",
      "priority_review",
      "monthly_source_brief",
    ],
    upgradeHref: "/services/official-record-brief",
  },
];

const tierRank: Record<MembershipTierId, number> = {
  free_founder: 0,
  watcher_pro: 1,
  research_desk: 2,
};

export function getMembershipTier(id: string | null | undefined): MembershipTier {
  return MEMBERSHIP_TIERS.find((tier) => tier.id === id) ?? MEMBERSHIP_TIERS[0];
}

export function membershipBillingEnabled() {
  return (
    process.env.NEXT_PUBLIC_MEMBERSHIP_BILLING_ENABLED === "true" ||
    process.env.MEMBERSHIP_BILLING_ENABLED === "true"
  );
}

export function canUseMembershipFeature(
  tierId: string | null | undefined,
  feature: MembershipFeatureKey,
) {
  return getMembershipTier(tierId).featureKeys.includes(feature);
}

export function tierMeetsMinimum(tierId: string | null | undefined, minimumTierId: MembershipTierId) {
  return tierRank[getMembershipTier(tierId).id] >= tierRank[minimumTierId];
}

export function membershipUpgradeMessage(minimumTierId: MembershipTierId) {
  const tier = getMembershipTier(minimumTierId);
  if (!membershipBillingEnabled()) {
    return `${tier.name} is staged for billing later. Founder access stays open while RepWatchr finishes the paid workspace.`;
  }
  return `Upgrade to ${tier.name} to unlock this tool.`;
}
