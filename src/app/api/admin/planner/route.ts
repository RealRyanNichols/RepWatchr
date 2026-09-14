import { NextResponse } from "next/server";
import { getAdminUserForServer } from "@/lib/admin-auth";
import { listDrafts, reviewDraft } from "@/lib/social-planner";

/**
 * Admin actions on the social planner.
 *
 * Approval is the only thing standing between a drafted post and Ryan's
 * audience, so the reviewer is taken from the authenticated admin session and
 * never from the request body. A caller cannot approve as someone else.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await getAdminUserForServer();
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const status = new URL(request.url).searchParams.get("status");
  const result = await listDrafts(
    status === "approved" || status === "rejected" || status === "in_review" ? { status } : {},
  );

  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export async function POST(request: Request) {
  let admin;
  try {
    admin = await getAdminUserForServer();
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let payload: { id?: string; decision?: string; body?: string; reviewNote?: string; scheduledFor?: string | null };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body must be JSON." }, { status: 400 });
  }

  if (!payload.id) return NextResponse.json({ ok: false, error: "id is required." }, { status: 400 });
  if (payload.decision !== "approved" && payload.decision !== "rejected") {
    return NextResponse.json({ ok: false, error: "decision must be approved or rejected." }, { status: 400 });
  }

  const result = await reviewDraft({
    id: payload.id,
    decision: payload.decision,
    // The reviewer is the signed-in admin, not a field the client can set.
    reviewedBy: admin.email ?? admin.id,
    reviewNote: payload.reviewNote ?? null,
    body: typeof payload.body === "string" ? payload.body : undefined,
    scheduledFor: payload.scheduledFor,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
