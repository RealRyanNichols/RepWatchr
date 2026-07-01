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
  paymentEnvVar?: string;
  fallbackHref: string;
  featured?: boolean;
};

export type RepWatchrServiceActionOptions = {
  paymentsEnabled?: boolean;
  showExpectedRange?: boolean;
  expectedRange?: string | null;
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
    fallbackHref: "/elections/texas/contribute",
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
    paymentEnvVar: "NEXT_PUBLIC_REPWATCHR_PAYMENT_LINK_QUICK_RECORD_CHECK",
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
    paymentEnvVar: "NEXT_PUBLIC_REPWATCHR_PAYMENT_LINK_LOCAL_RACE_PACK",
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
    paymentEnvVar: "NEXT_PUBLIC_REPWATCHR_PAYMENT_LINK_OFFICIAL_BRIEF",
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
    paymentEnvVar: "NEXT_PUBLIC_REPWATCHR_PAYMENT_LINK_WATCH_DESK",
    fallbackHref: "/services/election-watch-desk",
  },
];

export function getRepWatchrServices() {
  return REPWATCHR_SERVICES;
}

export function getRepWatchrService(slug: string) {
  return REPWATCHR_SERVICES.find((service) => service.slug === slug);
}

export function getRepWatchrServiceBetaHref(service: RepWatchrService) {
  return `/beta-access?package=${encodeURIComponent(service.slug)}`;
}

export function getRepWatchrServicePaymentHref(
  service: RepWatchrService,
  options: RepWatchrServiceActionOptions = {},
) {
  if (service.priceCents === 0) return service.fallbackHref;
  if (!options.paymentsEnabled) return getRepWatchrServiceBetaHref(service);
  const paymentLink = service.paymentEnvVar ? process.env[service.paymentEnvVar] : undefined;
  return paymentLink || getRepWatchrServiceBetaHref(service);
}

export function getRepWatchrServiceCtaLabel(
  service: RepWatchrService,
  options: RepWatchrServiceActionOptions = {},
) {
  if (service.priceCents === 0) return service.ctaLabel;
  return options.paymentsEnabled ? service.ctaLabel : "Request Beta Access";
}

export function getRepWatchrServicePriceLabel(
  service: RepWatchrService,
  options: RepWatchrServiceActionOptions = {},
) {
  if (service.priceCents === 0 || options.paymentsEnabled) return service.priceLabel;
  if (options.showExpectedRange && options.expectedRange) return options.expectedRange;
  return "Beta access";
}
