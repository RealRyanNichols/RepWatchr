export type PublicPowerKind =
  | "law-firm"
  | "attorney"
  | "bar-source"
  | "media-company"
  | "journalist"
  | "editor"
  | "newsroom-leadership";

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
    | "article";
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
