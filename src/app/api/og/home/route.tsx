import { getRepWatchrDataStats } from "@/lib/data";
import { getSchoolBoardStats } from "@/lib/school-board-research";
import { renderRepWatchrOgImage } from "@/lib/repwatchr-og";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const stats = getRepWatchrDataStats();
  const schoolBoards = getSchoolBoardStats();

  return renderRepWatchrOgImage({
    requestUrl: request.url,
    pageType: "Homepage",
    title: "Public officials on the record",
    subtitle: "Find officials, school boards, votes, funding, red flags, stories, source links, and share-ready records.",
    jurisdiction: "United States / Texas-first buildout",
    metricValue: stats.officialFiles.toLocaleString("en-US"),
    metricLabel: "official files",
    path: "/",
    badges: [
      { label: "School profiles", value: schoolBoards.candidates.toLocaleString("en-US"), tone: "blue" },
      { label: "Vote rows", value: stats.publicVoteRecordRows.toLocaleString("en-US"), tone: "green" },
      { label: "Red flags", value: stats.redFlagItems.toLocaleString("en-US"), tone: "red" },
    ],
  });
}
