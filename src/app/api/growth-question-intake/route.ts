import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const allowedTargetTypes = new Set([
  "Official",
  "Race",
  "School board",
  "Vote",
  "Funding",
  "Red flag",
  "Story lead",
  "Prediction",
  "Data request",
]);

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanOptionalUrl(value: string) {
  if (!value) return "";

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString().slice(0, 700) : "";
  } catch {
    return "";
  }
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function readUtm(request: Request) {
  const url = new URL(request.url);
  return Object.fromEntries(
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]
      .map((key) => [key, url.searchParams.get(key)])
      .filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, message: "Send a valid question packet." }, { status: 400 });
  }

  const submissionId = `gqi_${crypto.randomUUID().slice(0, 8)}`;
  const submitterName = cleanText(body.name, 120);
  const submitterEmail = cleanText(body.email, 180).toLowerCase();
  const targetType = cleanText(body.targetType, 80);
  const targetName = cleanText(body.targetName, 220);
  const geography = cleanText(body.geography, 180);
  const sourceUrl = cleanOptionalUrl(cleanText(body.sourceUrl, 700));
  const questionSummary = cleanText(body.questionSummary, 2500);
  const predictionPrompt = cleanText(body.predictionPrompt, 1200);
  const storyAngle = cleanText(body.storyAngle, 1200);
  const publicUseConsent = body.publicUseConsent === true;
  const commercialUseConsent = body.commercialUseConsent === true;

  if (
    !isValidEmail(submitterEmail) ||
    !allowedTargetTypes.has(targetType) ||
    targetName.length < 2 ||
    questionSummary.length < 20 ||
    !publicUseConsent
  ) {
    return NextResponse.json(
      {
        ok: false,
        message: "Add a valid email, target, public question, target type, and acknowledgment.",
      },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdminClient();

  if (!admin) {
    return NextResponse.json({
      ok: true,
      stored: false,
      submissionId,
      message: "Question packet created. Keep a copy for review or follow-up.",
    });
  }

  const { error } = await admin.from("growth_question_intake").insert({
    submission_id: submissionId,
    submitter_name: submitterName || null,
    submitter_email: submitterEmail,
    target_type: targetType,
    target_name: targetName,
    geography: geography || null,
    public_source_url: sourceUrl || null,
    question_summary: questionSummary,
    prediction_prompt: predictionPrompt || null,
    story_angle: storyAngle || null,
    public_use_consent: publicUseConsent,
    commercial_use_consent: commercialUseConsent,
    status: sourceUrl ? "new" : "needs_source",
    referrer: request.headers.get("referer"),
    user_agent: request.headers.get("user-agent"),
    utm: readUtm(request),
  });

  if (error) {
    return NextResponse.json({
      ok: true,
      stored: false,
      submissionId,
      message: "Question packet created. Keep a copy for review or follow-up.",
    });
  }

  return NextResponse.json({
    ok: true,
    stored: true,
    submissionId,
    message: sourceUrl
      ? "Question received. RepWatchr can route it to source review, prediction review, or story review."
      : "Question received. Add a public source next so RepWatchr can verify it faster.",
  });
}
