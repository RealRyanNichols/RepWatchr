import { getPublicArticleCatalog } from "@/lib/article-catalog";
import { MARION_FORUM_TOPIC } from "@/data/marion-forum-record";
import type { NewsArticle } from "@/types";
export { marionDateLabel } from "@/lib/marion-date";

export const MARION_RACE_PATH = "/elections/texas/marion-county-judge-2026";

/** County-specific reporting only; a broad regional tag is not a local story. */
export function isMarionArticle(article: NewsArticle) {
  return article.topicKey === MARION_FORUM_TOPIC ||
    (article.counties?.length === 1 && article.counties[0] === "Marion") ||
    /\bmarion county\b/i.test(article.title);
}

export async function getMarionArticles(limit = 12) {
  return (await getPublicArticleCatalog()).filter(isMarionArticle).slice(0, limit);
}
