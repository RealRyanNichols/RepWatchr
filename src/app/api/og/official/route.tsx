import { getFundingSummary, getOfficialById, getPublicVoteRecord, getRedFlags, getScoreCard } from "@/lib/data";
import { formatLevelName } from "@/lib/formatting";
import { renderRepWatchrOgImage } from "@/lib/repwatchr-og";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  const official = getOfficialById(id);
  const scoreCard = official ? getScoreCard(official.id) : undefined;
  const redFlags = official ? getRedFlags(official.id) : [];
  const funding = official ? getFundingSummary(official.id) : undefined;
  const voteRecord = official ? getPublicVoteRecord(official.id) : undefined;
  const sourceCount = (official?.sourceLinks?.length ?? 0) + (funding?.sources.length ?? 0) + (voteRecord?.sourceLinks.length ?? 0);
  const path = official ? `/officials/${official.id}` : "/officials";

  return renderRepWatchrOgImage({
    requestUrl: request.url,
    pageType: "Official profile",
    title: official?.name ?? "RepWatchr official profile",
    subtitle: official
      ? `${official.position}${official.district ? ` / ${official.district}` : ""}`
      : "Public official record with source review fallback.",
    jurisdiction: official ? `${official.jurisdiction} / ${formatLevelName(official.level)}` : "United States",
    metricValue: scoreCard ? scoreCard.letterGrade : (voteRecord?.summary.totalVotesLoaded ?? "Review"),
    metricLabel: scoreCard ? `${scoreCard.overall} score` : voteRecord ? "votes loaded" : "source review",
    path,
    badges: [
      { label: "Sources", value: sourceCount || "Review", tone: "blue" },
      { label: "Red flags", value: redFlags.length, tone: "red" },
      { label: "Funding", value: funding ? "Loaded" : "Review", tone: funding ? "green" : "gold" },
    ],
  });
}
