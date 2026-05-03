export type TexasSchoolBoardElectionStatus =
  | "candidate_sources_loaded"
  | "needs_local_results"
  | "canvass_pending"
  | "watching_results";

export interface TexasSchoolBoardElectionSource {
  title: string;
  url: string;
  sourceType: "secretary_of_state" | "district_official" | "county_election_office" | "news" | string;
  accessedDate: string;
}

export interface TexasSchoolBoardElectionMilestone {
  id: string;
  label: string;
  date: string;
  status: "past" | "active" | "upcoming";
  summary: string;
  sourceUrl: string;
}

export interface TexasSchoolBoardElectionCycle {
  id: string;
  label: string;
  electionName: string;
  electionDate: string;
  phase: "unofficial_results" | "canvass" | "runoff_watch";
  summary: string;
  publicNote: string;
  sourceLinks: TexasSchoolBoardElectionSource[];
  milestones: TexasSchoolBoardElectionMilestone[];
}

export interface TexasSchoolBoardDistrictElectionWatch {
  districtSlug: string;
  district: string;
  county: string;
  status: TexasSchoolBoardElectionStatus;
  sourceLinks: TexasSchoolBoardElectionSource[];
  notes: string[];
}

export const TEXAS_SCHOOL_BOARD_ELECTION_ACCESSED_DATE = "2026-05-03";

const mayCalendarSource: TexasSchoolBoardElectionSource = {
  title: "Texas Secretary of State May 2, 2026 Election Law Calendar",
  url: "https://www.sos.texas.gov/elections/laws/advisory2026-02-may-election-law-calendar.shtml",
  sourceType: "secretary_of_state",
  accessedDate: TEXAS_SCHOOL_BOARD_ELECTION_ACCESSED_DATE,
};

const postElectionSource: TexasSchoolBoardElectionSource = {
  title: "Texas Secretary of State Post-Election Procedures for May 2, 2026",
  url: "https://www.sos.state.tx.us/elections/laws/advisory2026-15.shtml",
  sourceType: "secretary_of_state",
  accessedDate: TEXAS_SCHOOL_BOARD_ELECTION_ACCESSED_DATE,
};

export const TEXAS_SCHOOL_BOARD_2026_CYCLE: TexasSchoolBoardElectionCycle = {
  id: "texas-school-board-may-2026",
  label: "May 2026 Texas school-board election cycle",
  electionName: "May 2, 2026 Uniform Election",
  electionDate: "2026-05-02",
  phase: "unofficial_results",
  summary:
    "Election Day has passed. RepWatchr should treat local school-board results as unofficial until each district or county canvass is posted, then update trustee profiles, terms, runoff status, and scorecard election context.",
  publicNote:
    "Texas does not publish one single certified statewide result file for every ISD trustee race. School-board results normally live with the district, county elections office, or local election administrator.",
  sourceLinks: [mayCalendarSource, postElectionSource],
  milestones: [
    {
      id: "election-day",
      label: "Election Day",
      date: "2026-05-02",
      status: "past",
      summary: "May uniform election day for local entities, including many school districts.",
      sourceUrl: mayCalendarSource.url,
    },
    {
      id: "canvass-opens",
      label: "Canvass window opens",
      date: "2026-05-05",
      status: "upcoming",
      summary: "Earliest date identified by the Texas SOS for the local canvass window.",
      sourceUrl: postElectionSource.url,
    },
    {
      id: "canvass-deadline",
      label: "Canvass deadline",
      date: "2026-05-13",
      status: "upcoming",
      summary: "Last day identified by the Texas SOS for the local canvass window.",
      sourceUrl: postElectionSource.url,
    },
    {
      id: "runoff-election",
      label: "Runoff date",
      date: "2026-06-13",
      status: "upcoming",
      summary: "Runoff election day for applicable May 2 local races that require a runoff.",
      sourceUrl: mayCalendarSource.url,
    },
  ],
};

function districtElectionSource(title: string, url: string): TexasSchoolBoardElectionSource {
  return {
    title,
    url,
    sourceType: "district_official",
    accessedDate: TEXAS_SCHOOL_BOARD_ELECTION_ACCESSED_DATE,
  };
}

