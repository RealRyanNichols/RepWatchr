import { NextResponse } from "next/server";
import { buildSafeSubmissionSummary, isFormKey } from "@/lib/data-intake";
import { nextActionFor } from "@/lib/data-intake-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const admin = getSupabaseAdminClient();

  if (!admin) {
    return NextResponse.json({ ok: false, message: "Submission status needs Supabase service-role configuration." }, { status: 503 });
  }

  const { data, error } = await admin
    .from("form_submissions")
    .select("id, form_key, status, priority, payload, normalized_payload, source_route, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, message: "Submission not found." }, { status: 404 });

  const formKey = String(data.form_key);
  const payload = data.payload && typeof data.payload === "object" && !Array.isArray(data.payload)
    ? (data.payload as Record<string, unknown>)
    : {};

  return NextResponse.json({
    ok: true,
    submission: {
      id: data.id,
      formKey,
      status: data.status,
      priority: data.priority,
      sourceRoute: data.source_route,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      normalizedPayload: data.normalized_payload,
    },
    summary: isFormKey(formKey) ? buildSafeSubmissionSummary(formKey, payload, data.id) : "RepWatchr intake packet",
    nextAction: isFormKey(formKey) ? nextActionFor(formKey) : "Submit another source or create a free account.",
  });
}
