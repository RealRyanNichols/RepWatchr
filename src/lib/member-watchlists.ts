export const watchEntityTypes = [
  "official",
  "city",
  "school_board",
  "issue",
  "bill",
  "campaign",
  "donor",
  "pac",
  "county_commissioner",
  "agency",
  "court",
  "judge",
  "race",
  "county",
  "research",
] as const;

export const watchAlertTypes = [
  "weekly_digest",
  "daily_digest",
  "breaking_alerts",
  "major_vote_alerts",
  "new_funding",
  "new_source",
  "new_article",
  "new_correction",
  "new_meeting",
  "new_filing",
] as const;

export type WatchEntityType = (typeof watchEntityTypes)[number];
export type WatchAlertType = (typeof watchAlertTypes)[number];

export const watchEntityLabels: Record<WatchEntityType, string> = {
  official: "Official",
  city: "City",
  school_board: "School Board",
  issue: "Issue",
  bill: "Bill",
  campaign: "Campaign",
  donor: "Donor",
  pac: "PAC",
  county_commissioner: "County Commissioner",
  agency: "Agency",
  court: "Court",
  judge: "Judge",
  race: "Race",
  county: "County",
  research: "Research",
};

export const watchAlertLabels: Record<WatchAlertType, string> = {
  weekly_digest: "Weekly Digest",
  daily_digest: "Daily Digest",
  breaking_alerts: "Breaking Alerts",
  major_vote_alerts: "Major Vote Alerts",
  new_funding: "New Funding",
  new_source: "New Source",
  new_article: "New Article",
  new_correction: "New Correction",
  new_meeting: "New Meeting",
  new_filing: "New Filing",
};

export const defaultWatchAlertPreferences: Array<{ alertType: WatchAlertType; enabled: boolean }> = [
  { alertType: "weekly_digest", enabled: true },
  { alertType: "daily_digest", enabled: false },
  { alertType: "breaking_alerts", enabled: true },
  { alertType: "major_vote_alerts", enabled: true },
  { alertType: "new_funding", enabled: true },
  { alertType: "new_source", enabled: true },
  { alertType: "new_article", enabled: true },
  { alertType: "new_correction", enabled: true },
  { alertType: "new_meeting", enabled: true },
  { alertType: "new_filing", enabled: true },
];

export function isWatchEntityType(value: unknown): value is WatchEntityType {
  return typeof value === "string" && watchEntityTypes.includes(value as WatchEntityType);
}

export function isWatchAlertType(value: unknown): value is WatchAlertType {
  return typeof value === "string" && watchAlertTypes.includes(value as WatchAlertType);
}
