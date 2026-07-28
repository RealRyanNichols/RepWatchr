import { getElectionCandidate } from "@/data/election-candidates";
import {
  REPWATCHR_EDITORIAL_OG_BACKGROUND,
  renderRepWatchrOgImage,
} from "@/lib/repwatchr-og";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") ?? "";
  const candidate = getElectionCandidate(slug);

  if (!candidate) {
    return renderRepWatchrOgImage({
      requestUrl: request.url,
      pageType: "Candidate profile",
      headline: "Open the candidate record",
      supportLine:
        "Separate official filings, independent reporting, campaign claims, and missing evidence before sharing a conclusion.",
      backgroundImage: REPWATCHR_EDITORIAL_OG_BACKGROUND,
      backgroundPosition: "center 45%",
      visualCredit: "Original RepWatchr editorial artwork",
      jurisdiction: "Texas election accountability",
      metricValue: "Review",
      metricLabel: "source status",
      path: "/elections/texas",
      badges: [
        { label: "Records", value: "Labeled", tone: "blue" },
        { label: "Claims", value: "Sourced", tone: "gold" },
      ],
    });
  }

  return renderRepWatchrOgImage({
    requestUrl: request.url,
    pageType: "Candidate profile",
    headline: "Dina Carroll: open the write-in file",
    supportLine:
      "What is independently supported, what the campaign says, and what remains unconfirmed before Marion County votes.",
    backgroundImage: "/images/races/marion-county-judge-2026-hero.webp",
    backgroundPosition: "center",
    portraitImage: candidate.portrait.src,
    visualCredit: candidate.portrait.credit,
    jurisdiction: `${candidate.jurisdiction} / ${candidate.officeSought}`,
    metricValue: candidate.sources.length,
    metricLabel: "sources reviewed",
    path: candidate.path,
    badges: [
      { label: "Ballot status", value: "Pending", tone: "gold" },
      { label: "Election", value: "Nov. 3", tone: "blue" },
    ],
  });
}
