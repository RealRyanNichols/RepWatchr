import { getFundingSummary, getOfficialById, getPublicVoteRecord, getRedFlags, getScoreCard } from "@/lib/data";
import { formatLevelName } from "@/lib/formatting";
import {
  REPWATCHR_EDITORIAL_OG_BACKGROUND,
  renderRepWatchrOgImage,
} from "@/lib/repwatchr-og";

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
  const hasFeaturedPhoto = Boolean(official?.featuredPhoto);

  return renderRepWatchrOgImage({
    requestUrl: request.url,
    pageType: "Official profile",
    headline: official ? `${official.name}: the public record` : "Find the official. Open the record.",
    supportLine: official
      ? `${official.position}${official.district ? ` · ${official.district}` : ""}. Votes, funding, reporting, and source status in one file.`
      : "Search elected-official profiles, public records, and visible evidence gaps.",
    backgroundImage: official?.featuredPhoto ?? REPWATCHR_EDITORIAL_OG_BACKGROUND,
    backgroundPosition: hasFeaturedPhoto ? "center 28%" : "center 45%",
    portraitImage: hasFeaturedPhoto ? undefined : official?.photo,
    visualCredit: hasFeaturedPhoto
      ? official?.featuredPhotoCredit
      : official?.photo
        ? official.photoCredit
        : "Original RepWatchr editorial artwork",
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
