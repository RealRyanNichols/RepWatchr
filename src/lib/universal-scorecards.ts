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
] as const;

export type ProfileScorecardTargetType = (typeof profileScorecardTargetTypes)[number];

const powerKindToTargetType: Record<PublicPowerKind, ProfileScorecardTargetType> = {
  attorney: "attorney",
  "bar-source": "bar_source",
  editor: "editor",
  journalist: "journalist",
  "law-firm": "law_firm",
  "media-company": "media_company",
  "newsroom-leadership": "newsroom_leadership",
};

const targetTypeLabels: Record<ProfileScorecardTargetType, string> = {
  attorney: "Attorney",
  bar_source: "Bar source",
  editor: "Editor",
  journalist: "Journalist",
  law_firm: "Law firm",
  media_company: "Media company",
  newsroom_leadership: "Newsroom leadership",
  official: "Official",
  school_board: "School-board member",
};

export function getProfileScorecardTargetType(kind: PublicPowerKind): ProfileScorecardTargetType {
  return powerKindToTargetType[kind];
}

export function getProfileScorecardLabel(type: ProfileScorecardTargetType): string {
  return targetTypeLabels[type];
}
