import { NextResponse } from "next/server";
import { requireAdminClient } from "@/lib/admin-auth";
import { FORM_KEYS, FORM_STATUSES } from "@/lib/data-intake";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAdminClient();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const formKey = url.searchParams.get("formKey");
  const status = url.searchParams.get("status");
  const priority = url.searchParams.get("priority");
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));

  let query = auth.admin
    .from("form_submissions")
    .select("id, form_key, email, name, normalized_payload, status, priority, source_route, referrer, utm, admin_notes, assigned_to, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (formKey && (FORM_KEYS as readonly string[]).includes(formKey)) query = query.eq("form_key", formKey);
  if (status && (FORM_STATUSES as readonly string[]).includes(status)) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);

  const [{ data, error }, { data: definitions }, { data: statusCounts }] = await Promise.all([
    query,
    auth.admin.from("form_definitions").select("key, name, description, status").order("key", { ascending: true }),
    auth.admin.from("form_submissions").select("status, form_key, priority"),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    user: { id: auth.user.id, email: auth.user.email },
    submissions: data ?? [],
    definitions: definitions ?? [],
    counts: buildCounts(statusCounts ?? []),
  });
}

function buildCounts(rows: Array<{ status?: string | null; form_key?: string | null; priority?: string | null }>) {
  return rows.reduce(
    (acc, row) => {
      const status = row.status || "unknown";
      const formKey = row.form_key || "unknown";
      const priority = row.priority || "normal";
      acc.byStatus[status] = (acc.byStatus[status] ?? 0) + 1;
      acc.byFormKey[formKey] = (acc.byFormKey[formKey] ?? 0) + 1;
      acc.byPriority[priority] = (acc.byPriority[priority] ?? 0) + 1;
      acc.total += 1;
      return acc;
    },
    { total: 0, byStatus: {} as Record<string, number>, byFormKey: {} as Record<string, number>, byPriority: {} as Record<string, number> },
  );
}
