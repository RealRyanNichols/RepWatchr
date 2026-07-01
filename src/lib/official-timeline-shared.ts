import type { ProfileSourceTier } from "@/lib/profile-overlays";

export type OfficialTimelineEventType =
  | "speech"
  | "vote"
  | "donation"
  | "campaign_filing"
  | "meeting"
  | "board_appointment"
  | "committee_vote"
  | "article"
  | "investigation"
  | "correction"
  | "public_statement"
  | "funding"
  | "red_flag"
  | "disclosure"
  | "source_link"
  | "profile_update";

export type OfficialTimelineStatus =
  | "source_linked"
  | "needs_review"
  | "verified"
  | "attached_to_profile";

export interface OfficialTimelineEvent {
  id: string;
  officialId: string;
  officialName: string;
  eventType: OfficialTimelineEventType;
  eventDate: string | null;
  title: string;
  summary: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceDomain: string | null;
  sourceDate: string | null;
  sourceTier: ProfileSourceTier;
  status: OfficialTimelineStatus;
  jurisdiction: string | null;
  office: string | null;
  state: string | null;
  county: string | null;
  tags: string[];
  sourceTable: string | null;
  sourceId: string | null;
  sourceHash: string;
  shareSnippet: string;
  embedAllowed: boolean;
}

export const OFFICIAL_TIMELINE_EVENT_TYPES: Record<
  OfficialTimelineEventType,
  { label: string; shortLabel: string; description: string }
> = {
  speech: {
    label: "Speech",
    shortLabel: "Speech",
    description: "Public remarks, speeches, hearings, or recorded appearances.",
  },
  vote: {
    label: "Vote",
    shortLabel: "Vote",
    description: "Roll-call vote, scored vote, or source-backed voting record.",
  },
  donation: {
    label: "Donation",
    shortLabel: "Donation",
    description: "Campaign contribution or donor record from a public filing.",
  },
  campaign_filing: {
    label: "Campaign Filing",
    shortLabel: "Filing",
    description: "Finance report, candidate filing, or public campaign disclosure.",
  },
  meeting: {
    label: "Meeting",
    shortLabel: "Meeting",
    description: "Public meeting, agenda, minutes, or video record.",
  },
  board_appointment: {
    label: "Board Appointment",
    shortLabel: "Appointment",
    description: "Appointment, board seat, committee assignment, or official role record.",
  },
  committee_vote: {
    label: "Committee Vote",
    shortLabel: "Committee",
    description: "Committee vote or committee action tied to a public source.",
  },
  article: {
    label: "Article",
    shortLabel: "Article",
    description: "Named publication or RepWatchr story linked to this official.",
  },
  investigation: {
    label: "Investigation",
    shortLabel: "Review",
    description: "Public-record review, watchdog item, lawsuit, ethics, or source-backed question.",
  },
  correction: {
    label: "Correction",
    shortLabel: "Correction",
    description: "Correction request, update, or public record cleanup event.",
  },
  public_statement: {
    label: "Public Statement",
    shortLabel: "Statement",
    description: "Official social account, public statement, interview, or post.",
  },
  funding: {
    label: "Funding",
    shortLabel: "Funding",
    description: "Money trail source, donor breakdown, or campaign finance snapshot.",
  },
  red_flag: {
    label: "Red Flag",
    shortLabel: "Flag",
    description: "Source-backed item that RepWatchr marks for public review.",
  },
  disclosure: {
    label: "Disclosure",
    shortLabel: "Disclosure",
    description: "Financial, trading, ethics, or other official disclosure source.",
  },
  source_link: {
    label: "Source Link",
    shortLabel: "Source",
    description: "Official public source attached to the profile.",
  },
  profile_update: {
    label: "Profile Update",
    shortLabel: "Update",
    description: "RepWatchr profile buildout, verification, or public source update.",
  },
};

function publicSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.repwatchr.com").replace(/\/+$/, "");
}

export function officialTimelineUrl(officialId: string) {
  return `${publicSiteUrl()}/officials/${officialId}/timeline`;
}

export function officialTimelineEmbedCode(officialId: string) {
  return `<iframe src="${publicSiteUrl()}/officials/${officialId}/timeline/embed" title="RepWatchr official timeline" loading="lazy" style="width:100%;height:720px;border:0;border-radius:12px;"></iframe>`;
}
