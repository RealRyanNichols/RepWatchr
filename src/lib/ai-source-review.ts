import { isFeatureEnabled } from "@/lib/feature-flags";
import {
  AI_REVIEW_HUMAN_NOTICE,
  AI_REVIEW_RECOMMENDATIONS,
  AI_REVIEW_SAFETY_FLAGS,
  type AiReviewOutput,
  type AiReviewRecommendation,
  type AiReviewSafetyFlag,
} from "@/lib/ai-source-review-types";

export const AI_REVIEW_SYSTEM_INSTRUCTIONS =
  "You are assisting RepWatchr admins with public source review. Do not make legal conclusions. Do not accuse anyone of crimes. Do not treat user-submitted claims as verified. Distinguish what a source says from what it proves. Use cautious public-record language. Flag unsafe content, private addresses, minors, threats, doxxing, and unsupported allegations. Recommend human review for ambiguous material.";

type SourceSubmissionRecord = Record<string, unknown>;

export type AiSourceReviewInputSummary = {
  source_url: string | null;
  source_title: string | null;
  source_type: string | null;
  target_type: string | null;
  target_name: string | null;
  jurisdiction: string | null;
  requested_action: string | null;
  submitter_summary: string | null;
  why_it_matters: string | null;
  existing_source_labels: string[];
  existing_entity_info: Record<string, unknown>;
};

export type AiReviewConfig = {
  enabled: boolean;
  provider: string | null;
  model: string | null;
  reason: string;
};

export type AiReviewResult =
  | {
      ok: true;
      provider: string;
      model: string;
      inputSummary: AiSourceReviewInputSummary;
      outputSummary: AiReviewOutput;
    }
  | {
      ok: false;
      disabled?: boolean;
      status?: number;
      reason: string;
      provider?: string | null;
      model?: string | null;
      inputSummary?: AiSourceReviewInputSummary;
    };

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_OPENAI_MODEL = "gpt-5.5";

const aiReviewOutputSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "summary",
    "source_type_guess",
    "target_entity_guess",
    "appears_to_show",
    "does_not_prove",
    "missing_context",
    "safety_flags",
    "suggested_public_label",
    "recommended_admin_action",
    "suggested_public_question",
    "suggested_safe_share_line",
    "suggested_admin_note",
    "human_review_required",
  ],
  properties: {
    summary: { type: "string" },
    source_type_guess: { type: "string" },
    target_entity_guess: { type: "string" },
    appears_to_show: { type: "string" },
    does_not_prove: { type: "string" },
    missing_context: { type: "array", items: { type: "string" } },
    safety_flags: {
      type: "array",
      items: { type: "string", enum: [...AI_REVIEW_SAFETY_FLAGS] },
    },
    suggested_public_label: { type: "string" },
    recommended_admin_action: {
      type: "string",
      enum: [...AI_REVIEW_RECOMMENDATIONS],
    },
    suggested_public_question: { type: "string" },
    suggested_safe_share_line: { type: "string" },
    suggested_admin_note: { type: "string" },
    human_review_required: { type: "boolean" },
  },
} as const;

function cleanText(value: unknown, maxLength = 900) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function cleanNullableText(value: unknown, maxLength = 900) {
  const cleaned = cleanText(value, maxLength);
  return cleaned || null;
}

