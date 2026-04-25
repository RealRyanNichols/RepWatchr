import fs from "fs";
import path from "path";
import { TEXAS_ROSTER_EXTENSIONS } from "@/data/texas-school-board-rosters";

export type ResearchStatus = "initial_dossier" | "stub" | "needs_review" | "complete" | string;

export interface SourceLink {
  url: string;
  title?: string;
  accessed_date?: string;
  source_type?: string;
}

export interface ConflictRecord {
  type?: string;
  description: string;
  severity?: string;
  fact_label?: string;
  source_url?: string;
}

export interface VoteRecord {
  meeting_date?: string;
  item?: string;
  vote?: string;
  board_outcome?: string;
  source_url?: string;
}

export interface CandidateDossier {
  candidate_id: string;
  full_name: string;
  preferred_name?: string;
  age?: number | string | null;
  hometown?: string;
  occupation?: string;
  employer?: string;
  district: string;
  district_slug: string;
  county: string;
  state: string;
  seat?: string;
  role?: string;
  incumbent?: boolean;
  years_on_board?: number | null;
  election_date?: string;
  election_type?: string;
  on_2026_ballot?: boolean;
  unopposed?: boolean | null;
  opponents?: string[];
  party_registration?: string;
  social_media?: Record<string, string>;
  content_themes?: string[];
  notable_statements?: Array<{ quote_or_paraphrase?: string; date?: string; platform?: string; source_url?: string; fact_label?: string }>;
  education_policy_positions?: Record<string, string>;
  red_flags?: ConflictRecord[];
  summary?: string;
  analyst_notes?: string;
  research_gaps?: string[];
  sources?: SourceLink[];
  status?: ResearchStatus;
  last_updated?: string;
  // Silent background facts that feed scoring and political-lean assessment
  // but are not rendered on the public profile. Use only sourced public records.
  silent_signals?: {
    voter_primary_history?: Array<{ year: number; party: "R" | "D" | "I" | "Other"; source_url: string }>;
    donations?: Array<{ recipient: string; amount?: number; cycle?: string; alignment?: "right" | "left" | "center" | "nonpartisan"; source_url: string }>;
    endorsements_received?: Array<{ from: string; alignment?: "right" | "left" | "center" | "nonpartisan"; source_url: string }>;
    affiliations?: Array<{ organization: string; alignment?: "right" | "left" | "center" | "nonpartisan"; source_url: string }>;
    notes?: string;
  };
  about_public_record?: {
    complete_employment_timeline?: Array<{ employer?: string; title?: string; source_url?: string; notes?: string }>;
    affiliations_full_inventory?: Array<{ organization?: string; role?: string; years?: string; source_url?: string }>;
    conflicts_of_interest_inventory?: ConflictRecord[];
    board_performance_incumbents_only?: {
      notable_votes?: VoteRecord[];
      committee_assignments?: string[];
      meeting_attendance_pct?: number | null;
      meetings_missed_count?: number | null;
    };
    about_summary_narrative?: string;
  };
}

export interface SchoolBoardFeedItem {
  id: string;
  district_slug: string;
  type: "breaking" | "praise" | "concern" | "social_watch" | "public_comment" | "records_request";
  title: string;
  summary: string;
  source_url?: string;
  source_title?: string;
  event_date?: string;
  status: "verified" | "watching" | "needs_records" | "needs_review";
  severity?: "positive" | "low" | "medium" | "high" | "critical";
}

export interface OfficialRosterMember {
  full_name: string;
  seat?: string;
  role?: string;
  term?: string;
  occupation?: string;
  summary?: string;
}

export interface DistrictResearch {
  district: string;
  district_slug: string;
  county: string;
  candidates: CandidateDossier[];
  priorityRank?: number;
  queueStatus?: "dossiers_started" | "needs_full_records_pull";
  overview?: { title: string; quickFacts: Array<{ label: string; value: string }>; rawText: string };
  officialRoster?: OfficialRosterMember[];
  feed?: SchoolBoardFeedItem[];
  sourceLinks?: SourceLink[];
  investigationQueue?: string[];
}

export interface PriorityDistrictEntry {
  district: string;
  district_slug: string;
  county: string;
}

export const EAST_TEXAS_PRIORITY_DISTRICTS: PriorityDistrictEntry[] = [
  { district: "Harleton ISD", district_slug: "harleton_isd", county: "Harrison" },
  { district: "Marshall ISD", district_slug: "marshall_isd", county: "Harrison" },
  { district: "Jefferson ISD", district_slug: "jefferson_isd", county: "Marion" },
  { district: "Longview ISD", district_slug: "longview_isd", county: "Gregg" },
  { district: "Waskom ISD", district_slug: "waskom_isd", county: "Harrison" },
  { district: "Hallsville ISD", district_slug: "hallsville_isd", county: "Harrison" },
  { district: "Ore City ISD", district_slug: "ore_city_isd", county: "Upshur" },
  { district: "New Diana ISD", district_slug: "new_diana_isd", county: "Upshur" },
  { district: "Pine Tree ISD", district_slug: "pine_tree_isd", county: "Gregg" },
  { district: "Kilgore ISD", district_slug: "kilgore_isd", county: "Gregg/Rusk" },
  { district: "Carthage ISD", district_slug: "carthage_isd", county: "Panola" },
  { district: "Lufkin ISD", district_slug: "lufkin_isd", county: "Angelina" },
  { district: "Mount Pleasant ISD", district_slug: "mount_pleasant_isd", county: "Titus" },
  { district: "Whitehouse ISD", district_slug: "whitehouse_isd", county: "Smith" },
  { district: "Lindale ISD", district_slug: "lindale_isd", county: "Smith" },
  { district: "Tyler ISD", district_slug: "tyler_isd", county: "Smith" },
  { district: "Athens ISD", district_slug: "athens_isd", county: "Henderson" },
  { district: "Sulphur Springs ISD", district_slug: "sulphur_springs_isd", county: "Hopkins" },
  { district: "Texarkana ISD", district_slug: "texarkana_isd", county: "Bowie" },
  { district: "Henderson ISD", district_slug: "henderson_isd", county: "Rusk" },
  { district: "Tatum ISD", district_slug: "tatum_isd", county: "Rusk" },
  { district: "Plano ISD", district_slug: "plano_isd", county: "Collin" },
  { district: "Frisco ISD", district_slug: "frisco_isd", county: "Collin/Denton" },
  { district: "Houston ISD", district_slug: "houston_isd", county: "Harris" },
  { district: "Dallas ISD", district_slug: "dallas_isd", county: "Dallas" },
  { district: "Austin ISD", district_slug: "austin_isd", county: "Travis" },
  { district: "San Antonio ISD", district_slug: "san_antonio_isd", county: "Bexar" },
  { district: "Fort Worth ISD", district_slug: "fort_worth_isd", county: "Tarrant" },
  { district: "Katy ISD", district_slug: "katy_isd", county: "Harris/Fort Bend/Waller" },
  { district: "Cypress-Fairbanks ISD", district_slug: "cypress_fairbanks_isd", county: "Harris" },
  { district: "Round Rock ISD", district_slug: "round_rock_isd", county: "Williamson/Travis" },
  { district: "Killeen ISD", district_slug: "killeen_isd", county: "Bell" },
  { district: "Conroe ISD", district_slug: "conroe_isd", county: "Montgomery" },
  { district: "Northside ISD", district_slug: "northside_isd", county: "Bexar" },
];

// Pull every district added through the extension module into the priority
// list, the official rosters, and the source links so a contributor can add
// a new district by editing only `src/data/texas-school-board-rosters.ts`.
for (const extension of TEXAS_ROSTER_EXTENSIONS) {
  if (!EAST_TEXAS_PRIORITY_DISTRICTS.some((d) => d.district_slug === extension.district_slug)) {
    EAST_TEXAS_PRIORITY_DISTRICTS.push({
      district: extension.district,
      district_slug: extension.district_slug,
      county: extension.county,
    });
  }
}

const ACCESSED_DATE = "2026-04-24";

