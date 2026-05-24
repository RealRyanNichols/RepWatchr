import { DAILY_NEWS_WATCH_SOURCES } from "@/data/daily-news-watch-sources";
import {
  autoPublishStatus,
  classifyProfileSource,
  type ProfileOverlayStatus,
  type ProfileSourceTier,
} from "@/lib/profile-overlays";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { NewsPowerChannel, NewsScope } from "@/types";

export interface DailyWireClip {
  id: string;
  title: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  publishedAt: string | null;
  scope: NewsScope;
  state: string | null;
  counties: string[];
  cities: string[];
  powerChannels: NewsPowerChannel[];
  matchedTerms: string[];
  storedStatus: ProfileOverlayStatus | "needs_review";
  sourceTier: ProfileSourceTier;
  publicStatus: "auto_published" | "needs_review";
  updatedAt: string | null;
}

export interface DailyWireResult {
  configured: boolean;
  clips: DailyWireClip[];
  sourceCount: number;
  error?: string;
}

interface DailyWireClipRow {
  id: string;
  title: string | null;
  summary: string | null;
  source_url: string | null;
  source_name: string | null;
  published_at: string | null;
  scope: NewsScope | null;
  state: string | null;
  counties: string[] | null;
  cities: string[] | null;
  power_channels: NewsPowerChannel[] | null;
  matched_terms: string[] | null;
  status: ProfileOverlayStatus | "needs_review" | null;
  updated_at: string | null;
}

const publicStatuses: DailyWireClip["publicStatus"][] = ["auto_published", "needs_review"];

function safeChannels(value: NewsPowerChannel[] | null): NewsPowerChannel[] {
  return Array.isArray(value) && value.length ? value : ["officials"];
}

function safeList(value: string[] | null): string[] {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function publicStatusFor(row: DailyWireClipRow): DailyWireClip["publicStatus"] {
  const sourceTier = classifyProfileSource(row.source_url ?? "", row.source_name ?? "");
  const status = autoPublishStatus(sourceTier);
  return status === "auto_published" && publicStatuses.includes(status) ? "auto_published" : "needs_review";
}

function toDailyWireClip(row: DailyWireClipRow): DailyWireClip | null {
  if (!row.id || !row.title || !row.source_url) return null;

  const sourceName = row.source_name?.trim() || "Public source";
  const sourceTier = classifyProfileSource(row.source_url, sourceName);

  return {
    id: row.id,
    title: row.title,
    summary: row.summary?.trim() || "Source-linked public accountability item captured by the daily RepWatchr wire.",
    sourceUrl: row.source_url,
    sourceName,
    publishedAt: row.published_at,
    scope: row.scope ?? "national",
    state: row.state,
    counties: safeList(row.counties),
    cities: safeList(row.cities),
    powerChannels: safeChannels(row.power_channels),
    matchedTerms: safeList(row.matched_terms),
    storedStatus: row.status ?? "needs_review",
    sourceTier,
    publicStatus: publicStatusFor(row),
    updatedAt: row.updated_at,
  };
}

export async function getDailyWireClips(limit = 48): Promise<DailyWireResult> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      configured: false,
      clips: [],
      sourceCount: DAILY_NEWS_WATCH_SOURCES.length,
      error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    };
  }

  const { data, error } = await supabase
    .from("repwatchr_daily_clips")
    .select(
      "id,title,summary,source_url,source_name,published_at,scope,state,counties,cities,power_channels,matched_terms,status,updated_at",
    )
    .order("published_at", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    return {
      configured: true,
      clips: [],
      sourceCount: DAILY_NEWS_WATCH_SOURCES.length,
      error: error.message,
    };
  }

  const clips = ((data ?? []) as DailyWireClipRow[])
    .map(toDailyWireClip)
    .filter((clip): clip is DailyWireClip => Boolean(clip));

  return {
    configured: true,
    clips,
    sourceCount: DAILY_NEWS_WATCH_SOURCES.length,
  };
}
