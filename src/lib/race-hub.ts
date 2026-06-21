import {
  TEXAS_ELECTION_RACES,
  getTexasElectionRace,
  getTexasElectionRaces,
  type TexasElectionRace,
} from "@/data/texas-election-races";
import { TEXAS_SCHOOL_BOARD_ELECTION_WATCH } from "@/data/texas-school-board-elections";
import {
  getAllNews,
  getFundingSummary,
  getOfficialById,
  getRedFlags,
  getScoreCard,
} from "@/lib/data";
import type { NewsArticle, Official } from "@/types";

export type RaceHubRouteKind = "race" | "county" | "district";
export type RaceHubSourceKind =
  | "official_election"
  | "filing"
  | "campaign"
  | "finance"
  | "school_board_bond"
  | "story"
  | "profile"
  | "general_reference";
export type RaceHubMissingPriority = "high" | "medium" | "low";
export type RaceHubCandidateStatus =
  | "incumbent_record_loaded"
  | "candidate_record_loaded"
  | "candidate_roster_needed"
  | "source_review_needed";

export type RaceHubSourceLink = {
  title: string;
  url: string;
  kind: RaceHubSourceKind;
  official: boolean;
  note: string;
};

export type RaceHubSourceGroup = {
  kind: RaceHubSourceKind;
  label: string;
  description: string;
  links: RaceHubSourceLink[];
};

export type RaceHubCandidate = {
  id: string;
  name: string;
  party: string;
  status: RaceHubCandidateStatus;
  incumbent: boolean;
  profileHref?: string;
  campaignHref?: string;
  filingHref?: string;
  financeHref?: string;
  scoreLabel: string;
  sourceCount: number;
  redFlagCount: number;
  fundingLoaded: boolean;
  notes: string[];
};

export type RaceHubMissingRecord = {
  label: string;
  priority: RaceHubMissingPriority;
  why: string;
  actionHref: string;
};

export type RaceHubShareSnippet = {
  label: string;
  text: string;
};

export type RaceHubVoterQuestion = {
  label: string;
  question: string;
};

export type RaceHubRace = TexasElectionRace & {
  href: string;
  routeSlugs: string[];
  canonicalSlug: string;
  jurisdiction: string;
  countySlugs: string[];
  districtSlugs: string[];
  candidates: RaceHubCandidate[];
  incumbent?: RaceHubCandidate;
  sourceGroups: RaceHubSourceGroup[];
  sourceCount: number;
  officialSourceCount: number;
  missingRecords: RaceHubMissingRecord[];
  voterQuestions: RaceHubVoterQuestion[];
  shareSnippets: RaceHubShareSnippet[];
  relatedStories: NewsArticle[];
  schoolBoardLinks: RaceHubSourceLink[];
  candidateComparisonRows: Array<{
    label: string;
    candidates: Array<{ candidateId: string; value: string }>;
  }>;
};

export type TexasCountyHub = {
  kind: "county";
  slug: string;
  name: string;
  county: string;
  region: string;
  cities: string[];
  summary: string;
  href: string;
  races: RaceHubRace[];
  schoolBoards: Array<{
    districtSlug: string;
    district: string;
    county: string;
    status: string;
    sourceCount: number;
    href: string;
  }>;
  missingRecords: RaceHubMissingRecord[];
  voterQuestions: RaceHubVoterQuestion[];
};

export type TexasDistrictHub = {
  kind: "district";
  slug: string;
  name: string;
  districtType: "congressional" | "state_senate" | "state_house" | "education" | "local";
  region: string;
  summary: string;
  href: string;
  raceSlugs: string[];
  races: RaceHubRace[];
  missingRecords: RaceHubMissingRecord[];
  voterQuestions: RaceHubVoterQuestion[];
};

export type TexasElectionRouteResolution =
  | { kind: "race"; slug: string; race: RaceHubRace }
  | { kind: "county"; slug: string; county: TexasCountyHub }
  | { kind: "district"; slug: string; district: TexasDistrictHub };

type CountySeed = {
  slug: string;
  county: string;
  name: string;
  region: string;
  cities: string[];
  summary: string;
  priorityRaceSlugs: string[];
};

