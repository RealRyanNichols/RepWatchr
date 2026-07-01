import { z } from "zod";

export const PUBLIC_CONTENT_RULES = [
  "No private home addresses.",
  "No minor children.",
  "No threats.",
  "No doxxing.",
  "No harassment instructions.",
  "No unsourced criminal accusations.",
  "No private medical information.",
  "No private family information.",
  "No personal financial information outside public campaign or official records.",
  "No private personal contact information.",
  "No publishing raw user-submitted allegations as fact.",
  "No claims beyond what the source supports.",
  "No fake urgency, public support, source counts, or metrics.",
] as const;

export const SAFETY_LABELS = [
  "Confirmed public record",
  "Source-backed claim",
  "Public question",
  "Needs source",
  "Under review",
  "Correction requested",
  "Opinion",
  "Allegation",
  "Insufficient data",
  "Archived",
  "Updated",
] as const;

export type SafetyLabelValue = (typeof SAFETY_LABELS)[number];

export const SOURCE_CONFIDENCE_LABELS = [
  "Official source",
  "Source linked",
  "Public record",
  "Secondary source",
  "Needs source",
  "Under review",
  "Insufficient data",
] as const;

export type SourceConfidenceLabelValue = (typeof SOURCE_CONFIDENCE_LABELS)[number];

export const CORRECTION_TYPES = [
  "wrong official",
  "wrong office",
  "wrong party",
  "wrong jurisdiction",
  "wrong date",
  "broken source",
  "outdated record",
  "missing context",
  "unsafe/private information",
  "unsourced claim",
  "duplicate profile",
  "legal/privacy concern",
  "other",
] as const;

export type CorrectionType = (typeof CORRECTION_TYPES)[number];

export const CORRECTION_STATUSES = [
  "new",
  "needs_review",
  "approved",
  "rejected",
  "needs_more_info",
  "attached_source",
  "entity_updated",
  "resolved",
  "archived",
] as const;

export type CorrectionStatus = (typeof CORRECTION_STATUSES)[number];

export const PRIVACY_REQUEST_TYPES = [
  "access",
  "correction",
  "deletion",
  "opt_out",
  "question",
  "account_deletion",
  "contributor_profile_removal",
] as const;

export type PrivacyRequestType = (typeof PRIVACY_REQUEST_TYPES)[number];

export const PRIVACY_REQUEST_STATUSES = [
  "new",
  "needs_review",
  "in_progress",
  "completed",
  "rejected",
  "needs_more_info",
  "archived",
] as const;

export type PrivacyRequestStatus = (typeof PRIVACY_REQUEST_STATUSES)[number];

export type SafetyFlagKey =
  | "criminal_accusation"
  | "corruption_accusation"
  | "bribery"
  | "fraud"
  | "abuse_allegation"
  | "threat"
  | "private_address"
  | "private_contact"
  | "minor_family"
  | "private_medical"
  | "personal_financial"
  | "guilt_language"
  | "unsupported_certainty"
  | "defamatory_phrasing"
  | "violent_language"
  | "harassment_instruction"
  | "fake_metric";

export type SafetySeverity = "low" | "medium" | "high";

export interface SafetyFlag {
  key: SafetyFlagKey;
  label: string;
  severity: SafetySeverity;
  message: string;
}

export interface SafetyValidationResult {
  ok: boolean;
  riskLevel: "clear" | "low" | "medium" | "high";
  flags: SafetyFlag[];
  requiresSource: boolean;
  requiresHumanReview: boolean;
  suggestedLabel: SafetyLabelValue;
  suggestedLanguage: string;
}

