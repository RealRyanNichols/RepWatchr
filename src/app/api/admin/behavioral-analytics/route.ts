import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AdminClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

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

async function loadRows<T>(
  label: string,
  query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
) {
  const { data, error } = await query;
  return {
    label,
    rows: (data ?? []) as T[],
    error: error?.message ?? null,
  };
}

async function loadSingle<T>(
  label: string,
  query: PromiseLike<{ data: T | null; error: { message: string } | null }>,
) {
  const { data, error } = await query;
  return {
    label,
    row: data as T | null,
    error: error?.message ?? null,
  };
}

function listQuery(admin: AdminClient, listType: string, limit = 12) {
  return admin
    .from("behavioral_top_lists")
    .select("list_type, item_key, item_label, metric_count, unique_visitors, engagement_score, last_event_at")
    .eq("list_type", listType)
    .order("metric_count", { ascending: false })
    .order("engagement_score", { ascending: false })
    .limit(limit);
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { admin, user } = auth;

  const [
    kpis,
    pageScores,
    heatmap,
    funnels,
    cohorts,
    topPages,
    topOfficials,
    topStories,
    topContributors,
    topCounties,
    topSearches,
    topExits,
  ] = await Promise.all([
    loadSingle(
      "behavioral_kpi_summary",
      admin.from("behavioral_kpi_summary").select("*").eq("period", "last_30_days").maybeSingle(),
    ),
    loadRows(
      "behavioral_page_engagement_scores",
      admin
        .from("behavioral_page_engagement_scores")
        .select("*")
        .order("engagement_score", { ascending: false })
        .order("page_views", { ascending: false })
        .limit(25),
    ),
    loadRows(
      "behavioral_heatmap_summary",
      admin
        .from("behavioral_heatmap_summary")
        .select("*")
        .order("click_count", { ascending: false })
        .limit(80),
    ),
    loadRows(
      "behavioral_funnel_summary",
      admin
        .from("behavioral_funnel_summary")
        .select("*")
        .order("funnel_name", { ascending: true })
        .order("step_order", { ascending: true }),
    ),
    loadRows(
      "behavioral_retention_cohorts",
      admin
        .from("behavioral_retention_cohorts")
        .select("*")
        .order("cohort_week", { ascending: false })
        .limit(12),
    ),
    loadRows("top_pages", listQuery(admin, "pages")),
    loadRows("top_officials", listQuery(admin, "officials")),
    loadRows("top_stories", listQuery(admin, "stories")),
    loadRows("top_contributors", listQuery(admin, "contributors")),
    loadRows("top_counties", listQuery(admin, "counties")),
    loadRows("top_searches", listQuery(admin, "searches")),
    loadRows("top_exits", listQuery(admin, "exits")),
  ]);

  const errors = [
    kpis.error,
    pageScores.error,
    heatmap.error,
    funnels.error,
    cohorts.error,
    topPages.error,
    topOfficials.error,
    topStories.error,
    topContributors.error,
    topCounties.error,
    topSearches.error,
    topExits.error,
  ].filter(Boolean);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
    },
    kpis: kpis.row,
    pageScores: pageScores.rows,
    heatmap: heatmap.rows,
    funnels: funnels.rows,
    cohorts: cohorts.rows,
    topLists: {
      pages: topPages.rows,
      officials: topOfficials.rows,
      stories: topStories.rows,
      contributors: topContributors.rows,
      counties: topCounties.rows,
      searches: topSearches.rows,
      exits: topExits.rows,
    },
    migrationReady: errors.length === 0,
    errors,
  });
}
