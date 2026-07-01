export const SOURCE_TARGET_TYPES = [
  "public official",
  "candidate",
  "law enforcement official",
  "judge/court",
  "prosecutor",
  "agency",
  "city/county/state/federal office",
  "school board",
  "race/election",
  "vote",
  "funding",
  "story/article",
  "correction",
  "other",
] as const;

export const SOURCE_TYPES = [
  "official website",
  "meeting agenda",
  "meeting minutes",
  "meeting video",
  "vote record",
  "campaign finance filing",
  "ethics filing",
  "court record",
  "agency document",
  "public statement",
  "news article",
  "press release",
  "public social post",
  "public database",
  "procurement/vendor record",
  "election filing",
  "law enforcement public information",
  "other",
] as const;

export const SOURCE_REQUESTED_ACTIONS = [
  "attach to profile",
  "create new profile",
  "correct existing profile",
  "add to story",
  "add to race",
  "report broken source",
  "request review",
  "other",
] as const;

export const SOURCE_STATUSES = [
  "new",
  "needs_review",
  "verified",
  "rejected",
  "needs_more_info",
  "duplicate",
  "attached_to_profile",
  "attached_to_story",
  "attached_to_race",
  "archived",
] as const;

export const SOURCE_CONFIDENCES = [
  "needs_review",
  "source_backed",
  "official_record",
  "weak_match",
  "disputed",
  "rejected",
] as const;

export const SOURCE_PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export type SourceTargetType = (typeof SOURCE_TARGET_TYPES)[number];
export type SourceType = (typeof SOURCE_TYPES)[number];
export type SourceRequestedAction = (typeof SOURCE_REQUESTED_ACTIONS)[number];
export type SourceStatus = (typeof SOURCE_STATUSES)[number];
export type SourceConfidence = (typeof SOURCE_CONFIDENCES)[number];
export type SourcePriority = (typeof SOURCE_PRIORITIES)[number];
