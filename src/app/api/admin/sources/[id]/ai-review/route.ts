import { NextResponse } from "next/server";
import { writeAdminAuditLog } from "@/lib/admin-audit";
import { requireAdminClient } from "@/lib/admin-auth";
import { analyzeSourceSubmissionWithAi, getAiSourceReviewConfig } from "@/lib/ai-source-review";
import { serverTrackEvent } from "@/lib/analytics-server";
import { createSourceSubmissionEvent } from "@/lib/source-submissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function tableMissing(message: string | null | undefined) {
  return Boolean(message && /ai_review_runs|ai_review_feedback|does not exist|schema cache|42P01/i.test(message));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminClient();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const config = await getAiSourceReviewConfig();
  const { data: runs, error } = await auth.admin
    .from("ai_review_runs")
    .select("id, provider, model, output_summary, safety_flags, recommendation, status, created_at")
    .eq("source_submission_id", id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error && tableMissing(error.message)) {
    return NextResponse.json({
      ok: true,
      config,
      schemaReady: false,
      aiReviewRuns: [],
      message: "Apply supabase-ai-source-review.sql before storing AI review runs.",
    });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, config, schemaReady: true, aiReviewRuns: runs ?? [] });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminClient();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const { data: submission, error: loadError } = await auth.admin
    .from("source_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (loadError) return NextResponse.json({ error: loadError.message }, { status: 500 });
  if (!submission) return NextResponse.json({ error: "Source submission not found." }, { status: 404 });

  await serverTrackEvent({
    eventName: "ai_source_review_started",
    userId: auth.user.id,
    route: "/admin/sources",
    metadata: { source_submission_id: id },
  });

  const result = await analyzeSourceSubmissionWithAi(submission as Record<string, unknown>);
  if (!result.ok) {
    if (result.disabled) {
      return NextResponse.json({
        ok: false,
        disabled: true,
        message: "AI review is disabled. Enable ENABLE_AI_SOURCE_REVIEW and configure provider to use this tool.",
        reason: result.reason,
        config: { provider: result.provider ?? null, model: result.model ?? null },
      }, { status: 409 });
    }

    const { data: failedRun, error: insertError } = await auth.admin
      .from("ai_review_runs")
      .insert({
        source_submission_id: id,
        actor_user_id: auth.user.id,
        provider: result.provider ?? null,
        model: result.model ?? null,
        input_summary: result.inputSummary ?? {},
        output_summary: { error: result.reason },
        safety_flags: [],
        recommendation: "needs_human_review",
        status: "failed",
      })
      .select("id")
      .single();

    if (insertError && tableMissing(insertError.message)) {
      return NextResponse.json({ error: "Apply supabase-ai-source-review.sql before running the AI review assistant." }, { status: 500 });
    }

    await Promise.all([
      createSourceSubmissionEvent(auth.admin, id, "ai_source_review_failed", auth.user.id, String(submission.status ?? ""), String(submission.status ?? ""), {
        ai_review_run_id: failedRun?.id ?? null,
        error: result.reason,
      }),
      writeAdminAuditLog({
        admin: auth.admin,
        actorUserId: auth.user.id,
        action: "ai_source_review_failed",
        entityType: "source_submission",
        entityId: id,
        beforeValue: { id, status: submission.status ?? null },
        afterValue: { ai_review_run_id: failedRun?.id ?? null, status: "failed" },
        metadata: { error: result.reason },
      }),
      serverTrackEvent({
        eventName: "ai_source_review_failed",
        userId: auth.user.id,
        route: "/admin/sources",
        metadata: { source_submission_id: id, error: result.reason },
      }),
    ]);

    return NextResponse.json({ ok: false, error: result.reason }, { status: result.status ?? 502 });
  }

  const { data: run, error: insertError } = await auth.admin
    .from("ai_review_runs")
    .insert({
      source_submission_id: id,
      actor_user_id: auth.user.id,
      provider: result.provider,
      model: result.model,
      input_summary: result.inputSummary,
      output_summary: result.outputSummary,
      safety_flags: result.outputSummary.safety_flags,
      recommendation: result.outputSummary.recommended_admin_action,
      status: "completed",
    })
    .select("id, provider, model, output_summary, safety_flags, recommendation, status, created_at")
    .single();

  if (insertError && tableMissing(insertError.message)) {
    return NextResponse.json({ error: "Apply supabase-ai-source-review.sql before running the AI review assistant." }, { status: 500 });
  }
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  await Promise.all([
    createSourceSubmissionEvent(auth.admin, id, "ai_source_review_completed", auth.user.id, String(submission.status ?? ""), String(submission.status ?? ""), {
      ai_review_run_id: run?.id ?? null,
      recommendation: result.outputSummary.recommended_admin_action,
      safety_flags: result.outputSummary.safety_flags,
    }),
    writeAdminAuditLog({
      admin: auth.admin,
      actorUserId: auth.user.id,
      action: "ai_source_review_completed",
      entityType: "source_submission",
      entityId: id,
      beforeValue: { id, status: submission.status ?? null },
      afterValue: { ai_review_run_id: run?.id ?? null, recommendation: result.outputSummary.recommended_admin_action },
      metadata: { safety_flags: result.outputSummary.safety_flags },
    }),
    serverTrackEvent({
      eventName: "ai_source_review_completed",
      userId: auth.user.id,
      route: "/admin/sources",
      metadata: {
        source_submission_id: id,
        ai_review_run_id: run?.id ?? null,
        recommendation: result.outputSummary.recommended_admin_action,
        safety_flags: result.outputSummary.safety_flags.join(","),
      },
    }),
    result.outputSummary.safety_flags.length
      ? serverTrackEvent({
          eventName: "ai_safety_flag_triggered",
          userId: auth.user.id,
          route: "/admin/sources",
          metadata: {
            source_submission_id: id,
            ai_review_run_id: run?.id ?? null,
            safety_flags: result.outputSummary.safety_flags.join(","),
          },
        })
      : Promise.resolve({ ok: true }),
  ]);

  return NextResponse.json({ ok: true, aiReviewRun: run, output: result.outputSummary });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminClient();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    aiReviewRunId?: unknown;
    action?: unknown;
    feedback?: unknown;
    rating?: unknown;
  } | null;
  const aiReviewRunId = typeof body?.aiReviewRunId === "string" ? body.aiReviewRunId : "";
  const action = typeof body?.action === "string" ? body.action : "";
  const eventName = action === "accept" ? "ai_suggestion_accepted" : "ai_suggestion_rejected";
  const rating = action === "accept" ? "accepted" : "rejected";
  const feedback = typeof body?.feedback === "string" && body.feedback.trim()
    ? body.feedback.trim().slice(0, 3000)
    : action === "accept"
      ? "Admin accepted AI suggestion as a draft only."
      : "Admin rejected or ignored AI suggestion.";

  if (!aiReviewRunId) return NextResponse.json({ error: "AI review run ID is required." }, { status: 400 });
  if (!["accept", "reject", "ignore"].includes(action)) return NextResponse.json({ error: "Unsupported AI suggestion action." }, { status: 400 });

  const { data: run, error: runError } = await auth.admin
    .from("ai_review_runs")
    .select("id, source_submission_id, output_summary, recommendation, status")
    .eq("id", aiReviewRunId)
    .eq("source_submission_id", id)
    .maybeSingle();

  if (runError && tableMissing(runError.message)) {
    return NextResponse.json({ error: "Apply supabase-ai-source-review.sql before recording AI review feedback." }, { status: 500 });
  }
  if (runError) return NextResponse.json({ error: runError.message }, { status: 500 });
  if (!run) return NextResponse.json({ error: "AI review run not found for this submission." }, { status: 404 });

  const { error: feedbackError } = await auth.admin.from("ai_review_feedback").insert({
    ai_review_run_id: aiReviewRunId,
    actor_user_id: auth.user.id,
    feedback,
    rating,
  });

  if (feedbackError && tableMissing(feedbackError.message)) {
    return NextResponse.json({ error: "Apply supabase-ai-source-review.sql before recording AI review feedback." }, { status: 500 });
  }
  if (feedbackError) return NextResponse.json({ error: feedbackError.message }, { status: 500 });

  await Promise.all([
    createSourceSubmissionEvent(auth.admin, id, eventName, auth.user.id, null, null, {
      ai_review_run_id: aiReviewRunId,
      rating,
      feedback,
    }),
    writeAdminAuditLog({
      admin: auth.admin,
      actorUserId: auth.user.id,
      action: eventName,
      entityType: "source_submission",
      entityId: id,
      beforeValue: { ai_review_run_id: aiReviewRunId },
      afterValue: { ai_review_run_id: aiReviewRunId, rating },
      metadata: { feedback },
    }),
    serverTrackEvent({
      eventName,
      userId: auth.user.id,
      route: "/admin/sources",
      metadata: { source_submission_id: id, ai_review_run_id: aiReviewRunId, rating },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
