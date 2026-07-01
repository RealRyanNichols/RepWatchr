import { z } from "zod";
import { serverTrackEvent } from "@/lib/analytics-server";
import { normalizeEmail } from "@/lib/data-intake";
import {
  SOURCE_REQUESTED_ACTIONS,
  SOURCE_TARGET_TYPES,
  SOURCE_TYPES,
  type SourceConfidence,
  type SourcePriority,
  type SourceStatus,
} from "@/lib/source-submission-options";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type AdminClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

export interface SourceSubmissionContext {
  anonymousId?: string | null;
  userId?: string | null;
  sessionId?: string | null;
  route?: string | null;
  pathname?: string | null;
  referrer?: string | null;
  utm?: Record<string, string | null | undefined>;
  deviceType?: string | null;
  browser?: string | null;
  os?: string | null;
}

const shortText = z.string().trim().max(220).optional().or(z.literal(""));
const longText = z.string().trim().max(5000).optional().or(z.literal(""));

const dangerousLanguagePatterns = [
  /\bkill\b/i,
  /\bshoot\b/i,
  /\bbomb\b/i,
  /\bassassinat/i,
  /\bhang\b/i,
  /\blynch\b/i,
  /\bbeat\s+(him|her|them|up)\b/i,
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

function cleanText(value: unknown, maxLength = 220) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanNullableText(value: unknown, maxLength = 220) {
  const clean = cleanText(value, maxLength);
  return clean || null;
}

function cleanSourceDate(value: unknown) {
  const clean = cleanText(value, 40);
  if (!clean) return null;
  const date = new Date(clean);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function priorityFor(payload: Record<string, unknown>): SourcePriority {
  const text = `${cleanText(payload.requestedAction)} ${cleanText(payload.sourceType)} ${cleanText(payload.targetType)}`.toLowerCase();
  if (text.includes("court record") || text.includes("ethics filing") || text.includes("correction")) return "high";
  return "normal";
}

function addSafetyChecks(schema: z.ZodTypeAny) {
  return schema.superRefine((value, ctx) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return;
    const payload = value as Record<string, unknown>;
    const text = valuesAsText(payload);

    const honeypot = payload.companyWebsite || payload.website_confirm;
    if (typeof honeypot === "string" && honeypot.trim()) {
      ctx.addIssue({ code: "custom", message: "Submission rejected." });
    }

    if (dangerousLanguagePatterns.some((pattern) => pattern.test(text))) {
      ctx.addIssue({
        code: "custom",
        message: "Remove threats or dangerous language. RepWatchr only accepts source-safe public-record submissions.",
      });
    }

    if (privateAddressPatterns.some((pattern) => pattern.test(text))) {
      ctx.addIssue({
        code: "custom",
        message: "Do not submit private home addresses. Use official public record links instead.",
      });
    }

    if (minorFamilyPatterns.some((pattern) => pattern.test(text))) {
      ctx.addIssue({
        code: "custom",
        message: "Do not include minor-child or private family details in this public-record intake form.",
      });
    }
  });
}

const sourceSubmissionSchema = addSafetyChecks(z.object({
  submitterName: shortText,
  submitterEmail: z.string().trim().toLowerCase().email().max(180).optional().or(z.literal("")),
  targetType: z.enum(SOURCE_TARGET_TYPES),
  targetId: shortText,
  targetName: z.string().trim().min(2).max(220),
  officeOrAgency: shortText,
  jurisdiction: z.string().trim().min(2).max(220),
  state: shortText,
  county: shortText,
  city: shortText,
  sourceUrl: z.string().trim().url().max(700),
  sourceTitle: shortText,
  sourcePublisher: shortText,
  sourceDate: z.string().trim().max(40).optional().or(z.literal("")),
  sourceType: z.enum(SOURCE_TYPES),
  claimSummary: z.string().trim().min(10).max(5000),
  whyItMatters: longText,
  requestedAction: z.enum(SOURCE_REQUESTED_ACTIONS),
  publicPrivateFlag: z.enum(["public_record", "private_review"]).default("public_record"),
  consent: z.literal(true),
  companyWebsite: shortText,
  website_confirm: shortText,
}));

export function validateSourceSubmissionPayload(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false as const, errors: ["Send a valid source submission payload."] };
  }

  const parsed = sourceSubmissionSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false as const,
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  return { ok: true as const, data: parsed.data as Record<string, unknown> };
}

