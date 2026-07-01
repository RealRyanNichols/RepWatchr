import { z } from "zod";

export const FORM_STATUSES = [
  "new",
  "needs_review",
  "verified",
  "rejected",
  "needs_more_info",
  "attached_to_profile",
  "converted_to_packet",
  "converted_to_order",
  "archived",
] as const;

export const FORM_PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export const FORM_KEYS = [
  "submit_source",
  "correction_request",
  "free_packet",
  "package_interest",
  "investor_interest",
  "partner_interest",
  "data_source_suggestion",
  "missing_official",
  "missing_agency",
  "report_broken_link",
  "newsletter_signup",
  "watchlist_signup",
  "feedback",
  "contact",
  "research_request",
  "public_records_request",
] as const;

export type FormKey = (typeof FORM_KEYS)[number];
export type FormStatus = (typeof FORM_STATUSES)[number];
export type FormPriority = (typeof FORM_PRIORITIES)[number];

const emailSchema = z.string().trim().toLowerCase().email().max(180).optional().or(z.literal(""));
const urlSchema = z.string().trim().url().max(700).optional().or(z.literal(""));
const shortText = z.string().trim().max(220).optional().or(z.literal(""));
const mediumText = z.string().trim().max(700).optional().or(z.literal(""));
const longText = z.string().trim().max(5000).optional().or(z.literal(""));
const requiredShortText = z.string().trim().min(2).max(220);
const requiredMediumText = z.string().trim().min(3).max(700);
const requiredLongText = z.string().trim().min(10).max(5000);

const dangerousLanguagePatterns = [
  /\bkill\b/i,
  /\bshoot\b/i,
  /\bbomb\b/i,
  /\bassassinat/i,
  /\bhang\b/i,
  /\blynch\b/i,
  /\bbeat\s+(him|her|them|up)\b/i,
  /\bmake\s+them\s+pay\b/i,
  /\bshow\s+up\s+at\s+(their|his|her)\s+house\b/i,
];

const privateAddressPatterns = [
  /\b\d{1,6}\s+[a-z0-9.'-]+(?:\s+[a-z0-9.'-]+){0,5}\s+(street|st|road|rd|drive|dr|lane|ln|court|ct|circle|cir|avenue|ave|boulevard|blvd|way|trail|trl)\b/i,
  /\b(apartment|apt|unit|suite|ste)\s*#?\s*[a-z0-9-]+\b/i,
];

const minorFamilyPatterns = [
  /\bminor child\b/i,
  /\bmy child\b/i,
  /\bmy son\b/i,
  /\bmy daughter\b/i,
  /\bchild'?s name\b/i,
  /\bage\s+\d{1,2}\b/i,
];

function valuesAsText(payload: Record<string, unknown>) {
  return Object.values(payload)
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function addSafetyChecks(schema: z.ZodTypeAny, formKey: FormKey) {
  return schema.superRefine((value, ctx) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return;
    const text = valuesAsText(value as Record<string, unknown>);

    if (dangerousLanguagePatterns.some((pattern) => pattern.test(text))) {
      ctx.addIssue({
        code: "custom",
        message: "Remove threats or dangerous language. RepWatchr only accepts source-safe public-record submissions.",
      });
    }

    if (
      [
        "submit_source",
        "correction_request",
        "free_packet",
        "feedback",
        "report_broken_link",
        "data_source_suggestion",
      ].includes(formKey) &&
      privateAddressPatterns.some((pattern) => pattern.test(text))
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Do not submit private home addresses. Use official public record links instead.",
      });
    }

    if (
      ["submit_source", "correction_request", "free_packet", "feedback", "public_records_request"].includes(formKey) &&
      minorFamilyPatterns.some((pattern) => pattern.test(text))
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Do not include minor-child or private family details in this public-record intake form.",
      });
    }
  });
}

const commonFields = {
  name: shortText,
  email: emailSchema,
  target: shortText,
  jurisdiction: shortText,
  summary: longText,
  sourceUrl: urlSchema,
  sourceType: shortText,
  sourceDate: shortText,
  nextAction: shortText,
  consent: z.boolean().optional(),
};

