export interface StateCivicOutreachPriority {
  name: string;
  publicRoleLabel: string;
  state: string;
  lane: "family-court-reform" | "local-gop" | "candidate-network" | "local-civic";
  sourceLinks: Array<{ title: string; url: string }>;
  note: string;
}

export const stateCivicOutreachPriorities: StateCivicOutreachPriority[] = [
  {
    name: "Lisa Broomfield",
    publicRoleLabel: "Smith County Republican Club Secretary",
    state: "TX",
    lane: "local-gop",
    sourceLinks: [
      {
        title: "Smith County Republican Club leadership",
        url: "https://smithcountyrepublicans.org/leadership",
      },
    ],
    note: "Civic relationship/outreach lead. Do not classify as an elected official unless a public office source confirms current office.",
  },
  {
    name: "Rachel Hale",
    publicRoleLabel: "Former Texas House District 11 candidate",
    state: "TX",
    lane: "candidate-network",
    sourceLinks: [
      {
        title: "Grassroots America 2022 endorsement, Texas House District 11",
        url: "https://gawtp.com/2022-endorsements/",
      },
    ],
    note: "Candidate-network lead for state-rep research and outreach. Not a current elected-official profile without a current office source.",
  },
  {
    name: "Jim O'Bier",
    publicRoleLabel: "DeKalb Chamber leader and Red River County GOP chairman",
    state: "TX",
    lane: "local-civic",
    sourceLinks: [
      {
        title: "DeKalb Chamber business profile",
        url: "https://www.dekalbtxchamber.org/Business-of-the-Month-2024.html",
      },
      {
        title: "DeKalb Chamber board listing",
        url: "https://www.dekalbtxchamber.org/Board-of-Directors.html",
      },
    ],
    note: "Spelling verified as Jim O'Bier in public sources. Keep as civic/research outreach unless public office source confirms elected office.",
  },
  {
    name: "Brooks McKenzie",
    publicRoleLabel: "Texas parental-rights and family-court reform advocate",
    state: "TX",
    lane: "family-court-reform",
    sourceLinks: [
      {
        title: "LBH Research & Consulting profile",
        url: "https://lbhresearch.com/",
      },
      {
        title: "TexasPRA leadership profile",
        url: "https://texaspra.org/about.html",
      },
    ],
    note: "Public reform-network lead. Do not publish as a state representative; use for source routing, outreach, and public-power issue mapping.",
  },
];
