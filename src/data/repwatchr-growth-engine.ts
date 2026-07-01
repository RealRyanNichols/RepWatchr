export type GrowthEngineStep = {
  id: string;
  name: string;
  eyebrow: string;
  summary: string;
  mechanism: string;
  output: string;
  guardrail: string;
};

export type PredictionSignal = {
  name: string;
  input: string;
  forecast: string;
  confidence: string;
  sourceGap: string;
  resolutionRule: string;
};

export type StoryOpportunityLane = {
  name: string;
  trigger: string;
  output: string;
  visual: string;
  reviewRule: string;
};

export type GrowthRevenueLane = {
  name: string;
  buyer: string;
  signal: string;
  product: string;
  privacyRule: string;
};

export const GROWTH_ENGINE_STEPS: GrowthEngineStep[] = [
  {
    id: "question-intake",
    name: "Question Intake",
    eyebrow: "Ask the record",
    summary:
      "Collect questions from voters, campaigns, reporters, watchdogs, and officials without letting private details or unsourced accusations publish directly.",
    mechanism:
      "Every question captures target, geography, source URL, public/private flag, prediction prompt, story angle, and consent.",
    output: "A reviewable intake row that can become a source task, public question, story lead, or forecast.",
    guardrail:
      "Questions are leads until a public source or official record supports them.",
  },
  {
    id: "source-reader",
    name: "Data Reader",
    eyebrow: "Read the receipt",
    summary:
      "Turn public records, roll calls, filings, school-board packets, wire items, and user submissions into structured entities.",
    mechanism:
      "Normalize officials, votes, races, funders, agencies, dates, jurisdictions, source URLs, confidence, and missing-proof notes.",
    output: "Profile updates, source trails, issue tags, data-quality flags, and searchable datasets.",
    guardrail:
      "AI may summarize and tag records, but the source URL and reviewer status stay attached.",
  },
  {
    id: "prediction-desk",
    name: "Prediction Desk",
    eyebrow: "Forecast, not fact",
    summary:
      "Create prediction cards from voting trends, funding signals, source volume, constituent feedback, and race context.",
    mechanism:
      "Forecasts show confidence, sample size, source gaps, change history, and a public resolution rule.",
    output: "Forecasts for race competitiveness, pressure risk, issue salience, watchlist growth, and story likelihood.",
    guardrail:
      "A forecast is never a finding of wrongdoing. It resolves only when a public record confirms the outcome.",
  },
  {
    id: "story-desk",
    name: "Story and Blog Queue",
    eyebrow: "Publish the receipt",
    summary:
      "Promote high-signal questions, new records, funding movement, vote reactions, and profile changes into reviewed blog/story drafts.",
    mechanism:
      "Each story opportunity stores hook, source list, officials, missing proof, image prompt, share line, and legal-safety label.",
    output: "Draft article, OG image brief, X/Facebook snippet, source packet, and next public question.",
    guardrail:
      "No story publishes as authoritative until source-backed, reviewed, and safe enough for a hostile read.",
  },
  {
    id: "visual-engine",
    name: "Graphic and OG Queue",
    eyebrow: "Make it visible",
    summary:
      "Generate unique thumbnails, OG previews, profile visuals, charts, maps, and score/funding graphics for every important page.",
    mechanism:
      "Queue image briefs from page type, title, jurisdiction, score/source count, brand palette, and visual safety rules.",
    output: "Distinct homepage, race, school-board, official, vote, funding, red-flag, story, and service previews.",
    guardrail:
      "Visuals should not imply guilt, private surveillance, or proof stronger than the attached record supports.",
  },
  {
    id: "revenue-router",
    name: "Revenue Router",
    eyebrow: "Monetize usefully",
    summary:
      "Route demand into paid services, data licenses, verified panels, profile claims, source packets, and research-desk offers.",
    mechanism:
      "Use behavior and consent-aware intent signals to present the right offer without fake urgency or deceptive ads.",
    output: "Qualified service requests, data-product leads, paid reports, memberships, and aggregate datasets.",
    guardrail:
      "Sell source organization and aggregate intelligence. Do not sell raw identity documents or private voter dossiers.",
  },
  {
    id: "admin-review",
    name: "Admin Review",
    eyebrow: "Human gate",
    summary:
      "Give operators one queue for questions, source submissions, forecasts, stories, graphics, broken links, and data-quality issues.",
    mechanism:
      "Statuses, reviewer notes, attach-to-profile/race/story actions, rejection reasons, and audit events keep the system maintainable.",
    output: "Approved public records, quarantined weak leads, fixed profiles, and safer content loops.",
    guardrail:
      "Admin review is the line between public records work and noisy political rumor.",
  },
];

