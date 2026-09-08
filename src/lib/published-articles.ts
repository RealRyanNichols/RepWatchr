import { createClient } from "@supabase/supabase-js";
import { toEditorialThumbnailMessage } from "@/lib/editorial-visuals";
import type {
  NewsArticle,
  NewsPowerChannel,
  NewsScope,
  NewsTag,
  SourceLink,
} from "@/types";

type ArticleRow = {
  slug: string;
  title: string;
  dek: string;
  content: string;
  author: string;
  scope: string;
  official_ids: string[] | null;
  tags: string[] | null;
  source_links: SourceLink[] | null;
  primary_source_count: number;
  independent_publisher_count: number;
  midterm_relevance: 0 | 1 | 2 | 3;
  published_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  topic_key: string;
};

const PUBLIC_ARTICLE_COLUMNS =
  "slug,title,dek,content,author,scope,official_ids,tags,source_links,primary_source_count,independent_publisher_count,midterm_relevance,published_at,reviewed_by,reviewed_at,topic_key";

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key
    ? createClient(url, key, { auth: { persistSession: false } })
    : null;
}

function toNewsArticle(row: ArticleRow): NewsArticle {
  const sources = row.source_links ?? [];
  return {
    id: row.slug,
    title: row.title,
    thumbnailMessage: toEditorialThumbnailMessage(row.title),
    summary: row.dek,
    content: row.content,
    author: row.author,
    scope: row.scope as NewsScope,
    officialIds: row.official_ids ?? [],
    tags: (row.tags ?? ["watchdog", "update"]) as NewsTag[],
    sourceLinks: sources,
    sourceUrl: sources[0]?.url,
    sourceName: sources[0]?.title,
    sourceStatus: "source_linked",
    editorialStatus: "approved",
    reviewedAt: row.reviewed_at ?? row.published_at,
    reviewedBy: row.reviewed_by ?? "RepWatchr editorial desk",
    correctionStatus: "none",
    publishedAt: row.published_at,
    featured: row.midterm_relevance >= 2,
    topicKey: row.topic_key,
    primarySourceCount: row.primary_source_count,
    independentPublisherCount: row.independent_publisher_count,
    midtermRelevance: row.midterm_relevance,
    powerChannels: ["officials", "elections"] as NewsPowerChannel[],
  };
}

export async function getPublishedArticles(
  limit = 100,
): Promise<NewsArticle[]> {
  const supabase = publicClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("repwatchr_articles")
    .select(PUBLIC_ARTICLE_COLUMNS)
    .eq("editorial_status", "approved")
    .eq("publish_status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(Math.min(1000, Math.max(1, Math.trunc(limit) || 100)));
  if (error) return [];
  return (data as ArticleRow[]).map(toNewsArticle);
}

export async function getPublishedArticle(
  slug: string,
): Promise<NewsArticle | undefined> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 160)
    return undefined;
  const supabase = publicClient();
  if (!supabase) return undefined;
  const { data, error } = await supabase
    .from("repwatchr_articles")
    .select(PUBLIC_ARTICLE_COLUMNS)
    .eq("slug", slug)
    .eq("editorial_status", "approved")
    .eq("publish_status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle();
  return !error && data ? toNewsArticle(data as ArticleRow) : undefined;
}
