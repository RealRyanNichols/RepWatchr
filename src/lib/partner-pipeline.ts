import { cleanEmail, cleanLongText, cleanText, cleanUrl } from "@/lib/source-submissions";

export const PARTNER_INTEREST_TYPES = [
  "investor",
  "data_api_partner",
  "media_partner",
  "legal_research_customer",
  "journalist",
  "civic_group",
  "nonprofit",
  "campaign_public_affairs",
  "school_board_monitoring",
  "county_monitoring",
  "organization_dashboard",
  "sponsor_civic_education",
  "government_contractor_monitoring",
  "other",
] as const;

export type PartnerInterestType = (typeof PARTNER_INTEREST_TYPES)[number];

export const PARTNER_PIPELINE_STATUSES = [
  "new",
  "reviewed",
  "contacted",
  "meeting_scheduled",
  "qualified",
  "not_fit",
  "partner",
  "investor_interest",
  "archived",
] as const;

export type PartnerPipelineStatus = (typeof PARTNER_PIPELINE_STATUSES)[number];

export const PARTNER_ACCOUNT_STATUSES = ["prospect", "active", "paused", "not_fit", "archived"] as const;
export type PartnerAccountStatus = (typeof PARTNER_ACCOUNT_STATUSES)[number];

export const partnerInterestTypeLabels: Record<PartnerInterestType, string> = {
  investor: "Investor",
  data_api_partner: "Data/API partner",
  media_partner: "Media partner",
  legal_research_customer: "Legal/research customer",
  journalist: "Journalist",
  civic_group: "Civic group",
  nonprofit: "Nonprofit",
  campaign_public_affairs: "Campaign/public affairs",
  school_board_monitoring: "School board monitoring",
  county_monitoring: "County monitoring",
  organization_dashboard: "Organization dashboard",
  sponsor_civic_education: "Sponsor civic education",
  government_contractor_monitoring: "Government contractor monitoring",
  other: "Other",
};

export type PartnerInterestInput = {
  anonymousId?: unknown;
  name?: unknown;
  email?: unknown;
  organization?: unknown;
  title?: unknown;
  website?: unknown;
  interestType?: unknown;
  budgetOrCheckSize?: unknown;
  jurisdictionFocus?: unknown;
  message?: unknown;
  referrer?: unknown;
  landingPage?: unknown;
  utmSource?: unknown;
  utmMedium?: unknown;
  utmCampaign?: unknown;
  utmTerm?: unknown;
  utmContent?: unknown;
};

export type NormalizedPartnerInterest = {
  anonymousId: string;
  name: string;
  email: string;
  organization: string;
  title: string;
  website: string;
  interestType: PartnerInterestType;
  budgetOrCheckSize: string;
  jurisdictionFocus: string;
  message: string;
  attribution: Record<string, string>;
};

function normalizeInterestType(value: unknown): PartnerInterestType {
  const normalized = cleanText(value, 120).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (PARTNER_INTEREST_TYPES.includes(normalized as PartnerInterestType)) return normalized as PartnerInterestType;

  const legacyMap: Record<string, PartnerInterestType> = {
    investor_interest: "investor",
    strategic_partner: "other",
    data_api_partner: "data_api_partner",
    civic_media_partner: "media_partner",
    election_research_partner: "legal_research_customer",
    contributor_network: "civic_group",
  };

  return legacyMap[normalized] ?? "other";
}

export function normalizePartnerPipelineStatus(value: unknown): PartnerPipelineStatus {
  const normalized = cleanText(value, 80).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return PARTNER_PIPELINE_STATUSES.includes(normalized as PartnerPipelineStatus) ? (normalized as PartnerPipelineStatus) : "new";
}

export function normalizePartnerAccountStatus(value: unknown): PartnerAccountStatus {
  const normalized = cleanText(value, 80).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return PARTNER_ACCOUNT_STATUSES.includes(normalized as PartnerAccountStatus) ? (normalized as PartnerAccountStatus) : "prospect";
}

export function normalizePartnerInterest(input: PartnerInterestInput): NormalizedPartnerInterest {
  return {
    anonymousId: cleanText(input.anonymousId, 120),
    name: cleanText(input.name, 255),
    email: cleanEmail(input.email),
    organization: cleanText(input.organization, 255),
    title: cleanText(input.title, 255),
    website: cleanUrl(input.website),
    interestType: normalizeInterestType(input.interestType),
    budgetOrCheckSize: cleanText(input.budgetOrCheckSize, 255),
    jurisdictionFocus: cleanText(input.jurisdictionFocus, 255),
    message: cleanLongText(input.message, 5000),
    attribution: {
      referrer: cleanText(input.referrer, 1000),
      landing_page: cleanText(input.landingPage, 1000),
      utm_source: cleanText(input.utmSource, 255),
      utm_medium: cleanText(input.utmMedium, 255),
      utm_campaign: cleanText(input.utmCampaign, 255),
      utm_term: cleanText(input.utmTerm, 255),
      utm_content: cleanText(input.utmContent, 255),
      intake: "investor_partner_pipeline",
    },
  };
}

export function validatePartnerInterest(input: NormalizedPartnerInterest) {
  if (!input.name) return "Add your name.";
  if (!input.email) return "Add a valid email address.";
  if (!input.message && !input.organization && !input.jurisdictionFocus) {
    return "Add a short note, organization, or jurisdiction focus so RepWatchr knows why you reached out.";
  }
  return "";
}

export function statusLabel(value: string) {
  return value.replaceAll("_", " ");
}
