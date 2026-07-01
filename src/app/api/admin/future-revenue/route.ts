import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getFutureRevenueFlagStatus } from "@/lib/future-revenue-flags";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AdminClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

const futureRevenueTables = [
  "future_revenue_feature_flags",
  "future_revenue_packages",
  "future_revenue_organizations",
  "future_revenue_team_members",
  "future_revenue_subscriptions",
  "future_revenue_entitlements",
  "future_revenue_api_keys",
  "future_revenue_credit_ledger",
  "future_revenue_invoices",
  "future_revenue_licenses",
  "future_revenue_export_jobs",
  "future_revenue_audit_events",
];

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

async function countTable(admin: AdminClient, table: string) {
  const { count, error } = await admin.from(table).select("*", { count: "exact", head: true });

  if (error) {
    return { table, status: "error" as const, count: null, error: error.message };
  }

  return { table, status: "ok" as const, count: count ?? 0, error: null };
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { admin, user } = auth;
  const staticFlags = getFutureRevenueFlagStatus();

  const [summary, packageRegistry, featureFlags, tableCounts] = await Promise.all([
    loadSingle(
      "future_revenue_admin_summary",
      admin.from("future_revenue_admin_summary").select("*").eq("period", "all_time").maybeSingle(),
    ),
    loadRows(
      "future_revenue_package_registry",
      admin
        .from("future_revenue_package_registry")
        .select(
          "slug, name, category, audience, internal_purpose, status, public_copy_allowed, checkout_enabled, stripe_enabled, api_enabled, capabilities, flag_key, flag_enabled, flag_activation_status, updated_at",
        )
        .order("category", { ascending: true })
        .order("name", { ascending: true }),
    ),
    loadRows(
      "future_revenue_feature_flags",
      admin
        .from("future_revenue_feature_flags")
        .select("flag_key, label, enabled, scope, activation_status, updated_at")
        .order("flag_key", { ascending: true }),
    ),
    Promise.all(futureRevenueTables.map((table) => countTable(admin, table))),
  ]);

  const errors = [
    summary.error,
    packageRegistry.error,
    featureFlags.error,
    ...tableCounts.map((table) => table.error),
  ].filter(Boolean);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
    },
    staticFlags,
    summary: summary.row,
    packages: packageRegistry.rows,
    featureFlags: featureFlags.rows,
    tableCounts,
    migrationReady: errors.length === 0,
    errors,
    guardrails: [
      "Public routes, checkout, API issuance, exports, and invoices remain hidden until activated.",
      "Use aggregate, consent-aware intelligence. Do not sell private identity documents or private voter records.",
      "API-key rows store prefix and hash only. Never store raw keys.",
    ],
  });
}
