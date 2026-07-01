import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getFallbackSearchSuggestions, predictiveSearch } from "@/lib/predictive-search";
import { normalizeSearchKey, normalizeSearchQuery } from "@/lib/search-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PublicSuggestionRow = {
  query: string;
  label: string;
  kind: "popular" | "trending" | "suggestion";
  href: string;
  priority: number;
};

async function getPublicSuggestions(kind: "popular" | "trending" | "suggestion") {
  const admin = getSupabaseAdminClient();
  if (!admin) return getFallbackSearchSuggestions(kind === "suggestion" ? "popular" : kind).slice(0, 8);

  const { data, error } = await admin
    .from("search_public_suggestion_summary")
    .select("query, label, kind, href, priority")
    .eq("kind", kind)
    .order("priority", { ascending: false })
    .limit(8);

  if (error || !data?.length) return getFallbackSearchSuggestions(kind === "suggestion" ? "popular" : kind).slice(0, 8);

  return (data as PublicSuggestionRow[]).map((row) => ({
    query: row.query,
    label: row.label,
    kind: row.kind,
    count: row.priority,
    href: row.href,
  }));
}

async function getSavedSearches() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return [];

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("saved_searches")
      .select("id, query, title, scope, alert_frequency, public_share_enabled, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(10);

    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const query = normalizeSearchQuery(request.nextUrl.searchParams.get("q"));
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "6");
  const limitPerKind = Number.isFinite(limit) ? Math.max(3, Math.min(10, limit)) : 6;
  const results = predictiveSearch(query, limitPerKind);
  const [popular, trending, savedSearches] = await Promise.all([
    getPublicSuggestions("popular"),
    getPublicSuggestions("trending"),
    getSavedSearches(),
  ]);

  return NextResponse.json({
    ok: true,
    normalizedQuery: normalizeSearchKey(query),
    ...results,
    popularSearches: popular,
    trendingSearches: trending,
    savedSearches,
  });
}
