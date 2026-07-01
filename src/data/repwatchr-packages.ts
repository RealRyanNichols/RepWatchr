export type PackageKey =
  | "quick_record_check"
  | "official_record_brief"
  | "local_race_source_pack"
  | "election_watch_desk"
  | "school_board_monitor"
  | "county_monitor"
  | "journalist_desk"
  | "attorney_research_desk"
  | "campaign_finance_tracker"
  | "organization_dashboard"
  | "public_data_api"
  | "bulk_profile_export"
  | "custom_research"
  | "investor_partner";

export type PackageFaq = {
  question: string;
  answer: string;
};

export type FreeToolLink = {
  label: string;
  href: string;
  summary: string;
};

export type RepWatchrPackage = {
  packageKey: PackageKey;
  slug: string;
  name: string;
  eyebrow: string;
  category: "one_time" | "monitoring" | "desk" | "data" | "partner";
  headline: string;
  summary: string;
  problem: string;
  whoFor: string[];
  whatYouGet: string[];
  notIncluded: string[];
  deliverableOutline: string[];
  sourceFirstPromise: string;
  trustBoundaries: string[];
  disclaimer: string;
  expectedTiming: string;
  demandSignal: string;
  ctaLabels: string[];
  relatedTools: FreeToolLink[];
  faqs: PackageFaq[];
  indexable: boolean;
};

export const PACKAGE_URGENCY_OPTIONS = [
  "just exploring",
  "this week",
  "this month",
  "before an election",
  "before a meeting",
  "ongoing monitoring",
] as const;

export const PACKAGE_ORGANIZATION_TYPES = [
  "individual citizen",
  "journalist",
  "attorney/legal team",
  "campaign",
  "civic group",
  "nonprofit",
  "business",
  "investor",
  "researcher",
  "government contractor",
  "other",
] as const;

export const PACKAGE_BUDGET_RANGES = [
  "not sure yet",
  "under $100",
  "$100-$299",
  "$300-$749",
  "$750-$1,499",
  "$1,500+",
  "monthly budget",
] as const;

const commonTrustBoundaries = [
  "Public records and public sources only.",
  "No private investigation claims.",
  "No guaranteed political outcome.",
  "No doxxing, private addresses, minor children, threats, or harassment instructions.",
  "Claims stay labeled as confirmed record, public question, needs source, or under review.",
];

const commonFaqs: PackageFaq[] = [
  {
    question: "Is checkout live?",
    answer:
      "No. RepWatchr is collecting demand before launching paid checkout. The package interest form creates a reviewable demand signal, not a purchase.",
  },
  {
    question: "Does this include legal advice?",
    answer:
      "No. RepWatchr organizes public records, source trails, civic questions, and accountability packets. It does not provide legal advice or substitute for licensed counsel.",
  },
  {
    question: "Can RepWatchr guarantee a result?",
    answer:
      "No. RepWatchr can help organize records and make source gaps visible. It does not promise election outcomes, publication, legal results, or enforcement action.",
  },
];

const standardTools: FreeToolLink[] = [
  {
    label: "Build a Free Source Packet",
    href: "/free-packet",
    summary: "Turn one public source into a clean copyable packet.",
  },
  {
    label: "Submit a Source",
    href: "/submit-source",
    summary: "Send RepWatchr a public link, correction, meeting record, vote, or filing.",
  },
];