const formSchemas: Record<FormKey, z.ZodTypeAny> = {
  submit_source: z.object({
    ...commonFields,
    email: emailSchema,
    target: requiredShortText,
    jurisdiction: requiredShortText,
    sourceUrl: z.string().trim().url().max(700),
    sourceType: requiredShortText,
    sourceDate: shortText,
    summary: requiredLongText,
    whatNeedsReview: requiredLongText,
    publicPrivate: z.enum(["public", "private_review"]).default("public"),
    consent: z.literal(true),
  }),
  correction_request: z.object({
    ...commonFields,
    pageUrl: z.string().trim().min(1).max(700),
    officialId: shortText,
    issueType: requiredShortText,
    description: requiredLongText,
    suggestedCorrection: longText,
    consent: z.boolean().optional(),
  }),
  free_packet: z.object({
    ...commonFields,
    email: emailSchema,
    targetType: requiredShortText,
    target: requiredShortText,
    sourceUrl: z.string().trim().url().max(700),
    summary: requiredLongText,
    consent: z.literal(true),
  }),
  package_interest: z.object({
    ...commonFields,
    name: shortText,
    email: emailSchema,
    serviceSlug: requiredShortText,
    serviceName: requiredShortText,
    jurisdiction: shortText,
    target: requiredShortText,
    sourceUrl: urlSchema,
    deadline: shortText,
    summary: requiredLongText,
    consent: z.literal(true),
  }),
  investor_interest: z.object({
    name: requiredShortText,
    email: z.string().trim().toLowerCase().email().max(180),
    organization: shortText,
    interestType: requiredShortText,
    checkSizeOrPartnershipType: shortText,
    message: requiredLongText,
    consent: z.literal(true),
  }),
  partner_interest: z.object({
    name: requiredShortText,
    email: z.string().trim().toLowerCase().email().max(180),
    organization: shortText,
    interestType: requiredShortText,
    message: requiredLongText,
    consent: z.literal(true),
  }),
  data_source_suggestion: z.object({
    ...commonFields,
    email: emailSchema,
    sourceUrl: z.string().trim().url().max(700),
    sourceType: requiredShortText,
    jurisdiction: requiredShortText,
    summary: requiredLongText,
  }),
  missing_official: z.object({
    ...commonFields,
    officialName: requiredShortText,
    office: requiredShortText,
    jurisdiction: requiredShortText,
    sourceUrl: urlSchema,
    summary: requiredMediumText,
  }),
  missing_agency: z.object({
    ...commonFields,
    agencyName: requiredShortText,
    jurisdiction: requiredShortText,
    websiteUrl: urlSchema,
    summary: requiredMediumText,
  }),
  report_broken_link: z.object({
    ...commonFields,
    pageUrl: requiredMediumText,
    brokenUrl: requiredMediumText,
    description: longText,
  }),
  newsletter_signup: z.object({
    email: z.string().trim().toLowerCase().email().max(180),
    name: shortText,
    topics: z.array(z.string().trim().max(80)).max(20).optional(),
    consent: z.literal(true),
  }),
  watchlist_signup: z.object({
    email: z.string().trim().toLowerCase().email().max(180),
    name: shortText,
    watchTarget: requiredShortText,
    watchType: requiredShortText,
    consent: z.literal(true),
  }),
  feedback: z.object({
    ...commonFields,
    email: emailSchema,
    subject: requiredShortText,
    message: requiredLongText,
  }),
  contact: z.object({
    name: requiredShortText,
    email: z.string().trim().toLowerCase().email().max(180),
    organization: shortText,
    subject: requiredShortText,
    message: requiredLongText,
    consent: z.boolean().optional(),
  }),
  research_request: z.object({
    name: requiredShortText,
    email: z.string().trim().toLowerCase().email().max(180),
    organization: shortText,
    target: requiredShortText,
    jurisdiction: shortText,
    sourceUrl: urlSchema,
    useCase: requiredLongText,
    budgetRange: shortText,
    consent: z.literal(true),
  }),
  public_records_request: z.object({
    name: shortText,
    email: emailSchema,
    state: requiredShortText,
    agency: requiredShortText,
    recordType: requiredShortText,
    dateRange: shortText,
    namesOrOffices: mediumText,
    meetingOrEvent: mediumText,
    preferredDelivery: shortText,
    requesterContact: mediumText,
    notes: longText,
    consent: z.boolean().optional(),
  }),
};

export const FORM_DEFINITIONS = FORM_KEYS.map((key) => ({
  key,
  name: key
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" "),
  description: formDescription(key),
  status: "active",
}));

