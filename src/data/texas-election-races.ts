export type TexasElectionRaceLane = "big-race" | "east-texas" | "local-watch";

export type TexasElectionRace = {
  slug: string;
  title: string;
  shortTitle: string;
  office: string;
  lane: TexasElectionRaceLane;
  region: string;
  electionDate: string;
  stage: string;
  priority: number;
  summary: string;
  whyItMatters: string;
  geography: string;
  officialIds: string[];
  recordFocus: string[];
  watchActions: string[];
  sourceLinks: {
    title: string;
    url: string;
  }[];
};

export const TEXAS_ELECTION_DATES = [
  {
    label: "Primary election",
    date: "March 3, 2026",
  },
  {
    label: "Primary runoff election",
    date: "May 26, 2026",
  },
  {
    label: "General election",
    date: "November 3, 2026",
  },
  {
    label: "General-election voter registration deadline",
    date: "October 5, 2026",
  },
  {
    label: "General-election early voting",
    date: "October 19-30, 2026",
  },
];

const texasSosDates = {
  title: "Texas Secretary of State: Important 2026 Election Dates",
  url: "https://www.sos.state.tx.us/elections/voter/important-election-dates.shtml",
};

const texasSosOffices = {
  title: "Texas Secretary of State: Offices Up for Election in 2026",
  url: "https://www.sos.state.tx.us/elections/candidates/guide/2026/offices2026.shtml",
};

const texasTribuneBallot = {
  title: "Texas Tribune: 2026 Texas Primary Ballot Guide",
  url: "https://apps.texastribune.org/features/2026/texas-march-2026-primary-ballot/",
};

