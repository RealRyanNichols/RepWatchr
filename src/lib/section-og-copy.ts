/**
 * What each share card says, and which numbers it leads with.
 *
 * Lives here rather than in the route file because a Next route module is
 * type-checked against a fixed set of exports, and because the smoke test has
 * to read this table to prove every page that asks for a card can get one.
 */

import {
  FOOTPRINT_COUNTIES,
  FOOTPRINT_EXPECTED_SEATS,
  FOOTPRINT_PLACES,
} from "@/lib/district-footprint";
import { getRepWatchrDataStats } from "@/lib/data";
import { getSchoolBoardStats } from "@/lib/school-board-research";
import type { RepWatchrOgBadge } from "@/lib/repwatchr-og";

type Stats = ReturnType<typeof getRepWatchrDataStats>;
type SchoolStats = ReturnType<typeof getSchoolBoardStats>;

type SectionCopy = {
  pageType: string;
  headline: string;
  supportLine: string;
  jurisdiction: string;
  path: string;
  /** The one number the card leads with, and what it counts. */
  metric: (stats: Stats, school: SchoolStats) => { value: number; label: string };
  badges: (stats: Stats, school: SchoolStats) => RepWatchrOgBadge[];
};

const n = (value: number) => value.toLocaleString("en-US");

export const SECTION_COPY: Record<string, SectionCopy> = {
  home: {
    pageType: "Public accountability",
    headline: "Know who holds power.",
    supportLine: "Open the votes, money, reporting, public questions, and source links behind the office.",
    jurisdiction: "United States / Texas-first buildout",
    path: "/",
    metric: (s) => ({ value: s.officialFiles, label: "official files" }),
    badges: (s, school) => [
      { label: "School profiles", value: n(school.candidates), tone: "blue" },
      { label: "Vote rows", value: n(s.publicVoteRecordRows), tone: "green" },
      { label: "Source links", value: n(s.publicSourceUrls), tone: "gold" },
    ],
  },

  officials: {
    pageType: "Officials directory",
    headline: "Find the official. Open the record.",
    supportLine: "Search sourced elected-official profiles across federal, state, county, city, and school-board offices.",
    jurisdiction: "National elected-official directory",
    path: "/officials",
    metric: (s) => ({ value: s.officialFiles, label: "official profiles" }),
    badges: (s) => [
      { label: "With sources", value: n(s.officialsWithSourceLinks), tone: "blue" },
      { label: "With photos", value: n(s.officialsWithPhotos), tone: "green" },
      { label: "Counties", value: n(s.counties), tone: "gold" },
    ],
  },

  coverage: {
    pageType: "Coverage map",
    headline: "What we cover, and what we do not.",
    supportLine: "The beat runs HD-7 and TX-01 first, then East Texas, then Texas, with the gaps named out loud.",
    jurisdiction: "RepWatchr coverage tiers",
    path: "/coverage",
    metric: (s) => ({ value: s.nationalFederalStateCompletionPercent, label: "percent federal and state" }),
    badges: (s) => [
      { label: "Loaded", value: n(s.federalAndStateOfficeProfilesLoaded), tone: "green" },
      { label: "Still missing", value: n(s.nationalFederalStateOfficialGaps), tone: "red" },
      { label: "Counties", value: n(s.counties), tone: "gold" },
    ],
  },

  "state-reps": {
    pageType: "State legislatures",
    headline: "Your statehouse, on the record.",
    supportLine: "Find state representatives and senators, then inspect the sources behind each public profile.",
    jurisdiction: "United States state legislatures",
    path: "/state-reps",
    metric: (s) => ({ value: s.stateLegislatorProfilesLoaded, label: "state legislators" }),
    badges: (s) => [
      { label: "With vote records", value: n(s.stateLegislatorProfilesWithVoteRecords), tone: "green" },
      { label: "Vote rows", value: n(s.publicVoteRecordRows), tone: "blue" },
      { label: "Legislatures", value: n(s.stateLegislatureJurisdictionsLoaded), tone: "gold" },
    ],
  },

  about: {
    pageType: "About RepWatchr",
    headline: "Accountability needs receipts.",
    supportLine: "RepWatchr separates verified public records, reporting, opinion, and unfinished research.",
    jurisdiction: "How RepWatchr works",
    path: "/about",
    metric: (s) => ({ value: s.publicSourceUrls, label: "source links" }),
    badges: (s) => [
      { label: "Profiles", value: n(s.officialFiles), tone: "blue" },
      { label: "Articles", value: n(s.newsArticles), tone: "gold" },
      { label: "Needs review", value: n(s.needsSourceReviewOfficialProfiles), tone: "red" },
    ],
  },

  authority: {
    pageType: "Authority watch",
    headline: "Power deserves a public record.",
    supportLine: "Track the people and institutions that make consequential public decisions.",
    jurisdiction: "Public authority profiles",
    path: "/authority-watch",
    metric: (s) => ({ value: s.publicPowerProfiles, label: "authority profiles" }),
    badges: (s) => [
      { label: "Attorneys", value: n(s.attorneyWatchProfiles), tone: "blue" },
      { label: "Public safety", value: n(s.publicSafetyWatchProfiles), tone: "red" },
      { label: "Newsrooms", value: n(s.mediaWatchProfiles), tone: "gold" },
    ],
  },

  attorneys: {
    pageType: "Attorney watch",
    headline: "Open the legal power record.",
    supportLine: "Inspect sourced attorney, law-firm, court, and disciplinary record lanes without unsupported claims.",
    jurisdiction: "Public legal-system profiles",
    path: "/attorneys",
    metric: (s) => ({ value: s.attorneyWatchProfiles, label: "attorney and firm profiles" }),
    badges: (s) => [
      { label: "Source links", value: n(s.publicPowerSourceUrls), tone: "blue" },
      { label: "Authority profiles", value: n(s.publicPowerProfiles), tone: "gold" },
      { label: "Needs buildout", value: n(s.publicPowerProfilesNeedingBuildout), tone: "red" },
    ],
  },

  media: {
    pageType: "Media watch",
    headline: "Who shapes the public story?",
    supportLine: "Inspect newsroom, ownership, correction, sourcing, and public-coverage records.",
    jurisdiction: "National media accountability",
    path: "/media",
    metric: (s) => ({ value: s.mediaWatchProfiles, label: "newsroom profiles" }),
    badges: (s) => [
      { label: "Articles filed", value: n(s.newsArticles), tone: "gold" },
      { label: "Article sources", value: n(s.newsSourceUrls), tone: "blue" },
      { label: "Authority profiles", value: n(s.publicPowerProfiles), tone: "green" },
    ],
  },

  "public-safety": {
    pageType: "Public safety watch",
    headline: "Authority. Force. Public receipts.",
    supportLine: "Inspect agency, sheriff, police, prosecutor, court, and oversight record lanes.",
    jurisdiction: "Public-safety accountability",
    path: "/public-safety",
    metric: (s) => ({ value: s.publicSafetyWatchProfiles, label: "public-safety profiles" }),
    badges: (s) => [
      { label: "Source links", value: n(s.publicPowerSourceUrls), tone: "blue" },
      { label: "Authority profiles", value: n(s.publicPowerProfiles), tone: "gold" },
      { label: "Needs buildout", value: n(s.publicPowerProfilesNeedingBuildout), tone: "red" },
    ],
  },

  "predator-watch": {
    pageType: "Registry watch",
    headline: "Open the official registry source.",
    supportLine: "Public-safety records, source freshness, status, and correction paths for East Texas.",
    jurisdiction: "East Texas public-safety records",
    path: "/east-texas-predator-watch",
    metric: () => ({ value: FOOTPRINT_COUNTIES.length, label: "counties in the footprint" }),
    badges: (s) => [
      { label: "Towns tracked", value: n(FOOTPRINT_PLACES.length), tone: "gold" },
      { label: "Public-safety profiles", value: n(s.publicSafetyWatchProfiles), tone: "red" },
      { label: "Source links", value: n(s.publicPowerSourceUrls), tone: "blue" },
    ],
  },

  "east-texas": {
    pageType: "East Texas desk",
    headline: "Every local office. No free passes.",
    supportLine: "A local accountability desk for officials, records, votes, budgets, meetings, and sources.",
    jurisdiction: "HD-7 and TX-01, then wider East Texas",
    path: "/east-texas",
    metric: () => ({ value: FOOTPRINT_COUNTIES.length, label: "counties on the desk" }),
    badges: (s, school) => [
      { label: "Towns", value: n(FOOTPRINT_PLACES.length), tone: "gold" },
      { label: "County and city files", value: n(s.countyCityOfficialFiles), tone: "blue" },
      { label: "School districts", value: n(school.districts), tone: "green" },
    ],
  },

  "home-district": {
    pageType: "The beat",
    headline: "HD-7 and TX-01 come first.",
    supportLine: "The two districts this desk covers before anything else, with the county list and its provenance.",
    jurisdiction: "Texas House District 7 and Texas's 1st congressional district",
    path: "/home-district",
    metric: () => ({ value: FOOTPRINT_COUNTIES.length, label: "counties in the beat" }),
    badges: () => [
      { label: "Districts", value: "2", tone: "red" },
      { label: "Towns", value: n(FOOTPRINT_PLACES.length), tone: "gold" },
      { label: "Expected seats", value: n(FOOTPRINT_EXPECTED_SEATS), tone: "blue" },
    ],
  },

  "home-district-roster": {
    pageType: "Seat ledger",
    headline: "Every seat. Filled or still open.",
    supportLine: "The elected-office slate for every county and town in the footprint, including what is missing.",
    jurisdiction: "HD-7 and TX-01 seat ledger",
    path: "/home-district/roster",
    metric: () => ({ value: FOOTPRINT_EXPECTED_SEATS, label: "seats in the footprint" }),
    badges: (s) => [
      { label: "Counties", value: n(FOOTPRINT_COUNTIES.length), tone: "blue" },
      { label: "Towns", value: n(FOOTPRINT_PLACES.length), tone: "gold" },
      { label: "County and city files", value: n(s.countyCityOfficialFiles), tone: "green" },
    ],
  },

  "sales-rep-signal": {
    pageType: "Consent-first pilot",
    headline: "Sales signals, submitted by you.",
    supportLine: "An opt-in profile review pilot. Not a background check or employment decision tool.",
    jurisdiction: "RepWatchr tools",
    path: "/tools/sales-rep-signal",
    metric: () => ({ value: 100, label: "percent opt-in" }),
    badges: () => [
      { label: "Consent", value: "Required", tone: "green" },
      { label: "Employment use", value: "No", tone: "red" },
      { label: "Correction path", value: "Open", tone: "blue" },
    ],
  },

  vendortrust: {
    pageType: "VendorTrust",
    headline: "Check the public signals first.",
    supportLine: "Review license, registry, complaint, and proof status before a local purchase or appointment.",
    jurisdiction: "RepWatchr tools",
    path: "/tools/vendortrust",
    metric: () => ({ value: FOOTPRINT_PLACES.length, label: "towns in range" }),
    badges: () => [
      { label: "Counties", value: n(FOOTPRINT_COUNTIES.length), tone: "blue" },
      { label: "Signals checked", value: "Public only", tone: "gold" },
      { label: "Verdicts", value: "None", tone: "slate" },
    ],
  },
};

/** Page keys this route can draw. The smoke test reads this. */
export const SECTION_KEYS = Object.keys(SECTION_COPY);

/**
 * A badge reading zero advertises an empty shelf.
 *
 * Every card used to carry "Red flags 0" because red-flag items are not
 * published yet, on all fifteen. A count that is genuinely zero is worth
 * saying on a page, where it has context; on a share card it is three words
 * of wasted space that undersell the rest.
 */
export function withoutZeros(badges: RepWatchrOgBadge[]) {
  const kept = badges.filter((badge) => String(badge.value).replace(/[^0-9]/g, "") !== "0" || Number.isNaN(Number(badge.value)));
  return kept.length > 0 ? kept : badges.slice(0, 1);
}
