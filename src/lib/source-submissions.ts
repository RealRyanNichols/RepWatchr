export const SOURCE_SUBMISSION_STATUSES = [
  "new",
  "needs_review",
  "verified",
  "rejected",
  "attached_to_profile",
  "needs_more_info",
] as const;

export type SourceSubmissionStatus = (typeof SOURCE_SUBMISSION_STATUSES)[number];

export type SourceSubmissionInput = {
  submitterName?: unknown;
  submitterEmail?: unknown;
  targetName?: unknown;
  targetType?: unknown;
  targetProfileId?: unknown;
  targetPageUrl?: unknown;
  jurisdiction?: unknown;
  sourceUrl?: unknown;
  sourceType?: unknown;
  sourceTitle?: unknown;
  sourceDate?: unknown;
  claimSummary?: unknown;
  checkRequest?: unknown;
  publicFlag?: unknown;
  referrer?: unknown;
  landingPage?: unknown;
  utmSource?: unknown;
  utmMedium?: unknown;
  utmCampaign?: unknown;
  utmTerm?: unknown;
  utmContent?: unknown;
  metadata?: unknown;
};

export type NormalizedSourceSubmission = {
  submitterName: string;
  submitterEmail: string;
  targetName: string;
  targetType: string;
  targetProfileId: string;
  targetPageUrl: string;
  jurisdiction: string;
  sourceUrl: string;
  sourceType: string;
  sourceTitle: string;
  sourceDate: string | null;
  claimSummary: string;
  checkRequest: string;
  publicFlag: boolean;
  referrer: string;
  landingPage: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  metadata: Record<string, unknown>;
};

export function cleanText(value: unknown, maxLength = 1000) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

export function cleanLongText(value: unknown, maxLength = 5000) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export function cleanEmail(value: unknown) {
  if (typeof value !== "string") return "";
  const email = value.trim().toLowerCase();
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "";
  return email;
}

export function cleanUrl(value: unknown) {
  if (typeof value !== "string") return "";
  const text = value.trim();
  if (!text) return "";
  try {
    const url = new URL(text);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.toString().slice(0, 1000);
  } catch {
    return "";
  }
}

function cleanDate(value: unknown) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const parsed = new Date(`${text}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : text;
}

function cleanMetadata(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function normalizeSourceSubmission(input: SourceSubmissionInput): NormalizedSourceSubmission {
  return {
    submitterName: cleanText(input.submitterName, 255),
    submitterEmail: cleanEmail(input.submitterEmail),
    targetName: cleanText(input.targetName, 500),
    targetType: cleanText(input.targetType, 120) || "public_record",
    targetProfileId: cleanText(input.targetProfileId, 180),
    targetPageUrl: cleanText(input.targetPageUrl, 1000),
    jurisdiction: cleanText(input.jurisdiction, 500),
    sourceUrl: cleanUrl(input.sourceUrl),
    sourceType: cleanText(input.sourceType, 120) || "source_link",
    sourceTitle: cleanText(input.sourceTitle, 255),
    sourceDate: cleanDate(input.sourceDate),
    claimSummary: cleanLongText(input.claimSummary, 5000),
    checkRequest: cleanLongText(input.checkRequest, 5000),
    publicFlag: input.publicFlag === true,
    referrer: cleanText(input.referrer, 1000),
    landingPage: cleanText(input.landingPage, 1000),
    utmSource: cleanText(input.utmSource, 255),
    utmMedium: cleanText(input.utmMedium, 255),
    utmCampaign: cleanText(input.utmCampaign, 255),
    utmTerm: cleanText(input.utmTerm, 255),
    utmContent: cleanText(input.utmContent, 255),
    metadata: cleanMetadata(input.metadata),
  };
}

export function validateSourceSubmission(input: NormalizedSourceSubmission) {
  if (!input.targetName) return "Add the official, agency, board, race, or record target.";
  if (!input.sourceUrl) return "Add a public source URL that starts with http:// or https://.";
  if (!input.claimSummary) return "Add a short summary of what the source shows.";
  if (!input.checkRequest) return "Add what needs to be checked.";
  return "";
}

export function buildSourcePacket(input: NormalizedSourceSubmission & { submissionId?: string }) {
  return [
    "RepWatchr Source Submission Packet",
    "",
    `Submission ID: ${input.submissionId ?? "Pending"}`,
    `Target: ${input.targetName}`,
    `Target type: ${input.targetType}`,
    `Jurisdiction: ${input.jurisdiction || "Not supplied"}`,
    `Source type: ${input.sourceType}`,
    `Source title: ${input.sourceTitle || input.sourceUrl}`,
    `Source URL: ${input.sourceUrl}`,
    `Date of source: ${input.sourceDate || "Not supplied"}`,
    `Public flag: ${input.publicFlag ? "Public source can be summarized after review" : "Private review first"}`,
    `Submitter: ${input.submitterName || "Not supplied"}`,
    `Submitter email: ${input.submitterEmail || "Not supplied"}`,
    "",
    "Claim or question summary:",
    input.claimSummary,
    "",
    "What needs to be checked:",
    input.checkRequest,
    "",
    "Guardrail:",
    "Public records first. No private addresses, minor children, threats, doxxing, sealed records, or unsourced allegations.",
  ].join("\n");
}
