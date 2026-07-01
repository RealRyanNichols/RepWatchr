import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { normalizeSearchKey, normalizeSearchQuery } from "@/lib/search-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const allowedScopes = new Set([
  "all",
  "officials",
  "boards",
  "counties",
  "agencies",
  "stories",
  "issues",
  "votes",
  "funding",
  "campaigns",
  "news",
]);

const allowedAlertFrequency = new Set(["none", "daily", "weekly"]);

function envReady() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

async function getAuthedSupabase() {
  if (!envReady()) {
    return { supabase: null, userId: null, response: NextResponse.json({ ok: false, error: "Login-backed saved searches are not available yet." }, { status: 503 }) };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase: null, userId: null, response: NextResponse.json({ ok: false, error: "Login required to save searches to your account." }, { status: 401 }) };
  }

  return { supabase, userId: user.id, response: null };
}

export async function GET() {
  const auth = await getAuthedSupabase();
  if (auth.response) return auth.response;
  if (!auth.supabase || !auth.userId) {
    return NextResponse.json({ ok: false, error: "Saved searches are unavailable." }, { status: 503 });
  }

  const { data, error } = await auth.supabase
    .from("saved_searches")
    .select("id, query, title, scope, alert_frequency, public_share_enabled, share_id, last_opened_at, created_at, updated_at")
    .eq("user_id", auth.userId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ ok: false, error: "Saved searches could not be loaded." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, savedSearches: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthedSupabase();
  if (auth.response) return auth.response;
  if (!auth.supabase || !auth.userId) {
    return NextResponse.json({ ok: false, error: "Saved searches are unavailable." }, { status: 503 });
  }

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const query = normalizeSearchQuery(body.query);
  const normalizedQuery = normalizeSearchKey(query);
  const scope = typeof body.scope === "string" && allowedScopes.has(body.scope) ? body.scope : "all";
  const alertFrequency = typeof body.alertFrequency === "string" && allowedAlertFrequency.has(body.alertFrequency)
    ? body.alertFrequency
    : "none";

  if (!query || !normalizedQuery) {
    return NextResponse.json({ ok: false, error: "Search query is required." }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("saved_searches")
    .upsert(
      {
        user_id: auth.userId,
        query,
        normalized_query: normalizedQuery,
        title: normalizeSearchQuery(body.title, 160) || query,
        scope,
        alert_frequency: alertFrequency,
        public_share_enabled: Boolean(body.publicShareEnabled),
        last_opened_at: new Date().toISOString(),
      },
      { onConflict: "user_id,normalized_query,scope" },
    )
    .select("id, query, title, scope, alert_frequency, public_share_enabled, share_id, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: "Search could not be saved." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, savedSearch: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await getAuthedSupabase();
  if (auth.response) return auth.response;
  if (!auth.supabase || !auth.userId) {
    return NextResponse.json({ ok: false, error: "Saved searches are unavailable." }, { status: 503 });
  }

  const searchId = request.nextUrl.searchParams.get("id");
  if (!searchId) {
    return NextResponse.json({ ok: false, error: "Saved search ID is required." }, { status: 400 });
  }

  const { error } = await auth.supabase
    .from("saved_searches")
    .delete()
    .eq("id", searchId)
    .eq("user_id", auth.userId);

  if (error) {
    return NextResponse.json({ ok: false, error: "Saved search could not be removed." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
