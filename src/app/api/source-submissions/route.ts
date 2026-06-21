import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  buildSourcePacket,
  normalizeSourceSubmission,
  validateSourceSubmission,
  type SourceSubmissionInput,
} from "@/lib/source-submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getOptionalUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

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

export async function GET(request: Request) {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ submissions: [] });
  }

  const url = new URL(request.url);
  const targetType = url.searchParams.get("targetType")?.trim() || "";
  const targetProfileId = url.searchParams.get("targetProfileId")?.trim() || "";
  const limit = Math.min(Number(url.searchParams.get("limit") || 6) || 6, 12);

  let query = admin
    .from("source_submissions")
    .select(
      "id, target_name, target_type, target_profile_id, target_page_url, jurisdiction, source_url, source_type, source_title, source_date, claim_summary, public_flag, status, created_at"
    )
    .eq("public_flag", true)
    .in("status", ["verified", "attached_to_profile"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (targetType) query = query.eq("target_type", targetType);
  if (targetProfileId) query = query.eq("target_profile_id", targetProfileId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Could not load reviewed source submissions." }, { status: 500 });
  }

  return NextResponse.json({ submissions: data ?? [] });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SourceSubmissionInput | null;
  const normalized = normalizeSourceSubmission(body ?? {});
  const validationError = validateSourceSubmission(normalized);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        error: "The source queue is temporarily unavailable. Keep the copied packet and try again later.",
        packet: buildSourcePacket(normalized),
      },
      { status: 503 }
    );
  }

  const user = await getOptionalUser();
  const submitterEmail = normalized.submitterEmail || user?.email || "";
  const { data: submission, error: insertError } = await admin
    .from("source_submissions")
    .insert({
      submitter_user_id: user?.id ?? null,
      submitter_name: normalized.submitterName || null,
      submitter_email: submitterEmail || null,
      target_name: normalized.targetName,
      target_type: normalized.targetType,
      target_profile_id: normalized.targetProfileId || null,
      target_page_url: normalized.targetPageUrl || null,
      jurisdiction: normalized.jurisdiction || null,
      source_url: normalized.sourceUrl,
      source_type: normalized.sourceType,
      source_title: normalized.sourceTitle || null,
      source_date: normalized.sourceDate,
      claim_summary: normalized.claimSummary,
      check_request: normalized.checkRequest,
      public_flag: normalized.publicFlag,
      status: "new",
      referrer: normalized.referrer || null,
      landing_page: normalized.landingPage || null,
      utm_source: normalized.utmSource || null,
      utm_medium: normalized.utmMedium || null,
      utm_campaign: normalized.utmCampaign || null,
      utm_term: normalized.utmTerm || null,
      utm_content: normalized.utmContent || null,
      metadata: {
        ...normalized.metadata,
        intake: normalized.metadata.intake ?? "source_submission_api",
      },
    })
    .select("id, status")
    .maybeSingle();

  if (insertError || !submission?.id) {
    return NextResponse.json(
      {
        error: insertError?.message ?? "The source queue did not return a submission ID.",
        packet: buildSourcePacket(normalized),
      },
      { status: 500 }
    );
  }

  const submissionId = submission.id as string;
  const packet = buildSourcePacket({ ...normalized, submitterEmail, submissionId });

  const childInsertResults = await Promise.all([
    admin.from("source_submission_events").insert({
      submission_id: submissionId,
      event_type: "submitted",
      actor_user_id: user?.id ?? null,
      actor_role: user ? "authenticated_submitter" : "public_submitter",
      message: "Source submitted for RepWatchr review.",
      metadata: {
        source_type: normalized.sourceType,
        target_type: normalized.targetType,
        public_flag: normalized.publicFlag,
      },
    }),
    admin.from("source_status_history").insert({
      submission_id: submissionId,
      old_status: null,
      new_status: "new",
      changed_by: user?.id ?? null,
      note: "Initial public source submission.",
    }),
    admin.from("source_submission_attachments").insert({
      submission_id: submissionId,
      attachment_type: "source_url",
      label: normalized.sourceTitle || normalized.sourceType,
      url: normalized.sourceUrl,
      metadata: {
        intake: normalized.metadata.intake ?? "source_submission_api",
      },
    }),
  ]);
  const childInsertError = childInsertResults.find((result) => result.error)?.error;

  if (childInsertError) {
    console.error("Source submission child record insert failed", {
      submissionId,
      error: childInsertError.message,
    });
  }

  return NextResponse.json({
    ok: true,
    submissionId,
    status: submission.status ?? "new",
    packet,
    nextAction:
      "Save the packet, then share the RepWatchr source form with anyone else who has a public record to add.",
    shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.repwatchr.com"}/submit-source`,
  });
}
