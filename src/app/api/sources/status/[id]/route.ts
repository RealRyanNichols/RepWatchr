import { NextResponse } from "next/server";
import { buildSourcePacket } from "@/lib/source-submissions";
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
    return NextResponse.json({ ok: false, message: "Source status needs Supabase service-role configuration." }, { status: 503 });
  }

  const { data, error } = await admin
    .from("source_submissions")
    .select("id, target_type, target_name, jurisdiction, source_url, source_title, source_publisher, source_type, source_date, claim_summary, why_it_matters, requested_action, status, confidence, priority, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, message: "Source submission not found." }, { status: 404 });

  const packetPayload = {
    sourceUrl: data.source_url,
    sourceType: data.source_type,
    sourceTitle: data.source_title ?? "",
    sourcePublisher: data.source_publisher ?? "",
    sourceDate: data.source_date ?? "",
    targetType: data.target_type,
    targetName: data.target_name ?? "",
    jurisdiction: data.jurisdiction ?? "",
    claimSummary: data.claim_summary ?? "",
    whyItMatters: data.why_it_matters ?? "",
    requestedAction: data.requested_action ?? "request review",
  };

  return NextResponse.json({
    ok: true,
    submission: {
      id: data.id,
      status: data.status,
      confidence: data.confidence,
      priority: data.priority,
      label: "Submitted Source - Under Review",
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
    summary: buildSourcePacket(packetPayload, data.id),
    nextAction: "Watch this target, submit another source, or create an account to track review.",
  });
}
