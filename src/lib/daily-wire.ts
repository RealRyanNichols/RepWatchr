import { DAILY_NEWS_WATCH_SOURCES } from "@/data/daily-news-watch-sources";
import {
  buildDailyWireDuplicateScores,
  evaluateDailyWireQuality,
  isPublicWireStatus,
  type DailyWireGeographicRelevance,
  type DailyWireJurisdictionMatch,
  type DailyWirePublicStatus,
  type DailyWireQuarantineStatus,
  type DailyWireStatus,
} from "@/lib/daily-wire-quality";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { NewsPowerChannel, NewsScope, SourceCredit } from "@/types";

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
  storedStatus: string;
  status: DailyWireStatus;
  sourceTier: string;
  publicStatus: DailyWirePublicStatus;
  jurisdictionMatch: DailyWireJurisdictionMatch;
  geographicRelevance: DailyWireGeographicRelevance;
  sourceDomain: string;
  topicTags: string[];
  officialPersonMatches: string[];
  stateMatches: string[];
  countyMatches: string[];
  cityMatches: string[];
  duplicateScore: number;
  qualityScore: number;
  publishDate: string | null;
  quarantineStatus: DailyWireQuarantineStatus;
  publicLabels: string[];
  reviewReasons: string[];
  sourceWatchId: string | null;
  queryLane: string | null;
  updatedAt: string | null;
  sourceCredit?: SourceCredit;
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
  status: string | null;
  updated_at: string | null;
  raw: unknown;
}

function safeChannels(value: NewsPowerChannel[] | null): NewsPowerChannel[] {
  return Array.isArray(value) && value.length ? value : ["officials"];
}

function safeList(value: string[] | null): string[] {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function sourceCreditFromRaw(raw: unknown): SourceCredit | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const sourceCredit = (raw as { sourceCredit?: unknown }).sourceCredit;
  if (!sourceCredit || typeof sourceCredit !== "object") return undefined;
  const credit = sourceCredit as Partial<SourceCredit>;
  if (typeof credit.name !== "string" || typeof credit.url !== "string") return undefined;

  return {
    name: credit.name,
    url: credit.url,
    ...(typeof credit.handle === "string" ? { handle: credit.handle } : {}),
    ...(typeof credit.note === "string" ? { note: credit.note } : {}),
  };
}

function toDailyWireClip(row: DailyWireClipRow, duplicateScore: number): DailyWireClip | null {
  if (!row.id || !row.title || !row.source_url) return null;

  const sourceName = row.source_name?.trim() || "Public source";
  const sourceCredit = sourceCreditFromRaw(row.raw);
  const baseClip = {
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
    updatedAt: row.updated_at,
  };
  const quality = evaluateDailyWireQuality({ ...baseClip, raw: row.raw }, duplicateScore);

  return {
    ...baseClip,
    ...quality,
    ...(sourceCredit ? { sourceCredit } : {}),
  };
}

async function loadDailyWireRows(limit: number) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      configured: false,
      sourceCount: DAILY_NEWS_WATCH_SOURCES.length,
      error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    };
  }

  const { data, error } = await supabase
    .from("repwatchr_daily_clips")
    .select(
      "id,title,summary,source_url,source_name,published_at,scope,state,counties,cities,power_channels,matched_terms,status,updated_at,raw",
    )
    .order("published_at", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    return {
      configured: true,
      sourceCount: DAILY_NEWS_WATCH_SOURCES.length,
      error: error.message,
    };
  }

  return {
    configured: true,
    rows: (data ?? []) as DailyWireClipRow[],
    sourceCount: DAILY_NEWS_WATCH_SOURCES.length,
  };
}

function mapRowsToClips(rows: DailyWireClipRow[]) {
  const duplicateScores = buildDailyWireDuplicateScores(rows);
  return rows
    .map((row) => toDailyWireClip(row, duplicateScores.get(row.id) ?? 0))
    .filter((clip): clip is DailyWireClip => Boolean(clip));
}

export async function getDailyWireClips(limit = 48): Promise<DailyWireResult> {
  const result = await loadDailyWireRows(Math.max(limit * 3, limit));

  if (!result.configured || result.error || !("rows" in result)) {
    return {
      configured: result.configured,
      clips: [],
      sourceCount: result.sourceCount,
      error: result.error,
    };
  }

  const clips = mapRowsToClips(result.rows ?? [])
    .filter((clip) => isPublicWireStatus(clip.status))
    .slice(0, limit);

  return {
    configured: true,
    clips,
    sourceCount: DAILY_NEWS_WATCH_SOURCES.length,
  };
}

export async function getDailyWireReviewQueue(limit = 120): Promise<DailyWireResult> {
  const result = await loadDailyWireRows(limit);

  if (!result.configured || result.error || !("rows" in result)) {
    return {
      configured: result.configured,
      clips: [],
      sourceCount: result.sourceCount,
      error: result.error,
    };
  }

  return {
    configured: true,
    clips: mapRowsToClips(result.rows ?? []),
    sourceCount: DAILY_NEWS_WATCH_SOURCES.length,
  };
}

export async function updateDailyWireItemStatus({
  id,
  status,
  adminUserId,
  note,
  attachTargetType,
  attachTargetId,
  promotedStoryId,
}: {
  id: string;
  status: DailyWireStatus;
  adminUserId: string;
  note?: string;
  attachTargetType?: string;
  attachTargetId?: string;
  promotedStoryId?: string;
}) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is required for wire moderation.");

  const { data: before, error: beforeError } = await supabase
    .from("repwatchr_daily_clips")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (beforeError || !before) throw new Error(beforeError?.message || "Daily wire item not found.");

  const raw = before.raw && typeof before.raw === "object" ? (before.raw as Record<string, unknown>) : {};
  const moderation = {
    ...(raw.moderation && typeof raw.moderation === "object" ? (raw.moderation as Record<string, unknown>) : {}),
    status,
    note: note || null,
    attachTargetType: attachTargetType || null,
    attachTargetId: attachTargetId || null,
    promotedStoryId: promotedStoryId || null,
    updatedBy: adminUserId,
    updatedAt: new Date().toISOString(),
  };

  const { data: after, error: updateError } = await supabase
    .from("repwatchr_daily_clips")
    .update({
      status,
      raw: {
        ...raw,
        moderation,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (updateError || !after) throw new Error(updateError?.message || "Daily wire status update failed.");

  return { before, after };
}
