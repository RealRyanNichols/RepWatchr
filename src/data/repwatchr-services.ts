export type RepWatchrService = {
  slug: string;
  name: string;
  eyebrow: string;
  priceLabel: string;
  priceCents: number;
  billingLabel: string;
  summary: string;
  bestFor: string;
  turnaround: string;
  deliverables: string[];
  inputs: string[];
  ctaLabel: string;
  fallbackHref: string;
  featured?: boolean;
};

export type RepWatchrServiceLanding = {
  headline: string;
  whoItIsFor: string[];
  whatYouGet: string[];
  whatYouDoNotGet: string[];
  expectation: string;
  sampleOutline: string[];
  sourceFirstGuarantee: string;
  safetyLanguage: string;
  faq: Array<{ question: string; answer: string }>;
  crossSell: Array<{ label: string; href: string; note: string }>;
};

export const REPWATCHR_SERVICES: RepWatchrService[] = [
  {
    slug: "free-source-packet",
    name: "Free Source Packet",
    eyebrow: "Free",
    priceLabel: "$0",
    priceCents: 0,
    billingLabel: "self-serve",
    summary:
      "Build a clean source packet for a race, official, school board, correction, meeting clip, public filing, or missing record.",
    bestFor: "Voters, parents, local watchers, and readers who already have a public source link.",
    turnaround: "Immediate",
    deliverables: [
      "Copyable source packet",
      "Downloadable text packet",
      "Race or issue context",
      "Review guardrail language",
    ],
    inputs: ["Public source URL", "Target official, race, or board", "Short summary", "County or city when relevant"],
    ctaLabel: "Build Free Packet",
    fallbackHref: "/free-packet",
    featured: true,
  },
  {
    slug: "quick-record-check",
    name: "Quick Record Check",
    eyebrow: "Starter",
    priceLabel: "$49",
    priceCents: 4900,
    billingLabel: "one-time",
    summary:
      "A narrow source check on one official, race claim, school-board issue, vote, filing, or correction request.",
    bestFor: "A single source question that needs a fast yes/no/needs-more-records answer.",
    turnaround: "1-2 business days",
    deliverables: [
      "Short review note",
      "Source status label",
      "Next three records to pull",
      "Safe public wording draft",
    ],
    inputs: ["Public source URL", "Claim or correction to check", "Jurisdiction", "Deadline if any"],
    ctaLabel: "Request Record Check",
    fallbackHref: "/services/quick-record-check",
  },
  {
    slug: "local-race-source-pack",
    name: "Local Race Source Pack",
    eyebrow: "East Texas",
    priceLabel: "$149",
    priceCents: 14900,
    billingLabel: "one-time",
    summary:
      "A source-backed packet for one Texas or East Texas race lane: candidates, official election links, filings, public meeting records, issue links, and share-ready snippets.",
    bestFor: "County races, school boards, Texas House/Senate districts, and East Texas congressional race pages.",
    turnaround: "2-4 business days",
    deliverables: [
      "Race source map",
      "Candidate and office links",
      "Public filing checklist",
      "Share-ready article outline",
      "Missing-record list",
    ],
    inputs: ["Race or office", "County/city/district", "Known candidate links", "Any source links already collected"],
    ctaLabel: "Request Race Pack",
    fallbackHref: "/services/local-race-source-pack",
    featured: true,
  },
  {
    slug: "official-record-brief",
    name: "Official Record Brief",
    eyebrow: "Profile",
    priceLabel: "$299",
    priceCents: 29900,
    billingLabel: "one-time",
    summary:
      "A focused public-record brief for one elected official or public authority figure: position, jurisdiction, source links, votes, public claims, money, and open questions.",
    bestFor: "A voter, campaign, reporter, researcher, or local group that needs a clean record page before sharing.",
    turnaround: "3-5 business days",
    deliverables: [
      "Official record outline",
      "Source packet",
      "Vote and funding pointers where available",
      "Public questions list",
      "RepWatchr-ready article brief",
    ],
    inputs: ["Official name", "Office and district", "Known source links", "Primary issue or claim"],
    ctaLabel: "Request Official Brief",
    fallbackHref: "/services/official-record-brief",
  },
  {
    slug: "election-watch-desk",
    name: "Election Watch Desk",
    eyebrow: "Monthly",
    priceLabel: "$750",
    priceCents: 75000,
    billingLabel: "monthly",
    summary:
      "A recurring source-watch desk for a local race, county, district, school board, or issue lane during election season.",
    bestFor: "Groups or campaigns that need a steady source queue, article outlines, source-safe share snippets, and missing-record tracking.",
    turnaround: "Weekly packet cadence",
    deliverables: [
      "Weekly source queue",
      "Four article briefs per month",
      "Share-ready snippets",
      "Missing-record tracker",
      "Monthly race-page update plan",
    ],
    inputs: ["Race or issue lane", "Geography", "Known source sites", "Priority officials or offices"],
    ctaLabel: "Request Watch Desk",
    fallbackHref: "/services/election-watch-desk",
  },
];

