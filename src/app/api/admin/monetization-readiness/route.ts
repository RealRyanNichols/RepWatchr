import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  getMonetizationReadinessReport,
  getMonetizationReadinessSummary,
  type ReadinessCheck,
  type ReadinessStatus,
} from "@/lib/monetization-readiness";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AdminClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

type TableCount = {
  table: string;
  status: "ok" | "error";
  count: number | null;
  error: string | null;
};

async function requireAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { ok: false as const, status: 503, error: "Supabase public environment variables are not configured." };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false as const, status: 401, error: "Login required." };
  }

  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin");

  if (rolesError || !roles?.length) {
    return { ok: false as const, status: 403, error: "Admin role required." };
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return { ok: false as const, status: 503, error: "SUPABASE_SERVICE_ROLE_KEY is not configured." };
  }

  return { ok: true as const, user, admin };
}

async function countTable(admin: AdminClient, table: string): Promise<TableCount> {
  const { count, error } = await admin.from(table).select("*", { count: "exact", head: true });

  if (error) {
    return { table, status: "error", count: null, error: error.message };
  }

  return { table, status: "ok", count: count ?? 0, error: null };
}

function statusFromScore(score: number): ReadinessStatus {
  if (score >= 85) return "ready";
  if (score >= 45) return "partial";
  return "blocked";
}

function applyTableHealth(checks: ReadinessCheck[], tableCounts: TableCount[]) {
  const tableMap = new Map(tableCounts.map((table) => [table.table, table]));

  return checks.map((check) => {
    if (!check.requiredTables.length) return check;

    const okTables = check.requiredTables.filter((table) => tableMap.get(table)?.status === "ok");
    const missingTables = check.requiredTables.filter((table) => tableMap.get(table)?.status !== "ok");
    const tableScore = Math.round((okTables.length / check.requiredTables.length) * 100);
    const score = Math.min(check.score, tableScore);

    if (!missingTables.length) {
      return { ...check, score, status: statusFromScore(score) };
    }

    return {
      ...check,
      score,
      status: statusFromScore(score),
      gaps: [...check.gaps, `Missing or unreachable Supabase tables: ${missingTables.join(", ")}`],
    };
  });
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const baseReport = getMonetizationReadinessReport();
  const requiredTables = Array.from(new Set(baseReport.checks.flatMap((check) => check.requiredTables))).sort();
  const tableCounts = await Promise.all(requiredTables.map((table) => countTable(auth.admin, table)));
  const checks = applyTableHealth(baseReport.checks, tableCounts);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    user: {
      id: auth.user.id,
      email: auth.user.email,
    },
    summary: getMonetizationReadinessSummary(checks),
    checks,
    tableCounts,
    publicLabels: baseReport.publicLabels,
    safetyRules: baseReport.safetyRules,
    manualActivationRequired: true,
    salesEnabled: false,
    nextPrompt:
      "Pick the top blocked readiness area from /admin/monetization-readiness and build only that missing prerequisite.",
  });
}