const sourceGroupOrder: RaceHubSourceKind[] = [
  "official_election",
  "filing",
  "campaign",
  "finance",
  "school_board_bond",
  "story",
  "profile",
  "general_reference",
];

const sourceGroupLabels: Record<RaceHubSourceKind, { label: string; description: string }> = {
  official_election: {
    label: "Official election sources",
    description: "Election office, district, or government sources voters can inspect first.",
  },
  filing: {
    label: "Filing and ballot sources",
    description: "Candidate filings, office calendars, ballot guides, and roster sources.",
  },
  campaign: {
    label: "Campaign website links",
    description: "Candidate-controlled campaign links. These are claims to compare against records.",
  },
  finance: {
    label: "Finance sources",
    description: "Campaign finance pages, internal funding summaries, and official report portals.",
  },
  school_board_bond: {
    label: "School board and bond links",
    description: "District elections, bond language, agendas, canvass records, and trustee sources.",
  },
  story: {
    label: "RepWatchr story links",
    description: "Published story packets connected to this race or its officials.",
  },
  profile: {
    label: "Official profile records",
    description: "RepWatchr official profiles tied to this race lane.",
  },
  general_reference: {
    label: "Reference sources",
    description: "Context sources that help locate the record but are not treated as final proof.",
  },
};

export const EAST_TEXAS_COUNTY_HUBS: CountySeed[] = [
  {
    slug: "gregg-county",
    county: "Gregg",
    name: "Gregg County Election Hub",
    region: "Longview / East Texas",
    cities: ["Longview", "Kilgore", "Gladewater", "White Oak"],
    summary:
      "A source-first county lane for Longview-area races, school boards, county records, voter questions, filings, and election-office links.",
    priorityRaceSlugs: [
      "texas-1st-congressional-district-2026",
      "texas-senate-district-1-2026",
      "texas-house-district-7-2026",
      "east-texas-school-board-watch-2026",
      "east-texas-county-election-watch-2026",
    ],
  },
  {
    slug: "harrison-county",
    county: "Harrison",
    name: "Harrison County Election Hub",
    region: "Marshall / East Texas",
    cities: ["Marshall", "Waskom", "Hallsville"],
    summary:
      "A county record lane for local offices, school board records, East Texas district races, and missing election-source packets.",
    priorityRaceSlugs: [
      "texas-1st-congressional-district-2026",
      "texas-senate-district-1-2026",
      "texas-house-district-7-2026",
      "east-texas-school-board-watch-2026",
      "east-texas-county-election-watch-2026",
    ],
  },
  {
    slug: "smith-county",
    county: "Smith",
    name: "Smith County Election Hub",
    region: "Tyler / East Texas",
    cities: ["Tyler", "Lindale", "Bullard"],
    summary:
      "A Tyler-area race hub for federal, state, school-board, local source links, finance records, and voter questions.",
    priorityRaceSlugs: [
      "texas-1st-congressional-district-2026",
      "texas-senate-district-1-2026",
      "texas-senate-district-3-2026",
      "texas-house-district-5-2026",
      "east-texas-school-board-watch-2026",
      "east-texas-county-election-watch-2026",
    ],
  },
  {
    slug: "upshur-county",
    county: "Upshur",
    name: "Upshur County Election Hub",
    region: "Gilmer / East Texas",
    cities: ["Gilmer", "Ore City", "Big Sandy"],
    summary:
      "A local accountability hub for Upshur County election links, school district records, state district races, and public-source gaps.",
    priorityRaceSlugs: [
      "texas-1st-congressional-district-2026",
      "texas-senate-district-1-2026",
      "texas-house-district-7-2026",
      "east-texas-school-board-watch-2026",
      "east-texas-county-election-watch-2026",
    ],
  },
  {
    slug: "rusk-county",
    county: "Rusk",
    name: "Rusk County Election Hub",
    region: "Henderson / East Texas",
    cities: ["Henderson", "Overton", "Tatum"],
    summary:
      "A Rusk County lane for state races, county records, school-board source gaps, and shareable voter questions.",
    priorityRaceSlugs: [
      "texas-senate-district-3-2026",
      "texas-house-district-11-2026",
      "east-texas-school-board-watch-2026",
      "east-texas-county-election-watch-2026",
    ],
  },
  {
    slug: "panola-county",
    county: "Panola",
    name: "Panola County Election Hub",
    region: "Carthage / East Texas",
    cities: ["Carthage", "Beckville"],
    summary:
      "A county record hub for Panola County voters tracking filings, local offices, state races, school boards, and missing sources.",
    priorityRaceSlugs: [
      "texas-senate-district-1-2026",
      "texas-house-district-9-2026",
      "east-texas-school-board-watch-2026",
      "east-texas-county-election-watch-2026",
    ],
  },
  {
    slug: "nacogdoches-county",
    county: "Nacogdoches",
    name: "Nacogdoches County Election Hub",
    region: "Deep East Texas",
    cities: ["Nacogdoches", "Garrison"],
    summary:
      "A Deep East Texas election hub for congressional, state, county, school-board, and public-record source trails.",
    priorityRaceSlugs: [
      "texas-1st-congressional-district-2026",
      "texas-senate-district-3-2026",
      "texas-house-district-9-2026",
      "east-texas-school-board-watch-2026",
      "east-texas-county-election-watch-2026",
    ],
  },
  {
    slug: "bowie-county",
    county: "Bowie",
    name: "Bowie County Election Hub",
    region: "Texarkana / Northeast Texas",
    cities: ["Texarkana", "New Boston"],
    summary:
      "A Northeast Texas race hub for federal, state, county, school-board, and local ballot source packets.",
    priorityRaceSlugs: [
      "texas-1st-congressional-district-2026",
      "texas-4th-congressional-district-2026",
      "texas-house-district-1-2026",
      "east-texas-county-election-watch-2026",
    ],
  },
];