const safetyPatterns: Array<{
  key: SafetyFlagKey;
  label: string;
  severity: SafetySeverity;
  message: string;
  pattern: RegExp;
}> = [
  {
    key: "criminal_accusation",
    label: "Criminal accusation",
    severity: "high",
    message: "Avoid publishing criminal accusations unless a public source directly supports the wording.",
    pattern: /\b(committed|commits|guilty of|criminal|felon|felony|crime|illegal act|stole|theft|embezzl|racketeer|money laundering)\b/i,
  },
  {
    key: "corruption_accusation",
    label: "Corruption accusation",
    severity: "high",
    message: "Use source-backed public-record language instead of stating corruption as fact.",
    pattern: /\b(corrupt|corruption|crooked|sold out|payoff|kickback)\b/i,
  },
  {
    key: "bribery",
    label: "Bribery language",
    severity: "high",
    message: "Bribery claims require official sources or should be framed as a public question.",
    pattern: /\b(bribe|bribery|bribed|pay to play|quid pro quo)\b/i,
  },
  {
    key: "fraud",
    label: "Fraud language",
    severity: "high",
    message: "Fraud claims require strong public sourcing and human review.",
    pattern: /\b(fraud|fraudulent|scam|scammed|fake filings?|forged|forgery)\b/i,
  },
  {
    key: "abuse_allegation",
    label: "Abuse allegation",
    severity: "medium",
    message: "Abuse-of-power language should be tied to specific public records and labels.",
    pattern: /\b(abuse of power|abused power|misconduct|cover[- ]?up|retaliation|retaliated)\b/i,
  },
  {
    key: "threat",
    label: "Threat or intimidation",
    severity: "high",
    message: "Threats, intimidation, and violent instructions are not allowed.",
    pattern: /\b(threaten|beat up|hurt|kill|shoot|bomb|swat|make them pay|go after them|intimidate)\b/i,
  },
  {
    key: "private_address",
    label: "Private address pattern",
    severity: "high",
    message: "Do not submit or publish private home addresses.",
    pattern: /\b\d{2,6}\s+[a-z0-9.'-]+(?:\s+[a-z0-9.'-]+){0,5}\s+(?:street|st\.?|avenue|ave\.?|road|rd\.?|drive|dr\.?|lane|ln\.?|court|ct\.?|circle|cir\.?|boulevard|blvd\.?|highway|hwy\.?)\b/i,
  },
  {
    key: "private_contact",
    label: "Private contact information",
    severity: "medium",
    message: "Private phone numbers, personal emails, and non-official contact details should not be public.",
    pattern: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}|\b[A-Z0-9._%+-]+@(gmail|yahoo|icloud|outlook|hotmail|proton|aol)\.[A-Z]{2,}\b/i,
  },
  {
    key: "minor_family",
    label: "Family or minor reference",
    severity: "high",
    message: "Do not publish minor-child or private family information.",
    pattern: /\b(minor child|minor children|kids?|children|daughter|son|wife|husband|spouse|ex-wife|ex-husband|family lives|school their child)\b/i,
  },
  {
    key: "private_medical",
    label: "Private medical information",
    severity: "high",
    message: "Private medical information is not allowed in public RepWatchr records.",
    pattern: /\b(diagnos(?:is|ed)|medical record|medication|therapy notes?|mental health|hospitalized|patient record|hipaa)\b/i,
  },
  {
    key: "personal_financial",
    label: "Private financial information",
    severity: "medium",
    message: "Keep financial material to public campaign, official, procurement, or court records.",
    pattern: /\b(bank account|routing number|credit card|ssn|social security|personal tax return|w-2|pay stub)\b/i,
  },
  {
    key: "guilt_language",
    label: "Legal conclusion",
    severity: "high",
    message: "RepWatchr should not make legal conclusions.",
    pattern: /\b(is guilty|was guilty|guilty as charged|convict(ed)? of|liable for|violated the law)\b/i,
  },
  {
    key: "unsupported_certainty",
    label: "Unsupported certainty",
    severity: "medium",
    message: "Replace certainty claims with sourced facts, public questions, or under-review labels.",
    pattern: /\b(obviously|definitely|without question|proves that|everyone knows|no doubt|100% proof)\b/i,
  },
  {
    key: "defamatory_phrasing",
    label: "Defamatory phrasing risk",
    severity: "medium",
    message: "Insults and reputation-damaging labels need safer public-record wording.",
    pattern: /\b(liar|traitor|criminal enterprise|evil|pervert|predator|thief|con artist)\b/i,
  },
  {
    key: "violent_language",
    label: "Violent language",
    severity: "high",
    message: "Violent language is not allowed.",
    pattern: /\b(lynch|hang|execute|destroy them|burn down|bloodbath|civil war)\b/i,
  },
  {
    key: "harassment_instruction",
    label: "Harassment instruction",
    severity: "high",
    message: "Do not publish instructions to harass, stalk, swarm, or target a person.",
    pattern: /\b(call them nonstop|show up at their house|follow them|stalk|harass|spam them|flood their phone|doxx|dox)\b/i,
  },
  {
    key: "fake_metric",
    label: "Unverified metric",
    severity: "medium",
    message: "Do not invent support, source counts, urgency, or activity metrics.",
    pattern: /\b(thousands of people|everyone is watching|breaking now|sources confirmed|massive support|viral proof|verified by everyone)\b/i,
  },
];

