import { isFeatureEnabled } from "@/lib/feature-flags";
import { cleanLongText, cleanText } from "@/lib/source-submissions";
import { scanPublicContentForWarnings } from "@/lib/trust-safety";

export const AI_WRITING_USE_CASES = [
  "public_question",
  "safe_share_line",
  "source_packet_summary",
  "missing_source_request",
  "correction_request_wording",
  "meeting_question",
  "records_request_summary",
  "profile_summary_draft",
  "digest_summary",
  "package_interest_message",
] as const;

export const AI_WRITING_OUTPUT_STYLES = [
  "neutral",
  "concise",
  "meeting-safe",
  "public-record formal",
  "social share safe",
  "dashboard summary",
  "source packet language",
] as const;

export const AI_WRITING_LABELS = [
  "Public question",
  "Source-backed claim",
  "Needs source",
  "Under review",
  "Confirmed public record",
] as const;

export type AIWritingUseCase = (typeof AI_WRITING_USE_CASES)[number];
export type AIWritingOutputStyle = (typeof AI_WRITING_OUTPUT_STYLES)[number];
export type AIWritingLabel = (typeof AI_WRITING_LABELS)[number];

export type AIWritingInput = {
  anonymousId?: unknown;
  actorRole?: unknown;
  useCase?: unknown;
  style?: unknown;
  prompt?: unknown;
  target?: unknown;
  topic?: unknown;
  sourceUrl?: unknown;
  contextText?: unknown;
  existingText?: unknown;
  sourceStatus?: unknown;
  metadata?: unknown;
};

export type NormalizedAIWritingInput = {
  anonymousId: string;
  actorRole: string;
  useCase: AIWritingUseCase;
  style: AIWritingOutputStyle;
  prompt: string;
  target: string;
  topic: string;
  sourceUrl: string;
  contextText: string;
  existingText: string;
  sourceStatus: string;
  metadata: Record<string, unknown>;
};

export type AIWritingSafetyFlag = {
  id: string;
  label: string;
  severity: "block" | "warn";
  detail: string;
  matchedText?: string;
};

export type AIWritingOutput = {
  safe_text: string;
  label: AIWritingLabel;
  what_this_does_not_claim: string;
  source_needed: boolean;
  safety_flags: AIWritingSafetyFlag[];
  suggested_next_action: string;
};

export type AIWritingResult = {
  enabled: boolean;
  provider: string;
  model: string;
  status: "completed" | "fallback" | "failed";
  disabledReason?: string;
  output: AIWritingOutput;
};

const FORBIDDEN_OUTPUT_TERMS = [
  "corrupt",
  "criminal",
  "guilty",
  "fraud",
  "bribery",
  "treason",
  "cover-up",
  "caught",
  "exposed",
] as const;

const SYSTEM_INSTRUCTION =
  "You help RepWatchr write safe, source-first public-record language. Do not make legal conclusions. Do not accuse anyone of crimes. Do not imply guilt. Do not use harassment language. Do not publish private personal information. Distinguish confirmed public records from public questions and missing-source items. Use cautious language like 'appears to show', 'according to the public source', 'RepWatchr needs a source for', and 'public question'. If the input is unsafe or unsupported, rewrite it into a safer request for sources or a neutral public question.";

