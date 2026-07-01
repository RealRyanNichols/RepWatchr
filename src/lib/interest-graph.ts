export type InterestSlug =
  | "texas"
  | "school-boards"
  | "property-taxes"
  | "water-rights"
  | "congress"
  | "sheriffs"
  | "judges"
  | "county-commissioners"
  | "campaign-finance"
  | "transparency"
  | "open-records"
  | "veterans"
  | "education"
  | "energy"
  | "immigration"
  | "infrastructure"
  | "election-integrity";

export interface InterestTopic {
  slug: InterestSlug;
  label: string;
  category: "place" | "office" | "issue" | "workflow";
  description: string;
  keywords: string[];
}

export interface InterestSignal {
  slug: InterestSlug;
  label: string;
  weight: number;
  reason: string;
}

export interface InterestInferenceInput {
  eventType: string;
  path?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  entityLabel?: string | null;
  topic?: string | null;
  issueId?: string | null;
  county?: string | null;
  searchTerm?: string | null;
  buttonLabel?: string | null;
  buttonHref?: string | null;
  shareChannel?: string | null;
  downloadName?: string | null;
  packetType?: string | null;
  timeSpentMs?: number | null;
  scrollPercent?: number | null;
  sessionDepth?: number | null;
  metadata?: Record<string, unknown>;
}

export const INTEREST_TOPICS: InterestTopic[] = [
  {
    slug: "texas",
    label: "Texas",
    category: "place",
    description: "Texas statewide, county, and district records.",
    keywords: ["texas", "tx", "east texas", "statewide texas", "sos", "texas ethics", "texas election"],
  },
  {
    slug: "school-boards",
    label: "School Boards",
    category: "office",
    description: "School-board trustees, districts, meetings, bonds, and education governance.",
    keywords: ["school board", "school-board", "trustee", "isd", "district meeting", "board meeting", "superintendent"],
  },
  {
    slug: "property-taxes",
    label: "Property Taxes",
    category: "issue",
    description: "Property-tax, appraisal, bond, budget, and local tax records.",
    keywords: ["property tax", "property taxes", "appraisal", "cad", "tax", "bond", "budget", "rate"],
  },
  {
    slug: "water-rights",
    label: "Water Rights",
    category: "issue",
    description: "Water infrastructure, water rights, conservation, and local utility records.",
    keywords: ["water", "water rights", "water infrastructure", "utility", "reservoir", "groundwater", "river"],
  },
  {
    slug: "congress",
    label: "Congress",
    category: "office",
    description: "U.S. House, U.S. Senate, federal votes, committees, and national records.",
    keywords: ["congress", "u.s. house", "us house", "u.s. senate", "us senate", "federal", "bioguide", "roll call"],
  },
  {
    slug: "sheriffs",
    label: "Sheriffs",
    category: "office",
    description: "Sheriffs, public safety offices, jail oversight, and law-enforcement records.",
    keywords: ["sheriff", "sheriffs", "jail", "public safety", "law enforcement", "constable"],
  },
  {
    slug: "judges",
    label: "Judges",
    category: "office",
    description: "Judicial offices, court records, rulings, and court-administration issues.",
    keywords: ["judge", "judges", "judicial", "court", "supreme court", "appeals", "district court"],
  },
  {
    slug: "county-commissioners",
    label: "County Commissioners",
    category: "office",
    description: "County commissioners, county judges, county budgets, and local government votes.",
    keywords: ["county commissioner", "commissioners court", "county judge", "county budget", "county"],
  },
  {
    slug: "campaign-finance",
    label: "Campaign Finance",
    category: "issue",
    description: "Donors, PACs, FEC, state finance filings, spending, and money trails.",
    keywords: ["campaign finance", "funding", "donor", "donors", "pac", "fec", "money", "cash on hand", "raised", "spent"],
  },
  {
    slug: "transparency",
    label: "Transparency",
    category: "workflow",
    description: "Source-backed accountability, score review, red flags, and public proof.",
    keywords: ["transparency", "accountability", "red flag", "red flags", "ethics", "receipts", "source-backed", "source backed"],
  },
  {
    slug: "open-records",
    label: "Open Records",
    category: "workflow",
    description: "Public records requests, FOIA, Texas PIA, source packets, and missing proof.",
    keywords: ["open records", "public records", "foia", "pia", "request", "source", "sources", "source packet", "records"],
  },
  {
    slug: "veterans",
    label: "Veterans",
    category: "issue",
    description: "Veteran policy, service-member records, benefits, and public commitments.",
    keywords: ["veteran", "veterans", "military", "service member", "va", "glo"],
  },
  {
    slug: "education",
    label: "Education",
    category: "issue",
    description: "Education policy, curriculum, trustees, school finance, and student-safety records.",
    keywords: ["education", "schools", "curriculum", "student", "teacher", "parents", "parental", "sboe"],
  },
  {
    slug: "energy",
    label: "Energy",
    category: "issue",
    description: "Energy, oil, gas, grid, utilities, and Texas production records.",
    keywords: ["energy", "oil", "gas", "grid", "pipeline", "railroad commission", "ercot", "production"],
  },
  {
    slug: "immigration",
    label: "Immigration",
    category: "issue",
    description: "Border, immigration, detention, federal-state enforcement, and local impact records.",
    keywords: ["immigration", "border", "migrant", "asylum", "customs", "ice", "border security"],
  },
  {
    slug: "infrastructure",
    label: "Infrastructure",
    category: "issue",
    description: "Roads, bridges, water systems, broadband, capital projects, and public works.",
    keywords: ["infrastructure", "roads", "bridge", "bridges", "transportation", "public works", "broadband", "water"],
  },
  {
    slug: "election-integrity",
    label: "Election Integrity",
    category: "issue",
    description: "Elections, ballots, voting systems, filing records, and election administration.",
    keywords: ["election integrity", "election", "elections", "ballot", "voter", "voting", "polling", "filing", "candidate"],
  },
];

