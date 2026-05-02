export type PublicPowerKind =
  | "law-firm"
  | "attorney"
  | "bar-source"
  | "media-company"
  | "journalist"
  | "editor"
  | "newsroom-leadership"
  | "law-enforcement-agency"
  | "sheriff"
  | "police-chief"
  | "public-safety-official"
  | "oversight-agency";

export type PublicPowerStatus =
  | "source_seeded"
  | "needs_profile_buildout"
  | "profiled"
  | "needs_source_review";

export interface PublicPowerSource {
  title: string;
  url: string;
  sourceType:
    | "official-directory"
    | "official-website"
    | "newsroom-contact"
    | "team-page"
    | "court-record"
    | "public-record"
    | "case-file"
    | "review-directory"
    | "article"
    | "agency-directory"
    | "policy-record"
    | "complaint-process"
    | "oversight-record";
  lastCheckedAt: string;
}

export interface PublicPowerAffiliatedPerson {
  name: string;
  role: string;
  slug?: string;
}

export interface PublicPowerProfile {
  slug: string;
  name: string;
  kind: PublicPowerKind;
  categoryLabel: string;
  city?: string;
  county?: string;
  state: string;
  region: string;
  summary: string;
  whyTracked: string;
  authorityAreas: string[];
  scrutinyAreas: string[];
  profileStatus: PublicPowerStatus;
  buildoutPercent: number;
  profileTags?: string[];
  profileImageUrl?: string;
  profileImageAlt?: string;
  profileImageSource?: string;
  profileImageKind?: "headshot" | "firm-logo" | "company-logo" | "building" | "placeholder";
  watchMark?: {
    label: string;
    tone: "red" | "amber";
    reason: string;
    status: "needs_records_review" | "client_allegation" | "source_backed";
  };
  featuredSpotlight?: {
    label: string;
    title: string;
    summary: string;
    status: "verified_public_record" | "client_allegation" | "needs_records_review";
    caseNumber?: string;
    callout?: string;
  };
  sentimentSummary?: {
    label: string;
    score?: number;
    basis: string;
    lastUpdated: string;
  };
  accountabilitySignals?: Array<{
    label: string;
    status: "verified" | "client_allegation" | "not_found" | "needs_records_review";
    tone: "good" | "warning" | "bad" | "neutral";
    detail: string;
    sourceTitle?: string;
  }>;
  connectedOfficialIds?: string[];
  affiliatedOrganizationSlug?: string;
  affiliatedPeople?: PublicPowerAffiliatedPerson[];
  sourceLinks: PublicPowerSource[];
}

export interface PublicPowerStats {
  totalProfiles: number;
  organizations: number;
  people: number;
  sourceSeeded: number;
  needsBuildout: number;
  sourceLinks: number;
  counties: number;
  cities: number;
}
