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
      { url: "https://www.allenisd.org/page/board-of-trustees", title: "Allen ISD Board of Trustees", source_type: "district_official" },
    ]),
    branding: { primary: "#dc2626", secondary: "#0f172a", accent: "#fff1f2", label: "Allen Eagles red and black" },
    roster: [
      { full_name: "John Montgomery", role: "Board President", summary: "Listed as Allen ISD Board President per the official board page." },
      { full_name: "Amy Gnadt", role: "Vice President", summary: "Listed as Allen ISD Vice President per the official board page." },
      { full_name: "Kelley Rowley", role: "Secretary", summary: "Listed as Allen ISD Secretary per the official board page." },
      { full_name: "Louise Master", role: "Trustee", summary: "Listed on the Allen ISD Board of Trustees page." },
      { full_name: "Vatsa Ramanathan", role: "Trustee", summary: "Listed on the Allen ISD Board of Trustees page; previously resigned in 2022 after the redistricting vote, later returned." },
      { full_name: "David Noll", role: "Trustee", summary: "Listed on the Allen ISD Board of Trustees page." },
      { full_name: "Sarah Mitchell", role: "Trustee", summary: "Listed on the Allen ISD Board of Trustees page." },
    ],
    investigationNotes: ["Confirm Place numbers (Allen ISD uses Places 1-7) and current term-end dates for each trustee."],
    queueStatus: "dossiers_started",
  },
  {
    district: "McKinney ISD",
    district_slug: "mckinney_isd",
    county: "Collin",
    sources: withAccessedDate([
      { url: "https://www.mckinneyisd.net/page/board-of-trustees", title: "McKinney ISD Board of Trustees", source_type: "district_official" },
      { url: "https://communityimpact.com/dallas-fort-worth/mckinney/education/2025/09/16/get-to-know-the-newest-mckinney-isd-school-board-trustees-corey-homer-and-kenneth-ussery/", title: "Community Impact — McKinney ISD newest trustees (Sept 2025)", source_type: "news" },
    ]),
    branding: { primary: "#0f172a", secondary: "#dc2626", accent: "#fff1f2", label: "McKinney red and black" },
    roster: [
      { full_name: "Amy Dankel", role: "Board President", seat: "Place 4", term: "May 2023 - May 2027", summary: "Listed as McKinney ISD Board President." },
      { full_name: "Harvey Oaxaca", role: "Vice President", seat: "Place 7", term: "May 2025 - May 2029", summary: "Listed as McKinney ISD Vice President; sworn in May 2025." },
      { full_name: "Corey Homer", role: "Secretary", seat: "Place 5", term: "May 2025 - May 2029", summary: "Listed as McKinney ISD Secretary; sworn in May 2025." },
      { full_name: "Larry Jagours", role: "Trustee", seat: "Place 1", term: "May 2025 - May 2029", summary: "Sworn in to Place 1 in May 2025." },
      { full_name: "Kenneth Ussery", role: "Trustee", seat: "Place 2", term: "May 2025 - May 2029", summary: "Sworn in to Place 2 in May 2025." },
      { full_name: "Stephanie O'Dell", role: "Trustee", seat: "Place 6", term: "May 2023 - May 2027", summary: "Listed on the McKinney ISD Board of Trustees page." },
    ],
    investigationNotes: ["Confirm the Place 3 trustee name (term began May 2025, expires May 2029) — name not surfaced in initial reporting."],
    queueStatus: "dossiers_started",
  },
  {
    district: "Prosper ISD",
    district_slug: "prosper_isd",
    county: "Collin/Denton",
    sources: withAccessedDate([
      { url: "https://www.prosper-isd.net/page/prosper-isd-board-of-trustees", title: "Prosper ISD Board of Trustees", source_type: "district_official" },
      { url: "https://starlocalmedia.com/checkout/prosper/election-2025-incumbents-maintain-seats-for-prosper-isd/article_82d52a3c-cb6a-4f46-81cd-98c4e209ea5c.html", title: "Star Local Media — Prosper ISD May 2025 election", source_type: "news" },
    ]),
    branding: { primary: "#1e3a8a", secondary: "#facc15", accent: "#eff6ff", label: "Prosper Eagles blue and gold" },
    roster: [
      { full_name: "Drew Wilborn", role: "Board President", summary: "Listed on the Prosper ISD Board of Trustees page." },
      { full_name: "Brandon Latiolais", role: "Vice President", summary: "Listed on the Prosper ISD Board of Trustees page." },
      { full_name: "Bret Jimerson", role: "Secretary", summary: "Listed on the Prosper ISD Board of Trustees page." },
      { full_name: "Jorden Dial", role: "Trustee", seat: "Place 1", summary: "Won Prosper ISD Place 1 unopposed in May 2025." },
      { full_name: "Dena Dixon", role: "Trustee", seat: "Place 2", summary: "Listed as Prosper ISD Place 2 trustee." },
      { full_name: "Cavender", role: "Trustee", seat: "Place 3", summary: "Retained Prosper ISD Place 3 in May 2025 (incumbent)." },
      { full_name: "Linker", role: "Trustee", seat: "Place 6", summary: "Retained Prosper ISD Place 6 in May 2025 (incumbent)." },
    ],
    investigationNotes: ["Pull full first names for Cavender (Place 3) and Linker (Place 6) and confirm officer-position seats for Wilborn / Latiolais / Jimerson."],
    queueStatus: "dossiers_started",
  },
  {
    district: "Garland ISD",
    district_slug: "garland_isd",
    county: "Dallas",
    sources: withAccessedDate([
      { url: "https://www.garlandisd.net/about/board-trustees", title: "Garland ISD Board of Trustees", source_type: "district_official" },
      { url: "https://www.dallascounty.org/Assets/uploads/docs/tax/tnt/board-members/isd/2025/Garland_ISD_GB_2025.pdf", title: "Dallas County 2025-2026 Garland ISD Board Members", source_type: "election_office" },
    ]),
    branding: { primary: "#7c2d12", secondary: "#fbbf24", accent: "#fff8ed", label: "Garland maroon and gold" },
    roster: [
      { full_name: "Johnny Beach", role: "Board President", summary: "Listed as 2025-2026 President per Dallas County tax records." },
      { full_name: "Wes Johnson", role: "Vice President", summary: "Listed as 2025-2026 Vice President per Dallas County tax records." },
      { full_name: "Daphne Stanley", role: "Secretary", summary: "Listed as 2025-2026 Secretary per Dallas County tax records." },
      { full_name: "Jamie Miller", role: "Assistant Secretary", summary: "Listed as 2025-2026 Assistant Secretary per Dallas County tax records." },
      { full_name: "Larry H. Glick", role: "Trustee", summary: "Listed as 2025-2026 trustee per Dallas County tax records." },
      { full_name: "Linda L. Griffin", role: "Trustee", summary: "Listed as 2025-2026 trustee per Dallas County tax records." },
      { full_name: "Robert Selders Jr.", role: "Trustee", summary: "Listed as 2025-2026 trustee per Dallas County tax records." },
    ],
    investigationNotes: ["Confirm at-large place numbers and three-year term-end dates for each Garland ISD trustee."],
    queueStatus: "dossiers_started",
  },
  {
    district: "Mesquite ISD",
    district_slug: "mesquite_isd",
    county: "Dallas",
    sources: withAccessedDate([
      { url: "https://www.mesquiteisd.org/board", title: "Mesquite ISD Board of Trustees", source_type: "district_official" },
    ]),
    branding: { primary: "#1e3a8a", secondary: "#fbbf24", accent: "#eff6ff", label: "Mesquite blue and gold" },
    roster: [
      { full_name: "Robert Seward", role: "Board President", summary: "Listed as Board President per Mesquite ISD board records." },
      { full_name: "Kevin Carbó", role: "Vice President", summary: "Listed as Vice President per Mesquite ISD board records." },
      { full_name: "Greg Everett", role: "Trustee", summary: "Listed as a trustee per Mesquite ISD board records." },
      { full_name: "Gary Bingham", role: "Trustee", summary: "Listed as a trustee per Mesquite ISD board records." },
      { full_name: "Elaine Hornsby", role: "Trustee", summary: "Listed as a trustee per Mesquite ISD board records." },
    ],
    investigationNotes: ["Pull the remaining 2 Mesquite ISD trustees, place numbers, and term-end dates."],
    queueStatus: "needs_full_records_pull",
  },
  {
    district: "Richardson ISD",
    district_slug: "richardson_isd",
    county: "Dallas/Collin",
    sources: withAccessedDate([
      { url: "https://web.risd.org/board/", title: "Richardson ISD Board of Trustees", source_type: "district_official" },
      { url: "https://citizenportal.ai/articles/6545372/Richardson-ISD-board-reorganizes-Poteet-re-elected-president-McGowan-vice-president-Renteria-secretary", title: "RISD board reorganizes — Poteet re-elected President", source_type: "news" },
    ]),
    branding: { primary: "#dc2626", secondary: "#0f172a", accent: "#fff1f2", label: "Richardson Eagles red and black" },
    roster: [
      { full_name: "Chris Poteet", role: "Board President", seat: "At-Large Place 7", summary: "Re-elected RISD board president unanimously." },
      { full_name: "Rachel McGowan", role: "Vice President", seat: "Single-Member District 5", summary: "Elected RISD Vice President unanimously." },
      { full_name: "Debbie Rentería", role: "Secretary", seat: "Single-Member District 3", summary: "Elected RISD Secretary unanimously." },
      { full_name: "Megan Timme", role: "Trustee", seat: "Single-Member District 1", summary: "Listed on the RISD Board Members page." },
      { full_name: "Vanessa Pacheco", role: "Trustee", seat: "Single-Member District 2", summary: "Listed on the RISD Board Members page." },
      { full_name: "Regina Harris", role: "Trustee", seat: "Single-Member District 4", summary: "Listed on the RISD Board Members page." },
      { full_name: "Eric Eager", role: "Trustee", seat: "At-Large", summary: "Listed on the RISD Board Members page." },
    ],
    investigationNotes: ["Confirm three-year term-end dates and committee assignments for each RISD trustee."],
    queueStatus: "dossiers_started",
  },
  // ---- Houston metro ISDs ----
  {
    district: "Spring Branch ISD",
    district_slug: "spring_branch_isd",
    county: "Harris",
    sources: withAccessedDate([
      { url: "https://www.springbranchisd.com/about/board-of-trustees", title: "Spring Branch ISD Board of Trustees", source_type: "district_official" },
      { url: "https://resources.finalsite.net/images/v1747247577/springbranchisdcom/irfg02s8an5ftfvks1y9/Board_Members_2025_26.pdf", title: "Spring Branch ISD 2025-26 Board Members PDF", source_type: "district_official" },
    ]),
    branding: { primary: "#1e3a8a", secondary: "#facc15", accent: "#eff6ff", label: "Spring Branch blue and gold" },
    roster: [
      { full_name: "Shannon Mahan", role: "Board President", seat: "Position 2", term: "Term expires May 2026", summary: "Listed as 2025-26 SBISD Board President." },
      { full_name: "Caroline H. Bennett", role: "Vice President", seat: "Position 7", term: "Term expires May 2028", summary: "Listed as 2025-26 SBISD Vice President." },
      { full_name: "Walker Agnew Jr.", role: "Secretary", seat: "Position 6", term: "Term expires May 2028", summary: "Listed as 2025-26 SBISD Secretary." },
      { full_name: "Courtney Anderson", role: "Trustee", seat: "Position 1", term: "Term expires May 2026", summary: "Listed as a 2025-26 SBISD trustee." },
      { full_name: "David Slattery", role: "Trustee", seat: "Position 3", term: "Term expires May 2027", summary: "Listed as a 2025-26 SBISD trustee." },
      { full_name: "Jennifer Hyland", role: "Trustee", seat: "Position 5", term: "May 2025 - May 2028", summary: "Listed as a 2025-26 SBISD trustee." },
    ],
    investigationNotes: ["Pull the remaining 1 Spring Branch ISD trustee (Position 4) and confirm any 2026 election filings for Position 1 and Position 2."],
    queueStatus: "dossiers_started",
  },
  {
    district: "Fort Bend ISD",
    district_slug: "fort_bend_isd",
    county: "Fort Bend",
    sources: withAccessedDate([
      { url: "https://www.fortbendisd.com/board", title: "Fort Bend ISD Board of Trustees", source_type: "district_official" },
      { url: "https://communityimpact.com/houston/sugar-land-missouri-city/election/2025/05/03/afshi-charania-angie-wierzbicki-win-fort-bend-isd-trustee-races/", title: "Community Impact — Fort Bend ISD May 2025 election", source_type: "news" },
    ]),
    branding: { primary: "#0c4a6e", secondary: "#facc15", accent: "#eef6ff", label: "Fort Bend ISD blue and gold" },
    roster: [
      { full_name: "Kristin K. Tassin", role: "Board President", summary: "Listed as Fort Bend ISD Board President per the official board page." },
      { full_name: "Dr. Shirley Rose-Gilliam", role: "Vice President", summary: "Listed as Fort Bend ISD Board Vice President per the official board page." },
      { full_name: "Afshi Charania", role: "Trustee", seat: "Position 3", summary: "Unseated incumbent Rick Garcia for Position 3 in May 2025." },
      { full_name: "Angie Wierzbicki", role: "Trustee", seat: "Position 7", summary: "Won Position 7 in May 2025; succeeded David Hamilton, who did not seek re-election." },
      { full_name: "Addie Heyliger", role: "Trustee", summary: "Returned to Fort Bend ISD board in September 2025; previously served as Board President from November 2020 to May 2021." },
    ],
    investigationNotes: ["Pull the remaining 2 Fort Bend ISD trustees, seat numbers, and term-end dates for the full 7-member board."],
    queueStatus: "dossiers_started",
  },
  {
    district: "Pasadena ISD",
    district_slug: "pasadena_isd",
    county: "Harris",
    sources: withAccessedDate([
      { url: "https://www.pasadenaisd.org/pisdboard2025-26", title: "Pasadena ISD Board of Trustees 2025-26 Leadership", source_type: "district_official" },
      { url: "https://www.pasadenaisd.org/boardoftrustees", title: "Pasadena ISD Board of Trustees", source_type: "district_official" },
    ]),
    branding: { primary: "#dc2626", secondary: "#1f2937", accent: "#fff1f2", label: "Pasadena ISD red and black" },
    roster: [
      { full_name: "Kenny Fernandez", role: "Board President", summary: "Listed as 2025-2026 Pasadena ISD Board President." },
      { full_name: "Casey Phelan", role: "Vice President", summary: "Listed as 2025-2026 Pasadena ISD Vice President." },
      { full_name: "Marshall Kendrick", role: "Secretary", summary: "Listed as 2025-2026 Pasadena ISD Secretary." },
      { full_name: "Nelda Sullivan", role: "Assistant Secretary", summary: "Listed as 2025-2026 Pasadena ISD Assistant Secretary." },
      { full_name: "Joe Campos", role: "Trustee", summary: "Listed as a 2025-2026 Pasadena ISD trustee." },
      { full_name: "Crystal Davila", role: "Trustee", summary: "Listed as a 2025-2026 Pasadena ISD trustee." },
      { full_name: "Paola Gonzalez", role: "Trustee", summary: "Listed as a 2025-2026 Pasadena ISD trustee." },
    ],
    investigationNotes: ["Confirm at-large position numbers and four-year term-end dates for each Pasadena ISD trustee."],
    queueStatus: "dossiers_started",
  },
  {
    district: "Aldine ISD",
    district_slug: "aldine_isd",
    county: "Harris",
    sources: withAccessedDate([
      { url: "https://www.aldineisd.org/about/school-board/", title: "Aldine ISD School Board", source_type: "district_official" },
      { url: "https://www.aldineisd.org/2025/11/19/aldine-isd-welcomes-3-new-board-members-after-november-election/", title: "Aldine ISD welcomes 3 new board members after Nov 2025 election", source_type: "district_official" },
    ]),
    branding: { primary: "#1e3a8a", secondary: "#fbbf24", accent: "#eff6ff", label: "Aldine ISD blue and gold" },
    roster: [
      { full_name: "Dr. Kimberly Booker", role: "Board President", summary: "Listed as Aldine ISD Board President." },
      { full_name: "Connie Esparza", role: "Vice President", summary: "Listed as Aldine ISD Vice President." },
      { full_name: "Steve Mead", role: "Secretary", summary: "Listed as Aldine ISD Secretary." },
      { full_name: "Rose Avalos", role: "Assistant Secretary", summary: "Listed as Aldine ISD Assistant Secretary." },
      { full_name: "Dr. Viola M. García", role: "Trustee", summary: "Listed on the Aldine ISD Board of Trustees." },
      { full_name: "Randy Bates", role: "Trustee", summary: "Listed on the Aldine ISD Board of Trustees." },
      { full_name: "Paul Shanklin", role: "Trustee", summary: "Listed on the Aldine ISD Board of Trustees." },
      { full_name: "Nataly Pérez", role: "Trustee", seat: "Position 5", summary: "Newly elected and sworn in November 2025." },
      { full_name: "Steve Moore", role: "Trustee", seat: "Position 4", summary: "Newly elected and sworn in November 2025." },
      { full_name: "Angela Williams", role: "Trustee", seat: "Position 3", summary: "Newly elected and sworn in November 2025." },
    ],
    investigationNotes: ["Reconcile the November 2025 trustee swearing-in (Pérez P5, Moore P4, Williams P3) against the prior board roster — three of the named members may have been replaced."],
    queueStatus: "dossiers_started",
  },
  // ---- Central Texas ISDs ----
  {
    district: "Leander ISD",
    district_slug: "leander_isd",
    county: "Williamson/Travis",
    sources: withAccessedDate([
      { url: "https://www.leanderisd.org/boardoftrustees/", title: "Leander ISD Board of Trustees", source_type: "district_official" },
      { url: "https://news.leanderisd.org/a-message-from-lisds-board-of-trustees-executive-officers/", title: "Leander ISD — Message from Board Executive Officers", source_type: "district_official" },
    ]),
    branding: { primary: "#7c3aed", secondary: "#fbbf24", accent: "#faf5ff", label: "Leander ISD purple and gold" },
    roster: [
      { full_name: "Gloria Gonzales-Dholakia", role: "Board President", seat: "Place 2", term: "Nov 2022 - Nov 2026", summary: "Elected Leander ISD Board President per the executive officers announcement." },
      { full_name: "Anna Smith", role: "Vice President", seat: "Place 4", term: "Nov 2024 - Nov 2028", summary: "Elected Leander ISD Vice President per the executive officers announcement." },
      { full_name: "Sade Fashokun", role: "Secretary", seat: "Place 5", term: "Nov 2024 - Nov 2028", summary: "Elected Leander ISD Secretary per the executive officers announcement." },
      { full_name: "Trish Bode", role: "Trustee", seat: "Place 1", term: "Nov 2022 - Nov 2026", summary: "Listed on the Leander ISD Board of Trustees page." },
      { full_name: "Nekosi Nelson", role: "Trustee", seat: "Place 3", term: "Nov 2024 - Nov 2028", summary: "Listed on the Leander ISD Board of Trustees page." },
      { full_name: "Laura Marques", role: "Trustee", seat: "Place 6", term: "Nov 2025 - Nov 2026", summary: "Listed on the Leander ISD Board of Trustees page." },
      { full_name: "Paul Gauthier", role: "Trustee", seat: "Place 7", term: "Nov 2022 - Nov 2026", summary: "Listed on the Leander ISD Board of Trustees page." },
    ],
    investigationNotes: ["Confirm Place 6 short-term seat (Nov 2025 - Nov 2026) — likely an appointment to fill a vacancy."],
    queueStatus: "dossiers_started",
  },
  {
    district: "Hays CISD",
    district_slug: "hays_cisd",
    county: "Hays",
    sources: withAccessedDate([
      { url: "https://www.hayscisd.net/board", title: "Hays CISD Board of Trustees", source_type: "district_official" },
      { url: "https://www.hayscisd.net/o/hhs/article/2211502", title: "Hays CISD — Board Members Swear-In and Officer Elections", source_type: "district_official" },
    ]),
    branding: { primary: "#dc2626", secondary: "#0f172a", accent: "#fff1f2", label: "Hays CISD red and black" },
    roster: [
      { full_name: "Byron Severance", role: "Board President", summary: "Elected Hays CISD Board President for 2025-2026." },
      { full_name: "Johnny Flores", role: "Vice President", summary: "Elected Hays CISD Vice President for 2025-2026." },
      { full_name: "Geoff Seibel", role: "Secretary", summary: "Elected Hays CISD Secretary for 2025-2026." },
      { full_name: "Esperanza Orosco", role: "Trustee", summary: "Listed on the Hays CISD Board of Trustees." },
      { full_name: "Raul Vela Jr.", role: "Trustee", summary: "Listed on the Hays CISD Board of Trustees." },
      { full_name: "Courtney Runkle", role: "Trustee", summary: "Listed on the Hays CISD Board of Trustees." },
      { full_name: "Vanessa Petrea", role: "Trustee", summary: "Listed on the Hays CISD Board of Trustees." },
    ],
    investigationNotes: ["Confirm single-member-district vs at-large designation for each Hays CISD trustee."],
    queueStatus: "dossiers_started",
  },
  // ---- Wave 2 (DFW) ----
  {
    district: "Carrollton-Farmers Branch ISD",
    district_slug: "carrollton_farmers_branch_isd",
    county: "Dallas/Denton",
    sources: withAccessedDate([
      { url: "https://www.cfbisd.edu/about-us/board-of-trustees", title: "Carrollton-Farmers Branch ISD Board of Trustees", source_type: "district_official" },
      { url: "https://www.cfbisd.edu/about-us/board-of-trustees/elections/2025", title: "CFBISD May 2025 Election Canvass", source_type: "district_official" },
    ]),
    branding: { primary: "#1e3a8a", secondary: "#fbbf24", accent: "#eff6ff", label: "CFB ISD blue and gold" },
    roster: [
      { full_name: "Cassandra Hatfield", role: "Board President", term: "2024-2027", summary: "Listed as Board President per CFBISD Board of Trustees page." },
      { full_name: "Ileana Garza-Rojas", role: "Trustee", summary: "Won May 3, 2025 CFBISD trustee election; canvassed May 14, 2025." },
      { full_name: "Kim Brady", role: "Trustee", summary: "Won May 3, 2025 CFBISD trustee election; canvassed May 14, 2025." },
      { full_name: "Paul Gilmore", role: "Trustee", summary: "Won May 3, 2025 CFBISD trustee election; canvassed May 14, 2025." },
      { full_name: "Carolyn Benavides", role: "Trustee", summary: "Sworn in to fill a CFBISD district vacancy per district announcement." },
    ],
    investigationNotes: ["Pull the remaining 2 CFBISD trustees, seat numbers, and term-end dates. Track follow-up on the school consolidation proposal."],
    queueStatus: "needs_full_records_pull",
  },
  {
    district: "Lewisville ISD",
    district_slug: "lewisville_isd",
    county: "Denton/Dallas/Tarrant",
    sources: withAccessedDate([
      { url: "https://www.lisd.net/our-district/board-of-trustees", title: "Lewisville ISD Board of Trustees", source_type: "district_official" },
      { url: "https://www.lisd.net/our-district/board-of-trustees/meet-the-board", title: "Lewisville ISD Meet the Board", source_type: "district_official" },
    ]),
    branding: { primary: "#1e3a8a", secondary: "#0f172a", accent: "#eff6ff", label: "Lewisville Farmers blue and black" },
    roster: [
      { full_name: "Jenny Proznik", role: "Board President", seat: "Place 5", term: "Term expires 2025", summary: "Listed as Lewisville ISD Board President." },
      { full_name: "Allison Lassahn", role: "Trustee", seat: "Single Member District 1", term: "Term expires 2027", summary: "Listed as Single Member District 1 trustee per the LISD Meet the Board page." },
    ],
    investigationNotes: ["Pull the remaining 5 Lewisville ISD trustees, including Vice President and Secretary, and confirm 2026 ballot races."],
    queueStatus: "needs_full_records_pull",
  },
  {
    district: "Birdville ISD",
    district_slug: "birdville_isd",
    county: "Tarrant",
    sources: withAccessedDate([
      { url: "https://www.birdvilleschools.net/our-district/board-of-trustees", title: "Birdville ISD Board of Trustees", source_type: "district_official" },
    ]),
    branding: { primary: "#0f172a", secondary: "#fbbf24", accent: "#fffbe9", label: "Birdville black and gold" },
    roster: [
      { full_name: "Ralph Kunkel", role: "Board President", summary: "Listed as 2025-26 Board President on the Birdville ISD Board of Trustees page." },
      { full_name: "Brenda Sanders-Wise", role: "Vice President", summary: "Listed as 2025-26 Vice President on the Birdville ISD Board of Trustees page." },
      { full_name: "Joe Tolbert", role: "Secretary", summary: "Listed as 2025-26 Secretary on the Birdville ISD Board of Trustees page." },
    ],
    investigationNotes: ["Pull the remaining 4 Birdville ISD trustees and seat-by-place assignments."],
    queueStatus: "needs_full_records_pull",
  },
  {
    district: "Hurst-Euless-Bedford ISD",
    district_slug: "hurst_euless_bedford_isd",
    county: "Tarrant",
    sources: withAccessedDate([
      { url: "https://www.hebisd.edu/about/school-board-policies/school-board-policies", title: "HEB ISD School Board & Policies", source_type: "district_official" },
      { url: "https://www.hebisd.edu/about/school-board-policies/heb-isd-election-information/2025-heb-isd-board-of-trustees-election", title: "HEB ISD 2025 Board of Trustees Election", source_type: "district_official" },
    ]),
    branding: { primary: "#1e3a8a", secondary: "#dc2626", accent: "#eff6ff", label: "HEB ISD blue and red" },
    roster: [
      { full_name: "Matt Romero", role: "Board President", seat: "Place 3", summary: "Listed as Board President per HEB ISD board records." },
      { full_name: "John Biggan", role: "Trustee", seat: "Place 2", summary: "Listed as Place 2 trustee per HEB ISD board records." },
      { full_name: "Becky Ewart", role: "Trustee", seat: "Place 4", summary: "First elected May 2025 per HEB ISD election records." },
      { full_name: "Fred Campos", role: "Trustee", seat: "Place 7", summary: "Listed as Place 7 trustee per HEB ISD board records." },
    ],
    investigationNotes: ["Pull the remaining 3 HEB ISD trustees (Places 1, 5, 6), Vice President / Secretary designations, and term-end dates."],
    queueStatus: "needs_full_records_pull",
  },
  {
    district: "Keller ISD",
    district_slug: "keller_isd",
    county: "Tarrant",
    sources: withAccessedDate([
      { url: "https://www.kellerisd.net/board-of-trustees", title: "Keller ISD Board of Trustees", source_type: "district_official" },
      { url: "https://communityimpact.com/dallas-fort-worth/keller-roanoke-northeast-fort-worth/education/2025/05/14/new-keller-isd-board-members-sworn-in-birt-elected-president/", title: "Community Impact — Keller ISD board sworn in, Birt elected president (May 2025)", source_type: "news" },
      { url: "https://fortworthreport.org/2025/12/18/special-prosecutors-appointed-in-case-to-remove-keller-isd-trustees/", title: "Fort Worth Report — Special prosecutors appointed in Keller ISD removal case (Dec 2025)", source_type: "news" },
    ]),
    branding: { primary: "#dc2626", secondary: "#0f172a", accent: "#fff1f2", label: "Keller Indians red and black" },
    roster: [
      { full_name: "John Birt", role: "Board President", seat: "Place 4", summary: "Elected Keller ISD Board President in May 2025." },
      { full_name: "Heather Washington", role: "Vice President", seat: "Place 7", summary: "Elected Keller ISD Vice President in May 2025." },
      { full_name: "Randy Campbell", role: "Trustee", seat: "Place 1", term: "Took office May 2025", summary: "First-term trustee elected to Place 1 in May 2025." },
      { full_name: "Jennifer Erickson", role: "Trustee", seat: "Place 2", term: "Took office May 2025", summary: "First-term trustee elected to Place 2 in May 2025." },
      { full_name: "Chelsea Kelly", role: "Trustee", seat: "Place 3", term: "Took office August 2024", summary: "First-term Place 3 trustee, took office August 2024." },
      { full_name: "Chris Coker", role: "Trustee", seat: "Place 5", term: "Assumed office May 2023", summary: "Place 5 trustee in third year of first term." },
    ],
    investigationNotes: ["Place 6 is currently vacant. Track removal-petition litigation against three trustees (Dec 2025 special prosecutors appointment) and follow-up on the proposed Keller ISD split and 2025 superintendent resignation."],
    queueStatus: "dossiers_started",
  },
];