function cleanStringArray(value: unknown, maxItems = 8, maxLength = 240) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanText(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function cleanUrl(value: unknown) {
  const cleaned = cleanText(value, 700);
  if (!cleaned) return null;
  try {
    const url = new URL(cleaned);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function allowedRecommendation(value: unknown): AiReviewRecommendation {
  return typeof value === "string" && (AI_REVIEW_RECOMMENDATIONS as readonly string[]).includes(value)
    ? (value as AiReviewRecommendation)
    : "needs_human_review";
}

function allowedSafetyFlags(value: unknown): AiReviewSafetyFlag[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value.filter(
        (item): item is AiReviewSafetyFlag =>
          typeof item === "string" && (AI_REVIEW_SAFETY_FLAGS as readonly string[]).includes(item),
      ),
    ),
  );
}

function appendNotice(note: string) {
  return note.includes(AI_REVIEW_HUMAN_NOTICE) ? note : `${note ? `${note}\n\n` : ""}${AI_REVIEW_HUMAN_NOTICE}`;
}

function getTextBlob(submission: SourceSubmissionRecord) {
  return [
    submission.source_url,
    submission.source_title,
    submission.source_type,
    submission.target_type,
    submission.target_name,
    submission.jurisdiction,
    submission.requested_action,
    submission.claim_summary,
    submission.why_it_matters,
  ]
    .map((value) => cleanText(value, 5000))
    .filter(Boolean)
    .join(" ");
}

export function detectLocalSafetyFlags(submission: SourceSubmissionRecord): AiReviewSafetyFlag[] {
  const text = getTextBlob(submission);
  const flags = new Set<AiReviewSafetyFlag>();
  const sourceUrl = cleanText(submission.source_url, 700);

  if (!cleanUrl(sourceUrl)) flags.add("broken_source");
  if (/\b(bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|rebrand\.ly)\b/i.test(sourceUrl)) flags.add("ambiguous_source");
  if (/\b(paywall|subscriber|subscription required|login required)\b/i.test(text)) flags.add("paywalled_source");
  if (/\b\d{1,6}\s+[a-z0-9.'-]+(?:\s+[a-z0-9.'-]+){0,5}\s+(street|st|road|rd|drive|dr|lane|ln|court|ct|circle|cir|avenue|ave|boulevard|blvd|way|trail|trl)\b/i.test(text)) flags.add("private_address");
  if (/\bminor child\b|\bmy child\b|\bmy son\b|\bmy daughter\b|\bchild'?s name\b|\bage\s+\d{1,2}\b/i.test(text)) flags.add("minor_child");
  if (/\bkill\b|\bshoot\b|\bbomb\b|\bassassinat|\bhang\b|\blynch\b|\bbeat\s+(him|her|them|up)\b/i.test(text)) flags.add("threat");
  if (/\bdoxx|\bhome address\b|\bshow up at (his|her|their) house\b/i.test(text)) flags.add("doxxing");
  if (/\b(murderer|rapist|felon|criminal|stole|bribe|bribed|corrupt)\b/i.test(text)) flags.add("unsourced_criminal_accusation");
  if (/\bmedical record\b|\bdiagnosis\b|\bmedication\b|\btherapy\b|\bhipaa\b/i.test(text)) flags.add("private_medical");
  if (/\bspouse\b|\bwife\b|\bhusband\b|\bfamily\b|\bchildren\b/i.test(text)) flags.add("private_family_info");
  if (/\bdefamed\b|\bliar\b|\bfraudster\b|\btraitor\b|\btreason\b/i.test(text)) flags.add("defamation_risk");
  if (/\bproves\b|\bdefinitely\b|\bwithout question\b|\bexposed\b|\bcaught\b/i.test(text)) flags.add("unsupported_certainty");
  if (/\bduplicate\b|\balready submitted\b|\bsame as\b/i.test(text)) flags.add("duplicate_possible");
  if (!cleanText(submission.claim_summary, 60)) flags.add("ambiguous_source");

  return [...flags];
}

export function buildAiReviewInputSummary(submission: SourceSubmissionRecord): AiSourceReviewInputSummary {
  return {
    source_url: cleanUrl(submission.source_url),
    source_title: cleanNullableText(submission.source_title, 260),
    source_type: cleanNullableText(submission.source_type, 120),
    target_type: cleanNullableText(submission.target_type, 120),
    target_name: cleanNullableText(submission.target_name, 220),
    jurisdiction: cleanNullableText(submission.jurisdiction, 220),
    requested_action: cleanNullableText(submission.requested_action, 140),
    submitter_summary: cleanNullableText(submission.claim_summary, 2400),
    why_it_matters: cleanNullableText(submission.why_it_matters, 1800),
    existing_source_labels: [
      cleanText(submission.confidence, 80),
      cleanText(submission.status, 80),
      cleanText(submission.public_private_flag, 80),
    ].filter(Boolean),
    existing_entity_info: {
      target_id: cleanNullableText(submission.target_id, 220),
      office_or_agency: cleanNullableText(submission.office_or_agency, 220),
      state: cleanNullableText(submission.state, 80),
      county: cleanNullableText(submission.county, 120),
      city: cleanNullableText(submission.city, 120),
    },
  };
}

export async function getAiSourceReviewConfig(): Promise<AiReviewConfig> {
  const provider = cleanText(process.env.AI_PROVIDER, 80).toLowerCase() || "openai";
  const model = cleanText(process.env.AI_SOURCE_REVIEW_MODEL, 120) || cleanText(process.env.OPENAI_MODEL, 120) || DEFAULT_OPENAI_MODEL;
  const enabled = await isFeatureEnabled("ENABLE_AI_SOURCE_REVIEW");

  if (!enabled) {
    return { enabled: false, provider, model, reason: "feature_flag_disabled" };
  }
  if (provider !== "openai") {
    return { enabled: false, provider, model, reason: "unsupported_provider" };
  }
  if (!process.env.OPENAI_API_KEY) {
    return { enabled: false, provider, model, reason: "missing_openai_api_key" };
  }

  return { enabled: true, provider, model, reason: "ready" };
}

function extractResponseText(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  if (typeof record.output_text === "string") return record.output_text;

  const output = record.output;
  if (!Array.isArray(output)) return "";
  return output
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const content = (item as Record<string, unknown>).content;
      return Array.isArray(content) ? content : [];
    })
    .map((contentItem) => {
      if (!contentItem || typeof contentItem !== "object") return "";
      const recordItem = contentItem as Record<string, unknown>;
      return typeof recordItem.text === "string" ? recordItem.text : "";
    })
    .filter(Boolean)
    .join("\n");
}

