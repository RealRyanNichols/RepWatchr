import { serverTrackEvent } from "@/lib/analytics-server";
import {
  FORM_DEFINITIONS,
  FORM_STATUSES,
  buildSafeSubmissionSummary,
  isFormKey,
  normalizeEmail,
  normalizeFormPayload,
  validateFormPayload,
  type FormKey,
  type FormStatus,
} from "@/lib/data-intake";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type AdminClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

export interface SubmitFormContext {
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

export interface SubmitFormInput {
  formKey: string;
  payload: unknown;
  context: SubmitFormContext;
  request?: Request;
}

export function getSubmissionStatus(value: unknown): FormStatus {
  return typeof value === "string" && (FORM_STATUSES as readonly string[]).includes(value) ? (value as FormStatus) : "new";
}

export async function createFormSubmissionEvent(
  admin: AdminClient,
  submissionId: string,
  eventType: string,
  actorUserId?: string | null,
  metadata: Record<string, unknown> = {},
) {
  const { error } = await admin.from("form_submission_events").insert({
    submission_id: submissionId,
    event_type: eventType,
    actor_user_id: actorUserId ?? null,
    metadata,
  });

  return { ok: !error, error: error?.message ?? null };
}

export async function createAdminQueueItem(admin: AdminClient, submissionId: string, formKey: FormKey) {
  return createFormSubmissionEvent(admin, submissionId, "admin_queue_item_created", null, {
    form_key: formKey,
    queue: "forms",
  });
}

export async function submitForm(input: SubmitFormInput) {
  if (!isFormKey(input.formKey)) {
    return { ok: false as const, status: 400, message: "Unsupported form key.", errors: ["Unsupported form key."] };
  }

  const validation = validateFormPayload(input.formKey, input.payload);
  if (!validation.ok) {
    await serverTrackEvent({
      eventName: "form_submit_failed",
      anonymousId: input.context.anonymousId,
      userId: input.context.userId,
      sessionId: input.context.sessionId,
      route: input.context.route,
      referrer: input.context.referrer,
      metadata: { form_key: input.formKey, errors: validation.errors.join(" | ") },
    });
    return { ok: false as const, status: 400, message: validation.errors[0] ?? "Form validation failed.", errors: validation.errors };
  }

  const admin = getSupabaseAdminClient();
  const normalized = normalizeFormPayload(input.formKey, validation.data);
  const email = normalizeEmail(validation.data.email);
  const summaryWithoutId = buildSafeSubmissionSummary(input.formKey, validation.data);

  if (!admin) {
    return {
      ok: true as const,
      stored: false,
      status: 200,
      submissionId: `packet_${crypto.randomUUID().slice(0, 12)}`,
      submissionStatus: "new" as FormStatus,
      summary: summaryWithoutId,
      message: "Packet created. Save the summary below or create an account to track it when review storage is available.",
      nextAction: nextActionFor(input.formKey),
      thankYouPath: `/intake/thank-you?form=${input.formKey}`,
    };
  }

  await ensureFormDefinition(admin, input.formKey);

  const sourceRoute = input.context.pathname || input.context.route || null;
  const utm = input.context.utm ?? {};
  const { data, error } = await admin
    .from("form_submissions")
    .insert({
      form_key: input.formKey,
      anonymous_id: input.context.anonymousId ?? null,
      user_id: input.context.userId ?? null,
      email,
      name: typeof validation.data.name === "string" ? validation.data.name.trim().slice(0, 180) || null : null,
      payload: validation.data,
      normalized_payload: normalized,
      status: "new",
      priority: normalized.priority,
      source_route: sourceRoute,
      referrer: input.context.referrer ?? input.request?.headers.get("referer") ?? null,
      utm,
    })
    .select("id, status")
    .single();

  if (error || !data?.id) {
    await serverTrackEvent({
      eventName: "form_submit_failed",
      anonymousId: input.context.anonymousId,
      userId: input.context.userId,
      sessionId: input.context.sessionId,
      route: sourceRoute,
      referrer: input.context.referrer,
      metadata: { form_key: input.formKey, error: error?.message ?? "insert_failed" },
    });
    return {
      ok: false as const,
      status: 500,
      message: "The submission could not be stored. Copy the packet and try again.",
      errors: [error?.message ?? "insert_failed"],
      summary: summaryWithoutId,
    };
  }

  const submissionId = String(data.id);
  const summary = buildSafeSubmissionSummary(input.formKey, validation.data, submissionId);

  await Promise.all([
    createFormSubmissionEvent(admin, submissionId, "submitted", input.context.userId ?? null, {
      form_key: input.formKey,
      source_route: sourceRoute,
    }),
    createAdminQueueItem(admin, submissionId, input.formKey),
    recordAttributionTouch(admin, input.formKey, input.context, submissionId),
    serverTrackEvent({
      eventName: specificCompletedEvent(input.formKey),
      anonymousId: input.context.anonymousId,
      userId: input.context.userId,
      sessionId: input.context.sessionId,
      route: sourceRoute,
      referrer: input.context.referrer,
      utm_source: input.context.utm?.utm_source ?? null,
      utm_medium: input.context.utm?.utm_medium ?? null,
      utm_campaign: input.context.utm?.utm_campaign ?? null,
      utm_term: input.context.utm?.utm_term ?? null,
      utm_content: input.context.utm?.utm_content ?? null,
      deviceType: input.context.deviceType,
      browser: input.context.browser,
      os: input.context.os,
      metadata: {
        form_key: input.formKey,
        submission_id: submissionId,
        target: normalized.target,
        jurisdiction: normalized.jurisdiction,
        source_url: normalized.source_url,
      },
    }),
    serverTrackEvent({
      eventName: "form_submitted",
      anonymousId: input.context.anonymousId,
      userId: input.context.userId,
      sessionId: input.context.sessionId,
      route: sourceRoute,
      referrer: input.context.referrer,
      metadata: { form_key: input.formKey, submission_id: submissionId },
    }),
  ]);

  return {
    ok: true as const,
    stored: true,
    status: 200,
    submissionId,
    submissionStatus: getSubmissionStatus(data.status),
    summary,
    message: "Submission received. RepWatchr can route it into review.",
    nextAction: nextActionFor(input.formKey),
    thankYouPath: `/intake/thank-you?submission=${submissionId}&form=${input.formKey}`,
  };
}

async function ensureFormDefinition(admin: AdminClient, formKey: FormKey) {
  const definition = FORM_DEFINITIONS.find((item) => item.key === formKey);
  if (!definition) return;

  await admin.from("form_definitions").upsert(
    {
      key: definition.key,
      name: definition.name,
      description: definition.description,
      status: definition.status,
      schema: {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
}

async function recordAttributionTouch(admin: AdminClient, formKey: FormKey, context: SubmitFormContext, submissionId: string) {
  const { error } = await admin.from("attribution_touches").insert({
    anonymous_id: context.anonymousId ?? null,
    user_id: context.userId ?? null,
    session_id: context.sessionId ?? null,
    touch_type: "form_submitted",
    route: context.pathname || context.route || null,
    referrer: context.referrer ?? null,
    utm_source: context.utm?.utm_source ?? null,
    utm_medium: context.utm?.utm_medium ?? null,
    utm_campaign: context.utm?.utm_campaign ?? null,
    utm_term: context.utm?.utm_term ?? null,
    utm_content: context.utm?.utm_content ?? null,
    metadata: { form_key: formKey, submission_id: submissionId },
  });

  if (error && !/attribution_touches|does not exist|schema cache/i.test(error.message)) {
    console.warn(JSON.stringify({ level: "warn", msg: "form_attribution_touch_failed", error: error.message }));
  }
}

export async function updateSubmissionStatus(
  admin: AdminClient,
  submissionId: string,
  nextStatus: FormStatus,
  actorUserId: string,
  metadata: Record<string, unknown> = {},
) {
  const { data: before } = await admin
    .from("form_submissions")
    .select("status")
    .eq("id", submissionId)
    .maybeSingle();

  const { error } = await admin
    .from("form_submissions")
    .update({
      status: nextStatus,
      admin_notes: typeof metadata.admin_notes === "string" ? metadata.admin_notes.slice(0, 5000) : undefined,
      assigned_to: typeof metadata.assigned_to === "string" && metadata.assigned_to ? metadata.assigned_to : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (error) return { ok: false as const, error: error.message };

  await createFormSubmissionEvent(admin, submissionId, "status_changed", actorUserId, {
    before_status: before?.status ?? null,
    after_status: nextStatus,
    ...metadata,
  });

  await serverTrackEvent({
    eventName: "admin_form_status_changed",
    userId: actorUserId,
    metadata: { submission_id: submissionId, before_status: before?.status ?? null, after_status: nextStatus },
  });

  return { ok: true as const };
}

export function nextActionFor(formKey: FormKey) {
  const actions: Record<FormKey, string> = {
    submit_source: "Watch the related official or build another source packet.",
    correction_request: "Copy the correction packet and watch the profile for updates.",
    free_packet: "Create a free account so the packet can be saved to your dashboard.",
    package_interest: "Copy the service request packet and watch for follow-up.",
    investor_interest: "Watch the partner page and wait for direct follow-up.",
    partner_interest: "Watch the partner page and wait for direct follow-up.",
    data_source_suggestion: "Submit one more source lane if you have it.",
    missing_official: "Submit an official roster source if available.",
    missing_agency: "Submit the agency website or meeting page if available.",
    report_broken_link: "Submit a replacement source if you know one.",
    newsletter_signup: "Create a free account for watchlists and saved packets.",
    watchlist_signup: "Create a free account to save the watchlist.",
    feedback: "Open the dashboard or submit a source if the feedback points to a record.",
    contact: "Copy the message packet and wait for follow-up.",
    research_request: "Copy the research packet and watch the relevant record.",
    public_records_request: "Save the draft and track the request status.",
  };

  return actions[formKey];
}

function specificCompletedEvent(formKey: FormKey) {
  const events: Partial<Record<FormKey, string>> = {
    submit_source: "source_submit_completed",
    correction_request: "correction_submit_completed",
    package_interest: "package_interest_submitted",
    investor_interest: "investor_interest_submitted",
    partner_interest: "partner_interest_submitted",
    report_broken_link: "broken_link_reported",
  };

  return events[formKey] ?? "form_submitted";
}