const DISTRICT_SOURCES: Record<string, SourceLink[]> = {
  harleton_isd: [
    { url: "https://www.harletonisd.net/111667_2", title: "Harleton ISD Board of Trustees", accessed_date: ACCESSED_DATE, source_type: "district_official" },
  ],
  marshall_isd: [
    { url: "https://www.marshallisd.com/page/school-board", title: "Marshall ISD School Board", accessed_date: ACCESSED_DATE, source_type: "district_official" },
  ],
  jefferson_isd: [
    { url: "https://jeffersonisd.org/26099_1", title: "Jefferson ISD School Board", accessed_date: ACCESSED_DATE, source_type: "district_official" },
  ],
  longview_isd: [
    { url: "https://w3.lisd.org/district/news/06092025-board", title: "Longview ISD June 9, 2025 board update", accessed_date: ACCESSED_DATE, source_type: "district_official" },
    { url: "https://w3.lisd.org/board/elections", title: "Longview ISD District Elections", accessed_date: ACCESSED_DATE, source_type: "district_official" },
  ],
  waskom_isd: [
    { url: "https://www.waskomisd.net/wisd-board-of-trustees-information", title: "Waskom ISD Board of Trustees Information", accessed_date: ACCESSED_DATE, source_type: "district_official" },
  ],
  hallsville_isd: [
    { url: "https://www.hisd.com/314639_2", title: "Hallsville ISD Board of Trustees", accessed_date: ACCESSED_DATE, source_type: "district_official" },
  ],
  ore_city_isd: [
    { url: "https://www.ocisd.net/apps/pages/index.jsp?uREC_ID=4414214&type=d&pREC_ID=2646873", title: "Ore City ISD School Board", accessed_date: ACCESSED_DATE, source_type: "district_official" },
  ],
  new_diana_isd: [
    { url: "https://www.ndisd.org/school_board/about_school_board", title: "New Diana ISD About School Board", accessed_date: ACCESSED_DATE, source_type: "district_official" },
    { url: "https://www.ndisd.org/school_board/about_school_board/meet_the_board_trustees", title: "New Diana ISD Meet the Board Trustees", accessed_date: ACCESSED_DATE, source_type: "district_official" },
  ],
  pine_tree_isd: [
    { url: "https://www.ptisd.org/page/board-of-trustees", title: "Pine Tree ISD Board of Trustees", accessed_date: ACCESSED_DATE, source_type: "district_official" },
    { url: "https://www.ptisd.org/page/elections", title: "Pine Tree ISD Elections", accessed_date: ACCESSED_DATE, source_type: "district_official" },
  ],
  kilgore_isd: [
    { url: "https://www.kisd.org/board", title: "Kilgore ISD Board", accessed_date: ACCESSED_DATE, source_type: "district_official" },
    { url: "https://www.kisd.org/board/board-members", title: "Kilgore ISD Board Members", accessed_date: ACCESSED_DATE, source_type: "district_official" },
  ],
  carthage_isd: [
    { url: "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/1372/Cisd/cf181747-7178-45b5-958f-6cca2dc375d1/2025-26-Carthage-ISD-Employee-Handbook.pdf?disposition=inline", title: "Carthage ISD 2025-26 Employee Handbook", accessed_date: ACCESSED_DATE, source_type: "district_official" },
    { url: "https://www.carthageisd.org/article/2188589", title: "Carthage ISD Donald Re-Elected", accessed_date: ACCESSED_DATE, source_type: "district_official" },
  ],
  lufkin_isd: [
    { url: "https://www.lufkinisd.org/school-board-members/", title: "Lufkin ISD School Board Members", accessed_date: ACCESSED_DATE, source_type: "district_official" },
    { url: "https://bpb-us-w2.wpmucdn.com/sites.lufkinisd.org/dist/c/2/files/2025/08/Salary-Compensation-Plan-2526-BRD.pdf", title: "Lufkin ISD 2025-2026 Compensation Plan", accessed_date: ACCESSED_DATE, source_type: "district_official" },
  ],
  mount_pleasant_isd: [
    { url: "https://www.mpisd.net/school-board/", title: "Mount Pleasant ISD School Board", accessed_date: ACCESSED_DATE, source_type: "district_official" },
    { url: "https://ballotpedia.org/Mount_Pleasant_Independent_School_District,_Texas", title: "Mount Pleasant ISD - Ballotpedia", accessed_date: ACCESSED_DATE, source_type: "ballotpedia" },
  ],
  whitehouse_isd: [
    { url: "https://www.whitehouseisd.org/schoolboard", title: "Whitehouse ISD School Board", accessed_date: ACCESSED_DATE, source_type: "district_official" },
    { url: "https://ballotpedia.org/Whitehouse_Independent_School_District,_Texas", title: "Whitehouse ISD - Ballotpedia", accessed_date: ACCESSED_DATE, source_type: "ballotpedia" },
  ],
  lindale_isd: [
    { url: "https://www.lindaleeagles.org/school-board", title: "Lindale ISD School Board", accessed_date: ACCESSED_DATE, source_type: "district_official" },
    { url: "https://tylerpaper.com/2026/04/21/lindale-isd-school-board-candidates-focus-on-growth-transparency-and-student-success/", title: "Tyler Morning Telegraph - Lindale ISD candidates 2026", accessed_date: ACCESSED_DATE, source_type: "news" },
  ],
  tyler_isd: [
    { url: "https://www.tylerisd.org/page/school-board", title: "Tyler ISD School Board", accessed_date: ACCESSED_DATE, source_type: "district_official" },
    { url: "https://www.tylerisd.org/page/school-board-elections", title: "Tyler ISD Board Elections", accessed_date: ACCESSED_DATE, source_type: "district_official" },
  ],
  athens_isd: [
    { url: "https://www.athensisd.net/school_board/board_of_trustees", title: "Athens ISD Board of Trustees", accessed_date: ACCESSED_DATE, source_type: "district_official" },
    { url: "https://core-docs.s3.us-east-1.amazonaws.com/documents/asset/uploaded_file/4025/AISD/4620750/Employee_Handbook_24-25_July_23_gm2.0.pdf", title: "Athens ISD Employee Handbook (Updated July 2024)", accessed_date: ACCESSED_DATE, source_type: "district_official" },
  ],
  sulphur_springs_isd: [
    { url: "https://www.ssisd.net/about-ssisd/board-of-trustees/meet-the-board", title: "Sulphur Springs ISD Meet the Board", accessed_date: ACCESSED_DATE, source_type: "district_official" },
    { url: "https://www.ssisd.net/about-ssisd/board-of-trustees", title: "Sulphur Springs ISD Board of Trustees", accessed_date: ACCESSED_DATE, source_type: "district_official" },
  ],
  texarkana_isd: [
    { url: "https://www.txkisd.net/board-of-trustees", title: "Texarkana ISD Board of Trustees", accessed_date: ACCESSED_DATE, source_type: "district_official" },
    { url: "https://txktoday.com/news/fred-norton-jr-concludes-18-years-of-service-on-tisd-board-of-trustees/", title: "Fred Norton Jr. Concludes 18 Years of Service on TISD Board (Texarkana Today)", accessed_date: ACCESSED_DATE, source_type: "news" },
  ],
  henderson_isd: [
    { url: "https://www.hendersonisd.org/page/board-of-trustees", title: "Henderson ISD Board of Trustees", accessed_date: ACCESSED_DATE, source_type: "district_official" },
  ],
  tatum_isd: [
    { url: "https://www.tatumisd.org/ourschoolboard", title: "Tatum ISD School Board", accessed_date: ACCESSED_DATE, source_type: "district_official" },
  ],
  plano_isd: [
    { url: "https://www.region10.org/article/2263547", title: "Region 10 names Plano ISD Board 2025 Outstanding School Board", accessed_date: ACCESSED_DATE, source_type: "education_agency" },
    { url: "https://www.pisd.edu", title: "Plano ISD", accessed_date: ACCESSED_DATE, source_type: "district_official" },
  ],
  frisco_isd: [
    { url: "https://www.friscoisd.org/about/board-of-trustees/meet-the-board", title: "Frisco ISD Meet the Board", accessed_date: ACCESSED_DATE, source_type: "district_official" },
    { url: "https://www.friscoisd.org/news/article/2025/05/04/voters-decide-three-seats-on-frisco-isd-board-of-trustees", title: "Frisco ISD May 2025 board election results", accessed_date: ACCESSED_DATE, source_type: "district_official" },
  ],
  houston_isd: [
    { url: "https://www.houstonisd.org/board-governance/our-board", title: "Houston ISD Our Board", accessed_date: ACCESSED_DATE, source_type: "district_official" },
    { url: "https://www.houstonpublicmedia.org/articles/education/2025/11/04/534984/houston-isd-board-election-results-2025/", title: "Houston Public Media — HISD November 2025 board election results", accessed_date: ACCESSED_DATE, source_type: "news" },
  ],
  dallas_isd: [
    { url: "https://www.dallasisd.org/board-of-trustees/board-members", title: "Dallas ISD Board Members", accessed_date: ACCESSED_DATE, source_type: "district_official" },
    { url: "https://www.dallasisd.org/board-of-trustees", title: "Dallas ISD Board of Trustees", accessed_date: ACCESSED_DATE, source_type: "district_official" },
  ],
  austin_isd: [
    { url: "https://www.austinisd.org/board/members", title: "Austin ISD Board Members", accessed_date: ACCESSED_DATE, source_type: "district_official" },
    { url: "https://www.austinisd.org/announcements/2026/02/16/austin-isd-board-trustees-elects-new-officers", title: "Austin ISD Board elects new officers (Feb 2026)", accessed_date: ACCESSED_DATE, source_type: "district_official" },
  ],
  san_antonio_isd: [
    { url: "https://www.saisd.net/page/board", title: "San Antonio ISD Board", accessed_date: ACCESSED_DATE, source_type: "district_official" },
    { url: "https://www.saisd.net/page/contact-a-board-member", title: "SAISD Contact a Board Member", accessed_date: ACCESSED_DATE, source_type: "district_official" },
  ],
  fort_worth_isd: [
    { url: "https://www.fwisd.org/board/board-of-education/board-officers-members", title: "Fort Worth ISD Board Officers & Members", accessed_date: ACCESSED_DATE, source_type: "district_official" },
    { url: "https://www.fwisd.org/about/tea", title: "Fort Worth ISD TEA Intervention", accessed_date: ACCESSED_DATE, source_type: "district_official" },
  ],
  katy_isd: [
    { url: "https://www.katyisd.org/board/board/board-members", title: "Katy ISD Board Members", accessed_date: ACCESSED_DATE, source_type: "district_official" },
    { url: "https://coveringkaty.com/education/katy-isd-board-welcomes-new-trustee-elects-officers/", title: "Covering Katy News — Katy ISD board elects officers", accessed_date: ACCESSED_DATE, source_type: "news" },
  ],
  cypress_fairbanks_isd: [
    { url: "https://www.cfisd.net/board-of-trustees/board-of-trustees1/meet-our-board", title: "Cy-Fair ISD Meet Our Board", accessed_date: ACCESSED_DATE, source_type: "district_official" },
    { url: "https://www.click2houston.com/news/local/2025/11/05/3-new-trustees-elected-to-cypress-fairbanks-isd-school-board/", title: "Click2Houston — 3 new Cy-Fair trustees elected (Nov 2025)", accessed_date: ACCESSED_DATE, source_type: "news" },
  ],
  round_rock_isd: [
    { url: "https://www.roundrockisd.org/about-rrisd/board-of-trustees/", title: "Round Rock ISD Board of Trustees", accessed_date: ACCESSED_DATE, source_type: "district_official" },
    { url: "https://news.roundrockisd.org/2025/01/20/round-rock-isd-trustees-elect-first-black-board-president/", title: "Round Rock ISD elects first Black board president", accessed_date: ACCESSED_DATE, source_type: "district_official" },
  ],
  killeen_isd: [
    { url: "https://www.killeenisd.org/school_board", title: "Killeen ISD School Board", accessed_date: ACCESSED_DATE, source_type: "district_official" },
    { url: "https://www.killeenisd.org/board_members", title: "Killeen ISD Board Members", accessed_date: ACCESSED_DATE, source_type: "district_official" },
  ],
  conroe_isd: [
    { url: "https://www.conroeisd.net/superintendent-board-of-trustees/", title: "Conroe ISD Board of Trustees", accessed_date: ACCESSED_DATE, source_type: "district_official" },
    { url: "https://www.conroeisd.net/conroe-isd-honors-outgoing-board-members-swears-in-new-board-members/", title: "Conroe ISD Swears in New Board Members (Nov 2024)", accessed_date: ACCESSED_DATE, source_type: "district_official" },
  ],
  northside_isd: [
    { url: "https://www.nisd.net/board/members", title: "Northside ISD Board Members", accessed_date: ACCESSED_DATE, source_type: "district_official" },
    { url: "https://sanantonioreport.org/san-antonio-election-2025-northside-isd-board-results-union/", title: "San Antonio Report — May 2025 NISD board election results", accessed_date: ACCESSED_DATE, source_type: "news" },
  ],
};

