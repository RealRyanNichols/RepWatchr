import { NextResponse } from "next/server";
import { getOfficialCompletionDashboard } from "@/lib/profile-completion";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { error: NextResponse.json({ error: "Supabase public environment variables are not configured." }, { status: 503 }) };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: NextResponse.json({ error: "Login required." }, { status: 401 }) };
  }

  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin");

  if (rolesError || !roles?.length) {
    return { error: NextResponse.json({ error: "Admin role required." }, { status: 403 }) };
  }

  return { user };
}

async function getLatestRun() {
  const admin = getSupabaseAdminClient();
  if (!admin) return { configured: false, latestRun: null, error: "SUPABASE_SERVICE_ROLE_KEY is not configured." };

  const { data, error } = await admin
    .from("profile_update_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { configured: true, latestRun: null, error: error.message };
  return { configured: true, latestRun: data, error: null };
}

async function getReviewCounts() {
  const admin = getSupabaseAdminClient();
  if (!admin) return [];

  const tables = [
    { table: "profile_enrichment_items", statusColumn: "status" },
    { table: "profile_vote_snapshots", statusColumn: "rule_review_status" },
    { table: "vote_issue_rules", statusColumn: "review_status" },
  ];

  const counts = await Promise.all(
    tables.map(async ({ table, statusColumn }) => {
      const { data, error } = await admin.from(table).select(statusColumn);
      if (error) return { table, error: error.message, counts: {} };
      const grouped = (data ?? []).reduce<Record<string, number>>((acc, row) => {
        const status = String(((row as unknown) as Record<string, unknown>)[statusColumn] ?? "unknown");
        acc[status] = (acc[status] ?? 0) + 1;
        return acc;
      }, {});
      return { table, error: null, counts: grouped };
    }),
  );

  return counts;
}

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const [dashboard, latestRun, reviewCounts] = await Promise.all([
    Promise.resolve(getOfficialCompletionDashboard()),
    getLatestRun(),
    getReviewCounts(),
  ]);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    dashboard,
    latestRun,
    reviewCounts,
  });
}