const raceCountyMap: Record<string, string[]> = {
  "texas-1st-congressional-district-2026": [
    "gregg-county",
    "harrison-county",
    "smith-county",
    "upshur-county",
    "nacogdoches-county",
    "bowie-county",
  ],
  "texas-4th-congressional-district-2026": ["bowie-county", "harrison-county"],
  "texas-5th-congressional-district-2026": ["smith-county", "rusk-county"],
  "texas-6th-congressional-district-2026": ["smith-county"],
  "texas-senate-district-1-2026": [
    "gregg-county",
    "harrison-county",
    "smith-county",
    "upshur-county",
    "panola-county",
    "bowie-county",
  ],
  "texas-senate-district-3-2026": ["smith-county", "rusk-county", "nacogdoches-county"],
  "texas-house-district-1-2026": ["bowie-county"],
  "texas-house-district-5-2026": ["smith-county", "upshur-county"],
  "texas-house-district-7-2026": ["gregg-county", "harrison-county", "upshur-county"],
  "texas-house-district-9-2026": ["nacogdoches-county", "panola-county"],
  "texas-house-district-11-2026": ["rusk-county", "smith-county"],
  "east-texas-county-election-watch-2026": EAST_TEXAS_COUNTY_HUBS.map((county) => county.slug),
  "east-texas-school-board-watch-2026": EAST_TEXAS_COUNTY_HUBS.map((county) => county.slug),
};

const districtAliases: Record<string, { name: string; type: TexasDistrictHub["districtType"]; raceSlugs: string[] }> = {
  "tx-1": {
    name: "Texas Congressional District 1",
    type: "congressional",
    raceSlugs: ["texas-1st-congressional-district-2026"],
  },
  "tx-4": {
    name: "Texas Congressional District 4",
    type: "congressional",
    raceSlugs: ["texas-4th-congressional-district-2026"],
  },
  "tx-5": {
    name: "Texas Congressional District 5",
    type: "congressional",
    raceSlugs: ["texas-5th-congressional-district-2026"],
  },
  "tx-6": {
    name: "Texas Congressional District 6",
    type: "congressional",
    raceSlugs: ["texas-6th-congressional-district-2026"],
  },
  "sd-1": {
    name: "Texas Senate District 1",
    type: "state_senate",
    raceSlugs: ["texas-senate-district-1-2026"],
  },
  "sd-3": {
    name: "Texas Senate District 3",
    type: "state_senate",
    raceSlugs: ["texas-senate-district-3-2026"],
  },
  "hd-1": {
    name: "Texas House District 1",
    type: "state_house",
    raceSlugs: ["texas-house-district-1-2026"],
  },
  "hd-5": {
    name: "Texas House District 5",
    type: "state_house",
    raceSlugs: ["texas-house-district-5-2026"],
  },
  "hd-7": {
    name: "Texas House District 7",
    type: "state_house",
    raceSlugs: ["texas-house-district-7-2026"],
  },
  "hd-9": {
    name: "Texas House District 9",
    type: "state_house",
    raceSlugs: ["texas-house-district-9-2026"],
  },
  "hd-11": {
    name: "Texas House District 11",
    type: "state_house",
    raceSlugs: ["texas-house-district-11-2026"],
  },
  "school-board-races": {
    name: "East Texas School Board Races",
    type: "education",
    raceSlugs: ["east-texas-school-board-watch-2026", "texas-state-board-of-education-2026"],
  },
};

