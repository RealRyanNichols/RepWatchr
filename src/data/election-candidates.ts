export type CandidateSourceKind = "official" | "campaign" | "reporting";

export type CandidateSource = {
  id: string;
  title: string;
  url: string;
  kind: CandidateSourceKind;
  note: string;
};

export type CandidateRecordItem = {
  title: string;
  detail: string;
  sourceIds: string[];
};

export type ElectionCandidateProfile = {
  slug: string;
  name: string;
  path: string;
  officeSought: string;
  jurisdiction: string;
  electionDate: string;
  racePath: string;
  ballotStatus: string;
  lastVerifiedAt: string;
  partyStatus: string;
  summary: string;
  recordLabel?: string;
  partyLabel?: string;
  electionLabel?: string;
  electionContext?: string;
  raceLinkLabel?: string;
  overviewTitle?: string;
  overviewParagraphs?: string[];
  officeDescription?: string;
  officeSourceIds?: string[];
  portrait?: {
    src: string;
    alt: string;
    credit: string;
    creditUrl: string;
    objectPosition: string;
  };
  campaignClaims: CandidateRecordItem[];
  independentRecord: CandidateRecordItem[];
  campaignPriorities: CandidateRecordItem[];
  evidenceGaps: string[];
  officeAuthority: string[];
  contact: {
    website: string;
    email: string;
    phone: string;
    mailingAddress: string;
    facebook: string;
    instagram: string;
  };
  sources: CandidateSource[];
};