export const TEXAS_SCHOOL_BOARD_ELECTION_WATCH: TexasSchoolBoardDistrictElectionWatch[] = [
  {
    districtSlug: "longview_isd",
    district: "Longview ISD",
    county: "Gregg",
    status: "canvass_pending",
    sourceLinks: [districtElectionSource("Longview ISD District Elections", "https://w3.lisd.org/board/elections")],
    notes: ["Pull posted results, canvass records, certificate/oath updates, and any runoff notice before marking terms final."],
  },
  {
    districtSlug: "pine_tree_isd",
    district: "Pine Tree ISD",
    county: "Gregg",
    status: "canvass_pending",
    sourceLinks: [districtElectionSource("Pine Tree ISD Elections", "https://www.ptisd.org/page/elections")],
    notes: ["Track Place 6 and Place 7 results, canvass records, and any updated board roster after certification."],
  },
  {
    districtSlug: "tyler_isd",
    district: "Tyler ISD",
    county: "Smith",
    status: "canvass_pending",
    sourceLinks: [districtElectionSource("Tyler ISD Board Elections", "https://www.tylerisd.org/page/school-board-elections")],
    notes: ["Verify all single-member district seats, local result postings, and updated oath/term records before marking profiles complete."],
  },
  {
    districtSlug: "lindale_isd",
    district: "Lindale ISD",
    county: "Smith",
    status: "watching_results",
    sourceLinks: [districtElectionSource("Lindale ISD School Board", "https://www.lindaleeagles.org/school-board")],
    notes: ["Watch the Place 3 race, posted canvass, and any local runoff/certificate updates tied to the May 2026 ballot."],
  },
  {
    districtSlug: "waskom_isd",
    district: "Waskom ISD",
    county: "Harrison",
    status: "watching_results",
    sourceLinks: [districtElectionSource("Waskom ISD Board Information", "https://www.waskomisd.net/wisd-board-of-trustees-information")],
    notes: ["Review May 2026 at-large election records for all expiring seats and update trustee terms after canvass."],
  },
  {
    districtSlug: "ore_city_isd",
    district: "Ore City ISD",
    county: "Upshur",
    status: "watching_results",
    sourceLinks: [districtElectionSource("Ore City ISD School Board", "https://www.ocisd.net/apps/pages/index.jsp?uREC_ID=4414214&type=d&pREC_ID=2646873")],
    notes: ["Review 2026 election documents, posted trustee terms, and training-hour records attached to the district board page."],
  },
  {
    districtSlug: "katy_isd",
    district: "Katy ISD",
    county: "Harris/Fort Bend/Waller",
    status: "watching_results",
    sourceLinks: [districtElectionSource("Katy ISD Board Members", "https://www.katyisd.org/board/board/board-members")],
    notes: ["Track Positions 3, 4, and 5, then update profile completion after local results and canvass records are posted."],
  },
  {
    districtSlug: "frisco_isd",
    district: "Frisco ISD",
    county: "Collin/Denton",
    status: "candidate_sources_loaded",
    sourceLinks: [districtElectionSource("Frisco ISD Board Election Results", "https://www.friscoisd.org/news/article/2025/05/04/voters-decide-three-seats-on-frisco-isd-board-of-trustees")],
    notes: ["Use as a model for profile updates once new 2026 local result pages are posted."],
  },
  {
    districtSlug: "houston_isd",
    district: "Houston ISD",
    county: "Harris",
    status: "needs_local_results",
    sourceLinks: [districtElectionSource("Houston ISD Board Governance", "https://www.houstonisd.org/board-governance/our-board")],
    notes: ["Keep elected trustees and TEA-appointed managers separated; election updates must not imply current voting authority where TEA governance overrides it."],
  },
  {
    districtSlug: "northside_isd",
    district: "Northside ISD",
    county: "Bexar",
    status: "candidate_sources_loaded",
    sourceLinks: [districtElectionSource("Northside ISD Board Members", "https://www.nisd.net/board/members")],
    notes: ["Use prior May election results as a completion pattern and keep district-seat terms aligned to official board pages."],
  },
];
