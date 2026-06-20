export type SeoTopicCluster = {
  id: string;
  name: string;
  primaryKeyword: string;
  supportingKeywords: string[];
  searchIntent: string;
  audience: string;
  sourceTargets: string[];
  internalLinks: string[];
  nextArticleAngles: string[];
  cadence: string;
};

export type EditorialLoopStep = {
  step: string;
  title: string;
  detail: string;
};

export const REPWATCHR_SEO_TOPIC_CLUSTERS: SeoTopicCluster[] = [
  {
    id: "texas-election-records",
    name: "Texas Election Records",
    primaryKeyword: "Texas election records",
    supportingKeywords: [
      "Texas 2026 elections",
      "Texas congressional races",
      "Texas ballot candidates",
      "Texas election filings",
      "Texas Ethics Commission campaign finance",
    ],
    searchIntent:
      "Voters want one place to find the race, office, candidate, filing, money, source links, and election context.",
    audience: "Texas voters, local campaigns, county watchers, and political readers.",
    sourceTargets: [
      "Texas Secretary of State",
      "Texas Ethics Commission",
      "county election offices",
      "candidate campaign pages",
      "official meeting and filing pages",
    ],
    internalLinks: ["/elections/texas", "/elections/texas/contribute", "/services/local-race-source-pack"],
    nextArticleAngles: [
      "What records matter before voting in a Texas local race",
      "How to read a Texas campaign-finance report without getting lost",
      "The East Texas races that need source packets first",
    ],
    cadence: "Update weekly during active election season and after filing, finance, debate, and voting deadlines.",
  },
  {
    id: "east-texas-public-power",
    name: "East Texas Public Power",
    primaryKeyword: "East Texas public officials",
    supportingKeywords: [
      "Longview public officials",
      "Gregg County elected officials",
      "Harrison County public records",
      "Smith County school board",
      "East Texas sheriff election",
    ],
    searchIntent:
      "Local readers want names, districts, offices, public meetings, records, and the fastest next step.",
    audience: "East Texas voters, parents, taxpayers, and local watchdog readers.",
    sourceTargets: [
      "county election offices",
      "commissioners court agendas",
      "city council agendas",
      "school board agendas",
      "local public-record portals",
    ],
    internalLinks: ["/officials", "/school-boards", "/authority-watch", "/services/official-record-brief"],
    nextArticleAngles: [
      "What to check before an East Texas city council meeting",
      "The local records every voter should know before a county race",
      "How to turn one public meeting clip into a source packet",
    ],
    cadence: "Publish source-backed local guides every week, then update after meetings and filing events.",
  },
  {
    id: "school-board-accountability",
    name: "School Board Accountability",
    primaryKeyword: "school board accountability",
    supportingKeywords: [
      "Texas school board members",
      "ISD board records",
      "school board meeting agenda",
      "school board election Texas",
      "public school transparency",
    ],
    searchIntent:
      "Parents and voters need board names, agendas, votes, meeting video, policies, and safe public wording.",
    audience: "Parents, teachers, local taxpayers, and school-board voters.",
    sourceTargets: [
      "district board pages",
      "board agenda packets",
      "minutes and meeting video",
      "bond election pages",
      "candidate filings",
    ],
    internalLinks: ["/school-boards", "/elections/texas/contribute", "/services/free-source-packet"],
    nextArticleAngles: [
      "How to read a school-board agenda before the meeting starts",
      "What parents should source before posting about an ISD issue",
      "The difference between a claim, a public record, and a missing record",
    ],
    cadence: "Publish ahead of board meetings, bond elections, trustee races, and major policy votes.",
  },
  {
    id: "official-record-briefs",
    name: "Official Record Briefs",
    primaryKeyword: "public official record",
    supportingKeywords: [
      "elected official voting record",
      "public official campaign finance",
      "representative record",
      "public accountability profile",
      "official red flags",
    ],
    searchIntent:
      "Readers want a clear public profile with votes, sources, public claims, money, and unanswered questions.",
    audience: "Voters, journalists, campaigns, researchers, and local issue groups.",
    sourceTargets: [
      "official government bio pages",
      "vote records",
      "campaign finance filings",
      "public statements",
      "committee and meeting records",
    ],
    internalLinks: ["/officials", "/votes", "/funding", "/red-flags", "/services/official-record-brief"],
    nextArticleAngles: [
      "What belongs in a public official record brief",
      "How to separate a verified vote from a political claim",
      "Why every viral accusation needs a source line before it spreads",
    ],
    cadence: "Publish when a race heats up, a vote lands, a source packet comes in, or a profile needs a trust upgrade.",
  },
  {
    id: "texas-public-records",
    name: "Texas Public Records",
    primaryKeyword: "Texas public records request",
    supportingKeywords: [
      "Texas Public Information Act",
      "open records request Texas",
      "public meeting records",
      "government agenda packet",
      "records request template",
    ],
    searchIntent:
      "People need plain-English help turning a concern into a clean records request and source trail.",
    audience: "Citizens, parents, local watchdogs, pro se researchers, and public-records advocates.",
    sourceTargets: [
      "Texas Attorney General open government materials",
      "agency records portals",
      "county clerk pages",
      "agenda and minutes archives",
      "policy manuals",
    ],
    internalLinks: ["/methodology", "/submit-source", "/services/quick-record-check"],
    nextArticleAngles: [
      "The public records to ask for before accusing a public office",
      "How to keep a Texas open-records request narrow enough to work",
      "What to do when the public source is missing, broken, or buried",
    ],
    cadence: "Publish evergreen guides monthly and link them from every source-packet workflow.",
  },
  {
    id: "public-safety-authority",
    name: "Public Safety Authority",
    primaryKeyword: "public safety accountability",
    supportingKeywords: [
      "sheriff accountability",
      "law enforcement public records",
      "jail oversight",
      "public safety agency records",
      "county sheriff election",
    ],
    searchIntent:
      "Readers need public-source boundaries around officials with badges, custody power, budgets, and oversight authority.",
    audience: "Voters, families, advocates, local reporters, and public-safety watchdog readers.",
    sourceTargets: [
      "sheriff office pages",
      "county jail records pages",
      "commissioners court budget materials",
      "state oversight records",
      "public safety meeting minutes",
    ],
    internalLinks: ["/authority-watch", "/public-safety", "/services/official-record-brief"],
    nextArticleAngles: [
      "What public records matter in a sheriff race",
      "How to source a jail oversight concern safely",
      "The difference between a badge, an elected office, and an agency record",
    ],
    cadence: "Publish only when source support is strong enough to avoid rumor-driven public-safety claims.",
  },
];

export const REPWATCHR_EDITORIAL_LOOP: EditorialLoopStep[] = [
  {
    step: "Research",
    title: "Collect the public source first",
    detail:
      "Start with a public URL, filing, agenda, vote, meeting video, finance report, official page, or records-request target.",
  },
  {
    step: "Packet",
    title: "Turn the source into a reusable packet",
    detail:
      "Capture who, what, where, date, jurisdiction, source title, source URL, and what is still missing.",
  },
  {
    step: "Publish",
    title: "Write the story around the record",
    detail:
      "Use plain language, visible dates, source labels, linked profiles, article schema, and a share snippet.",
  },
  {
    step: "Distribute",
    title: "Send people back to RepWatchr",
    detail:
      "Share the hook on social, but make the full source trail live on the site where readers can act.",
  },
  {
    step: "Improve",
    title: "Refresh with better records",
    detail:
      "Update pages when new filings, minutes, votes, public statements, or corrections arrive.",
  },
];

export function getSeoTopicClusters() {
  return REPWATCHR_SEO_TOPIC_CLUSTERS;
}

export function getEditorialLoopSteps() {
  return REPWATCHR_EDITORIAL_LOOP;
}