export const INTEREST_TOPIC_BY_SLUG = Object.fromEntries(
  INTEREST_TOPICS.map((topic) => [topic.slug, topic]),
) as Record<InterestSlug, InterestTopic>;

const eventWeights: Record<string, number> = {
  page_view: 1,
  profile_section_viewed: 1,
  profile_view: 4,
  profile_open: 3,
  topic_view: 3,
  issue_view: 3,
  county_view: 3,
  search: 3,
  global_search_started: 2,
  global_search_submitted: 4,
  global_search_result_clicked: 4,
  official_search: 4,
  race_search: 4,
  issue_search: 4,
  county_search: 4,
  filter_used: 2,
  scroll_depth: 0.4,
  time_spent: 0.5,
  button_click: 1.5,
  external_source_click: 4,
  source_trail_opened: 4,
  feedback_vote_clicked: 5,
  useful_vote_clicked: 5,
  needs_source_vote_clicked: 5,
  source_quality_vote_clicked: 5,
  share: 5,
  profile_share_clicked: 6,
  share_snippet_copied: 6,
  native_share_clicked: 6,
  social_share_clicked: 6,
  public_question_copied: 6,
  packet_build: 6,
  packet_builder_started: 5,
  packet_builder_completed: 10,
  download: 4,
  exit: 0.2,
  route_depth: 0.8,
  watch_record: 8,
  profile_watch_clicked: 8,
  watchlist_add: 8,
  submit_source: 7,
  source_submit_started: 7,
  source_submit_completed: 10,
  request_review: 5,
  package_card_viewed: 6,
  package_interest_clicked: 12,
  package_interest_submitted: 12,
  account_prompt_clicked: 15,
};

const routeFallbacks: Array<{ pattern: RegExp; slug: InterestSlug; reason: string }> = [
  { pattern: /^\/elections\/texas(\/|$)/, slug: "texas", reason: "Texas election route" },
  { pattern: /^\/elections(\/|$)/, slug: "election-integrity", reason: "Election route" },
  { pattern: /^\/school-boards(\/|$)/, slug: "school-boards", reason: "School-board route" },
  { pattern: /^\/funding(\/|$)/, slug: "campaign-finance", reason: "Funding route" },
  { pattern: /^\/votes(\/|$)/, slug: "election-integrity", reason: "Vote-record route" },
  { pattern: /^\/officials(\/|$)/, slug: "transparency", reason: "Official profile route" },
  { pattern: /^\/submit-source(\/|$)/, slug: "open-records", reason: "Source submission route" },
  { pattern: /^\/free-packet(\/|$)/, slug: "open-records", reason: "Source packet route" },
  { pattern: /^\/news(\/|$)/, slug: "transparency", reason: "Story route" },
  { pattern: /^\/methodology(\/|$)/, slug: "transparency", reason: "Methodology route" },
];

