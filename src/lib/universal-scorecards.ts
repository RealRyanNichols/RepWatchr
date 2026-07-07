import type { PublicPowerKind } from "@/types/power-watch";

export const profileScorecardTargetTypes = [
  "official",
  "school_board",
  "attorney",
  "law_firm",
  "bar_source",
  "media_company",
  "journalist",
  "editor",
  "newsroom_leadership",
  "law_enforcement_agency",
  "sheriff",
  "constable",
  "police_chief",
  "public_safety_official",
  "agency_official",
  "judge",
  "prosecutor",
  "district_attorney",
  "court_official",
  "oversight_agency",
] as const;

export type ProfileScorecardTargetType = (typeof profileScorecardTargetTypes)[number];

const powerKindToTargetType: Record<PublicPowerKind, ProfileScorecardTargetType> = {
  attorney: "attorney",
  "bar-source": "bar_source",
  "agency-official": "agency_official",
  constable: "constable",
  "court-official": "court_official",
  "district-attorney": "district_attorney",
  editor: "editor",
  judge: "judge",
  journalist: "journalist",
  "law-firm": "law_firm",
  "law-enforcement-agency": "law_enforcement_agency",
  "media-company": "media_company",
  "newsroom-leadership": "newsroom_leadership",
  "oversight-agency": "oversight_agency",
  "police-chief": "police_chief",
  prosecutor: "prosecutor",
  "public-safety-official": "public_safety_official",
  sheriff: "sheriff",
};

const targetTypeLabels: Record<ProfileScorecardTargetType, string> = {
  attorney: "Attorney",
  bar_source: "Bar source",
  agency_official: "Agency official",
  constable: "Constable",
  court_official: "Court official",
  district_attorney: "District attorney",
  editor: "Editor",
  judge: "Judge",
  journalist: "Journalist",
  law_firm: "Law firm",
  law_enforcement_agency: "Law-enforcement agency",
  media_company: "Media company",
  newsroom_leadership: "Newsroom leadership",
  official: "Official",
  oversight_agency: "Oversight agency",
  police_chief: "Police chief",
  prosecutor: "Prosecutor",
  public_safety_official: "Public-safety official",
  school_board: "School-board member",
  sheriff: "Sheriff",
};

export function getProfileScorecardTargetType(kind: PublicPowerKind): ProfileScorecardTargetType {
  return powerKindToTargetType[kind];
}

export function getProfileScorecardLabel(type: ProfileScorecardTargetType): string {
  return targetTypeLabels[type];
}
