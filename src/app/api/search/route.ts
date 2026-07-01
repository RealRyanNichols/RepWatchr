import { NextRequest, NextResponse } from "next/server";
import { serverTrackEvent, updateInterestScore, updateVisitorProfile } from "@/lib/analytics-server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  coerceSearchEntityTypes,
  coerceSearchSort,
  normalizeSearchFilters,
  searchDiscovery,
} from "@/lib/search-discovery";
import { normalizeSearchQuery } from "@/lib/search-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function firstParam(request: NextRequest, key: string) {
  return request.nextUrl.searchParams.get(key) ?? undefined;
}

function booleanParam(request: NextRequest, key: string) {
  const value = request.nextUrl.searchParams.get(key);
  return value === "true" || value === "1";
}

function numberParam(request: NextRequest, key: string) {
  const value = request.nextUrl.searchParams.get(key);
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
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

export async function GET(request: NextRequest) {
  const query = normalizeSearchQuery(firstParam(request, "q") ?? firstParam(request, "query") ?? firstParam(request, "search"));
  const sourceSurface = normalizeSearchQuery(firstParam(request, "sourceSurface"), 80) || "search_page";
  const route = normalizeSearchQuery(firstParam(request, "route"), 500) || "/search";
  const anonymousId = normalizeSearchQuery(firstParam(request, "anonymousId"), 120) || null;
  const sessionId = normalizeSearchQuery(firstParam(request, "sessionId"), 120) || null;
  const page = numberParam(request, "page") ?? 1;
  const limit = numberParam(request, "limit") ?? 20;
  const sort = coerceSearchSort(firstParam(request, "sort"));
  const entityTypes = coerceSearchEntityTypes([
    ...request.nextUrl.searchParams.getAll("entityType"),
    ...request.nextUrl.searchParams.getAll("type"),
  ]);

  const filters = normalizeSearchFilters({
    entityTypes,
    state: firstParam(request, "state"),
    county: firstParam(request, "county"),
    city: firstParam(request, "city"),
    officeLevel: firstParam(request, "officeLevel"),
    officeType: firstParam(request, "officeType"),
    sourceCountMin: numberParam(request, "sourceCountMin"),
    completenessMin: numberParam(request, "completenessMin"),
    hasVotes: booleanParam(request, "hasVotes"),
    hasFunding: booleanParam(request, "hasFunding"),
    hasSourceGaps: booleanParam(request, "hasSourceGaps"),
    hasCorrectionRequested: booleanParam(request, "hasCorrectionRequested"),
    recentlyUpdated: booleanParam(request, "recentlyUpdated"),
    popular: booleanParam(request, "popular"),
    watched: booleanParam(request, "watched"),
    publicBodyType: firstParam(request, "publicBodyType"),
  });

  const response = await searchDiscovery({ query, filters, page, limit, sort });
  const userId = await getCurrentUserId();

  if (query) {
    await Promise.allSettled([
      serverTrackEvent({
        eventName: response.total > 0 ? "search_query_submitted" : "search_no_results",
        anonymousId,
        userId,
        sessionId,
        route,
        referrer: request.headers.get("referer"),
        metadata: {
          query,
          source_surface: sourceSurface,
          result_count: response.total,
          sort,
          data_source: response.dataSource,
          filters: JSON.stringify(filters).slice(0, 500),
        },
      }),
      updateInterestScore({
        eventType: "search_query_submitted",
        anonymousId,
        userId,
        sessionId,
        path: route,
        searchTerm: query,
        metadata: {
          source_surface: sourceSurface,
          sort,
          entity_types: entityTypes.join(","),
          state: filters.state ?? null,
          county: filters.county ?? null,
          office_type: filters.officeType ?? null,
        },
      }),
      anonymousId
        ? updateVisitorProfile({
            eventName: "search_query_submitted",
            anonymousId,
            userId,
            sessionId,
            route,
            referrer: request.headers.get("referer"),
            metadata: { query, result_count: response.total },
          })
        : Promise.resolve({ ok: false }),
    ]);
  }

  return NextResponse.json(response);
}