const OFFICIAL_ROSTERS: Record<string, OfficialRosterMember[]> = {
  marshall_isd: [
    { full_name: "Brad Burris", role: "Board President", seat: "At Large", term: "Term expires May 2027", summary: "First elected in 2010, according to the Marshall ISD school board page." },
    { full_name: "Bettye Fisher", role: "Board Assistant Secretary", seat: "District 1", term: "Term expires May 2026", summary: "First elected in 2018, according to the Marshall ISD school board page." },
    { full_name: "Ted Huffhines", role: "Board Vice President", seat: "District 4", term: "Term expires May 2026", summary: "First elected in 2017, according to the Marshall ISD school board page." },
    { full_name: "Cathy Marshall", role: "Trustee", seat: "At Large", term: "Term expires May 2027", summary: "First elected in 2010, according to the Marshall ISD school board page." },
    { full_name: "Rudy Medina", role: "Trustee", seat: "District 2", term: "Term expires May 2028", summary: "First elected in 2019, according to the Marshall ISD school board page." },
    { full_name: "Chase Palmer", role: "Board Secretary", seat: "District 5", term: "Term expires May 2026", summary: "First elected in 2011, according to the Marshall ISD school board page." },
    { full_name: "Lee Lewis", role: "Trustee", seat: "District 3", term: "Term expires May 2028", summary: "First elected in 2022, according to the Marshall ISD school board page." },
  ],
  jefferson_isd: [
    { full_name: "Tolesia Smith Davis", role: "President", summary: "Listed by Jefferson ISD as a board officer." },
    { full_name: "Kirstin Johnson", role: "Vice President", summary: "Listed by Jefferson ISD as a board officer." },
    { full_name: "Leah Cooper", role: "Secretary", summary: "Listed by Jefferson ISD as a board officer." },
    { full_name: "Lauren Glover", role: "Member", summary: "Listed by Jefferson ISD as a board member." },
    { full_name: "Rusty Mauldin", role: "Member", summary: "Listed by Jefferson ISD as a board member." },
  ],
  longview_isd: [
    { full_name: "Michael Tubb", role: "Board President", seat: "Place 1", summary: "Listed in Longview ISD's June 9, 2025 board update." },
    { full_name: "Brett Miller", role: "Trustee", seat: "Place 2", summary: "Listed in Longview ISD's June 9, 2025 board update." },
    { full_name: "Samir Germanwala", role: "Trustee", seat: "Place 3", summary: "Listed in Longview ISD's June 9, 2025 board update." },
    { full_name: "Crista Black", role: "Vice President", seat: "Place 4", summary: "Listed in Longview ISD's June 9, 2025 board update." },
    { full_name: "Lateefah Pruitt", role: "Board Secretary", seat: "Place 5", summary: "Listed in Longview ISD's June 9, 2025 board update." },
    { full_name: "Ted Beard", role: "Vice Secretary", seat: "Place 6", summary: "Listed in Longview ISD's June 9, 2025 board update." },
    { full_name: "Troy Simmons", role: "Trustee", seat: "Place 7", summary: "Listed in Longview ISD's June 9, 2025 board update." },
  ],
  waskom_isd: [
    { full_name: "J Danny Cox", role: "Board President", term: "Term expires May 2028" },
    { full_name: "Sarah Thompson", role: "Board Vice-President", term: "Term expires May 2026" },
    { full_name: "Kathy Baugh", role: "Board Secretary", term: "Term expires May 2027" },
    { full_name: "Michael Allwhite", role: "Board Member-at-Large", term: "Term expires May 2026" },
    { full_name: "Shanta Chatman", role: "Board Member-at-Large", term: "Term expires May 2027" },
    { full_name: "Oscar Garcia", role: "Board Member-at-Large", term: "Term expires May 2026" },
    { full_name: "Jarrad Maxwell", role: "Board Member-at-Large", term: "Term expires May 2028" },
  ],
  ore_city_isd: [
    { full_name: "Chris Barton", role: "Trustee", term: "Current Term 2023-2026", occupation: "Patient Access, Christus Good Shepherd Medical Center" },
    { full_name: "Bryan Davis", role: "Trustee", term: "Current Term 2025-2028" },
    { full_name: "Bobby Byrd", role: "Board Vice-President", term: "Current Term 2025-2028", occupation: "Accountant/Financial Manager" },
    { full_name: "Bobby Clawson", role: "Trustee", term: "Current Term 2024-2027", occupation: "Retired from Lone Star Steel" },
    { full_name: "Virginia Harris", role: "Board Secretary", term: "Current Term 2025-2028", occupation: "Reeder-Davis Funeral Home" },
    { full_name: "Elizabeth Edwards", role: "Trustee", term: "Current Term 2024-2027" },
    { full_name: "Matthew A. Pearson", role: "Vice-President", term: "Current Term 2024-2027", occupation: "Project Estimator at Kirby Supply" },
  ],
  new_diana_isd: [
    { full_name: "TJ Shafer", role: "President", seat: "Position #2", term: "Term expires 2026", occupation: "Partner at Monument Resources LLC and owner of Shafer Land & Timber LLC" },
    { full_name: "Donald Willeford", role: "Vice President", seat: "Position #7", term: "Term expires 2028", occupation: "Law enforcement / SRO at Gladewater ISD" },
    { full_name: "Dwayne Leach", role: "Board Member", seat: "Position #3", term: "Term expires 2028", occupation: "Director of Community Relations at Arabella of Longview" },
    { full_name: "Jerry Cobb", role: "Board Member", seat: "Position #4", term: "Term expires 2026", occupation: "Private investigator and COO for Bullock Protection" },
    { full_name: "Cari Roberts", role: "Board Member", seat: "Position #5", term: "Term expires 2026", occupation: "City of Longview Human Resources" },
    { full_name: "Becky Smith", role: "Board Member", seat: "Position #6", term: "Term expires 2028", occupation: "Retired teacher" },
    { full_name: "Gaylon Davis", role: "Member", seat: "Position #1", term: "Term expires 2028", occupation: "Owner of Davis Insurance" },
  ],
  pine_tree_isd: [
    { full_name: "Adam Graves", role: "Vice-President", seat: "Place 1", term: "2024-2027" },
    { full_name: "Drew Seidel", role: "Trustee", seat: "Place 2", term: "2024-2027" },
    { full_name: "Aaron Klein", role: "Trustee", seat: "Place 3", term: "2025-2028" },
    { full_name: "Frank Richards", role: "President", seat: "Place 4", term: "2025-2028" },
    { full_name: "Cindy Gabehart", role: "Trustee", seat: "Place 5", term: "2025-2028" },
    { full_name: "Mike Smith", role: "Trustee", seat: "Place 6", term: "2025-2026" },
    { full_name: "Melanie Roudkovski", role: "Secretary", seat: "Place 7", term: "2023-2026" },
  ],
  kilgore_isd: [
    { full_name: "Jason Smith", role: "Board President" },
    { full_name: "Dana Sneed", role: "Board Vice-President" },
    { full_name: "Rachel Harrington", role: "Board Secretary" },
    { full_name: "Dereck Borders", role: "Board Member" },
    { full_name: "Alan Clark", role: "Board Member" },
    { full_name: "Reggie Henson", role: "Board Member" },
    { full_name: "Johna Tritt", role: "Board Member" },
  ],
  carthage_isd: [
    { full_name: "Ben Donald", role: "President", seat: "Place 6", occupation: "Owner of Donald Eye Care", summary: "Re-elected to Place 6 in May 2025, according to Carthage ISD." },
    { full_name: "Frank Willis", role: "Vice President" },
    { full_name: "Mary Ella Sherman", role: "Secretary" },
    { full_name: "Paul Beatty", role: "Trustee" },
    { full_name: "Brenda Giles", role: "Trustee" },
    { full_name: "Elzie Hicks", role: "Trustee" },
    { full_name: "Truman Shirey", role: "Trustee" },
  ],
  lufkin_isd: [
    { full_name: "Kristi Gay", role: "Board President", summary: "Listed as Board President in Lufkin ISD's 2025-2026 Compensation Plan." },
    { full_name: "Matt Knight", role: "Vice President", summary: "Listed as Vice President in Lufkin ISD's 2025-2026 Compensation Plan." },
    { full_name: "Allyson Langston", role: "Secretary", summary: "Listed as Secretary in Lufkin ISD's 2025-2026 Compensation Plan." },
    { full_name: "Joe Ceasar", role: "Trustee", summary: "Listed as a trustee in Lufkin ISD's 2025-2026 Compensation Plan." },
    { full_name: "Delphina Hadnot-Maxie", role: "Trustee", summary: "Listed as a trustee in Lufkin ISD's 2025-2026 Compensation Plan." },
    { full_name: "Melinda Moore", role: "Trustee", summary: "Listed as a trustee in Lufkin ISD's 2025-2026 Compensation Plan." },
    { full_name: "Erika Neill", role: "Trustee", summary: "Listed as a trustee in Lufkin ISD's 2025-2026 Compensation Plan." },
  ],
  mount_pleasant_isd: [
    { full_name: "Yvonne Hampton", role: "President", seat: "Member 7", occupation: "Retired educator", summary: "Listed as Board President for Mount Pleasant ISD as of February 2026." },
    { full_name: "Buddy Blue", role: "Vice President", seat: "Member 1", occupation: "Self-employed", summary: "Listed as Vice President for Mount Pleasant ISD as of February 2026." },
  ],
  whitehouse_isd: [
    { full_name: "Holly Conaway", role: "Trustee", seat: "Place 7", term: "May 2025 - May 2028", occupation: "Managing Partner, East Texas Rent Homes", summary: "1992 Whitehouse High School graduate; long-time Whitehouse resident." },
    { full_name: "Maegan Schneider", role: "Trustee", seat: "Place 6", term: "May 2025 - May 2028", occupation: "Civil engineer at Aqueous Engineering", summary: "Texas Tech and UT Tyler graduate; Whitehouse resident since 2005." },
    { full_name: "Nick Moss", role: "Trustee", occupation: "Account Executive at Genesis eBONDS", summary: "1997 Whitehouse High School graduate and 43-year community resident." },
    { full_name: "Keidric Trimble", role: "Trustee", occupation: "Chief Financial Officer, City of Tyler", summary: "Whitehouse ISD graduate; UT Arlington and UT Tyler alumnus." },
    { full_name: "Dr. Conflitti", role: "Trustee", occupation: "U.S. Air Force reservist (Barksdale AFB)", summary: "Whitehouse ISD parent; family attends Marvin United Methodist Church." },
  ],
  lindale_isd: [
    { full_name: "Mike Combs", role: "Board President", summary: "Elected to the Lindale ISD board in 2006." },
    { full_name: "Robert McGee", role: "Vice President", summary: "Has served on the Lindale ISD Board of Trustees since 2015." },
    { full_name: "Daniel Deslatte", role: "Trustee", summary: "Elected to the Lindale ISD Board of Trustees in 2024." },
    { full_name: "Ragan Burgess", role: "Trustee", seat: "Place 3", summary: "Place 3 trustee not seeking reelection in May 2026 per Tyler Morning Telegraph reporting." },
  ],
  tyler_isd: [
    { full_name: "Lindsey Harrison", role: "Trustee", seat: "District 6", summary: "Appointed by trustees to fill the District 6 vacancy per Tyler ISD announcement." },
  ],
  athens_isd: [
    { full_name: "Alicea Elliott", role: "President", summary: "Listed as Board President in the Athens ISD Employee Handbook (updated July 2024)." },
    { full_name: "Eugene Buford", role: "Vice President", summary: "Listed as Vice President in the Athens ISD Employee Handbook." },
    { full_name: "Freddie Paul", role: "Secretary", summary: "Listed as Secretary in the Athens ISD Employee Handbook." },
    { full_name: "Margaret Richardson", role: "Trustee", summary: "Listed as a trustee in the Athens ISD Employee Handbook." },
    { full_name: "Kelley Lee", role: "Trustee", summary: "Listed as a trustee in the Athens ISD Employee Handbook." },
    { full_name: "Tilo Galvan", role: "Trustee", summary: "Listed as a trustee in the Athens ISD Employee Handbook." },
    { full_name: "Gina Hunter", role: "Trustee", summary: "Listed as a trustee in the Athens ISD Employee Handbook." },
  ],
  sulphur_springs_isd: [
    { full_name: "Craig Roberts", role: "Board President", summary: "Listed as President on the Sulphur Springs ISD Meet the Board page." },
    { full_name: "Leesa Toliver", role: "Vice President", summary: "Listed as Vice President on the Sulphur Springs ISD Meet the Board page." },
    { full_name: "Adam Teer", role: "Secretary", summary: "Listed as Secretary on the Sulphur Springs ISD Meet the Board page." },
    { full_name: "John Campbell", role: "Trustee", summary: "Listed on the Sulphur Springs ISD Meet the Board page." },
    { full_name: "Kati Adair", role: "Trustee", summary: "Listed on the Sulphur Springs ISD Meet the Board page." },
    { full_name: "Brian Kelly", role: "Trustee", summary: "Listed on the Sulphur Springs ISD Meet the Board page." },
    { full_name: "Darla Reed", role: "Trustee", summary: "Listed on the Sulphur Springs ISD Meet the Board page." },
  ],
  texarkana_isd: [
    { full_name: "Wanda Boyette", role: "President", summary: "Identified as President of the TISD Board of Trustees in October 2025 reporting." },
    { full_name: "Amy Bowers", role: "Vice President", summary: "Identified as Vice President in TISD Board reporting." },
    { full_name: "Bryan DePriest", role: "Secretary", summary: "Identified as Secretary in TISD Board reporting." },
    { full_name: "Paul Miller", role: "Trustee", summary: "Listed as a trustee in TISD Board reporting." },
  ],
  henderson_isd: [
    { full_name: "James Holmes", role: "Board President", summary: "Listed as Board President on the Henderson ISD Board of Trustees page." },
    { full_name: "Travis Orr", role: "Trustee", seat: "District 2", summary: "Listed as District 2 Trustee on the Henderson ISD Board of Trustees page." },
    { full_name: "Jean Williams", role: "Secretary", seat: "District 1", summary: "Listed as District 1 Trustee and Secretary." },
    { full_name: "Jon Johnston", role: "Trustee", seat: "At Large", summary: "Listed as At Large Trustee on the Henderson ISD Board of Trustees page." },
  ],
  tatum_isd: [
    { full_name: "Everigester Adams Jr.", role: "President", summary: "Identified as President of the Tatum ISD Board of Trustees per the district's Our School Board page." },
  ],
  plano_isd: [
    { full_name: "Dr. Lauren Tyra", role: "President", summary: "Listed as Plano ISD Board President per the Region 10 2025 Outstanding School Board announcement." },
    { full_name: "Nancy Humphrey", role: "Vice President", summary: "Listed as Vice President per the Region 10 announcement." },
    { full_name: "Tarrah Lantz", role: "Secretary", summary: "Listed as Secretary per the Region 10 announcement." },
    { full_name: "Sam Johnson", role: "Trustee", summary: "Listed as a trustee per the Region 10 announcement." },
    { full_name: "Michael Cook", role: "Trustee", summary: "Listed as a trustee per the Region 10 announcement." },
    { full_name: "Elisa Klein", role: "Trustee", summary: "Listed as a trustee per the Region 10 announcement." },
    { full_name: "Katherine Goodwin", role: "Trustee", summary: "Listed as a trustee per the Region 10 announcement." },
  ],
  frisco_isd: [
    { full_name: "Suresh Manduva", role: "Trustee", summary: "Elected to a three-year term on the Frisco ISD Board in May 2025." },
    { full_name: "Renee Sample", role: "Trustee", summary: "Elected to a three-year term on the Frisco ISD Board in May 2025." },
    { full_name: "Stephanie Elad", role: "Trustee", summary: "Elected to a three-year term on the Frisco ISD Board in May 2025." },
  ],
  houston_isd: [
    { full_name: "Maria Benzon", role: "Trustee", seat: "District V", summary: "Elected to HISD District V on November 4, 2025 with 63.1% of the vote. Voting power suspended under TEA state takeover until at least 2027." },
    { full_name: "Michael McDonough", role: "Trustee", seat: "District VI", summary: "Elected to HISD District VI on November 4, 2025 with 60.4% of the vote, defeating incumbent Kendall Baker." },
    { full_name: "Bridget Wade", role: "Trustee", seat: "District VII", summary: "Re-elected to HISD District VII on November 4, 2025 with 54.1% of the vote." },
    { full_name: "Felicity Pereyra", role: "Trustee", seat: "District I", summary: "Won unopposed in November 2025; term begins January. Voting power suspended under TEA takeover." },
    { full_name: "Myrna Guidry", role: "Trustee", seat: "District IX", summary: "Re-elected unopposed in November 2025." },
  ],
  dallas_isd: [
    { full_name: "Ed Turner", role: "1st Vice President", seat: "District 9", term: "2024-2027", summary: "Represents South Dallas including Pleasant Grove, Deep Ellum, Uptown, and East Dallas." },
    { full_name: "Prisma Y. García", role: "2nd Vice President", seat: "District 4", term: "2025-2028", summary: "Represents Northwest Dallas including parts of Carrollton and Farmers Branch." },
    { full_name: "Sarah Weinberg", role: "Board Secretary", seat: "District 2", term: "2023-2026", summary: "Represents North and Near East Dallas." },
    { full_name: "Dan Micciche", role: "Trustee", seat: "District 3", term: "2024-2027", summary: "Represents Northeast Dallas." },
    { full_name: "Byron Sanders", role: "Trustee", seat: "District 5", term: "2025-2028", summary: "Represents Oak Lawn, West Dallas, Wilmer, Hutchins, and East Oak Cliff." },
    { full_name: "Joyce Foreman", role: "Trustee", seat: "District 6", term: "2023-2026", summary: "Represents Southwest Dallas." },
    { full_name: "Ben Mackey", role: "Trustee", seat: "District 7", term: "2025-2028", summary: "Listed as a Dallas ISD trustee per the official board directory." },
  ],
  austin_isd: [
    { full_name: "Lynn Boswell", role: "Board President", seat: "District 5", summary: "Continued as Board President per Austin ISD Feb 2026 officer election announcement." },
    { full_name: "Andrew Gonzales", role: "Vice President", seat: "District 6", summary: "Selected as Vice President in Austin ISD's Feb 2026 board officer election." },
    { full_name: "Dr. Kevin Foster", role: "Secretary", seat: "District 3", summary: "Selected as Secretary in Austin ISD's Feb 2026 board officer election." },
    { full_name: "LaRessa Quintana", role: "Trustee", seat: "District 2", term: "Term expires November 2028", summary: "Listed as one of the newest members of the Austin ISD board of trustees." },
    { full_name: "Kathryn Whitley Chu", role: "Trustee", seat: "District 4", summary: "Listed as the District 4 trustee on Austin ISD's Members page." },
    { full_name: "Fernando Lucas De Urioste", role: "Trustee", seat: "At-Large", summary: "Sworn in as the at-large trustee, completing the nine-member Austin ISD Board." },
  ],
  san_antonio_isd: [
    { full_name: "Christina Martinez", role: "Board President", summary: "Listed as President of the San Antonio ISD Board of Trustees." },
    { full_name: "Mike Villarreal", role: "Trustee", summary: "Listed on the San Antonio ISD Board of Trustees." },
    { full_name: "Alicia Sebastian", role: "Trustee", summary: "Listed on the San Antonio ISD Board of Trustees." },
    { full_name: "Jacob Ramos", role: "Trustee", summary: "Listed on the San Antonio ISD Board of Trustees." },
    { full_name: "Arthur V. Valdez Jr.", role: "Trustee", summary: "Listed on the San Antonio ISD Board of Trustees." },
    { full_name: "Stephanie Torres", role: "Trustee", summary: "Listed on the San Antonio ISD Board of Trustees. Censured by the board and banned from district campuses for 90 days in May 2025 per KSAT reporting." },
    { full_name: "Ed Garza", role: "Trustee", summary: "Listed on the San Antonio ISD Board of Trustees." },
  ],
  fort_worth_isd: [
    { full_name: "Roxanne Martinez", role: "Board President", summary: "Listed as President of the elected Fort Worth ISD Board of Trustees. Authority of the elected board temporarily suspended by the Texas Education Agency in March 2026 during state takeover." },
  ],
  katy_isd: [
    { full_name: "Lance Redmon", role: "Board President", seat: "Position 2", summary: "Re-elected to Position 2 in May 2025 with more than 75% of the vote, then elected as board president." },
    { full_name: "Rebecca Fox", role: "Vice President", summary: "Listed as Vice President of the Katy ISD Board." },
    { full_name: "Dawn Champagne", role: "Secretary", summary: "Listed as Secretary of the Katy ISD Board." },
    { full_name: "James Cross", role: "Trustee", seat: "Position 1", summary: "Elected to Position 1 in May 2025 with 58% of the vote." },
  ],
  cypress_fairbanks_isd: [
    { full_name: "Tom Jackson", role: "Board President", summary: "Elected as Cy-Fair ISD Board President per the November 2025 swearing-in announcement." },
    { full_name: "Julie Hinaman", role: "Vice President", summary: "Elected as Cy-Fair ISD Board Vice President in November 2025." },
    { full_name: "Gilbert Sarabia", role: "Secretary", summary: "Elected as Cy-Fair ISD Board Secretary in November 2025." },
    { full_name: "Lesley Guilmart", role: "Trustee", seat: "Position 5", term: "December 2025 - 2029", summary: "Newly elected Cy-Fair ISD trustee per November 2025 election results." },
    { full_name: "Cleveland Lane Jr.", role: "Trustee", seat: "Position 6", term: "December 2025 - 2029", summary: "Newly elected Cy-Fair ISD trustee per November 2025 election results." },
    { full_name: "Kendra Camarena", role: "Trustee", seat: "Position 7", term: "December 2025 - 2029", summary: "Newly elected Cy-Fair ISD trustee per November 2025 election results." },
  ],
  round_rock_isd: [
    { full_name: "Tiffanie N. Harrison", role: "Former Board President", seat: "Place 6", summary: "Elected the first Black board president in district history (November 2024) and resigned the Place 6 seat on August 21, 2025. Replacement application process opened by trustees." },
  ],
  killeen_isd: [
    { full_name: "Brant Williams", role: "Board President", summary: "Listed as President in the Killeen ISD August 26, 2025 regular board meeting record." },
    { full_name: "Susan Jones", role: "Vice President", summary: "Listed as Vice President per the Killeen ISD August 26, 2025 board meeting record." },
    { full_name: "Brenda Adams", role: "Secretary", summary: "Listed as Secretary per the Killeen ISD August 26, 2025 board meeting record." },
    { full_name: "Marvin Rainwater", role: "Trustee", summary: "Listed as a trustee per the Killeen ISD August 26, 2025 board meeting record." },
    { full_name: "Oliver Mintz", role: "Trustee", summary: "Listed as a trustee per the Killeen ISD August 26, 2025 board meeting record." },
    { full_name: "Tina Capito", role: "Trustee", summary: "Listed as a trustee per the Killeen ISD August 26, 2025 board meeting record." },
    { full_name: "Rodney Gilchrist", role: "Trustee", summary: "Listed as a trustee per the Killeen ISD August 26, 2025 board meeting record." },
  ],
  conroe_isd: [
    { full_name: "Nicole May", role: "Trustee", seat: "Position 4", summary: "Sworn in to Position 4 in November 2024." },
    { full_name: "Lindsay Dawson", role: "Trustee", seat: "Position 5", summary: "Sworn in to Position 5 in November 2024." },
    { full_name: "Melissa Semmler", role: "Trustee", seat: "Position 6", summary: "Sworn in to Position 6 in November 2024." },
    { full_name: "Marianne Horton", role: "Trustee", seat: "Position 7", summary: "Defeated John Robichau on November 5, 2024 to win Conroe ISD Position 7." },
  ],
  northside_isd: [
    { full_name: "Dr. Karla Duran", role: "Board President", summary: "Elected as Northside ISD Board President in May 2025." },
    { full_name: "Dr. Sonia Jasso", role: "Vice President", seat: "Single Member District 2", summary: "Elected Vice President in May 2025." },
    { full_name: "David Salcido", role: "Secretary", summary: "Elected Secretary of the Northside ISD Board in May 2025." },
    { full_name: "Laura Zapata", role: "Trustee", seat: "Single Member District 5", summary: "Listed as Northside ISD Single Member District 5 trustee." },
    { full_name: "Dr. Carol Harle", role: "Trustee", seat: "District 6", summary: "Listed as Northside ISD District 6 trustee." },
    { full_name: "Karen Freeman", role: "Trustee", seat: "District 7", summary: "Listed as Northside ISD District 7 trustee." },
    { full_name: "Robert Blount Jr.", role: "Trustee", summary: "Longtime Northside ISD trustee and President of the Bexar County School Boards Coalition." },
  ],
};

