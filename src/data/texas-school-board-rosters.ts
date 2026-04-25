/**
 * Texas school-board roster extension module.
 *
 * Drop new sourced districts here as object literals and they will be
 * imported automatically by `src/lib/school-board-research.ts`. No code
 * changes required outside this file.
 *
 * Schema (one entry per district):
 *
 *   {
 *     district: "Frisco ISD",                  // human-readable district name
 *     district_slug: "frisco_isd",             // snake_case unique slug
 *     county: "Collin/Denton",                 // primary county or counties
 *     sources: [                               // 1+ sources for the roster
 *       { url: "...", title: "...", source_type: "district_official" },
 *       ...
 *     ],
 *     roster: [                                // 1+ board members
 *       { full_name: "...", role: "Trustee", seat: "Place 1",
 *         term: "2024-2027", occupation: "...", summary: "..." },
 *       ...
 *     ],
 *     branding?: {                             // optional district colors
 *       primary: "#1e3a8a", secondary: "#fbbf24",
 *       accent: "#eef4ff", label: "Frisco blue and gold"
 *     },
 *     investigationNotes?: ["..."],            // optional research-gap notes
 *     queueStatus?: "dossiers_started" | "needs_full_records_pull",
 *   }
 *
 * Hard rule: every roster entry must trace back to a public source URL in
 * `sources` (district board page, election filing, news outlet, official
 * meeting record, etc.). Anonymous or unsourced rosters are not accepted.
 */

import type { SchoolBoardBranding } from "./school-board-branding";

export interface RosterMemberInput {
  full_name: string;
  role?: string;
  seat?: string;
  term?: string;
  occupation?: string;
  summary?: string;
}

export interface DistrictSourceInput {
  url: string;
  title: string;
  source_type?: "district_official" | "ballotpedia" | "news" | "education_agency" | "election_office" | "business" | "campaign_filing" | string;
  accessed_date?: string;
}

export interface DistrictRosterRecord {
  district: string;
  district_slug: string;
  county: string;
  sources: DistrictSourceInput[];
  roster: RosterMemberInput[];
  branding?: SchoolBoardBranding;
  investigationNotes?: string[];
  queueStatus?: "dossiers_started" | "needs_full_records_pull";
}

const ACCESSED_DATE = "2026-04-25";

// Helper so callers don't need to repeat accessed_date on every source.
function withAccessedDate(sources: DistrictSourceInput[]): DistrictSourceInput[] {
  return sources.map((s) => ({ accessed_date: s.accessed_date ?? ACCESSED_DATE, ...s }));
}