function cleanMetadata(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeUseCase(value: unknown): AIWritingUseCase {
  const normalized = cleanText(value, 80).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return AI_WRITING_USE_CASES.includes(normalized as AIWritingUseCase) ? (normalized as AIWritingUseCase) : "public_question";
}

function normalizeStyle(value: unknown): AIWritingOutputStyle {
  const normalized = cleanText(value, 80).toLowerCase();
  return AI_WRITING_OUTPUT_STYLES.includes(normalized as AIWritingOutputStyle) ? (normalized as AIWritingOutputStyle) : "neutral";
}

function normalizeLabel(value: unknown, fallback: AIWritingLabel): AIWritingLabel {
  const normalized = cleanText(value, 80);
  return AI_WRITING_LABELS.includes(normalized as AIWritingLabel) ? (normalized as AIWritingLabel) : fallback;
}

export function normalizeAIWritingInput(input: AIWritingInput): NormalizedAIWritingInput {
  return {
    anonymousId: cleanText(input.anonymousId, 120),
    actorRole: cleanText(input.actorRole, 80) || "public_user",
    useCase: normalizeUseCase(input.useCase),
    style: normalizeStyle(input.style),
    prompt: cleanLongText(input.prompt, 3000),
    target: cleanText(input.target, 500),
    topic: cleanText(input.topic, 500),
    sourceUrl: cleanText(input.sourceUrl, 1000),
    contextText: cleanLongText(input.contextText, 6000),
    existingText: cleanLongText(input.existingText, 3000),
    sourceStatus: cleanText(input.sourceStatus, 120) || "needs_review",
    metadata: cleanMetadata(input.metadata),
  };
}

export function validateAIWritingInput(input: NormalizedAIWritingInput) {
  if (!input.prompt && !input.contextText && !input.existingText && !input.topic && !input.target) {
    return "Add a target, topic, source context, or draft text first.";
  }
  return "";
}

function compact(value: string, fallback: string, limit = 180) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) return fallback;
  if (cleaned.length <= limit) return cleaned;
  return `${cleaned.slice(0, limit - 1).trim()}...`;
}

function topicFor(input: NormalizedAIWritingInput) {
  return compact(input.topic || input.target || input.prompt || input.contextText, "this public record", 120);
}

function targetFor(input: NormalizedAIWritingInput) {
  return compact(input.target || input.topic || "this public record", "this public record", 100);
}

export function buildManualAIWritingOutput(input: NormalizedAIWritingInput): AIWritingOutput {
  const target = targetFor(input);
  const topic = topicFor(input);
  const source = input.sourceUrl || "[public source URL]";

  const byUseCase: Record<AIWritingUseCase, Pick<AIWritingOutput, "safe_text" | "label" | "what_this_does_not_claim" | "source_needed" | "suggested_next_action">> = {
    public_question: {
      safe_text: `Where can the public find the source for ${topic}?`,
      label: "Public question",
      what_this_does_not_claim: "This asks for the record. It does not claim misconduct or a final finding.",
      source_needed: true,
      suggested_next_action: "Attach the official source or submit this as a public question.",
    },
    safe_share_line: {
      safe_text: input.sourceUrl
        ? `According to this public source, ${topic}. Source: ${source}`
        : `RepWatchr is looking for a public source on ${target} related to ${topic}.`,
      label: input.sourceUrl ? "Source-backed claim" : "Needs source",
      what_this_does_not_claim: "This does not accuse anyone of wrongdoing or go beyond the linked source.",
      source_needed: !input.sourceUrl,
      suggested_next_action: input.sourceUrl ? "Share with the source link attached." : "Submit a public source before stronger wording is used.",
    },
    source_packet_summary: {
      safe_text: input.sourceUrl
        ? `This packet points to a public source about ${target}. The source should be reviewed for dates, jurisdiction, named public body, and what the record actually supports. Source: ${source}`
        : `This packet needs a public source for ${target} related to ${topic}.`,
      label: input.sourceUrl ? "Under review" : "Needs source",
      what_this_does_not_claim: "This packet summary is not a finding. It is a review note for source attachment.",
      source_needed: !input.sourceUrl,
      suggested_next_action: "Save the packet and submit it for RepWatchr review.",
    },
    missing_source_request: {
      safe_text: `RepWatchr needs a public source for ${target} related to ${topic}. Submit the official link, agenda, filing, video, vote record, or public record here.`,
      label: "Needs source",
      what_this_does_not_claim: "This does not state the claim is true. It asks for the public record.",
      source_needed: true,
      suggested_next_action: "Ask a voter, reporter, agency, or public body for the source link.",
    },
    correction_request_wording: {
      safe_text: `I believe this item may need correction because ${topic}. A public source that may help check or correct it is ${source}.`,
      label: "Under review",
      what_this_does_not_claim: "This does not say the current record is intentionally false.",
      source_needed: !input.sourceUrl,
      suggested_next_action: "Submit the correction request with the best public source available.",
    },
    meeting_question: {
      safe_text: `Before the meeting: can the public body point residents to the official source for ${topic}?`,
      label: "Public question",
      what_this_does_not_claim: "This is a meeting-safe question, not an accusation.",
      source_needed: true,
      suggested_next_action: "Copy this question and attach the meeting agenda or source link.",
    },
    records_request_summary: {
      safe_text: `This records response appears to relate to ${topic}. RepWatchr should review the response date, agency, jurisdiction, documents provided, missing records, and any private information before public use.`,
      label: "Under review",
      what_this_does_not_claim: "This does not publish or verify the response contents.",
      source_needed: !input.sourceUrl,
      suggested_next_action: "Save privately or submit for review before attaching it to a public profile.",
    },
    profile_summary_draft: {
      safe_text: `This profile summary should be limited to confirmed public-role records for ${target}. Separate confirmed records from public questions, missing sources, funding records, votes, and correction history.`,
      label: "Under review",
      what_this_does_not_claim: "This does not rate the official or imply wrongdoing by itself.",
      source_needed: !input.sourceUrl,
      suggested_next_action: "Attach source links before publishing this profile summary.",
    },
    digest_summary: {
      safe_text: `Watchlist update: ${topic}. Check the source trail, note what changed, and submit a missing source if the record is incomplete.`,
      label: "Under review",
      what_this_does_not_claim: "This is a digest summary, not a finding.",
      source_needed: !input.sourceUrl,
      suggested_next_action: "Open the record and inspect the source link before sharing.",
    },
    package_interest_message: {
      safe_text: `I need RepWatchr help organizing public sources for ${target}. The main topic is ${topic}. Please focus on public records, source gaps, and a safe review packet.`,
      label: "Public question",
      what_this_does_not_claim: "This is a service request summary, not a public allegation.",
      source_needed: false,
      suggested_next_action: "Submit the request and attach any public links available.",
    },
  };

  const draft = byUseCase[input.useCase];
  return validatePublicContentSafety({
    ...draft,
    safety_flags: [],
  });
}