export function normalizeSourceSubmissionPayload(payload: Record<string, unknown>, context: SourceSubmissionContext = {}) {
  const email = normalizeEmail(payload.submitterEmail);
  return {
    anonymous_id: context.anonymousId ?? null,
    user_id: context.userId ?? null,
    submitter_name: cleanNullableText(payload.submitterName, 180),
    submitter_email: email,
    target_type: cleanText(payload.targetType),
    target_id: cleanNullableText(payload.targetId),
    target_name: cleanNullableText(payload.targetName),
    office_or_agency: cleanNullableText(payload.officeOrAgency),
    jurisdiction: cleanNullableText(payload.jurisdiction),
    state: cleanNullableText(payload.state, 80),
    county: cleanNullableText(payload.county, 120),
    city: cleanNullableText(payload.city, 120),
    source_url: cleanText(payload.sourceUrl, 700),
    source_title: cleanNullableText(payload.sourceTitle, 260),
    source_publisher: cleanNullableText(payload.sourcePublisher, 180),
    source_date: cleanSourceDate(payload.sourceDate),
    source_type: cleanText(payload.sourceType),
    claim_summary: cleanNullableText(payload.claimSummary, 5000),
    why_it_matters: cleanNullableText(payload.whyItMatters, 5000),
    requested_action: cleanNullableText(payload.requestedAction),
    public_private_flag: cleanText(payload.publicPrivateFlag) || "public_record",
    confidence: "needs_review",
    status: "new",
    priority: priorityFor(payload),
    attribution: {
      route: context.pathname || context.route || null,
      referrer: context.referrer ?? null,
      utm: context.utm ?? {},
      session_id: context.sessionId ?? null,
      device_type: context.deviceType ?? null,
      browser: context.browser ?? null,
      os: context.os ?? null,
    },
    metadata: {
      source_packet_version: "2026-07-01",
      public_label: "Submitted Source - Under Review",
    },
  };
}

export function buildSourcePacket(payload: Record<string, unknown>, submissionId?: string) {
  return [
    "RepWatchr source packet",
    submissionId ? `Submission ID: ${submissionId}` : "Submission ID: pending",
    "Status: Submitted Source - Under Review",
    "",
    `Source URL: ${cleanText(payload.sourceUrl, 700)}`,
    `Source type: ${cleanText(payload.sourceType)}`,
    `Source title: ${cleanText(payload.sourceTitle) || "Not supplied"}`,
    `Publisher: ${cleanText(payload.sourcePublisher) || "Not supplied"}`,
    `Source date: ${cleanText(payload.sourceDate) || "Not supplied"}`,
    "",
    `Target type: ${cleanText(payload.targetType)}`,
    `Target name: ${cleanText(payload.targetName)}`,
    `Office/agency: ${cleanText(payload.officeOrAgency) || "Not supplied"}`,
    `Jurisdiction: ${cleanText(payload.jurisdiction)}`,
    `State/county/city: ${[payload.state, payload.county, payload.city].map((value) => cleanText(value)).filter(Boolean).join(" / ") || "Not supplied"}`,
    "",
    "What the source appears to show:",
    cleanText(payload.claimSummary, 5000),
    "",
    "Why it matters / what needs review:",
    cleanText(payload.whyItMatters, 5000) || "Not supplied",
    "",
    `Requested action: ${cleanText(payload.requestedAction)}`,
    "Guardrail: this is not verified public truth until RepWatchr review attaches it as a source link.",
  ].join("\n");
}

export async function createSourceSubmissionEvent(
  admin: AdminClient,
  sourceSubmissionId: string,
  eventType: string,
  actorUserId?: string | null,
  oldStatus?: string | null,
  newStatus?: string | null,
  metadata: Record<string, unknown> = {},
) {
  const { error } = await admin.from("source_submission_events").insert({
    source_submission_id: sourceSubmissionId,
    event_type: eventType,
    actor_user_id: actorUserId ?? null,
    old_status: oldStatus ?? null,
    new_status: newStatus ?? null,
    metadata,
  });

  return { ok: !error, error: error?.message ?? null };
}

