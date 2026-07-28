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
  portrait: {
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

export const ELECTION_CANDIDATES: ElectionCandidateProfile[] = [dinaCarroll];

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