// Merge any rosters/sources contributed through the extension module.
for (const extension of TEXAS_ROSTER_EXTENSIONS) {
  if (!DISTRICT_SOURCES[extension.district_slug]) {
    DISTRICT_SOURCES[extension.district_slug] = extension.sources.map((source) => ({
      url: source.url,
      title: source.title,
      accessed_date: source.accessed_date ?? ACCESSED_DATE,
      source_type: source.source_type,
    }));
  }
  if (!OFFICIAL_ROSTERS[extension.district_slug]) {
    OFFICIAL_ROSTERS[extension.district_slug] = extension.roster.map((member) => ({
      full_name: member.full_name,
      role: member.role,
      seat: member.seat,
      term: member.term,
      occupation: member.occupation,
      summary: member.summary,
    }));
  }
}

const DISTRICT_FEED: SchoolBoardFeedItem[] = [
  {
    id: "longview-police-dept-security-2025",
    district_slug: "longview_isd",
    type: "breaking",
    title: "Board approved district police department and hybrid security model",
    summary: "Longview ISD reported that trustees approved creation of a district police department and a hybrid security model combining commissioned district police with a School Marshal Program.",
    source_url: "https://w3.lisd.org/district/news/06092025-board",
    source_title: "Longview ISD June 9, 2025 board update",
    event_date: "2025-06-09",
    status: "verified",
    severity: "medium",
  },
  {
    id: "longview-facilities-contracts-2025",
    district_slug: "longview_isd",
    type: "breaking",
    title: "$69.6M early learning and transportation projects approved",
    summary: "Longview ISD reported unanimous approval of Jackson Construction for early childhood learning center and transportation building projects totaling $69.6 million.",
    source_url: "https://w3.lisd.org/district/news/01132025-board",
    source_title: "Longview ISD Jan. 13, 2025 board update",
    event_date: "2025-01-13",
    status: "verified",
    severity: "medium",
  },
  {
    id: "carthage-employee-compensation-2022",
    district_slug: "carthage_isd",
    type: "praise",
    title: "Employee compensation plan approved unanimously",
    summary: "Carthage ISD reported that trustees unanimously approved a 2022-23 employee compensation plan intended to support staff recruitment and retention.",
    source_url: "https://www.carthageisd.org/article/753621",
    source_title: "Carthage ISD compensation plan announcement",
    event_date: "2022-05-16",
    status: "verified",
    severity: "positive",
  },
  {
    id: "carthage-bond-election-2025",
    district_slug: "carthage_isd",
    type: "breaking",
    title: "$23M bond election called for May 2025",
    summary: "Carthage ISD reported that trustees unanimously called a $23 million bond election for facilities, technology, and transportation needs, with no tax-rate increase stated by the district.",
    source_url: "https://www.carthageisd.org/article/2032956",
    source_title: "Carthage ISD bond election announcement",
    event_date: "2025-02-13",
    status: "verified",
    severity: "medium",
  },
  {
    id: "pine-tree-honor-roll-2026",
    district_slug: "pine_tree_isd",
    type: "praise",
    title: "Two campuses named to 2025 Texas Honor Roll",
    summary: "Pine Tree ISD reported that Birch Elementary and Parkway Elementary were named to the 2025 Texas Honor Roll.",
    source_url: "https://www.ptisd.org/article/2712537",
    source_title: "Pine Tree ISD Honor Roll announcement",
    event_date: "2026-02-17",
    status: "verified",
    severity: "positive",
  },
  {
    id: "new-diana-student-art-watch-2026",
    district_slug: "new_diana_isd",
    type: "praise",
    title: "Student work and board recognitions need a positive file",
    summary: "New Diana ISD's live feed includes student recognitions tied to board meetings. These should be tracked as positive community and student-achievement items.",
    source_url: "https://www.ndisd.org/live-feed",
    source_title: "New Diana ISD Live Feed",
    status: "watching",
    severity: "positive",
  },
  {
    id: "marshall-board-video-watch",
    district_slug: "marshall_isd",
    type: "social_watch",
    title: "Board meeting videos are posted by the district",
    summary: "Marshall ISD says regular board meetings are videoed and posted. Watch list: public comments, consent-agenda votes, discipline/safety items, curriculum debates, and parent-rights issues.",
    source_url: "https://www.marshallisd.com/page/school-board",
    source_title: "Marshall ISD School Board",
    status: "watching",
    severity: "low",
  },
  {
    id: "kilgore-public-comment-watch",
    district_slug: "kilgore_isd",
    type: "public_comment",
    title: "Public comment window identified",
    summary: "Kilgore ISD board procedure allows public comments at regular meetings with sign-up before the meeting. This is the starting point for tracking parent concerns from public meetings.",
    source_url: "https://www.kisd.org/board/code-of-conductoperating-procedures",
    source_title: "Kilgore ISD Code of Conduct / Operating Procedures",
    status: "verified",
    severity: "low",
  },
];

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function candidateFromRoster(district: (typeof EAST_TEXAS_PRIORITY_DISTRICTS)[number], member: OfficialRosterMember): CandidateDossier {
  const source = DISTRICT_SOURCES[district.district_slug]?.[0];
  return {
    candidate_id: `${slugify(member.full_name)}_${district.district_slug}`,
    full_name: member.full_name,
    preferred_name: member.full_name,
    occupation: member.occupation,
    district: district.district,
    district_slug: district.district_slug,
    county: district.county,
    state: "TX",
    seat: member.seat,
    role: member.role ?? "Trustee",
    incumbent: true,
    party_registration: "Unknown",
    summary: member.summary ?? `${member.full_name} is listed on the official ${district.district} board roster. Full investigative review is pending.`,
    research_gaps: [
      "Pull board meeting attendance and votes from agendas/minutes.",
      "Search public comments and board video for parent concerns.",
      "Check campaign finance filings and election history.",
      "Check litigation, grievance, ethics, employment, and conflict records from public sources.",
      "Check public primary voting history only from lawful public records.",
      "Review social media only for public posts relevant to official conduct or school governance.",
    ],
    sources: source ? [source] : [],
    status: "stub",
    last_updated: ACCESSED_DATE,
  };
}

