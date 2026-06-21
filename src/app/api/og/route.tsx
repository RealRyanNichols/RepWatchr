import { getRepWatchrDataStats } from "@/lib/data";
import { renderRepWatchrOgImage } from "@/lib/repwatchr-og";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const stats = getRepWatchrDataStats();

  return renderRepWatchrOgImage({
    requestUrl: request.url,
    pageType: "RepWatchr",
    title: "Search. Grade. Source. Share.",
    subtitle: "Public records first. Share the receipt, not just the outrage.",
    jurisdiction: "Fallback social preview",
    metricValue: stats.officialFiles.toLocaleString("en-US"),
    metricLabel: "records loaded",
    path: "/",
    badges: [
      { label: "Stories", value: stats.newsArticles, tone: "blue" },
      { label: "Funding", value: stats.fundingSummaries, tone: "gold" },
      { label: "Votes", value: stats.publicVoteRecordRows.toLocaleString("en-US"), tone: "green" },
    ],
  });
}