function isOfficialSource(title: string, url: string) {
  const haystack = `${title} ${url}`.toLowerCase();
  return (
    haystack.includes("secretary of state") ||
    haystack.includes("sos.state.tx.us") ||
    haystack.includes("sos.texas.gov") ||
    haystack.includes("senate.texas.gov") ||
    haystack.includes("texas.gov") ||
    haystack.includes(".gov") ||
    haystack.includes(".isd.org") ||
    haystack.includes("district elections")
  );
}

function sourceKindFor(title: string, url: string): RaceHubSourceKind {
  const haystack = `${title} ${url}`.toLowerCase();
  if (haystack.includes("fec") || haystack.includes("ethics") || haystack.includes("finance")) return "finance";
  if (haystack.includes("candidate") || haystack.includes("ballot") || haystack.includes("offices up")) return "filing";
  if (haystack.includes("school") || haystack.includes("isd") || haystack.includes("bond")) return "school_board_bond";
  if (isOfficialSource(title, url)) return "official_election";
  return "general_reference";
}

function normalizeSource(title: string, url: string, note = ""): RaceHubSourceLink {
  const kind = sourceKindFor(title, url);
  return {
    title,
    url,
    kind,
    official: isOfficialSource(title, url),
    note: note || (kind === "general_reference" ? "Use as a locator source, then confirm against official records." : "Public source link."),
  };
}

function uniqueSources(sources: RaceHubSourceLink[]) {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = `${source.kind}|${source.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function groupSources(sources: RaceHubSourceLink[]): RaceHubSourceGroup[] {
  const grouped = uniqueSources(sources).reduce<Record<RaceHubSourceKind, RaceHubSourceLink[]>>((acc, source) => {
    acc[source.kind] = [...(acc[source.kind] ?? []), source];
    return acc;
  }, {} as Record<RaceHubSourceKind, RaceHubSourceLink[]>);

  return sourceGroupOrder.map((kind) => ({
    kind,
    ...sourceGroupLabels[kind],
    links: grouped[kind] ?? [],
  }));
}

function federalFinanceSource(race: TexasElectionRace) {
  if (!race.office.toLowerCase().includes("u.s.")) return null;
  return normalizeSource(
    "Federal Election Commission: campaign finance data",
    "https://www.fec.gov/data/",
    "Official federal campaign finance portal. Search the race or candidate before treating totals as final.",
  );
}

function texasFinanceSource(race: TexasElectionRace) {
  const office = race.office.toLowerCase();
  if (!office.includes("texas") && !office.includes("governor") && !office.includes("comptroller")) return null;
  return normalizeSource(
    "Texas Ethics Commission: campaign finance reports",
    "https://www.ethics.state.tx.us/search/cf/",
    "Official Texas campaign finance search. Pull the candidate or committee report before publishing a money claim.",
  );
}

function officialSourceLink(official: Official): RaceHubSourceLink {
  const sourceUrl = official.contactInfo.website || official.sourceLinks?.[0]?.url || `/officials/${official.id}`;
  return {
    title: `${official.name} RepWatchr profile record`,
    url: sourceUrl.startsWith("/") ? `https://www.repwatchr.com${sourceUrl}` : sourceUrl,
    kind: "profile",
    official: Boolean(official.contactInfo.website || official.sourceLinks?.[0]?.url),
    note: "Profile record for votes, score status, funding summary, red flags, and public source links.",
  };
}