function cleanText(value: string | null | undefined, maxLength = 5000) {
  return value?.replace(/\s+/g, " ").trim().slice(0, maxLength) ?? "";
}

function cleanOptionalText(value: string | null | undefined, maxLength = 500) {
  const cleaned = cleanText(value, maxLength);
  return cleaned || null;
}

export function normalizeTrustText(value: string | null | undefined, maxLength = 500) {
  return cleanOptionalText(value, maxLength);
}

export function normalizeTrustEmail(value: string | null | undefined) {
  const cleaned = cleanOptionalText(value, 180)?.toLowerCase() ?? null;
  return cleaned;
}

function dedupeFlags(flags: SafetyFlag[]) {
  const seen = new Set<string>();
  return flags.filter((flag) => {
    if (seen.has(flag.key)) return false;
    seen.add(flag.key);
    return true;
  });
}

export function suggestSafeLanguage(text: string) {
  const cleaned = cleanText(text, 700);
  if (!cleaned) {
    return "RepWatchr needs a public source before this claim can be published.";
  }

  if (/\bcorrupt|corruption|sold out|crooked\b/i.test(cleaned)) {
    return "RepWatchr needs public sources related to this official and the specific issue. Submit official records or named public reporting for review.";
  }

  if (/\bfraud|bribe|bribery|criminal|guilty|committed\b/i.test(cleaned)) {
    return "RepWatchr has not verified this claim. Submit an official public source if one exists.";
  }

  if (/\bjudge|court|sheriff|police|prosecutor|district attorney\b/i.test(cleaned)) {
    return "This profile includes public records and source-backed questions. It does not make legal conclusions.";
  }

  return "RepWatchr should frame this as a source-backed public record, a public question, or an under-review item until a reviewer confirms the record.";
}

export function validatePublicContentSafety(
  text: string,
  metadata: { sourceUrl?: string | null; label?: SafetyLabelValue | string | null; isPublicCopy?: boolean } = {},
): SafetyValidationResult {
  const target = cleanText(text, 8000);
  const flags = dedupeFlags(
    safetyPatterns
      .filter((item) => item.pattern.test(target))
      .map((item) => ({
        key: item.key,
        label: item.label,
        severity: item.severity,
        message: item.message,
      })),
  );

  const hasHigh = flags.some((flag) => flag.severity === "high");
  const hasMedium = flags.some((flag) => flag.severity === "medium");
  const needsSource =
    Boolean(flags.length) ||
    metadata.label === "Source-backed claim" ||
    metadata.label === "Confirmed public record" ||
    metadata.label === "Allegation";
  const hasSource = Boolean(metadata.sourceUrl?.trim());
  const hardStop = flags.some((flag) =>
    ["threat", "private_address", "minor_family", "private_medical", "harassment_instruction", "violent_language"].includes(flag.key),
  );

  const suggestedLabel: SafetyLabelValue = hardStop
    ? "Under review"
    : !hasSource && needsSource
      ? "Needs source"
      : hasHigh || hasMedium
        ? "Public question"
        : metadata.label && (SAFETY_LABELS as readonly string[]).includes(metadata.label)
          ? (metadata.label as SafetyLabelValue)
          : "Source-backed claim";

  return {
    ok: !hardStop && (!needsSource || hasSource || suggestedLabel === "Needs source" || suggestedLabel === "Public question"),
    riskLevel: hasHigh ? "high" : hasMedium ? "medium" : flags.length ? "low" : "clear",
    flags,
    requiresSource: needsSource && !hasSource,
    requiresHumanReview: flags.length > 0 || metadata.isPublicCopy === true,
    suggestedLabel,
    suggestedLanguage: suggestSafeLanguage(target),
  };
}

