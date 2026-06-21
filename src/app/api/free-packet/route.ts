import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  buildSourcePacket,
  cleanEmail,
  cleanLongText,
  cleanText,
  cleanUrl,
  normalizeSourceSubmission,
  validateSourceSubmission,
} from "@/lib/source-submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const targetTypes = new Set([
  "official",
  "race",
  "school_board",
  "vote",
  "meeting",
  "funding",
  "red_flag",
  "correction",
]);

type FreePacketBody = {
  email?: unknown;
  targetType?: unknown;
  targetName?: unknown;
  jurisdiction?: unknown;
  sourceUrl?: unknown;
  summary?: unknown;
  consent?: unknown;
  sourceType?: unknown;
  checkRequest?: unknown;
  referrer?: unknown;
  landingPage?: unknown;
  utmSource?: unknown;
  utmMedium?: unknown;
  utmCampaign?: unknown;
  utmTerm?: unknown;
  utmContent?: unknown;
};

async function getOptionalUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

function targetLabel(targetType: string) {
  return targetType
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as FreePacketBody | null;
  const targetType = cleanText(body?.targetType, 80);
  const normalizedTargetType = targetTypes.has(targetType) ? targetType : "official";
  const email = cleanEmail(body?.email);
  const summary = cleanLongText(body?.summary, 5000);
  const publicSourceUrl = cleanUrl(body?.sourceUrl);
  const targetName =
    cleanText(body?.targetName, 500) || `${targetLabel(normalizedTargetType)} source packet`;
  const sourceType = cleanText(body?.sourceType, 120) || "official_record";
  const checkRequest =
    cleanLongText(body?.checkRequest, 5000) ||
    "Build a source packet, attach the receipt, and identify what still needs checking.";

  const normalized = normalizeSourceSubmission({
    submitterEmail: email,
    targetName,
    targetType: `free_packet_${normalizedTargetType}`,
    jurisdiction: cleanText(body?.jurisdiction, 500),
    sourceUrl: publicSourceUrl,
    sourceType,
    claimSummary: summary,
    checkRequest,
    publicFlag: true,
    referrer: body?.referrer,
    landingPage: body?.landingPage,
    utmSource: body?.utmSource,
    utmMedium: body?.utmMedium,
    utmCampaign: body?.utmCampaign,
    utmTerm: body?.utmTerm,
    utmContent: body?.utmContent,
    metadata: {
      intake: "free_packet_funnel",
      target_type: normalizedTargetType,
    },
  });

  const validationError = validateSourceSubmission(normalized);
  if (!email) {
    return NextResponse.json({ error: "Add a valid email address.", packet: buildSourcePacket(normalized) }, { status: 400 });
  }
  if (validationError) {
    return NextResponse.json({ error: validationError, packet: buildSourcePacket(normalized) }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        error: "The source queue is temporarily unavailable. Copy or download the packet and try again later.",
        packet: buildSourcePacket(normalized),
      },
      { status: 503 },
    );
  }

  const user = await getOptionalUser();
  let emailCaptured = false;

  if (body?.consent === true) {
    const { error: captureError } = await admin.from("email_captures").insert({
      user_id: user?.id ?? null,
      email,
      source: "free_packet",
      utm_source: normalized.utmSource || null,
      utm_medium: normalized.utmMedium || null,
      utm_campaign: normalized.utmCampaign || null,
      utm_term: normalized.utmTerm || null,
      utm_content: normalized.utmContent || null,
      referrer: normalized.referrer || null,
      landing_page: normalized.landingPage || null,
      consent: true,
      metadata: {
        target_type: normalizedTargetType,
      },
    });
    emailCaptured = !captureError;
    if (captureError) {
      console.warn(JSON.stringify({ level: "warn", msg: "free_packet_email_capture_skipped", error: captureError.message }));
    }
  }

  const { data: submission, error: insertError } = await admin
    .from("source_submissions")
    .insert({
      submitter_user_id: user?.id ?? null,
      submitter_name: null,
      submitter_email: email,
      target_name: normalized.targetName,
      target_type: normalized.targetType,
      target_profile_id: null,
      target_page_url: normalized.targetPageUrl || null,
      jurisdiction: normalized.jurisdiction || null,
      source_url: normalized.sourceUrl,
      source_type: normalized.sourceType,
      source_title: `${targetLabel(normalizedTargetType)} free packet source`,
      source_date: normalized.sourceDate,
      claim_summary: normalized.claimSummary,
      check_request: normalized.checkRequest,
      public_flag: true,
      status: "new",
      referrer: normalized.referrer || null,
      landing_page: normalized.landingPage || null,
      utm_source: normalized.utmSource || null,
      utm_medium: normalized.utmMedium || null,
      utm_campaign: normalized.utmCampaign || null,
      utm_term: normalized.utmTerm || null,
      utm_content: normalized.utmContent || null,
      metadata: normalized.metadata,
    })
    .select("id, status")
    .maybeSingle();

  if (insertError || !submission?.id) {
    return NextResponse.json(
      {
        error: insertError?.message ?? "The source queue did not return a submission ID.",
        packet: buildSourcePacket(normalized),
      },
      { status: 500 },
    );
  }

  const submissionId = String(submission.id);
  const packet = buildSourcePacket({ ...normalized, submissionId });
  const childInsertResults = await Promise.all([
    admin.from("source_submission_events").insert({
      submission_id: submissionId,
      event_type: "submitted",
      actor_user_id: user?.id ?? null,
      actor_role: user ? "authenticated_submitter" : "public_submitter",
      message: "Free source packet submitted for RepWatchr review.",
      metadata: {
        intake: "free_packet_funnel",
        target_type: normalizedTargetType,
      },
    }),
    admin.from("source_status_history").insert({
      submission_id: submissionId,
      old_status: null,
      new_status: "new",
      changed_by: user?.id ?? null,
      note: "Initial free source packet submission.",
    }),
    admin.from("source_submission_attachments").insert({
      submission_id: submissionId,
      attachment_type: "source_url",
      label: `${targetLabel(normalizedTargetType)} source link`,
      url: normalized.sourceUrl,
      metadata: {
        intake: "free_packet_funnel",
      },
    }),
  ]);
  const childInsertError = childInsertResults.find((result) => result.error)?.error;
  if (childInsertError) {
    console.warn(JSON.stringify({ level: "warn", msg: "free_packet_child_insert_skipped", error: childInsertError.message }));
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.repwatchr.com";
  return NextResponse.json({
    ok: true,
    submissionId,
    status: submission.status ?? "new",
    packet,
    emailCaptured,
    nextAction: "Create a free account so this source packet can stay connected to your dashboard.",
    shareUrl: `${siteUrl}/free-packet`,
  });
}
