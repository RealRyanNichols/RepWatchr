import { cleanLongText, cleanText, cleanUrl } from "@/lib/source-submissions";

export const RECORDS_RESPONSE_TYPES = [
  "fulfilled",
  "partially_fulfilled",
  "denied",
  "clarification_requested",
  "no_records",
  "fee_estimate",
  "extension_notice",
  "other",
] as const;

export const RECORDS_RESPONSE_STATUSES = [
  "new",
  "needs_review",
  "saved_private",
  "reviewed",
  "converted_to_packet",
  "attached_to_profile",
  "attached_to_story",
  "attached_to_timeline",
  "rejected",
  "archived",
] as const;

export const RECORDS_SENSITIVITY_STATUSES = [
  "needs_review",
  "safe_public_record",
  "contains_private_info",
  "redaction_needed",
  "do_not_publish",
  "published_summary_only",
] as const;

export const RECORDS_RESPONSE_SENSITIVE_FLAGS = [
  "private_address",
  "minor_child",
  "medical_info",
  "social_security",
  "bank_info",
  "phone_email_private",
  "family_info",
  "irrelevant_private_info",
  "sealed_or_restricted_warning",
  "violent_threat",
  "defamation_risk",
] as const;

export type RecordsResponseType = (typeof RECORDS_RESPONSE_TYPES)[number];
export type RecordsResponseStatus = (typeof RECORDS_RESPONSE_STATUSES)[number];
export type RecordsSensitivityStatus = (typeof RECORDS_SENSITIVITY_STATUSES)[number];
export type RecordsSensitiveFlag = (typeof RECORDS_RESPONSE_SENSITIVE_FLAGS)[number];

export type RecordsResponseInput = {
  recordsRequestId?: unknown;
  responseTitle?: unknown;
  agencyName?: unknown;
  jurisdiction?: unknown;
  responseType?: unknown;
  responseDate?: unknown;
  responseUrl?: unknown;
  responseText?: unknown;
  explanation?: unknown;
  userBelievesPublic?: unknown;
  submitMode?: unknown;
  anonymousId?: unknown;
  referrer?: unknown;
  landingPage?: unknown;
  utmSource?: unknown;
  utmMedium?: unknown;
  utmCampaign?: unknown;
  utmTerm?: unknown;
  utmContent?: unknown;
};

export type NormalizedRecordsResponseInput = {
  recordsRequestId: string;
  responseTitle: string;
  agencyName: string;
  jurisdiction: string;
  responseType: RecordsResponseType;
  responseDate: string | null;
  responseUrl: string;
  responseText: string;
  explanation: string;
  userBelievesPublic: boolean;
  submitMode: "review" | "private";
  anonymousId: string;
  referrer: string;
  landingPage: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
};

export type RecordsResponsePacketInput = NormalizedRecordsResponseInput & {
  responseId?: string;
  fileNames?: string[];
  sensitivityFlags?: RecordsSensitiveFlag[];
  sensitivityStatus?: RecordsSensitivityStatus;
};

function cleanUuid(value: unknown) {
  const text = cleanText(value, 80);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)
    ? text
    : "";
}

