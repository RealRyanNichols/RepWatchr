export const civicWatchEntityTypes = [
  "official",
  "candidate",
  "race",
  "office",
  "agency",
  "school_board",
  "city",
  "county",
  "state",
  "federal_district",
  "judge",
  "court",
  "sheriff",
  "police_department",
  "bill",
  "vote",
  "donor",
  "pac",
  "vendor",
  "story",
  "source",
  "issue",
  "search_query",
] as const;

export const watchReasons = [
  "My district",
  "My county",
  "My school board",
  "Public safety",
  "Campaign finance",
  "Vote tracking",
  "Meeting monitoring",
  "Research",
  "Media",
  "Legal/professional",
  "Other",
] as const;

export const civicFeedbackTypes = [
  "useful",
  "needs_more_sources",
  "i_am_watching",
  "request_review",
  "compare_this",
  "missing_information",
  "source_useful",
  "source_broken",
  "needs_context",
  "better_source_available",
  "supports_claim",
  "does_not_support_claim",
  "needs_more_records",
  "follow_topic",
  "send_updates",
  "share_receipt",
  "watching_race",
  "missing_candidate",
  "missing_finance_source",
  "missing_election_source",
  "build_comparison",
  "good_question",
  "needs_better_wording",
  "ask_at_meeting",
  "copied_question",
] as const;

export type CivicWatchEntityType = (typeof civicWatchEntityTypes)[number];
export type WatchReason = (typeof watchReasons)[number];
export type CivicFeedbackType = (typeof civicFeedbackTypes)[number];

export type CivicFeedbackOption = {
  feedbackType: CivicFeedbackType;
  value: string;
  label: string;
  detail?: string;
};

export const profileFeedbackOptions: CivicFeedbackOption[] = [
  { feedbackType: "useful", value: "yes", label: "Useful", detail: "This profile helped me understand the record." },
  { feedbackType: "needs_more_sources", value: "yes", label: "Needs sources", detail: "Important records are missing." },
  { feedbackType: "request_review", value: "yes", label: "Request review", detail: "This dossier needs a closer look." },
  { feedbackType: "compare_this", value: "yes", label: "Compare", detail: "I want this compared against similar officials." },
];

export const sourceFeedbackOptions: CivicFeedbackOption[] = [
  { feedbackType: "source_useful", value: "yes", label: "Useful source" },
  { feedbackType: "source_broken", value: "yes", label: "Broken link" },
  { feedbackType: "needs_context", value: "yes", label: "Needs context" },
  { feedbackType: "better_source_available", value: "yes", label: "Better source exists" },
];

export const publicQuestionFeedbackOptions: CivicFeedbackOption[] = [
  { feedbackType: "good_question", value: "yes", label: "Good question" },
  { feedbackType: "needs_better_wording", value: "yes", label: "Needs wording" },
  { feedbackType: "ask_at_meeting", value: "yes", label: "Ask at meeting" },
];

export function isCivicWatchEntityType(value: unknown): value is CivicWatchEntityType {
  return typeof value === "string" && civicWatchEntityTypes.includes(value as CivicWatchEntityType);
}

export function isWatchReason(value: unknown): value is WatchReason {
  return typeof value === "string" && watchReasons.includes(value as WatchReason);
}

export function isCivicFeedbackType(value: unknown): value is CivicFeedbackType {
  return typeof value === "string" && civicFeedbackTypes.includes(value as CivicFeedbackType);
}