export function validatePublicContentSafety(output: AIWritingOutput): AIWritingOutput {
  const trustWarnings = scanPublicContentForWarnings(output.safe_text).map((warning): AIWritingSafetyFlag => ({
    id: warning.id,
    label: warning.label,
    severity: warning.severity,
    detail: warning.detail,
    matchedText: warning.matchedText,
  }));

  const forbiddenWarnings = FORBIDDEN_OUTPUT_TERMS.flatMap((term): AIWritingSafetyFlag[] => {
    const pattern = new RegExp(`\\b${term.replace("-", "[- ]?")}\\b`, "i");
    const match = output.safe_text.match(pattern);
    if (!match) return [];
    return [
      {
        id: `forbidden-${term}`,
        label: `Forbidden output term: ${term}`,
        severity: "block",
        detail: "Safe RepWatchr assistant output cannot use accusation, guilt, or outrage language.",
        matchedText: match[0],
      },
    ];
  });

  return {
    ...output,
    safety_flags: [...output.safety_flags, ...trustWarnings, ...forbiddenWarnings],
  };
}

function parseStructuredOutput(value: unknown, fallback: AIWritingOutput): AIWritingOutput {
  const candidate = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

  const output: AIWritingOutput = {
    safe_text: cleanLongText(candidate.safe_text, 3000) || fallback.safe_text,
    label: normalizeLabel(candidate.label, fallback.label),
    what_this_does_not_claim: cleanLongText(candidate.what_this_does_not_claim, 1000) || fallback.what_this_does_not_claim,
    source_needed: typeof candidate.source_needed === "boolean" ? candidate.source_needed : fallback.source_needed,
    safety_flags: Array.isArray(candidate.safety_flags)
      ? candidate.safety_flags.map((item) => ({
          id: cleanText(item, 120),
          label: cleanText(item, 120),
          severity: "warn" as const,
          detail: "AI provider returned this safety flag.",
        })).filter((item) => item.id)
      : [],
    suggested_next_action: cleanLongText(candidate.suggested_next_action, 1000) || fallback.suggested_next_action,
  };

  return validatePublicContentSafety(output);
}

