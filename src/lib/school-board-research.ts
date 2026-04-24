import fs from "fs";
import path from "path";

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

export const EAST_TEXAS_PRIORITY_DISTRICTS = [
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
] as const;

const ACCESSED_DATE = "2026-04-24";

const DISTRICT_SOURCES: Record<string, SourceLink[]> = {
  harleton_isd: [
    { url: "https://www.harletonisd.net/page/board-of-trustees", title: "Harleton ISD Board of Trustees", accessed_date: ACCESSED_DATE, source_type: "district_official" },
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
};

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
  };

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
  return { candidates: candidates.length, districts: districts.length, onBallot: onBallot.length, sourceCount, flagCount, gapCount, priorityDistricts: priorityDistricts.length, priorityStarted: priorityStarted.length };
}
