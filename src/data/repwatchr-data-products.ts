export type RepWatchrDataProduct = {
  slug: string;
  name: string;
  eyebrow: string;
  summary: string;
  buyer: string;
  deliverables: string[];
  guardrail: string;
  ctaLabel: string;
};

export type RepWatchrFeedbackMechanism = {
  name: string;
  question: string;
  signal: string;
  guardrail: string;
};

export const REPWATCHR_DATA_PRODUCTS: RepWatchrDataProduct[] = [
  {
    slug: "civic-pulse-dataset",
    name: "Civic Pulse Dataset",
    eyebrow: "Data license",
    summary:
      "Aggregated issue sentiment, approval, left-right leaning, vote-again intent, trust, source confidence, and district-level civic signals.",
    buyer:
      "Campaigns, PACs, civic groups, journalists, advocacy orgs, researchers, and political data buyers.",
    deliverables: [
      "Aggregate CSV/API export",
      "District and state cuts",
      "Constituent vs outsider signal split",
      "Sample size and confidence notes",
    ],
    guardrail:
      "Sell aggregate intelligence and methodology, not private identity documents or raw personal voter dossiers.",
    ctaLabel: "Ask about data licensing",
  },
  {
    slug: "campaign-research-desk",
    name: "Campaign Research Desk",
    eyebrow: "Custom report",
    summary:
      "Paid political intelligence packets for a race, official, district, issue, funder, school board, or source-backed controversy.",
    buyer:
      "Campaign teams, consultants, researchers, donors, local watchdogs, media desks, and issue coalitions.",
    deliverables: [
      "Race or official source map",
      "Vote and funding signal summary",
      "Public question bank",
      "Safe share snippets",
    ],
    guardrail:
      "Reports should cite public records and separate confirmed facts, public questions, opinion signals, and missing sources.",
    ctaLabel: "Request a custom report",
  },
  {
    slug: "verified-constituent-panel",
    name: "Verified Constituent Panel",
    eyebrow: "Feedback panel",
    summary:
      "Ongoing verified feedback from people tied to the office geography, separated from in-state, out-of-district, and national observers.",
    buyer:
      "Campaigns, incumbents, challengers, issue groups, school-board watchers, and journalists tracking public pressure.",
    deliverables: [
      "Vote-again intent",
      "Issue support and opposition",
      "Trust and approval pulse",
      "Constituent-only cuts",
    ],
    guardrail:
      "Require account verification and constituency labeling before a response can influence public-grade summaries.",
    ctaLabel: "Build a panel",
  },
  {
    slug: "claimed-profile-desk",
    name: "Claimed Profile Desk",
    eyebrow: "Profile revenue",
    summary:
      "Officials, campaigns, and authorized staff can claim profiles, submit approved media, answer public questions, and request paid briefs.",
    buyer:
      "Officials, campaigns, school-board candidates, spokespeople, consultants, and public offices.",
    deliverables: [
      "Claim verification queue",
      "Approved profile media",
      "Public answer workflow",
      "Paid brief upsell path",
    ],
    guardrail:
      "Claiming a profile never lets a buyer erase public records, source-backed red flags, score methodology, or correction history.",
    ctaLabel: "Claim or defend a profile",
  },
];

export const REPWATCHR_FEEDBACK_MECHANISMS: RepWatchrFeedbackMechanism[] = [
  {
    name: "Vote Again",
    question: "Would you vote for this official again today?",
    signal: "Support, opposition, persuadable, and regret buckets by verified constituency.",
    guardrail: "One active answer per verified user per official, updatable but not stackable.",
  },
  {
    name: "Past Vote Match",
    question: "Did you vote for this official, and do you like the job they are doing now?",
    signal: "Supporter satisfaction, supporter regret, opponent approval, and non-voter sentiment.",
    guardrail: "Self-reported only. Never publish as official ballot history.",
  },
  {
    name: "Issue Pulse",
    question: "Which votes or issues matter most to you right now?",
    signal: "Issue intensity by district, county, state, party interest, and watchlist segment.",
    guardrail: "Show sample size and source gaps before ranking an issue publicly.",
  },
  {
    name: "Vote Reaction",
    question: "Do you approve of this specific vote?",
    signal: "Bill-level public sentiment tied to roll-call records and scorecard impact.",
    guardrail: "The vote source link stays attached to every reaction summary.",
  },
  {
    name: "Action Intent",
    question: "Would you donate, volunteer, share, attend a meeting, or ask a public question?",
    signal: "Political action intent without forcing ads into the core product.",
    guardrail: "Commercial-use consent is tracked separately from ordinary site usage.",
  },
];

export const REPWATCHR_DATA_GUARDRAILS = [
  "Use verified account, device, email, and optional ID-provider signals to reduce duplicate accounts.",
  "Separate constituent, in-district, in-state, out-of-district, out-of-state, and unknown responses.",
  "Keep public records, source links, and methodology visible before monetizing the signal.",
  "Do not sell raw identity documents, private addresses, minor-child data, or doxxing material.",
  "Default commercial data services to aggregate, de-identified, consent-aware reporting.",
  "Mark opinion and sentiment as opinion and sentiment, not as proven public-record fact.",
];

export function getRepWatchrDataProducts() {
  return REPWATCHR_DATA_PRODUCTS;
}

export function getRepWatchrFeedbackMechanisms() {
  return REPWATCHR_FEEDBACK_MECHANISMS;
}