function candidateForOfficial(official: Official, index: number): RaceHubCandidate {
  const scoreCard = getScoreCard(official.id);
  const funding = getFundingSummary(official.id);
  const redFlags = getRedFlags(official.id);

  return {
    id: official.id,
    name: official.name,
    party: official.party,
    status: index === 0 ? "incumbent_record_loaded" : "candidate_record_loaded",
    incumbent: index === 0,
    profileHref: `/officials/${official.id}`,
    financeHref: funding ? `/funding/${official.id}` : undefined,
    scoreLabel: scoreCard ? `${scoreCard.overall} / ${scoreCard.letterGrade}` : "Score needs source review",
    sourceCount: official.sourceLinks?.length ?? 0,
    redFlagCount: redFlags.length,
    fundingLoaded: Boolean(funding),
    notes: [
      index === 0
        ? "Current public official record is loaded. Candidate filing status still needs an official filing source."
        : "Related public official/candidate record is loaded. Verify current ballot status before presenting as filed.",
      funding ? "RepWatchr funding summary exists." : "Campaign finance source still needs attachment.",
    ],
  };
}

function schoolBoardLinksForRace(race: TexasElectionRace): RaceHubSourceLink[] {
  if (!race.slug.includes("school-board") && !race.office.toLowerCase().includes("school")) return [];

  return TEXAS_SCHOOL_BOARD_ELECTION_WATCH.flatMap((district) =>
    district.sourceLinks.map((source) =>
      normalizeSource(
        `${district.district}: ${source.title}`,
        source.url,
        `${district.county} County school-board source. Review election, board roster, agenda, bond, canvass, and result records before publishing claims.`,
      ),
    ),
  );
}

function relatedStoriesForRace(race: TexasElectionRace, officials: Official[]) {
  const officialIds = new Set(officials.map((official) => official.id));
  const lowerText = `${race.title} ${race.shortTitle} ${race.office} ${race.region} ${race.geography}`.toLowerCase();

  return getAllNews()
    .filter((article) => {
      if (article.officialIds.some((id) => officialIds.has(id))) return true;
      const articleText = `${article.title} ${article.summary} ${article.locationLabel ?? ""} ${article.tags.join(" ")}`.toLowerCase();
      return (
        article.tags.includes("election") ||
        article.powerChannels?.includes("elections") ||
        lowerText.split(/\s+/).some((token) => token.length > 4 && articleText.includes(token))
      );
    })
    .slice(0, 4);
}

function missingRecordsForRace(race: TexasElectionRace, candidates: RaceHubCandidate[], sources: RaceHubSourceLink[]) {
  const missing: RaceHubMissingRecord[] = [];
  const hasOfficialElectionSource = sources.some((source) => source.kind === "official_election" && source.official);
  const hasFilingSource = sources.some((source) => source.kind === "filing");
  const hasCampaignLinks = candidates.some((candidate) => candidate.campaignHref);
  const hasFinanceSource = sources.some((source) => source.kind === "finance") || candidates.some((candidate) => candidate.financeHref);
  const hasSchoolLinks = sources.some((source) => source.kind === "school_board_bond");

  if (!hasOfficialElectionSource) {
    missing.push({
      label: "Official election office source",
      priority: "high",
      why: "Every race page needs an election-office or district source before ballot details are treated as settled.",
      actionHref: `/elections/texas/contribute?race=${encodeURIComponent(race.slug)}&type=official_election`,
    });
  }

  if (!hasFilingSource) {
    missing.push({
      label: "Candidate filing or ballot roster",
      priority: "high",
      why: "Candidate names should be tied to a filing, ballot, county, district, or official election source.",
      actionHref: `/elections/texas/contribute?race=${encodeURIComponent(race.slug)}&type=candidate_info`,
    });
  }

  if (candidates.length === 0) {
    missing.push({
      label: "Candidate roster",
      priority: "high",
      why: "This race lane is live, but candidate rows are not source-loaded yet.",
      actionHref: `/elections/texas/contribute?race=${encodeURIComponent(race.slug)}&type=candidate_info`,
    });
  }

  if (!hasCampaignLinks) {
    missing.push({
      label: "Campaign website links",
      priority: "medium",
      why: "Campaign pages are useful for comparing promises to votes, but they should not replace official records.",
      actionHref: `/elections/texas/contribute?race=${encodeURIComponent(race.slug)}&type=candidate_info`,
    });
  }

  if (!hasFinanceSource) {
    missing.push({
      label: "Finance report source",
      priority: "medium",
      why: "Money claims need an official finance portal, report, committee filing, or RepWatchr funding summary.",
      actionHref: `/elections/texas/contribute?race=${encodeURIComponent(race.slug)}&type=funding_record`,
    });
  }

  if ((race.slug.includes("school-board") || race.office.toLowerCase().includes("school")) && !hasSchoolLinks) {
    missing.push({
      label: "School-board agenda, bond, or canvass link",
      priority: "high",
      why: "School-board race pages need district or county records for candidate, bond, agenda, and result details.",
      actionHref: `/elections/texas/contribute?race=${encodeURIComponent(race.slug)}&type=local_issue`,
    });
  }

  return missing;
}

