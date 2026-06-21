import { getIssueCategories, getRepWatchrDataStats } from "@/lib/data";
import { renderRepWatchrOgImage } from "@/lib/repwatchr-og";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const categories = getIssueCategories();
  const stats = getRepWatchrDataStats();

  return renderRepWatchrOgImage({
    requestUrl: request.url,
    pageType: "Methodology",
    title: "How RepWatchr scores and sources records",
    subtitle: "Transparent scoring, roll-call evidence, source links, public questions, and clear review status instead of unsupported claims.",
    jurisdiction: "RepWatchr method and source rules",
    metricValue: categories.length,
    metricLabel: "issue lanes",
    path: "/methodology",
    badges: [
      { label: "Scorecards", value: stats.scoreCards, tone: "blue" },
      { label: "Vote rows", value: stats.publicVoteRecordRows.toLocaleString("en-US"), tone: "green" },
      { label: "Sources", value: stats.publicSourceUrls.toLocaleString("en-US"), tone: "gold" },
    ],
  });
}
