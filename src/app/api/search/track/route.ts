import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { normalizeSearchKey, normalizeSearchQuery } from "@/lib/search-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function shortText(value: unknown, maxLength: number) {
  return normalizeSearchQuery(typeof value === "string" ? value : "", maxLength) || null;
}

function cleanStringArray(value: unknown, maxLength = 16) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => normalizeSearchQuery(item, 60))
        .filter(Boolean),
    ),
  ).slice(0, maxLength);
}

function cleanMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const entries: Array<[string, string | number | boolean | null]> = [];

  for (const [key, entryValue] of Object.entries(value as Record<string, unknown>).slice(0, 24)) {
    const cleanKey = normalizeSearchKey(key).replace(/\s+/g, "_").slice(0, 60);
    if (!cleanKey) continue;
    if (typeof entryValue === "number" || typeof entryValue === "boolean" || entryValue === null) {
      entries.push([cleanKey, entryValue]);
      continue;
    }
    if (typeof entryValue === "string") {
      entries.push([cleanKey, normalizeSearchQuery(entryValue, 160)]);
    }
  }

  return Object.fromEntries(entries);
}

async function getCurrentUserId() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const query = normalizeSearchQuery((body as Record<string, unknown>).query);
  const normalizedQuery = normalizeSearchKey(query);

  if (!query || !normalizedQuery) {
    return NextResponse.json({ ok: false, error: "Search query is required." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: true, stored: false });
  }

  const bodyRecord = body as Record<string, unknown>;
  const userId = await getCurrentUserId();
  const resultCount = Number(bodyRecord.resultCount ?? 0);
  const insertPayload = {
    user_id: userId,
    anonymous_id: shortText(bodyRecord.anonymousId, 120),
    session_id: shortText(bodyRecord.sessionId, 120),
    query,
    normalized_query: normalizedQuery,
    source_surface: shortText(bodyRecord.sourceSurface, 80) ?? "predictive_search",
    route: shortText(bodyRecord.route, 500),
    referrer: shortText(bodyRecord.referrer, 1000),
    result_count: Number.isFinite(resultCount) ? Math.max(0, Math.min(10000, Math.round(resultCount))) : 0,
    result_types: cleanStringArray(bodyRecord.resultTypes),
    selected_result_kind: shortText(bodyRecord.selectedResultKind, 60),
    selected_result_id: shortText(bodyRecord.selectedResultId, 240),
    selected_result_href: shortText(bodyRecord.selectedResultHref, 1000),
    metadata: cleanMetadata(bodyRecord.metadata),
  };

  const { error } = await admin.from("search_events").insert(insertPayload);
  if (error) {
    return NextResponse.json({ ok: true, stored: false });
  }

  return NextResponse.json({ ok: true, stored: true });
}
