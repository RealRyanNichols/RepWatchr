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
    supportLine: "A Harleton-centered accountability desk for officials, records, votes, budgets, meetm«ëŒ+Š×ž®º+º$zzb¥