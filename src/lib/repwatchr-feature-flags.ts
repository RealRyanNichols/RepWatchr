/**
 * Public launch gates. Every integrity-sensitive V2 capability is off unless
 * the deployment explicitly enables it after its acceptance checks pass.
 */
export const repwatchrFeatureFlags = Object.freeze({
  candidateCatalogV2: process.env.NEXT_PUBLIC_ENABLE_CANDIDATE_CATALOG_V2 === "true",
  communityVotingV2: process.env.NEXT_PUBLIC_ENABLE_COMMUNITY_VOTING_V2 === "true",
  repwatchrBrainV2: process.env.NEXT_PUBLIC_ENABLE_REPWATCHR_BRAIN_V2 === "true",
  memberDashboardV2: process.env.NEXT_PUBLIC_ENABLE_MEMBER_DASHBOARD_V2 === "true",
  // The database poll status is the primary launch/close control. Setting this
  // server-only switch to "false" remains an independent emergency kill switch.
  racePollsV1: process.env.ENABLE_RACE_POLLS_V1 !== "false",
});
