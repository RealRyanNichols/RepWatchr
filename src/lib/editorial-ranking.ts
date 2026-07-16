import type { NewsArticle } from "@/types";

export type EditorialSurface = "home" | "blog" | "news" | "feed" | "rss" | "seo";

export interface EditorialRankExplanation {
  articleId: string;
  score: number;
  factors: string[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function boundedInteger(value: number | undefined, minimum: number, maximum: number) {
  if (!Number.isFinite(value)) return minimum;
  return Math.max(minimum, Math.min(maximum, Math.round(value as number)));
}

function recencyPoints(publishedAt: string, now: Date) {
  const published = new Date(publishedAt).getTime();
  if (!Number.isFinite(published)) return 0;
  const ageDays = Math.max(0, (now.getTime() - published) / DAY_MS);
  return Math.max(0, 40 - Math.floor(ageDays / 3));
}

/**
 * Disclosed ranking inputs only. Names, parties, ideology, source authors, and
 * paid promotion are intentionally absent.
 */
export function explainEditorialRank(article: NewsArticle, now = new Date()): EditorialRankExplanation {
  const recency = recencyPoints(article.publishedAt, now);
  const primarySources = boundedInteger(article.primarySourceCount, 0, 4) * 5;
  const publishers = boundedInteger(article.independentPublisherCount, 0, 3) * 5;
  const midterm = boundedInteger(article.midtermRelevance, 0, 3) * 5;
  const receiptCount = Math.min(10, (article.sourceLinks?.length ?? (article.sourceUrl ? 1 : 0)) * 2);
  const score = recency + primarySources + publishers + midterm + receiptCount;

  return {
    articleId: article.id,
    score,
    factors: [
      `recency:${recency}`,
      `primary_sources:${primarySources}`,
      `independent_publishers:${publishers}`,
      `midterm_relevance:${midterm}`,
      `receipts:${receiptCount}`,
    ],
  };
}

function topicKey(article: NewsArticle) {
  return article.topicKey?.trim().toLowerCase() || article.tags[0] || "uncategorized";
}

/**
 * Rank approved stories, then apply a deterministic diversity pass so one
 * person or topic cannot monopolize the leading positions.
 */
export function selectEditorialStories(
  _surface: EditorialSurface,
  articles: NewsArticle[],
  { now = new Date(), limit = articles.length }: { now?: Date; limit?: number } = {},
) {
  const ranked = [...articles]
    .filter((article) => article.editorialStatus === "approved")
    .sort((a, b) => {
      const scoreDifference = explainEditorialRank(b, now).score - explainEditorialRank(a, now).score;
      if (scoreDifference !== 0) return scoreDifference;
      const dateDifference = new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      return dateDifference || a.id.localeCompare(b.id);
    });

  const selected: NewsArticle[] = [];
  const deferred: NewsArticle[] = [];
  const officialCounts = new Map<string, number>();
  const topicCounts = new Map<string, number>();

  for (const article of ranked) {
    const leading = selected.length < 3;
    const maxPerOfficial = leading ? 1 : 2;
    const maxPerTopic = leading ? 1 : 2;
    const wouldRepeatOfficial = article.officialIds.some(
      (officialId) => (officialCounts.get(officialId) ?? 0) >= maxPerOfficial,
    );
    const articleTopic = topicKey(article);
    const wouldRepeatTopic = (topicCounts.get(articleTopic) ?? 0) >= maxPerTopic;

    if (wouldRepeatOfficial || wouldRepeatTopic) {
      deferred.push(article);
      continue;
    }

    selected.push(article);
    article.officialIds.forEach((officialId) => officialCounts.set(officialId, (officialCounts.get(officialId) ?? 0) + 1));
    topicCounts.set(articleTopic, (topicCounts.get(articleTopic) ?? 0) + 1);
    if (selected.length >= limit) return selected;
  }

  return [...selected, ...deferred].slice(0, limit);
}
