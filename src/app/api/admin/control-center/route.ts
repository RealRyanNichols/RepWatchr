import { NextResponse } from "next/server";
import { getRepWatchrDataStats } from "@/lib/data";
import { getSchoolBoardStats } from "@/lib/school-board-research";
import { getAttorneyWatchProfiles, getMediaWatchProfiles, getPowerWatchStats, getPublicSafetyWatchProfiles } from "@/lib/power-watch";
import { getNationalBuildoutSummary, adminOnlyWatchItems } from "@/data/national-buildout";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getOfficialCompletionDashboard } from "@/lib/profile-completion";

export const dynamic = "force-dynamic";

const countTables = [
  "profiles",
  "citizen_votes",
  "citizen_grades",
  "comments",
  "reports",
  "profile_claims",
  "claimed_profile_content",
  "profile_media",
  "profile_scorecard_votes",
  "faretta_interactions",
  "gideon_interactions",
  "member_tracked_items",
  "site_page_views",
  "profile_social_accounts",
  "public_statement_snapshots",
  "social_monitoring_jobs",
  "profile_update_runs",
  "profile_completion_snapshots",
  "profile_enrichment_items",
  "profile_vote_snapshots",
  "vote_issue_rules",
];

async function countTable(table: string) {
  const admin = getSupabaseAdminClient();

  if (!admin) {
    return { table, status: "missing-service-role" as const, count: null, error: "SUPABASE_SERVICE_ROLE_KEY is not configured." };
  }

  const { count, error } = await admin.from(table).select("*", { count: "exact", head: true });

  if (error) {
    return { table, status: "error" as const, count: null, error: error.message };
  }

  return { table, status: "ok" as const, count: count ?? 0, error: null };
}

async function getLatestProfileUpdateRun() {
  const admin = getSupabaseAdminClient();

  if (!admin) {
    return { status: "missing-service-role" as const, data: null, error: "SUPABASE_SERVICE_ROLE_KEY is not configured." };
  }

  const { data, error } = await admin
    .from("profile_update_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { status: "error" as const, data: null, error: error.message };
  return { status: "ok" as const, data, error: null };
}

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: "Supabase public environment variables are not configured." },
      { status: 503 },
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin");

  if (rolesError || !roles?.length) {
    return NextResponse.json({ error: "Admin role required." }, { status: 403 });
  }

  const dataStats = getRepWatchrDataStats();
  const schoolStats = getSchoolBoardStats();
  const attorneyStats = getPowerWatchStats(getAttorneyWatchProfiles());
  const mediaStats = getPowerWatchStats(getMediaWatchProfiles());
  const publicSafetyStats = getPowerWatchStats(getPublicSafetyWatchProfiles());
  const nationalSummary = getNationalBuildoutSummary();
  const officialCompletion = getOfficialCompletionDashboard();
  const [tableCounts, latestProfileUpdateRun] = await Promise.all([
    Promise.all(countTables.map(countTable)),
    getLatestProfileUpdateRun(),
  ]);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
    },
    coverage: {
      officials: dataStats,
      schoolBoards: schoolStats,
      attorneys: attorneyStats,
      media: mediaStats,
      publicSafety: publicSafetyStats,
      national: nationalSummary,
    },
    profileCompletion: officialCompletion,
    latestProfileUpdateRun,
    connections: [
      {
        label: "Supabase browser client",
        status: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "connected" : "missing",
        detail: "Public auth/data client for signed-in dashboard features.",
      },
      {
        label: "Supabase service role",
        status: process.env.SUPABASE_SERVICE_ROLE_KEY ? "connected" : "missing",
        detail: "Required for admin aggregate counts, Stripe service flows, and controlled backend maintenance.",
      },
      {
        label: "Vercel Analytics",
        status: "mounted",
        detail: "The Analytics component is mounted in the root layout. Detailed pageview charts live in Vercel Analytics.",
      },
      {
        label: "Google Analytics",
        status: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ? "connected" : "optional-missing",
        detail: "Loads only when NEXT_PUBLIC_GA_MEASUREMENT_ID is configured.",
      },
      {
        label: "X API / public statement scanner",
        status:
          process.env.X_API_BEARER_TOKEN || process.env.X_BEARER_TOKEN || process.env.X_API_KEY
            ? "credential-present"
            : "credential-gated",
        detail: "Real-time X scanning requires credentials, rate-limit handling, and the social monitoring schema.",
      },
    ],
    tableCounts,
    adminOnlyWatchItems,
  });
}
