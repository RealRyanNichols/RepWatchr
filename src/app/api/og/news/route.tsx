import { getAllNews, getNewsById, getOfficialById } from "@/lib/data";
import { getPublishedArticle } from "@/lib/published-articles";
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
  const allNews = getAllNews();
  const officials = article?.officialIds.map((officialId) => getOfficialById(officialId)).filter(Boolean) ?? [];
  const sourceCount = article?.sourceLinks?.length ?? (article?.sourceUrl ? 1 : 0);
  const title = article?.title ?? "The story behind the public record.";
  const summary = article?.summary ?? "Source-backed stories tied to officials, school boards, elections, courts, money, public offices, and public records.";
  const path = article ? `/news/${article.id}` : "/news";
  const articleVisual = article?.imageUrl;
  const linkedPortrait = officials.find((official) => official?.photo)?.photo;

  return renderRepWatchrOgImage({
    requestUrl: request.url,
    pageType: article ? "Accountability story" : "Story desk",
    headline: title,
    supportLine: summary,
    backgroundImage: articleVisual ?? REPWATCHR_EDITORIAL_OG_BACKGROUND,
    backgroundPosition: articleVisual ? "center" : "center 45%",
    portraitImage: articleVisual ? undefined : linkedPortrait,
    visualCredit: articleVisual
      ? "RepWatchr story visual"
      : linkedPortrait
        ? officials.find((official) => official?.photo === linkedPortrait)?.photoCredit
        : "Original RepWatchr editorial artwork",
    jurisdiction: article ? `${scopeLabel(article.scope)} accountability story` : "RepWatchr story archive",
    metricValue: article ? sourceCount || "Review" : allNews.length,
    metricLabel: article ? (sourceCount ? "sources" : "source review") : "stories",
    path,
    badges: [
      { label: "Officials", value: article ? officials.length : new Set(allNews.flatMap((item) => item.officialIds)).size, tone: "blue" },
      { label: "Source status", value: article?.sourceStatus === "needs_source_review" ? "Review" : "Linked", tone: article ? (sourceCount ? "green" : "gold") : "green" },
      { label: "Share", value: "Ready", tone: "red" },
    ],
  });
}
