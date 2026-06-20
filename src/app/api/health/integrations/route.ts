import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const requiredTables = [
  "profiles",
  "citizen_votes",
  "citizen_grades",
  "comments",
  "reports",
  "profile_claims",
  "claimed_profile_content",
  "profile_media",
  "profile_scorecard_votes",
  "member_profiles",
  "member_tracked_items",
  "member_research_theories",
  "member_action_packets",
  "site_page_views",
  "repwatchr_daily_clips",
  "repwatchr_social_tokens",
  "repwatchr_social_posts",
  "operator_tasks",
  "operator_asks",
  "accountability_cases",
  "accountability_case_entities",
  "profile_questions",
  "profile_update_runs",
  "profile_completion_snapshots",
  "profile_enrichment_items",
  "profile_vote_snapshots",
  "vote_issue_rules",
  "profile_social_accounts",
  "public_statement_snapshots",
  "social_monitoring_jobs",
  "predator_profiles",
  "predator_reports",
  "predator_report_evidence",
  "predator_public_notes",
  "texas_election_contributions",
];

const optionalTables: string[] = [];

const requiredViews = [
  "approval_ratings",
  "approval_ratings_by_county",
  "citizen_grade_summary",
  "citizen_grade_summary_by_county",
  "profile_scorecard_summary",
  "profile_scorecard_summary_by_county",
  "profile_scorecard_algorithm",
  "site_page_view_summary",
  "faretta_interaction_counts",
  "school_board_evidence_approved",
];

function hasEnv(name: string) {
  return Boolean(process.env[name]);
}

function readBearer(request: NextRequest) {
  const authorization = request.headers.get("authorization")?.trim();
  return authorization?.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";
}

function isAuthorized(request: NextRequest) {
  const expected = process.env.INTEGRATION_HEALTH_SECRET ?? process.env.CRON_SECRET;
  if (!expected) return false;
  return readBearer(request) === expected;
}

async function checkRelation(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  name: string,
) {
  const { error } = await supabase.from(name).select("*", { count: "exact", head: true }).limit(1);
  return {
    name,
    ok: !error,
    error: error?.message ?? null,
  };
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized integration health request." }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  const env = {
    supabaseUrl: hasEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: hasEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseServiceRole: hasEnv("SUPABASE_SERVICE_ROLE_KEY"),
    cronSecret: hasEnv("CRON_SECRET"),
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? null,
    xClientId: hasEnv("X_CLIENT_ID"),
    xClientSecret: hasEnv("X_CLIENT_SECRET"),
    xAutopostEnabled: process.env.X_AUTOPOST_ENABLED === "true",
    socialAutopostEnabled: process.env.SOCIAL_AUTOPOST_ENABLED === "true",
    socialAutopostEditorialApproved: process.env.SOCIAL_AUTOPOST_EDITORIAL_APPROVED === "true",
    facebookPage: hasEnv("FACEBOOK_PAGE_ID") && hasEnv("FACEBOOK_PAGE_ACCESS_TOKEN"),
    stripeSecret: hasEnv("STRIPE_SECRET_KEY"),
    stripeWebhookSecret: hasEnv("STRIPE_WEBHOOK_SECRET"),
    vercelEnv: process.env.VERCEL_ENV ?? null,
    vercelUrl: process.env.VERCEL_URL ?? null,
    githubProvider: process.env.VERCEL_GIT_PROVIDER ?? null,
    githubRepo: process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
      ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
      : null,
    githubCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
  };

  if (!supabase) {
    return NextResponse.json({
      ok: false,
      generatedAt: new Date().toISOString(),
      env,
      supabase: {
        configured: false,
        error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
      },
    }, { status: 503 });
  }

  const [tableChecks, optionalTableChecks, viewChecks, xTokenResult, socialPostResult, clipResult] = await Promise.all([
    Promise.all(requiredTables.map((table) => checkRelation(supabase, table))),
    Promise.all(optionalTables.map((table) => checkRelation(supabase, table))),
    Promise.all(requiredViews.map((view) => checkRelation(supabase, view))),
    supabase
      .from("repwatchr_social_tokens")
      .select("platform, expires_at, updated_at")
      .eq("platform", "x")
      .maybeSingle(),
    supabase
      .from("repwatchr_social_posts")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("repwatchr_daily_clips")
      .select("id", { count: "exact", head: true }),
  ]);

  const missingTables = tableChecks.filter((check) => !check.ok).map((check) => check.name);
  const missingViews = viewChecks.filter((check) => !check.ok).map((check) => check.name);
  const errors = [
    xTokenResult.error?.message,
    socialPostResult.error?.message,
    clipResult.error?.message,
    ...tableChecks.filter((check) => check.error).map((check) => `${check.name}: ${check.error}`),
    ...viewChecks.filter((check) => check.error).map((check) => `${check.name}: ${check.error}`),
  ].filter(Boolean);
  const ok = missingTables.length === 0 && missingViews.length === 0 && errors.length === 0;

  return NextResponse.json({
    ok,
    generatedAt: new Date().toISOString(),
    env,
    supabase: {
      configured: true,
      missingTables,
      optionalTables: optionalTableChecks,
      missingViews,
      dailyClipCount: clipResult.count ?? null,
      socialPostCount: socialPostResult.count ?? null,
      xTokenStored: Boolean(xTokenResult.data),
      xTokenExpiresAt: xTokenResult.data?.expires_at ?? null,
      errors,
    },
  }, { status: ok ? 200 : 500 });
}
