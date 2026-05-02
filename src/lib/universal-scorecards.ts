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
  "police_chief",
  "public_safety_official",
  "oversight_agency",
] as const;

export type ProfileScorecardTargetType = (typeof profileScorecardTargetTypes)[number];

const powerKindToTargetType: Record<PublicPowerKind, ProfileScorecardTargetType> = {
  attorney: "attorney",
  "bar-source": "bar_source",
  editor: "editor",
  journalist: "journalist",
  "law-firm": "law_firm",
  "law-enforcement-agency": "law_enforcement_agency",
  "media-company": "media_company",
  "newsroom-leadership": "newsroom_leadership",
  "oversight-agency": "oversight_agency",
  "police-chief": "police_chief",
  "public-safety-official": "public_safety_official",
  sheriff: "sheriff",
};

const targetTypeLabels: Record<ProfileScorecardTargetType, string> = {
  attorney: "Attorney",
  bar_source: "Bar source",
  editor: "Editor",
  journalist: "Journalist",
  law_firm: "Law firm",
  law_enforcement_agency: "Law-enforcement agency",
  media_company: "Media company",
  newsroom_leadership: "Newsroom leadership",
  official: "Official",
  oversight_agency: "Oversight agency",
  police_chief: "Police chief",
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
