import { NextResponse } from "next/server";
import { requireAdminClient } from "@/lib/admin-auth";
import { CORRECTION_STATUSES } from "@/lib/trust-safety";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAdminClient();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const correctionType = url.searchParams.get("type");
  const priority = url.searchParams.get("priority");
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));

  let query = auth.admin
    .from("correction_requests")
    .select("id, submitter_email, entity_type, entity_id, url, correction_type, requested_correction, source_url, status, priority, assigned_to, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status && (CORRECTION_STATUSES as readonly string[]).includes(status)) query = query.eq("status", status);
  if (correctionType) query = query.eq("correction_type", correctionType);
  if (priority) query = query.eq("priority", priority);

  const [{ data, error }, { data: countRows }] = await Promise.all([
    query,
    auth.admin.from("correction_requests").select("status, correction_type, priority"),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    corrections: data ?? [],
    counts: buildCounts(countRows ?? []),
  });
}

function buildCounts(rows: Array<{ status?: string | null; correction_type?: string | null; priority?: string | null }>) {
  return rows.reduce(
    (acc, row) => {
      const status = row.status || "unknown";
      const type = row.correction_type || "unknown";
      const priority = row.priority || "normal";
      acc.byStatus[status] = (acc.byStatus[status] ?? 0) + 1;
      acc.byType[type] = (acc.byType[type] ?? 0) + 1;
      acc.byPriority[priority] = (acc.byPriority[priority] ?? 0) + 1;
      acc.total += 1;
      return acc;
    },
    { total: 0, byStatus: {} as Record<string, number>, byType: {} as Record<string, number>, byPriority: {} as Record<string, number> },
  );
}