function sanitizeAiOutput(raw: unknown, localFlags: AiReviewSafetyFlag[]): AiReviewOutput {
  const record = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const flags = Array.from(new Set([...allowedSafetyFlags(record.safety_flags), ...localFlags]));
  const recommendation = flags.includes("threat") || flags.includes("doxxing") ? "unsafe" : allowedRecommendation(record.recommended_admin_action);

  return {
    summary: cleanText(record.summary, 900),
    source_type_guess: cleanText(record.source_type_guess, 180),
    target_entity_guess: cleanText(record.target_entity_guess, 220),
    appears_to_show: cleanText(record.appears_to_show, 1200),
    does_not_prove: cleanText(record.does_not_prove, 1200),
    missing_context: cleanStringArray(record.missing_context, 10, 260),
    safety_flags: flags,
    suggested_public_label: cleanText(record.suggested_public_label, 140) || "Under review",
    recommended_admin_action: recommendation,
    suggested_public_question: cleanText(record.suggested_public_question, 500),
    suggested_safe_share_line: cleanText(record.suggested_safe_share_line, 500),
    suggested_admin_note: appendNotice(cleanText(record.suggested_admin_note, 1400)),
    human_review_required: true,
  };
}

export async function analyzeSourceSubmissionWithAi(submission: SourceSubmissionRecord): Promise<AiReviewResult> {
  const inputSummary = buildAiReviewInputSummary(submission);
  const localFlags = detectLocalSafetyFlags(submission);
  const config = await getAiSourceReviewConfig();
  if (!config.enabled || !config.provider || !config.model) {
    return { ok: false, disabled: true, reason: config.reason, provider: config.provider, model: config.model, inputSummary };
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      store: false,
      input: [
        {
          role: "developer",
          content: [{ type: "input_text", text: AI_REVIEW_SYSTEM_INSTRUCTIONS }],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(
                {
                  task: "Review this public source submission for admin triage. Return only structured JSON. Never mark it verified. Include the human review notice in the admin note.",
                  source_submission: inputSummary,
                  local_safety_flags: localFlags,
                  allowed_admin_recommendations: AI_REVIEW_RECOMMENDATIONS,
                  allowed_safety_flags: AI_REVIEW_SAFETY_FLAGS,
                },
                null,
                2,
              ),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "repwatchr_ai_source_review",
          strict: true,
          schema: aiReviewOutputSchema,
        },
      },
      max_output_tokens: 1800,
    }),
  });

  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? cleanText((payload as { error?: { message?: string } }).error?.message, 500)
        : "";
    return {
      ok: false,
      status: response.status,
      reason: message || `OpenAI request failed with status ${response.status}.`,
      provider: config.provider,
      model: config.model,
      inputSummary,
    };
  }

  const outputText = extractResponseText(payload);
  if (!outputText) {
    return { ok: false, status: 502, reason: "AI response did not include structured output text.", provider: config.provider, model: config.model, inputSummary };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    return { ok: false, status: 502, reason: "AI response was not valid JSON.", provider: config.provider, model: config.model, inputSummary };
  }

  return {
    ok: true,
    provider: config.provider,
    model: config.model,
    inputSummary,
    outputSummary: sanitizeAiOutput(parsed, localFlags),
  };
}