function normalizeText(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[_-]/g, " ").replace(/\s+/g, " ").trim();
}

function textForInput(input: InterestInferenceInput) {
  const metadataText =
    input.metadata && typeof input.metadata === "object"
      ? Object.values(input.metadata)
          .filter((value): value is string | number | boolean => ["string", "number", "boolean"].includes(typeof value))
          .join(" ")
      : "";

  return normalizeText(
    [
      input.path,
      input.entityType,
      input.entityId,
      input.entityLabel,
      input.topic,
      input.issueId,
      input.county,
      input.searchTerm,
      input.buttonLabel,
      input.buttonHref,
      input.shareChannel,
      input.downloadName,
      input.packetType,
      metadataText,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function eventWeight(input: InterestInferenceInput) {
  let weight = eventWeights[input.eventType] ?? 1;

  if (input.eventType === "time_spent" && input.timeSpentMs) {
    weight += Math.min(4, Math.round(input.timeSpentMs / 30_000));
  }

  if (input.eventType === "scroll_depth" && input.scrollPercent) {
    weight += input.scrollPercent >= 75 ? 1 : 0;
  }

  if (input.sessionDepth && input.sessionDepth >= 4) weight += 0.5;

  return weight;
}

function addSignal(
  signals: Map<InterestSlug, InterestSignal>,
  slug: InterestSlug,
  weight: number,
  reason: string,
) {
  const topic = INTEREST_TOPIC_BY_SLUG[slug];
  const existing = signals.get(slug);
  if (!existing) {
    signals.set(slug, { slug, label: topic.label, weight, reason });
    return;
  }

  existing.weight += weight;
  if (!existing.reason.includes(reason)) existing.reason = `${existing.reason}; ${reason}`;
}

export function inferInterestSignals(input: InterestInferenceInput): InterestSignal[] {
  const text = textForInput(input);
  const baseWeight = eventWeight(input);
  const signals = new Map<InterestSlug, InterestSignal>();

  for (const topic of INTEREST_TOPICS) {
    const hits = topic.keywords.filter((keyword) => text.includes(keyword));
    if (!hits.length) continue;
    addSignal(signals, topic.slug, baseWeight + Math.min(2, hits.length * 0.35), `Matched ${hits.slice(0, 3).join(", ")}`);
  }

  const path = input.path ?? "";
  for (const fallback of routeFallbacks) {
    if (fallback.pattern.test(path)) addSignal(signals, fallback.slug, baseWeight, fallback.reason);
  }

  if (input.county) {
    addSignal(signals, "texas", baseWeight + 0.75, "County context");
    addSignal(signals, "county-commissioners", Math.max(1, baseWeight * 0.75), "County context");
  }

  if (input.entityType === "official_funding") {
    addSignal(signals, "campaign-finance", baseWeight + 1, "Funding entity");
  }

  if (input.entityType === "texas_race") {
    addSignal(signals, "texas", baseWeight + 1, "Texas race entity");
    addSignal(signals, "election-integrity", baseWeight + 1, "Race entity");
  }

  if (!signals.size) {
    if (input.eventType === "packet_build" || input.eventType === "submit_source" || input.eventType === "download") {
      addSignal(signals, "open-records", baseWeight, "Source or records action");
    } else if (input.eventType === "button_click" || input.eventType === "watch_record" || input.eventType === "share" || input.eventType === "request_review") {
      addSignal(signals, "transparency", baseWeight, "Civic action click");
    }
  }

  return Array.from(signals.values())
    .map((signal) => ({ ...signal, weight: Math.round(signal.weight * 100) / 100 }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 8);
}

export function scoreTextAgainstInterestSlugs(text: string, slugs: string[]) {
  const normalized = normalizeText(text);
  let score = 0;

  slugs.forEach((slug, index) => {
    const topic = INTEREST_TOPIC_BY_SLUG[slug as InterestSlug];
    if (!topic) return;
    const rankBoost = Math.max(1, 6 - index);
    if (normalized.includes(topic.label.toLowerCase())) score += rankBoost;
    for (const keyword of topic.keywords) {
      if (normalized.includes(keyword)) score += rankBoost * 0.75;
    }
  });

  return score;
}
