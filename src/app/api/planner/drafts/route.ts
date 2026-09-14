import { insertDraft, type SocialDraftInput } from "@/lib/social-planner";

/**
 * Where the scheduled gathering session drops drafts.
 *
 * The Vercel runtime cannot reach Fieldy, Notion, or Drive, so the gathering
 * runs as a scheduled Claude session holding those connectors and posts its
 * drafts here. This endpoint trusts none of it: every draft is re-validated
 * against the voice and sourcing rules before it is stored, and nothing written
 * here is publishable until a human approves it in /admin/planner.
 */

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.PLANNER_INGEST_SECRET;
  if (!secret) {
    return Response.json(
      { ok: false, error: "PLANNER_INGEST_SECRET is not configured on this deployment." },
      { status: 503 },
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Body must be JSON." }, { status: 400 });
  }

  const drafts = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { drafts?: unknown })?.drafts)
      ? (payload as { drafts: unknown[] }).drafts
      : [payload];

  if (drafts.length === 0) {
    return Response.json({ ok: false, error: "No drafts supplied." }, { status: 400 });
  }
  if (drafts.length > 25) {
    return Response.json({ ok: false, error: "At most 25 drafts per request." }, { status: 400 });
  }

  const accepted: string[] = [];
  const rejected: Array<{ index: number; problems: string[] }> = [];

  for (const [index, candidate] of drafts.entries()) {
    const result = await insertDraft(candidate as SocialDraftInput);
    if (result.ok) accepted.push(result.draft.id);
    else rejected.push({ index, problems: result.problems });
  }

  // A partially rejected batch is still a success for what got through; the
  // caller needs to see exactly which drafts failed which rule so the next run
  // writes them correctly rather than silently dropping them.
  return Response.json(
    {
      ok: rejected.length === 0,
      accepted: accepted.length,
      rejected: rejected.length,
      draftIds: accepted,
      problems: rejected,
      reviewAt: "/admin/planner",
    },
    { status: accepted.length > 0 ? 200 : 400 },
  );
}
