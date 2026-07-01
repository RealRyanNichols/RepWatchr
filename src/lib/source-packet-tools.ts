import { z } from "zod";

export const SOURCE_PACKET_TYPES = [
  "official_record",
  "vote_record",
  "funding_record",
  "meeting_record",
  "school_board_record",
  "race_candidate_record",
  "agency_record",
  "correction_packet",
  "public_question_packet",
  "media_tip_packet",
  "open_records_packet",
] as const;

export const SOURCE_PACKET_TYPE_LABELS: Record<SourcePacketType, string> = {
  official_record: "Official record",
  vote_record: "Vote record",
  funding_record: "Funding record",
  meeting_record: "Meeting record",
  school_board_record: "School board record",
  race_candidate_record: "Race / candidate record",
  agency_record: "Agency record",
  correction_packet: "Correction packet",
  public_question_packet: "Public question packet",
  media_tip_packet: "Media tip packet",
  open_records_packet: "Open records packet",
};

export const PACKET_TARGET_TYPES = [
  "official",
  "agency",
  "race",
  "school_board",
  "court",
  "public_body",
  "story",
  "other",
] as const;

export const PACKET_TARGET_TYPE_LABELS: Record<PacketTargetType, string> = {
  official: "Official",
  agency: "Agency",
  race: "Race",
  school_board: "School board",
  court: "Court",
  public_body: "Public body",
  story: "Story",
  other: "Other",
};

export const RECORD_REQUEST_TYPES = [
  "meeting_minutes",
  "agenda",
  "vote_record",
  "campaign_finance",
  "body_cam_public_safety",
  "email_correspondence",
  "contract_vendor",
  "policy_manual",
  "court_public_case",
  "other",
] as const;

export const RECORD_REQUEST_TYPE_LABELS: Record<RecordRequestType, string> = {
  meeting_minutes: "Meeting minutes",
  agenda: "Agenda",
  vote_record: "Vote record",
  campaign_finance: "Campaign finance",
  body_cam_public_safety: "Body cam / public safety",
  email_correspondence: "Email correspondence",
  contract_vendor: "Contract / vendor",
  policy_manual: "Policy manual",
  court_public_case: "Court public case",
  other: "Other",
};

export type SourcePacketType = (typeof SOURCE_PACKET_TYPES)[number];
export type PacketTargetType = (typeof PACKET_TARGET_TYPES)[number];
export type RecordRequestType = (typeof RECORD_REQUEST_TYPES)[number];

const optionalText = (max = 700) => z.string().trim().max(max).optional().or(z.literal(""));
const dateText = z
  .string()
  .trim()
  .max(20)
  .optional()
  .or(z.literal(""))
  .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), "Use a valid date.");

export const sourcePacketInputSchema = z.object({
  title: optionalText(220),
  packetType: z.enum(SOURCE_PACKET_TYPES).default("official_record"),
  targetType: z.enum(PACKET_TARGET_TYPES).default("official"),
  targetId: optionalText(120),
  targetName: z.string().trim().min(2).max(220),
  jurisdiction: optionalText(220),
  sourceUrl: z.string().trim().url().max(700),
  sourceTitle: optionalText(220),
  sourceDate: dateText,
  sourceType: optionalText(120),
  summary: z.string().trim().min(10).max(3000),
  confirmed: optionalText(2000),
  claimLanguage: optionalText(2000),
  missingContext: optionalText(2000),
  publicQuestion: optionalText(700),
  nextRecordRequest: optionalText(700),
  consent: z.boolean().optional(),
});

export const recordsRequestInputSchema = z.object({
  title: optionalText(220),
  state: z.string().trim().min(2).max(80),
  jurisdiction: optionalText(180),
  agency: z.string().trim().min(2).max(220),
  recordType: z.enum(RECORD_REQUEST_TYPES).default("meeting_minutes"),
  dateRangeStart: dateText,
  dateRangeEnd: dateText,
  subject: z.string().trim().min(3).max(700),
  namesOrOffices: optionalText(700),
  meetingOrEvent: optionalText(700),
  preferredDelivery: optionalText(180),
  requesterContact: optionalText(700),
  notes: optionalText(3000),
  status: z.enum(["draft", "sent", "response_received", "partially_fulfilled", "denied", "overdue", "closed"]).default("draft"),
  consent: z.boolean().optional(),
});

