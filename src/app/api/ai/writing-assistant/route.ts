import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  normalizeAIWritingInput,
  runSafeAIWritingAssistant,
  validateAIWritingInput,
  type AIWritingInput,
} from "@/lib/safe-ai-writing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getOptionalUserId() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

async function recordWritingRun(input: {
  userId: string | null;
  normalized: ReturnType<typeof normalizeAIWritingInput>;
  result: Awaited<ReturnType<typeof runSafeAIWritingAssistant>>;
}) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("ai_writing_runs")
    .insert({
      anonymous_id: input.normalized.anonymousId || null,
      user_id: input.userId,
      actor_role: input.normalized.actorRole || null,
      use_case: input.normalized.useCase,
      input_payload: {
        style: input.normalized.style,
        target: input.normalized.target,
        topic: input.normalized.topic,
        source_url_present: Boolean(input.normalized.sourceUrl),
        source_status: input.normalized.sourceStatus,
        prompt_length: input.normalized.prompt.length,
        context_length: input.normalized.contextText.length,
        existing_text_length: input.normalized.existingText.length,
        metadata: input.normalized.metadata,
      },
      output_payload: {
        provider: input.result.provider,
        model: input.result.model,
        status: input.result.status,
        label: input.result.output.label,
        source_needed: input.result.output.source_needed,
        safe_text: input.result.output.safe_text,
        what_this_does_not_claim: input.result.output.what_this_does_not_claim,
        suggested_next_action: input.result.output.suggested_next_action,
        disabled_reason: input.result.disabledReason || null,
      },
      safety_flags: input.result.output.safety_flags,
      status: input.result.status,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.warn(JSON.stringify({ level: "warn", msg: "ai_writing_run_record_skipped", error: error.message }));
  }
  return data?.id ? String(data.id) : null;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as AIWritingInput | null;
  const normalized = normalizeAIWritingInput(body ?? {});
  const validationError = validateAIWritingInput(normalized);

  if (validationError) {
    return NextResponse.json({ ok: false, error: validationError }, { status: 400 });
  }

  const userId = await getOptionalUserId();
  const result = await runSafeAIWritingAssistant(normalized);
  const runId = await recordWritingRun({ userId, normalized, result });

  return NextResponse.json({
    ok: true,
    runId,
    enabled: result.enabled,
    provider: result.provider,
    model: result.model,
    status: result.status,
    disabledReason: result.disabledReason ?? null,
    output: result.output,
    humanReviewRequired: true,
    autoPublish: false,
  });
}