export function getRepWatchrServices() {
  return REPWATCHR_SERVICES;
}

export function getRepWatchrService(slug: string) {
  return REPWATCHR_SERVICES.find((service) => service.slug === slug);
}

export function getPaidRepWatchrServices() {
  return REPWATCHR_SERVICES.filter((service) => service.priceCents > 0);
}

export function getRepWatchrServiceLanding(slug: string): RepWatchrServiceLanding {
  const content: Record<string, RepWatchrServiceLanding> = {
    "quick-record-check": {
      headline: "Get one public-record question checked before you share it.",
      whoItIsFor: [
        "A voter, parent, reporter, campaign helper, or local watchdog with one public source link.",
        "Someone trying to confirm whether a claim, correction, vote, meeting item, filing, or donor record needs more source review.",
        "People who need a fast source-status note, not a giant research project.",
      ],
      whatYouGet: [
        "A narrow review of the source you send.",
        "A source status label: confirmed record, public question, missing source, or correction needed.",
        "The next three records to pull if the proof is incomplete.",
        "A safe public wording draft you can use without overstating the record.",
      ],
      whatYouDoNotGet: [
        "Legal advice, legal representation, or campaign strategy.",
        "Private investigation, law enforcement work, surveillance, doxxing, or private-address research.",
        "A guaranteed finding, takedown, endorsement, election result, or publication.",
      ],
      expectation: "Typical turnaround is 1-2 business days after RepWatchr has the source link, target, jurisdiction, and exact question.",
      sampleOutline: [
        "Question being checked",
        "Source reviewed",
        "What the record confirms",
        "What the record does not prove",
        "Next records to pull",
        "Safe share wording",
      ],
      sourceFirstGuarantee:
        "If RepWatchr cannot tie the claim to a public source, the packet will say so plainly instead of dressing up a weak claim.",
      safetyLanguage:
        "This is public-record research and source organization. It is not legal advice, private investigation, law enforcement work, harassment, doxxing, or guaranteed political impact.",
      faq: [
        {
          question: "Can I send a screenshot?",
          answer: "You can include it as context, but the review is strongest when there is a public URL, official record, filing, agenda, minutes, video, or publication link.",
        },
        {
          question: "Will RepWatchr publish my claim?",
          answer: "No promise. The output is a source-status packet. Public use depends on whether the record is strong, sourced, relevant, and safe.",
        },
        {
          question: "What happens if the record is weak?",
          answer: "You get a missing-source or public-question label and the next records to pull before anyone states more than the proof supports.",
        },
      ],
      crossSell: [
        { label: "Build a free packet first", href: "/free-packet", note: "Use the free tool if you want to organize the source yourself." },
        { label: "Upgrade to Official Record Brief", href: "/services/official-record-brief", note: "Use when one check turns into a full official profile review." },
      ],
    },
    "local-race-source-pack": {
      headline: "Turn a local race into a source-backed voter packet.",
      whoItIsFor: [
        "County, city, school-board, Texas House, Texas Senate, and East Texas race watchers.",
        "Citizens or local groups who need official election links, filings, candidates, public meetings, and missing records in one place.",
        "People preparing share snippets, voter questions, or a RepWatchr race page.",
      ],
      whatYouGet: [
        "Race source map with official election links.",
        "Candidate and campaign website links where available.",
        "Filing, finance, meeting, and school-board/bond links where relevant.",
        "Missing-record list and voter question builder.",
        "Share-ready snippets that do not overstate the proof.",
      ],
      whatYouDoNotGet: [
        "Opposition research using private records or confidential data.",
        "Campaign consulting, persuasion strategy, polling, or guaranteed election results.",
        "Legal advice, private investigation, or unsourced allegations.",
      ],
      expectation: "Typical turnaround is 2-4 business days once the race, jurisdiction, known candidates, and source links are supplied.",
      sampleOutline: [
        "Race and office overview",
        "Official election source links",
        "Candidate source table",
        "Finance and filing source map",
        "Missing records",
        "Public questions voters can ask",
        "Share snippets",
      ],
      sourceFirstGuarantee:
        "The packet separates confirmed records from missing records and public questions. Unsupported claims stay out of the deliverable.",
      safetyLanguage:
        "RepWatchr organizes public election records. It does not impersonate campaigns, promise outcomes, scrape private data, or publish unsupported claims.",
      faq: [
        {
          question: "Can this cover school-board races?",
          answer: "Yes. School boards, bonds, local races, county offices, and Texas district races are the main use case.",
        },
        {
          question: "Will you compare candidates?",
          answer: "The packet can compare public sources, filings, offices, and records. It will not invent conclusions where the source record is incomplete.",
        },
        {
          question: "Can this become a RepWatchr race page?",
          answer: "Yes, when the records are public, source-backed, and safe enough for a hostile read.",
        },
      ],
      crossSell: [
        { label: "Start with the free packet", href: "/free-packet", note: "Send one source into the race lane first." },
        { label: "Move to Election Watch Desk", href: "/services/election-watch-desk", note: "Use when the race needs recurring weekly monitoring." },
      ],
    },
    "official-record-brief": {
      headline: "Build a serious public-record brief on one official.",
      whoItIsFor: [
        "Voters, reporters, researchers, campaigns, and local groups reviewing one official or authority figure.",
        "People who need votes, funding, official links, public statements, source gaps, and voter questions organized.",
        "Anyone preparing an accountability dossier that needs to survive a hostile read.",
      ],
      whatYouGet: [
        "Plain-English official record summary.",
        "Source trail with official links, vote links, funding links, public statements, and correction gaps where available.",
        "Public questions and missing records to pull next.",
        "RepWatchr-ready brief outline with careful source labels.",
      ],
      whatYouDoNotGet: [
        "A legal finding, ethics complaint, private investigation, or guaranteed public grade.",
        "Private addresses, minor children, confidential records, or nonpublic personal data.",
        "A hit piece, endorsement, campaign plan, or unsourced allegation package.",
      ],
      expectation: "Typical turnaround is 3-5 business days after the official, office, jurisdiction, issue, and source links are supplied.",
      sampleOutline: [
        "Official identity and jurisdiction",
        "Confirmed public record summary",
        "Vote/source trail",
        "Funding/source trail",
        "Red flags or public questions, if source-backed",
        "Missing records and corrections",
        "Share-safe summary",
      ],
      sourceFirstGuarantee:
        "Every strong statement must point back to a public source. If the evidence is thin, the brief says the evidence is thin.",
      safetyLanguage:
        "This is source organization and public accountability research, not legal advice, private investigation, law enforcement work, defamation support, or harassment.",
      faq: [
        {
          question: "Can you grade the official?",
          answer: "The brief can identify score inputs and source gaps. A public grade should only follow a documented rubric and enough source coverage.",
        },
        {
          question: "Can I request a correction?",
          answer: "Yes. The same structure can be used to show exactly what needs correcting and what source supports the correction.",
        },
        {
          question: "Do you use private data?",
          answer: "No. The product is built around public records, official sources, named publications, and source links people can inspect.",
        },
      ],
      crossSell: [
        { label: "Check one record first", href: "/services/quick-record-check", note: "Use Quick Record Check if the issue is narrow." },
        { label: "Track the race monthly", href: "/services/election-watch-desk", note: "Use the desk when one official is part of a live race or issue lane." },
      ],
    },
    "election-watch-desk": {
      headline: "Keep a race, board, county, or issue lane watched every week.",
      whoItIsFor: [
        "Local groups, campaigns, researchers, and civic media teams that need recurring source review.",
        "Election-season races where filings, meetings, donor records, articles, and public claims keep moving.",
        "People who want a steady source queue and safe share material without turning every rumor into a post.",
      ],
      whatYouGet: [
        "Weekly source queue and missing-record tracker.",
        "Recurring race/source monitoring cadence.",
        "Four article or brief outlines per month.",
        "Share snippets and voter questions tied to public sources.",
        "Monthly race-page update plan.",
      ],
      whatYouDoNotGet: [
        "Campaign management, polling, persuasion, legal advice, or guaranteed political outcomes.",
        "Opposition research built from private records, confidential lists, or doxxing.",
        "Unreviewed rumor publishing or claims that outrun the record.",
      ],
      expectation: "Monthly desk. RepWatchr sets a weekly packet cadence once the lane, geography, source sites, and priority offices are defined.",
      sampleOutline: [
        "Weekly source queue",
        "New public records found",
        "Items needing review",
        "Attach/promote recommendations",
        "Missing-record tracker",
        "Share snippets and voter questions",
        "Next week source pull",
      ],
      sourceFirstGuarantee:
        "The desk keeps the hook moving, but the receipt stays attached. No noisy wire item becomes authoritative until source review supports it.",
      safetyLanguage:
        "Election Watch Desk is public-record monitoring and source organization. It is not legal advice, campaign consulting, law enforcement, or guaranteed election impact.",
      faq: [
        {
          question: "Is this a subscription?",
          answer: "Yes. It is a monthly desk for one defined lane, race, board, county, district, or issue area.",
        },
        {
          question: "Can this include Daily Watch items?",
          answer: "Yes, but noisy wire results stay in review until a public source and local/national relevance are confirmed.",
        },
        {
          question: "Can you support multiple races?",
          answer: "Yes, but each added lane needs a defined scope so the source queue stays usable and accurate.",
        },
      ],
      crossSell: [
        { label: "Start with a Local Race Pack", href: "/services/local-race-source-pack", note: "Use the one-time pack before committing to a monthly desk." },
        { label: "Submit a free packet", href: "/free-packet", note: "Send the first public source into the lane now." },
      ],
    },
  };

  return content[slug] ?? {
    headline: "Build the record before you share the claim.",
    whoItIsFor: ["People with a public source link and a specific record question."],
    whatYouGet: ["Source packet", "Copyable summary", "Next records to pull"],
    whatYouDoNotGet: ["Legal advice", "Private investigation", "Guaranteed outcomes"],
    expectation: "Self-serve tools are immediate. Paid review depends on scope.",
    sampleOutline: ["Target", "Source", "Summary", "Missing records", "Safe wording"],
    sourceFirstGuarantee: "If the source does not support the claim, the packet says so.",
    safetyLanguage: "Public records first. No private addresses, minor children, threats, doxxing, or unsourced allegations.",
    faq: [{ question: "Is this legal advice?", answer: "No. RepWatchr is a public-record research and source organization tool." }],
    crossSell: [{ label: "Request Quick Record Check", href: "/services/quick-record-check", note: "Use paid review when the source needs a second set of eyes." }],
  };
}