const dinaCarroll: ElectionCandidateProfile = {
  slug: "dina-k-carroll",
  name: "Dina K. Carroll",
  path: "/candidates/dina-k-carroll",
  officeSought: "Marion County Judge",
  jurisdiction: "Marion County, Texas",
  electionDate: "November 3, 2026",
  racePath: "/elections/texas/marion-county-judge-2026",
  ballotStatus:
    "announced write-in candidate; ballot-counting eligibility pending official filing confirmation",
  lastVerifiedAt: "2026-07-27",
  partyStatus:
    "No party affiliation was located in the county-posted campaign-treasurer appointment or the reviewed campaign material.",
  summary:
    "Dina K. Carroll has publicly announced a write-in campaign for Marion County Judge. This profile separates her campaign account from independently supported community work and keeps her write-in qualification visibly unconfirmed until an official filing record is located.",
  portrait: {
    src: "/images/races/marion-county-judge-2026/dina-carroll-portrait.jpg",
    alt: "Dina K. Carroll holding a kitten",
    credit: "Candidate image published by the Marshall News Messenger",
    creditUrl:
      "https://marshallnewsmessenger.com/2026/07/09/jefferson-community-advocate-announces-write-in-candidacy-for-marion-county-judge/",
    objectPosition: "50% 38%",
  },
  campaignClaims: [
    {
      title: "Marion County roots",
      detail:
        "Carroll says she was born and raised in Marion County and presents herself as a lifelong member of the community.",
      sourceIds: ["campaign-background"],
    },
    {
      title: "Education and teaching credentials",
      detail:
        "Her campaign says she is a college graduate and certified teacher. RepWatchr has not independently reviewed the degree or certification records.",
      sourceIds: ["campaign-background"],
    },
    {
      title: "Political-outsider case",
      detail:
        "The campaign describes Carroll as an outsider running on faith, family, honesty, accountability and common sense.",
      sourceIds: ["campaign-background", "campaign-beliefs"],
    },
  ],
  independentRecord: [
    {
      title: "Campaign-treasurer appointment is posted",
      detail:
        "The Marion County elections site posts Carroll's campaign-treasurer appointment. That document is not, by itself, confirmation of an accepted write-in declaration.",
      sourceIds: ["county-treasurer-filing", "county-elections"],
    },
    {
      title: "Write-in campaign publicly announced",
      detail:
        "The Marshall News Messenger reported Carroll's July 2026 announcement for Marion County Judge.",
      sourceIds: ["write-in-announcement"],
    },
    {
      title: "Teaching and shelter volunteer work",
      detail:
        "KSLA identified Carroll as a high-school English teacher and documented her volunteer work helping shelter dogs in Jefferson.",
      sourceIds: ["ksla-shelter-work"],
    },
    {
      title: "Hands-on animal rescue",
      detail:
        "KLTV documented Carroll's role in organizing and entering a deep well during a Jefferson dog rescue.",
      sourceIds: ["kltv-dog-rescue"],
    },
    {
      title: "Regional community recognition",
      detail:
        "The East Texas Council of Governments named Carroll and Paula Jimenez 2024 Regional Citizens of the Year.",
      sourceIds: ["etcog-award"],
    },
  ],
  campaignPriorities: [
    {
      title: "Open government",
      detail:
        "Carroll's campaign calls for transparency, accountability and easier public visibility into county government.",
      sourceIds: ["campaign-beliefs"],
    },
    {
      title: "Taxpayer spending",
      detail:
        "Her published platform emphasizes scrutiny of contracts, grants and spending. A detailed county-budget proposal has not yet been located.",
      sourceIds: ["campaign-beliefs"],
    },
    {
      title: "Public treatment and community institutions",
      detail:
        "Her campaign says residents should be able to question government without retaliation and expresses support for families, teachers, law enforcement and animal welfare.",
      sourceIds: ["campaign-beliefs"],
    },
  ],
  evidenceGaps: [
    "An accepted write-in declaration and any required fee or petition acceptance.",
    "A county-published qualified-write-in roster naming Carroll.",
    "Degree and teacher-certification records referenced by the campaign.",
    "A detailed county-budget, audit and contract-oversight plan.",
    "An emergency-management plan for the county judge's statutory role.",
    "Specific proposals for constitutional county-court administration.",
    "A complete campaign-finance record as filings become due.",
  ],
  officeAuthority: [
    "Preside over Marion County Commissioners Court.",
    "Help shape county budgets, contracts and administrative priorities.",
    "Carry county emergency-management responsibilities.",
    "Preside over the constitutional county court's applicable criminal and probate matters.",
  ],
  contact: {
    website: "https://writeindina.com/",
    email: "electdina@writeindina.com",
    phone: "903-665-0053",
    mailingAddress: "PO Box 630, Jefferson, TX 75657",
    facebook: "https://www.facebook.com/writeindina/",
    instagram: "https://www.instagram.com/dcjcarroll2/",
  },
  sources: [
    {
      id: "county-elections",
      title: "Marion County elections and campaign filings",
      url: "https://marioncountytaxoffice.com/elections/",
      kind: "official",
      note: "County election notices and posted candidate documents.",
    },
    {
      id: "county-treasurer-filing",
      title: "Dina Carroll campaign-treasurer appointment",
      url: "https://marioncountytaxoffice.com/wp-content/uploads/2026/07/CTA-D-CARROLL.pdf",
      kind: "official",
      note: "County-posted campaign-treasurer appointment; not treated as a write-in declaration.",
    },
    {
      id: "texas-write-in-rules",
      title: "Texas Secretary of State: 2026 write-in procedures",
      url: "https://www.sos.state.tx.us/elections/candidates/guide/2026/writein2026.shtml",
      kind: "official",
      note: "State filing process and deadline for declared write-in candidates.",
    },
    {
      id: "county-judge-office",
      title: "Marion County Judge official office",
      url: "https://www.co.marion.tx.us/page/marion.County.Judge",
      kind: "official",
      note: "Official county office and public contact record.",
    },
    {
      id: "county-court-jurisdiction",
      title: "Texas OCA: constitutional county-court jurisdiction",
      url: "https://www.txcourts.gov/media/1460595/constitutional-county-courts.pdf",
      kind: "official",
      note: "State judicial reference for the court responsibilities attached to the office.",
    },
    {
      id: "etcog-award",
      title: "ETCOG: 2024 Regional Award Winners",
      url: "https://www.etcog.org/2024-regional-award-winners",
      kind: "official",
      note: "Regional organization record recognizing Carroll and Paula Jimenez.",
    },
    {
      id: "campaign-background",
      title: "Dina Carroll campaign background",
      url: "https://writeindina.com/background.html",
      kind: "campaign",
      note: "Candidate-published biography and experience claims.",
    },
    {
      id: "campaign-beliefs",
      title: "Dina Carroll published beliefs and priorities",
      url: "https://writeindina.com/beliefs.html",
      kind: "campaign",
      note: "Candidate-published values and policy positioning.",
    },
    {
      id: "campaign-home",
      title: "Write-In Dina campaign website",
      url: "https://writeindina.com/",
      kind: "campaign",
      note: "Campaign contact and public campaign material.",
    },
    {
      id: "write-in-announcement",
      title: "Marshall News Messenger: Carroll announcement",
      url: "https://marshallnewsmessenger.com/2026/07/09/jefferson-community-advocate-announces-write-in-candidacy-for-marion-county-judge/",
      kind: "reporting",
      note: "Local reporting on Carroll's publicly announced write-in campaign.",
    },
    {
      id: "ksla-shelter-work",
      title: "KSLA: teaching and animal-shelter volunteer work",
      url: "https://www.ksla.com/2018/12/12/homes-volunteers-desperately-needed-dogs-jefferson/",
      kind: "reporting",
      note: "Independent reporting on teaching and volunteer activity.",
    },
    {
      id: "kltv-dog-rescue",
      title: "KLTV: Carroll's role in a Jefferson dog rescue",
      url: "https://www.kltv.com/2025/03/16/webxtra-jefferson-residents-band-together-rescue-dog-well/",
      kind: "reporting",
      note: "Independent video reporting on a community animal rescue.",
    },
  ],
};

