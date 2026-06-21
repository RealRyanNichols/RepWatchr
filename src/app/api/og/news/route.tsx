import { getAllNews, getNewsById, getOfficialById } from "@/lib/data";
import { renderRepWatchrOgImage } from "@/lib/repwatchr-og";

export const runtime = "nodejs";

function scopeLabel(value: string | undefined) {
  if (value === "east-texas") return "East Texas";
  if (value === "national") return "United States";
  return "Texas";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  const article = getNewsById(id);
  const allNews = getAllNews();
  const officials = article?.officialIds.map((officialId) => getOfficialById(officialId)).filter(Boolean) ?? [];
  const sourceCount = article?.sourceLinks?.length ?? (article?.sourceUrl ? 1 : 0);
  const title = article?.title ?? "Public accountability stories";
  const summary = article?.summary ?? "Source-backed stories tied to officials, school boards, elections, courts, money, public offices, and public records.";
  const path = article ? `/news/${article.id}` : "/news";

  return renderRepWatchrOgImage({
    requestUrl: request.url,
    pageType: "Story",
    title,
    subtitle: summary,
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