export type SourcePacketInput = z.infer<typeof sourcePacketInputSchema>;
export type RecordsRequestInput = z.infer<typeof recordsRequestInputSchema>;

const privateAddressPatterns = [
  /\b\d{1,6}\s+[a-z0-9.'-]+(?:\s+[a-z0-9.'-]+){0,5}\s+(street|st|road|rd|drive|dr|lane|ln|court|ct|circle|cir|avenue|ave|boulevard|blvd|way|trail|trl)\b/i,
  /\b(apartment|apt|unit|suite|ste)\s*#?\s*[a-z0-9-]+\b/i,
];

const dangerPatterns = [
  /\bkill\b/i,
  /\bshoot\b/i,
  /\bbomb\b/i,
  /\bassassinat/i,
  /\bhang\b/i,
  /\blynch\b/i,
  /\bshow\s+up\s+at\s+(their|his|her)\s+house\b/i,
];

const minorPatterns = [
  /\bminor child\b/i,
  /\bmy child\b/i,
  /\bmy son\b/i,
  /\bmy daughter\b/i,
  /\bchild'?s name\b/i,
  /\bage\s+\d{1,2}\b/i,
];

const riskyCertaintyPatterns = [
  /\bcriminal\b/i,
  /\bbrib(e|ery|ed)\b/i,
  /\bcorrupt(ion)?\b/i,
  /\bfraud(ulent)?\b/i,
  /\bstole\b/i,
  /\btreason\b/i,
  /\btraitor\b/i,
  /\bguilty\b/i,
];

export function getSafetyWarnings(values: Array<string | null | undefined>) {
  const text = values.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  const warnings: string[] = [];
  if (!text) return warnings;
  if (privateAddressPatterns.some((pattern) => pattern.test(text))) warnings.push("Remove private home addresses before submitting or sharing.");
  if (minorPatterns.some((pattern) => pattern.test(text))) warnings.push("Remove minor-child or private family details before submitting or sharing.");
  if (dangerPatterns.some((pattern) => pattern.test(text))) warnings.push("Remove threats, harassment, or dangerous language. RepWatchr only supports public-record accountability.");
  if (riskyCertaintyPatterns.some((pattern) => pattern.test(text))) warnings.push("Use cautious language unless an official source legally supports the claim.");
  return Array.from(new Set(warnings));
}

function compactText(value: string | null | undefined, fallback = "Not supplied") {
  const clean = value?.replace(/\s+/g, " ").trim();
  return clean || fallback;
}