function cleanDate(value: unknown) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const parsed = new Date(`${text}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : text;
}

function normalizeBoolean(value: unknown) {
  return value === true || value === "true" || value === "on" || value === "yes";
}

function normalizeResponseType(value: unknown): RecordsResponseType {
  const text = cleanText(value, 80);
  return (RECORDS_RESPONSE_TYPES as readonly string[]).includes(text) ? (text as RecordsResponseType) : "other";
}

export function normalizeRecordsResponseInput(input: RecordsResponseInput): NormalizedRecordsResponseInput {
  const submitMode = cleanText(input.submitMode, 40) === "private" ? "private" : "review";

  return {
    recordsRequestId: cleanUuid(input.recordsRequestId),
    responseTitle: cleanText(input.responseTitle, 255),
    agencyName: cleanText(input.agencyName, 255),
    jurisdiction: cleanText(input.jurisdiction, 255),
    responseType: normalizeResponseType(input.responseType),
    responseDate: cleanDate(input.responseDate),
    responseUrl: cleanUrl(input.responseUrl),
    responseText: cleanLongText(input.responseText, 16000),
    explanation: cleanLongText(input.explanation, 4000),
    userBelievesPublic: normalizeBoolean(input.userBelievesPublic),
    submitMode,
    anonymousId: cleanText(input.anonymousId, 120),
    referrer: cleanText(input.referrer, 1000),
    landingPage: cleanText(input.landingPage, 1000),
    utmSource: cleanText(input.utmSource, 255),
    utmMedium: cleanText(input.utmMedium, 255),
    utmCampaign: cleanText(input.utmCampaign, 255),
    utmTerm: cleanText(input.utmTerm, 255),
    utmContent: cleanText(input.utmContent, 255),
  };
}

export function detectRecordsResponseSensitivity(text: string): RecordsSensitiveFlag[] {
  const value = text.trim();
  if (!value) return [];
  const lower = value.toLowerCase();
  const flags = new Set<RecordsSensitiveFlag>();

  if (/\b\d{3}-\d{2}-\d{4}\b/.test(value)) flags.add("social_security");
  if (/\b(?:\d[ -]*?){13,16}\b/.test(value) || /\b(routing|account number|bank account|debit card|credit card)\b/i.test(value)) {
    flags.add("bank_info");
  }
  if (/\b\d{3,6}\s+[a-z0-9.'-]+(?:\s+[a-z0-9.'-]+){0,4}\s+(street|st\.|road|rd\.|avenue|ave\.|drive|dr\.|lane|ln\.|court|ct\.|circle|cir\.|boulevard|blvd\.)\b/i.test(value)) {
    flags.add("private_address");
  }
  if (/\b(minor child|juvenile|student record|child's|children's|daughter|son|school-aged|underage)\b/i.test(value)) {
    flags.add("minor_child");
  }
  if (/\b(hipaa|medical|diagnosis|treatment|patient|prescription|therapy|hospital|clinic|mental health)\b/i.test(value)) {
    flags.add("medical_info");
  }
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(value) || /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(value)) {
    flags.add("phone_email_private");
  }
  if (/\b(spouse|wife|husband|mother|father|sibling|family member|relative|home life)\b/i.test(value)) {
    flags.add("family_info");
  }
  if (/\b(date of birth|birthdate|dob|home address|personal address|private residence)\b/i.test(value)) {
    flags.add("irrelevant_private_info");
  }
  if (/\b(sealed|restricted|confidential|protective order|juvenile record|not for release|privileged)\b/i.test(value)) {
    flags.add("sealed_or_restricted_warning");
  }
  if (/\b(kill|shoot|bomb|beat up|hurt them|threaten|violence|violent threat)\b/i.test(value)) {
    flags.add("violent_threat");
  }
  if (/\b(corrupt|bribery|bribe|fraud|criminal|felony|stole|theft|kickback|cover-up|coverup)\b/i.test(lower)) {
    flags.add("defamation_risk");
  }

  return Array.from(flags);
}

export function recommendSensitivityStatus(flags: RecordsSensitiveFlag[]): RecordsSensitivityStatus {
  if (flags.includes("sealed_or_restricted_warning") || flags.includes("social_security") || flags.includes("bank_info")) {
    return "do_not_publish";
  }
  if (flags.includes("private_address") || flags.includes("minor_child") || flags.includes("medical_info")) {
    return "redaction_needed";
  }
  if (flags.length > 0) return "contains_private_info";
  return "needs_review";
}

export function validateRecordsResponseInput(input: NormalizedRecordsResponseInput, hasFile: boolean) {
  if (!input.agencyName) return "Add the agency or public body that sent the response.";
  if (!input.responseType) return "Choose the response type.";
  if (!input.responseUrl && !input.responseText && !hasFile) {
    return "Add a response URL, paste the response text, or upload the response document.";
  }
  if (!input.explanation) return "Add a short explanation of what this response should become.";
  if (detectRecordsResponseSensitivity(input.explanation).includes("violent_threat")) {
    return "Remove threatening language. RepWatchr only accepts public-record review requests and safe summaries.";
  }
  return "";
}

export function buildRecordsResponsePacket(input: RecordsResponsePacketInput) {
  const flags = input.sensitivityFlags?.length ? input.sensitivityFlags.join(", ") : "none detected by basic scan";
  const fileNames = input.fileNames?.length ? input.fileNames.join(", ") : "none supplied";
  const responseTarget = input.responseTitle || `${input.agencyName} ${input.responseType.replaceAll("_", " ")}`;

  return [
    "RepWatchr Public Records Response Packet",
    "",
    `Response ID: ${input.responseId ?? "Pending"}`,
    `Response title: ${responseTarget}`,
    `Linked request ID: ${input.recordsRequestId || "Not linked"}`,
    `Agency/public body: ${input.agencyName}`,
    `Jurisdiction: ${input.jurisdiction || "Not supplied"}`,
    `Response type: ${input.responseType.replaceAll("_", " ")}`,
    `Response date: ${input.responseDate || "Not supplied"}`,
    `Response URL: ${input.responseUrl || "Not supplied"}`,
    `Uploaded files: ${fileNames}`,
    `User believes public: ${input.userBelievesPublic ? "yes" : "not sure/private review first"}`,
    `Current sensitivity status: ${input.sensitivityStatus ?? "needs_review"}`,
    `Basic sensitivity flags: ${flags}`,
    "",
    "Short explanation:",
    input.explanation || "Not supplied",
    "",
    "Response text or excerpt:",
    input.responseText || "Not supplied",
    "",
    "Next record actions:",
    "- Admin review required before any public display.",
    "- Create a safe public summary only after private information is cleared or redacted.",
    "- Attach to a profile, story, race, timeline, or source packet only with a source/confidence label.",
    "",
    "Guardrail:",
    "Do not publish private addresses, minor children, medical data, bank data, sealed records, threats, or claims beyond what the record supports.",
  ].join("\n");
}

export function responseStatusLabel(value: string) {
  return value.replaceAll("_", " ");
}
