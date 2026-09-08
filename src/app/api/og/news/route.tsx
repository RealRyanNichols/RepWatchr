import { getAllNews, getNewsById } from "@/lib/data";
import { getPublishedArticle } from "@/lib/published-articles";
import { articleThumbnailMessage } from "@/lib/editorial-visuals";
import { renderArticleOgImage } from "@/lib/article-og";
import {
  REPWATCHR_EDITORIAL_OG_BACKGROUND,
  renderRepWatchrOgImage,
} from "@/lib/repwatchr-og";

export const runtime = "nodejs";

function scopeLabel(value: string | undefined) {
  if (value === "east-texas") return "East Texas";
  if (value === "national") return "United States";
  return "Texas";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  const article = getNewsById(id) ?? (id ? await getPublishedArticle(id) : undefined);

  if (article) {
    return renderArticleOgImage({
      requestUrl: request.url,
      headline: articleThumbnailMessage(article),
      location: article.locationLabel?.split("/")[0]?.trim() || scopeLabel(article.scope),
      topic: article.category || "The public record",
      imageUrl: article.imageUrl,
      imageFocalPoint: article.imageFocalPoint,
      imageCredit: article.imageCredit,
      imageAlt: article.imageAlt,
    });
  }

  return renderRepWatchrOgImage({
    requestUrl: request.url,
    pageType: "Story desk",
    headline: "The story behind the public record.",
    supportLine: "Source-backed stories tied to officials, school boards, elections, courts, money, public offices, and public records.",
    backgroundImage: REPWATCHR_EDITORIAL_OG_BACKGROUND,
    backgroundPosition: "center 45%",
    visualCredit: "Original RepWatchr editorial artwork",
    jurisdiction: "RepWatchr story archive",
    metricValue: getAllNews().length,
    metricLabel: "stories",
    path: "/news",
  });
}