export const TEXAS_ELECTION_RACES: TexasElectionRace[] = [
  {
    slug: "texas-us-senate-2026",
    title: "Texas U.S. Senate Race 2026",
    shortTitle: "U.S. Senate",
    office: "United States Senator from Texas",
    lane: "big-race",
    region: "Texas",
    electionDate: "November 3, 2026",
    stage: "General election watch",
    priority: 100,
    summary:
      "The highest-attention statewide federal race in Texas: six-year U.S. Senate power, national money, confirmations, war powers, spending, and federal oversight.",
    whyItMatters:
      "This race controls one of Texas' two U.S. Senate seats and will pull national money, media, donor networks, and federal-record attention into the state.",
    geography: "Statewide Texas",
    officialIds: ["john-cornyn", "ken-paxton"],
    recordFocus: ["Federal votes", "campaign finance", "ethics history", "war powers", "judicial confirmations"],
    watchActions: ["Track current official records", "Attach FEC and campaign-finance sources", "Compare claims to public votes", "Build share packets after every major debate or filing"],
    sourceLinks: [
      texasSosDates,
      texasSosOffices,
      texasTribuneBallot,
      {
        title: "Ballotpedia: United States Senate election in Texas, 2026",
        url: "https://ballotpedia.org/United_States_Senate_election_in_Texas,_2026",
      },
    ],
  },
  {
    slug: "texas-governor-2026",
    title: "Texas Governor Race 2026",
    shortTitle: "Governor",
    office: "Governor of Texas",
    lane: "big-race",
    region: "Texas",
    electionDate: "November 3, 2026",
    stage: "General election watch",
    priority: 96,
    summary:
      "The race for Texas executive power: budget priorities, school policy, border operations, disaster response, appointments, and statewide political direction.",
    whyItMatters:
      "The governor drives statewide priorities and appointments. RepWatchr should make claims, money, emergency decisions, and public-record trails easy to inspect.",
    geography: "Statewide Texas",
    officialIds: ["greg-abbott"],
    recordFocus: ["Executive orders", "border spending", "education policy", "disaster response", "appointments"],
    watchActions: ["Tie every major claim to a public source", "Track donor concentration", "Attach state-agency records", "Build issue-by-issue record cards"],
    sourceLinks: [
      texasSosDates,
      texasSosOffices,
      texasTribuneBallot,
      {
        title: "Ballotpedia: Texas gubernatorial election, 2026",
        url: "https://ballotpedia.org/Texas_gubernatorial_election,_2026",
      },
    ],
  },
  {
    slug: "texas-attorney-general-2026",
    title: "Texas Attorney General Race 2026",
    shortTitle: "Attorney General",
    office: "Attorney General of Texas",
    lane: "big-race",
    region: "Texas",
    electionDate: "November 3, 2026",
    stage: "General election watch",
    priority: 94,
    summary:
      "A legal-power race for state litigation, consumer protection, public corruption authority, election litigation, and enforcement priorities.",
    whyItMatters:
      "The attorney general can shape public-record fights, criminal appeals, federal-state litigation, consumer enforcement, and how Texas uses legal power.",
    geography: "Statewide Texas",
    officialIds: ["ken-paxton"],
    recordFocus: ["Litigation record", "ethics history", "consumer protection", "election lawsuits", "public corruption authority"],
    watchActions: ["Separate allegations from findings", "Attach court records", "Track campaign money", "Create source-backed timeline pages"],
    sourceLinks: [
      texasSosDates,
      texasSosOffices,
      texasTribuneBallot,
      {
        title: "Ballotpedia: Texas Attorney General election, 2026",
        url: "https://ballotpedia.org/Texas_Attorney_General_election,_2026",
      },
    ],
  },
  {
    slug: "texas-lieutenant-governor-2026",
    title: "Texas Lieutenant Governor Race 2026",
    shortTitle: "Lieutenant Governor",
    office: "Lieutenant Governor of Texas",
    lane: "big-race",
    region: "Texas",
    electionDate: "November 3, 2026",
    stage: "General election watch",
    priority: 92,
    summary:
      "The race for the office that drives the Texas Senate agenda, budget leverage, committee power, and what bills move or die.",
    whyItMatters:
      "The lieutenant governor can determine which Senate bills get traction. Voters need a clear record on priorities, donors, votes, and pressure points.",
    geography: "Statewide Texas",
    officialIds: ["dan-patrick"],
    recordFocus: ["Senate agenda", "committee power", "budget priorities", "education policy", "property tax policy"],
    watchActions: ["Track bills blocked or advanced", "Link claims to Senate records", "Compare donor interests to agenda items", "Build debate-response snippets"],
    sourceLinks: [
      texasSosDates,
      texasSosOffices,
      texasTribuneBallot,
      {
        title: "Ballotpedia: Texas lieutenant gubernatorial election, 2026",
        url: "https://ballotpedia.org/Texas_lieutenant_gubernatorial_election,_2026",
      },
    ],
  },
  {
    slug: "texas-1st-congressional-district-2026",
    title: "Texas 1st Congressional District Race 2026",
    shortTitle: "TX-1",
    office: "U.S. House Texas District 1",
    lane: "east-texas",
    region: "East Texas",
    electionDate: "November 3, 2026",
    stage: "General election watch",
    priority: 98,
    summary:
      "RepWatchr's core East Texas congressional race: Tyler, Longview, Nacogdoches, Texarkana, and the federal record voters should open first.",
    whyItMatters:
      "TX-1 is the clearest East Texas federal accountability page. It should anchor votes, donor records, district issues, town halls, and source submissions.",
    geography: "Tyler, Longview, Nacogdoches, Texarkana, and surrounding East Texas communities",
    officialIds: ["nathaniel-moran"],
    recordFocus: ["Federal votes", "district services", "appropriations", "border policy", "East Texas infrastructure"],
    watchActions: ["Keep the incumbent profile complete", "Add debate and town-hall clips", "Track FEC reports", "Collect county-level voter questions"],
    sourceLinks: [
      texasSosDates,
      texasSosOffices,
      {
        title: "Ballotpedia: Texas' 1st Congressional District election, 2026",
        url: "https://ballotpedia.org/Texas%27_1st_Congressional_District_election,_2026",
      },
    ],
  },
  {
    slug: "texas-4th-congressional-district-2026",
    title: "Texas 4th Congressional District Race 2026",
    shortTitle: "TX-4",
    office: "U.S. House Texas District 4",
    lane: "east-texas",
    region: "Northeast Texas",
    electionDate: "November 3, 2026",
    stage: "General election watch",
    priority: 86,
    summary:
      "A Northeast Texas federal race touching communities that overlap RepWatchr's state and local accountability map.",
    whyItMatters:
      "TX-4 gives RepWatchr another federal record lane for Northeast Texas voters comparing votes, spending, and district service claims.",
    geography: "Northeast Texas and North Texas district communities",
    officialIds: ["pat-fallon"],
    recordFocus: ["Federal votes", "district claims", "veterans issues", "defense spending", "rural infrastructure"],
    watchActions: ["Track official votes", "Attach FEC filings", "Connect local issues to federal records", "Collect source submissions from district residents"],
    sourceLinks: [
      texasSosDates,
      texasSosOffices,
      {
        title: "Ballotpedia: Texas' 4th Congressional District election, 2026",
        url: "https://ballotpedia.org/Texas%27_4th_Congressional_District_election,_2026",
      },
    ],
  },
  {
    slug: "texas-5th-congressional-district-2026",
    title: "Texas 5th Congressional District Race 2026",
    shortTitle: "TX-5",
    office: "U.S. House Texas District 5",
    lane: "east-texas",
    region: "East Texas and Dallas-area communities",
    electionDate: "November 3, 2026",
    stage: "General election watch",
    priority: 88,
    summary:
      "A federal race that bridges East Texas and the Dallas-area media market, with strong share potential around votes, money, and local promises.",
    whyItMatters:
      "TX-5 can bring outside attention into East Texas issues because it sits between local rural concerns and a larger media environment.",
    geography: "East Texas and Dallas-area district communities",
    officialIds: ["lance-gooden"],
    recordFocus: ["Federal votes", "campaign finance", "rural priorities", "law enforcement funding", "school and border issues"],
    watchActions: ["Track high-attention votes", "Attach campaign-money summaries", "Watch local media stories", "Build share cards for district issues"],
    sourceLinks: [
      texasSosDates,
      texasSosOffices,
      {
        title: "Ballotpedia: Texas' 5th Congressional District election, 2026",
        url: "https://ballotpedia.org/Texas%27_5th_Congressional_District_election,_2026",
      },
    ],
  },
  {
    slug: "texas-6th-congressional-district-2026",
    title: "Texas 6th Congressional District Race 2026",
    shortTitle: "TX-6",
    office: "U.S. House Texas District 6",
    lane: "east-texas",
    region: "East Texas-adjacent watch",
    electionDate: "November 3, 2026",
    stage: "General election watch",
    priority: 82,
    summary:
      "A North and East Texas-adjacent federal record lane for voters watching suburban growth, water, property, defense, and transportation issues.",
    whyItMatters:
      "TX-6 is useful for RepWatchr because it connects fast-growth communities, federal votes, and infrastructure pressure that also affects East Texas.",
    geography: "North Texas and East Texas-adjacent communities",
    officialIds: ["jake-ellzey"],
    recordFocus: ["Federal votes", "growth pressure", "property rights", "transportation", "water infrastructure"],
    watchActions: ["Track growth and property votes", "Attach FEC filings", "Watch local issue coverage", "Build comparison snippets"],
    sourceLinks: [
      texasSosDates,
      texasSosOffices,
      {
        title: "Ballotpedia: Texas' 6th Congressional District election, 2026",
        url: "https://ballotpedia.org/Texas%27_6th_Congressional_District_election,_2026",
      },
    ],
  },
  {
    slug: "texas-senate-district-1-2026",
    title: "Texas Senate District 1 Race 2026",
    shortTitle: "SD-1",
    office: "Texas Senate District 1",
    lane: "east-texas",
    region: "East Texas",
    electionDate: "November 3, 2026",
    stage: "General election watch",
    priority: 90,
    summary:
      "A major East Texas state-Senate race tied to schools, courts, property, water, rural counties, and the statewide Senate agenda.",
    whyItMatters:
      "SD-1 carries heavy regional influence. This page should connect state Senate power to local schools, budgets, rural infrastructure, and voter questions.",
    geography: "East Texas Senate District 1",
    officialIds: ["bryan-hughes"],
    recordFocus: ["State Senate votes", "school policy", "property taxes", "court policy", "rural county issues"],
    watchActions: ["Attach Senate votes", "Connect bills to district impact", "Track campaign money", "Collect school-board and county records"],
    sourceLinks: [
      texasSosDates,
      texasSosOffices,
      {
        title: "Texas Senate: Senator Bryan Hughes, District 1",
        url: "https://senate.texas.gov/member.php?d=1",
      },
    ],
  },
  {
    slug: "texas-senate-district-3-2026",
    title: "Texas Senate District 3 Race 2026",
    shortTitle: "SD-3",
    office: "Texas Senate District 3",
    lane: "east-texas",
    region: "East Texas",
    electionDate: "November 3, 2026",
    stage: "General election watch",
    priority: 88,
    summary:
      "An East Texas state-Senate race for transportation, water, property, local government, rural schools, and state budget power.",
    whyItMatters:
      "SD-3 affects a broad East Texas footprint. The public record should be easy to inspect before people vote, share, or show up at meetings.",
    geography: "East Texas Senate District 3",
    officialIds: ["robert-nichols"],
    recordFocus: ["State Senate votes", "transportation", "water infrastructure", "property rights", "rural schools"],
    watchActions: ["Track Senate votes", "Attach transportation and water records", "Watch donor patterns", "Collect county-level questions"],
    sourceLinks: [texasSosDates, texasSosOffices],
  },
  {
    slug: "texas-house-district-1-2026",
    title: "Texas House District 1 Race 2026",
    shortTitle: "HD-1",
    office: "Texas House District 1",
    lane: "east-texas",
    region: "Northeast Texas",
    electionDate: "November 3, 2026",
    stage: "General election watch",
    priority: 84,
    summary: "A Northeast Texas House race tied to schools, rural budgets, property, local control, and public-record accountability.",
    whyItMatters: "House races decide the votes people feel locally. HD-1 needs a simple record page for bills, money, meetings, and district issues.",
    geography: "Northeast Texas House District 1",
    officialIds: ["gary-vandeaver"],
    recordFocus: ["House votes", "school funding", "property taxes", "rural budgets", "local control"],
    watchActions: ["Track House votes", "Attach local source links", "Watch school-board overlap", "Collect voter questions"],
    sourceLinks: [texasSosDates, texasSosOffices],
  },
  {
    slug: "texas-house-district-5-2026",
    title: "Texas House District 5 Race 2026",
    shortTitle: "HD-5",
    office: "Texas House District 5",
    lane: "east-texas",
    region: "East Texas",
    electionDate: "November 3, 2026",
    stage: "General election watch",
    priority: 84,
    summary: "An East Texas House race connected to education, local government, property, rural infrastructure, and county-level attention.",
    whyItMatters: "HD-5 is a practical RepWatchr page for turning state votes into local, shareable records that voters can inspect.",
    geography: "East Texas House District 5",
    officialIds: ["cole-hefner"],
    recordFocus: ["House votes", "education policy", "property taxes", "county issues", "rural services"],
    watchActions: ["Track House votes", "Add campaign-money summaries", "Attach district issue sources", "Build short share snippets"],
    sourceLinks: [texasSosDates, texasSosOffices],
  },
  {
    slug: "texas-house-district-7-2026",
    title: "Texas House District 7 Race 2026",
    shortTitle: "HD-7",
    office: "Texas House District 7",
    lane: "east-texas",
    region: "Longview and East Texas",
    electionDate: "November 3, 2026",
    stage: "General election watch",
    priority: 90,
    summary: "A core Longview/East Texas House race for property, schools, local government, criminal justice, and public-record issues.",
    whyItMatters: "HD-7 is central to RepWatchr's East Texas home base. This page should become a simple election-season record hub.",
    geography: "Longview and surrounding East Texas communities",
    officialIds: ["jay-dean"],
    recordFocus: ["House votes", "Longview-area issues", "property taxes", "school policy", "public safety"],
    watchActions: ["Track House votes", "Collect Longview-area records", "Build source-backed share posts", "Invite voters to submit missing receipts"],
    sourceLinks: [texasSosDates, texasSosOffices],
  },
  {
    slug: "texas-house-district-9-2026",
    title: "Texas House District 9 Race 2026",
    shortTitle: "HD-9",
    office: "Texas House District 9",
    lane: "east-texas",
    region: "Deep East Texas",
    electionDate: "November 3, 2026",
    stage: "General election watch",
    priority: 82,
    summary: "A Deep East Texas House race tied to rural infrastructure, water, schools, timber, property, and budget choices.",
    whyItMatters: "HD-9 needs clean record tracking because rural issues often get buried under statewide political noise.",
    geography: "Deep East Texas House District 9",
    officialIds: ["trent-ashby"],
    recordFocus: ["House votes", "rural infrastructure", "water", "schools", "budget decisions"],
    watchActions: ["Track House votes", "Attach district-impact sources", "Watch budget claims", "Collect local records"],
    sourceLinks: [texasSosDates, texasSosOffices],
  },
  {
    slug: "texas-house-district-11-2026",
    title: "Texas House District 11 Race 2026",
    shortTitle: "HD-11",
    office: "Texas House District 11",
    lane: "east-texas",
    region: "East Texas",
    electionDate: "November 3, 2026",
    stage: "General election watch",
    priority: 82,
    summary: "An East Texas House race for voters watching schools, local control, state spending, property taxes, and rural services.",
    whyItMatters: "HD-11 belongs in the East Texas watchboard because local voters need a direct line from campaign claims to state votes.",
    geography: "East Texas House District 11",
    officialIds: ["joanne-shofner"],
    recordFocus: ["House votes", "school policy", "state spending", "property taxes", "rural services"],
    watchActions: ["Track House votes", "Attach local source links", "Build side-by-side issue cards", "Collect missing records"],
    sourceLinks: [texasSosDates, texasSosOffices],
  },
  {
    slug: "east-texas-school-board-watch-2026",
    title: "East Texas School Board Watch 2026",
    shortTitle: "School Boards",
    office: "East Texas school board and local education races",
    lane: "local-watch",
    region: "East Texas",
    electionDate: "May 2, 2026 and November 3, 2026",
    stage: "Local race watch",
    priority: 86,
    summary:
      "The local-election lane for trustees, bonds, curriculum fights, transparency records, safety votes, meeting clips, and parent-facing source submissions.",
    whyItMatters:
      "School-board races can move fast and quietly. RepWatchr should make agendas, bonds, votes, candidates, and public comments easy to inspect and share.",
    geography: "East Texas school districts and local political subdivisions",
    officialIds: [],
    recordFocus: ["Trustee races", "bond measures", "meeting agendas", "curriculum votes", "school safety"],
    watchActions: ["Add district agendas", "Attach bond language", "Track candidate pages", "Invite parents to submit source packets"],
    sourceLinks: [
      texasSosDates,
      {
        title: "RepWatchr: School Board Watch",
        url: "https://www.repwatchr.com/school-boards",
      },
    ],
  },
];

export function getTexasElectionRaces() {
  return TEXAS_ELECTION_RACES.slice().sort((a, b) => b.priority - a.priority);
}

export function getTexasElectionRace(slug: string) {
  return TEXAS_ELECTION_RACES.find((race) => race.slug === slug);
}

export function getTexasElectionRacesByLane(lane: TexasElectionRaceLane) {
  return getTexasElectionRaces().filter((race) => race.lane === lane);
}
