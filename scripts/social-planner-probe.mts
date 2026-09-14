import { checkVoiceRules, validateDraft, type SocialDraftInput } from "@/lib/social-planner";

/**
 * Exercises the planner's rules against real inputs.
 *
 * The two rules Ryan asked for by name are the ones that have to be provable:
 * the lane never sells, and nothing reaches a platform unreviewed. The second
 * is a database constraint and is checked by reading the migration; the first
 * is code and is checked by running it.
 */

const problems: string[] = [];

function base(overrides: Partial<SocialDraftInput> = {}): SocialDraftInput {
  return {
    platform: "x",
    body: "Same county.\nSame rule.\nOpposite outcome.\n\nThe vote is on the record.",
    sourceKind: "daily_wire",
    sourceLinks: [{ title: "HB 1750 roll call", url: "https://capitol.texas.gov/example" }],
    scope: "home-district",
    ...overrides,
  };
}

function expectOk(label: string, input: SocialDraftInput) {
  const result = validateDraft(input);
  if (!result.ok) problems.push(`${label} should validate, got: ${result.problems.join(" | ")}`);
  return result;
}

function expectRejected(label: string, input: SocialDraftInput, expectRule: string) {
  const result = validateDraft(input);
  if (result.ok) {
    problems.push(`${label} should have been rejected and was not.`);
    return;
  }
  if (!result.problems.some((problem) => problem.includes(expectRule))) {
    problems.push(`${label} was rejected but not for ${expectRule}: ${result.problems.join(" | ")}`);
  }
}

// A clean, sourced, in-voice post is accepted.
expectOk("a plain sourced post", base());

// "Don't try to sell anyone." Every one of these has to bounce.
const sellingBodies: Array<[string, string]> = [
  ["a booking pitch", "Book a strategy call and I will show you the record."],
  ["a services pitch", "I can build you a site like this one."],
  ["a donation ask", "Chip in to keep this work going."],
  ["engagement farming", "Read and share this post."],
  ["a discount", "50% off this week only."],
  ["urgency marketing", "Limited time. Act now."],
  ["a follow pitch", "Follow me for more accountability reporting."],
  ["a DM solicitation", "DM me for the full file."],
  ["link in bio", "Full breakdown, link in bio."],
];
for (const [label, body] of sellingBodies) {
  expectRejected(label, base({ body }), "no_selling");
}

// Style rules that are stated in the project instructions.
expectRejected("an em dash", base({ body: "The tape is the tape — release it." }), "no_em_dash");
expectRejected(
  "post-about-the-post preamble",
  base({ body: "This article discusses the appraisal vote." }),
  "no_preamble",
);
expectRejected(
  "an X post over the limit",
  base({ body: `${"The record does not lie. ".repeat(20)}` }),
  "x_too_long",
);
expectRejected(
  "a wall of text",
  base({ platform: "facebook", body: "word ".repeat(120).trim() }),
  "wall_of_text",
);

// Reporting the truth means pointing at something. No source, no draft.
expectRejected("a post with no source", base({ sourceLinks: [] }), "source link");

// A Fieldy lead may aim coverage but may never be its own source.
expectRejected(
  "a Fieldy lead citing only the conversation",
  base({
    sourceKind: "fieldy_lead",
    sourceLinks: [{ title: "Conversation", url: "https://app.fieldy.ai/conversation/123" }],
  }),
  "Fieldy lead cannot cite only the conversation",
);

const fieldyWithRecord = expectOk(
  "a Fieldy lead pointing at the public record",
  base({
    sourceKind: "fieldy_lead",
    sourceLinks: [{ title: "Gregg County agenda, Sept 3", url: "https://co.gregg.tx.us/agenda" }],
    conversationParticipants: ["Ryan Nichols", "A constituent"],
  }),
);
if (fieldyWithRecord.ok && !fieldyWithRecord.normalized.requires_confirmation) {
  problems.push("A Fieldy lead must be flagged requires_confirmation so it can never be approved silently.");
}
if (fieldyWithRecord.ok && fieldyWithRecord.normalized.conversation_participants.length !== 2) {
  problems.push("A Fieldy lead must record who was in the conversation.");
}

// Facebook tolerates length that X does not; the limit is per platform.
// Comfortably past 280 so the assertion is about the rule, not a boundary.
const longForFacebook = "Line one.\n\nLine two carries the detail.\n\n" + "Short line. ".repeat(30);
if (checkVoiceRules(longForFacebook, "facebook").some((v) => v.rule === "x_too_long")) {
  problems.push("The X length limit is being applied to a Facebook post.");
}
if (!checkVoiceRules(longForFacebook, "x").some((v) => v.rule === "x_too_long")) {
  problems.push("The X length limit is not being applied to an X post.");
}

console.log(JSON.stringify({ problems }));