function cautiousText(value: string | null | undefined, fallback = "Not supplied") {
  return compactText(value, fallback)
    .replace(/\bproves\b/gi, "appears to support")
    .replace(/\bproof\b/gi, "source context")
    .replace(/\bcriminal\b/gi, "serious")
    .replace(/\bbribery\b/gi, "alleged improper influence")
    .replace(/\bbribed\b/gi, "allegedly improperly influenced")
    .replace(/\bcorrupt(?:ion)?\b/gi, "possible misconduct")
    .replace(/\bfraud(?:ulent)?\b/gi, "possible false or misleading record")
    .replace(/\bguilty\b/gi, "responsible according to a confirmed legal finding");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not supplied";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

function inferSourceType(input: SourcePacketInput) {
  if (input.sourceType?.trim()) return input.sourceType.trim();
  return SOURCE_PACKET_TYPE_LABELS[input.packetType];
}

function defaultPublicQuestion(input: SourcePacketInput) {
  const target = compactText(input.targetName, "this public entity");
  const topic = input.packetType === "funding_record"
    ? "the public campaign finance filing"
    : input.packetType === "vote_record"
      ? "the public vote record"
      : input.packetType === "meeting_record" || input.packetType === "school_board_record"
        ? "the agenda, minutes, video, or vote record"
        : "the public source";
  return `Which public record confirms ${topic} for ${target}, and where can residents inspect it?`;
}

function defaultNextRecord(input: SourcePacketInput) {
  switch (input.packetType) {
    case "funding_record":
      return "Pull the official campaign finance filing, committee report, or expenditure schedule for the same cycle.";
    case "vote_record":
      return "Pull the official roll call, bill text, amendment text, and final journal entry for the vote.";
    case "meeting_record":
    case "school_board_record":
      return "Pull the agenda, approved minutes, meeting video, and item-level vote record.";
    case "correction_packet":
      return "Pull the official roster, filing, or public page that corrects the disputed profile detail.";
    case "open_records_packet":
      return "Send a focused public-records request for the missing record, date range, and named public body.";
    default:
      return "Pull the official page, filing, meeting record, or primary public source that confirms the issue.";
  }
}

export function estimatePacketConfidence(input: SourcePacketInput) {
  let score = 35;
  if (input.sourceUrl) score += 20;
  if (input.sourceDate) score += 10;
  if (input.jurisdiction) score += 10;
  if (input.confirmed) score += 10;
  if (input.missingContext) score += 5;
  if (input.summary.length > 160) score += 10;
  const warnings = getSafetyWarnings([input.summary, input.confirmed, input.claimLanguage, input.missingContext, input.publicQuestion]);
  score -= warnings.length * 12;
  return Math.max(0, Math.min(100, score));
}

export function buildSourcePacket(input: SourcePacketInput) {
  const warnings = getSafetyWarnings([
    input.targetName,
    input.jurisdiction,
    input.summary,
    input.confirmed,
    input.claimLanguage,
    input.missingContext,
    input.publicQuestion,
  ]);
  const sourceType = inferSourceType(input);
  const publicQuestion = compactText(input.publicQuestion, defaultPublicQuestion(input));
  const nextRecord = compactText(input.nextRecordRequest, defaultNextRecord(input));
  const safeSummary = cautiousText(input.summary);
  const safeConfirmed = cautiousText(input.confirmed, "The source URL and submitted summary are ready for human review. RepWatchr has not verified this packet yet.");
  const missingContext = cautiousText(input.missingContext, "The record still needs source review, context, and any official primary record that confirms or narrows the claim.");
  const claimLanguage = cautiousText(input.claimLanguage, "Use this as a public question or source-review packet until a human reviewer attaches a verified label.");
  const safeShareLine = `Public question for ${compactText(input.targetName)}: ${publicQuestion} Source/context: ${input.sourceUrl}`;
  const confidence = estimatePacketConfidence(input);

  const lines = [
    `# RepWatchr Source Packet: ${compactText(input.title ?? input.targetName, compactText(input.targetName))}`,
    "",
    `Packet type: ${SOURCE_PACKET_TYPE_LABELS[input.packetType]}`,
    `Target type: ${PACKET_TARGET_TYPE_LABELS[input.targetType]}`,
    `Target: ${compactText(input.targetName)}`,
    `Jurisdiction: ${compactText(input.jurisdiction)}`,
    `Source URL: ${input.sourceUrl}`,
    `Source title: ${compactText(input.sourceTitle)}`,
    `Source date: ${formatDate(input.sourceDate)}`,
    `Source type: ${sourceType}`,
    `Confidence meter: ${confidence}/100`,
    "",
    "## What this source appears to show",
    safeSummary,
    "",
    "## What is confirmed",
    safeConfirmed,
    "",
    "## What is not confirmed",
    claimLanguage,
    "",
    "## Missing context",
    missingContext,
    "",
    "## Public question",
    publicQuestion,
    "",
    "## Suggested next public record to request",
    nextRecord,
    "",
    "## Safe share line",
    safeShareLine,
    "",
    "## RepWatchr link",
    "https://www.repwatchr.com/free-packet",
    "",
    "Guardrail: public-record research only. Do not publish private home addresses, minor-child details, threats, harassment instructions, or claims beyond what the source supports.",
    warnings.length ? "" : "",
    ...warnings.map((warning) => `Safety warning: ${warning}`),
  ].filter((line, index, array) => !(line === "" && array[index - 1] === ""));

  const markdown = lines.join("\n");
  const text = markdown
    .replace(/^#\s+/gm, "")
    .replace(/^##\s+/gm, "")
    .replace(/\*\*/g, "");

  return {
    generatedMarkdown: markdown,
    generatedText: text,
    publicQuestion,
    nextRecordRequest: nextRecord,
    safeShareLine,
    confidence,
    safetyWarnings: warnings,
  };
}

function dateRange(input: RecordsRequestInput) {
  if (input.dateRangeStart && input.dateRangeEnd) return `${formatDate(input.dateRangeStart)} through ${formatDate(input.dateRangeEnd)}`;
  if (input.dateRangeStart) return `from ${formatDate(input.dateRangeStart)} forward`;
  if (input.dateRangeEnd) return `through ${formatDate(input.dateRangeEnd)}`;
  return "the relevant date range for this request";
}

function requestRecordLabel(type: RecordRequestType) {
  return RECORD_REQUEST_TYPE_LABELS[type].toLowerCase();
}

function deliveryLine(input: RecordsRequestInput) {
  const preferred = compactText(input.preferredDelivery, "electronic delivery by email or public download link");
  return `Please provide responsive records by ${preferred} when available.`;
}

export function buildRecordsRequest(input: RecordsRequestInput) {
  const warnings = getSafetyWarnings([
    input.agency,
    input.jurisdiction,
    input.subject,
    input.namesOrOffices,
    input.meetingOrEvent,
    input.requesterContact,
    input.notes,
  ]);
  const recordTypeLabel = requestRecordLabel(input.recordType);
  const range = dateRange(input);
  const jurisdiction = compactText(input.jurisdiction || input.state);
  const requester = compactText(input.requesterContact, "Requester contact information below");
  const names = compactText(input.namesOrOffices, "named officials, offices, public bodies, or staff connected to this request");
  const event = compactText(input.meetingOrEvent, "the meeting, event, vote, filing, policy, contract, or public action described below");
  const notes = compactText(input.notes, "Please search for the requested public records and let me know if clarification is needed.");

  const generatedRequest = [
    `Subject: Public Records Request - ${recordTypeLabel} for ${compactText(input.subject)}`,
    "",
    `To ${compactText(input.agency)},`,
    "",
    `This is a public records request for ${recordTypeLabel} related to ${compactText(input.subject)} in ${jurisdiction}.`,
    "",
    `Please search for responsive records covering ${range}. This request includes records involving ${names}, including records related to ${event}.`,
    "",
    "Requested records:",
    `- ${RECORD_REQUEST_TYPE_LABELS[input.recordType]}`,
    "- Related agendas, minutes, attachments, exhibits, filings, correspondence, logs, metadata, or public links that identify the responsive record",
    "- Any public index, docket, agenda packet, policy page, filing page, or responsive public record already available online",
    "",
    deliveryLine(input),
    "If any portion is withheld, please identify the legal basis for withholding and release all reasonably segregable public portions.",
    "If the request is too broad, please tell me what terms, offices, dates, or record categories would make it easier to process.",
    "",
    "Notes:",
    notes,
    "",
    requester,
    "",
    "RepWatchr helps organize public-record research. This is not legal advice. Public-record laws and deadlines vary by jurisdiction.",
  ].join("\n");

  const shortEmailVersion = [
    `Hello ${compactText(input.agency)},`,
    "",
    `I am requesting public records for ${recordTypeLabel} related to ${compactText(input.subject)} for ${range}.`,
    `Please include responsive records involving ${names} and ${event}.`,
    deliveryLine(input),
    "If clarification is needed, please let me know what narrower date range, office, or record category would help.",
    "",
    requester,
  ].join("\n");

  const followupVersion = [
    `Subject: Follow-up on public records request - ${compactText(input.subject)}`,
    "",
    `Hello ${compactText(input.agency)},`,
    "",
    `I am following up on my public records request for ${recordTypeLabel} related to ${compactText(input.subject)} in ${jurisdiction}.`,
    "Please confirm whether the request has been received, whether any clarification is needed, and the expected timing for a response.",
    "",
    requester,
  ].join("\n");

  const overdueFollowupVersion = [
    `Subject: Overdue follow-up on public records request - ${compactText(input.subject)}`,
    "",
    `Hello ${compactText(input.agency)},`,
    "",
    `I am following up because I have not received a response or status update on my public records request for ${recordTypeLabel} related to ${compactText(input.subject)}.`,
    "Please provide the responsive public records, a written status update, or the specific clarification needed to continue processing the request.",
    "If any records are being withheld, please identify the legal basis and release all reasonably segregable public portions.",
    "",
    requester,
  ].join("\n");

  const denialClarificationStarter = [
    `Subject: Clarification requested - ${compactText(input.subject)}`,
    "",
    `Hello ${compactText(input.agency)},`,
    "",
    "Thank you for the response. Please identify which parts of the request can be fulfilled, which parts are being denied or withheld, and what specific narrowing would allow responsive public records to be released.",
    "If a legal exemption is being claimed, please identify the specific basis and release all reasonably segregable portions.",
    "",
    requester,
  ].join("\n");

  return {
    generatedRequest,
    shortEmailVersion,
    followupVersion,
    overdueFollowupVersion,
    denialClarificationStarter,
    safetyWarnings: warnings,
  };
}
