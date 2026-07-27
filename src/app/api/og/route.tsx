import { getRepWatchrDataStats } from "@/lib/data";
import {
  REPWATCHR_EDITORIAL_OG_BACKGROUND,
  renderRepWatchrOgImage,
} from "@/lib/repwatchr-og";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const stats = getRepWatchrDataStats();

  return renderRepWatchrOgImage({
    requestUrl: request.url,
    pageType: "RepWatchr",
    headline: "Receipts before outrage.",
    supportLine: "Search officials, inspect the record, and share what the public source actually shows.",
    backgroundImage: REPWATCHR_EDITORIAL_OG_BACKGROUND,
    backgroundPosition: "center 45%",
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
