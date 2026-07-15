/**
 * Public launch gates. Every integrity-sensitive V2 capability is off unless
 * the deployment explicitly enables it after its acceptance checks pass.
 */
export const repwatchrFeatureFlags = Object.freeze({
  candidateCatalogV2: process.env.NEXT_PUBLIC_ENABLE_CANDIDATE_CATALOG_V2 === "true",
  communityVotingV2: process.env.NEXT_PUBLIC_ENABLE_COMMUNITY_VOTING_V2 === "true",
  repwatchrBrainV2: process.env.NEXT_PUBLIC_ENABLE_REPWATCHR_BRAIN_V2 === "true",
  memberDashboardV2: process.env.NEXT_PUBLIC_ENABLE_MEMBER_DASHBOARD_V2 === "true",
});
