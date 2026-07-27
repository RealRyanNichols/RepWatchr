import { getRepWatchrDataStats } from "@/lib/data";
import { getSchoolBoardStats } from "@/lib/school-board-research";
import {
  REPWATCHR_EDITORIAL_OG_BACKGROUND,
  renderRepWatchrOgImage,
} from "@/lib/repwatchr-og";

export const runtime = "nodejs";

const pageCopy = {
  home: {
    pageType: "Public accountability",
    headline: "Know who holds power.",
    supportLine: "Open the votes, money, reporting, public questions, and source links behind the office.",
    jurisdiction: "United States / Texas-first buildout",
    path: "/",
  },
  officials: {
    pageType: "Officials directory",
    headline: "Find the official. Open the record.",
    supportLine: "Search sourced elected-official profiles across federal, state, county, city, and school-board offices.",
    jurisdiction: "National elected-official directory",
    path: "/officials",
  },
  "state-reps": {
    pageType: "State legislatures",
    headline: "Your statehouse, on the record.",
    supportLine: "Find state representatives and senators, then inspect the sources behind each public profile.",
    jurisdiction: "United States state legislatures",
    path: "/state-reps",
  },
  about: {
    pageType: "About RepWatchr",
    headline: "Accountability needs receipts.",
    supportLine: "RepWatchr separates verified public records, reporting, opinion, and unfinished research.",
    jurisdiction: "How RepWatchr works",
    path: "/about",
  },
  authority: {
    pageType: "Authority watch",
    headline: "Power deserves a public record.",
    supportLine: "Track the people and institutions that make consequential public decisions.",
    jurisdiction: "Public authority profiles",
    path: "/authority-watch",
  },
  attorneys: {
    pageType: "Attorney watch",
    headline: "Open the legal power record.",
    supportLine: "Inspect sourced attorney, law-firm, court, and disciplinary record lanes without unsupported claims.",
    jurisdiction: "Public legal-system profiles",
    path: "/attorneys",
  },
  media: {
    pageType: "Media watch",
    headline: "Who shapes the public story?",
    supportLine: "Inspect newsroom, ownership, correction, sourcing, and public-coverage records.",
    jurisdiction: "National media accountability",
    path: "/media",
  },
  "public-safety": {
    pageType: "Public safety watch",
    headline: "Authority. Force. Public receipts.",
    supportLine: "Inspect agency, sheriff, police, prosecutor, court, and oversight record lanes.",
    jurisdiction: "Public-safety accountability",
    path: "/public-safety",
  },
  "predator-watch": {
    pageType: "Registry watch",
    headline: "Open the official registry source.",
    supportLine: "Public-safety records, source freshness, status, and correction paths for East Texas.",
    jurisdiction: "East Texas public-safety records",
    path: "/east-texas-predator-watch",
  },
  "east-texas": {
    pageType: "East Texas desk",
    headline: "Every local office. No free passes.",
    supportLine: "A Harleton-centered accountability desk for officials, records, votes, budgets, meetings, and sources.",
    jurisdiction: "Within 75 road miles of Harleton, Texas",
    path: "/east-texas",
  },
  "sales-rep-signal": {
    pageType: "Consent-first pilot",
    headline: "Sales signals, submitted by you.",
    supportLine: "An opt-in profile review pilot. Not a background check or employment decision tool.",
    jurisdiction: "RepWatchr tools",
    path: "/tools/sales-rep-signal",
  },
  vendortrust: {
    pageType: "VendorTrust",
    headline: "Check the public signals first.",
    supportLine: "Review license, registry, complaint, and proof status before a local purchase or appointment.",
    jurisdiction: "RepWatchr tools",
    path: "/tools/vendortrust",
  },
} as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const stats = getRepWatchrDataStats();
  const schoolBoards = getSchoolBoardStats();
  const page = url.searchParams.get("page") as keyof typeof pageCopy | null;
  const copy = page && page in pageCopy ? pageCopy[page] : pageCopy.home;

  return renderRepWatchrOgImage({
    requestUrl: request.url,
    pageType: copy.pageType,
    headline: copy.headline,
    supportLine: copy.supportLine,
    backgroundImage: REPWATCHR_EDITORIAL_OG_BACKGROUND,
    backgroundPosition: "center 45%",
    jurisdiction: copy.jurisdiction,
    metricValue: stats.officialFiles.toLocaleString("en-US"),
    metricLabel: "official files",
    path: copy.path,
    badges: [
      { label: "School profiles", value: schoolBoards.candidates.toLocaleString("en-US"), tone: "blue" },
      { label: "Vote rows", value: stats.publicVoteRecordRows.toLocaleString("en-US"), tone: "green" },
      { label: "Red flags", value: stats.redFlagItems.toLocaleString("en-US"), tone: "red" },
    ],
  });
}