function extractOpenAIOutputText(response: Record<string, unknown>) {
  if (typeof response.output_text === "string") return response.output_text;
  const output = Array.isArray(response.output) ? response.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as { content?: unknown }).content) ? (item as { content: unknown[] }).content : [];
    for (const contentItem of content) {
      if (!contentItem || typeof contentItem !== "object") continue;
      const text = (contentItem as { text?: unknown }).text;
      if (typeof text === "string") return text;
    }
  }
  return "";
}

async function generateWithOpenAI(input: NormalizedAIWritingInput, fallback: AIWritingOutput) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { output: fallback, status: "fallback" as const, disabledReason: "OPENAI_API_KEY is not configured." };
  }

  const model = process.env.AI_WRITING_MODEL || "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        {
          role: "user",
          content: JSON.stringify({
            task: "Return only structured JSON for RepWatchr safe writing.",
            output_shape: {
              safe_text: "",
              label: "Public question | Source-backed claim | Needs source | Under review | Confirmed public record",
              what_this_does_not_claim: "",
              source_needed: true,
              safety_flags: [],
              suggested_next_action: "",
            },
            use_case: input.useCase,
            style: input.style,
            target: input.target,
            topic: input.topic,
            source_url: input.sourceUrl,
            source_status: input.sourceStatus,
            prompt: input.prompt,
            existing_text: input.existingText,
            context_text: input.contextText,
          }),
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    return { output: fallback, status: "failed" as const, disabledReason: `OpenAI returned ${response.status}.` };
  }

  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  const text = data ? extractOpenAIOutputText(data) : "";
  const parsed = JSON.parse(text || "{}") as unknown;
  const output = parseStructuredOutput(parsed, fallback);

  if (output.safety_flags.some((flag) => flag.severity === "block")) {
    return {
      output: {
        ...fallback,
        safety_flags: [
          ...fallback.safety_flags,
          {
            id: "unsafe-ai-output-replaced",
            label: "Unsafe AI output replaced",
            severity: "warn" as const,
            detail: "The provider output used blocked language, so RepWatchr returned the manual safe template instead.",
          },
        ],
      },
      status: "fallback" as const,
      disabledReason: "AI output failed the RepWatchr public-content safety check.",
    };
  }

  return { output, status: "completed" as const, model };
}

export async function runSafeAIWritingAssistant(input: NormalizedAIWritingInput): Promise<AIWritingResult> {
  const fallback = buildManualAIWritingOutput(input);
  const enabled = await isFeatureEnabled("ENABLE_AI_WRITING_ASSISTANT", {
    anonymousId: input.anonymousId,
  });

  if (!enabled) {
    return {
      enabled: false,
      provider: "manual_template",
      model: "manual_template",
      status: "fallback",
      disabledReason: "AI writing assistant is disabled. Manual templates are available.",
      output: fallback,
    };
  }

  const provider = (process.env.AI_PROVIDER || "openai").trim().toLowerCase();
  if (provider !== "openai") {
    return {
      enabled,
      provider,
      model: "manual_template",
      status: "fallback",
      disabledReason: `AI provider '${provider}' is not wired for safe writing yet.`,
      output: fallback,
    };
  }

  try {
    const result = await generateWithOpenAI(input, fallback);
    return {
      enabled,
      provider: "openai",
      model: result.model || process.env.AI_WRITING_MODEL || "gpt-4.1-mini",
      status: result.status,
      disabledReason: result.disabledReason,
      output: result.output,
    };
  } catch {
    return {
      enabled,
      provider: "openai",
      model: process.env.AI_WRITING_MODEL || "gpt-4.1-mini",
      status: "failed",
      disabledReason: "AI generation failed. Manual template returned.",
      output: fallback,
    };
  }
}

export function hasBlockingAIWritingFlags(output: AIWritingOutput) {
  return output.safety_flags.some((flag) => flag.severity === "block");
}