const melissaBeckett: ElectionCandidateProfile = {
  slug: "melissa-beckett",
  name: "Melissa Beckett",
  path: "/candidates/melissa-beckett",
  officeSought: "Texas House District 7",
  jurisdiction: "Texas House District 7",
  electionDate: "March 3, 2026",
  racePath: "/elections/texas/texas-house-district-7-2026",
  recordLabel: "Former primary candidate",
  partyLabel: "Republican",
  electionLabel: "March 3",
  electionContext: "2026 Republican primary",
  raceLinkLabel: "Open the HD 7 record",
  ballotStatus:
    "Former 2026 Republican primary candidate. MultiState reports a primary loss to Jay Dean; the district canvass has not yet been attached to this profile.",
  lastVerifiedAt: "2026-09-12",
  partyStatus:
    "Her campaign identified her as a Republican candidate for Texas House District 7. MultiState places her in the March 3, 2026 Republican primary.",
  summary:
    "Melissa Beckett ran in the 2026 Republican primary for Texas House District 7. This file separates her published platform, official witness-list entries and reported election result. It does not present her as the sitting representative.",
  overviewTitle: "A primary campaign, a public platform and a witness record.",
  overviewParagraphs: [
    "MultiState reports that Beckett lost the March 3, 2026 Republican primary to Jay Dean. RepWatchr has not attached the district canvass and does not label the reported result as a certified count.",
    "The official Senate witness list establishes appearances on specific bills. Campaign proposals establish what Beckett advocated. Neither is a legislative vote cast by an officeholder.",
  ],
  officeDescription:
    "The Texas House considers laws and constitutional amendments with the Senate and participates in state appropriations. Revenue bills originate in the House. These are institutional powers, not actions one candidate can carry out alone.",
  officeSourceIds: ["texas-house-duties"],
  independentRecord: [
    {
      title: "Reported 2026 primary result",
      detail:
        "MultiState's election history identifies Beckett as losing the March 3, 2026 Republican HD 7 primary to Jay Dean. This is a secondary election reference, not a certified canvass displayed by RepWatchr.",
      sourceIds: ["multistate-beckett"],
    },
    {
      title: "Listed FOR SB 133 on March 8, 2023",
      detail:
        "The Senate Education Committee witness list names Melissa Beckett of Longview, representing herself and Texas Education 911, under FOR SB 133. This is a witness position, not a legislator's roll-call vote.",
      sourceIds: ["senate-education-2023-03-08"],
    },
    {
      title: "Listed ON four other education bills",
      detail:
        "The same list records Beckett ON SB 294, SB 357, SB 629 and SB 798. RepWatchr preserves that category without converting it into support or opposition.",
      sourceIds: ["senate-education-2023-03-08"],
    },
  ],
  campaignClaims: [
    {
      title: "Business and finance background",
      detail:
        "Her campaign biography describes experience in business, finance, commodity trading and data analysis. Employment and credential documentation is not attached here.",
      sourceIds: ["beckett-biography"],
    },
    {
      title: "Texas Education 911 leadership",
      detail:
        "Beckett's biography describes her as the founder and leader of Texas Education 911. The Senate witness list separately records that affiliation at the March 8, 2023 hearing; it does not establish every biographical claim.",
      sourceIds: ["beckett-biography", "senate-education-2023-03-08"],
    },
  ],
  campaignPriorities: [
    {
      title: "Property taxes and state spending",
      detail:
        "Beckett's issues page advocates eliminating property taxes and reducing state government and spending. A replacement-revenue model and program-by-program costings are not attached to this file.",
      sourceIds: ["beckett-issues"],
    },
    {
      title: "Education decisions",
      detail:
        "Her platform calls for greater decision-making by parents and teachers and criticizes centralized TEA control. These are campaign positions, not independently measured education outcomes.",
      sourceIds: ["beckett-issues"],
    },
    {
      title: "Water, land and corporate incentives",
      detail:
        "Her issues page opposes East Texas reservoir and water-export plans that displace landowners, corporate subsidies and taxpayer-funded lobbying. Specific bill language and implementation costs remain open records questions.",
      sourceIds: ["beckett-issues"],
    },
  ],
  evidenceGaps: [
    "The official district canvass for the March 3, 2026 Republican HD 7 primary.",
    "Texas Ethics Commission filer identifiers and the corresponding campaign-finance reports, amendments and reporting periods.",
    "A costed proposal for property-tax elimination, replacement revenue and effects on local services.",
    "Specific legislative text and fiscal analysis supporting the campaign's education, water and spending proposals.",
    "A source-confirmed portrait suitable for publication at full display resolution.",
  ],
  officeAuthority: [
    "Consider proposed state laws and resolutions alongside the Texas Senate.",
    "Consider constitutional amendments for submission to Texas voters.",
    "Vote on appropriations for state government; revenue bills originate in the House.",
    "Elect the House speaker and adopt the chamber's rules.",
  ],
  contact: {
    website: "https://www.melissafortexas.com/",
    email: "",
    phone: "",
    mailingAddress: "",
    facebook: "",
    instagram: "",
  },
  sources: [
    {
      id: "beckett-campaign",
      title: "Melissa Beckett campaign website",
      url: "https://www.melissafortexas.com/",
      kind: "campaign",
      note: "Campaign-published identification as a Republican HD 7 candidate; retained campaign material is not current ballot certification.",
    },
    {
      id: "beckett-biography",
      title: "Beckett campaign biography",
      url: "https://www.melissafortexas.com/meet-melissa",
      kind: "campaign",
      note: "Self-published background and organizational claims, labeled as campaign material.",
    },
    {
      id: "beckett-issues",
      title: "Beckett's published issue positions",
      url: "https://www.melissafortexas.com/issues",
      kind: "campaign",
      note: "Primary source for what the campaign advocates; does not prove policy effects or fiscal feasibility.",
    },
    {
      id: "senate-education-2023-03-08",
      title: "Texas Senate Education witness list, March 8, 2023",
      url: "https://capitol.texas.gov/tlodocs/88R/witlistmtg/html/C5302023030809001.HTM",
      kind: "official",
      note: "Lists Beckett FOR SB 133 and ON SB 294, SB 357, SB 629 and SB 798. Witness categories are preserved as printed.",
    },
    {
      id: "multistate-beckett",
      title: "MultiState: Texas HD 7 election history",
      url: "https://www.multistate.us/elections/district?chamber=House&d=7&st=TX",
      kind: "reporting",
      note: "Secondary election compilation reports a March 3, 2026 Republican primary loss. RepWatchr has not attached the official district canvass.",
    },
    {
      id: "texas-house-duties",
      title: "Texas House: legislative duties and process",
      url: "https://www.house.texas.gov/index.php/help",
      kind: "official",
      note: "Official explanation of the House's powers, legislative process and member responsibilities.",
    },
  ],
};

export const ELECTION_CANDIDATES: ElectionCandidateProfile[] = [dinaCarroll, melissaBeckett];

export function getElectionCandidates() {
  return ELECTION_CANDIDATES;
}

export function getElectionCandidate(slug: string) {
  return ELECTION_CANDIDATES.find((candidate) => candidate.slug === slug);
}

export function getCandidateSources(
  candidate: ElectionCandidateProfile,
  sourceIds: string[],
) {
  const sourceSet = new Set(sourceIds);
  return candidate.sources.filter((source) => sourceSet.has(source.id));
}