export const REPWATCHR_PACKAGES: RepWatchrPackage[] = [
  {
    packageKey: "quick_record_check",
    slug: "quick-record-check",
    name: "Quick Record Check",
    eyebrow: "One record, fast scope",
    category: "one_time",
    headline: "Check one public-record claim before you share it.",
    summary:
      "A narrow source-first review for one official, race, vote, filing, correction, meeting clip, or public question.",
    problem:
      "People find one link or claim and do not know whether it is enough to share, attach to a profile, or turn into a public question.",
    whoFor: ["Individual citizens", "local reporters", "campaign volunteers", "civic groups", "researchers"],
    whatYouGet: [
      "One focused source review",
      "Plain-English summary of what the source appears to show",
      "What the source does not prove",
      "Next three records to pull",
      "Safe share line and public question",
    ],
    notIncluded: [
      "Legal advice",
      "Private investigation work",
      "Guaranteed publication",
      "A full official dossier",
    ],
    deliverableOutline: [
      "Target and jurisdiction",
      "Submitted source",
      "Source label",
      "What is confirmed",
      "What needs another source",
      "Share-safe wording",
    ],
    sourceFirstPromise:
      "If a source does not support the public claim, the output says that plainly and points to the missing record.",
    trustBoundaries: commonTrustBoundaries,
    disclaimer:
      "This package is public-record organization and review, not legal advice, private investigation, or a promise that a claim will be published.",
    expectedTiming: "Beta timing will depend on review load and source complexity.",
    demandSignal: "High-intent if the request has a named official, source URL, deadline, and jurisdiction.",
    ctaLabels: ["I want this", "Request early access", "Ask about this package"],
    relatedTools: standardTools,
    faqs: commonFaqs,
    indexable: true,
  },
  {
    packageKey: "official_record_brief",
    slug: "official-record-brief",
    name: "Official Record Brief",
    eyebrow: "Profile dossier",
    category: "one_time",
    headline: "Build a source-backed brief for one public official.",
    summary:
      "A structured public-record brief covering office, jurisdiction, source trail, votes, funding pointers, public questions, and source gaps.",
    problem:
      "Official profiles can look complete when they still lack source links, vote context, funding references, correction history, or safe public questions.",
    whoFor: ["Voters", "journalists", "civic groups", "research desks", "campaign or public affairs teams"],
    whatYouGet: [
      "Official profile source map",
      "Record summary and source gaps",
      "Voting/funding pointers where public data exists",
      "Correction-safe public questions",
      "Share-ready source packet outline",
    ],
    notIncluded: [
      "Opposition research based on private material",
      "Unverified allegations",
      "Legal conclusions",
      "Guaranteed score changes",
    ],
    deliverableOutline: [
      "Identity and office",
      "Official links",
      "Votes and public records",
      "Money trail pointers",
      "Timeline starters",
      "Public questions",
    ],
    sourceFirstPromise:
      "Every public-facing item is tied to a source label or marked as a missing record/public question.",
    trustBoundaries: commonTrustBoundaries,
    disclaimer:
      "This is a civic intelligence brief. It does not provide legal advice, campaign strategy guarantees, or unsupported claims.",
    expectedTiming: "Beta scope and timing will be confirmed manually before any paid launch.",
    demandSignal: "High-intent if several people request the same official, race, or jurisdiction.",
    ctaLabels: ["Request early access", "Notify me when this launches", "Ask about this package"],
    relatedTools: standardTools,
    faqs: commonFaqs,
    indexable: true,
  },
  {
    packageKey: "local_race_source_pack",
    slug: "local-race-source-pack",
    name: "Local Race Source Pack",
    eyebrow: "Race lane",
    category: "one_time",
    headline: "Turn a local race into a source-backed research lane.",
    summary:
      "A race packet with candidates, official election links, filing links, finance pointers, public questions, and missing-record tasks.",
    problem:
      "Local election information is scattered across county pages, candidate sites, finance portals, meeting videos, and social posts.",
    whoFor: ["County watchers", "local media", "campaign teams", "civic groups", "school-board parents"],
    whatYouGet: [
      "Race source map",
      "Candidate comparison starter",
      "Official election and filing links",
      "Campaign finance source gaps",
      "Voter question builder",
    ],
    notIncluded: [
      "Candidate endorsement",
      "Guaranteed election outcome",
      "Private voter data",
      "Unsourced allegations",
    ],
    deliverableOutline: [
      "Office and election date",
      "Candidates and incumbents",
      "Election authority links",
      "Finance and filing sources",
      "Missing records",
      "Share snippets",
    ],
    sourceFirstPromise:
      "Race packets separate confirmed public links from gaps that still need official records.",
    trustBoundaries: commonTrustBoundaries,
    disclaimer:
      "RepWatchr organizes public election records and source gaps. It does not promise political results or provide legal advice.",
    expectedTiming: "Beta timing depends on race complexity, public data availability, and filing source access.",
    demandSignal: "High-intent if the request names an election date, county, candidates, or meeting deadline.",
    ctaLabels: ["I want this", "Join the beta list", "Ask about this package"],
    relatedTools: [
      ...standardTools,
      {
        label: "Open Texas Elections",
        href: "/elections/texas",
        summary: "Browse current Texas race hubs and source gaps.",
      },
    ],
    faqs: commonFaqs,
    indexable: true,
  },
  {
    packageKey: "election_watch_desk",
    slug: "election-watch-desk",
    name: "Election Watch Desk",
    eyebrow: "Recurring monitoring",
    category: "monitoring",
    headline: "Monitor a race, county, board, or issue lane through election season.",
    summary:
      "A recurring watch desk concept for source queues, filing changes, public questions, profile updates, and share-safe weekly briefs.",
    problem:
      "Election records move fast. One source packet is useful, but campaigns, reporters, and civic groups often need a repeatable monitoring workflow.",
    whoFor: ["Local media", "campaign/public affairs teams", "civic groups", "research teams", "county watchdogs"],
    whatYouGet: [
      "Recurring source queue",
      "Watched officials/races list",
      "Missing-record tracker",
      "Weekly source-safe brief outline",
      "Escalation list for corrections and new filings",
    ],
    notIncluded: [
      "Fake breaking alerts",
      "Private voter targeting",
      "Guaranteed media coverage",
      "Unsourced hit pieces",
    ],
    deliverableOutline: [
      "Watch scope",
      "Latest source changes",
      "New public questions",
      "Missing sources",
      "Profiles needing update",
      "Next monitoring tasks",
    ],
    sourceFirstPromise:
      "The desk tracks source changes and source gaps. It does not turn rumor into public fact.",
    trustBoundaries: commonTrustBoundaries,
    disclaimer:
      "This is a public-record monitoring concept. It is not legal advice, private investigation, or political-result insurance.",
    expectedTiming: "Recurring cadence will be tested manually before public subscriptions open.",
    demandSignal: "High-intent if a request names a recurring jurisdiction, election date, and monitoring cadence.",
    ctaLabels: ["Request early access", "Ask about this package", "Join the beta list"],
    relatedTools: standardTools,
    faqs: commonFaqs,
    indexable: true,
  },
  {
    packageKey: "school_board_monitor",
    slug: "school-board-monitor",
    name: "School Board Monitor",
    eyebrow: "Local meetings",
    category: "monitoring",
    headline: "Track school-board members, meetings, agendas, minutes, and votes.",
    summary:
      "A monitoring package concept for school districts, agenda links, board members, policy votes, public questions, and meeting source gaps.",
    problem:
      "School-board records are often split across agenda portals, meeting videos, minutes, district pages, and candidate pages.",
    whoFor: ["Parents", "local reporters", "civic groups", "school-board candidates", "community researchers"],
    whatYouGet: [
      "District source map",
      "Board member source list",
      "Agenda/minutes/video gap tracker",
      "Meeting question builder",
      "Watchlist and digest scope",
    ],
    notIncluded: [
      "Harassment instructions",
      "Private student or family information",
      "Legal advice",
      "Unsupported claims about staff or minors",
    ],
    deliverableOutline: [
      "District and board links",
      "Current members",
      "Upcoming meetings",
      "Policy and vote records",
      "Missing agenda/minutes/video links",
      "Safe public questions",
    ],
    sourceFirstPromise:
      "School-board monitoring stays on public body records, official pages, meeting documents, and source-safe public questions.",
    trustBoundaries: commonTrustBoundaries,
    disclaimer:
      "RepWatchr does not publish private student, family, or minor information. This is public-record organization only.",
    expectedTiming: "Beta scope will depend on the district, portal quality, and meeting cadence.",
    demandSignal: "High-intent if the same district receives multiple source, watch, or package requests.",
    ctaLabels: ["I want this", "Notify me when this launches", "Ask about this package"],
    relatedTools: [
      ...standardTools,
      {
        label: "Browse School Boards",
        href: "/school-boards",
        summary: "Open school-board records and current source gaps.",
      },
    ],
    faqs: commonFaqs,
    indexable: true,
  },
  {
    packageKey: "county_monitor",
    slug: "county-monitor",
    name: "County Monitor",
    eyebrow: "County watch",
    category: "monitoring",
    headline: "Watch a county's officials, agencies, races, filings, and public questions.",
    summary:
      "A county-level monitoring concept for officials, commissioners, election offices, sheriff/public-safety links, courts, races, and source gaps.",
    problem:
      "County government sits across many offices, public bodies, meeting records, finance portals, and elected positions.",
    whoFor: ["County watchdogs", "local media", "civic groups", "government contractors", "research teams"],
    whatYouGet: [
      "County source map",
      "Official and agency watchlist scope",
      "Race and meeting gaps",
      "Records request starters",
      "Demand report for future monitoring",
    ],
    notIncluded: [
      "Private resident data",
      "Law-enforcement targeting",
      "Guaranteed enforcement action",
      "Legal advice",
    ],
    deliverableOutline: [
      "County offices",
      "Public bodies and agencies",
      "Election/race links",
      "Meeting and source gaps",
      "Public questions",
      "Recommended watchlists",
    ],
    sourceFirstPromise:
      "County monitoring is built from official public pages, public records, filings, and clearly labeled source gaps.",
    trustBoundaries: commonTrustBoundaries,
    disclaimer:
      "This is a public-record monitoring concept and does not include private investigation or legal representation.",
    expectedTiming: "Beta timing depends on county size and available public portals.",
    demandSignal: "High-intent if searches, watchlists, and package requests cluster around one county.",
    ctaLabels: ["Request early access", "Join the beta list", "Ask about this package"],
    relatedTools: standardTools,
    faqs: commonFaqs,
    indexable: true,
  },
  {
    packageKey: "journalist_desk",
    slug: "journalist-desk",
    name: "Journalist Desk",
    eyebrow: "Media workflow",
    category: "desk",
    headline: "Turn scattered public records into reporter-ready source trails.",
    summary:
      "A newsroom-style workflow concept for source trails, timelines, public questions, correction history, and story-ready context.",
    problem:
      "Journalists need fast source organization, but RepWatchr must avoid turning unreviewed claims into public allegations.",
    whoFor: ["Local journalists", "independent media", "newsletter writers", "civic publishers"],
    whatYouGet: [
      "Source packet workspace",
      "Timeline starter",
      "Public question bank",
      "Missing-record list",
      "Correction and safety labels",
    ],
    notIncluded: [
      "Ghostwritten defamatory claims",
      "Private data sales",
      "Pay-for-publication",
      "Legal advice",
    ],
    deliverableOutline: [
      "Story target",
      "Sources reviewed",
      "What records prove",
      "What records do not prove",
      "Questions to ask",
      "Follow-up records",
    ],
    sourceFirstPromise:
      "The journalist desk is built around receipts, source gaps, and cautious public-record language.",
    trustBoundaries: commonTrustBoundaries,
    disclaimer:
      "RepWatchr does not guarantee publication, legal clearance, or editorial outcomes.",
    expectedTiming: "Beta intake will identify newsroom use cases before pricing or checkout opens.",
    demandSignal: "High-intent if the request includes an active story deadline and public records already collected.",
    ctaLabels: ["Ask about this package", "Request early access", "Join the beta list"],
    relatedTools: standardTools,
    faqs: commonFaqs,
    indexable: true,
  },
  {
    packageKey: "attorney_research_desk",
    slug: "attorney-research-desk",
    name: "Attorney Research Desk",
    eyebrow: "Legal team support",
    category: "desk",
    headline: "Organize public records for legal teams without pretending to be counsel.",
    summary:
      "A future support desk for public-record organization, source packets, timelines, document indexes, and record-request workflows.",
    problem:
      "Legal teams and pro se litigants often need organized public records, but RepWatchr must stay outside legal-advice and private-investigation claims.",
    whoFor: ["Attorneys", "legal teams", "public-interest researchers", "pro se support workflows"],
    whatYouGet: [
      "Public source index",
      "Timeline starter",
      "Records request drafts",
      "Document/source gap list",
      "Review status labels",
    ],
    notIncluded: [
      "Legal advice",
      "Attorney-client representation",
      "Private investigation",
      "Court filing guarantees",
    ],
    deliverableOutline: [
      "Matter context",
      "Public bodies involved",
      "Source links",
      "Timeline events",
      "Missing records",
      "Questions for counsel to evaluate",
    ],
    sourceFirstPromise:
      "The desk organizes public material and source gaps. Legal interpretation stays with licensed counsel.",
    trustBoundaries: commonTrustBoundaries,
    disclaimer:
      "RepWatchr is not a law firm and does not provide legal advice. This package is public-record organization and research support.",
    expectedTiming: "Beta scope must be reviewed manually because legal-team use cases can involve sensitive boundaries.",
    demandSignal: "High-intent if a legal team submits a clear public-record scope and sensitivity constraints.",
    ctaLabels: ["Ask about this package", "Request early access", "Notify me when this launches"],
    relatedTools: [
      ...standardTools,
      {
        label: "Draft a Public Records Request",
        href: "/tools/public-records-request",
        summary: "Generate a plain-English request draft for an agency or public body.",
      },
    ],
    faqs: commonFaqs,
    indexable: true,
  },
  {
    packageKey: "public_data_api",
    slug: "public-data-api",
    name: "Public Data API",
    eyebrow: "Future data product",
    category: "data",
    headline: "Explore structured public-record data access before the API opens.",
    summary:
      "A future API concept for non-sensitive public profile, source, race, jurisdiction, and aggregate demand data.",
    problem:
      "Organizations may need structured civic data, but RepWatchr must not sell private user behavior or individual political-interest profiles.",
    whoFor: ["Data teams", "media orgs", "researchers", "civic tech builders", "public affairs teams"],
    whatYouGet: [
      "Future endpoint scope discussion",
      "Data category interest capture",
      "Use-case review",
      "Privacy boundary review",
      "Pilot access list if approved later",
    ],
    notIncluded: [
      "Private user behavior data",
      "Individual political-interest profiles",
      "Raw private submissions",
      "Admin-only review notes",
    ],
    deliverableOutline: [
      "Requested data categories",
      "Jurisdiction scope",
      "Refresh expectation",
      "Privacy limits",
      "Public-source coverage gaps",
      "Future API fit",
    ],
    sourceFirstPromise:
      "Any future data product must be grounded in public records, public pages, and aggregate non-identifying demand signals.",
    trustBoundaries: [
      ...commonTrustBoundaries,
      "Aggregate demand data may inform business decisions, but individual political-interest profiles are not for sale.",
    ],
    disclaimer:
      "This is interest capture for a future public data product. No API access, license, or payment is active by default.",
    expectedTiming: "API scope will not launch until data quality, privacy, access control, and license terms are ready.",
    demandSignal: "High-intent if the request has clear data fields, geography, update cadence, and privacy boundaries.",
    ctaLabels: ["Ask about this package", "Join the beta list", "Notify me when this launches"],
    relatedTools: standardTools,
    faqs: commonFaqs,
    indexable: true,
  },
  {
    packageKey: "organization_dashboard",
    slug: "organization-dashboard",
    name: "Organization Dashboard",
    eyebrow: "Team workspace",
    category: "data",
    headline: "Plan a shared civic intelligence dashboard for a team or organization.",
    summary:
      "A future dashboard concept for team watchlists, source packets, records requests, digest preferences, and monitored jurisdictions.",
    problem:
      "Teams need shared watchlists, source queues, and records tasks without exposing private member behavior or unreviewed claims.",
    whoFor: ["Civic groups", "newsrooms", "research teams", "campaign/public affairs teams", "nonprofits"],
    whatYouGet: [
      "Workspace scope review",
      "Watchlist and jurisdiction needs",
      "Source-review workflow plan",
      "Digest/alert preference scope",
      "Beta access consideration",
    ],
    notIncluded: [
      "Live enterprise checkout",
      "Private political-interest data sales",
      "Guaranteed alerts",
      "Unreviewed public publishing",
    ],
    deliverableOutline: [
      "Organization type",
      "Team roles",
      "Watched entities",
      "Source queue needs",
      "Privacy boundaries",
      "Launch blockers",
    ],
    sourceFirstPromise:
      "Organization workflows stay tied to public records, user consent, and admin-reviewed publication boundaries.",
    trustBoundaries: [
      ...commonTrustBoundaries,
      "Team dashboards must not expose private user watchlists publicly.",
    ],
    disclaimer:
      "This is demand capture for a future dashboard. No paid workspace is active unless enabled later.",
    expectedTiming: "Organization dashboard access will remain gated until roles, privacy, and fulfillment are ready.",
    demandSignal: "High-intent if multiple users from one organization ask for the same workflow or jurisdiction.",
    ctaLabels: ["Request early access", "Ask about this package", "Join the beta list"],
    relatedTools: standardTools,
    faqs: commonFaqs,
    indexable: true,
  },
  {
    packageKey: "campaign_finance_tracker",
    slug: "campaign-finance-tracker",
    name: "Campaign Finance Tracker",
    eyebrow: "Future money trail",
    category: "data",
    headline: "Track public campaign finance records without implying wrongdoing.",
    summary:
      "A future tracker for public campaign finance filings, committees, contributions, expenditures, cycles, and source gaps.",
    problem:
      "Money-trail records are useful, but donations alone do not prove wrongdoing and must be described neutrally.",
    whoFor: ["Researchers", "journalists", "civic groups", "campaign/public affairs teams"],
    whatYouGet: [
      "Finance source scope",
      "Candidate/committee list",
      "Cycle and filing needs",
      "Missing source tracker",
      "Neutral public explanation",
    ],
    notIncluded: ["Corruption claims from donations alone", "Private financial information", "Legal conclusions"],
    deliverableOutline: ["Entities", "Cycles", "Source portals", "Record types", "Gaps", "Questions"],
    sourceFirstPromise:
      "Campaign finance data is shown as public filings, not as guilt-by-association.",
    trustBoundaries: commonTrustBoundaries,
    disclaimer:
      "Public campaign finance records do not imply wrongdoing by themselves.",
    expectedTiming: "Future package only; demand capture first.",
    demandSignal: "High-intent if a request names a candidate, committee, cycle, and source portal.",
    ctaLabels: ["Ask about this package", "Join the beta list"],
    relatedTools: standardTools,
    faqs: commonFaqs,
    indexable: false,
  },
  {
    packageKey: "bulk_profile_export",
    slug: "bulk-profile-export",
    name: "Bulk Profile Export",
    eyebrow: "Future export",
    category: "data",
    headline: "Request future aggregate profile exports with privacy limits.",
    summary:
      "A future export concept for public profile fields, source counts, jurisdictions, and completeness signals.",
    problem:
      "Some users need structured public data, but exports need privacy, licensing, and data-quality controls first.",
    whoFor: ["Researchers", "media orgs", "civic technology teams"],
    whatYouGet: ["Export scope review", "Data-quality notes", "Privacy boundary plan"],
    notIncluded: ["Private submissions", "individual user behavior", "raw admin notes"],
    deliverableOutline: ["Fields", "Coverage", "Jurisdictions", "Update cadence", "Limits"],
    sourceFirstPromise:
      "Only public, source-backed, and privacy-safe fields should be considered for export.",
    trustBoundaries: commonTrustBoundaries,
    disclaimer:
      "No bulk export is available until privacy, licensing, and payment controls are ready.",
    expectedTiming: "Future package only; demand capture first.",
    demandSignal: "High-intent if fields and geography are specific.",
    ctaLabels: ["Ask about this package", "Notify me when this launches"],
    relatedTools: standardTools,
    faqs: commonFaqs,
    indexable: false,
  },
  {
    packageKey: "custom_research",
    slug: "custom-research",
    name: "Custom Research",
    eyebrow: "Manual scope",
    category: "desk",
    headline: "Request a manually scoped public-record research workflow.",
    summary:
      "A future manually scoped package for unusual public-record or civic-intelligence needs.",
    problem:
      "Some requests do not fit a preset package and need review before any offer is made.",
    whoFor: ["Citizens", "journalists", "legal teams", "civic groups", "researchers"],
    whatYouGet: ["Scope review", "Risk boundary review", "Suggested package fit", "Next public records to pull"],
    notIncluded: ["Legal advice", "private investigation", "guaranteed outcome", "unsourced public claims"],
    deliverableOutline: ["Use case", "Jurisdiction", "Sources", "Risks", "Recommended next move"],
    sourceFirstPromise:
      "Custom work still starts with public sources and safe language boundaries.",
    trustBoundaries: commonTrustBoundaries,
    disclaimer:
      "Custom research requests may be declined if the request is unsafe, private, unsupported, or outside RepWatchr boundaries.",
    expectedTiming: "Manual review only.",
    demandSignal: "High-intent if a request is specific, source-backed, and time-bound.",
    ctaLabels: ["Ask about this package", "Request early access"],
    relatedTools: standardTools,
    faqs: commonFaqs,
    indexable: false,
  },
  {
    packageKey: "investor_partner",
    slug: "investor-partner",
    name: "Investor / Partner Interest",
    eyebrow: "Partner pipeline",
    category: "partner",
    headline: "Talk to RepWatchr about civic data, media, or platform partnerships.",
    summary:
      "Interest capture for investors, data partners, media partners, sponsors, and civic organizations.",
    problem:
      "RepWatchr needs structured partner demand without creating a public securities offering or hidden sponsor model.",
    whoFor: ["Investors", "data partners", "media partners", "civic organizations", "sponsors"],
    whatYouGet: ["Interest review", "Use-case fit", "Partner pipeline next step", "Boundary discussion"],
    notIncluded: ["Investment terms", "guaranteed returns", "hidden sponsored content", "securities offering"],
    deliverableOutline: ["Organization", "Interest type", "Jurisdiction", "Use case", "Next conversation"],
    sourceFirstPromise:
      "Partner conversations must respect public-record boundaries, privacy, and clear labeling.",
    trustBoundaries: commonTrustBoundaries,
    disclaimer:
      "This is an interest pathway, not a public securities offering and not an offer of investment terms.",
    expectedTiming: "Manual review only.",
    demandSignal: "High-intent if an organization, focus, and partnership type are clear.",
    ctaLabels: ["Ask about this package", "Request early access"],
    relatedTools: standardTools,
    faqs: commonFaqs,
    indexable: false,
  },
];

export function getRepWatchrPackages(options: { includeHidden?: boolean } = {}) {
  return REPWATCHR_PACKAGES.filter((item) => options.includeHidden || item.indexable);
}

export function getRepWatchrPackageBySlug(slug: string | null | undefined) {
  const cleanSlug = slug?.trim().toLowerCase();
  return REPWATCHR_PACKAGES.find((item) => item.slug === cleanSlug);
}

export function getRepWatchrPackageByKey(packageKey: string | null | undefined) {
  const cleanKey = packageKey?.trim().toLowerCase();
  return REPWATCHR_PACKAGES.find((item) => item.packageKey === cleanKey);
}

export function getRepWatchrPackageOptions() {
  return REPWATCHR_PACKAGES.map((item) => ({
    packageKey: item.packageKey,
    slug: item.slug,
    name: item.name,
    category: item.category,
  }));
}

export function packageRoute(packageItem: Pick<RepWatchrPackage, "slug">) {
  return `/packages/${packageItem.slug}`;
}
