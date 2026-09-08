import { getAllNews } from "@/lib/data";
import { getPublishedArticles } from "@/lib/published-articles";
import type { NewsArticle } from "@/types";

/** The same approved articles should be discoverable in the blog, RSS and sitemaps. */
export async function getPublicArticleCatalog(
  limit = 1000,
): Promise<NewsArticle[]> {
  const databaseArticles = await getPublishedArticles(limit);
  const articles = new Map(
    databaseArticles.map((article) => [article.id, article]),
  );
  // Detail pages resolve repository records first, so catalog precedence must match.
  for (const article of getAllNews()) articles.set(article.id, article);
  const now = Date.now();
  return [...articles.values()]
    .filter(
      (article) =>
        Number.isFinite(Date.parse(article.publishedAt)) &&
        Date.parse(article.publishedAt) <= now,
    )
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}
