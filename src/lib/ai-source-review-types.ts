export const AI_REVIEW_RECOMMENDATIONS = [
  "attach_to_profile",
  "attach_to_race",
  "attach_to_story",
  "needs_more_info",
  "reject",
  "duplicate",
  "unsafe",
  "broken_link",
  "needs_human_review",
] as const;

export const AI_REVIEW_SAFETY_FLAGS = [
  "private_address",
  "minor_child",
  "threat",
  "doxxing",
  "unsourced_criminal_accusation",
  "private_medical",
  "private_family_info",
  "defamation_risk",
  "unsupported_certainty",
  "broken_source",
  "paywalled_source",
  "ambiguous_source",
  "duplicate_possible",
] as const;

export type AiReviewRecommendation = (typeof AI_REVIEW_RECOMMENDATIONS)[number];
export type AiReviewSafetyFlag = (typeof AI_REVIEW_SAFETY_FLAGS)[number];

export type AiReviewOutput = {
  summary: string;
  source_type_guess: string;
  target_entity_guess: string;
  appears_to_show: string;
  does_not_prove: string;
  missing_context: string[];
  safety_flags: AiReviewSafetyFlag[];
  suggested_public_label: string;
  recommended_admin_action: AiReviewRecommendation;
  suggested_public_question: string;
  suggested_safe_share_line: string;
  suggested_admin_note: string;
  human_review_required: true;
};

export const AI_REVIEW_HUMAN_NOTICE = "This is an assistant suggestion. Human review required.";