function voterQuestionsForRace(race: TexasElectionRace): RaceHubVoterQuestion[] {
  const focus = race.recordFocus[0] ?? "this race";
  return [
    {
      label: "Ballot source",
      question: `What official source shows who is filed or on the ballot for ${race.shortTitle}, and when was it last updated?`,
    },
    {
      label: "Record check",
      question: `What vote, filing, meeting record, finance report, or court/agency record best supports the campaign claim being made in ${race.shortTitle}?`,
    },
    {
      label: "Money trail",
      question: `Where can voters inspect the campaign finance report for ${race.shortTitle}, including donors, PACs, vendors, and cash on hand?`,
    },
    {
      label: "Local impact",
      question: `How does the public record on ${focus} affect voters in ${race.geography}?`,
    },
  ];
}

function shareSnippetsForRace(race: TexasElectionRace, missingRecords: RaceHubMissingRecord[]): RaceHubShareSnippet[] {
  const missingLine = missingRecords.length
    ? `Missing record to add: ${missingRecords[0].label}.`
    : "Core source trail is loaded, but voters should still verify updates before sharing.";

  return [
    {
      label: "Race source check",
      text: [
        `Before you vote in ${race.shortTitle}, open the source trail.`,
        "",
        race.title,
        race.summary,
        "",
        missingLine,
        `https://www.repwatchr.com/elections/texas/${race.slug}`,
      ].join("\n"),
    },
    {
      label: "Public question",
      text: `Public question for ${race.shortTitle}: what official filing, vote, finance report, agenda, or public record supports the campaign claim? ${`https://www.repwatchr.com/elections/texas/${race.slug}`}`,
    },
    {
      label: "Submit a better source",
      text: `Have a better public source for ${race.shortTitle}? Add the filing, finance report, campaign page, meeting clip, bond language, or correction here: https://www.repwatchr.com/elections/texas/contribute?race=${race.slug}`,
    },
  ];
}

function districtSlugsForRace(race: TexasElectionRace) {
  return Object.entries(districtAliases)
    .filter(([, config]) => config.raceSlugs.includes(race.slug))
    .map(([slug]) => slug);
}

function candidateComparison(candidates: RaceHubCandidate[]) {
  if (candidates.length === 0) return [];
  return [
    {
      label: "Record status",
      candidates: candidates.map((candidate) => ({
        candidateId: candidate.id,
        value: candidate.status.replaceAll("_", " "),
      })),
    },
    {
      label: "RepWatchr score",
      candidates: candidates.map((candidate) => ({ candidateId: candidate.id, value: candidate.scoreLabel })),
    },
    {
      label: "Funding",
      candidates: candidates.map((candidate) => ({
        candidateId: candidate.id,
        value: candidate.fundingLoaded ? "Funding summary loaded" : "Finance source needed",
      })),
    },
    {
      label: "Public source count",
      candidates: candidates.map((candidate) => ({
        candidateId: candidate.id,
        value: `${candidate.sourceCount} profile source${candidate.sourceCount === 1 ? "" : "s"}`,
      })),
    },
    {
      label: "Red-flag review",
      candidates: candidates.map((candidate) => ({
        candidateId: candidate.id,
        value: `${candidate.redFlagCount} item${candidate.redFlagCount === 1 ? "" : "s"} listed`,
      })),
    },
  ];
}

