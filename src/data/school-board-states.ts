export type SchoolBoardStateStatus = "loaded" | "queued";

export type SchoolBoardState = {
  code: string;
  name: string;
  status: SchoolBoardStateStatus;
  defaultSelected?: boolean;
  districtsLoaded: number;
  profilesLoaded: number;
  districtsTarget?: number;
  profilesTarget?: number;
  targetLabel?: string;
  sourcePlan: string[];
};

export const TEXAS_SCHOOL_BOARD_TARGET = {
  districtsLabel: "All Texas school districts",
  trusteesLabel: "7,000+ Texas trustees",
  profilesTarget: 7000,
  sourceTitle: "Texas Association of School Boards",
  sourceUrl: "https://www.tasb.org/about",
  sourceNote:
    "TASB describes Texas school-board trustees as the largest group of publicly elected officials in the state, with more than 7,000 trustees.",
};

const nationalSourcePlan = [
  "NCES Common Core of Data district directory",
  "State education agency district directory",
  "District board roster and election pages",
  "County election filings and campaign finance records",
  "Board agendas, minutes, videos, policies, and public comments",
];

export const SCHOOL_BOARD_STATES: SchoolBoardState[] = [
  { code: "AL", name: "Alabama", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "AK", name: "Alaska", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "AZ", name: "Arizona", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "AR", name: "Arkansas", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "CA", name: "California", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "CO", name: "Colorado", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "CT", name: "Connecticut", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "DE", name: "Delaware", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "DC", name: "District of Columbia", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "FL", name: "Florida", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "GA", name: "Georgia", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "HI", name: "Hawaii", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "ID", name: "Idaho", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "IL", name: "Illinois", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "IN", name: "Indiana", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "IA", name: "Iowa", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "KS", name: "Kansas", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "KY", name: "Kentucky", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "LA", name: "Louisiana", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "ME", name: "Maine", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "MD", name: "Maryland", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "MA", name: "Massachusetts", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "MI", name: "Michigan", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "MN", name: "Minnesota", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "MS", name: "Mississippi", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "MO", name: "Missouri", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "MT", name: "Montana", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "NE", name: "Nebraska", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "NV", name: "Nevada", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "NH", name: "New Hampshire", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "NJ", name: "New Jersey", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "NM", name: "New Mexico", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "NY", name: "New York", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "NC", name: "North Carolina", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "ND", name: "North Dakota", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "OH", name: "Ohio", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "OK", name: "Oklahoma", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "OR", name: "Oregon", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "PA", name: "Pennsylvania", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "RI", name: "Rhode Island", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "SC", name: "South Carolina", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "SD", name: "South Dakota", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "TN", name: "Tennessee", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  {
    code: "TX",
    name: "Texas",
    status: "loaded",
    defaultSelected: true,
    districtsLoaded: 0,
    profilesLoaded: 0,
    profilesTarget: TEXAS_SCHOOL_BOARD_TARGET.profilesTarget,
    targetLabel: TEXAS_SCHOOL_BOARD_TARGET.trusteesLabel,
    sourcePlan: [
      "TEA AskTED district directory",
      "NCES Common Core of Data district directory",
      "District board roster and election pages",
      "County election filings and Texas Ethics Commission records",
      "Board agendas, minutes, videos, policies, and public comments",
    ],
  },
  { code: "UT", name: "Utah", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "VT", name: "Vermont", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "VA", name: "Virginia", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "WA", name: "Washington", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "WV", name: "West Virginia", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "WI", name: "Wisconsin", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
  { code: "WY", name: "Wyoming", status: "queued", districtsLoaded: 0, profilesLoaded: 0, sourcePlan: nationalSourcePlan },
];

export const SCHOOL_BOARD_EXPANSION_SOURCES = [
  {
    title: "NCES 2024-25 Common Core of Data directory files",
    url: "https://nces.ed.gov/use-work/dataset/2024-25-common-core-data-ccd-preliminary-directory-files",
    note: "National district and school identifiers, locations, and directory fields.",
  },
  {
    title: "NCES public school district locator",
    url: "https://nces.ed.gov/ccd/search.asp",
    note: "Lookup path for district NCES IDs and district records.",
  },
  {
    title: "TEA AskTED",
    url: "https://tealprod.tea.state.tx.us/tea.askted.web/Forms/Home.aspx",
    note: "Texas district, school, and personnel directory source; updated daily by TEA.",
  },
  {
    title: TEXAS_SCHOOL_BOARD_TARGET.sourceTitle,
    url: TEXAS_SCHOOL_BOARD_TARGET.sourceUrl,
    note: TEXAS_SCHOOL_BOARD_TARGET.sourceNote,
  },
];

export function getSchoolBoardStates({
  loadedDistricts,
  loadedProfiles,
}: {
  loadedDistricts: number;
  loadedProfiles: number;
}) {
  return SCHOOL_BOARD_STATES.map((state) =>
    state.code === "TX"
      ? { ...state, districtsLoaded: loadedDistricts, profilesLoaded: loadedProfiles }
      : state
  );
}
