import type { PublicPowerKind, PublicPowerProfile, PublicPowerSource } from "@/types/power-watch";

export type PublicRoleGroup = "badge" | "court" | "oversight";

export const PUBLIC_ROLE_BOUNDARY_TEXT =
  "This profile covers public-role records only. RepWatchr does not publish private home addresses, minor children, or harassment instructions. Submit corrections or public sources below.";

export const PUBLIC_ROLE_REVIEW_LABELS = [
  { value: "confirmed_public_record", label: "Confirmed public record" },
  { value: "source_backed_public_record", label: "Source-backed public record" },
  { value: "public_question", label: "Public question" },
  { value: "under_review", label: "Under review" },
  { value: "needs_source", label: "Needs source" },
] as const;

export const PUBLIC_ROLE_SOURCE_TYPES = [
  "official agency bio",
  "official court page",
  "policy/manual",
  "public information page",
  "public budget",
  "public disciplinary record if official/public and lawful",
  "public court filing",
  "public docket",
  "public statement",
  "public meeting minutes",
  "public vote/appointment record",
  "public contract/procurement record",
  "official press release",
  "public records response",
] as const;

const badgeKinds = new Set<PublicPowerKind>([
  "law-enforcement-agency",
  "sheriff",
  "constable",
  "police-chief",
  "public-safety-official",
  "agency-official",
]);

const courtKinds = new Set<PublicPowerKind>([
  "judge",
  "prosecutor",
  "district-attorney",
  "court-official",
]);

const officialAgencySourceTypes = new Set<PublicPowerSource["sourceType"]>([
  "official-directory",
  "official-website",
  "official-agency-bio",
  "official-court-page",
  "agency-directory",
  "team-page",
]);

const policySourceTypes = new Set<PublicPowerSource["sourceType"]>([
  "policy-record",
  "policy-manual",
  "public-information-page",
  "complaint-process",
  "oversight-record",
]);

const publicRecordSourceTypes = new Set<PublicPowerSource["sourceType"]>([
  "public-record",
  "court-record",
  "case-file",
  "public-budget",
  "public-disciplinary-record",
  "public-court-filing",
  "public-docket",
  "public-statement",
  "public-meeting-minutes",
  "public-vote-appointment-record",
  "public-contract-procurement-record",
  "official-press-release",
  "public-records-response",
]);

const incidentCaseSourceTypes = new Set<PublicPowerSource["sourceType"]>([
  "court-record",
  "case-file",
  "public-disciplinary-record",
  "public-court-filing",
  "public-docket",
]);

export function getPublicRoleGroup(profile: PublicPowerProfile): PublicRoleGroup {
  if (courtKinds.has(profile.kind)) return "court";
  if (badgeKinds.has(profile.kind)) return "badge";
  return "oversight";
}

export function isBadgeOrCourtProfile(profile: PublicPowerProfile) {
  const group = getPublicRoleGroup(profile);
  return group === "badge" || group === "court";
}

export function publicRoleOpenEvent(profile: PublicPowerProfile) {
  return getPublicRoleGroup(profile) === "court" ? "court_profile_open" : "badge_profile_open";
}

export function getPublicRoleSourceGroups(sources: PublicPowerSource[]) {
  const agencyOrCourt = sources.filter((source) => officialAgencySourceTypes.has(source.sourceType));
  const policyAndInfo = sources.filter((source) => policySourceTypes.has(source.sourceType));
  const publicRecords = sources.filter((source) => publicRecordSourceTypes.has(source.sourceType));
  const incidentCaseMentions = sources.filter((source) => incidentCaseSourceTypes.has(source.sourceType));

  return {
    agencyOrCourt,
    policyAndInfo,
    publicRecords,
    incidentCaseMentions,
  };
}

export function getSafePublicRoleQuestions(profile: PublicPowerProfile) {
  const agencyOrCourt = getPublicRoleGroup(profile) === "court" ? "court" : "agency";
  return [
    {
      label: "Policy manual",
      question: `Where can residents find the current public policy manual for this ${agencyOrCourt}?`,
    },
    {
      label: "Public information",
      question: `Where is the official public information request page for ${profile.name}?`,
    },
    {
      label: "Current role source",
      question: `Which public source confirms the current officeholder or public role for ${profile.name}?`,
    },
    {
      label: "Minutes and budget",
      question: `Where can the public view meeting minutes, budget records, or public oversight records tied to ${profile.name}?`,
    },
  ];
}

export function publicRoleSourceLabel(sourceType: PublicPowerSource["sourceType"]) {
  return sourceType.replaceAll("-", " ");
}
