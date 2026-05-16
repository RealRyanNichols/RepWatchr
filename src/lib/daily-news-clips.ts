import { createHash } from "crypto";
import { DAILY_NEWS_WATCH_SOURCES, type DailyNewsWatchSource } from "@/data/daily-news-watch-sources";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { NewsPowerChannel, NewsScope } from "@/types";

export interface DailyNewsClip {
  id: string;
  title: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  publishedAt?: string;
  scope: NewsScope;
  state?: string;
  counties?: string[];
  cities?: string[];
  powerChannels: NewsPowerChannel[];
  matchedTerms: string[];
  status: "needs_review";
}

export interface DailyNewsFetchResult {
  clips: DailyNewsClip[];
  errors: Array<{ sourceId: string; message: string }>;
  sourceCount: number;
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function stripTags(value: string) {
  return decodeXmlEntities(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(item: string, tag: string) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXmlEntities(match[1]).trim() : "";
}

function hashClip(sourceUrl: string, title: string) {
  return createHash("sha256").update(`${sourceUrl}|${title}`).digest("hex").slice(0, 24);
}

function normalizeDate(value: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function findTerms(source: DailyNewsWatchSource, text: string) {
  const haystack = text.toLowerCase();
  return source.terms.filter((term) => haystack.includes(term.toLowerCase()));
}

function parseRssClips(xml: string, source: DailyNewsWatchSource): DailyNewsClip[] {
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  const clips: DailyNewsClip[] = [];

  for (const item of items) {
    const title = stripTags(extractTag(item, "title"));
    const sourceUrl = stripTags(extractTag(item, "link"));
    const summary = stripTags(extractTag(item, "description"));
    const publishedAt = normalizeDate(extractTag(item, "pubDate"));
    const matchedTerms = findTerms(source, `${title} ${summary}`);

    if (!title || !sourceUrl || matchedTerms.length === 0) continue;

    const clip: DailyNewsClip = {
      id: hashClip(sourceUrl, title),
      title,
      summary: summary.slice(0, 420),
      sourceUrl,
      sourceName: source.label,
      scope: source.scope,
      powerChannels: source.powerChannels,
      matchedTerms,
      status: "needs_review",
    };

    if (publishedAt) clip.publishedAt = publishedAt;
    if (source.state) clip.state = source.state;
    if (source.counties?.length) clip.counties = source.counties;
    if (source.cities?.length) clip.cities = source.cities;

    clips.push(clip);
  }

  return clips;
}

async function fetchSource(source: DailyNewsWatchSource): Promise<{ clips: DailyNewsClip[]; error?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(source.url, {
      headers: {
        "user-agent": "RepWatchrDailyNewsBot/1.0 (+https://www.repwatchr.com/news)",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      return { clips: [], error: `HTTP ${response.status}` };
    }

    return { clips: parseRssClips(await response.text(), source) };
  } catch (error) {
    return { clips: [], error: error instanceof Error ? error.message : "Unknown fetch error" };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchDailyNewsClips(): Promise<DailyNewsFetchResult> {
  const results: Array<Awaited<ReturnType<typeof fetchSource>> & { source: DailyNewsWatchSource }> = [];
  const batchSize = 8;

  for (let index = 0; index < DAILY_NEWS_WATCH_SOURCES.length; index += batchSize) {
    const batch = DAILY_NEWS_WATCH_SOURCES.slice(index, index + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (source) => {
        const result = await fetchSource(source);
        return { source, ...result };
      }),
    );
    results.push(...batchResults);
  }

  const seen = new Set<string>();
  const clips: DailyNewsClip[] = [];
  const errors: DailyNewsFetchResult["errors"] = [];

  for (const result of results) {
    if (result.error) errors.push({ sourceId: result.source.id, message: result.error });

    for (const clip of result.clips) {
      const key = clip.sourceUrl.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      clips.push(clip);
    }
  }

  return {
    clips: clips.slice(0, 160),
    errors,
    sourceCount: DAILY_NEWS_WATCH_SOURCES.length,
  };
}

function toClipRow(clip: DailyNewsClip) {
  return {
    id: clip.id,
    title: clip.title,
    summary: clip.summary,
    source_url: clip.sourceUrl,
    source_name: clip.sourceName,
    published_at: clip.publishedAt ?? null,
    scope: clip.scope,
    state: clip.state ?? null,
    counties: clip.counties ?? [],
    cities: clip.cities ?? [],
    power_channels: clip.powerChannels,
    matched_terms: clip.matchedTerms,
    status: clip.status,
    raw: clip,
    updated_at: new Date().toISOString(),
  };
}

export async function persistDailyNewsClips(clips: DailyNewsClip[]) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      configured: false,
      inserted: 0,
      skipped: clips.length,
      error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    };
  }

  if (clips.length === 0) {
    return { configured: true, inserted: 0, skipped: 0 };
  }

  const { error } = await supabase.from("repwatchr_daily_clips").upsert(clips.map(toClipRow), {
    onConflict: "source_url",
  });

  if (error) {
    return { configured: true, inserted: 0, skipped: clips.length, error: error.message };
  }

  return { configured: true, inserted: clips.length, skipped: 0 };
}