export function buildRaceHubRace(race: TexasElectionRace): RaceHubRace {
  const officials = race.officialIds.map((id) => getOfficialById(id)).filter((official): official is Official => Boolean(official));
  const candidates = officials.map(candidateForOfficial);
  const relatedStories = relatedStoriesForRace(race, officials);
  const schoolBoardLinks = schoolBoardLinksForRace(race);
  const financeSources = [federalFinanceSource(race), texasFinanceSource(race)].filter(
    (source): source is RaceHubSourceLink => Boolean(source),
  );
  const storySources = relatedStories.map((article) => ({
    title: article.title,
    url: `https://www.repwatchr.com/news/${article.id}`,
    kind: "story" as RaceHubSourceKind,
    official: false,
    note: article.sourceUrl || article.sourceLinks?.length ? "RepWatchr story with source trail." : "Story source review required before amplification.",
  }));
  const profileSources = officials.map(officialSourceLink);
  const sourceLinks = uniqueSources([
    ...race.sourceLinks.map((source) => normalizeSource(source.title, source.url)),
    ...financeSources,
    ...schoolBoardLinks,
    ...storySources,
    ...profileSources,
    ...candidates
      .filter((candidate) => candidate.financeHref)
      .map((candidate) => ({
        title: `${candidate.name} RepWatchr funding page`,
        url: `https://www.repwatchr.com${candidate.financeHref}`,
        kind: "finance" as RaceHubSourceKind,
        official: false,
        note: "Internal RepWatchr funding summary. Open source links before making a donor claim.",
      })),
  ]);
  const sourceGroups = groupSources(sourceLinks);
  const missingRecords = missingRecordsForRace(race, candidates, sourceLinks);
  const countySlugs = raceCountyMap[race.slug] ?? [];
  const districtSlugs = districtSlugsForRace(race);

  return {
    ...race,
    href: `/elections/texas/${race.slug}`,
    routeSlugs: [race.slug, ...districtSlugs],
    canonicalSlug: race.slug,
    jurisdiction: race.geography || race.region || "Texas",
    countySlugs,
    districtSlugs,
    candidates,
    incumbent: candidates.find((candidate) => candidate.incumbent),
    sourceGroups,
    sourceCount: sourceLinks.length,
    officialSourceCount: sourceLinks.filter((source) => source.official).length,
    missingRecords,
    voterQuestions: voterQuestionsForRace(race),
    shareSnippets: shareSnippetsForRace(race, missingRecords),
    relatedStories,
    schoolBoardLinks,
    candidateComparisonRows: candidateComparison(candidates),
  };
}

export function getTexasRaceHubRaces() {
  return getTexasElectionRaces().map(buildRaceHubRace);
}

export function getTexasRaceHubRace(slug: string) {
  const race = getTexasElectionRace(slug);
  if (race) return buildRaceHubRace(race);

  const districtConfig = districtAliases[slug];
  if (districtConfig?.raceSlugs.length === 1) {
    const districtRace = getTexasElectionRace(districtConfig.raceSlugs[0]);
    return districtRace ? buildRaceHubRace(districtRace) : undefined;
  }

  return undefined;
}