export const TEXAS_ROSTER_EXTENSIONS: DistrictRosterRecord[] = [
  // ---- DFW ISDs added 2026-04-25 ----
  {
    district: "Allen ISD",
    district_slug: "allen_isd",
    county: "Collin",
    sources: withAccessedDate([
      { url: "https://www.allenisd.org/Page/41", title: "Allen ISD Board of Trustees", source_type: "district_official" },
    ]),
    branding: { primary: "#dc2626", secondary: "#0f172a", accent: "#fff1f2", label: "Allen Eagles red and black" },
    roster: [
      { full_name: "Vatsa Ramanathan", role: "Board President", summary: "Listed on the Allen ISD Board of Trustees page." },
      { full_name: "Sarah Mitchell", role: "Vice President", summary: "Listed on the Allen ISD Board of Trustees page." },
      { full_name: "Amy Gnadt", role: "Secretary", summary: "Listed on the Allen ISD Board of Trustees page." },
    ],
    investigationNotes: ["Pull seat numbers, term-end dates, and the remaining 4 Allen ISD trustees."],
    queueStatus: "needs_full_records_pull",
  },
  {
    district: "McKinney ISD",
    district_slug: "mckinney_isd",
    county: "Collin",
    sources: withAccessedDate([
      { url: "https://www.mckinneyisd.net/board-of-trustees/", title: "McKinney ISD Board of Trustees", source_type: "district_official" },
    ]),
    branding: { primary: "#0f172a", secondary: "#dc2626", accent: "#fff1f2", label: "McKinney red and black" },
    roster: [
      { full_name: "Lynn Sperry", role: "Board President", summary: "Listed on the McKinney ISD Board of Trustees page." },
      { full_name: "Curtis Rippee", role: "Trustee", summary: "Listed on the McKinney ISD Board of Trustees page." },
      { full_name: "Stephanie O'Dell", role: "Trustee", summary: "Listed on the McKinney ISD Board of Trustees page." },
    ],
    investigationNotes: ["Pull seat numbers, term-end dates, and the remaining 4 McKinney ISD trustees."],
    queueStatus: "needs_full_records_pull",
  },
  {
    district: "Prosper ISD",
    district_slug: "prosper_isd",
    county: "Collin/Denton",
    sources: withAccessedDate([
      { url: "https://www.prosper-isd.net/Page/15", title: "Prosper ISD Board of Trustees", source_type: "district_official" },
    ]),
    branding: { primary: "#1e3a8a", secondary: "#facc15", accent: "#eff6ff", label: "Prosper Eagles blue and gold" },
    roster: [
      { full_name: "Drew Wilborn", role: "Board President", summary: "Listed on the Prosper ISD Board of Trustees page." },
      { full_name: "Brandon Latiolais", role: "Vice President", summary: "Listed on the Prosper ISD Board of Trustees page." },
      { full_name: "Bret Jimerson", role: "Secretary", summary: "Listed on the Prosper ISD Board of Trustees page." },
    ],
    investigationNotes: ["Pull seat numbers, term-end dates, and the remaining Prosper ISD trustees."],
    queueStatus: "needs_full_records_pull",
  },
  {
    district: "Garland ISD",
    district_slug: "garland_isd",
    county: "Dallas",
    sources: withAccessedDate([
      { url: "https://www.garlandisd.net/about/board-trustees", title: "Garland ISD Board of Trustees", source_type: "district_official" },
    ]),
    branding: { primary: "#7c2d12", secondary: "#fbbf24", accent: "#fff8ed", label: "Garland maroon and gold" },
    roster: [
      { full_name: "Linda Griffin", role: "Board President", summary: "Listed on the Garland ISD Board of Trustees page." },
      { full_name: "Robert Vera", role: "Trustee", summary: "Listed on the Garland ISD Board of Trustees page." },
    ],
    investigationNotes: ["Pull seat numbers, term-end dates, and the remaining 5 Garland ISD trustees."],
    queueStatus: "needs_full_records_pull",
  },
  {
    district: "Mesquite ISD",
    district_slug: "mesquite_isd",
    county: "Dallas",
    sources: withAccessedDate([
      { url: "https://www.mesquiteisd.org/about/leadership/board-of-trustees", title: "Mesquite ISD Board of Trustees", source_type: "district_official" },
    ]),
    branding: { primary: "#1e3a8a", secondary: "#fbbf24", accent: "#eff6ff", label: "Mesquite blue and gold" },
    roster: [
      { full_name: "Cary Cheshire", role: "Board President", summary: "Listed on the Mesquite ISD Board of Trustees page." },
    ],
    investigationNotes: ["Pull the remaining 6 Mesquite ISD trustees, seat numbers, and term-end dates."],
    queueStatus: "needs_full_records_pull",
  },
  {
    district: "Richardson ISD",
    district_slug: "richardson_isd",
    county: "Dallas/Collin",
    sources: withAccessedDate([
      { url: "https://web.risd.org/board/", title: "Richardson ISD Board of Trustees", source_type: "district_official" },
    ]),
    branding: { primary: "#dc2626", secondary: "#0f172a", accent: "#fff1f2", label: "Richardson Eagles red and black" },
    roster: [
      { full_name: "Vanessa Pacheco", role: "Board President", summary: "Listed on the Richardson ISD Board of Trustees page." },
    ],
    investigationNotes: ["Pull the remaining 6 Richardson ISD trustees, seat numbers, and term-end dates."],
    queueStatus: "needs_full_records_pull",
  },
  // ---- Houston metro ISDs ----
  {
    district: "Spring Branch ISD",
    district_slug: "spring_branch_isd",
    county: "Harris",
    sources: withAccessedDate([
      { url: "https://www.springbranchisd.com/about/leadership/board-of-trustees", title: "Spring Branch ISD Board of Trustees", source_type: "district_official" },
    ]),
    branding: { primary: "#1e3a8a", secondary: "#facc15", accent: "#eff6ff", label: "Spring Branch blue and gold" },
    roster: [
      { full_name: "Chris Earnest", role: "Board President", summary: "Listed on the Spring Branch ISD Board of Trustees page." },
      { full_name: "Caroline Bennett", role: "Vice President", summary: "Listed on the Spring Branch ISD Board of Trustees page." },
    ],
    investigationNotes: ["Pull the remaining 5 Spring Branch ISD trustees, seat numbers, and term-end dates."],
    queueStatus: "needs_full_records_pull",
  },
  {
    district: "Fort Bend ISD",
    district_slug: "fort_bend_isd",
    county: "Fort Bend",
    sources: withAccessedDate([
      { url: "https://www.fortbendisd.com/board", title: "Fort Bend ISD Board of Trustees", source_type: "district_official" },
    ]),
    branding: { primary: "#0c4a6e", secondary: "#facc15", accent: "#eef6ff", label: "Fort Bend ISD blue and gold" },
    roster: [
      { full_name: "Kristin Tassin", role: "Board President", summary: "Listed on the Fort Bend ISD Board of Trustees page." },
    ],
    investigationNotes: ["Pull the remaining 6 Fort Bend ISD trustees, seat numbers, and term-end dates."],
    queueStatus: "needs_full_records_pull",
  },
  {
    district: "Pasadena ISD",
    district_slug: "pasadena_isd",
    county: "Harris",
    sources: withAccessedDate([
      { url: "https://www1.pasadenaisd.org/about_us/board_of_trustees", title: "Pasadena ISD Board of Trustees", source_type: "district_official" },
    ]),
    branding: { primary: "#dc2626", secondary: "#1f2937", accent: "#fff1f2", label: "Pasadena ISD red and black" },
    roster: [
      { full_name: "Vickie Morgan", role: "Board President", summary: "Listed on the Pasadena ISD Board of Trustees page." },
    ],
    investigationNotes: ["Pull the remaining 6 Pasadena ISD trustees, seat numbers, and term-end dates."],
    queueStatus: "needs_full_records_pull",
  },
  {
    district: "Aldine ISD",
    district_slug: "aldine_isd",
    county: "Harris",
    sources: withAccessedDate([
      { url: "https://www.aldineisd.org/board-of-education/", title: "Aldine ISD Board of Education", source_type: "district_official" },
    ]),
    branding: { primary: "#1e3a8a", secondary: "#fbbf24", accent: "#eff6ff", label: "Aldine ISD blue and gold" },
    roster: [
      { full_name: "Steve Mead", role: "Board President", summary: "Listed on the Aldine ISD Board of Education page." },
    ],
    investigationNotes: ["Pull the remaining 6 Aldine ISD trustees, seat numbers, and term-end dates."],
    queueStatus: "needs_full_records_pull",
  },
  // ---- Central Texas ISDs ----
  {
    district: "Leander ISD",
    district_slug: "leander_isd",
    county: "Williamson/Travis",
    sources: withAccessedDate([
      { url: "https://www.leanderisd.org/board", title: "Leander ISD Board of Trustees", source_type: "district_official" },
    ]),
    branding: { primary: "#7c3aed", secondary: "#fbbf24", accent: "#faf5ff", label: "Leander ISD purple and gold" },
    roster: [
      { full_name: "Trish Bode", role: "Board President", summary: "Listed on the Leander ISD Board of Trustees page." },
    ],
    investigationNotes: ["Pull the remaining 6 Leander ISD trustees, seat numbers, and term-end dates."],
    queueStatus: "needs_full_records_pull",
  },
  {
    district: "Hays CISD",
    district_slug: "hays_cisd",
    county: "Hays",
    sources: withAccessedDate([
      { url: "https://www.hayscisd.net/Page/15", title: "Hays CISD Board of Trustees", source_type: "district_official" },
    ]),
    branding: { primary: "#dc2626", secondary: "#0f172a", accent: "#fff1f2", label: "Hays CISD red and black" },
    roster: [
      { full_name: "Esperanza Orosco", role: "Board President", summary: "Listed on the Hays CISD Board of Trustees page." },
    ],
    investigationNotes: ["Pull the remaining 6 Hays CISD trustees, seat numbers, and term-end dates."],
    queueStatus: "needs_full_records_pull",
  },
];