export async function submitSourceSubmission({
  payload,
  context,
  request,
}: {
  payload: unknown;
  context: SourceSubmissionContext;
  request?: Request;
}) {
  const validation = validateSourceSubmissionPayload(payload);
  if (!validation.ok) {
    await serverTrackEvent({
      eventName: "source_submit_failed",
      anonymousId: context.anonymousId,
      userId: context.userId,
      sessionId: context.sessionId,
      route: context.route ?? context.pathname,
      referrer: context.referrer,
      metadata: { errors: validation.errors.join(" | ") },
    });
    return { ok: false as const, status: 400, message: validation.errors[0] ?? "Source validation failed.", errors: validation.errors };
  }

  const admin = getSupabaseAdminClient();
  const packetWithoutId = buildSourcePacket(validation.data);

  if (!admin) {
    return {
      ok: true as const,
      stored: false,
      status: 200,
      submissionId: `source_packet_${crypto.randomUUID().slice(0, 12)}`,
      submissionStatus: "new",
      label: "Submitted Source - Under Review",
      summary: packetWithoutId,
      message: "Source packet created. Save the summary below or create an account to track it when review storage is available.",
      thankYouPath: "/sources/submitted",
    };
  }

  const insertPayload = normalizeSourceSubmissionPayload(validation.data, {
    ...context,
    referrer: context.referrer ?? request?.headers.get("referer") ?? null,
  });

  const { data, error } = await admin
    .from("source_submissions")
    .insert(insertPayload)
    .select("id, status")
    .single();

  if (error || !data?.id) {
    await serverTrackEvent({
      eventName: "source_submit_failed",
      anonymousId: context.anonymousId,
      userId: context.userId,
      sessionId: context.sessionId,
      route: context.route ?? context.pathname,
      referrer: context.referrer,
      metadata: { error: error?.message ?? "insert_failed" },
    });
    return {
      ok: false as const,
      status: 500,
      message: "The source could not be stored. Copy the packet and try again.",
      errors: [error?.message ?? "insert_failed"],
      summary: packetWithoutId,
    };
  }

  const submissionId = String(data.id);
  const summary = buildSourcePacket(validation.data, submissionId);

  await Promise.all([
    createSourceSubmissionEvent(admin, submissionId, "submitted", context.userId ?? null, null, "new", {
      target_type: insertPayload.target_type,
      source_type: insertPayload.source_type,
      source_url: insertPayload.source_url,
    }),
    mirrorIntoUniversalIntake(admin, submissionId, validation.data, context),
    serverTrackEvent({
      eventName: "source_submit_completed",
      anonymousId: context.anonymousId,
      userId: context.userId,
      sessionId: context.sessionId,
      route: context.route ?? context.pathname,
      referrer: context.referrer,
      utm_source: context.utm?.utm_source ?? null,
      utm_medium: context.utm?.utm_medium ?? null,
      utm_campaign: context.utm?.utm_campaign ?? null,
      utm_term: context.utm?.utm_term ?? null,
      utm_content: context.utm?.utm_content ?? null,
      deviceType: context.deviceType,
      browser: context.browser,
      os: context.os,
      metadata: {
        source_submission_id: submissionId,
        target_type: insertPayload.target_type,
        target_name: insertPayload.target_name,
        jurisdiction: insertPayload.jurisdiction,
        source_type: insertPayload.source_type,
      },
    }),
  ]);

  return {
    ok: true as const,
    stored: true,
    status: 200,
    submissionId,
    submissionStatus: data.status ?? "new",
    label: "Submitted Source - Under Review",
    summary,
    message: "Source received. It is under review, not published as verified truth.",
    thankYouPath: `/sources/submitted?submission=${submissionId}`,
  };
}

async function mirrorIntoUniversalIntake(admin: AdminClient, sourceSubmissionId: string, payload: Record<string, unknown>, context: SourceSubmissionContext) {
  const { error } = await admin.from("form_submissions").insert({
    form_key: "submit_source",
    anonymous_id: context.anonymousId ?? null,
    user_id: context.userId ?? null,
    email: normalizeEmail(payload.submitterEmail),
    name: cleanNullableText(payload.submitterName, 180),
    payload: {
      ...payload,
      sourceSubmissionId,
    },
    normalized_payload: {
      target: cleanText(payload.targetName),
      jurisdiction: cleanText(payload.jurisdiction),
      source_url: cleanText(payload.sourceUrl, 700),
      source_type: cleanText(payload.sourceType),
      source_submission_id: sourceSubmissionId,
    },
    status: "new",
    priority: priorityFor(payload),
    source_route: context.pathname || context.route || null,
    referrer: context.referrer ?? null,
    utm: context.utm ?? {},
  });

  if (error && !/form_submissions|does not exist|schema cache/i.test(error.message)) {
    console.warn(JSON.stringify({ level: "warn", msg: "source_universal_intake_mirror_failed", error: error.message }));
  }
}