export const PREDICTION_SIGNALS: PredictionSignal[] = [
  {
    name: "Race pressure forecast",
    input: "source volume, incumbent status, fundraising, local issue spikes, watchlist saves, and candidate comparison gaps",
    forecast: "Low, medium, high, or severe pressure risk for a race or officeholder.",
    confidence: "Requires source count, recent update date, and sample-size note.",
    sourceGap: "Missing official filing, finance link, candidate site, or current voter guide.",
    resolutionRule: "Resolve after filing deadline, primary result, runoff result, or general-election result is public.",
  },
  {
    name: "Issue salience forecast",
    input: "vote reactions, source submissions, search terms, meeting clips, school-board packets, and share snippets copied",
    forecast: "Which issues are becoming public-pressure drivers in a county, district, or state.",
    confidence: "Shows constituent split, out-of-district split, and total verified responses.",
    sourceGap: "Missing source packet, official vote link, agenda, minutes, or meeting video.",
    resolutionRule: "Resolve when the issue appears on an agenda, ballot, roll call, public statement, or local coverage.",
  },
  {
    name: "Profile completion forecast",
    input: "missing photo, vote rows, funding file, source links, social links, correction status, and red-flag review status",
    forecast: "Which profiles are likely to become traffic or revenue drivers once completed.",
    confidence: "Higher when the profile has multiple source classes and recent user activity.",
    sourceGap: "Missing portrait, campaign-finance summary, official contact link, or current office data.",
    resolutionRule: "Resolve when profile reaches the configured completeness threshold and receives public traffic.",
  },
  {
    name: "Story likelihood forecast",
    input: "wire quality score, duplicate score, person match, source tier, local relevance, and public questions",
    forecast: "Whether an item should stay in review, become a story, attach to a profile, or be quarantined.",
    confidence: "Requires source tier, jurisdiction match, and duplicate check.",
    sourceGap: "Missing named source, official record, local tie, or publish date.",
    resolutionRule: "Resolve when an editor promotes, rejects, attaches, or quarantines the item.",
  },
];

export const STORY_OPPORTUNITY_LANES: StoryOpportunityLane[] = [
  {
    name: "Daily Watch to story",
    trigger: "High-quality wire item with official/person match and confirmed local or national relevance.",
    output: "Short source-backed article with officials, source links, share line, and next public question.",
    visual: "Unique OG card with page type, title, jurisdiction, source count, and RepWatchr brand line.",
    reviewRule: "Must be accepted or promoted by admin before it reads like RepWatchr editorial judgment.",
  },
  {
    name: "Profile gap to blog",
    trigger: "A high-traffic official profile is missing votes, funding, photo, source links, or public questions.",
    output: "Buildout note that asks for missing sources and offers a paid Official Record Brief.",
    visual: "Profile thumbnail with source-count meter and missing-record label.",
    reviewRule: "Do not imply misconduct because a profile is incomplete.",
  },
  {
    name: "Funding movement to explainer",
    trigger: "New finance source, unusual donor concentration, outside money split, or missing finance records.",
    output: "Funding trail explainer with donor categories, geography, cash on hand, spend, and public source links.",
    visual: "Donut chart, bar chart, and safe funding-trail OG image.",
    reviewRule: "Explain relevance carefully. Donor support is not proof of corruption by itself.",
  },
  {
    name: "Vote reaction to question bank",
    trigger: "A roll call has high reaction volume, high importance, or a strong constituent/outside split.",
    output: "Copyable public questions for meetings, reporters, and candidate forums.",
    visual: "Vote card with bill title, source link, impact tag, and confidence label.",
    reviewRule: "Public reaction is opinion data unless paired with the official vote record.",
  },
];

export const GROWTH_REVENUE_LANES: GrowthRevenueLane[] = [
  {
    name: "Paid source packets",
    buyer: "Citizens, watchdogs, reporters, candidates, and local groups",
    signal: "A user has a question, source URL, and target but needs the record organized.",
    product: "Quick Record Check, Local Race Source Pack, Official Record Brief",
    privacyRule: "Deliver source organization, not legal advice or private investigation claims.",
  },
  {
    name: "Verified panels",
    buyer: "Campaigns, PACs, advocacy groups, media, and researchers",
    signal: "Constituent-tagged vote-again intent, issue intensity, action intent, and trust scores.",
    product: "Aggregate dashboards and recurring district pulse reports",
    privacyRule: "Use aggregate, de-identified, consent-aware reporting with sample sizes.",
  },
  {
    name: "Data licensing",
    buyer: "Political data buyers, researchers, consultants, and civic platforms",
    signal: "Official profiles, vote metadata, funding summaries, source trails, profile completeness, and issue tags.",
    product: "CSV/API exports, custom slices, and district/race datasets",
    privacyRule: "No private home addresses, raw identity documents, minor-child data, or doxxing material.",
  },
  {
    name: "Claimed profiles",
    buyer: "Officials, campaigns, authorized staff, and public offices",
    signal: "Profile traffic, correction requests, missing media, and public questions.",
    product: "Profile claim workflow, response desk, approved media, and paid briefs",
    privacyRule: "Claimants can respond and add sources, not erase public records or correction history.",
  },
];

export const GROWTH_ENGINE_GUARDRAILS = [
  "Predictions are labeled forecasts with confidence, source gaps, and resolution rules.",
  "AI can draft, tag, summarize, and propose graphics, but admin review controls public authority.",
  "Question intake must reject private addresses, minor-child data, threats, doxxing, and unsourced criminal accusations.",
  "Commercial data reports must use aggregate, de-identified, consent-aware reporting by default.",
  "Every story, forecast, visual, and share snippet should point back to public sources or clearly say what is missing.",
  "No fake urgency, fake scarcity, fake notifications, or fake activity loops.",
];

export function getGrowthEngineSteps() {
  return GROWTH_ENGINE_STEPS;
}

export function getPredictionSignals() {
  return PREDICTION_SIGNALS;
}

export function getStoryOpportunityLanes() {
  return STORY_OPPORTUNITY_LANES;
}

export function getGrowthRevenueLanes() {
  return GROWTH_REVENUE_LANES;
}