const RESEARCH_ROOT = path.join(process.cwd(), "school_boards", "texas", "east_texas");

function collectFiles(dir: string, extension: string): string[] {
  const files: string[] = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) files.push(...collectFiles(fullPath, extension));
      if (entry.isFile() && entry.name.endsWith(extension)) files.push(fullPath);
    }
  } catch {
    return files;
  }
  return files;
}

function readJson<T>(filePath: string): T | undefined {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return undefined;
  }
}

function readOverview(dir: string): DistrictResearch["overview"] {
  const filePath = path.join(dir, "_district_overview.md");
  if (!fs.existsSync(filePath)) return undefined;
  const rawText = fs.readFileSync(filePath, "utf8");
  const title = rawText.match(/^#\s+(.+)$/m)?.[1] ?? "District Overview";
  const tableLines = rawText.split("\n").filter((line) => line.startsWith("|") && !line.includes("---"));
  const quickFacts = tableLines.slice(1).flatMap((line) => {
    const cells = line.split("|").map((cell) => cell.trim().replace(/\*\*/g, "")).filter(Boolean);
    return cells.length >= 2 ? [{ label: cells[0], value: cells[1].replace(/\[(.+?)\]\(.+?\)/g, "$1") }] : [];
  });
  return { title, quickFacts: quickFacts.slice(0, 10), rawText };
}

export function getSchoolBoardDossiers(): CandidateDossier[] {
  const dossierCandidates = collectFiles(RESEARCH_ROOT, ".json")
    .map((file) => readJson<CandidateDossier>(file))
    .filter((candidate): candidate is CandidateDossier => Boolean(candidate?.candidate_id));
  const byId = new Map<string, CandidateDossier>();

  dossierCandidates.forEach((candidate) => byId.set(candidate.candidate_id, candidate));

  EAST_TEXAS_PRIORITY_DISTRICTS.forEach((district) => {
    OFFICIAL_ROSTERS[district.district_slug]?.forEach((member) => {
      const candidate = candidateFromRoster(district, member);
      if (!byId.has(candidate.candidate_id)) byId.set(candidate.candidate_id, candidate);
    });
  });

  return Array.from(byId.values())
    .sort((a, b) => a.district.localeCompare(b.district) || (a.seat ?? a.full_name).localeCompare(b.seat ?? b.full_name));
}

export function getSchoolBoardDistricts(): DistrictResearch[] {
  const bySlug = new Map<string, DistrictResearch>();
  const fileByCandidateId = new Map<string, string>();

  for (const file of collectFiles(RESEARCH_ROOT, ".json")) {
    const candidate = readJson<CandidateDossier>(file);
    if (candidate?.candidate_id) fileByCandidateId.set(candidate.candidate_id, file);
  }

  for (const candidate of getSchoolBoardDossiers()) {
    const existing = bySlug.get(candidate.district_slug);
    if (existing) existing.candidates.push(candidate);
    else bySlug.set(candidate.district_slug, { district: candidate.district, district_slug: candidate.district_slug, county: candidate.county, candidates: [candidate] });
  }

  for (const district of bySlug.values()) {
    const candidateFile = fileByCandidateId.get(district.candidates[0]?.candidate_id ?? "");
    if (candidateFile) district.overview = readOverview(path.dirname(candidateFile));
  }

  EAST_TEXAS_PRIORITY_DISTRICTS.forEach((priority, index) => {
    const existing = bySlug.get(priority.district_slug);
    if (existing) {
      existing.priorityRank = index + 1;
      existing.queueStatus = "dossiers_started";
      existing.officialRoster = OFFICIAL_ROSTERS[priority.district_slug] ?? existing.candidates.map((candidate) => ({
        full_name: candidate.full_name,
        seat: candidate.seat,
        role: candidate.role,
        occupation: candidate.occupation,
      }));
      existing.feed = DISTRICT_FEED.filter((item) => item.district_slug === priority.district_slug);
      existing.sourceLinks = DISTRICT_SOURCES[priority.district_slug] ?? [];
      existing.investigationQueue = getDistrictInvestigationQueue(priority.district_slug);
    } else {
      bySlug.set(priority.district_slug, {
        ...priority,
        candidates: [],
        priorityRank: index + 1,
        queueStatus: "needs_full_records_pull",
        officialRoster: OFFICIAL_ROSTERS[priority.district_slug] ?? [],
        feed: DISTRICT_FEED.filter((item) => item.district_slug === priority.district_slug),
        sourceLinks: DISTRICT_SOURCES[priority.district_slug] ?? [],
        investigationQueue: getDistrictInvestigationQueue(priority.district_slug),
      });
    }
  });

  return Array.from(bySlug.values()).sort((a, b) => {
    if (a.priorityRank && b.priorityRank) return a.priorityRank - b.priorityRank;
    if (a.priorityRank) return -1;
    if (b.priorityRank) return 1;
    return a.district.localeCompare(b.district);
  });
}

export function getSchoolBoardDistrict(slug: string): DistrictResearch | undefined {
  return getSchoolBoardDistricts().find((district) => district.district_slug === slug);
}

export function getSchoolBoardCandidate(id: string): CandidateDossier | undefined {
  return getSchoolBoardDossiers().find((candidate) => candidate.candidate_id === id);
}

export function getDistrictFeed(slug: string): SchoolBoardFeedItem[] {
  return DISTRICT_FEED.filter((item) => item.district_slug === slug);
}

export function getDistrictSourceLinks(slug: string): SourceLink[] {
  return DISTRICT_SOURCES[slug] ?? [];
}

export function getDistrictInvestigationQueue(slug: string): string[] {
  const base = [
    "Board agendas, minutes, videos, and consent agendas for the last 24 months.",
    "Public-comment records and parent concerns stated in official meetings or public posts.",
    "Student safety, discipline, bullying, SRO, and sex-based privacy policy decisions.",
    "Curriculum, library, SHAC, sex education, health education, and instructional material decisions.",
    "Campaign finance, ballot filings, candidate applications, and election results.",
    "Conflict checks: district vendors, family employment, nonprofits, foundations, and cross-district employment.",
    "Legal checks: civil litigation, criminal records, ethics complaints, grievances, TEA matters, and board sanctions from public records.",
    "Positive records: student achievement, staff raises, safety improvements, transparent votes, and community service.",
  ];

  const districtSpecific: Record<string, string[]> = {
    longview_isd: ["Track the district police department vote, School Marshal Program implementation, contracts, and parent response."],
    marshall_isd: ["Review posted board videos for parent comments and trustee responses."],
    kilgore_isd: ["Track public-comment sign-up items and any excluded employee/student-specific comments by topic, not private names."],
    carthage_isd: ["Verify superintendent status and all board action tied to leadership changes from official minutes before publishing conclusions."],
    pine_tree_isd: ["Track 2026 Place 6 and Place 7 election filings and any board action related to campus performance."],
    new_diana_isd: ["Review board meeting recognitions and any SRO/security connections because multiple trustees list law-enforcement or security backgrounds."],
    ore_city_isd: ["Review 2026 election documents and trustee training-hour filings attached on the district board page."],
    waskom_isd: ["Review May 2026 at-large election documents and posted minutes for all three expiring seats."],
    jefferson_isd: ["Confirm whether the official board page lists all seven trustees or only the visible five before marking roster complete."],
    lufkin_isd: ["Pull seat numbers and term-expiration dates for each Lufkin ISD trustee from the official school board page or board policy manual."],
    mount_pleasant_isd: ["Roster currently shows only the President (Yvonne Hampton) and Vice President (Buddy Blue). Pull the remaining five trustees, seat numbers, and term info from the Mount Pleasant ISD school board page."],
    whitehouse_isd: ["Confirm Dr. Conflitti's full first name and any remaining trustee not yet listed. Pull seat numbers and term dates for all seven Whitehouse ISD trustees."],
    lindale_isd: ["Pull all seven Lindale ISD trustees including seat assignments, terms, and 2026 May ballot opponents (Place 3: James Edwards Sr. vs Andy Ford)."],
    tyler_isd: ["Tyler ISD roster currently has only one confirmed trustee (Lindsey Harrison, District 6 appointment). Pull the remaining six single-member-district trustees with terms from the official school board page."],
    athens_isd: ["Confirm seat numbers and term expirations for all seven Athens ISD trustees from the official board page; track the May 2025 bond election outcomes."],
    sulphur_springs_isd: ["Pull seat numbers, term-end dates, and any standing committee assignments for each Sulphur Springs ISD trustee."],
    texarkana_isd: ["Roster currently lists 4 of 7 Texarkana ISD trustees (President, VP, Secretary, plus Paul Miller). Pull the remaining at-large and geographic-district trustees and confirm Fred Norton Jr.'s successor following his October 2025 resignation."],
    henderson_isd: ["Roster currently lists 4 of 7 Henderson ISD trustees. Pull the remaining 3 trustees (likely Districts 3, 4, and 5) and any Vice President / At-Large designation for the named trustees."],
    tatum_isd: ["Roster currently lists only the Tatum ISD Board President (Everigester Adams Jr.). Pull the remaining trustees and seat structure from the official Our School Board page."],
    plano_isd: ["Confirm seat numbers (Place 1-7), term-end dates, and committee assignments for the seven Plano ISD trustees recognized by Region 10."],
    frisco_isd: ["Roster currently lists only the three trustees elected in May 2025 (Suresh Manduva, Renee Sample, Stephanie Elad). Pull the remaining four trustees, seat numbers, and term-end dates."],
    houston_isd: ["HISD elected trustees do not have voting authority until at least 2027 because of the TEA-appointed Board of Managers. Track both the elected board (Districts I-IX) and the appointed managers separately. Pull the appointed Board of Managers roster from TEA and verify the four remaining elected trustees beyond the five sourced here."],
    dallas_isd: ["Identify the current Board President for Dallas ISD (Ed Turner is listed as 1st Vice President). Confirm District 1 and District 8 trustees and verify any vacancies or recent appointments."],
    austin_isd: ["Roster currently has 6 of the 9 trustees. Pull District 1, District 7, and the remaining at-large trustee. Confirm seat numbers and term-end dates for all members."],
    san_antonio_isd: ["Confirm seat numbers (single-member districts 1-7) and term-end dates for each SAISD trustee. Track follow-up records on the Stephanie Torres censure vote from May 2025."],
    fort_worth_isd: ["Pull the remaining 8 elected Fort Worth ISD trustees beyond President Roxanne Martinez. Also pull the TEA-appointed Board of Managers roster (March 2026) and track the transition period."],
    katy_isd: ["Roster currently lists 4 of 7 Katy ISD trustees. Pull the remaining trustees in Positions 3, 4, and 5 (which are on the May 2026 ballot) and track those races for 2026 election outcomes."],
    cypress_fairbanks_isd: ["Cy-Fair ISD November 2025 election shifted the board majority. Pull the remaining 4 trustees (Positions 1-4) beyond the 6 sourced here. Track follow-up policy votes after the slate flip."],
    round_rock_isd: ["Round Rock ISD Place 6 is vacant after Tiffanie Harrison's August 2025 resignation. Pull the appointed replacement and the remaining 6 trustees and their term-end dates from the official board page."],
    killeen_isd: ["Pull seat/place numbers and term-end dates for each Killeen ISD trustee. Track the search for a permanent superintendent following Dr. King Davis's interim appointment."],
    conroe_isd: ["Roster currently lists 4 of 7 Conroe ISD trustees (Positions 4, 5, 6, 7). Pull Positions 1, 2, and 3 and the current Board President. Track follow-up records on the proposed gender-identity policy debate from 2024."],
    northside_isd: ["Confirm seat numbers (single-member districts 1-7) and term-end dates for each Northside ISD trustee. Track May 2025 election follow-ups for the two seats incumbents lost."],
  };

  for (const extension of TEXAS_ROSTER_EXTENSIONS) {
    if (extension.investigationNotes?.length && !districtSpecific[extension.district_slug]) {
      districtSpecific[extension.district_slug] = extension.investigationNotes;
    }
  }

  return [...(districtSpecific[slug] ?? []), ...base];
}

export function getCandidateGoodRecords(candidate: CandidateDossier): string[] {
  const items = new Set<string>();
  if (candidate.incumbent && candidate.seat) items.add(`Serves ${candidate.seat}${candidate.role ? ` as ${candidate.role}` : ""} on the ${candidate.district} board.`);
  if (candidate.occupation && !candidate.occupation.includes("REQUIRES_FURTHER_EVIDENCE")) items.add(`Public profile lists occupation as ${candidate.occupation}.`);
  candidate.about_public_record?.affiliations_full_inventory?.slice(0, 3).forEach((item) => {
    if (item.organization && item.role) items.add(`${item.role} with ${item.organization}.`);
  });
  candidate.about_public_record?.complete_employment_timeline?.slice(0, 2).forEach((item) => {
    if (item.employer && item.title && !item.title.includes("REQUIRES_FURTHER_EVIDENCE")) items.add(`${item.title} at ${item.employer}.`);
  });
  candidate.about_public_record?.board_performance_incumbents_only?.notable_votes?.slice(0, 2).forEach((vote) => {
    if (vote.item) items.add(`Board record includes ${vote.item}.`);
  });
  return Array.from(items).slice(0, 6);
}

export function getCandidateFlags(candidate: CandidateDossier): ConflictRecord[] {
  return [...(candidate.red_flags ?? []), ...(candidate.about_public_record?.conflicts_of_interest_inventory ?? [])]
    .filter((flag, index, flags) => flags.findIndex((item) => item.description === flag.description) === index);
}

export function getCandidateGaps(candidate: CandidateDossier): string[] {
  const gaps = new Set(candidate.research_gaps ?? []);
  const serialized = JSON.stringify(candidate);
  if (serialized.includes("REQUIRES_FURTHER_EVIDENCE")) gaps.add("One or more profile fields still need direct source confirmation.");
  if (candidate.unopposed === null || candidate.unopposed === undefined) gaps.add("Opponent status needs direct election filing confirmation.");
  if (!candidate.about_public_record?.board_performance_incumbents_only?.notable_votes?.length) gaps.add("Board attendance and vote record needs deeper minutes review.");
  return Array.from(gaps).slice(0, 8);
}

export function getShareLine(candidate: CandidateDossier): string {
  const flags = getCandidateFlags(candidate);
  const gaps = getCandidateGaps(candidate);
  const good = getCandidateGoodRecords(candidate);
  if (flags[0]) return flags[0].description;
  if (candidate.summary) return candidate.summary;
  if (good[0]) return good[0];
  return gaps[0] ?? `${candidate.full_name} has a RepWatchr public-record profile in progress.`;
}

export function getSchoolBoardStats() {
  const candidates = getSchoolBoardDossiers();
  const districts = getSchoolBoardDistricts();
  const priorityDistricts = districts.filter((district) => district.priorityRank);
  const priorityStarted = priorityDistricts.filter((district) => district.candidates.length > 0);
  const onBallot = candidates.filter((candidate) => candidate.on_2026_ballot || candidate.election_date?.includes("2026"));
  const sourceCount = new Set(candidates.flatMap((candidate) => candidate.sources?.map((source) => source.url) ?? [])).size;
  const flagCount = candidates.reduce((total, candidate) => total + getCandidateFlags(candidate).length, 0);
  const gapCount = candidates.reduce((total, candidate) => total + getCandidateGaps(candidate).length, 0);
  const goodRecordCount = candidates.reduce((total, candidate) => total + getCandidateGoodRecords(candidate).length, 0);
  const counties = new Set(districts.flatMap((district) => district.county.split(/[\/,]/).map((c) => c.trim()).filter(Boolean)));
  const membersWithGoodRecord = candidates.filter((candidate) => getCandidateGoodRecords(candidate).length > 0).length;
  const membersWithFlags = candidates.filter((candidate) => getCandidateFlags(candidate).length > 0).length;
  const districtsWithRosters = districts.filter((district) => (district.officialRoster?.length ?? 0) > 0).length;
  const districtsWithSources = districts.filter((district) =>
    (district.sourceLinks?.length ?? 0) > 0 ||
    district.candidates.some((candidate) => (candidate.sources?.length ?? 0) > 0)
  ).length;
  const stubProfiles = candidates.filter((candidate) => candidate.status === "stub" || candidate.status === "needs_review").length;
  const completedDossiers = candidates.filter(
    (candidate) => candidate.status && candidate.status !== "stub" && candidate.status !== "needs_review"
  ).length;
  const districtsUnderTEAReview = districts.filter((district) => {
    const queueText = (district.investigationQueue ?? []).join(" ").toLowerCase();
    return queueText.includes("tea") || queueText.includes("board of managers") || queueText.includes("takeover");
  }).length;
  const tracked2026Districts = new Set(
    candidates
      .filter((candidate) => candidate.on_2026_ballot || candidate.election_date?.includes("2026"))
      .map((candidate) => candidate.district_slug)
  ).size;
  const districtsByCounty = districts.reduce<Record<string, number>>((acc, district) => {
    district.county.split(/[\/,]/).map((c) => c.trim()).filter(Boolean).forEach((county) => {
      acc[county] = (acc[county] ?? 0) + 1;
    });
    return acc;
  }, {});
  return {
    candidates: candidates.length,
    districts: districts.length,
    onBallot: onBallot.length,
    sourceCount,
    flagCount,
    gapCount,
    goodRecordCount,
    priorityDistricts: priorityDistricts.length,
    priorityStarted: priorityStarted.length,
    counties: counties.size,
    membersWithGoodRecord,
    membersWithFlags,
    districtsWithRosters,
    districtsWithSources,
    stubProfiles,
    completedDossiers,
    districtsUnderTEAReview,
    tracked2026Districts,
    districtsByCounty,
  };
}
