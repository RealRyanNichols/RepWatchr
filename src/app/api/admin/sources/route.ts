import { NextResponse } from "next/server";
import { requireAdminClient } from "@/lib/admin-auth";
import { SOURCE_STATUSES, SOURCE_TYPES, SOURCE_TARGET_TYPES } from "@/lib/source-submission-options";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAdminClient();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const sourceType = url.searchParams.get("sourceType");
  const targetType = url.searchParams.get("targetType");
  const priority = url.searchParams.get("priority");
  const state = url.searchParams.get("state");
  const county = url.searchParams.get("county");
  const city = url.searchParams.get("city");
  const q = url.searchParams.get("q");
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));

  let query = auth.admin
    .from("source_submissions")
    .select("id, submitter_email, target_type, target_id, target_name, jurisdiction, state, county, city, source_url, source_title, source_publisher, source_date, source_type, claim_summary, requested_action, confidence, status, priority, assigned_reviewer, duplicate_of, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status && (SOURCE_STATUSES as readonly string[]).includes(status)) query = query.eq("status", status);
  if (sourceType && (SOURCE_TYPES as readonly string[]).includes(sourceType)) query = query.eq("source_type", sourceType);
  if (targetType && (SOURCE_TARGET_TYPES as readonly string[]).includes(targetType)) query = query.eq("target_type", targetType);
  if (priority) query = query.eq("priority", priority);
  if (state) query = query.ilike("state", state.slice(0, 80));
  if (county) query = query.ilike("county", `%${county.slice(0, 120)}%`);
  if (city) query = query.ilike("city", `%${city.slice(0, 120)}%`);
  if (q) {
    const safe = q.slice(0, 180);
    query = query.or(`source_url.ilike.%${safe}%,submitter_email.ilike.%${safe}%,target_name.ilike.%${safe}%`);
  }

  const [{ data, error }, { data: countRows }] = await Promise.all([
    query,
    auth.admin.from("source_submissions").select("status, source_type, target_type, priority"),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    user: { id: auth.user.id, email: auth.user.email },
    submissions: data ?? [],
    counts: buildCounts(countRows ?? []),
    options: {
      statuses: SOURCE_STATUSES,
      sourceTypes: SOURCE_TYPES,
      targetTypes: SOURCE_TARGET_TYPES,
      priorities: ["low", "normal", "high", "urgent"],
    },
  });
}

function buildCounts(rows: Array<{ status?: string | null; source_type?: string | null; target_type?: string | null; priority?: string | null }>) {
  return rows.reduce(
    (acc, row) => {
      const status = row.status || "unknown";
      const sourceType = row.source_type || "unknown";
      const targetType = row.target_type || "unknown";
      const priority = row.priority || "normal";
      acc.byStatus[status] = (acc.byStatus[status] ?? 0) + 1;
      acc.bySourceType[sourceType] = (acc.bySourceType[sourceType] ?? 0) + 1;
      acc.byTargetType[targetType] = (acc.byTargetType[targetType] ?? 0) + 1;
      acc.byPriority[priority] = (acc.byPriority[priority] ?? 0) + 1;
      acc.total += 1;
      return acc;
    },
    {
      total: 0,
      byStatus: {} as Record<string, number>,
      bySourceType: {} as Record<string, number>,
      byTargetType: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
    },
  );
}