export function getTexasCountyHubs(): TexasCountyHub[] {
  const races = getTexasRaceHubRaces();
  return EAST_TEXAS_COUNTY_HUBS.map((county) => {
    const raceMap = new Map<string, RaceHubRace>();
    for (const slug of county.priorityRaceSlugs) {
      const race = races.find((item) => item.slug === slug);
      if (race) raceMap.set(race.slug, race);
    }
    for (const race of races) {
      if (race.countySlugs.includes(county.slug)) raceMap.set(race.slug, race);
    }
    const countySchoolBoards = TEXAS_SCHOOL_BOARD_ELECTION_WATCH.filter((district) =>
      district.county.toLowerCase().includes(county.county.toLowerCase()),
    );
    const missingRecords: RaceHubMissingRecord[] = [
      {
        label: `${county.county} County election office page`,
        priority: "high",
        why: "County hubs need direct election-office links for local filings, results, notices, and ballot records.",
        actionHref: `/elections/texas/contribute?county=${encodeURIComponent(county.county)}&type=source_link`,
      },
      {
        label: "Local candidate filings and campaign links",
        priority: "medium",
        why: "County and local races should not rely on word-of-mouth candidate lists.",
        actionHref: `/elections/texas/contribute?county=${encodeURIComponent(county.county)}&type=candidate_info`,
      },
    ];

    return {
      kind: "county",
      ...county,
      href: `/elections/texas/${county.slug}`,
      races: Array.from(raceMap.values()).sort((a, b) => b.priority - a.priority),
      schoolBoards: countySchoolBoards.map((district) => ({
        districtSlug: district.districtSlug,
        district: district.district,
        county: district.county,
        status: district.status,
        sourceCount: district.sourceLinks.length,
        href: `/school-boards/${district.districtSlug}`,
      })),
      missingRecords,
      voterQuestions: [
        {
          label: "County ballot source",
          question: `Where is the official ${county.county} County candidate, ballot, or election notice page for this race?`,
        },
        {
          label: "Local money trail",
          question: `Which local or state finance report shows donors, PACs, vendors, and cash on hand for the ${county.county} County race being discussed?`,
        },
        {
          label: "School-board source",
          question: `What district agenda, board packet, bond language, or canvass record supports the claim voters are sharing in ${county.county} County?`,
        },
      ],
    };
  });
}

export function getTexasCountyHub(slug: string) {
  return getTexasCountyHubs().find((county) => county.slug === slug);
}

export function getTexasDistrictHubs(): TexasDistrictHub[] {
  const races = getTexasRaceHubRaces();
  return Object.entries(districtAliases).map(([slug, config]) => {
    const districtRaces = config.raceSlugs
      .map((raceSlug) => races.find((race) => race.slug === raceSlug))
      .filter((race): race is RaceHubRace => Boolean(race));
    const summary =
      districtRaces[0]?.summary ||
      "A Texas district race hub for source links, candidate records, voter questions, and missing public records.";
    return {
      kind: "district",
      slug,
      name: config.name,
      districtType: config.type,
      region: districtRaces[0]?.region ?? "Texas",
      summary,
      href: `/elections/texas/${slug}`,
      raceSlugs: config.raceSlugs,
      races: districtRaces,
      missingRecords: [
        {
          label: `${config.name} district map/source`,
          priority: "medium",
          why: "District pages need official map or district-boundary links so voters know whether the race applies to them.",
          actionHref: `/elections/texas/contribute?district=${encodeURIComponent(slug)}&type=source_link`,
        },
        {
          label: `${config.name} candidate filing source`,
          priority: "high",
          why: "Candidate rosters must point to an official filing, ballot, or election office source.",
          actionHref: `/elections/texas/contribute?district=${encodeURIComponent(slug)}&type=candidate_info`,
        },
      ],
      voterQuestions: [
        {
          label: "District source",
          question: `What official district map or election source confirms which voters are in ${config.name}?`,
        },
        {
          label: "Candidate record",
          question: `Which filing, finance report, vote record, or public source should voters open first for ${config.name}?`,
        },
      ],
    };
  });
}

export function getTexasDistrictHub(slug: string) {
  return getTexasDistrictHubs().find((district) => district.slug === slug);
}

export function resolveTexasElectionSlug(slug: string): TexasElectionRouteResolution | null {
  const county = getTexasCountyHub(slug);
  if (county) return { kind: "county", slug, county };

  const district = getTexasDistrictHub(slug);
  if (district) return { kind: "district", slug, district };

  const race = getTexasRaceHubRace(slug);
  if (race) return { kind: "race", slug, race };

  return null;
}

export function getTexasElectionStaticSlugs() {
  const slugs = new Set<string>();
  TEXAS_ELECTION_RACES.forEach((race) => slugs.add(race.slug));
  EAST_TEXAS_COUNTY_HUBS.forEach((county) => slugs.add(county.slug));
  Object.keys(districtAliases).forEach((slug) => slugs.add(slug));
  return Array.from(slugs).sort();
}
