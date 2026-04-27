import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type IntakeTarget = {
  type?: string;
  id?: string;
  name?: string;
  districtSlug?: string;
  profileUrl?: string;
  question?: string;
};

type FarettaIntakeBody = {
  sourceSubmissionId?: string;
  title?: string;
  summary?: string;
  submitterName?: string;
  submitterEmail?: string;
  submitterPhone?: string;
  county?: string;
  priority?: "red" | "yellow" | "green";
  evidenceUrls?: string[];
  requestedAction?: string;
  targets?: IntakeTarget[];
  metadata?: Record<string, unknown>;
};

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function readSecret(request: Request) {
  const headerSecret = request.headers.get("x-faretta-secret")?.trim();
  const authorization = request.headers.get("authorization")?.trim();
  const bearer = authorization?.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : "";
  return headerSecret || bearer;
}

export async function POST(request: Request) {
  const expectedSecret = process.env.FARETTA_INTAKE_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { error: "Faretta intake is not configured. Set FARETTA_INTAKE_SECRET." },
      { status: 503 },
    );
  }

  if (readSecret(request) !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized intake request." }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin client is not configured." }, { status: 503 });
  }

  let body: FarettaIntakeBody;
  try {
    body = (await request.json()) as FarettaIntakeBody;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const title = cleanText(body.title, 240);
  const summary = cleanText(body.summary, 10000);

  if (!title || !summary) {
    return NextResponse.json({ error: "title and summary are required." }, { status: 400 });
  }

  const priority = body.priority && ["red", "yellow", "green"].includes(body.priority)
    ? body.priority
    : "yellow";

  const { data: newCase, error: caseError } = await supabase
    .from("accountability_cases")
    .insert({
      title,
      summary,
      source_site: "faretta_legal",
      source_submission_id: cleanText(body.sourceSubmissionId, 200) || null,
      intake_channel: "webhook",
      status: "intake_review",
      priority,
      visibility_status: "private_review",
      submitter_name: cleanText(body.submitterName, 160) || null,
      submitter_email: cleanText(body.submitterEmail, 240) || null,
      submitter_phone: cleanText(body.submitterPhone, 80) || null,
      county: cleanText(body.county, 120) || null,
      requested_action: cleanText(body.requestedAction, 500) || null,
      evidence_urls: Array.isArray(body.evidenceUrls) ? body.evidenceUrls.slice(0, 30) : [],
      metadata: body.metadata ?? {},
    })
    .select("id")
    .single();

  if (caseError || !newCase) {
    return NextResponse.json({ error: caseError?.message ?? "Could not create case." }, { status: 500 });
  }

  const targets = Array.isArray(body.targets) ? body.targets.slice(0, 12) : [];
  const caseEntities = targets
    .filter((target) => cleanText(target.name, 240))
    .map((target) => ({
      case_id: newCase.id,
      entity_type: cleanText(target.type, 80) || "other",
      entity_id: cleanText(target.id, 240) || null,
      entity_name: cleanText(target.name, 240),
      district_slug: cleanText(target.districtSlug, 180) || null,
      profile_url: cleanText(target.profileUrl, 500) || null,
      involvement: "subject_of_review",
    }));

  if (caseEntities.length > 0) {
    await supabase.from("accountability_case_entities").insert(caseEntities);
  }

  const questions = targets
    .filter((target) => cleanText(target.name, 240) && cleanText(target.question, 3000))
    .map((target) => ({
      case_id: newCase.id,
      target_type: cleanText(target.type, 80) || "other",
      target_id: cleanText(target.id, 240) || null,
      district_slug: cleanText(target.districtSlug, 180) || null,
      target_name: cleanText(target.name, 240),
      question: cleanText(target.question, 3000),
      status: "needs_review",
      visibility_status: "private_review",
      source_summary: summary.slice(0, 1200),
    }));

  if (questions.length > 0) {
    await supabase.from("profile_questions").insert(questions);
  }

  return NextResponse.json({
    ok: true,
    caseId: newCase.id,
    indexedTargets: caseEntities.length,
    preparedQuestions: questions.length,
  });
}
