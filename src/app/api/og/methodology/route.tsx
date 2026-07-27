import { getBillById, getIssueCategories, getRepWatchrDataStats } from "@/lib/data";
import {
  REPWATCHR_EDITORIAL_OG_BACKGROUND,
  renderRepWatchrOgImage,
} from "@/lib/repwatchr-og";

export const runtime = "nodejs";

const viewCopy = {
  methodology: {
    pageType: "Methodology",
    headline: "How the score is built.",
    supportLine: "Documented job performance, review thresholds, source rules, and visible limits.",
    path: "/methodology",
  },
  scorecards: {
    pageType: "Scorecards",
    headline: "A score must show its work.",
    supportLine: "Open the evidence, weighting, review state, and missing record behind every published grade.",
    path: "/scorecards",
  },
  votes: {
    pageType: "Vote records",
    headline: "The roll call is the receipt.",
    supportLine: "Open tracked bills, official vote rows, source links, and the scoring treatment.",
    path: "/votes",
  },
  issues: {
    pageType: "Issue tracker",
    headline: "Follow the issue through the record.",
    supportLine: "Compare public votes, source-backed positions, scorecards, and unresolved research gaps.",
    path: "/issues",
  },
  "data-reports": {
    pageType: "Data reports",
    headline: "See what is loaded—and what is not.",
    supportLine: "Coverage, sources, buildout status, and known data limits stay visible.",
    path: "/data-reports",
  },
  privacy: {
    pageType: "Privacy",
    headline: "Know how your data is handled.",
    supportLine: "Read RepWatchr's privacy, collection, use, and protection rules.",
    path: "/privacy",
  },
  terms: {
    pageType: "Terms",
    headline: "The rules for using RepWatchr.",
    supportLine: "Read the service terms, user responsibilities, and platform limits.",
    path: "/terms",
  },
  "records-response": {
    pageType: "Public records tool",
    headline: "Turn a records response into a source packet.",
    supportLine: "Submit a response for private review, safe summarization, and receipt-first follow-up.",
    path: "/tools/public-records-response",
  },
} as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const categories = getIssueCategories();
  const stats = getRepWatchrDataStats();
  const view = url.searchParams.get("view");
  const id = url.searchParams.get("id") ?? "";
  const baseCopy =
    view && view in viewCopy
      ? viewCopy[view as keyof typeof viewCopy]
      : viewCopy.methodology;
  const bill = view === "bill" && id ? getBillById(id) : undefined;
  const issue =
    (view === "issue" || view === "scorecard") && id
      ? categories.find((category) => category.id === id)
      : undefined;
  const pageType = bill
    ? "Vote record"
    : issue && view === "scorecard"
      ? "Issue scorecard"
      : issue
        ? "Issue tracker"
        : baseCopy.pageType;
  const headline = bill
    ? bill.title
    : issue
      ? `${issue.name}: open the record`
      : baseCopy.headline;
  const supportLine = bill
    ? bill.summary
    : issue
      ? issue.description
      : baseCopy.supportLine;
  const path = bill
    ? `/votes/${bill.id}`
    : issue && view === "scorecard"
      ? `/scorecards/${issue.id}`
      : issue
        ? `/issues/${issue.id}`
        : baseCopy.path;

  return renderRepWatchrOgImage({
    requestUrl: request.url,
    pageType,
    headline,
    supportLine,
    backgroundImage: REPWATCHR_EDITORIAL_OG_BACKGROUND,
    backgroundPosition: "center 45%",
    jurisdiction: "RepWatchr method and source rules",
    metricValue: categories.length,
    metricLabel: "issue lanes",
    path,
    badges: [
      { label: "Scorecards", value: stats.scoreCards, tone: "blue" },
      { label: "Vote rows", value: stats.publicVoteRecordRows.toLocaleString("en-US"), tone: "green" },
      { label: "Sources", value: stats.publicSourceUrls.toLocaleString("en-US"), tone: "gold" },
    ],
  });
}