const utmSchema = z
  .object({
    utm_source: z.string().trim().max(120).optional().nullable(),
    utm_medium: z.string().trim().max(120).optional().nullable(),
    utm_campaign: z.string().trim().max(160).optional().nullable(),
    utm_term: z.string().trim().max(160).optional().nullable(),
    utm_content: z.string().trim().max(160).optional().nullable(),
  })
  .optional()
  .default({});

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .nullable()
  .transform((value) => value || null)
  .refine((value) => !value || /^https?:\/\/[^\s]+$/i.test(value), "Enter a full public URL starting with http or https.");

export const correctionRequestSchema = z.object({
  anonymousId: z.string().trim().max(120).optional().nullable(),
  submitterName: z.string().trim().max(120).optional().nullable(),
  submitterEmail: z.string().trim().email().max(180).optional().nullable().or(z.literal("").transform(() => null)),
  entityType: z.string().trim().min(2).max(80),
  entityId: z.string().trim().min(1).max(180),
  entityName: z.string().trim().max(180).optional().nullable(),
  url: optionalUrl,
  correctionType: z.enum(CORRECTION_TYPES),
  currentText: z.string().trim().max(3000).optional().nullable(),
  requestedCorrection: z.string().trim().min(10).max(3000),
  sourceUrl: optionalUrl,
  explanation: z.string().trim().max(3000).optional().nullable(),
  sourceRoute: z.string().trim().max(500).optional().nullable(),
  referrer: z.string().trim().max(500).optional().nullable(),
  utm: utmSchema,
  honeypot: z.string().max(0).optional().nullable(),
});

export type CorrectionRequestInput = z.infer<typeof correctionRequestSchema>;

export const privacyRequestSchema = z.object({
  anonymousId: z.string().trim().max(120).optional().nullable(),
  email: z.string().trim().email().max(180).optional().nullable().or(z.literal("").transform(() => null)),
  requestType: z.enum(PRIVACY_REQUEST_TYPES),
  message: z.string().trim().min(8).max(3000),
  sourceRoute: z.string().trim().max(500).optional().nullable(),
  referrer: z.string().trim().max(500).optional().nullable(),
  utm: utmSchema,
  honeypot: z.string().max(0).optional().nullable(),
});

export type PrivacyRequestInput = z.infer<typeof privacyRequestSchema>;

export function buildCorrectionSummary(input: CorrectionRequestInput) {
  return [
    `Entity: ${input.entityName || input.entityId} (${input.entityType})`,
    `Correction type: ${input.correctionType}`,
    input.url ? `Page: ${input.url}` : "",
    input.sourceUrl ? `Public source: ${input.sourceUrl}` : "Public source: not supplied",
    "",
    input.currentText ? `Current text: ${input.currentText}` : "",
    `Requested correction: ${input.requestedCorrection}`,
    input.explanation ? `Explanation: ${input.explanation}` : "",
    "",
    "Status: new. Human review required before public display.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function safetyLabelTone(label: SafetyLabelValue) {
  if (label === "Confirmed public record" || label === "Source-backed claim" || label === "Updated") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (label === "Needs source" || label === "Under review" || label === "Correction requested" || label === "Insufficient data") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  if (label === "Allegation") return "border-red-200 bg-red-50 text-red-800";
  if (label === "Archived") return "border-slate-200 bg-slate-100 text-slate-700";
  return "border-blue-200 bg-blue-50 text-blue-800";
}

export function sourceConfidenceTone(label: SourceConfidenceLabelValue) {
  if (label === "Official source" || label === "Source linked" || label === "Public record") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (label === "Needs source" || label === "Under review" || label === "Insufficient data") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-blue-200 bg-blue-50 text-blue-800";
}