export async function updateSourceSubmissionStatus({
  admin,
  submissionId,
  actorUserId,
  status,
  confidence,
  priority,
  assignedReviewer,
  duplicateOf,
  note,
}: {
  admin: AdminClient;
  submissionId: string;
  actorUserId: string;
  status: SourceStatus;
  confidence?: SourceConfidence;
  priority?: SourcePriority;
  assignedReviewer?: string | null;
  duplicateOf?: string | null;
  note?: string | null;
}) {
  const { data: before } = await admin
    .from("source_submissions")
    .select("status")
    .eq("id", submissionId)
    .maybeSingle();

  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (confidence) patch.confidence = confidence;
  if (priority) patch.priority = priority;
  if (assignedReviewer !== undefined) patch.assigned_reviewer = assignedReviewer || null;
  if (duplicateOf !== undefined) patch.duplicate_of = duplicateOf || null;

  const { error } = await admin.from("source_submissions").update(patch).eq("id", submissionId);
  if (error) return { ok: false as const, error: error.message };

  if (note?.trim()) {
    await admin.from("source_review_notes").insert({
      source_submission_id: submissionId,
      reviewer_user_id: actorUserId,
      note: note.trim().slice(0, 5000),
      visibility: "internal",
    });
  }

  const eventName =
    status === "rejected" ? "source_rejected" :
    status === "duplicate" ? "source_marked_duplicate" :
    "source_admin_status_changed";

  await Promise.all([
    createSourceSubmissionEvent(admin, submissionId, eventName, actorUserId, before?.status ?? null, status, {
      confidence,
      priority,
      duplicate_of: duplicateOf ?? null,
    }),
    serverTrackEvent({
      eventName,
      userId: actorUserId,
      route: "/admin/sources",
      metadata: { source_submission_id: submissionId, old_status: before?.status ?? null, new_status: status },
    }),
  ]);

  return { ok: true as const };
}

export async function attachSourceSubmissionToEntity({
  admin,
  submissionId,
  actorUserId,
  entityType,
  entityId,
  summary,
  confidence,
}: {
  admin: AdminClient;
  submissionId: string;
  actorUserId: string;
  entityType: string;
  entityId: string;
  summary?: string | null;
  confidence?: SourceConfidence;
}) {
  const { data: submission, error: loadError } = await admin
    .from("source_submissions")
    .select("*")
    .eq("id", submissionId)
    .maybeSingle();

  if (loadError) return { ok: false as const, error: loadError.message };
  if (!submission) return { ok: false as const, error: "Source submission not found." };

  const safeEntityType = entityType.trim().toLowerCase().replace(/[^a-z0-9_:-]/g, "_").slice(0, 120);
  const safeEntityId = entityId.trim().slice(0, 240);
  if (!safeEntityType || !safeEntityId) return { ok: false as const, error: "Entity type and entity ID are required." };

  const linkPayload = {
    entity_type: safeEntityType,
    entity_id: safeEntityId,
    source_url: submission.source_url,
    source_title: submission.source_title,
    source_publisher: submission.source_publisher,
    source_type: submission.source_type,
    source_date: submission.source_date,
    summary: summary?.trim().slice(0, 5000) || submission.claim_summary,
    confidence: confidence === "needs_review" || confidence === "rejected" ? "source_backed" : (confidence ?? "source_backed"),
    status: "active",
    added_by: actorUserId,
    submission_id: submissionId,
    updated_at: new Date().toISOString(),
  };

  const { data: link, error: linkError } = await admin
    .from("source_links")
    .upsert(linkPayload, { onConflict: "entity_type,entity_id,source_url" })
    .select("id")
    .single();

  if (linkError) return { ok: false as const, error: linkError.message };

  const nextStatus = statusForEntityType(safeEntityType);
  const update = await updateSourceSubmissionStatus({
    admin,
    submissionId,
    actorUserId,
    status: nextStatus,
    confidence: confidence ?? "source_backed",
    note: `Attached to ${safeEntityType}:${safeEntityId}.`,
  });
  if (!update.ok) return update;

  await Promise.all([
    createSourceSubmissionEvent(admin, submissionId, "source_attached_to_entity", actorUserId, submission.status, nextStatus, {
      entity_type: safeEntityType,
      entity_id: safeEntityId,
      source_link_id: link?.id ?? null,
    }),
    serverTrackEvent({
      eventName: "source_attached_to_entity",
      userId: actorUserId,
      route: "/admin/sources",
      metadata: { source_submission_id: submissionId, entity_type: safeEntityType, entity_id: safeEntityId },
    }),
  ]);

  return { ok: true as const, sourceLinkId: link?.id ?? null, status: nextStatus };
}

function statusForEntityType(entityType: string): SourceStatus {
  if (entityType.includes("race") || entityType.includes("election")) return "attached_to_race";
  if (entityType.includes("story") || entityType.includes("article") || entityType.includes("news")) return "attached_to_story";
  return "attached_to_profile";
}