function formDescription(key: FormKey) {
  const descriptions: Record<FormKey, string> = {
    submit_source: "Public-source packet intake for officials, races, boards, votes, filings, and missing records.",
    correction_request: "Correction or report-incorrect-info workflow for public pages and profiles.",
    free_packet: "Low-friction free source-packet builder and email capture flow.",
    package_interest: "Paid service package interest and service request intake.",
    investor_interest: "Investor interest intake; not a securities offering.",
    partner_interest: "Partnership and organization inquiry intake.",
    data_source_suggestion: "Suggestion queue for public datasets and source lanes.",
    missing_official: "Missing official, candidate, or office profile request.",
    missing_agency: "Missing agency, public body, or board request.",
    report_broken_link: "Broken source-link report queue.",
    newsletter_signup: "Newsletter or digest signup.",
    watchlist_signup: "Watchlist interest capture before account creation.",
    feedback: "General product feedback.",
    contact: "General contact form.",
    research_request: "Custom public-record research and data request intake.",
    public_records_request: "Public-records request draft workflow intake.",
  };
  return descriptions[key];
}

export function normalizeEmail(email: unknown) {
  if (typeof email !== "string") return null;
  const clean = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) ? clean.slice(0, 180) : null;
}

export function validateFormPayload(formKey: string, payload: unknown) {
  if (!isFormKey(formKey)) {
    return { ok: false as const, errors: ["Unsupported form key."] };
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false as const, errors: ["Send a valid form payload."] };
  }

  const honeypot = (payload as Record<string, unknown>).companyWebsite || (payload as Record<string, unknown>).website_confirm;
  if (typeof honeypot === "string" && honeypot.trim()) {
    return { ok: false as const, errors: ["Submission rejected."] };
  }

  const schema = addSafetyChecks(formSchemas[formKey], formKey);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false as const,
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  return {
    ok: true as const,
    data: parsed.data as Record<string, unknown>,
  };
}

export function isFormKey(value: string): value is FormKey {
  return (FORM_KEYS as readonly string[]).includes(value);
}

export function normalizeFormPayload(formKey: FormKey, payload: Record<string, unknown>) {
  const email = normalizeEmail(payload.email);
  const sourceUrl = typeof payload.sourceUrl === "string" ? payload.sourceUrl.trim() : "";
  const target =
    stringValue(payload.target) ||
    stringValue(payload.officialName) ||
    stringValue(payload.agencyName) ||
    stringValue(payload.watchTarget) ||
    stringValue(payload.serviceName) ||
    stringValue(payload.subject);
  const jurisdiction =
    stringValue(payload.jurisdiction) || stringValue(payload.state) || stringValue(payload.geography);

  return {
    form_key: formKey,
    email,
    name: stringValue(payload.name) || null,
    target: target || null,
    jurisdiction: jurisdiction || null,
    source_url: sourceUrl || stringValue(payload.pageUrl) || null,
    summary:
      stringValue(payload.summary) ||
      stringValue(payload.description) ||
      stringValue(payload.message) ||
      stringValue(payload.useCase) ||
      stringValue(payload.whatNeedsReview) ||
      null,
    source_type: stringValue(payload.sourceType) || null,
    priority: inferPriority(formKey, payload),
    public_private: stringValue(payload.publicPrivate) || "public",
  };
}

function inferPriority(formKey: FormKey, payload: Record<string, unknown>): FormPriority {
  const text = valuesAsText(payload);
  if (formKey === "report_broken_link") return "high";
  if (/deadline|election day|tomorrow|today|urgent|meeting tonight/i.test(text)) return "high";
  if (formKey === "package_interest" || formKey === "research_request") return "high";
  return "normal";
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 700) : "";
}

export function buildSafeSubmissionSummary(formKey: FormKey, payload: Record<string, unknown>, submissionId?: string) {
  const normalized = normalizeFormPayload(formKey, payload);
  const lines = [
    "RepWatchr intake packet",
    submissionId ? `Submission ID: ${submissionId}` : "",
    `Form: ${FORM_DEFINITIONS.find((definition) => definition.key === formKey)?.name ?? formKey}`,
    normalized.name ? `Name: ${normalized.name}` : "",
    normalized.email ? `Email: ${normalized.email}` : "",
    normalized.target ? `Target: ${normalized.target}` : "",
    normalized.jurisdiction ? `Jurisdiction: ${normalized.jurisdiction}` : "",
    normalized.source_url ? `Public source/page URL: ${normalized.source_url}` : "",
    normalized.source_type ? `Source type: ${normalized.source_type}` : "",
    normalized.summary ? `Summary: ${normalized.summary}` : "",
    "",
    "Guardrail: public-record research only. No threats, doxxing, private home addresses, minor-child details, or unsourced criminal accusations.",
  ].filter(Boolean);

  return lines.join("\n");
}
